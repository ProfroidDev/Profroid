/*
  Warnings:

  - You are about to drop the column `resetPasswordExpires` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `resetPasswordToken` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[verificationTokenHash]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `user_resetPasswordToken_key` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `resetPasswordExpires`,
    DROP COLUMN `resetPasswordToken`,
    ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL,
    ADD COLUMN `verificationAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `verificationLockedUntil` DATETIME(3) NULL,
    ADD COLUMN `verificationTokenExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `verificationTokenHash` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `user_verificationTokenHash_key` ON `user`(`verificationTokenHash`);
