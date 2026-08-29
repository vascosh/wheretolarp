# Swiss Blue — repalette + Helvetica Neue

**Date:** 2026-08-28
**Status:** approved, ready to implement

## Goal

Replace the "Heritage Daylight" visual language (warm parchment, racing green,
aged gold) with a white / off-white system whose single loud colour is an
electric Klein blue, and replace the Playfair + Gambetta serif pairing with
Helvetica Neue throughout.

## Why this is cheap

Two properties of the existing code make this a token-value change rather than
a 47-file rewrite:

1. **Token indirection.** `tailwind.config.ts` and the `:root` block in
   `globals.css` define named colours; components reference them by name
   (`bg-forest`, `text-gold`, `text-peat`). Legacy names (`navy`, `champagne`,
   `cream`) are already remapped onto the current palette, so the pattern is
   established.
2. **`forest` does double duty** — it is both the heading colour and the
   dark-inversion surface (`bg-forest` carrying `text-parchment-light`). Klein
   blue satisfies both roles: dark enough to read as text on off-white, dark
   enough to carry white text when used as a fill.

The same trick applies to type: pointing `font-sans`, `font-serif` *and*
`font-display` at one stack means all 462 existing `font-*` class usages keep
working and simply render Helvetica.

## Palette

| Role | Token | Old | New |
|---|---|---|---|
| Page background | `parchment` | `#F4EFE2` | `#F7F7F5` |
| Card / raised surface | `parchment-light` | `#FCF9F1` | `#FFFFFF` |
| Band / hover / inset | `parchment-dark` | `#E9E1CD` | `#EBEBE7` |
| Primary + dark surface | `forest` | `#1F3D2E` | `#1B2FDE` |
| Primary hover | `forest-light` | `#2E5943` | `#3D4EE8` |
| Primary tint fill | `forest-pale` | `#E1E8DE` | `#E7E9FD` |
| Accent / hairline / eyebrow | `gold` | `#9C7A38` | `#4B5DF0` |
| Accent, high contrast on paper | `gold-dark` | `#7C5F28` | `#1B2FDE` |
| Accent, for use on blue surfaces | `gold-light` | `#C9A96E` | `#C3CBFA` |
| Body copy | `peat` | `#33312A` | `#101114` |
| Warm accent (likes / danger) | `burgundy` | `#71303A` | `#D4183D` |

Legacy aliases follow: `navy`→`forest`, `champagne`→`gold`, `cream`→
`parchment-light`, `cream-dark`→`parchment`, `charcoal`/`ink`→`peat`,
`muted`→`#6B6D75`.

The background is deliberately **neutral**, not warm. Warm cream under an
electric blue reads muddy.

Hierarchy is carried by two tones of blue: deep Klein for headings, buttons and
fills; the lighter `#4B5DF0` for hairlines and micro-labels, which mostly appear
at fractional opacity already (`bg-gold/40`, `text-gold/60`).

### Contrast

| Pair | Ratio | Verdict |
|---|---|---|
| `#1B2FDE` on `#FFFFFF` | 8.4:1 | AAA |
| `#1B2FDE` on `#F7F7F5` | 7.8:1 | AAA |
| `#FFFFFF` on `#1B2FDE` | 8.4:1 | AAA |
| `#C3CBFA` on `#1B2FDE` | 5.2:1 | AA |
| `#4B5DF0` on `#F7F7F5` | 4.7:1 | AA |

## Typography

Single stack, applied to `font-sans`, `font-serif` and `font-display`:

```
'Helvetica Neue', Helvetica, Arial, sans-serif
```

True Helvetica Neue on macOS/iOS; Arial elsewhere. No webfont, no licence, no
network request.

Playfair Display and Inter (`next/font/google`) and the Fontshare Gambetta
`<link>` are all removed from `layout.tsx`, along with the `--font-playfair`,
`--font-inter` and `--font-gambetta` variables. This drops two font services
from the critical path.

The existing `fontSize` display tokens already carry `-0.02em` / `-0.03em`
tracking, which is what large Helvetica needs. They stay as-is.

## Component classes needing more than a token swap

Re-tinting alone leaves four contrast failures and one dead hover, because the
old palette paired a *light* gold against a *dark* green. In blue-on-blue those
pairs collapse:

- `.btn-champagne` — `hover:text-navy` on a `bg-champagne` fill drops to 1.66:1.
  Change hover text to white.
- `.filter-pill-active` — same `bg-champagne` / `text-navy` pair. Change to white.
- `.btn-editorial-gold` — `bg-gold-light` + `text-forest` is 3.78:1 at 11px.
  Change to `bg-parchment-light` + `text-forest` (8.4:1).
- `.link-underline` — `text-gold-dark` hovering to `text-forest` becomes the same
  colour. Change hover to `text-peat`, so the label darkens to ink while the blue
  rule wipes in.
- `.filter-pill-inactive` — hardcoded gold hover border `rgba(201,169,110,0.6)`
  → `rgba(75,93,240,0.6)`.

Also neutral-ised: `boxShadow` `card`/`card-hover`/`modal` (navy-tinted
`rgba(10,22,40,…)` → `rgba(16,17,20,…)`), `.card-paper`'s shadow, `::selection`,
and the `grid-pattern` background SVG's embedded gold hex.

## Removals

- **`.grain-overlay`** — a fixed paper-grain texture on `mix-blend-mode: multiply`,
  mounted in `layout.tsx:65`. A heritage-paper device; against crisp white and
  electric blue it greys the whole page. Remove the mount, the class, and its
  `prefers-reduced-motion` entry.

## Out of scope

- **`/portfolio`** is untouched. It is deliberately Robinhood-black with
  `#00C805` / `#FF5000` and hides site chrome; the repalette must not reach it.
- Brand hexes for Google OAuth buttons (`#4285F4`, `#EA4335`, `#FBBC05`,
  `#34A853`) stay.
- No layout, copy, or component-structure changes. Colour and type only.

## Verification

- `npx tsc --noEmit` clean
- `npm run build` clean
- Grep confirms no surviving green/gold hexes outside `/portfolio` and the
  brand-hex exceptions
- Visual pass over `/`, `/feed`, `/city/new-york`, `/leaderboard`, `/challenges`,
  `/profile`, `/settings`, `/auth/signin`, `/terms`

## Follow-up

`CLAUDE.md`'s design-system section is stale independently of this work — it
still documents navy/champagne and points at `BentoLanding.tsx` for
`CITY_THEMES`, a file deleted in the previous commit. Refresh it as the last
step.
