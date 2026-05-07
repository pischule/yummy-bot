import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const menuTable = sqliteTable('menu', {
	id: text().primaryKey(),
	updatedAt: text('updated_at').notNull(),
	receiptDate: text('receipt_date').notNull(),
	items: text('items', { mode: 'json' }).notNull().$type<string[]>()
});

export const namesTable = sqliteTable('name', {
	telegramId: text('telegram_id').primaryKey(),
	name: text('name').notNull()
});
