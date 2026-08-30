import { type Cookies, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';
import { decrypt, encrypt } from '$lib/server/encryption';
import { nextMidnight } from '$lib/server/utils';

const { BOT_TOKEN, COOKIE_ENCRYPTION_KEY } = env;

const tgUrlAuthTtlMilli = 60_000;
const cookieName = 'session';

const enc = new TextEncoder();

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

// Login widget: secret = SHA256(BOT_TOKEN)
const isLinkSignatureValid = async (hash: string, data: string) => {
	const secretKey = await createHash(enc.encode(BOT_TOKEN).buffer);
	const digest = await createHmac(secretKey, enc.encode(data).buffer);
	return hash === hex(digest);
};

// Miniapp initData: secret = HMAC_SHA256(key="WebAppData", data=BOT_TOKEN)
const isWebAppSignatureValid = async (hash: string, data: string) => {
	const secretKey = await createHmac(enc.encode('WebAppData').buffer, enc.encode(BOT_TOKEN).buffer);
	const digest = await createHmac(secretKey, enc.encode(data).buffer);
	return hash === hex(digest);
};

function buildDataCheckString(params: URLSearchParams): string | null {
	if (params.get('hash') == null) return null;
	return [...params.keys()]
		.filter((key) => key !== 'hash')
		.sort()
		.map((key) => `${key}=${params.get(key)}`)
		.join('\n');
}

export function isAuthDateStale(authDateRaw: string | null): boolean {
	if (authDateRaw == null) return false;
	const authDate = +authDateRaw * 1000;
	return Date.now() - authDate > tgUrlAuthTtlMilli;
}

function isAuthDateFresh(authDateRaw: string | null, userId: number): boolean {
	if (authDateRaw == null) return false;
	if (isAuthDateStale(authDateRaw)) {
		logger.warn({ userId }, 'Stale tg auth');
		return false;
	}
	return true;
}

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

export type UrlAuthFailureReason = 'missing-params' | 'invalid-signature' | 'stale';

type UrlAuthResult = {
	session: Session | null;
	reason: UrlAuthFailureReason | null;
};

async function getSessionFromUrl(
	roles: Role[],
	searchParams: URLSearchParams | undefined
): Promise<UrlAuthResult> {
	if (searchParams == null) return { session: null, reason: 'missing-params' };
	const dataCheckString = buildDataCheckString(searchParams);
	if (dataCheckString == null) return { session: null, reason: 'missing-params' };

	if (!(await isLinkSignatureValid(searchParams.get('hash')!, dataCheckString))) {
		return { session: null, reason: 'invalid-signature' };
	}

	const id = +searchParams.get('id')!;

	if (!isAuthDateFresh(searchParams.get('auth_date'), id)) {
		return { session: null, reason: 'stale' };
	}

	return {
		session: {
			tgId: id,
			roles,
			validUntil: nextMidnight()
		},
		reason: null
	};
}

export async function validateWebAppInitData(
	initData: string,
	roles: Role[]
): Promise<Session | null> {
	const params = new URLSearchParams(initData);
	const dataCheckString = buildDataCheckString(params);
	if (dataCheckString == null) return null;

	if (!(await isWebAppSignatureValid(params.get('hash')!, dataCheckString))) {
		logger.warn('Invalid webapp initData signature');
		return null;
	}

	const userRaw = params.get('user');
	if (userRaw == null) return null;

	let user: { id?: unknown };
	try {
		user = JSON.parse(userRaw);
	} catch {
		logger.warn('Invalid webapp user payload');
		return null;
	}

	if (typeof user.id !== 'number') return null;
	const id = user.id;

	if (!isAuthDateFresh(params.get('auth_date'), id)) {
		return null;
	}

	return {
		tgId: id,
		roles,
		validUntil: nextMidnight()
	};
}

function getSessionFromCookie(cookies: Cookies): Session | null {
	const cookie = cookies.get(cookieName);
	if (cookie == null) return null;

	let session = deserializeSession(cookie);
	if (session == null) {
		return null;
	}

	if (session.validUntil == null) return null;
	const now = Date.now();
	if (session.validUntil < now) {
		return null;
	}

	if (session.tgId == null) return null;
	return session;
}

export function storeSessionToCookie(session: Session, cookies: Cookies, path: string) {
	cookies.set(cookieName, serializeSession(session), {
		expires: new Date(session.validUntil),
		path,
		httpOnly: true,
		secure: true,
		sameSite: 'lax'
	});
}

export async function authenticateUser(
	cookies: Cookies,
	searchParams?: URLSearchParams
): Promise<{ session: Session | null; reason: UrlAuthFailureReason | null }> {
	const urlAuth = await getSessionFromUrl(['user'], searchParams);
	if (urlAuth.session != null) {
		storeSessionToCookie(urlAuth.session, cookies, '/order');
		return { session: urlAuth.session, reason: null };
	}

	const cookieSession = getSessionFromCookie(cookies);
	if (cookieSession != null) {
		return { session: cookieSession, reason: null };
	}

	return { session: null, reason: urlAuth.reason };
}

export async function authenticateAdmin(cookies: Cookies, searchParams?: URLSearchParams) {
	const urlAuth = await getSessionFromUrl(['admin'], searchParams);
	let session = urlAuth.session;
	if (session != null) {
		storeSessionToCookie(session, cookies, '/_/edit');
	} else {
		session = getSessionFromCookie(cookies);
	}

	if (session == null || !session.roles.includes('admin')) {
		throw error(401, 'Unauthorized');
	}
}
