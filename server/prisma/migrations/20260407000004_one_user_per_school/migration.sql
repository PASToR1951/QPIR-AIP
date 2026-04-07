-- Enforce one School-role user per school.
-- Uses a partial unique index so the constraint only applies when role = 'School'
-- and school_id is set; other roles (Division Personnel, Admin, etc.) are unaffected.
CREATE UNIQUE INDEX "users_unique_school_user"
ON "User"("school_id")
WHERE "role" = 'School' AND "school_id" IS NOT NULL;
