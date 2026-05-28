'use client';

import { useEffect, useRef, useState } from 'react';
import LocationAutocomplete, { type SelectedPlace } from './LocationAutocomplete';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const CITIES = [
  { slug: '',           label: 'No city' },
  { slug: 'new-york',   label: 'New York' },
  { slug: 'london',     label: 'London' },
  { slug: 'miami',      label: 'Miami' },
];

const IMAGE_LIMIT = 8 * 1024 * 1024;   // 8MB images
const VIDEO_LIMIT = 50 * 1024 * 1024;  // 50MB videos

export default function NewPostModal({ isOpen, onClose, onCreated }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [city, setCity] = useState('');
  const [locationName, setLocationName] = useState('');
  const [place, setPlace] = useState<SelectedPlace | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100 during upload
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleClose() {
    if (isPosting) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setMediaType(null);
    setCaption(''); setCity(''); setLocationName(''); setPlace(null);
    setError(''); setProgress(0);
    onClose();
  }

  function pickFile(f: File | null) {
    setError('');
    if (!f) { setFile(null); setPreview(null); setMediaType(null); return; }
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');
    if (!isImage && !isVideo) { setError('Pick an image or a video.'); return; }
    if (isImage && f.size > IMAGE_LIMIT) { setError('Image must be under 8MB.'); return; }
    if (isVideo && f.size > VIDEO_LIMIT) { setError('Video must be under 50MB.'); return; }
    setFile(f);
    setMediaType(isVideo ? 'video' : 'image');
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!file || !mediaType) { setError('Add a photo or video first.'); return; }
    setIsPosting(true);
    setError('');
    setProgress(0);

    try {
      // 1. Ask the server for a signed upload URL.
      const ext = (file.name.split('.').pop() ?? (mediaType === 'video' ? 'mp4' : 'jpg')).toLowerCase();
      const signRes = await fetch('/api/posts/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ext, contentType: file.type, mediaType }),
      });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? 'Could not get upload URL');

      // 2. PUT the file directly to Supabase storage with progress.
      await uploadWithProgress(sign.uploadUrl, file, (pct) => setProgress(pct));

      // 3. Create the post row.
      const postRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: sign.publicUrl,
          media_type: mediaType,
          caption: caption.trim() || null,
          city_slug: city || null,
          location_name: (place?.description ?? locationName).trim() || null,
          location_lat: place?.lat ?? null,
          location_lng: place?.lng ?? null,
          location_place_id: place?.placeId ?? null,
        }),
      });
      const postData = await postRes.json();
      if (!postRes.ok) throw new Error(postData.error ?? 'Could not post');

      onCreated?.();
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setIsPosting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-navy/85 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[92vh] rounded-2xl border border-champagne/15 bg-navy flex flex-col overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div>
            <p className="font-sans text-champagne text-[10px] tracking-[0.3em] uppercase mb-1">New Post</p>
            <h3 className="font-serif text-cream text-lg font-semibold">Craziest LARP</h3>
          </div>
          <button onClick={handleClose} className="text-cream/40 hover:text-cream p-1">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 space-y-4">
          {error && (
            <div className="text-[12px] text-red-400/80 bg-red-500/[0.08] border border-red-500/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Media picker */}
          <div>
            <p className="font-sans text-cream/50 text-[10px] tracking-[0.2em] uppercase mb-2">Photo or video</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`relative w-full rounded-xl overflow-hidden border border-dashed transition-colors aspect-[4/5] flex items-center justify-center bg-black/30 ${
                preview ? 'border-champagne/30' : 'border-white/[0.15] hover:border-champagne/40 hover:bg-white/[0.02]'
              }`}
            >
              {preview && mediaType === 'image' && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              )}
              {preview && mediaType === 'video' && (
                <video
                  src={preview}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                />
              )}
              {!preview && (
                <div className="text-center px-4">
                  <p className="font-sans text-cream/70 text-sm">Click to choose a photo or video</p>
                  <p className="font-sans text-cream/30 text-xs mt-1">JPG / PNG up to 8MB · MP4 / MOV up to 50MB</p>
                </div>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {isPosting && progress > 0 && (
              <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-champagne transition-[width] duration-150" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <p className="font-sans text-cream/50 text-[10px] tracking-[0.2em] uppercase mb-2">Caption</p>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
              placeholder="What were you LARPing as?"
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-md px-3 py-2 text-sm text-cream font-sans focus:outline-none focus:border-champagne/60 focus:bg-white/[0.06] transition-colors placeholder:text-cream/30 resize-none"
            />
          </div>

          {/* Location autocomplete (real places via Google Places) */}
          <div>
            <p className="font-sans text-cream/50 text-[10px] tracking-[0.2em] uppercase mb-2">Location</p>
            <LocationAutocomplete
              value={locationName}
              onChange={(v) => { setLocationName(v); if (place && v !== place.description) setPlace(null); }}
              onSelect={(p) => { setPlace(p); setLocationName(p.description); }}
              placeholder="Search a place (e.g. Bemelmans Bar)"
            />
            {place && (
              <p className="font-sans text-[11px] text-cream/40 mt-1 flex items-center gap-1.5">
                <span className="text-champagne/70">●</span>
                {place.secondaryText || place.mainText}
                {typeof place.lat === 'number' && (
                  <span className="text-cream/25 ml-1">· tagged</span>
                )}
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <p className="font-sans text-cream/50 text-[10px] tracking-[0.2em] uppercase mb-2">City</p>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-md px-3 py-2 text-sm text-cream font-sans focus:outline-none focus:border-champagne/60 transition-colors"
            >
              {CITIES.map((c) => <option key={c.slug || 'none'} value={c.slug}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={handleClose}
            disabled={isPosting}
            className="px-4 py-2 rounded-full border border-white/[0.1] text-cream/40 font-sans text-xs tracking-wider uppercase hover:text-cream/70 hover:border-white/[0.2] transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPosting || !file}
            className="px-5 py-2 rounded-full bg-champagne text-navy font-sans text-xs tracking-[0.15em] uppercase font-semibold hover:bg-champagne-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPosting ? (progress < 100 ? `Uploading ${progress}%` : 'Posting…') : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** PUT file to a signed upload URL with progress reporting (XHR — fetch
 *  doesn't expose upload progress in the standard API). */
function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Upload network error'));
    xhr.send(file);
  });
}
