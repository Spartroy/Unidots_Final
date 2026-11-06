# Unidots — Portal Use Cases & Project Review

Reviewed: 2026-11-06. Stack: React 18 + Tailwind (CRA) frontend, Express + MongoDB backend, deployed on Vercel.
Unidots is a **flexography prepress workflow platform** (photopolymer plate making) for *UniDots Prepress & Supply Co.*, Cairo, est. 2005.

## 1. The order lifecycle (shared by every portal)

`Submitted → Designing → Design Done → (In Review) → In Prepress → Ready for Delivery → (Delivering) → Completed`
plus `On Hold` / `Cancelled`.

Internal stages: **Production** (design + ripping) → **Prepress** (9 plate sub-processes: positioning, back exposure, laser imaging, main exposure, washout, drying, post exposure, UVC exposure, finishing) → **Delivery** (direct handover, shipping company, or client self-collection).

## 2. Use cases by portal

### Public site (`/`, `/login`, `/register`, `/DotDeformationDetector`)
- Learn what Unidots does (services, mission, contact form, address).
- Register as a client (company, phone, full structured address required).
- Sign in; get routed to the portal matching the account role.
- Dot Deformation Detector: upload a plate image, an AI service classifies dot deformation.

### Client portal (`/client/*`)
| Use case | Where |
|---|---|
| See order counts per stage and recent orders | Dashboard |
| Create a new order (package type, colors, dimensions, material, thickness, files, preferred designer) | Orders → New |
| Browse/search/filter orders, open one, follow a 5-step progress bar | Orders, Order detail |
| Chat with the designer, comment, download files and receipt | Order detail |
| Approve / request revision on a submitted design | Order detail |
| Choose or confirm delivery details | Order detail |
| Cancel an order (before production) | Order detail |
| Open a claim (with files) and follow its status | Claims |
| Edit profile, address, delivery pin, default designer | Profile |
| Ask the chatbot about order status | Floating ChatBot |

### Employee (designer) portal (`/employee/*`)
| Use case | Where |
|---|---|
| See assigned work and stats | Dashboard |
| Open an order, review client files, add design links, update status | Order detail |
| Edit order specifications | Order edit |
| Build a design from a template and submit it to an order | Templates, Template customize |
| Mark ripping complete → hands order to prepress | Order detail |
| Choose delivery method after prepress (direct / shipping company / client collection) | Order detail |
| Handle client claims | Claims |
| Work manager-assigned tasks | Tasks (hidden from nav) |

### Prepress portal (`/prepress/*`)
| Use case | Where |
|---|---|
| See orders currently in prepress | Orders (home) |
| Tick the 9 plate sub-processes; solvent use is auto-recorded | Order detail |
| Mark prepress complete (manager then prepares delivery) | Order detail |
| Review finished orders | History |
| Monitor solvent/acid solution level, refill, usage history | Acid Solution (hidden from nav) |
| Plate placement / monitoring | Plate Monitoring (hidden from nav) |

### Manager portal (`/manager/*`)
| Use case | Where |
|---|---|
| KPIs: orders, revenue, claims, workload | Dashboard |
| View all orders, assign to designers, assign stages, change status | Orders, Order detail |
| Create/edit/deactivate employees and couriers | Employees |
| Review clients and their history | Clients |
| Create and assign tasks | Tasks |
| Triage and assign claims | Claims |
| Monthly reports + CSV export | Reports |
| Barrel / solution management, plate monitoring | Barrel management, Plate monitoring (not in nav) |

### Courier portal (`/courier/*`)
| Use case | Where |
|---|---|
| See orders by delivery mode: Handover, Shipping company, Delivered | Dashboard |
| Claim an order, upload shipment label, update delivery, confirm completion | Order detail |
| View own profile (read-only) | Profile |

## 3. Errors and mistakes found

### Fixed in this pass (UX / correctness)
1. **Global CSS broke layouts.** `body { contain: layout style }` made `position: fixed` modals/overlays behave relative to the body instead of the viewport. Removed.
2. **Mobile CSS inflated every link and button** (`button, a { min-width/min-height: 44px }` under 640px) — inline links, icon buttons and badges became 44×44 boxes. Now scoped to real buttons only.
3. **A 403 logged the user out.** The axios interceptor cleared the session on any 401 *or* 403. A role-permission error (e.g. a prepress-role user hitting a department-checked route) kicked people to login. Now only 401 does; 403 shows a clear toast.
4. **Return-to link ignored.** `ProtectedRoute` stored where the user was going, `Login` computed `from`, and never used it. Deep links (e.g. an emailed order link) were lost. Now honoured when allowed for the role.
5. **Couriers redirected to a dead end.** `ProtectedRoute` had no `courier` case, so a courier on a wrong URL went to `/login` (which showed the form while signed in). Added, and login/register now redirect signed-in users to their portal.
6. **Login page visual bug.** The "Create a new account" button's icon was `absolute` without a `relative` parent, so it floated to the page edge. The email field used a key icon. Fixed; added show/hide password.
7. **Spinner flash every 60 s.** Seven pages reset `loading=true` inside the auto-refresh, replacing the whole page with a spinner each minute (and wiping scroll/inputs). Auto-refresh is now silent.
8. **Claim action buttons had no colour in production.** `StatusActions` built Tailwind classes dynamically (`bg-${color}-600`), which Tailwind purges. Replaced by a static map.
9. **Prepress auto-redirect did a full page reload** (`window.location.href`) and the toast said "history" but went to the list. Now client-side navigation to the history page.
10. **Dot Deformation Detector** used blocking `alert()`, and hard-coded `http://localhost:8000` (broken in production). Now uses toasts and `REACT_APP_AI_URL`.
11. **Courier dashboard**: plain "Loading…", silent failures, contradictory button classes (`text-blue-600 … text-white`). Added spinner, error state, consistent buttons.
12. **`Delivering` status** exists in the model but had no badge colour / client label.

