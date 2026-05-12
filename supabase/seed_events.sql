-- Seed events for NYC, London, Paris
-- All events from late April / May 2026

-- ─── NEW YORK ─────────────────────────────────────────────────────────────────

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'Hauser & Wirth: Spring Opening Reception',
  'Private reception for the gallery''s spring group show featuring works by contemporary painters and sculptors. Collectors and press only for the first hour, then open to RSVP guests. Champagne, conversation, and the rare pleasure of having the walls nearly to yourself.',
  'Hauser & Wirth New York',
  '542 West 22nd Street',
  'Chelsea',
  'Art & Galleries',
  '2026-04-24',
  '18:00',
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80',
  'Free — RSVP required',
  NULL,
  4
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'Bemelmans After Dark: Late Night Jazz',
  'The bar that made the Upper East Side famous stays open late on Fridays with a rotating jazz trio. No tourists at this hour — just regulars who understand that the evening starts at eleven. The mural watches. The piano plays. You''re exactly where you''re supposed to be.',
  'The Bemelmans Bar at The Carlyle',
  '35 East 76th Street',
  'Upper East Side',
  'Hotel Bars & Lounges',
  '2026-04-25',
  '22:00',
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
  'No cover — one drink minimum',
  NULL,
  3
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'The Morgan Library: A Curator''s Evening',
  'An intimate guided tour through the new spring acquisitions, followed by a reception in the East Room. The librarian will speak briefly. You will mostly look at the ceiling and pretend you knew about this artist already. Dress as if you belong here — because tonight, you do.',
  'The Morgan Library & Museum',
  '225 Madison Avenue',
  'Midtown East',
  'Cultural',
  '2026-04-29',
  '19:00',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
  '$75 (members free)',
  NULL,
  4
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'The Polo Bar: Members Dinner',
  'Ralph Lauren''s midtown institution hosts its seasonal members dinner. Three courses, impeccable service, the kind of bread basket you think about for days. Dress code enforced. Conversation is elevated. The equestrian photography on the walls is not ironic.',
  'Ralph Lauren''s Polo Bar',
  '1 East 55th Street',
  'Midtown',
  'Dining & Nightlife',
  '2026-05-03',
  '19:30',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  'Members only — prix fixe $220 pp',
  NULL,
  5
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000001',
  'Frieze New York: Preview Evening',
  'The art world descends on Hudson Yards for the most important week of the New York calendar. The preview evening is by collector invitation only — a labyrinth of booths, art, deals, and people pretending to deliberate on a $40,000 work. Dress to be looked at. Bring a gallery bag.',
  'The Shed',
  '545 West 30th Street',
  'Hudson Yards',
  'Art & Galleries',
  '2026-05-07',
  '17:00',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
  'By invitation / $350',
  NULL,
  5
);

-- ─── LONDON ───────────────────────────────────────────────────────────────────

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000002',
  'White Cube Bermondsey: Private View',
  'The most coveted private view ticket in South London. New work by an artist who already has a waiting list. Warm white wine, hushed reverence, the quiet judgment of people who read frieze magazine for pleasure. Arrive with intent. Leave with a catalogue you''ll actually open.',
  'White Cube Bermondsey',
  '144–152 Bermondsey Street',
  'Bermondsey',
  'Art & Galleries',
  '2026-04-23',
  '18:30',
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80',
  'By invitation',
  NULL,
  5
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000002',
  'Claridge''s: An Evening in The Fumoir',
  'Claridge''s beloved black-and-gold bar hosts a cocktail tasting with the head bartender. Seven cocktails, each paired with a brief explanation you are not expected to remember. The ceiling is art deco. The bar cart is original. Dress accordingly.',
  'Claridge''s',
  'Brook Street',
  'Mayfair',
  'Hotel Bars & Lounges',
  '2026-04-30',
  '19:00',
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
  '£85 per person',
  NULL,
  4
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000002',
  'The London Library: Author in Conversation',
  'St James''s most storied institution opens its stacks to members and their guests for an evening with a novelist whose third book is currently on every intelligent person''s nightstand. Limited to 60 seats. Bring questions. Look like you''ve read it.',
  'The London Library',
  '14 St James''s Square',
  'St James''s',
  'Cultural',
  '2026-05-06',
  '18:30',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
  'Members & guests — £12',
  NULL,
  4
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000002',
  'Annabel''s: The Garden Opening',
  'Annabel''s reopens its legendary Mayfair garden for the season with a members'' evening that never appears on any public calendar. The flowers are real. The fur is not always. The music is better than it has any right to be. You will need to know someone.',
  'Annabel''s',
  '46 Berkeley Square',
  'Mayfair',
  'Members Clubs',
  '2026-05-10',
  '20:00',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Members only',
  NULL,
  5
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000002',
  'Rooftop at the OWO: Sundowner Series',
  'The Old War Office''s rooftop terrace launches its summer sundowner series with views across St James''s Park that make it almost impossible to be cynical. Aperitivo menu, house DJs you''ve not heard of yet, a crowd that is trying slightly too hard in entirely the right way.',
  'The OWO Rooftop Bar',
  'Horse Guards Avenue',
  'Westminster',
  'Rooftop & Outdoor',
  '2026-05-15',
  '18:00',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  '£25 minimum spend',
  NULL,
  3
);

