import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import InviteClient from './InviteClient';

export default async function InvitePage({ params }: { params: { token: string } }) {
  const session = await getServerSession(authOptions);

  const { data: invite } = await supabase
    .from('plan_invites')
    .select('id, plan_id, inviter_id, status, token')
    .eq('token', params.token)
    .single();

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #070f1a 0%, #0a1628 60%, #060d18 100%)' }}>
        <div className="text-center">
          <h1 className="font-serif text-cream text-3xl mb-3">Invite Not Found</h1>
          <p className="font-sans text-cream/40 text-sm">This invite link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const [{ data: plan }, { data: inviter }] = await Promise.all([
    supabase
      .from('larp_plans')
      .select('spot_name, spot_neighborhood, spot_category, spot_description, plan_date, plan_time')
      .eq('id', invite.plan_id)
      .single(),
    supabase
      .from('users')
      .select('name, avatar_url')
      .eq('id', invite.inviter_id)
      .single(),
  ]);

  return (
    <InviteClient
      token={params.token}
      plan={plan ?? { spot_name: 'Unknown', spot_neighborhood: null, spot_category: null, spot_description: null, plan_date: '', plan_time: null }}
      inviter={{ name: inviter?.name ?? 'Someone', avatar_url: inviter?.avatar_url ?? null }}
      status={invite.status}
      isLoggedIn={!!session?.user?.id}
      isOwnInvite={invite.inviter_id === session?.user?.id}
    />
  );
}
