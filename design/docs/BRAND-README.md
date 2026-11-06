UniDots Prepress & Supply Co. is a flexography prepress house in Cairo (est. 2005) making photopolymer printing plates. This system styles one platform with five portals (Client, Employee, Prepress, Manager, Courier) for Arabic- and English-speaking users, from office desktops to gloved hands on a shop-floor tablet. Promise: accurate, cost-effective prepress, fast and traceable from submission to delivery.

## Content fundamentals

- Voice is plain, short and confident. Name the next step: "Mark washout complete", "Confirm delivery", "Reorder". Never blame the user: "Enter the client reference to continue", not "You forgot the reference".
- Sentence case everywhere. Status names keep their canonical casing: Submitted, Designing, Design Done, In Prepress, Ready for Delivery, Delivering, Completed, On Hold, Cancelled.
- Address the user as "you" only when needed; prefer the object and the action. No hype, no jargon the user does not already use, no emoji.
- Every label works in English and Arabic. Never mix languages inside one nav or one form; switch the whole surface with the EN | عربي toggle and set `dir` on the container.
- Buttons are verbs. Confirmations name the object: "Cancel order UD-2026-00418?" with buttons "Keep order" and "Cancel order".
- Every empty state gives one action ("No orders yet. Start a new order").

## Visual foundations

- **Colour.** Brand blue `brand-700` is the primary; `brand-900` is the top bar and headings; `teal-500` is the accent (underlines, progress, chart highlight). Work through the semantic tokens, not the raw palette: page `bg-app`, cards `bg-card`, text `text` and `text-muted`, actions `primary` with `on-primary`, links `link`, selected rows `selected`, hairlines `border`, control edges `border-control`.
- Use at most two accents together. Teal as text is `accent-ink`; `teal-500` itself is never text on white (3.1:1).
- **Status.** Each of the nine statuses has `status-<name>-bg` and `status-<name>-fg`. Always pair colour with the status text and a shape; blue, indigo and violet are close in hue and are told apart by text and shape.
- **Themes.** Light is the brand theme. Dark is supplied and every text pair holds 4.5:1 in both; dark fills that are light (`primary`) take dark text through `on-primary`.
- **Type.** Latin is Inter, Arabic is IBM Plex Sans Arabic (Noto Sans Arabic as fallback), both loaded from Google Fonts: the `font-sans` stack already falls through to Arabic. Scale 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 through the styles `h1`–`h5`, `body-lg`, `body`, `label`, `caption`; never below 12px. Arabic text uses `body-ar` and `body-lg-ar` (about 10% more line height). Set order numbers, dimensions and costs in tabular figures (`font-variant-numeric: tabular-nums`, class `ud-num`).
- **Spacing.** An 8-pt grid: `space-1` (4px, icon gaps only) through `space-8`. Page sections sit `space-6` apart; card padding is `space-4`.
- **Shape.** Cards: `bg-card`, 1px `border`, `radius-lg` (12px), `shadow-card`. Inputs and buttons: `radius-md` (8px), `control-h` (40px) or `control-h-touch` (44px) on touch and shop-floor screens. Badges and markers are `radius-full`. Dialogs and toasts alone use `shadow-overlay`.
- **Focus.** A solid 2px ring in `focus-ring`, 2px offset, on every interactive element; on the navbar use `on-nav`.
- **Dot motif.** The company's signature is the halftone (flexo screening): small dots growing from top-left to bottom-right. Use it sparingly: hero backgrounds, empty states, loading skeletons, section dividers, always in `teal-100` on `brand-700` or `brand-900`. Never behind dense data.
- **Motion.** 150–250 ms ease-out. Progress and success states may animate. Honour `prefers-reduced-motion`.
- **Layout.** The top bar is `nav` with `on-nav` text and a 3px `accent` underline on the active item; detail pages show the title and a breadcrumb under it. One primary button per view, with the next step prominent.
- **RTL.** Use logical properties (`ms-` / `me-` / `ps-` / `pe-`, `inset-inline-*`, `margin-inline-*`), never left/right. Mirror layouts, steppers and arrows; keep numerals, order numbers and Latin product names in their own direction.
- **Accessibility.** Text 4.5:1 and UI 3:1, checked in both themes. Touch targets 44px, courier primary buttons `tap-courier` (64px).

