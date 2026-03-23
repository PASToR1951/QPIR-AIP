-- Consolidate "Alternative Learning System (For school-based ALS)" → "Alternative Learning System (ALS)"
UPDATE "programs"
SET title = 'Alternative Learning System (ALS)'
WHERE title = 'Alternative Learning System (For school-based ALS)';
