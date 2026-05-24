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

export let adminChatIds: number[] = [];

function checkAdminChatIds() {
	const raw = env.ADMIN_CHAT_IDS;
	if (raw == null || raw.trim() === '') {
		adminChatIds = [];
		return;
	}

	const tokens = raw.split(',').map((t) => t.trim());
	for (const token of tokens) {
		if (!/^-?\d+$/.test(token)) {
			throw new Error(`ADMIN_CHAT_IDS contains invalid value: "${token}"`);
		}
	}
	adminChatIds = tokens.map(Number);
}

export function validateConfig() {
	checkSessionEncryptionKey();
	checkAdminChatIds();
}
