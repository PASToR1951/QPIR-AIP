-- Revert: restore "Alternative Learning System (ALS)" back to "Alternative Learning System (For school-based ALS)"
UPDATE "programs"
SET title = 'Alternative Learning System (For school-based ALS)'
WHERE title = 'Alternative Learning System (ALS)';
