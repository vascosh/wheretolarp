'use client';

import { useState } from 'react';
import SubmitSpotModal from './SubmitSpotModal';

/**
 * Thin client wrapper so a server-rendered card can offer a "Submit a Spot"
 * button that opens the existing modal. Defaults to the .btn-navy pill style.
 */
export default function BentoSubmitButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? 'btn-navy'}
      >
        Submit a Spot
      </button>
      <SubmitSpotModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
