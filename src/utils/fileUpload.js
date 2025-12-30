/**
 * File Upload Utilities
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

/**
 * Save uploaded file to disk
 * @param {Object} file - Fastify multipart file object
 * @param {string} subfolder - Subfolder name (e.g., 'profiles', 'posts')
 * @returns {Promise<string>} File URL path
 */
export async function saveFile(file, subfolder = 'profiles') {
  const uploadPath = path.join(UPLOAD_DIR, subfolder);
  
  // Create directory if it doesn't exist
  await fs.mkdir(uploadPath, { recursive: true });

  // Generate unique filename
  const ext = path.extname(file.filename) || '.jpg';
  const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
  const filepath = path.join(uploadPath, filename);

  // Save file
  const buffer = await file.toBuffer();
  await fs.writeFile(filepath, buffer);

  // Return URL path (relative to uploads directory)
  return `/uploads/${subfolder}/${filename}`;
}

/**
 * Convert file to base64 string
 * @param {Object} file - Fastify multipart file object
 * @returns {Promise<string>} Base64 encoded string with data URL prefix
 */
export async function fileToBase64(file) {
  const buffer = await file.toBuffer();
  const base64 = buffer.toString('base64');
  const mimeType = file.mimetype || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Delete file from disk
 * @param {string} fileUrl - File URL path (e.g., '/uploads/profiles/abc123.jpg')
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFile(fileUrl) {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      return false;
    }

    const filepath = path.join(__dirname, '../..', fileUrl);
    await fs.unlink(filepath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Validate image file
 * @param {Object} file - Fastify multipart file object
 * @returns {boolean} True if valid image
 */
export function isValidImage(file) {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedMimeTypes.includes(file.mimetype);
}

