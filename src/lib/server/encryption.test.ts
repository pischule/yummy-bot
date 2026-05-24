import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '$lib/server/encryption';

describe('encryption', () => {
	it('should encrypt and decrypt', () => {
		const key = 'lVmBmAQEnFiLGPAR0f4k5K3GwNXc5pmDcE7boU2y/5w=';
		const sourceData = 'someData';

		const encrypted = encrypt(sourceData, key);
		expect(encrypted).not.toBe(sourceData);

		const decryptedData = decrypt(encrypted, key);
		expect(decryptedData).toBe(sourceData);
	});

	it('should return null when decrypting with wrong key', () => {
		const key = 'lVmBmAQEnFiLGPAR0f4k5K3GwNXc5pmDcE7boU2y/5w=';
		const sourceData = 'someData';

		const encrypted = encrypt(sourceData, key);
		expect(encrypted).not.toBe(sourceData);

		const wrongKey = '3rqh1njB/BrxaZ9ellVyp5cK4vaK3uEtQil1W8jZ6TE=';
		const decryptedData = decrypt(encrypted, wrongKey);
		expect(decryptedData).toBe(null);
	});

	it('should throw if key has wrong size', () => {
		const badKey = '/VX+TrWpNqA=';

		expect(() => {
			encrypt('plaintext', badKey);
		}).toThrow('Key must be exactly 32 bytes.');

		expect(() => {
			decrypt('ciphertext', badKey);
		}).toThrow('Key must be exactly 32 bytes.');
	});

	it('should return null if data was tampered', () => {
		const plaintext = 'someData';
		const key = 'lVmBmAQEnFiLGPAR0f4k5K3GwNXc5pmDcE7boU2y/5w=';

		const payload = Buffer.from(encrypt(plaintext, key), 'base64');
		// flip one byte
		payload[0] = ~payload[0] & 0xff;
		const alteredPayload = payload.toString('base64');

		const decrypted = decrypt(alteredPayload, key);
		expect(decrypted).toBe(null);
	});
});