## Per-portal emphasis

- **Client** (printer buyer): reassurance, clear status with `OrderStepper`, minimal steps to reorder.
- **Employee** (designer): dense but scannable order detail, quick status actions.
- **Prepress** (floor operator): `PrepressChecklist` with 56px rows, high contrast, one-hand tablet use, Arabic first, `control-h-touch` controls.
- **Manager** (owner/ops): `KpiTile` overview, assignment, reports, exports.
- **Courier** (driver on a phone): `CourierDelivery`, one screen per delivery, the huge primary button.

## Iconography

Heroicons outline (24px grid, 1.5 stroke, shown at 20 or 24px), consumed from the Heroicons package in the app; the few glyphs inside the components (check, bell) follow the same style. Status shapes (circle, square, diamond, triangle, hexagon, arrow, check, pause, cross) are drawn inline at 12px. No emoji.

## Logo

The mark is a circle filled with a halftone dot gradient above the heavy rounded geometric wordmark "UniDots" in deep blue and the tagline "Prepress & Supply Co." in teal. No logo file is part of this system yet: set the name "UniDots" in `h4`/`label` weight 700 in `on-nav` on `nav`, as `TopBar` does, and do not redraw the mark. Keep clear space of one "U" height and a minimum width of 96px. Never place the current white-background PNG on a dark bar; use a transparent or reversed version, never stretched, shadowed, recoloured with unrelated hues, or cropped.

## Components

Shell and flows: `AppShell` (left sidebar plus page header, desktop), `ShellParts`, `MobileScreen` (phone frame, top bar, bottom tabs, sticky action), `OrderRow`, `TopBar`, `Button`, `ActionBar`, `Tabs`, `Chips`, `Pagination`. Orders: `OrderCard`, `OrderStepper`, `StatusBadge`, `PriorityBadge`, `Avatar`. Forms: `Field`, `Select`, `SearchField`, `Dropzone`, `FormDialog`, `ColorOptions`, `RadioGroup`. Auth and files: `AuthLayout`, `FileList`. Data: `DataTable`, `DefList`, `KpiTile`, `StatusBars`, `TrendChart`, `Progress`. Feedback: `Toast`, `ConfirmDialog`, `EmptyState`, `Notice`, `ChatFab`. Progress: `ProgressTimeline`. Production: `ProcessGrid`, `PrepressChecklist`, `TankGauge`, `PlateCanvas`. Courier: `CourierDelivery`. All sit in the global `window.UniDots`; the showcase screens `ManagerDashboard`, `OrdersList` and `OrderDetail` (manager), `ClientRegister`, `ClientDashboard`, `ClientOrders`, `ClientNewOrder`, `ClientNewClaim`, `ClientProfile` (client), `EmployeeDashboard`, `EmployeeOrderDetail`, `EmployeeOrderProgress`, `EmployeeOrderFiles`, `EmployeeEditOrder` (employee), `PrepressOrders`, `PrepressOrderDetail`, `PrepressHistory` (prepress, Arabic RTL) and `CourierDelivery_Screen` (courier) show them composed on desktop; `MobileCourier`, `MobilePrepress`, `MobileClient`, `MobileEmployee` and `MobileManager` show the phone versions. They need `react` and `react-dom` 18, `tokens.css` and `components/bundle.css`.

## Manager patterns and rules

