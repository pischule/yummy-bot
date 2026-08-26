import { db } from '$lib/server/db/store';
import { messagesToDeleteTable } from '$lib/server/db/schema';
import { inArray, lt } from 'drizzle-orm';
import { bot } from '$lib/server/bot';
import { groupBy, sleep } from '$lib/server/utils';
import { logger } from '$lib/server/logger';

let messageDeletionTimer: NodeJS.Timeout | null = null;

export async function trackMessageToDelete(chatId: number, messageId: number): Promise<void> {
	await db
		.insert(messagesToDeleteTable)
		.values({
			chatId,
			messageId,
			createdAt: Temporal.Now.instant().toJSON()
		})
		.execute();
}

async function deleteOldTrackedMessages() {
	const ttl = Temporal.Duration.from({ hours: 12 });
	const createdBefore = Temporal.Now.instant().subtract(ttl).toJSON();

	const messages = await db
		.select()
		.from(messagesToDeleteTable)
		.where(lt(messagesToDeleteTable.createdAt, createdBefore))
		.limit(50);

	const chatIdToMessages = groupBy(messages, (message) => message.chatId);

	const deleteDelayMs = 500;
	for (const [chatId, messages] of chatIdToMessages.entries()) {
		const messageIds = messages.map((message) => message.messageId);
		try {
			await bot.api.deleteMessages(chatId, messageIds);
		} catch (e) {
			logger.warn(e, 'Failed to delete tracked messages');
		}
		await sleep(deleteDelayMs);
	}

	const messageIds = messages.map((message) => message.id);
	await db
		.delete(messagesToDeleteTable)
		.where(inArray(messagesToDeleteTable.id, messageIds))
		.execute();

	logger.info(`Deleted ${messages.length} tracked messages`);
}

async function deleteOldTrackedMessagesWithErrorLog() {
	try {
		await deleteOldTrackedMessages();
	} catch (e) {
		logger.error(e, 'Old tracked message deletion failed');
	}
}

export function scheduleTrackedMessageDeletion() {
	if (messageDeletionTimer) return;
	const frequency = Temporal.Duration.from({ hours: 4 }).total('millisecond');
	messageDeletionTimer = setInterval(deleteOldTrackedMessagesWithErrorLog, frequency);
}
