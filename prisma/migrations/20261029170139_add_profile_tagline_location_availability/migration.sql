-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "tagline" TEXT;

-- Backfill: keep the hero text that used to be hardcoded in components/Hero.tsx.
UPDATE "Profile"
SET "tagline" = 'I build modern web applications with clean code and scalable architecture using the MERN stack. Passionate about graphics design, backend systems, and continuously expanding into cybersecurity. Always learning. Always building.'
WHERE "tagline" IS NULL;
