# UniDots Operations Runbook

## Environment variables

**Backend (`backend/.env`, and the same names in your host's settings)**

| Name | Needed | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | Database connection |
| `JWT_SECRET` | yes | Signs login tokens. Use a long random value |
| `FRONTEND_URL` | yes (production) | Allowed website address for CORS |
| `NODE_ENV` | yes | `production` on the host |
| `PORT` | host sets it | |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | optional | Store uploads in Cloudinary instead of local disk (all three, or `CLOUDINARY_URL`) |

**Frontend (set at build time)**

| Name | Purpose |
|---|---|
| `REACT_APP_API_URL` | Backend address (leave empty if the website proxies `/api`) |
| `REACT_APP_AI_URL` | Dot Deformation Detector service address |

**Known configuration trap:** the backend CORS list in `backend/server.js` still contains the placeholder `https://your-vercel-domain.vercel.app`. Make sure `FRONTEND_URL` is your real website address, and remove the placeholder when convenient.

## Deploy checklist
1. CI is green on the commit (GitHub Actions: frontend tests and build, backend tests).
2. Environment variables above are set on the host.
3. Backend restarted; open `/api/health` and expect `{"status":"OK"}`.
4. Sign in as each role once (client, employee, prepress, manager, courier).
5. Send a test message from the website contact form and confirm it appears under Manager > Messages.

## Security settings in place
- Security headers on every response (helmet).
- Sign-in: 10 failed attempts per 15 minutes per address. Sign-up: 20 per hour. Contact form: 5 per hour. Hosts must pass the real client address (`trust proxy` is on).
- Only managers/admins can create employee, manager, admin, prepress or courier accounts.
- Tokens are still stored in the browser's local storage (a known trade-off; moving to secure cookies is a separate change).

## Monitoring
- Browser errors are reported to `POST /api/client-errors` and printed in the backend log as lines starting with `[client-error]`. Search your host's logs for that tag.
- Server crashes and unhandled promise failures are logged with `[uncaughtException]` / `[unhandledRejection]`. The process exits after an uncaught exception so the host restarts it.
- Not included: a hosted error tracker (Sentry etc.) and uptime alerts. Recommended next: an uptime monitor pointing at `/api/health`.

## Backups
- Run `node backend/scripts/backup.js` (needs MongoDB Database Tools). It writes compressed backups to `backend/backups/` and keeps the newest 14.
- Schedule it daily on the server (cron or the host's scheduler), and copy the files off the server.
- If the database is on MongoDB Atlas with a paid tier, turn on Atlas Cloud Backup as the main protection.
- Restore: `mongorestore --uri "<MONGODB_URI>" --gzip --archive=<file>`. Practise a restore into a test database at least once.
- Uploaded files are not in the database. With local storage, back up `backend/uploads/` too. With Cloudinary they are already stored there.

## Tests
- Frontend: `cd frontend && npm test` (route guards, status logic, translations match, order attention logic).
- Backend: `cd backend && npm test` (role guards, sign-up policy).
- Gaps: no end-to-end tests of full flows and no database-backed API tests yet.

## Open reminders
- **Cloudinary is paused.** To finish: uncomment the three `CLOUDINARY_*` lines in `backend/.env`, set them on the host, run `node scripts/migrateUploadsToCloud.js` (dry run, then `--apply`), and replace the API secret that was shared in chat.
