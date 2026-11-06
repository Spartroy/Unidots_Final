# UniDots redesign: instructions for Claude Code

You are applying the UniDots design system to the existing UniDots web app (a flexography prepress order-management app with five portals: Client, Employee, Prepress, Manager, Courier; English and Arabic with full RTL). This folder is the spec. Do not invent new visuals: reproduce what is in `screenshots/` using the tokens and components here.

## What is in this folder

- `tokens/tokens.css` and `tokens/tokens.json`: every colour, spacing, radius, shadow, size and type token. Light and dark themes (`data-theme="light|dark"`). All text and UI pairs already pass WCAG 4.5:1 / 3:1.
- `components/bundle.js` and `components/bundle.css`: the reference component kit (React 18, plain `React.createElement`, global `window.UniDots`). 41 components. Treat it as the visual and behavioural source of truth.
- `screens/<Name>/preview.html` and `README.md`: the source of each rebuilt screen (the React code that composes the kit) and its design notes. 23 screens (18 desktop, 5 mobile).
- `standalone/<Name>.html`: each screen runnable offline in a browser. Open these first.
- `screenshots/<Name>.png`: what each screen must look like (light theme).
- `docs/SCREENS.md`: every screen with its screenshot and notes. `docs/BRAND-README.md`: the brand book (content, visual rules, per-portal emphasis, rules for manager, portal, shell and mobile patterns). Read both before coding.
- `assets/logo-V2.png`: the supplied logo. Use the real file; never redraw it. It is dark on a light ground: place it on a light surface or provide the white variant on the navy sidebar.

## How to apply it (do these in order)

1. Inspect the target repo: framework, router, styling approach, i18n, existing components, how portals are separated. Write a short plan listing which files you will touch. Ask me only if something is genuinely ambiguous.
2. Add the tokens. Convert `tokens/tokens.css` into the repo's styling system (CSS variables is the default; keep the same variable names). Load Inter and IBM Plex Sans Arabic. Support `dir="rtl"` through CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`); never hard-code left/right.
3. Port the components from `components/bundle.js` + `bundle.css` into the repo's component model (TSX if the repo uses TypeScript). Keep names, props and class names close to the reference. Replace the app's existing buttons, inputs, tables, badges and dialogs with them instead of restyling old ones.
4. Build the shells first: `AppShell` (desktop sidebar + page header) and `MobileScreen` (phone top bar + bottom tabs). Every portal page lives inside one of them. The page title appears once, in the page header.
5. Port screens one portal at a time in this order: Client (Register, Dashboard, Orders, New order, New claim, Profile), Employee (Dashboard, Order detail, Progress, Files and delivery dialog, Edit order), Prepress (Orders, Order detail, History: Arabic, RTL), Manager (Dashboard, Orders list, Order detail), Courier (Delivery). Then the five Mobile screens. After each screen, compare it to `screenshots/<Name>.png` at the same width and fix differences.
6. Keep all existing behaviour, API calls, routes, permissions and validation. This is a UI refactor: only markup, styling and layout change. Replace sample data in the previews with real data from the app.
7. Verify: run the app, check every screen at 1200px desktop and 390px mobile, in light and dark, in English and Arabic (RTL). Check keyboard focus is visible, tab order is logical, and no screen scrolls sideways on mobile. Run the repo's tests and linter.

## Non-negotiable rules

- One primary button per view. Everything else is secondary or ghost.
- Status is always colour + icon shape + text, through the `StatusBadge` component only. Never colour alone, never ad-hoc pills. The nine statuses: submitted, designing, design-done, in-prepress, ready (Ready for Delivery), delivering, completed, on-hold, cancelled.
- Never use native `alert()`; use `Toast` or `ConfirmDialog`.
- Forms: visible labels (never placeholder-only), required marked with an asterisk, no autofill on non-credential fields, select placeholders are invalid until changed, never persist filler data, default country is Egypt.
- Units are written in the label: mm for width, height and thickness, L, m². Do not mix cm, mm and microns. Currency follows the formats: `EGP 353,531.10`, percentages `70%`.
- Charts: `StatusBars` instead of pie charts; `TrendChart` with a zero baseline.
- No left-border accent cards and no rainbow tiles.
- Halftone dots are decoration only (sidebar foot, page-header corner, empty states). They never carry meaning.
- Tap targets: 44px minimum; 64px for Courier and Prepress floor actions.
- Choose delivery method stays disabled, with the reason beside it, until all 9 prepress processes are done. Delivery options: Direct handover, Client self-collection, Shipping company (Middle East).
- Job path and Distortion are staff-only fields; never shown to clients.
- The nine prepress processes (use these exact labels in English): Positioning, Back exposure, Laser imaging, Main exposure, Washout, Drying, Post exposure, UVC exposure, Finishing. Arabic labels are in `screens/PrepressOrderDetail/preview.html`; confirm wording with the Arabic copy already in the app.

## Portal summary

| Portal | Shell | Language | Key screens | Emphasis |
|---|---|---|---|---|
| Client (e.g. Tulip) | Sidebar: Dashboard, Orders, Claims | EN (AR supported) | Register (3 steps), Dashboard, Orders, New order, New claim, Profile | Friendly, calm; one clear next action |
| Employee | Sidebar: Dashboard, Orders, Claims, Tasks | EN | Dashboard, Order detail, Progress, Files + delivery dialog, Edit order | Task clarity; progress timeline |
| Prepress (e.g. Gaber) | Sidebar on the right: الطلبات, الطلبات السابقة | AR first, RTL | Orders, Order detail with 9 process cards, History | Large controls, floor use, high contrast |
| Manager | Sidebar: Dashboard, Orders, Claims, Tasks, People, Reports, Production | EN | Dashboard, Orders list, Order detail (plus the data components: DataTable, StatusBars, TrendChart, TankGauge, PlateCanvas) | Dense, scannable data; attention first |
| Courier | Single-delivery screen; mobile first | EN | Delivery list, delivery, confirm | Huge buttons, one action |

Screens not yet designed (build them from the same components and rules, and tell me what you chose): Login, Claims list/detail, Tasks, People/Employee detail, Client detail, Reports, Barrel management, Plate monitoring, Courier history. The original manager screens for these were in the brief; use `DataTable`, `FormDialog`, `TankGauge`, `PlateCanvas` and the manager rules in `docs/BRAND-README.md`.

## Open items to confirm with me

1. Currency (EGP vs USD) in prices.
2. Units: the old order screens mixed cm and microns; these designs normalise to mm.
3. Logo: use `assets/logo-V2.png`; ask me for a white/transparent variant for the dark sidebar.
4. Sample data in previews (names, numbers, dates) is partly invented; replace with real data.

## Definition of done

Every screen listed above matches its screenshot at 1200px and 390px, light and dark, English and Arabic; no hard-coded left/right; all existing functionality still works; tests and lint pass; a short summary of what changed and what you could not match.
