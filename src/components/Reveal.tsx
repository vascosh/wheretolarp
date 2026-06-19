'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Stagger the reveal (ms). */
  delay?: number;
  className?: string;
  /** Element to render as. Defaults to a div. */
  as?: ElementType;
  /** Reveal only once (default) or every time it enters view. */
  once?: boolean;
}

/**
 * Scroll-triggered reveal. Wraps children in `.reveal`, then toggles
 * `.is-visible` when the element scrolls into view (IntersectionObserver).
 * Pairs with the `.reveal` utility in globals.css; reduced-motion is honored
 * there, so this stays a no-op visual for those users.
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
