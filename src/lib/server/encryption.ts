import * as crypto from 'crypto';
import { logger } from '$lib/server/logger';

const ALGORITHM = 'chacha20-poly1305';
const KEY_BYTE_LENGTH = 32;
const IV_BYTE_LENGTH = 12;
const AUTH_TAG_BYTE_LENGTH = 16;
const ENCODING: BufferEncoding = 'base64';

export function encrypt(plaintext: string, keyString: string): string {
	const key = Buffer.from(keyString, ENCODING);
	if (key.length !== KEY_BYTE_LENGTH) {
		throw new Error(`Key must be exactly ${KEY_BYTE_LENGTH} bytes.`);
	}

	const iv = crypto.randomBytes(IV_BYTE_LENGTH);

	const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTE_LENGTH });

	const encryptedUpdate = cipher.update(plaintext, 'utf8');
	const encryptedFinal = cipher.final();
	const ciphertext = Buffer.concat([encryptedUpdate, encryptedFinal]);

	const authTag = cipher.getAuthTag();

	const payload = Buffer.concat([iv, ciphertext, authTag]);
	return payload.toString(ENCODING);
}

export function decrypt(textPayload: string, keyString: string): string | null {
	const key = Buffer.from(keyString, ENCODING);
	if (key.length !== KEY_BYTE_LENGTH) {
		throw new Error(`Key must be exactly ${KEY_BYTE_LENGTH} bytes.`);
	}

	try {
		const totalBuffer = Buffer.from(textPayload, ENCODING);
		if (totalBuffer.length < IV_BYTE_LENGTH + AUTH_TAG_BYTE_LENGTH) {
			return null;
		}

		const iv = totalBuffer.subarray(0, IV_BYTE_LENGTH);
		const authTag = totalBuffer.subarray(totalBuffer.length - AUTH_TAG_BYTE_LENGTH);
		const ciphertext = totalBuffer.subarray(
			IV_BYTE_LENGTH,
			totalBuffer.length - AUTH_TAG_BYTE_LENGTH
		);

		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
			authTagLength: AUTH_TAG_BYTE_LENGTH
		});
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(ciphertext, undefined, 'utf-8');
		decrypted += decipher.final();

		return decrypted;
	} catch (e) {
		logger.error(e, 'Decryption failed');
		return null;
	}
}
