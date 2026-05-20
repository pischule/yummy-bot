import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';

const { BOT_TOKEN, SECRET } = env;
const TG_AUTH_TTL_SECONDS = 24 * 60 * 60;

export function checkAdminAuth(params: { secret: string }) {
	if (params.secret !== SECRET) throw error(404, 'Not Found');
}

const createHmac = async (secret: ArrayBuffer, data: ArrayBuffer) => {
	const algorithm = { name: 'HMAC', hash: 'SHA-256' };
	const key = await crypto.subtle.importKey('raw', secret, algorithm, false, ['sign']);
	return await crypto.subtle.sign(algorithm.name, key, data);
};

const createHash = async (data: ArrayBuffer) => {
	return await crypto.subtle.digest('SHA-256', data);
};

const hex = (data: ArrayBuffer) => {
	return Array.prototype.map
		.call(new Uint8Array(data), (x) => x.toString(16).padStart(2, '0'))
		.join('');
};

const isLinkSignatureValid = async (hash: string, data: string) => {
	const enc = new TextEncoder();
	const secretKey = await createHash(enc.encode(BOT_TOKEN).buffer);
	const digest = await createHmac(secretKey, enc.encode(data).buffer);
	return hash === hex(digest);
};

export const checkClientAuth = async (searchParams: URLSearchParams) => {
	if (!searchParams) return null;
	const hash = searchParams.get('hash');
	if (!hash) return null;

	const dataCheckString = [...searchParams.keys()]
		.filter((key) => key !== 'hash')
		.sort()
		.map((key) => `${key}=${searchParams.get(key)}`)
		.join('\n');

	if (!(await isLinkSignatureValid(hash, dataCheckString))) {
		return null;
	}

	const id = searchParams.get('id')!;

	const authDate: number = +searchParams.get('auth_date')!;
	const nowDate: number = new Date().getTime() / 1000;
	if (nowDate - authDate > TG_AUTH_TTL_SECONDS) {
		logger.warn({ userId: id }, 'Stale tg auth');
		return null;
	}

	return { id };
};
