-- Keep the schools serial counter ahead of rows imported with explicit IDs.
-- Otherwise the next Admin > Schools create can reuse an existing primary key
-- and Prisma reports it as P2002 / 409 Conflict.

DO $$
DECLARE
  sequence_name TEXT;
BEGIN
  sequence_name := pg_get_serial_sequence('public.schools', 'id');

  IF sequence_name IS NOT NULL THEN
    EXECUTE format(
      'SELECT setval(%L::regclass, COALESCE((SELECT MAX(id) FROM public.schools), 1), (SELECT MAX(id) IS NOT NULL FROM public.schools))',
      sequence_name
    );
  END IF;
END $$;
