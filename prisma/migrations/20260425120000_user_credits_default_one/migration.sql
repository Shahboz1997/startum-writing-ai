-- New rows get 2 free checks (Task 1 + Task 2); existing users keep their current balance.
ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 2;
