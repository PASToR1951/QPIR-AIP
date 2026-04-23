-- Consolidate "Alternative Learning System (For school-based ALS)" → "Alternative Learning System (ALS)"
UPDATE "Program"
SET title = 'Alternative Learning System (ALS)'
WHERE title = 'Alternative Learning System (For school-based ALS)';
