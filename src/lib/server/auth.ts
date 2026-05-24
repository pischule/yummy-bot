import { type Cookies, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';
import { Duration } from '@js-joda/core';
import { decrypt, encrypt } from '$lib/server/encryption';

const { BOT_TOKEN, COOKIE_ENCRYPTION_KEY } = env;

const tgUrlAuthTtlMilli = Duration.ofSeconds(60).toMillis();
const cookieTtlMilli = Duration.ofHours(18).toMillis();
const cookieName = 'session';

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

function serializeSession(session: Session): string {
	const json = JSON.stringify(session);
	return encrypt(json, COOKIE_ENCRYPTION_KEY!);
}

function deserializeSession(ciphertext: string): Session | null {
	try {
		const json = decrypt(ciphertext, COOKIE_ENCRYPTION_KEY!);
		if (json == null) return null;
		return JSON.parse(json) as Session;
	} catch (e) {
		logger.warn('Session deserialization failed');
		return null;
	}
}

async function getSessionFromUrl(
	roles: Role[],
	searchParams: URLSearchParams | undefined
): Promise<Session | null> {
	if (searchParams == null) return null;
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

	const id = +searchParams.get('id')!;

	const authDateRaw = searchParams.get('auth_date');
	if (authDateRaw == null) return null;
	const authDate: number = +authDateRaw * 1000;
	const nowDate: number = Date.now();
	if (nowDate - authDate > tgUrlAuthTtlMilli) {
		logger.warn({ userId: id }, 'Stale tg auth');
		return null;
	}

	return {
		tgId: id,
		roles,
		authDate: Date.now()
	};
}

function getSessionFromCookie(cookies: Cookies): Session | null {
	const cookie = cookies.get(cookieName);
	if (cookie == null) return null;

	let session = deserializeSession(cookie);
	if (session == null) {
		return null;
	}

	if (session.authDate == null) return null;
	const authDate = +session.authDate;
	const now = Date.now();
	if (authDate + cookieTtlMilli < now) {
		return null;
	}

	if (session.tgId == null) return null;
	return session;
}

function storeSessionToCookie(session: Session, cookies: Cookies, path: string) {
	cookies.set(cookieName, serializeSession(session), {
		expires: new Date(session.authDate + cookieTtlMilli),
		path,
		httpOnly: true,
		secure: true,
		sameSite: 'lax'
	});
}

export async function authenticateUser(cookies: Cookies, searchParams?: URLSearchParams) {
	const urlSession = await getSessionFromUrl(['user'], searchParams);
	if (urlSession != null) {
		storeSessionToCookie(urlSession, cookies, '/order');
		return urlSession;
	} else {
		return getSessionFromCookie(cookies);
	}
}

export async function authenticateAdmin(cookies: Cookies, searchParams?: URLSearchParams) {
	let session = await getSessionFromUrl(['admin'], searchParams);
	if (session != null) {
		storeSessionToCookie(session, cookies, '/_/edit');
	} else {
		session = getSessionFromCookie(cookies);
	}

	if (session == null || !session.roles.includes('admin')) {
		throw error(401, 'Unauthorized');
	}
}
