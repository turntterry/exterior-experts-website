CREATE TABLE `contact_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`service` varchar(100),
	`message` text,
	`address` text,
	`status` enum('new','read','replied') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gallery_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`title` varchar(255),
	`description` text,
	`serviceType` varchar(50),
	`imageType` enum('before','after','general') DEFAULT 'general',
	`pairId` int,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gallery_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceType` varchar(50) NOT NULL,
	`config` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `pricing_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricing_config_serviceType_unique` UNIQUE(`serviceType`)
);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`serviceType` varchar(50) NOT NULL,
	`packageTier` enum('good','better','best') DEFAULT 'good',
	`inputs` json,
	`basePrice` decimal(10,2) NOT NULL,
	`finalPrice` decimal(10,2) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`address` text NOT NULL,
	`city` varchar(100),
	`state` varchar(2),
	`zip` varchar(10),
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`distanceMiles` decimal(6,2),
	`sqft` int,
	`stories` int,
	`subtotal` decimal(10,2) NOT NULL,
	`bundleDiscount` decimal(10,2) DEFAULT '0',
	`travelFee` decimal(10,2) DEFAULT '0',
	`totalPrice` decimal(10,2) NOT NULL,
	`preferredDate` varchar(20),
	`preferredTime` varchar(20),
	`status` enum('new','contacted','scheduled','completed','cancelled') NOT NULL DEFAULT 'new',
	`notes` text,
	`referralSource` varchar(100),
	`customerPhotos` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
