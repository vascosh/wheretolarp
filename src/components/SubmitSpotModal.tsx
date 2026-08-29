'use client';

import { useState } from 'react';
import type { Category } from '@/lib/types';

interface SubmitSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: Category[] = [
  'Old Money',
  'Intellectual',
  'Art World',
  'Continental',
  'Hotel Lobby',
  'Luxury Retail',
  'Power Lunch',
  'Weekend Aristocrat',
  'Rooftop Bar',
];

interface FormState {
  name: string;
  city: string;
  neighborhood: string;
  category: string;
  description: string;
  address: string;
  submitter_name: string;
  submitter_email: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  city: '',
  neighborhood: '',
  category: '',
  description: '',
  address: '',
  submitter_name: '',
  submitter_email: '',
};

const THANK_YOU_MESSAGE =
  'Received. The register is reviewed by hand — if the spot passes muster, it appears in next week’s update.';

const INPUT_CLASS =
  'w-full border border-forest/20 bg-parchment-light px-3.5 py-2.5 font-sans text-base text-peat placeholder:text-peat/35 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest';

export default function SubmitSpotModal({ isOpen, onClose, onSuccess }: SubmitSpotModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.city || !form.description.trim()) {
      setError('The register requires a name, a city, and a description.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/submit-spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The proposal did not go through. Try again.');

      setSuccessMessage(data.message || THANK_YOU_MESSAGE);
      setSubmitted(true);
      setForm(INITIAL_FORM);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The proposal did not go through. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setSubmitted(false);
    setSuccessMessage('');
    setError('');
    setForm(INITIAL_FORM);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-peat/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border border-forest/25 bg-parchment-light text-peat shadow-modal animate-scale-in">
        <div className="rule-champagne shrink-0" />
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-forest/15 bg-parchment-dark/50 px-5 pt-6 pb-6 sm:px-8">
          <div>
            <p className="eyebrow mb-3">For the Register</p>
            <h2 className="headline-editorial text-3xl sm:text-4xl">
              Propose a <em className="italic text-gold-dark">spot</em>.
            </h2>
          </div>
          <button onClick={handleClose} aria-label="Close" className="-mr-1 -mt-1 p-1 text-peat/40 transition-colors hover:text-burgundy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-gold/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-forest">
                  <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="eyebrow-muted mb-3">Noted</p>
              <h3 className="headline-editorial mb-4 text-3xl">Entry <em className="italic text-gold-dark">received</em>.</h3>
              <p className="mx-auto mb-7 max-w-sm font-sans text-sm leading-relaxed text-peat/65">
                {successMessage || THANK_YOU_MESSAGE}
              </p>
              <button onClick={handleClose} className="btn-editorial">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="border border-burgundy/30 bg-burgundy/5 px-4 py-3 font-sans text-xs text-burgundy">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="spot-name" className="eyebrow-muted mb-2 block">
                  Spot Name <span className="text-gold-dark">*</span>
                </label>
                <input id="spot-name" type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g., The Carlyle Bemelmans Bar"
                  className={INPUT_CLASS} />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="spot-city" className="eyebrow-muted mb-2 block">
                    City <span className="text-gold-dark">*</span>
                  </label>
                  <select id="spot-city" name="city" value={form.city} onChange={handleChange}
                    className={INPUT_CLASS}>
                    <option value="">Select city</option>
                    <option value="New York">New York</option>
                    <option value="London">London</option>
                    <option value="Miami">Miami</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="spot-category" className="eyebrow-muted mb-2 block">
                    Category
                  </label>
                  <select id="spot-category" name="category" value={form.category} onChange={handleChange}
                    className={INPUT_CLASS}>
                    <option value="">Select type</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="spot-address" className="eyebrow-muted mb-2 block">
                  Address
                </label>
                <input id="spot-address" type="text" name="address" value={form.address} onChange={handleChange}
                  placeholder="e.g., 35 East 76th Street, New York"
                  className={INPUT_CLASS} />
              </div>

              <div>
                <label htmlFor="spot-neighborhood" className="eyebrow-muted mb-2 block">
                  Neighborhood
                </label>
                <input id="spot-neighborhood" type="text" name="neighborhood" value={form.neighborhood} onChange={handleChange}
                  placeholder="e.g., Upper East Side"
                  className={INPUT_CLASS} />
              </div>

              <div>
                <label htmlFor="spot-description" className="eyebrow-muted mb-2 block">
                  Why is this spot aspirational? <span className="text-gold-dark">*</span>
                </label>
                <textarea id="spot-description" name="description" value={form.description} onChange={handleChange}
                  placeholder="What makes this the perfect LARP venue? Be specific."
                  rows={4}
                  className={`${INPUT_CLASS} resize-none`} />
              </div>

              <div className="border-t border-forest/15 pt-5">
                <p className="mb-4 font-sans text-xs italic text-peat/50">Optional — in case the Society has questions</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="spot-submitter-name" className="eyebrow-muted mb-2 block">Your Name</label>
                    <input id="spot-submitter-name" type="text" name="submitter_name" value={form.submitter_name} onChange={handleChange}
                      placeholder="Optional"
                      className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label htmlFor="spot-submitter-email" className="eyebrow-muted mb-2 block">Your Email</label>
                    <input id="spot-submitter-email" type="email" name="submitter_email" value={form.submitter_email} onChange={handleChange}
                      placeholder="Optional"
                      className={INPUT_CLASS} />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting}
                  className="btn-editorial w-full disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting ? 'Submitting…' : 'Propose for Review'}
                </button>
                <p className="mt-3 text-center font-sans text-xs italic text-peat/50">
                  Every proposal is reviewed by hand.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
