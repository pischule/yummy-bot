import fs from 'fs/promises';

export const jsonStore = <Type>(filename: string) => {
	async function get() {
		try {
			return <Type>JSON.parse(await fs.readFile(filename, 'utf-8'));
		} catch (e) {
			console.error(`failed to read ${filename}`, e);
			return null;
		}
	}

	async function set(value: Type) {
		try {
			await fs.writeFile(filename, JSON.stringify(value));
		} catch (e) {
			console.error(`failed to write ${filename}`, e);
		}
	}

	return {
		get,
		set
	};
};
