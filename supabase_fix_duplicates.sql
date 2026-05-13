-- 1. Identify duplicates (same client, same date/time within 1 minute)
-- 2. Keep the one with the most content (notes, goal, etc.)
-- 3. Delete the others

WITH DuplicateGroups AS (
  SELECT 
    id,
    client_id,
    date,
    ROW_NUMBER() OVER (
      PARTITION BY client_id, date_trunc('minute', date) 
      ORDER BY 
        (CASE WHEN notes IS NOT NULL THEN 1 ELSE 0 END + 
         CASE WHEN goal IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN priority_pattern IS NOT NULL THEN 1 ELSE 0 END) DESC,
        created_at DESC
    ) as rank
  FROM appointments
)
DELETE FROM appointments
WHERE id IN (
  SELECT id FROM DuplicateGroups WHERE rank > 1
);