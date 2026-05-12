-- Remove the 5 hotel-bar locations from London that duplicate the Hotel Lobby category
-- Keeping only: 45 Park Lane, Brown's Hotel, The Berkeley, The Dorchester, The Langham London

DELETE FROM locations
WHERE city_id = '11111111-0000-0000-0000-000000000002'
  AND name IN (
    'The Connaught Bar',
    'The Ritz Hotel Palm Court',
    'Claridge''s Lobby Bar',
    'The Savoy American Bar',
    'Chiltern Firehouse Bar'
  );
