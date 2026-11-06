// One-off: copy files that are still on local disk to Cloudinary and update their File records.
//   node scripts/migrateUploadsToCloud.js            -> dry run (lists what would move)
//   node scripts/migrateUploadsToCloud.js --apply    -> upload and update records
// Requires MONGODB_URI and Cloudinary credentials in .env. Run it where the old uploads folder exists.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../src/config/mongodb.js';
import File from '../src/models/fileModel.js';
import { isCloudEnabled, persistUploadedFile } from '../src/config/cloudStorage.js';

const apply = process.argv.includes('--apply');

if (!isCloudEnabled()) {
  console.error('Cloudinary credentials are not set. Aborting.');
  process.exit(1);
}

await connectDB();

// Files whose path is not a URL are local. (Older records have no `storage` field.)
const files = await File.find({ path: { $not: /^https?:\/\//i } });
let moved = 0;
let missing = 0;
let failed = 0;

for (const f of files) {
  // Old records store an absolute path from the machine that uploaded them; fall back to ./uploads/<name>.
  const candidates = [f.path, path.join(process.cwd(), 'uploads', path.basename(f.path || f.filename))];
  const found = candidates.find((p) => p && fs.existsSync(p));
  if (!found) {
    missing++;
    console.log(`MISSING  ${f._id}  ${f.originalname}`);
    continue;
  }
  if (!apply) {
    console.log(`WOULD MOVE  ${f._id}  ${f.originalname}`);
    continue;
  }
  try {
    // persistUploadedFile deletes the source after upload, so work on a temp copy.
    const tmp = path.join(path.dirname(found), `migrate-${path.basename(found)}`);
    fs.copyFileSync(found, tmp);
    const stored = await persistUploadedFile({
      path: tmp,
      filename: f.filename,
      mimetype: f.mimetype,
    });
    f.path = stored.path;
    f.previewPath = stored.previewPath;
    f.storage = stored.storage;
    f.publicId = stored.publicId;
    await f.save();
    moved++;
    console.log(`MOVED    ${f._id}  ${f.originalname}`);
  } catch (err) {
    failed++;
    console.error(`FAILED   ${f._id}  ${f.originalname}: ${err.message}`);
  }
}

console.log(`\nDone. ${apply ? 'moved' : 'to move'}: ${apply ? moved : files.length - missing}, missing on disk: ${missing}, failed: ${failed}`);
await mongoose.disconnect();
