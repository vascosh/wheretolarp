import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: user } = await supabase
          .from('users')
          .select('id, email, name, avatar_url, password_hash')
          .eq('email', credentials.email)
          .single();

        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Check if user already exists (they may have a custom name/avatar)
        const { data: existing } = await supabase
          .from('users')
          .select('id, avatar_url')
          .eq('email', user.email!)
          .maybeSingle();

        if (existing) {
          // User exists — never overwrite their customised name or avatar
        } else {
          // Brand new user — seed with Google name/avatar, mark as needing onboarding
          const { error } = await supabase.from('users').insert({
            email: user.email!,
            name: user.name,
            avatar_url: user.image,
            onboarded: false,
          });
          if (error) console.error('[auth] supabase insert error:', error);
        }
      }
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account, trigger, session: sessionData }: any) {
      try {
        // Handle client-side session updates (e.g. avatar change, name change)
        if (trigger === 'update' && sessionData) {
          if (sessionData.image !== undefined) token.picture = sessionData.image;
          if (sessionData.name !== undefined) token.name = sessionData.name;
        }

        // On first sign-in, user object is present
        if (user) {
          if (account?.provider === 'google') {
            // Google ID is numeric — fetch the actual Supabase UUID + stored name/avatar
            const { data } = await supabase
              .from('users')
              .select('id, avatar_url, name')
              .eq('email', user.email!)
              .single();
            token.userId = data?.id ?? user.id;
            // Use the Supabase name/avatar (may be customised) rather than Google's
            if (data?.name) token.name = data.name;
            if (data?.avatar_url) token.picture = data.avatar_url;
          } else {
            token.userId = user.id;
            // For credentials users, use the DB avatar_url (already set in authorize())
            if (user.image) token.picture = user.image;
          }
        }
        // Fallback: if stored userId isn't a UUID (e.g. old Google sessions), re-fetch once
        const stored = token.userId as string | undefined;
        const isUUID = stored
          ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(stored)
          : false;
        if (!isUUID && token.email) {
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('email', token.email as string)
            .single();
          if (data?.id) token.userId = data.id;
        }
      } catch (err) {
        console.error('[jwt] error:', err);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      if (token.picture) session.user.image = token.picture as string;
      if (token.name) session.user.name = token.name as string;
      return session;
    },
  },
};
