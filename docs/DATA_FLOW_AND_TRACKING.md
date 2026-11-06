# UniDots: data flow, order life cycle and access control

Written from the code as it stands after this change. "Fixed" means fixed in this commit.

## 1. The order life cycle from every point of view

| Stage | Status | Who acts | What they do | What each other role sees |
|---|---|---|---|---|
| 1. Request | Submitted | **Client** | Fills the order wizard (or reorders), may attach files later | Manager: new order, unassigned. Designer: nothing until assigned. Prepress and courier: nothing |
| 2. Quote (optional) | Awaiting Approval | **Manager** sends a quote; **Client** approves with a typed signature or rejects | Approval is recorded (name, time, address). A required quote blocks all work | Client: quote card and banner. Manager: waiting list on the dashboard. Staff: the order stays parked |
| 3. Assignment | Submitted → Designing | **Manager** (or the client's default designer) | Assigns a designer | Designer gets the order and a notification. Client sees "Design in progress" |
| 4. Design | Designing → Design Done | **Designer** | Uploads artwork or a design link, adds comments | Client: comments and files. Manager: everything |
| 5. Ripping | Design Done → In Prepress | **Designer** | Marks ripping done. **Plate material is taken out of stock here, once** | Prepress: the order appears. Client: "Plates being made" |
| 6. Plate making | In Prepress | **Prepress** | Ticks the nine plate steps; solvent use is recorded per order | Client: stage banner. Manager: progress and stock |
| 7. Prepress done | Ready for Delivery | **Prepress** marks done, **Manager** marks ready | Designer/manager chooses direct, shipping company or client collection | Courier: the order appears once a delivery method exists |
| 8. Delivery | Delivering → Completed | **Courier** claims, uploads shipment label, confirms | Client is notified when the label is uploaded and when delivered | Client: "On the way", then Completed |
| 9. After sales | Completed | **Client** may reorder or open a claim; **Manager/Designer** handle the claim | Claim has its own files, comments and status | Client: reports by month |

Side paths: **On Hold** (rejected required quote, manual hold) and **Cancelled** (client, before production).

## 2. Who can read what (after this change)

| Data | Client | Designer | Prepress | Courier | Manager/Admin |
|---|---|---|---|---|---|
| Orders | Own only | Assigned to them (any stage) | From **In Prepress** onward | With a delivery method, from **Ready for Delivery** | All |
| Prices, quote, cost | Own quote and final price | Never | Never | Never | All |
| Job path, distortion | Never | Yes | Yes | Never | Yes |
| Client contact | Own | Name, company, email, phone, address | Name and company only | Name, company, phone, address (to deliver) | All |
| Comments, history, design links | Own order, staff emails hidden | Yes | Yes | None | All |
| Files | Files of own orders and claims | Files of assigned orders, own uploads | Files of prepress-stage orders | Files of delivery-stage orders | All |
| Claims | Own | Assigned to them | None | None | All |
| Audit log (activity) | No | No | No | No | Yes |

Order timelines: every role sees the events of orders it may open, trimmed to its role (clients do not see stock or courier-claim events; couriers see only status, courier, shipment and delivery events). Managers also see recorded reads such as file downloads and refused attempts.

## 3. What is recorded (audit log)

Append-only, written by the server, not editable from the app: sign-ins (successful and failed), user created / activated / deactivated, order status changes, quote sent / approved / rejected, price-list changes, stock received / counted, file downloads (including refused ones) and refused attempts to open an order. Each entry stores who (name, role), what, which record, when, and the network address. Managers read it at `GET /api/audit` (filter by record type, record, person, outcome, action, dates).

## 4. Problems found and fixed in this change

1. **File downloads needed no login (critical).** `GET /api/files/:id/download` was explicitly public, so anyone holding a file ID could download client artwork. Downloads now require a signed-in user who may see the file, either through the normal login header or a 90-second signed link requested by the app. Listing and reading file records is also restricted.
2. **Any staff member could open any order by ID,** including prices. Now each role opens only the orders in section 2.
3. **Prepress and courier accounts could list every order** (no filter applied for those roles). Fixed with a per-role filter that search and filters cannot widen. A designer's search also used to replace their "assigned to me" filter, so searching showed other people's orders; fixed.
4. **The recent-orders list showed all orders to designers.** Fixed.
5. **Clients received internal fields** (job path, distortion, price breakdown, staff emails) and **staff received prices.** Removed from responses by role.
6. **Prepress, courier and unassigned-designer access to claims** was open. Closed.
7. **No central record of who did what.** Added the audit log and per-order timeline.

## 5. Still open (honest list)

- Responses of some write actions (for example changing a status) still return the full order to the person who made the change; the main read paths are filtered, these are not yet.
- Chat, tasks and notifications have their own checks that were not changed here.
- Login tokens live in the browser's local storage.
- The audit log has no screen yet (API only) and no automatic expiry.
- Old file records keep absolute paths from the machine that uploaded them; they only download where those files still exist (see the Cloudinary reminder).