- **One page title.** The title lives in `TopBar` (with a breadcrumb on detail pages). Never repeat it as a heading in the content, and never add a welcome banner.
- **Navigation.** Seven top-level items at most, no "More" menu: Dashboard, Orders, Claims, Tasks, People (employees and clients), Reports, Production (barrels and plates). Items that lead to one page must show as active; the language toggle and user avatar are always present.
- **One primary button per view.** In a list the row link (`ud-link` in the first column of `DataTable`) is the action, not a solid button per row. Selected filters (`Chips`, current page) use `selected` with a `primary` edge, never a solid fill.
- **Detail pages end in an `ActionBar`.** The single primary is the next valid step for the current status (Submitted: `Send to design`), hinted above it. Secondary actions sit left, destructive ones are ghost text ending in an ellipsis and open a `ConfirmDialog`. Never offer a step that skips the pipeline.
- **Status vocabulary.** Use exactly the nine statuses in sentence-case title form, always through `StatusBadge`. Never invent synonyms (`Pending`), never uppercase them, never use lowercase `active`/`inactive` pills: for people use `StatusBadge` with `completed` (Active) and `cancelled` (Inactive) and an explicit `label`. Claim statuses reuse the same set or are named in the claim type's own list, still through `StatusBadge`.
- **Formats.** Money: currency code first, thousands separators, two decimals (`EGP 353,531.10`), one currency per surface. Sizes in mm, thicknesses in mm, volume in L, area in m², percentages as percentages (efficiency `70%`, not `0.7`). Dates as `Nov 11, 2026`; late work shows `414 days late` in `danger` text under the date. Numbers are tabular.
- **Charts.** Status distribution is `StatusBars`, never a pie. Time series is `TrendChart` with a zero baseline, straight segments and a data-derived axis, and an empty period shows a message, not a flat line. A series is `primary`; status colours are used only for statuses. Label values directly.
- **Cards and KPI tiles.** Plain `bg-card` with the standard border; no coloured left-border accents and no rainbow tint tiles. The only coloured value is an attention number in `danger`.
- **Hide uniform columns.** A column that holds one value on every row (Priority: Medium) does not earn space.
- **Forms.** Visible labels, native select and date inputs inside the `Field` layout, credentials `autocomplete="off"` or `new-password`, and form options that match what the list can display. Placeholder values such as `Select` must never be saved as data.
- **Empty and zero states.** `EmptyState` with the halftone dots, a one-line explanation and one action. Missing data is a message, never a blank (`Thickness: µm`).
- **Icons must match the noun.** A truck is a delivery, not a barrel; use a flask for acid solution and a drum or container glyph for barrels.

## Portal patterns and rules

- Every portal screen is the same shell: `TopBar` (brand, nav, bell, EN/عربي, avatar) with the page title once, then content. No welcome banners, no second "Portal" heading.
- Client and employee order forms are one form (`orderForm`): basic information, technical specifications, inks, notes. Internal fields (Distortion, Job path) appear for staff only.
- Inks are `ColorOptions`: a native checkbox, a swatch and the ink name as text. "Number of colours" is read-only and derived (CMYK Combined counts as 4).
- Units are always written in the label: mm for width, height and thickness, L, m². Never mix cm, mm and microns on one order.
- The nine prepress processes are the real ones: positioning, back exposure, laser imaging, main exposure, washout, drying, post exposure, UVC exposure, finishing. They appear in `ProgressTimeline` (staff) and `ProcessGrid` (floor operator).
- `ProcessGrid`: the first pending process is the only primary button; other pending ones are secondary; finished ones are a quiet redo. State is a word (done / pending), never colour alone.
- Choose delivery method stays disabled, with the reason beside it, until all nine processes are done. Delivery options are a `RadioGroup`; the optional address field lives under the selected option.
- Prepress is Arabic first (`dir="rtl"`); status badges take a translated `label`. Floor controls use `size="lg"` (control-h-touch 44px).
- Courier: one delivery per screen. Order, client and address; Call and Maps as two 64px secondary buttons; Complete delivery is the one full-width primary.
- Never persist filler data (placeholders like "a", "123 Main St") and never default a country to the United States: use Egypt.
- Select placeholders ("Choose an order") are invalid until changed.

## Shell and mobile rules

