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
      <div className="min-h-screen flex items-center justify-center bg-parchment px-4 text-peat">
        <div className="text-center max-w-md">
          <p className="eyebrow mb-5">Off the Register</p>
          <h1 className="headline-editorial text-4xl sm:text-5xl mb-4">
            Invitation not <em className="italic text-gold-dark">found</em>.
          </h1>
          <p className="font-sans text-peat/60 text-sm leading-relaxed">This summons has expired, or never existed.</p>
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
