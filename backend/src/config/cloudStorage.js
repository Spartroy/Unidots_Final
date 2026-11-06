import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

// Cloud storage is on when Cloudinary credentials are present (CLOUDINARY_URL, or the three discrete vars).
// Evaluated lazily because dotenv may load after this module is imported.
export const isCloudEnabled = () =>
  Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );

let configured = false;
const ensureConfigured = () => {
  if (configured) return;
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  configured = true;
};

// Where multer writes the incoming file first. In cloud mode it is a temp folder that we clean up.
export const getUploadDir = (defaultDir) => {
  const dir = isCloudEnabled() ? path.join(os.tmpdir(), 'unidots-uploads') : defaultDir;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const uploadToCloud = async (file) => {
  const baseName = path.parse(file.filename).name;
  const options = { folder: 'unidots', public_id: baseName, overwrite: false, use_filename: false };
  try {
    return await cloudinary.uploader.upload(file.path, { ...options, resource_type: 'auto' });
  } catch (err) {
    // Formats Cloudinary cannot process as media (e.g. .ai/.eps) are stored as raw files.
    return await cloudinary.uploader.upload(file.path, { ...options, resource_type: 'raw' });
  }
};

/**
 * Persists a file that multer has written to disk.
 * Returns { path, previewPath, storage, publicId } to save on the File document.
 *  - cloud mode: uploads to Cloudinary, deletes the temp file, previews are Cloudinary URLs.
 *  - local mode: keeps the file on disk and builds a 300px preview with sharp (previous behaviour).
 */
export const persistUploadedFile = async (file) => {
  const isImage = file.mimetype?.startsWith('image/');

  if (isCloudEnabled()) {
    ensureConfigured();
    const result = await uploadToCloud(file);
    fs.promises.unlink(file.path).catch(() => {});
    let previewPath;
    if (isImage && result.resource_type === 'image') {
      previewPath = cloudinary.url(result.public_id, {
        resource_type: 'image',
        secure: true,
        transformation: [{ width: 300, height: 300, crop: 'limit' }],
        format: result.format,
      });
    }
    return { path: result.secure_url, previewPath, storage: 'cloudinary', publicId: result.public_id };
  }

  let previewPath;
  if (isImage) {
    try {
      previewPath = path.join(path.dirname(file.path), 'preview-' + file.filename);
      await sharp(file.path).resize(300, 300, { fit: 'inside' }).toFile(previewPath);
    } catch (error) {
      console.error('Preview generation error:', error.message);
      previewPath = undefined; // continue without a preview
    }
  }
  return { path: file.path, previewPath, storage: 'local', publicId: undefined };
};
