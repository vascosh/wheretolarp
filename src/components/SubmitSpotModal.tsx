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
  "Thank you for your submission! Keep your eyes peeled for next week's location update...maybe your submission makes the cut!";

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
      setError('Spot name, city, and description are required.');
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
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setSuccessMessage(data.message || THANK_YOU_MESSAGE);
      setSubmitted(true);
      setForm(INITIAL_FORM);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 bg-cream w-full max-w-lg shadow-modal overflow-hidden max-h-[90vh] flex flex-col animate-scale-in"
        style={{ border: '1px solid rgba(201,169,110,0.3)' }}>
        {/* Header */}
        <div className="bg-ink px-5 sm:px-8 pt-6 pb-6 flex items-start justify-between shrink-0 border-b border-champagne/20">
          <div>
            <p className="eyebrow mb-3">For the Register</p>
            <h2 className="headline-editorial text-cream text-3xl sm:text-4xl">
              Submit a <span className="italic text-champagne">spot</span>.
            </h2>
          </div>
          <button onClick={handleClose} aria-label="Close" className="text-cream/30 hover:text-champagne transition-colors p-1 -mr-1 -mt-1">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-8">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full border border-champagne/40 bg-champagne/10 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-champagne-dark">
                  <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="eyebrow-muted mb-3">Noted</p>
              <h3 className="headline-editorial text-navy text-3xl mb-4">Submission <span className="italic text-champagne-dark">received</span>.</h3>
              <p className="font-sans text-charcoal/70 text-sm leading-relaxed mb-7 max-w-sm mx-auto">
                {successMessage || THANK_YOU_MESSAGE}
              </p>
              <button onClick={handleClose} className="btn-editorial">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="spot-name" className="block eyebrow-muted text-charcoal/55 mb-2">
                  Spot Name <span className="text-champagne-dark">*</span>
                </label>
                <input id="spot-name" type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g., The Carlyle Bemelmans Bar"
                  className="w-full bg-transparent border-b border-charcoal/20 px-1 py-2.5 text-base font-sans text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-champagne-dark transition-colors" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="spot-city" className="block eyebrow-muted text-charcoal/55 mb-2">
                    City <span className="text-champagne-dark">*</span>
                  </label>
                  <select id="spot-city" name="city" value={form.city} onChange={handleChange}
                    className="w-full bg-transparent border-b border-charcoal/20 px-1 py-2.5 text-base font-sans text-charcoal focus:outline-none focus:border-champagne-dark transition-colors">
                    <option value="">Select city</option>
                    <option value="New York">New York</option>
                    <option value="London">London</option>
                    <option value="Miami">Miami</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="spot-category" className="block eyebrow-muted text-charcoal/55 mb-2">
                    Category
                  </label>
                  <select id="spot-category" name="category" value={form.category} onChange={handleChange}
                    className="w-full bg-transparent border-b border-charcoal/20 px-1 py-2.5 text-base font-sans text-charcoal focus:outline-none focus:border-champagne-dark transition-colors">
                    <option value="">Select type</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="spot-address" className="block eyebrow-muted text-charcoal/55 mb-2">
                  Address
                </label>
                <input id="spot-address" type="text" name="address" value={form.address} onChange={handleChange}
                  placeholder="e.g., 35 East 76th Street, New York"
                  className="w-full bg-transparent border-b border-charcoal/20 px-1 py-2.5 text-base font-sans text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-champagne-dark transition-colors" />
              </div>

              <div>
                <label htmlFor="spot-neighborhood" className="block eyebrow-muted text-charcoal/55 mb-2">
                  Neighborhood
                </label>
                <input id="spot-neighborhood" type="text" name="neighborhood" value={form.neighborhood} onChange={handleChange}
                  placeholder="e.g., Upper East Side"
                  className="w-full bg-transparent border-b border-charcoal/20 px-1 py-2.5 text-base font-sans text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-champagne-dark transition-colors" />
              </div>

              <div>
                <label htmlFor="spot-description" className="block eyebrow-muted text-charcoal/55 mb-2">
                  Why is this spot aspirational? <span className="text-champagne-dark">*</span>
                </label>
                <textarea id="spot-description" name="description" value={form.description} onChange={handleChange}
                  placeholder="What makes this the perfect LARP venue? Be specific."
                  rows={4}
                  className="w-full bg-transparent border border-charcoal/20 px-3 py-2.5 text-base font-sans text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-champagne-dark transition-colors resize-none" />
              </div>

              <div className="border-t border-champagne/25 pt-5">
                <p className="font-sans text-xs text-charcoal/45 mb-4 italic">Optional — in case we have questions</p>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="spot-submitter-name" className="block eyebrow-muted text-charcoal/55 mb-2">Your Name</label>
                    <input id="spot-submitter-name" type="text" name="submitter_name" value={form.submitter_name} onChange={handleChange}
                      placeholder="Optional"
                      className="w-full bg-transparent border-b border-charcoal/20 px-1 py-2.5 text-base font-sans text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-champagne-dark transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="spot-submitter-email" className="block eyebrow-muted text-charcoal/55 mb-2">Your Email</label>
                    <input id="spot-submitter-email" type="email" name="submitter_email" value={form.submitter_email} onChange={handleChange}
                      placeholder="Optional"
                      className="w-full bg-transparent border-b border-charcoal/20 px-1 py-2.5 text-base font-sans text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-champagne-dark transition-colors" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting}
                  className="btn-editorial w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Submitting…' : 'Submit for Review'}
                </button>
                <p className="text-center font-sans text-xs text-charcoal/45 mt-3 italic">
                  Every submission is reviewed by hand.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
