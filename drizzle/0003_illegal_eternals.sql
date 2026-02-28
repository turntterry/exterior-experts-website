CREATE TABLE `page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`pagePath` varchar(500) NOT NULL,
	`pageTitle` varchar(255),
	`timeSpentSeconds` int DEFAULT 0,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitor_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`country` varchar(100),
	`city` varchar(100),
	`deviceType` varchar(50),
	`referrer` text,
	`firstVisitAt` timestamp NOT NULL DEFAULT (now()),
	`lastVisitAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`pageViewCount` int DEFAULT 0,
	CONSTRAINT `visitor_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `visitor_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
