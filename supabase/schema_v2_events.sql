-- Events table — for time-bound happenings: gallery openings, cocktail evenings, galas, etc.
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  neighborhood TEXT,
  category TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,           -- e.g. '19:30'
  photo_url TEXT,
  price_range TEXT,          -- e.g. 'Free', '£65 pp', 'By invitation', '$350'
  ticket_url TEXT,
  vibe_difficulty INTEGER CHECK (vibe_difficulty BETWEEN 1 AND 5) DEFAULT 3,
  what_to_wear JSONB,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_city_id ON events(city_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on approved events"
  ON events FOR SELECT USING (is_approved = true);

CREATE POLICY "Allow public insert on events"
  ON events FOR INSERT WITH CHECK (true);
