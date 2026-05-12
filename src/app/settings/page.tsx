import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/settings');

  const { data: profile } = await supabase
    .from('users')
    .select('name, bio, avatar_url, username, show_email, public_profile, notify_invites, notify_friends')
    .eq('id', session.user.id)
    .single();

  return (
    <SettingsClient
      user={{
        id: session.user.id,
        email: session.user.email ?? '',
        name: profile?.name ?? session.user.name ?? '',
        bio: profile?.bio ?? '',
        image: profile?.avatar_url ?? session.user.image ?? '',
        username: profile?.username ?? null,
        showEmail: profile?.show_email ?? true,
        publicProfile: profile?.public_profile ?? false,
        notifyInvites: profile?.notify_invites ?? true,
        notifyFriends: profile?.notify_friends ?? true,
      }}
    />
  );
}
