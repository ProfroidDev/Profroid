/*
  Warnings:

  - A unique constraint covering the columns `[resetPasswordToken]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `resetPasswordExpires` DATETIME(3) NULL,
    ADD COLUMN `resetPasswordToken` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `user_resetPasswordToken_key` ON `user`(`resetPasswordToken`);
