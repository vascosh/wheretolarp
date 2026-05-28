-- Feed: posts + likes (run once in the Supabase SQL editor).
-- Visibility is enforced in API routes via the service-role key, so RLS just
-- blocks direct anon/auth access here.

create extension if not exists "uuid-ossp";

create table if not exists posts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references users(id) on delete cascade not null,
  image_url     text not null, -- (kept name for back-compat — stores image OR video URL)
  media_type    text default 'image', -- 'image' | 'video'
  caption       text,
  city_slug     text,
  location_name text,
  location_lat  double precision,
  location_lng  double precision,
  location_place_id text,
  like_count    integer default 0,
  share_count   integer default 0,
  created_at    timestamptz default now()
);

-- For tables that pre-date video support, add the new columns idempotently:
alter table posts add column if not exists media_type text default 'image';
alter table posts add column if not exists location_lat double precision;
alter table posts add column if not exists location_lng double precision;
alter table posts add column if not exists location_place_id text;

create index if not exists idx_posts_user    on posts(user_id);
create index if not exists idx_posts_created on posts(created_at desc);

alter table posts enable row level security;

create table if not exists post_likes (
  post_id    uuid references posts(id) on delete cascade,
  user_id    uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_post_likes_post on post_likes(post_id);
create index if not exists idx_post_likes_user on post_likes(user_id);

alter table post_likes enable row level security;

-- Keep like_count accurate via trigger so the API doesn't have to race.
create or replace function update_post_like_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set like_count = like_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set like_count = greatest(0, like_count - 1) where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_post_likes_count on post_likes;
create trigger trg_post_likes_count
after insert or delete on post_likes
for each row execute function update_post_like_count();

-- Also: in Supabase dashboard, create a storage bucket called "posts"
-- with public read access. Uploads go to "{userId}/{timestamp}.{ext}".
