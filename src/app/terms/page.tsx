import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Where To LARP',
  description: 'The terms and conditions for using Where To LARP.',
};

const LAST_UPDATED = 'May 13, 2026';
const CONTACT_EMAIL = 'wheretolarp@gmail.com';

export default function TermsPage() {
  return (
    <div className="bg-cream min-h-screen pt-nav">
      {/* Header */}
      <div className="bg-ink border-b border-champagne/20">
        <div className="rule-champagne-dim" />
        <div className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
          <p className="eyebrow mb-5 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-champagne/50" />
            The Fine Print
          </p>
          <h1 className="headline-editorial text-cream text-5xl sm:text-7xl">
            Terms of <span className="italic text-champagne">service</span>.
          </h1>
          <p className="font-sans text-cream/40 text-xs mt-6 tracking-[0.15em] uppercase">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Body */}
      <article className="max-w-3xl mx-auto px-6 py-14 prose-legal">
        <p>
          Welcome to Where To LARP (&ldquo;<strong>Where To LARP</strong>,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern
          your access to and use of the Where To LARP website, including any content, functionality,
          and services offered on or through <Link href="/">wheretolarp.com</Link> (the
          &ldquo;Service&rdquo;). Please read these Terms carefully before using the Service.
        </p>

        <h2>1. Acceptance of these Terms</h2>
        <p>
          By accessing or using the Service, you agree to be bound by these Terms and our{' '}
          <Link href="/privacy">Privacy Policy</Link>. If you do not agree to these Terms, you may not
          access or use the Service.
        </p>

        <h2>2. The Service</h2>
        <p>
          Where To LARP is a location-discovery platform that helps users find photogenic and
          aspirational venues, events, and social spaces in selected cities, along with related
          editorial content such as outfit suggestions. Content is provided for general informational
          and entertainment purposes only. We do not own, operate, endorse, or guarantee access to any
          venue or event listed on the Service, and listings may be inaccurate, incomplete, or out of
          date.
        </p>

        <h2>3. Eligibility</h2>
        <p>
          You must be at least 13 years old (or the minimum age required to consent to the processing
          of personal data in your jurisdiction) to use the Service. By using the Service you represent
          that you meet this requirement and that you have the legal capacity to enter into these
          Terms.
        </p>

        <h2>4. Accounts</h2>
        <p>
          Some features require an account. You may create one using a supported sign-in method (such
          as Google) or with an email and password. You are responsible for maintaining the
          confidentiality of your credentials and for all activity that occurs under your account. You
          agree to provide accurate information and to keep it up to date. Notify us promptly of any
          unauthorized use of your account.
        </p>

        <h2>5. User content and conduct</h2>
        <p>
          The Service may let you submit spots, messages, profile information, images, and other
          content (&ldquo;User Content&rdquo;). You retain ownership of your User Content, but you grant
          us a worldwide, non-exclusive, royalty-free license to host, store, reproduce, display, and
          distribute it for the purpose of operating and improving the Service.
        </p>
        <p>You agree not to:</p>
        <ul>
          <li>post content that is unlawful, defamatory, harassing, hateful, or infringing;</li>
          <li>impersonate any person or entity, or misrepresent your affiliation;</li>
          <li>upload viruses, scrape the Service at scale, or otherwise interfere with its operation;</li>
          <li>use the Service to violate the rights or privacy of others;</li>
          <li>attempt to gain unauthorized access to any part of the Service or its systems.</li>
        </ul>
        <p>
          We may remove User Content and suspend or terminate accounts that violate these Terms, at our
          discretion.
        </p>

        <h2>6. Paid features</h2>
        <p>
          Certain optional features may be offered for a fee. Payments are processed by our third-party
          payment processor (Stripe); we do not store full payment card details. Unless required by
          law or stated otherwise at the point of purchase, fees are non-refundable. We may change the
          pricing or availability of paid features at any time.
        </p>

        <h2>7. Intellectual property</h2>
        <p>
          The Service and its original content (excluding User Content), features, and functionality
          are and will remain the exclusive property of Where To LARP and its licensors, and are
          protected by copyright, trademark, and other laws. You may not copy, modify, distribute, or
          create derivative works from the Service without our prior written permission.
        </p>

        <h2>8. Third-party services and links</h2>
        <p>
          The Service relies on and links to third-party services and websites (including, among
          others, Google, Stripe, Mapbox, and mapping providers). We are not responsible for the
          content, policies, or practices of any third party. Your use of those services is governed by
          their own terms and privacy policies.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis,
          without warranties of any kind, whether express or implied, including but not limited to
          implied warranties of merchantability, fitness for a particular purpose, non-infringement, or
          accuracy. We do not warrant that the Service will be uninterrupted, secure, or error-free, or
          that any information on it is accurate or reliable.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Where To LARP and its officers, employees, and agents
          will not be liable for any indirect, incidental, special, consequential, or punitive damages,
          or for any loss of profits, data, goodwill, or other intangible losses, arising out of or
          relating to your use of (or inability to use) the Service. Our total liability for any claim
          relating to the Service will not exceed the greater of the amount you paid us in the twelve
          months preceding the claim or USD 50.
        </p>

        <h2>11. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Where To LARP from any claims, damages, liabilities,
          and expenses (including reasonable legal fees) arising out of your use of the Service, your
          User Content, or your violation of these Terms.
        </p>

        <h2>12. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time, with or without notice,
          for any reason, including if we believe you have violated these Terms. You may stop using the
          Service and delete your account at any time. Provisions that by their nature should survive
          termination will survive.
        </p>

        <h2>13. Changes to these Terms</h2>
        <p>
          We may revise these Terms from time to time. If we make material changes, we will update the
          &ldquo;Last updated&rdquo; date above and, where appropriate, provide additional notice. Your
          continued use of the Service after changes take effect constitutes acceptance of the revised
          Terms.
        </p>

        <h2>14. Governing law</h2>
        <p>
          These Terms are governed by and construed in accordance with applicable law, without regard
          to conflict-of-law principles. Any disputes will be subject to the exclusive jurisdiction of
          the competent courts in our place of business.
        </p>

        <h2>15. Contact</h2>
        <p>
          Questions about these Terms? Contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <p className="text-charcoal/40 text-sm mt-10">
          See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </article>
    </div>
  );
}
