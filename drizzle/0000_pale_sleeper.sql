CREATE TABLE `menu` (
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`receipt_date` text NOT NULL,
	`items` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `name` (
	`telegram_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
