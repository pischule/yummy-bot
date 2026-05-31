import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/store';
import { menuLinkTable } from '$lib/server/db/schema';
import { eq, inArray, lt } from 'drizzle-orm';
import { bot } from '$lib/server/bot';
import { groupBy, sleep } from '$lib/server/utils';
import { logger } from '$lib/server/logger';

let messageDeletionTimer: NodeJS.Timeout | null = null;

export async function sendMenuLink(locationId: string, chatId: string): Promise<void> {
	const linkId = await createMenuLink(locationId, +chatId);

	const button = {
		text: 'Создать заказ',
		login_url: {
			url: `${env.APP_URL}/order/${linkId}`
		}
	};
	const result = await bot.api.sendMessage(chatId, 'Нажмите на кнопку ниже, чтобы создать заказ', {
		reply_markup: { inline_keyboard: [[button]] }
	});

	const messageId = result.message_id;

	await updateMenuLinkMessageId(linkId, messageId);
}

async function deleteOldMenuLinks() {
	const ttl = Temporal.Duration.from({ hours: 18 });
	const createdBefore = Temporal.Now.instant().subtract(ttl).toJSON();

	const links = await db
		.select()
		.from(menuLinkTable)
		.where(lt(menuLinkTable.createdAt, createdBefore))
		.limit(20);

	const chatIdToLinks = groupBy(links, (link) => link.chatId);

	const deleteDelayMs = 500;
	for (const [chatId, links] of chatIdToLinks.entries()) {
		const messageIds = links
			.filter((link) => link.messageId != null)
			.map((link) => link.messageId!);
		if (messageIds.length == 0) {
			continue;
		}

		try {
			await bot.api.deleteMessages(chatId, messageIds);
		} catch (e) {
			logger.warn(e, 'Failed to delete messages');
		}
		await sleep(deleteDelayMs);
	}

	const linkIds = links.map((link) => link.id);
	await db.delete(menuLinkTable).where(inArray(menuLinkTable.id, linkIds)).execute();

	logger.info(`Deleted ${links.length} links`);
}

async function deleteOldLinksWithErrorLog() {
	try {
		await deleteOldMenuLinks();
	} catch (e) {
		logger.error(e, 'Old link deletion failed');
	}
}

export function scheduleOldLinkDeletion() {
	if (messageDeletionTimer) return;
	const frequency = Temporal.Duration.from({ hours: 4 }).total('millisecond');
	messageDeletionTimer = setInterval(deleteOldLinksWithErrorLog, frequency);
}

async function createMenuLink(locationId: string, chatId: number): Promise<string> {
	const linkId = crypto.randomUUID().toString();
	await db
		.insert(menuLinkTable)
		.values({
			id: linkId,
			chatId: chatId,
			locationId: locationId,
			createdAt: Temporal.Now.instant().toJSON()
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
