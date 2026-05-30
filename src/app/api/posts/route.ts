import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/posts — Instagram-style feed.
 *
 * Visibility rules:
 *   - own posts: always
 *   - friend (mutual / accepted friendship) posts: visible
 *   - public_profile = true: visible to everyone
 *
 * Ranking (no hashtags, lightweight score):
 *   score = (isFriend ? 50 : 0)
 *         - hoursSincePost * 0.3
 *         + log(1 + likeCount) * 3
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  let friendIds: string[] = [];
  if (userId) {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id, status')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');
    friendIds = (friendships ?? []).map((f) =>
      f.user_id === userId ? f.friend_id : f.user_id
    );
  }

  // Pull a recent window of posts joined with their author. We post-filter
  // visibility in JS to keep the query simple (Supabase's .or() with joined
  // tables is fiddly).
  const { data: rawPosts, error } = await supabase
    .from('posts')
    .select(
      `id, user_id, image_url, media_type, caption, city_slug, location_name,
       location_lat, location_lng, location_place_id,
       like_count, share_count, created_at,
       users:user_id ( id, name, username, avatar_url, public_profile )`
    )
    .order('created_at', { ascending: false })
    .limit(150);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const visible = (rawPosts ?? []).filter((p: any) => {
    const owner = p.users;
    if (!owner) return false;
    if (owner.public_profile) return true;
    if (userId && p.user_id === userId) return true;
    if (userId && friendIds.includes(p.user_id)) return true;
    return false;
  });

  // Which of those has the viewer liked?
  let likedSet = new Set<string>();
  if (userId && visible.length > 0) {
    const postIds = visible.map((p: any) => p.id);
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);
    likedSet = new Set((likes ?? []).map((l) => l.post_id));
  }

  const now = Date.now();
  const scored = visible.map((p: any) => {
    const ageHours = (now - new Date(p.created_at).getTime()) / 3.6e6;
    const isFriend = userId ? friendIds.includes(p.user_id) : false;
    const score =
      (isFriend ? 50 : 0)
      - ageHours * 0.3
      + Math.log(1 + (p.like_count || 0)) * 3;
    return { p, score, isFriend };
  });
  scored.sort((a, b) => b.score - a.score);

  const feed = scored.slice(0, 30).map(({ p, isFriend }: any) => ({
    id: p.id,
    image_url: p.image_url,
    media_type: (p.media_type as 'image' | 'video') ?? 'image',
    caption: p.caption,
    city_slug: p.city_slug,
    location_name: p.location_name,
    location_lat: p.location_lat,
    location_lng: p.location_lng,
    location_place_id: p.location_place_id,
    like_count: p.like_count ?? 0,
    share_count: p.share_count ?? 0,
    created_at: p.created_at,
    liked: likedSet.has(p.id),
    is_friend: isFriend,
    is_own: userId === p.user_id,
    author: {
      id: p.users.id,
      name: p.users.name,
      username: p.users.username,
      avatar_url: p.users.avatar_url,
      public: !!p.users.public_profile,
    },
  }));

  return NextResponse.json({ posts: feed });
}

/**
 * POST /api/posts — create a post.
 * Body: { image_url, caption?, city_slug?, location_name? }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const image_url: string | undefined = body.image_url;
  const media_type: 'image' | 'video' = body.media_type === 'video' ? 'video' : 'image';
  const caption: string | undefined = body.caption;
  const city_slug: string | undefined = body.city_slug;
  const location_name: string | undefined = body.location_name;
  const location_lat: number | undefined = typeof body.location_lat === 'number' ? body.location_lat : undefined;
  const location_lng: number | undefined = typeof body.location_lng === 'number' ? body.location_lng : undefined;
  const location_place_id: string | undefined = body.location_place_id;

  if (!image_url || typeof image_url !== 'string') {
    return NextResponse.json({ error: 'image_url required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: session.user.id,
      image_url,
      media_type,
      caption: caption?.slice(0, 2200) ?? null,
      city_slug: city_slug ?? null,
      location_name: location_name?.slice(0, 200) ?? null,
      location_lat: location_lat ?? null,
      location_lng: location_lng ?? null,
      location_place_id: location_place_id ?? null,
    })
    .select('id')
    .single();

  if (error) {
    // Surface common setup misses more clearly:
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json(
        { error: "The `posts` table doesn't exist yet — run supabase/posts_schema.sql in the SQL editor." },
        { status: 500 }
      );
    }
    if (/violates foreign key/i.test(error.message)) {
      return NextResponse.json(
        { error: 'Your user record is missing or stale — try signing out and back in.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
