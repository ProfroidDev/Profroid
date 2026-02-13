-- Add preferredLanguage field to userProfile
ALTER TABLE `userProfile` ADD COLUMN `preferredLanguage` VARCHAR(191) NOT NULL DEFAULT 'en';
