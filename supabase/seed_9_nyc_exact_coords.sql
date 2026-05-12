-- Exact NYC coordinates — street-level addresses, geocoded precisely
-- Sant Ambroeus: 1000 Madison Ave (77th/78th St) — on Madison, NOT Park Ave
UPDATE locations SET latitude = 40.7754350, longitude = -73.9630330
WHERE name = 'Sant Ambroeus' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The Mark Hotel: 25 East 77th Street
UPDATE locations SET latitude = 40.7752940, longitude = -73.9633550
WHERE name = 'The Mark Hotel' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The Bemelmans Bar at The Carlyle: 35 East 76th Street
UPDATE locations SET latitude = 40.7743370, longitude = -73.9631320
WHERE name = 'The Bemelmans Bar at The Carlyle' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The Frick Collection: 1 East 70th Street
UPDATE locations SET latitude = 40.7709990, longitude = -73.9672460
WHERE name = 'The Frick Collection' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The Pierre Hotel: 2 East 61st Street
UPDATE locations SET latitude = 40.7652640, longitude = -73.9718040
WHERE name = 'The Pierre Hotel Lobby' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The Lowell Hotel: 28 East 63rd Street
UPDATE locations SET latitude = 40.7657690, longitude = -73.9691860
WHERE name = 'The Lowell Hotel' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The Plaza Hotel: 768 Fifth Avenue (Grand Army Plaza)
UPDATE locations SET latitude = 40.7646310, longitude = -73.9743240
WHERE name = 'The Plaza Hotel Lobby' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The St. Regis: 2 East 55th Street
UPDATE locations SET latitude = 40.7613000, longitude = -73.9744530
WHERE name = 'The St. Regis New York' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The Peninsula: 700 Fifth Avenue at 55th Street
UPDATE locations SET latitude = 40.7616980, longitude = -73.9753330
WHERE name = 'The Peninsula New York' AND city_id = '11111111-0000-0000-0000-000000000001';

-- Ralph Lauren Polo Bar: 1 East 55th Street
UPDATE locations SET latitude = 40.7616500, longitude = -73.9746100
WHERE name = 'Ralph Lauren''s Polo Bar' AND city_id = '11111111-0000-0000-0000-000000000001';

-- Bergdorf Goodman: 754 Fifth Avenue at 57th Street
UPDATE locations SET latitude = 40.7636800, longitude = -73.9739100
WHERE name = 'Bergdorf Goodman Ground Floor' AND city_id = '11111111-0000-0000-0000-000000000001';

-- Baccarat Hotel: 28 West 53rd Street
UPDATE locations SET latitude = 40.7595500, longitude = -73.9740300
WHERE name = 'Baccarat Hotel New York' AND city_id = '11111111-0000-0000-0000-000000000001';

-- Lever House: 390 Park Avenue at 53rd Street
UPDATE locations SET latitude = 40.7595860, longitude = -73.9728280
WHERE name = 'Lever House Restaurant' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The Morgan Library: 225 Madison Avenue at 36th Street
UPDATE locations SET latitude = 40.7491040, longitude = -73.9816630
WHERE name = 'The Morgan Library & Museum' AND city_id = '11111111-0000-0000-0000-000000000001';

-- Balthazar: 80 Spring Street, SoHo
UPDATE locations SET latitude = 40.7227610, longitude = -73.9984220
WHERE name = 'Balthazar' AND city_id = '11111111-0000-0000-0000-000000000001';

-- Cipriani Downtown: 376 West Broadway, SoHo
UPDATE locations SET latitude = 40.7236410, longitude = -74.0028800
WHERE name = 'Cipriani Downtown' AND city_id = '11111111-0000-0000-0000-000000000001';

-- The Odeon: 145 West Broadway, TriBeCa
UPDATE locations SET latitude = 40.7169100, longitude = -74.0078600
WHERE name = 'The Odeon' AND city_id = '11111111-0000-0000-0000-000000000001';

-- High Line Gansevoort Entrance: Washington St & Gansevoort St
UPDATE locations SET latitude = 40.7396020, longitude = -74.0085910
WHERE name = 'The High Line (Gansevoort Entrance)' AND city_id = '11111111-0000-0000-0000-000000000001';

-- Central Park Reservoir: JKO Reservoir running path (86th-96th St)
UPDATE locations SET latitude = 40.7853000, longitude = -73.9610000
WHERE name = 'Central Park Reservoir Path' AND city_id = '11111111-0000-0000-0000-000000000001';

-- Madison Avenue (shopping stretch): Madison Ave & 72nd St
UPDATE locations SET latitude = 40.7717830, longitude = -73.9654340
WHERE name = 'Madison Avenue' AND city_id = '11111111-0000-0000-0000-000000000001';
