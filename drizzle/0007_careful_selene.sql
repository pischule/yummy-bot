CREATE TABLE `messages_to_delete` (
	`id` integer PRIMARY KEY NOT NULL,
	`chat_id` integer NOT NULL,
	`message_id` integer NOT NULL,
	`created_at` text NOT NULL
);
