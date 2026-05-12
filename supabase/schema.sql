-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  tagline TEXT,
  hero_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  neighborhood TEXT,
  category TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  photo_url TEXT,
  vibe_difficulty INTEGER CHECK (vibe_difficulty BETWEEN 1 AND 5),
  what_to_wear JSONB,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submitted_spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  category TEXT,
  description TEXT,
  submitter_name TEXT,
  submitter_email TEXT,
  is_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_locations_city_id ON locations(city_id);
CREATE INDEX idx_locations_category ON locations(category);

-- RLS policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE submitted_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Allow public read on approved locations" ON locations FOR SELECT USING (is_approved = true);
CREATE POLICY "Allow public insert on submitted_spots" ON submitted_spots FOR INSERT WITH CHECK (true);
