-- Add new Project columns. "slug" starts nullable so existing rows can be backfilled.
ALTER TABLE "Project"
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "role" TEXT,
ADD COLUMN     "architecture" TEXT,
ADD COLUMN     "impact" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: slug from name (lowercase, non-alphanumerics -> "-"), de-duplicated with
-- a numeric suffix; "order" keeps the current display order (physical row order).
DO $$
DECLARE
  rec RECORD;
  base TEXT;
  candidate TEXT;
  n INTEGER;
  pos INTEGER := 0;
BEGIN
  FOR rec IN SELECT "id", "name" FROM "Project" ORDER BY ctid LOOP
    base := trim(both '-' from regexp_replace(lower(rec."name"), '[^a-z0-9]+', '-', 'g'));
    base := trim(both '-' from left(base, 80));
    IF base = '' THEN
      base := 'project';
    END IF;
    candidate := base;
    n := 1;
    WHILE EXISTS (SELECT 1 FROM "Project" WHERE "slug" = candidate) LOOP
      n := n + 1;
      candidate := base || '-' || n;
    END LOOP;
    UPDATE "Project" SET "slug" = candidate, "order" = pos WHERE "id" = rec."id";
    pos := pos + 1;
  END LOOP;
END $$;

ALTER TABLE "Project" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
