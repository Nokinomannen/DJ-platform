CREATE TABLE `addons` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price` integer NOT NULL,
	`price_type` text DEFAULT 'fixed' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `addons_artist_idx` ON `addons` (`artist_id`);--> statement-breakpoint
CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`category` text NOT NULL,
	`tagline` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`city` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`travel_radius_km` integer DEFAULT 50 NOT NULL,
	`hourly_rate` integer NOT NULL,
	`min_hours` integer DEFAULT 2 NOT NULL,
	`genres` text DEFAULT '[]' NOT NULL,
	`event_types` text DEFAULT '[]' NOT NULL,
	`equipment` text DEFAULT '' NOT NULL,
	`image_key` text,
	`avatar_hue` integer DEFAULT 280 NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artists_user_id_unique` ON `artists` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `artists_slug_unique` ON `artists` (`slug`);--> statement-breakpoint
CREATE INDEX `artists_category_idx` ON `artists` (`category`);--> statement-breakpoint
CREATE TABLE `blocked_dates` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_id` text NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocked_dates_artist_date_idx` ON `blocked_dates` (`artist_id`,`date`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_id` text NOT NULL,
	`booker_id` text NOT NULL,
	`event_date` text NOT NULL,
	`start_time` text NOT NULL,
	`hours` integer NOT NULL,
	`event_type` text NOT NULL,
	`guests` integer NOT NULL,
	`location` text NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`addon_lines` text DEFAULT '[]' NOT NULL,
	`performance_amount` integer NOT NULL,
	`addons_amount` integer NOT NULL,
	`service_fee` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`booker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bookings_artist_idx` ON `bookings` (`artist_id`,`event_date`);--> statement-breakpoint
CREATE INDEX `bookings_booker_idx` ON `bookings` (`booker_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_booking_idx` ON `messages` (`booking_id`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_id` text NOT NULL,
	`booking_id` text,
	`author_name` text NOT NULL,
	`rating` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_booking_id_unique` ON `reviews` (`booking_id`);--> statement-breakpoint
CREATE INDEX `reviews_artist_idx` ON `reviews` (`artist_id`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`artist_id` text NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`url` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tracks_artist_idx` ON `tracks` (`artist_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'booker' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);