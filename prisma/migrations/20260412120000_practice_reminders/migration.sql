-- AlterTable
ALTER TABLE "User" ADD COLUMN "practiceRemindersEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "practiceReminderHour" INTEGER NOT NULL DEFAULT 19;
ALTER TABLE "User" ADD COLUMN "practiceReminderMinute" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "practiceReminderTimezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "User" ADD COLUMN "practiceReminderDays" TEXT NOT NULL DEFAULT '1,2,3,4,5';
ALTER TABLE "User" ADD COLUMN "practiceReminderLastSent" TIMESTAMP(3);
