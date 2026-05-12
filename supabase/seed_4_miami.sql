-- Miami Locations (Social Spaces) — no inline JSON, what_to_wear seeded separately
-- Step 1: Update the city record
UPDATE cities
SET name = 'Miami', slug = 'miami', country = 'United States',
    tagline = 'Art Basel is in December. The rest is just practice.'
WHERE id = '11111111-0000-0000-0000-000000000003';

-- Step 2: Clear any existing Paris/Miami data
DELETE FROM locations WHERE city_id = '11111111-0000-0000-0000-000000000003';
DELETE FROM events WHERE city_id = '11111111-0000-0000-0000-000000000003';

-- Step 3: Insert Miami social spaces (what_to_wear added separately via seed_miami_what_to_wear.sql)

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'The Setai',
'South Beach',
'Hotel Lobby',
'The quietest luxury in South Beach. No beach clubs, no DJs, no one trying to sell you a table. Just cold marble, warm staff, and a pool that somehow feels private even when it isn''t. The Setai operates on the assumption that guests already know what they want. Sit in the bar. Don''t raise your voice.',
25.7744, -80.1318,
'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
4, true);

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'Faena Hotel',
'Mid-Beach',
'Hotel Lobby',
'The golden mammoth of Mid-Beach. Damien Hirst''s gilded mammoth in the Saxony Bar is not ironic. The coral ceiling of the Tierra Santa Healing House is not ironic. Nothing here is ironic — it''s all entirely, magnificently committed. The Faena is what happens when maximalism has a budget. You will not feel underdressed if you make an effort. You will feel invisible if you don''t.',
25.7987, -80.1274,
'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
4, true);

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'Vizcaya Museum & Gardens',
'Coconut Grove',
'Old Money',
'James Deering''s 1916 Italian Renaissance estate sits on ten acres of formal gardens overlooking Biscayne Bay. It''s the closest thing Miami has to old world money, and the city''s grandest address for charity galas, private events, and the kind of Saturday afternoon that makes you feel you''ve been somewhere. Walk slowly. Read the plaques. Pretend you''ve been before.',
25.7443, -80.2083,
'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
3, true);

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'Pérez Art Museum Miami',
'Downtown / Brickell',
'Art World',
'Herzog & de Meuron''s hanging garden pavilion over Biscayne Bay is Miami''s serious cultural institution. The collection is genuinely strong. The terrace bar is one of the better-kept secrets in the city. Go on a weekday, skip the audio guide, and stand in front of something confusing for longer than feels comfortable. The goal is to leave with opinions.',
25.7691, -80.1874,
'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
2, true);

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'Bal Harbour Shops',
'Bal Harbour',
'Luxury Retail',
'The only outdoor shopping centre where the correct activity is going for a walk. The tropical landscaping is better than the Botanical Garden. The boutiques are better than Fifth Avenue. The clientele is a masterclass in Miami''s particular brand of old-money-adjacent wealth. Browse slowly. Buy nothing. Look like you''ve already decided.',
25.8967, -80.1218,
'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
3, true);

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'The Surf Club Restaurant',
'Surfside',
'Members Club',
'Thomas Keller''s restaurant inside the Four Seasons Surf Club occupies the restored 1930s cabana of what was once the most exclusive club in Florida. The service is Four Seasons. The food is Thomas Keller. The room is a masterclass in restrained glamour. Reserve weeks in advance. Wear something that could pass at Per Se.',
25.8719, -80.1232,
'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
5, true);

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'Soho Beach House Miami',
'Mid-Beach',
'Members Club',
'The Miami outpost of the global members club that made the concept of creative-class luxury mainstream. Rooftop pool, Cecconi''s, and a beach club that actually feels like a beach club. Members and hotel guests only for most areas. The crowd is a precise mix of media, fashion, tech, and people who know people in all three.',
25.8097, -80.1224,
'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
4, true);

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'Swan Miami',
'Design District',
'Restaurant & Bar',
'Pharrell and David Grutman''s restaurant in the Design District is the most photographed table in Miami. The pink flamingo logo is not subtle and neither is the crowd. The food is actually good. The bar programme is excellent. The real experience is the room — an exercise in maximalist tropical glamour that somehow doesn''t tip into kitsch.',
25.8128, -80.1936,
'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
4, true);

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'Wynwood Walls',
'Wynwood',
'Art World',
'The world''s most famous open-air street art museum turned cultural landmark. What started as a Goldman Properties project in 2009 is now the anchor of a neighbourhood. Go on a weeknight, not a weekend. The art is better without the crowd. The surrounding galleries, bars, and Wynwood Kitchen & Bar are worth building an evening around.',
25.8008, -80.1994,
'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80',
2, true);

INSERT INTO locations (city_id, name, neighborhood, category, description, latitude, longitude, photo_url, vibe_difficulty, is_approved) VALUES
('11111111-0000-0000-0000-000000000003',
'The Bass Museum of Art',
'South Beach',
'Art World',
'Miami Beach''s serious art museum — a Arata Isozaki-redesigned 1930s building with a permanent collection that punches well above the city''s cultural reputation. The Bass runs strong temporary exhibitions and is the quieter, more considered alternative to PAMM. Collins Park is directly outside. Go after, sit for ten minutes, feel like you live here.',
25.7897, -80.1298,
'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
2, true);
