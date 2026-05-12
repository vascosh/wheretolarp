export type Category =
  | 'Old Money'
  | 'Intellectual'
  | 'Art World'
  | 'Continental'
  | 'Luxury Retail'
  | 'Power Lunch'
  | 'Weekend Aristocrat'
  | 'Hotel Lobby'
  | 'Rooftop Bar';

export type EventCategory =
  | 'Art & Galleries'
  | 'Dining & Nightlife'
  | 'Hotel Bars & Lounges'
  | 'Cultural'
  | 'Members Clubs'
  | 'Rooftop & Outdoor';

export interface OutfitDetails {
  brands: string[];
  outfit: {
    top: string;
    bottom: string;
    shoes: string;
    bag: string;
    accessories: string;
  };
  color_palette: string;
  budget_dupe: string;
}

export interface WhatToWear {
  men: OutfitDetails;
  women: OutfitDetails;
}

export interface Location {
  id: string;
  city_id: string;
  name: string;
  neighborhood: string;
  address?: string | null;
  category: Category;
  description: string;
  latitude: number;
  longitude: number;
  photo_url: string;
  vibe_difficulty: number;
  what_to_wear: WhatToWear;
  is_approved: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  city_id: string;
  title: string;
  description: string | null;
  venue_name: string;
  venue_address: string | null;
  neighborhood: string | null;
  category: EventCategory;
  event_date: string; // YYYY-MM-DD
  event_time: string | null; // HH:MM
  photo_url: string | null;
  price_range: string | null;
  ticket_url: string | null;
  vibe_difficulty: number;
  what_to_wear: WhatToWear | null;
  is_approved: boolean;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
  tagline: string;
  hero_image: string;
}
