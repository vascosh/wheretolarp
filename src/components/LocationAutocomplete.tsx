'use client';

/**
 * Google Places autocomplete dropdown styled for the Heritage Daylight
 * (parchment/forest/gold) theme.
 *
 * Uses the `AutocompleteService` to fetch predictions as the user types
 * (debounced 250ms) and `PlacesService.getDetails` to resolve the chosen
 * prediction into a place_id + lat/lng.
 *
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_KEY. Falls back to a plain text input
 * if the key isn't set or the API fails to load.
 */

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export interface SelectedPlace {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat?: number;
  lng?: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: SelectedPlace) => void;
  placeholder?: string;
  className?: string;
}

type Prediction = google.maps.places.AutocompletePrediction;

// Single shared readiness promise across instances. The v2 functional API
// is idempotent — setOptions+importLibrary can be called more than once.
let placesReadyPromise: Promise<void> | null = null;
function ensurePlacesLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (placesReadyPromise) return placesReadyPromise;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_KEY missing'));
  setOptions({ key: apiKey, v: 'weekly' });
  const p = importLibrary('places').then(() => undefined);
  placesReadyPromise = p;
  return p;
}

export default function LocationAutocomplete({
  value, onChange, onSelect, placeholder, className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Load Places API once
  useEffect(() => {
    let cancelled = false;
    ensurePlacesLoaded()
      .then(() => { if (!cancelled) setReady(true); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? 'Could not load Places'); });
    return () => { cancelled = true; };
  }, []);

  // New session token each time the field is reopened (saves money — same
  // session counts as one billable autocomplete + one details lookup).
  useEffect(() => {
    if (!ready) return;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [ready]);

  // Debounced prediction fetch
  useEffect(() => {
    if (!ready) return;
    const v = value.trim();
    if (v.length < 2) { setPredictions([]); return; }
    const t = setTimeout(() => {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input: v, sessionToken: sessionTokenRef.current ?? undefined },
        (preds, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
            setPredictions(preds);
            setOpen(true);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 250);
    return () => clearTimeout(t);
  }, [value, ready]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function choose(pred: Prediction) {
    const description = pred.description ?? '';
    const mainText = pred.structured_formatting?.main_text ?? description;
    const secondaryText = pred.structured_formatting?.secondary_text ?? '';
    onChange(description);
    setOpen(false);
    setActiveIndex(-1);
    setPredictions([]);
    // Pull coordinates via PlacesService (one billable details call, ends
    // the session token).
    const dummyDiv = document.createElement('div');
    const placesService = new google.maps.places.PlacesService(dummyDiv);
    placesService.getDetails(
      {
        placeId: pred.place_id,
        sessionToken: sessionTokenRef.current ?? undefined,
        fields: ['geometry'],
      },
      (place, status) => {
        const lat = place?.geometry?.location?.lat();
        const lng = place?.geometry?.location?.lng();
        onSelect({
          placeId: pred.place_id,
          description,
          mainText,
          secondaryText,
          lat: status === google.maps.places.PlacesServiceStatus.OK ? lat : undefined,
          lng: status === google.maps.places.PlacesServiceStatus.OK ? lng : undefined,
        });
        sessionTokenRef.current = null; // start a fresh session next time
      }
    );
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || predictions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        choose(predictions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className ?? ''}`}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActiveIndex(-1); }}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        onKeyDown={onKey}
        placeholder={placeholder ?? 'Search a place'}
        className="w-full bg-parchment-dark/40 border border-peat/15 rounded-md px-3 py-2 text-sm text-peat font-sans focus:outline-none focus:border-gold focus:bg-parchment-dark/60 transition-colors placeholder:text-peat/40"
      />
      {open && predictions.length > 0 && (
        <ul
          className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-md border border-peat/15 bg-parchment-light shadow-[0_8px_32px_rgba(16, 17, 20,0.18)] py-1"
          role="listbox"
        >
          {predictions.map((p, i) => {
            const main = p.structured_formatting?.main_text ?? p.description;
            const secondary = p.structured_formatting?.secondary_text ?? '';
            const active = i === activeIndex;
            return (
              <li
                key={p.place_id}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => { e.preventDefault(); choose(p); }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`px-3 py-2 cursor-pointer flex items-start gap-2 text-sm transition-colors ${
                  active ? 'bg-parchment-dark/60' : 'hover:bg-parchment-dark/40'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-gold-dark">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <div className="min-w-0">
                  <p className="text-peat truncate">{main}</p>
                  {secondary && <p className="text-peat/50 text-[11px] truncate">{secondary}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p className="text-[10px] text-burgundy/80 mt-1">{error}</p>
      )}
    </div>
  );
}
