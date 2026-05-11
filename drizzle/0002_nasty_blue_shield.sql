CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` text NOT NULL,
	`telegram_id` text NOT NULL,
	`name` text NOT NULL,
	`ordered_items` text NOT NULL,
	`receipt_date` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