- Desktop: left sidebar (248px, `nav` ground, active item inverted, user at the foot) plus a page header with the title, an optional one-line summary, the single primary action, the bell and the EN/عربي switch. The halftone dots appear only in the sidebar foot and the page header corner; they are decoration and never carry meaning. In Arabic the sidebar moves to the right and the dots mirror.
- Every KPI tile may carry an icon in a `selected` chip above its label. The icon repeats the label, it never replaces it.
- Mobile: 390px wide, top bar (back chevron, title, bell), one scrolling body, an optional sticky action area with at most one primary and one secondary, and a bottom tab bar of 3 to 5 tabs at 64px. Five tabs is the maximum; extra sections go under More.
- Mobile forms are split into short steps (3 fields or fewer per step is ideal). Chips scroll sideways; nothing else does.
- Tap targets are 44px minimum, 64px for courier and prepress floor actions.

## Do and don't

- Do use `primary` for the main action, show the next step, give every empty state an action, keep one primary button per view.
- Don't mix more than two accent colours, signal status with colour alone, use `alert()` dialogs, use placeholder text as a label, or leave Arabic and English labels mixed within one nav.


---

## Consuming this system (generated — do not edit)

Every path named below is under `project/` in this design system: read `project/api/tokens.md`, not `api/tokens.md`.

`components/bundle.js` defines `window.UniDots` (37 components); `components/bundle.css` is its stylesheet; `tokens.css` is every token as a CSS variable plus `@font-face` for the fonts. `components/bundle.css` reads its variables from `tokens.css`. The bundle needs react 18 (not packed in this system: bring your own copy) (`window.React`), react-dom 18 (not packed in this system: bring your own copy) (`window.ReactDOM`), loaded before it. Build any UI by mounting these components; never hand-build a control or draw an icon the system provides.

- **Standalone page:** inline `tokens.css` and `components/bundle.css` in a `<style>`, then the library files and `components/bundle.js` as classic scripts (a file containing `</style`, `</script` or `<!--` breaks an inline element: write the sequence `<\/style`, `<\/script` or `\x3C!--` in your copy, or load that file by URL).
- **Design canvas:** bring `tokens.css`, `components/bundle.css` and `components/bundle.js` onto the canvas in full, as the canvas type’s design-system components reference says (a server-side copy first where it offers one); in each artboard that uses this system, right after the `support.js` line, load `tokens.css` first, then the stylesheet, then the script; skip the library files (the artboard supplies React); mount with `<x-import component-from-global-scope="UniDots.<Comp>" …>`.
- **Slides deck, or any surface that cannot run the bundle:** tokens only — the values are on `api/tokens.md`; the deck takes `tokens.json` by file path for its colour pickers.

**Read, per thing:** a component’s props, parts and examples: `api/components/<Comp>.md`; token values: `api/tokens.md`; stored assets and their paths: `api/assets/<Group>.md`. After this README, fetch the cards and fonts you need in ONE message as parallel calls — none depends on another.

**Two rules.** Before you use a thing — a component, a token group, an icon, an asset — read its card from the index below; a value you did not read from a card is a guess. `tokens.json`, `manifest.json` and `design-system.json` are sources for tools: hand them over. `components/<Comp>/README.md` is the long-form second read a card links to; `SKILL.md` and `artifact-type/` beside them are authoring guidance, not needed to consume the system.

## Index (generated — do not edit)

**Tokens**

- `api/tokens.md` — Every token: text, fill, border, palette, type, spacing, radius, shadow, size. (14.0k)

**Icons and assets**

- `api/assets/Logo.md` — 1 file, by asset id. (0.7k)

**Components** (`api/components/<Comp>.md`, 55; 18 of them showcase pages)

