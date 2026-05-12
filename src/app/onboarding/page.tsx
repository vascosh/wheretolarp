import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import OnboardingClient from './OnboardingClient';

export const metadata = { title: 'Welcome — Where To LARP' };

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/onboarding');

  const { data: profile } = await supabase
    .from('users')
    .select('name, avatar_url, username, onboarded')
    .eq('id', session.user.id)
    .single();

  // Already onboarded → go to profile
  if (profile?.onboarded) redirect('/profile');

  return (
    <OnboardingClient
      userId={session.user.id}
      initialName={profile?.name ?? session.user.name ?? ''}
      initialAvatar={profile?.avatar_url ?? session.user.image ?? ''}
    />
  );
}
