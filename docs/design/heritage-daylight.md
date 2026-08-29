# Heritage Daylight — design system brief ("The Field Guide")

The whole site plays the LARP straight: a heritage society's printed field
guide. Ivory paper, racing green, aged gold, one rare drop of burgundy.
Professional like a luxury print magazine; fun because it never breaks
character. Voice: deadpan field-guide / society-papers copy ("The Society",
"The Standings", "Plate II", "No actual wealth required.").

## Palette (Tailwind tokens in `tailwind.config.ts`)

| Token | Hex | Use |
|---|---|---|
| `parchment` | `#F4EFE2` | page background (body default) |
| `parchment-light` | `#FCF9F1` | cards, raised surfaces |
| `parchment-dark` | `#E9E1CD` | tinted bands, wells |
| `forest` | `#1F3D2E` | headlines, primary buttons, dark bands |
| `forest-light` | `#2E5943` | hover states on forest |
| `forest-pale` | `#E1E8DE` | subtle green tint fills |
| `gold` | `#9C7A38` | accents, rules, active states |
| `gold-light` | `#C9A96E` | gold on dark green surfaces |
| `gold-dark` | `#7C5F28` | gold text on paper (AA-safe) |
| `burgundy` | `#71303A` | rare accent: destructive, live dots, seals |
| `peat` | `#33312A` | body text |

Legacy tokens (`navy`, `ink`, `cream`, `charcoal`, `champagne`, `muted`) are
**remapped** into this palette, so old classes won't clash — but new/edited
code should use the new token names.

## Type

- Display: `font-display` (Gambetta, italic for flourishes) — big headlines only
- Headings: `font-serif` (Playfair Display)
- Body/UI: `font-sans` (Inter); overlines uppercase `tracking-[0.25em]`+

## Recipes (classes in `globals.css`)

- Card: `.card-paper` → `rounded-[18px] border border-peat/10 bg-parchment-light shadow-[0_2px_24px_rgba(51,49,42,0.07)]`
- Specimen plate (double hairline frame): `.plate-frame`
- Eyebrow overline: `.eyebrow` (on paper) / `.eyebrow-light` (on forest) / `.eyebrow-muted`
- Buttons: `.btn-editorial` (forest fill), `.btn-editorial-ghost` (forest outline), `.btn-editorial-gold` (gold fill, for on-forest sections)
- Link: `.link-underline` (gold underline draw)
- Rules: `.rule-champagne` (gold hairline), dotted leader rows: `.ledger-row` + `.leader`
- Reveal-on-scroll: wrap in `<Reveal>` (`src/components/Reveal.tsx`)

## Principles

1. Pages are **light paper**, not dark. Replace dark page surfaces
   (`bg-navy`, `bg-ink`, near-black inline styles) with parchment surfaces.
   Deep `forest` is reserved for: primary buttons, closing bands, footer,
   small chips.
2. Hairlines over heavy borders; generous whitespace; serif headlines with
   one italic gold word for flourish.
3. Numbered/Roman markers only where order is real (steps, plates, ranks).
4. Keep all logic, data flow, and APIs untouched — presentation only.
5. `/portfolio` is exempt: it stays black Robinhood-style on purpose.
6. Mobile floor: ≥16px inputs on phones (global), safe-area utilities
   (`pt-nav`, `pb-safe`), visible focus states, reduced-motion respected.

## Copy voice

In-character, deadpan, concise. Feed = "The Society Papers". Leaderboard =
"The Standings". Challenges = "Field Exercises". Errors are direct and
in-voice, never apologetic. Empty states invite action ("The register is
blank. File the first entry.").
