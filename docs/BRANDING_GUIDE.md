# UniDots — Brand & Design Brief (for Claude Design)

> Paste this whole file into Claude Design as the system brief. Colour values are sampled by eye from the current logo (`frontend/src/assets/logo.png`) and must be confirmed against the original vector artwork.

## 1. Who we are
**UniDots Prepress & Supply Co.** — flexography prepress specialists in Cairo, Egypt, established 2005. We make photopolymer printing plates for packaging printers and run a digital platform where clients order, designers prepare artwork, prepress staff produce plates, and couriers deliver.

- **Promise:** accurate, cost-effective flexo prepress, fast and traceable from submission to delivery.
- **Vision:** be a regional (then global) leader in flexography prepress; set standards for quality, innovation and customer satisfaction.
- **Audience:** Arabic-speaking and English-speaking packaging printers, factory-floor prepress operators (often on shared PCs or tablets, gloves/dust, mixed lighting), designers, managers, couriers on phones.

## 2. Brand personality
Precise · Industrial-crafted · Calm · Trustworthy · Technical-but-friendly.
Voice: plain, short, confident. Name the next step ("Mark washout complete"), never blame the user. Avoid hype and jargon the user doesn't already use. Bilingual: every label must work in English and Arabic.

## 3. Logo
- Mark: a circle filled with a **halftone dot gradient** — small dots top-left growing larger toward bottom-right — the visual signature of the company (dots = flexo plate screening).
- Lockup: mark above wordmark **"UniDots"** (heavy rounded geometric sans, deep blue) and tagline **"Prepress & Supply Co."** (lighter weight, teal).
- Clear space: at least the height of the "U" on all sides. Minimum width: 96 px digital.
- On dark backgrounds use a white/one-colour version (to be created). **Never** place the current logo (white background PNG) on slate/dark navbars as-is — create a transparent or reversed version.
- Don't stretch, recolour with unrelated hues, add shadows, or crop the dot circle.

## 4. Colour
Replace the current Tailwind defaults (sky `primary`, violet `secondary`, indigo `#4F46E5` theme colour) with palette derived from the logo.

| Token | Hex (approx.) | Use |
|---|---|---|
| `brand-900` | `#0F3A57` | Navbar, headings on light |
| `brand-700` | `#1B5E8A` | **Primary** — buttons, links, wordmark blue |
| `brand-500` | `#2F86A8` | Hover, focus rings, charts |
| `teal-500` | `#3A9EA9` | **Accent** — tagline teal, secondary actions, highlights |
| `teal-100` | `#D9EEF0` | Tinted backgrounds, selected rows |
| `ink-900` | `#0F172A` | Body text |
| `ink-500` | `#64748B` | Secondary text |
| `surface` | `#F5F8FA` | App background (cool, slightly blue grey, not neutral grey) |
| `white` | `#FFFFFF` | Cards |

**Status colours (semantic, not brand):** Submitted amber · Designing blue · Design Done teal · In Prepress violet · Ready for Delivery indigo · Delivering cyan · Completed green · On Hold orange · Cancelled red. Every status must pair colour **with text** (and ideally an icon). Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI.

## 5. Typography
- Latin: **Inter** (already loaded) — weights 400/500/600/700. Headings 600–700, tight tracking.
- Arabic: **IBM Plex Sans Arabic** or **Noto Sans Arabic**, same weights; line-height +10%.
- Numerals: tabular figures for order numbers, dimensions, costs.
- Scale: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36. Body 14–16. Minimum 12 (never smaller).

## 6. Layout, shape, motion
- 8-pt spacing grid. Cards: white, 12 px radius, 1 px `#E2E8F0` border, very soft shadow. Inputs/buttons: 8 px radius, 40–44 px tall (≥ 44 px on touch/shop-floor screens).
- Navigation: top bar in `brand-900`, active item with teal underline (replace the current green). Show page title + breadcrumb under it on detail pages.
- Use the **halftone dot motif** sparingly: hero backgrounds, empty states, loading skeletons, section dividers. Never behind dense data.
- Icons: Heroicons outline, 20/24 px, consistent stroke.
- Motion: 150–250 ms ease-out; progress and success states may animate; respect `prefers-reduced-motion`.
- **RTL:** all layouts must mirror correctly (logical properties `ms-/me-/ps-/pe-`, not `ml/mr`).

## 7. Components to design (one consistent kit for all 5 portals)
1. App shell: top bar, role-aware nav (one shared layout, not five copies), notification bell, user menu, mobile drawer, language toggle (EN | عربي).
2. Order card + table row, status badge, **order progress stepper** (Submission → Design → Ripping → Prepress → Delivery).
3. Prepress checklist: 9 large tappable process rows with timestamp + who completed, solvent-use readout.
4. Forms: new-order wizard (steps: type → specs → files → review), file dropzone with previews, inline validation messages.
5. Chat/comments thread, notification list, claim detail with timeline.
6. Dashboards: KPI tiles, bar/line charts in brand blues + teal, empty states, skeleton loaders.
7. Courier mobile views: big call/map/confirm-delivery buttons.
8. Confirmation dialog pattern for destructive actions; toast pattern (success/error/info).

## 8. Per-portal tone
| Portal | Primary user | Design emphasis |
|---|---|---|
| Client | Printer buyer | Reassurance, clear status, minimal steps to reorder |
| Employee | Designer | Dense but scannable order detail, quick status actions |
| Prepress | Floor operator | Large targets, high contrast, one-hand tablet use, Arabic-first |
| Manager | Owner/ops | Overview, assignment, reports, exports |
| Courier | Driver on phone | One screen per delivery, huge primary button |

## 9. Do / Don't
**Do:** use brand blue for primary actions, show next step prominently, give every empty state an action, keep one primary button per view.
**Don't:** mix more than two accent colours, use colour alone for status, use `alert()` dialogs, use placeholder text as labels, leave Arabic and English labels mixed within one nav.

## 10. Deliverables to ask Claude Design for
Logo variants (reversed, mono, icon-only, favicon, PWA icons — the manifest currently has none), full token set (colour/type/spacing/radius/shadow) exported as Tailwind config, the component kit above in light mode (dark mode optional), RTL variants, and mock screens for each portal's home + order detail.
