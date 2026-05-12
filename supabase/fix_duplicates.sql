-- Remove duplicate locations keeping the first (oldest) entry per name+city
DELETE FROM locations
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM locations
  GROUP BY name, city_id
);

-- Remove the original "Hôtel Costes Bar" (Art World) since
-- "Hôtel Costes Bar & Lobby" (Hotel Lobby) is the full dedicated entry
DELETE FROM locations
WHERE name = 'Hôtel Costes Bar'
  AND category = 'Art World'
  AND city_id = '11111111-0000-0000-0000-000000000003';

-- Rename for consistency
UPDATE locations SET name = 'Hôtel Costes'
WHERE name = 'Hôtel Costes Bar & Lobby';
