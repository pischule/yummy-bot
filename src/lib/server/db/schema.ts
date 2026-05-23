import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const locationsTable = sqliteTable('locations', {
	id: text().primaryKey(),
	name: text().notNull(),
	chatId: text('chat_id').notNull().unique(),
	menu: text('menu', { mode: 'json' }).notNull().$type<string[]>().default([]),
	updatedAt: text('updated_at').notNull().default(''),
	receiptDate: text('receipt_date').notNull().default(''),
	postedAt: text('posted_at')
});

export const menuLinkTable = sqliteTable('menu_link', {
	id: text().primaryKey(),
	locationId: text('location_id').notNull(),
	messageId: integer('message_id'),
	createdAt: text('created_at').notNull()
});

export const namesTable = sqliteTable('name', {
	telegramId: text('telegram_id').primaryKey(),
	name: text('name').notNull()
});

export const ordersTable = sqliteTable('orders', {
	id: integer().primaryKey({ autoIncrement: true }),
	locationId: text('location_id').notNull(),
	telegramId: text('telegram_id').notNull(),
	name: text().notNull(),
	orderedItems: text('ordered_items', { mode: 'json' })
		.notNull()
		.$type<{ name: string; qty: number }[]>(),
	receiptDate: text('receipt_date').notNull().default(''),
	createdAt: text('created_at').notNull(),
	messageId: integer('message_id')
});
