import { APP_URL } from '$env/static/private';
import { db } from '$lib/server/db/store';
import { menuLinkTable } from '$lib/server/db/schema';
import { Instant } from '@js-joda/core';
import { eq } from 'drizzle-orm';
import { bot } from '$lib/server/bot';

export async function sendMenuLink(locationId: string, chatId: string): Promise<void> {
	const linkId = await createMenuLink(locationId);

	const button = {
		text: 'Создать заказ',
		login_url: {
			url: `${APP_URL}/order/${linkId}`
		}
	};
	const result = await bot.api.sendMessage(chatId, 'Нажмите на кнопку ниже, чтобы создать заказ', {
		reply_markup: { inline_keyboard: [[button]] }
	});

	const messageId = result.message_id;

	await updateMenuLinkMessageId(linkId, messageId);
}

async function createMenuLink(locationId: string): Promise<string> {
	const linkId = crypto.randomUUID().toString();
	await db
		.insert(menuLinkTable)
		.values({
			id: linkId,
			locationId: locationId,
			createdAt: Instant.now().toJSON()
		})
		.execute();
	return linkId;
}

async function updateMenuLinkMessageId(linkId: string, messageId: number): Promise<string> {
	await db
		.update(menuLinkTable)
		.set({
			messageId: messageId
		})
		.where(eq(menuLinkTable.id, linkId))
		.execute();
	return linkId;
}
