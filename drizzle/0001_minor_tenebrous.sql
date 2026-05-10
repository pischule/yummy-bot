CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`chat_id` text NOT NULL,
	`menu` text DEFAULT '[]' NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	`receipt_date` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `locations_chat_id_unique` ON `locations` (`chat_id`);--> statement-breakpoint
DROP TABLE `menu`;