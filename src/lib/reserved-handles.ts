/**
 * Handles that conflict with our routes or core identifiers. The
 * username-check endpoint and the profile PATCH both refuse these
 * so a user can't claim `/u/admin`, `/u/settings`, etc.
 *
 * Keep in sync with: top-level routes in src/app/, plus a few common
 * defensive picks (admin, support, help, about, etc.).
 */
export const RESERVED_HANDLES = new Set<string>([
  // app routes
  'u', 'feed', 'portfolio', 'profile', 'settings', 'challenges',
  'leaderboard', 'city', 'invite', 'terms', 'privacy', 'onboarding',
  'auth', 'api',
  // common app actions
  'login', 'signin', 'signup', 'logout', 'signout', 'register',
  // identity / org
  'admin', 'administrator', 'root', 'system', 'support', 'help',
  'about', 'contact', 'home', 'dashboard', 'app', 'me', 'you',
  'wheretolarp', 'larp', 'staff', 'official',
]);

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle.trim().toLowerCase());
}