-- ─── PARIS ────────────────────────────────────────────────────────────────────

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000003',
  'Galerie Perrotin: Vernissage',
  'Le Marais''s most impeccably staffed gallery opens a new solo show. The artist is represented by exactly the right people. The canapés are better than average. The guest list is shorter than it appears. Wear something with a considered collar and arrive at nine when things are actually good.',
  'Galerie Perrotin',
  '76 Rue de Turenne',
  'Le Marais',
  'Art & Galleries',
  '2026-04-23',
  '18:00',
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80',
  'Free — RSVP required',
  NULL,
  4
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000003',
  'Hôtel Costes: Dimanche Aperitif',
  'The legendary Sunday ritual at the Rue Saint-Honoré institution. The terrace fills by two. The playlist is unrepeatable. Everyone looks like they arrived from somewhere else and have nowhere else to be. One of the city''s great social performances — attend without irony.',
  'Hôtel Costes',
  '239 Rue Saint-Honoré',
  '1st arrondissement',
  'Hotel Bars & Lounges',
  '2026-04-27',
  '14:00',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  'Reservation recommended — no minimum',
  NULL,
  4
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000003',
  'Drouot: Vente aux Enchères — Bijoux & Mode',
  'Paris''s famous auction house holds its spring jewellery and fashion sale. Viewing is free; the bidding is not. Stand near the front. Look like you''ve done this before. Even if you don''t buy anything, you will have spent a Tuesday afternoon bidding on a Balenciaga archive piece from 1974.',
  'Hôtel Drouot',
  '9 Rue Drouot',
  '9th arrondissement',
  'Art & Galleries',
  '2026-04-25',
  '14:00',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
  'Free to view — buyer''s premium applies',
  NULL,
  4
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000003',
  'Musée d''Orsay: Une Soirée des Donateurs',
  'The museum opens after hours for its annual donors'' evening. Impressionist galleries lit differently than you''ve ever seen them. A quartet somewhere in the Salle des Fêtes. Dinner on the terrace overlooking the Seine at ten. This is one of the evenings Paris keeps for itself — but you can get in if you know how.',
  'Musée d''Orsay',
  '1 Rue de la Légion d''Honneur',
  '7th arrondissement',
  'Cultural',
  '2026-05-05',
  '19:30',
  'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
  '€120 (patrons gratuit)',
  NULL,
  5
);

INSERT INTO events (city_id, title, description, venue_name, venue_address, neighborhood, category, event_date, event_time, photo_url, price_range, ticket_url, vibe_difficulty)
VALUES (
  '11111111-0000-0000-0000-000000000003',
  'Palais Royal: Cocktails au Coucher du Soleil',
  'The gardens close to the public at dusk. The bar doesn''t. An aperitivo menu served under the arcades while the last light fades over the colonnades. Bring someone you want to impress or someone you already have. Either way, wear something they''ll remember.',
  'Le Grand Véfour',
  '17 Rue de Beaujolais',
  '1st arrondissement',
  'Rooftop & Outdoor',
  '2026-05-02',
  '19:00',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  '€35 minimum spend',
  NULL,
  3
);
