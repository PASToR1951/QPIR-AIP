-- Allow multiple users per school by dropping the unique index on school_id
DROP INDEX IF EXISTS "User_school_id_key";
