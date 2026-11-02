-- AlterTable
ALTER TABLE "Education" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- Backfill "order" so the current public ordering is preserved:
-- skills were sorted by category, education by start year (newest first).
UPDATE "Skill" s
SET "order" = ranked.pos
FROM (SELECT "id", (ROW_NUMBER() OVER (ORDER BY "category" ASC, ctid) - 1) AS pos FROM "Skill") ranked
WHERE s."id" = ranked."id";

UPDATE "Education" e
SET "order" = ranked.pos
FROM (SELECT "id", (ROW_NUMBER() OVER (ORDER BY "startYear" DESC, ctid) - 1) AS pos FROM "Education") ranked
WHERE e."id" = ranked."id";
