import { fail } from '@sveltejs/kit';
import {
	addLocation,
	updateLocation,
	deleteLocation,
	deleteOrdersForLocation,
	getLocationByChatId
} from '$lib/server/database';
import { checkAdminAuth } from '$lib/server/auth';

export const actions = {
	addLocation: async ({ request, params }) => {
		checkAdminAuth(params);
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const chatId = (data.get('chatId') as string)?.trim();

		if (!name) {
			return fail(400, { type: 'addLocation', error: 'Название обязательно' });
		}

		const id = crypto.randomUUID();
		if (!chatId || !/^-?\d+$/.test(chatId)) {
			return fail(400, { type: 'addLocation', error: 'ID чата должен быть числом' });
		}
		if (await getLocationByChatId(chatId)) {
			return fail(409, { type: 'addLocation', error: 'Чат с таким ID уже существует' });
		}
		await addLocation({ id, name, chatId });

		return { type: 'addLocation', location: { id, name, chatId } };
	},

	updateLocation: async ({ request, params }) => {
		checkAdminAuth(params);
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = (data.get('name') as string)?.trim();
		const chatId = (data.get('chatId') as string)?.trim();

		if (!id || !name) {
			return fail(400, { type: 'updateLocation', error: 'ID и название обязательны' });
		}

		if (!chatId || !/^-?\d+$/.test(chatId)) {
			return fail(400, { type: 'updateLocation', error: 'ID чата должен быть числом' });
		}
		const existing = await getLocationByChatId(chatId);
		if (existing && existing.id !== id) {
			return fail(409, { type: 'updateLocation', error: 'Чат с таким ID уже существует' });
		}
		await updateLocation(id, { name, chatId });
		return { type: 'updateLocation', id, name, chatId };
	},

	deleteLocation: async ({ request, params }) => {
		checkAdminAuth(params);
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { type: 'deleteLocation', error: 'ID обязателен' });
		}

		await deleteLocation(id);
		return { type: 'deleteLocation', id };
	}
};
