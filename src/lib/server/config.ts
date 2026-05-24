import { env } from '$env/dynamic/private';

function checkSessionEncryptionKey() {
	const key = env.COOKIE_ENCRYPTION_KEY;
	if (key == null) {
		throw new Error('COOKIE_ENCRYPTION_KEY is not set');
	}

	if (Buffer.from(key, 'base64').length !== 32) {
		throw new Error('COOKIE_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
	}
}

export function validateConfig() {
	checkSessionEncryptionKey();
}