13. **CRITICAL security hole — privilege escalation at signup.** Public `POST /api/auth/register` only required a manager token for `employee` and `manager`; sending `role: "admin"`, `"prepress"` or `"courier"` created that account with no authorization. Now every non-client role requires a manager/admin token (`backend/src/controllers/authController.js`). **Review existing users for unexpected admin/prepress/courier accounts.**

14. **Brand palette applied.** Tailwind `primary` is now the logo's deep blue, `secondary` the logo teal; all five navbars use `primary-900` with a teal active underline; browser/PWA theme colour changed from indigo to `#1B5E8A`. (The logo PNG still has a white box, so on the dark navbar it needs a reversed/transparent version — see `BRANDING_GUIDE.md` §3.)

15. **One shared layout.** The five near-identical layouts are now thin configs over `components/layouts/AppLayout.js`; hidden features (Employee Tasks/Templates, Prepress Acid Solution/Plate Monitoring, Manager Barrels/Plate Monitoring) sit under a "More" menu (desktop) and a "More" section (mobile).
16. **Reorder.** Clients get a **Reorder** button on the orders list and order detail; it opens New Order pre-filled from the old order. The "Fill Test Data" button is hidden in production.
17. **Repo hygiene.** `frontend/build/` and `backend/uploads/` are untracked and git-ignored (files stay on disk). If production serves uploads from the repo checkout, move them to persistent storage first.

Confirmed by you: the default shipping company ("Middle East") stays.

18. **Order detail pages split.** Client, employee, manager and prepress detail pages went from 1,224 / 1,865 / 1,372 / 1,352 lines to 499 / 667 / 525 / 863, with tabs, modals and sections moved to `pages/<portal>/orderDetail/*.js` (e.g. `DetailsTab`, `FilesTab`, `CancelModal`, `SubProcessesSection`). The build compiles. Remaining dead code (unused helpers, e.g. in prepress and client) is only warned about, not removed.
19. **Lint config fixed.** `.eslintrc.js` referenced a TypeScript rule that does not exist in this JavaScript project and failed the build; removed.

### Decided, not yet built
- EN/AR language toggle with RTL across all portals (Prepress defaults to Arabic).
- Show all hidden features in the nav, grouped (a "More" menu on desktop, sections in the mobile drawer).
- Biggest user pain points to design for: creating an order, tracking status, prepress floor use, manager oversight.

### Open issues (need your decision — see questions)
- **Language inconsistency:** Prepress nav is Arabic (`الأوردرات`) while every page and every other portal is English. No i18n; `LanguageToggle.js` is empty.
- **Hidden features:** Employee Tasks and Templates, Prepress Acid Solution and Plate Monitoring, Manager Barrels and Plate Monitoring have routes but no navigation entry.
- **Brand mismatch:** logo is teal/deep-blue halftone; app uses sky-blue `primary`, violet `secondary`, slate-800 nav with green underline, and manifest/theme colour `#4F46E5` (indigo). See `BRANDING_GUIDE.md`.
- **Role vs department:** `User.role` has a `prepress` value, but backend `prepress` / `prepressOrManager` middleware checks `department === 'prepress'`. A role-only prepress account gets 403 on process routes. Needs a data decision.
- **Dead code:** `ClaimsList.js` ×3 (unused), `LanguageToggle.js` (empty), `V1.png` duplicate asset, `PlateMonitoring` manager stub that re-exports the prepress page, committed `frontend/build/` and 150+ files in `backend/uploads/`.
- **Huge files:** `employee/OrderDetail.js` (1,865 lines), `manager/OrderDetail.js` (1,372), `prepress/OrderDetail.js`, `client/OrderDetail.js` (1,224). Hard to maintain; the same status and date helpers are copy-pasted across portals (e.g. `getStatusColor` exists in ≥4 places).
- **Duplicated headers/navbars:** five layouts are near-identical copies (~200 lines each).
- **26 `console.log` calls** left in production code; unused `API_URL` constant in `AuthContext`.
- **Accessibility:** colour-only status badges, icon-only buttons without labels, no skip link, nav not RTL-ready.
- **Security notes (backend):** uploads are served from a committed folder; JWT in `localStorage`.
- **Courier:** default shipping company is hard-coded to "Middle East" in the UI when none is set.
