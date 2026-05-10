import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const locationsTable = sqliteTable('locations', {
	id: text().primaryKey(),
	name: text().notNull(),
	chatId: text('chat_id').notNull().unique(),
	menu: text('menu', { mode: 'json' }).notNull().$type<string[]>().default([]),
	updatedAt: text('updated_at').notNull().default(''),
	receiptDate: text('receipt_date').notNull().default('')
});

export const namesTable = sqliteTable('name', {
	telegramId: text('telegram_id').primaryKey(),
	name: text('name').notNull()
});
