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
      <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 bg-white w-full max-w-lg rounded-lg shadow-modal overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-navy px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="font-sans text-champagne text-xs tracking-widest uppercase mb-1">
              Community Contribution
            </p>
            <h2 className="font-serif text-cream text-xl font-semibold">
              Submit a Spot
            </h2>
          </div>
          <button onClick={handleClose} className="text-cream/40 hover:text-cream transition-colors p-1 rounded-full">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-champagne/15 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-champagne">
                  <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-serif text-navy text-xl mb-3">Submission Received</h3>
              <p className="font-sans text-charcoal/70 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                {successMessage || THANK_YOU_MESSAGE}
              </p>
              <button onClick={handleClose} className="btn-champagne">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-charcoal/60 mb-1.5">
                  Spot Name <span className="text-champagne">*</span>
                </label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g., The Carlyle Bemelmans Bar"
                  className="w-full border border-charcoal/15 rounded-lg px-3 py-2.5 text-sm font-sans text-charcoal focus:outline-none focus:border-champagne transition-colors" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-charcoal/60 mb-1.5">
                    City <span className="text-champagne">*</span>
                  </label>
                  <select name="city" value={form.city} onChange={handleChange}
                    className="w-full border border-charcoal/15 rounded-lg px-3 py-2.5 text-sm font-sans text-charcoal focus:outline-none focus:border-champagne transition-colors bg-white">
                    <option value="">Select city</option>
                    <option value="New York">New York</option>
                    <option value="London">London</option>
                    <option value="Miami">Miami</option>
                  </select>
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-charcoal/60 mb-1.5">
                    Category
                  </label>
                  <select name="category" value={form.category} onChange={handleChange}
                    className="w-full border border-charcoal/15 rounded-lg px-3 py-2.5 text-sm font-sans text-charcoal focus:outline-none focus:border-champagne transition-colors bg-white">
                    <option value="">Select type</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-charcoal/60 mb-1.5">
                  Address
                </label>
                <input type="text" name="address" value={form.address} onChange={handleChange}
                  placeholder="e.g., 35 East 76th Street, New York"
                  className="w-full border border-charcoal/15 rounded-lg px-3 py-2.5 text-sm font-sans text-charcoal focus:outline-none focus:border-champagne transition-colors" />
              </div>

              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-charcoal/60 mb-1.5">
                  Neighborhood
                </label>
                <input type="text" name="neighborhood" value={form.neighborhood} onChange={handleChange}
                  placeholder="e.g., Upper East Side"
                  className="w-full border border-charcoal/15 rounded-lg px-3 py-2.5 text-sm font-sans text-charcoal focus:outline-none focus:border-champagne transition-colors" />
              </div>

              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-charcoal/60 mb-1.5">
                  Why is this spot aspirational? <span className="text-champagne">*</span>
                </label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="What makes this the perfect LARP venue? Be specific."
                  rows={4}
                  className="w-full border border-charcoal/15 rounded-lg px-3 py-2.5 text-sm font-sans text-charcoal focus:outline-none focus:border-champagne transition-colors resize-none" />
              </div>

              <div className="border-t border-charcoal/[0.08] pt-4">
                <p className="font-sans text-xs text-muted mb-3">Optional — in case we have questions</p>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-sans text-xs tracking-wider uppercase text-charcoal/60 mb-1.5">Your Name</label>
                    <input type="text" name="submitter_name" value={form.submitter_name} onChange={handleChange}
                      placeholder="Optional"
                      className="w-full border border-charcoal/15 rounded-lg px-3 py-2.5 text-sm font-sans text-charcoal focus:outline-none focus:border-champagne transition-colors" />
                  </div>
                  <div>
                    <label className="block font-sans text-xs tracking-wider uppercase text-charcoal/60 mb-1.5">Your Email</label>
                    <input type="email" name="submitter_email" value={form.submitter_email} onChange={handleChange}
                      placeholder="Optional"
                      className="w-full border border-charcoal/15 rounded-lg px-3 py-2.5 text-sm font-sans text-charcoal focus:outline-none focus:border-champagne transition-colors" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting}
                  className="w-full btn-navy py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </button>
                <p className="text-center font-sans text-xs text-muted mt-3 italic">
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
