import fs from 'fs/promises';
import * as util from '$lib/server/util';

const filename = 'menu.json';
export const getMenu = async () => {
	let file: Buffer;
	try {
		file = await fs.readFile(filename);
	} catch (e) {
		console.error(e);
		return null;
	}
	const menu = <Menu>JSON.parse(file.toString());

	if (menu.items.length === 0) {
		return null;
	}

	const updateDate = util.dateToLocalDateString(new Date(menu.updateDate));
	const today = util.dateToLocalDateString();
	if (today !== updateDate) {
		return null;
	}
	return menu;
};

export const setMenu = async (menu: Menu) => {
	await fs.writeFile(filename, JSON.stringify(menu));
};