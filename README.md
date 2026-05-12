# Where To LARP

A location discovery site for the aspirational lifestyle LARPer. Find the most photogenic, old-money, and quietly luxurious spots in New York, London, and Paris — complete with outfit breakdowns, brand recommendations, and budget alternatives for each.

**Live concept:** [wheretolarp.com](https://wheretolarp.com)

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — custom champagne/navy/cream design system
- **Mapbox GL JS** — interactive location map with custom markers
- **Supabase** — PostgreSQL database with Row Level Security

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo>
cd wheretolarp
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...your_token_here
```

#### Where to get the Supabase keys
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to your users)
3. Once created, go to **Settings → API**
4. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Where to get the Mapbox token
1. Go to [mapbox.com](https://mapbox.com) and create a free account
2. Go to your **Account → Access tokens**
3. Copy the **Default public token** (starts with `pk.`)
4. Or create a new token scoped to your domain → `NEXT_PUBLIC_MAPBOX_TOKEN`

The free tier of Mapbox covers 50,000 map loads/month — more than enough to get started.

### 3. Set up the Supabase database

In your Supabase project, go to **SQL Editor** and run the two files in order:

**Step 1 — Create the schema:**
```sql
-- paste contents of supabase/schema.sql
```

**Step 2 — Seed the data:**
```sql
-- paste contents of supabase/seed.sql
```

Or use the Supabase CLI:
```bash
npx supabase db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with fonts and nav
│   ├── page.tsx                # Homepage (Hero + CitySelector)
│   ├── globals.css             # Tailwind + custom CSS
│   ├── city/[slug]/
│   │   ├── page.tsx            # Server component — fetches city + locations
│   │   └── CityPageClient.tsx  # Client component — split map/cards layout
│   └── api/submit-spot/
│       └── route.ts            # POST endpoint for spot submissions
├── components/
│   ├── Navigation.tsx          # Sticky nav with Submit a Spot
│   ├── Hero.tsx                # Full-viewport homepage hero
│   ├── CitySelector.tsx        # Three city cards on homepage
│   ├── LocationCard.tsx        # Individual spot card with photo + details
│   ├── WhatToWear.tsx          # Expandable outfit breakdown (Men/Women tabs)
│   ├── MapView.tsx             # Mapbox GL map with custom markers
│   ├── FilterBar.tsx           # Category filter pills
│   └── SubmitSpotModal.tsx     # Modal form for user submissions
└── lib/
    ├── supabase.ts             # Supabase client
    └── types.ts                # TypeScript interfaces
```

---

## Database Schema

### `cities`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | "New York" |
| slug | TEXT | "new-york" |
| country | TEXT | |
| tagline | TEXT | Hero tagline |
| hero_image | TEXT | URL |

### `locations`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| city_id | UUID | FK → cities |
| name | TEXT | |
| neighborhood | TEXT | |
| category | TEXT | One of 7 categories |
| description | TEXT | The LARP coaching copy |
| latitude | DECIMAL | |
| longitude | DECIMAL | |
| photo_url | TEXT | Unsplash URL |
| vibe_difficulty | INTEGER | 1–5 |
| what_to_wear | JSONB | Men/women outfit details |
| is_approved | BOOLEAN | Controls visibility |

### `submitted_spots`
Community submissions, reviewed before publishing.

---

## Aesthetic Categories

| Category | Vibe |
|----------|------|
| Old Money | Inherited wealth, no logos |
| Intellectual | Moneyed academia |
| Art World | Downtown cool, gallery energy |
| Continental | Grand hotel, civilised bar |
| Luxury Retail | The shopping street LARP |
| Power Lunch | Business dining, see-and-be-seen |
| Weekend Aristocrat | Aspirational leisure |

---

## Adding Photos

Location photos are sourced from [Unsplash](https://unsplash.com). The seed data uses category-generic placeholders. To add real location photos:

1. Find a relevant photo on Unsplash
2. Copy the photo ID from the URL: `https://unsplash.com/photos/[PHOTO_ID]`
3. Format: `https://images.unsplash.com/photo-[PHOTO_ID]?w=800&q=80`
4. Update the `photo_url` field in Supabase or in `seed.sql`

For production, consider uploading photos to Supabase Storage for performance.

---

## Adding New Cities

1. Insert a new row in the `cities` table
2. Add locations via SQL or the Supabase dashboard
3. Add the city center coordinates to `CITY_CENTERS` in `CityPageClient.tsx`
4. Add a city card to `CitySelector.tsx`
5. Add the slug to `generateStaticParams()` in `city/[slug]/page.tsx`

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Add environment variables in the Vercel dashboard under **Settings → Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

The app is fully static-compatible with `generateStaticParams` for the three city pages, so it deploys fast and scales for free on Vercel's hobby plan.

---

## Map Without a Token

If `NEXT_PUBLIC_MAPBOX_TOKEN` is not set, the map panel displays a tasteful placeholder and the rest of the app works normally. Add the token to unlock the interactive map.

---

## Contributing

Spots can be submitted via the **Submit a Spot** button. Submissions go into `submitted_spots` with `is_reviewed = false` and only appear publicly after manual review.

To review and approve submissions: use the Supabase dashboard to set `is_reviewed = true` on a submitted spot, then manually insert it into the `locations` table.
