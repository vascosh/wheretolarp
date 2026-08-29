import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Where To LARP',
  description: 'How Where To LARP collects, uses, and protects your personal information.',
};

const LAST_UPDATED = 'May 13, 2026';
const CONTACT_EMAIL = 'wheretolarp@gmail.com';

export default function PrivacyPage() {
  return (
    <div className="bg-parchment min-h-screen pt-nav">
      {/* Header */}
      <div className="bg-parchment-dark/60 border-b border-gold/20">
        <div className="rule-champagne-dim" />
        <div className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
          <p className="eyebrow mb-5 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-gold/50" />
            In Confidence
          </p>
          <h1 className="headline-editorial text-5xl sm:text-7xl">
            Privacy <span className="italic text-gold-dark">policy</span>.
          </h1>
          <p className="font-sans text-peat/50 text-xs mt-6 tracking-[0.15em] uppercase">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Body */}
      <article className="max-w-3xl mx-auto px-6 py-14 prose-legal">
        <p>
          This Privacy Policy explains how Where To LARP (&ldquo;<strong>Where To LARP</strong>,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, shares, and
          protects information about you when you use <Link href="/">wheretolarp.com</Link> (the
          &ldquo;Service&rdquo;). By using the Service, you agree to the practices described here and in
          our <Link href="/terms">Terms of Service</Link>.
        </p>

        <h2>1. Information we collect</h2>
        <p>We collect the following categories of information:</p>
        <ul>
          <li>
            <strong>Account information.</strong> When you sign up — whether with Google or with an
            email and password — we receive identifiers such as your name, email address, and (if you
            sign in with Google) your Google profile picture and account ID. If you create a password,
            we store it only in hashed form.
          </li>
          <li>
            <strong>Profile and user content.</strong> Information you choose to add, such as a
            username, avatar, profile details, spots you submit, plans, friends/follows, leaderboard
            activity, and messages you send to other users.
          </li>
          <li>
            <strong>Payment information.</strong> If you purchase a paid feature, our payment processor
            (Stripe) collects and processes your payment details. We do not receive or store full
            payment card numbers; we receive limited transaction metadata (e.g., that a payment
            succeeded).
          </li>
          <li>
            <strong>Usage and device data.</strong> Standard log and analytics data such as IP
            address, browser type, pages viewed, and timestamps, collected automatically when you use
            the Service.
          </li>
          <li>
            <strong>Cookies.</strong> We use strictly necessary cookies to keep you signed in and to
            maintain session security. See &ldquo;Cookies&rdquo; below.
          </li>
        </ul>

        <h2>2. How we use information</h2>
        <ul>
          <li>to provide, operate, maintain, and improve the Service;</li>
          <li>to create and manage your account and authenticate you;</li>
          <li>to enable social features such as friends, follows, messaging, plans, and leaderboards;</li>
          <li>to process payments for optional paid features;</li>
          <li>to generate certain content features (for example, AI-assisted suggestions), which may involve sending non-identifying prompt text to an AI provider;</li>
          <li>to communicate with you about the Service, including service-related notices;</li>
          <li>to detect, prevent, and address fraud, abuse, security issues, and violations of our Terms;</li>
          <li>to comply with legal obligations.</li>
        </ul>

        <h2>3. Google user data</h2>
        <p>
          If you sign in with Google, we request only basic profile information (your name, email
          address, profile picture, and Google account identifier) for the sole purpose of creating and
          authenticating your account. Where To LARP&apos;s use of information received from Google APIs
          adheres to the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. We do not use Google user data for advertising, and
          we do not sell it.
        </p>

        <h2>4. How we share information</h2>
        <p>We do not sell your personal information. We share it only as follows:</p>
        <ul>
          <li>
            <strong>Service providers (processors).</strong> We use trusted third parties to run the
            Service, including: Supabase (database and storage), Vercel (hosting), Stripe (payments),
            Google (authentication), Mapbox and mapping providers (maps), and an AI provider (content
            features). These providers process data on our behalf under their own terms.
          </li>
          <li>
            <strong>Other users.</strong> Profile information you make public (such as your username
            and avatar), spots you submit, and messages you send are visible to other users as part of
            the Service&apos;s social features.
          </li>
          <li>
            <strong>Legal and safety.</strong> We may disclose information if required by law, legal
            process, or to protect the rights, property, or safety of Where To LARP, our users, or
            others.
          </li>
          <li>
            <strong>Business transfers.</strong> If we are involved in a merger, acquisition, or sale
            of assets, your information may be transferred as part of that transaction.
          </li>
        </ul>

        <h2>5. Cookies</h2>
        <p>
          We use cookies that are strictly necessary for the Service to function — primarily session
          and authentication cookies set by our login system (NextAuth) — and, where applicable, CSRF
          protection cookies. We do not use third-party advertising cookies. You can block or delete
          cookies in your browser settings, but the Service may not work properly without the necessary
          ones.
        </p>

        <h2>6. Data retention</h2>
        <p>
          We retain personal information for as long as your account is active or as needed to provide
          the Service, comply with legal obligations, resolve disputes, and enforce our agreements.
          When you delete your account, we delete or anonymize the associated personal information
          within a reasonable period, except where we are required or permitted by law to retain it.
        </p>

        <h2>7. Your rights and choices</h2>
        <ul>
          <li>
            <strong>Access and update.</strong> You can view and update much of your information in
            your account settings.
          </li>
          <li>
            <strong>Deletion.</strong> You can delete your account at any time from your settings,
            which removes your personal information as described above. You may also contact us to
            request deletion.
          </li>
          <li>
            <strong>Other rights.</strong> Depending on where you live, you may have additional rights
            under laws such as the GDPR or CCPA — for example, to access, correct, port, restrict, or
            object to certain processing of your data. Contact us to exercise these rights.
          </li>
        </ul>

        <h2>8. Security</h2>
        <p>
          We take reasonable technical and organizational measures to protect your information,
          including encryption in transit, hashed passwords, and access controls. However, no method of
          transmission or storage is completely secure, and we cannot guarantee absolute security.
        </p>

        <h2>9. Children&apos;s privacy</h2>
        <p>
          The Service is not directed to children under 13, and we do not knowingly collect personal
          information from them. If you believe a child has provided us with personal information,
          please contact us and we will take steps to delete it.
        </p>

        <h2>10. International users</h2>
        <p>
          We and our service providers may process and store your information in countries other than
          the one in which you live. By using the Service, you consent to the transfer of your
          information to those countries, which may have different data-protection laws than your own.
        </p>

        <h2>11. Changes to this Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will
          update the &ldquo;Last updated&rdquo; date above and, where appropriate, provide additional
          notice. Your continued use of the Service after the changes take effect constitutes
          acceptance of the updated Policy.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions or requests regarding this Privacy Policy or your personal information? Contact us
          at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <p className="text-charcoal/40 text-sm mt-10">
          See also our <Link href="/terms">Terms of Service</Link>.
        </p>
      </article>
    </div>
  );
}
