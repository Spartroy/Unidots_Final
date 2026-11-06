// Database backup using mongodump (MongoDB Database Tools must be installed).
//   node scripts/backup.js              -> writes ./backups/<timestamp>.archive.gz, keeps the newest 14
//   node scripts/backup.js --keep 30    -> keep the newest 30
// Restore:  mongorestore --uri "<MONGODB_URI>" --gzip --archive=backups/<file>.archive.gz
// If you use MongoDB Atlas on a paid tier, prefer Atlas Cloud Backup and treat this as an extra copy.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

const keepIdx = process.argv.indexOf('--keep');
const keep = keepIdx > -1 ? parseInt(process.argv[keepIdx + 1], 10) || 14 : 14;

const dir = path.join(process.cwd(), 'backups');
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = path.join(dir, `${stamp}.archive.gz`);

// Pass the connection string through the environment-free argument list (never printed).
const result = spawnSync('mongodump', [`--uri=${uri}`, '--gzip', `--archive=${file}`], { stdio: ['ignore', 'inherit', 'inherit'] });

if (result.error) {
  console.error('Could not run mongodump. Install the MongoDB Database Tools: https://www.mongodb.com/docs/database-tools/');
  process.exit(1);
}
if (result.status !== 0) {
  console.error('mongodump failed.');
  process.exit(result.status || 1);
}

const size = (fs.statSync(file).size / 1024 / 1024).toFixed(2);
console.log(`Backup written: ${file} (${size} MB)`);

// Keep only the newest `keep` backups
const old = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.archive.gz'))
  .sort()
  .reverse()
  .slice(keep);
for (const f of old) {
  fs.unlinkSync(path.join(dir, f));
  console.log(`Removed old backup: ${f}`);
}
