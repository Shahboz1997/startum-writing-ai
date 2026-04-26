-- New rows get 1 free check; existing users keep their current balance.
ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 1;