- **Actions**: `Button` — A single action · `ActionBar` — The row of actions at the foot of a detail page
- **Orders**: `StatusBadge` — The order status as a pill: colour, a distinct shape and the status text, never colour alone · `OrderCard` — A card summarising one order: tabular order number, title, StatusBadge and a row of label/value facts · `OrderStepper` — The five-stage progress line: Submission, Design, Ripping, Prepress, Delivery · `Avatar` — Initials in a circle · `PriorityBadge` — Priority as an outline badge with a four-bar strength glyph and the word
- **Forms**: `Field` — A labelled text input with optional hint and inline error · `Dropzone` — The artwork upload area with a file list · `Select` — A native select with a drawn chevron, so the caret never clips (unlike the 10 per page select)
- **Prepress**: `PrepressChecklist` — Large tappable process rows for the shop floor
- **Dashboards**: `KpiTile` — A single metric tile for the manager dashboard
- **Feedback**: `Toast` — A transient message in three tones: success, error, info · `ConfirmDialog` — The confirmation pattern for destructive actions · `FormDialog` — A modal form with a two-column field grid · `EmptyState` — A calm empty or zero state with the halftone motif
- **Navigation**: `TopBar` — The shared app shell header: wordmark, role-aware nav, notification bell, EN \| عربي toggle, then page title and breadcrumb · `Tabs` — Section switcher inside one page (Details, Progress, Files, Comments)
- **Courier**: `CourierDelivery` — One screen per delivery for the courier on a phone
- **Filters**: `Chips` — Quick filters for a list, shown as one row · `SearchField` — A search input with a leading magnifier
- **Data**: `DataTable` — The list table · `Pagination` — Page controls plus one summary · `StatusBars` — Horizontal bars for a status distribution in pipeline order · `TrendChart` — A line chart with a true zero baseline and real tick marks · `Progress` — A single-value progress bar with an optional label · `DefList` — Label and value pairs in a grid
- **Production**: `TankGauge` — Fill level of the acid solution tank · `PlateCanvas` — A scaled layout of a plate with placed jobs
- `AuthLayout` — AuthLayout · `ColorOptions` — ColorOptions · `RadioGroup` — RadioGroup · `Notice` — Notice · `ProgressTimeline` — ProgressTimeline · `FileList` — FileList · `ProcessGrid` — ProcessGrid · `ChatFab` — ChatFab
- **Screens**: `ClientDashboard` (showcase page) — Client home · `ClientNewClaim` (showcase page) — Claim form · `ClientNewOrder` (showcase page) — New order form, shared with the employee Edit order screen through the same field set · `ClientOrders` (showcase page) — Client order list · `ClientProfile` (showcase page) — Profile in two cards · `ClientRegister` (showcase page) — Client registration in three steps (Personal, Password, Company) inside AuthLayout: a nav panel with the promise and three benefits, and one task per step with… · `CourierDelivery_Screen` (showcase page) — One delivery per screen on a phone · `EmployeeDashboard` (showcase page) — Employee home: four task tiles (all zero here, shown with a real EmptyState instead of a blank table) and the assigned orders table · `EmployeeEditOrder` (showcase page) — Edit order uses the same form as the client New order, with the internal Distortion and Job path fields added for staff · `EmployeeOrderDetail` (showcase page) — Employee order detail · `EmployeeOrderFiles` (showcase page) — Files tab as a FileList (staff files, design links, ripping links, each with a text action) plus the upload Dropzone · `EmployeeOrderProgress` (showcase page) — Progress tab as one vertical ProgressTimeline: the same five stages as the header stepper (Submission, Design, Ripping, Prepress, Delivery), with the sub-proce… · `ManagerDashboard` (showcase page) — Manager home · `OrderDetail` (showcase page) — Order detail: header card with order number, status, priority and the five-stage OrderStepper; Tabs for Details, Progress, Files, Comments; DefList cards; and… · `OrdersList` (showcase page) — Orders list: one chip row for status, one filter row (search, designer, sort), a DataTable with the record link in the first column, and a single Pagination · `PrepressHistory` (showcase page) — Order history for the prepress portal: one search, one filter chip row, a DataTable with the status as a translated StatusBadge (label), and one pagination sum… · `PrepressOrderDetail` (showcase page) — The prepress floor screen: nine large process cards in a 3 × 3 grid, Arabic first · `PrepressOrders` (showcase page) — Prepress order list for the floor operator, Arabic first (dir="rtl")
