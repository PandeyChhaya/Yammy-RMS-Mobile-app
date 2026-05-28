-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_login" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totp_secret" VARCHAR(200);
