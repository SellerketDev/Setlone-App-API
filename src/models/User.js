/**
 * User Model
 * Database operations for users table
 */
import { query, transaction } from '../config/database.js';

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.username - Username
 * @param {string} userData.passwordHash - Hashed password
 * @param {string} [userData.profileImage] - Profile image URL
 * @param {string} [userData.bio] - User bio
 * @param {string} [userData.realName] - Real name
 * @param {string} [userData.birthDate] - Birth date (YYYY-MM-DD)
 * @param {string} [userData.phoneNumber] - Phone number
 * @returns {Promise<Object>} Created user
 */
export async function createUser(userData) {
  const { 
    email, 
    username, 
    passwordHash, 
    profileImage = null, 
    bio = null,
    realName = null,
    birthDate = null,
    phoneNumber = null
  } = userData;
  
  // Generate unique UID
  const uid = await generateUniqueUID();
  
  const sql = `
    INSERT INTO users (
      email, username, password_hash, profile_image, bio,
      real_name, birth_date, phone_number, email_verified, uid
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [
    email, 
    username, 
    passwordHash, 
    profileImage, 
    bio,
    realName,
    birthDate,
    phoneNumber,
    false, // email_verified starts as false
    uid
  ]);
  
  return getUserById(result.insertId);
}

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserById(userId) {
  const sql = `
    SELECT 
      id, email, username, profile_image, bio, 
      real_name, birth_date, phone_number, uid,
      is_active, is_verified, email_verified,
      created_at, updated_at
    FROM users
    WHERE id = ? AND deleted_at IS NULL
  `;
  
  const rows = await query(sql, [userId]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserByEmail(email) {
  const sql = `
    SELECT 
      id, email, username, password_hash, profile_image, bio,
      real_name, birth_date, phone_number, uid,
      is_active, is_verified, email_verified,
      created_at, updated_at
    FROM users
    WHERE email = ? AND deleted_at IS NULL
  `;
  
  const rows = await query(sql, [email]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get user by username
 * @param {string} username - Username
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserByUsername(username) {
  const sql = `
    SELECT 
      id, email, username, password_hash, profile_image, bio,
      is_active, is_verified, created_at, updated_at
    FROM users
    WHERE username = ? AND deleted_at IS NULL
  `;
  
  const rows = await query(sql, [username]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
export async function updateUser(userId, updateData) {
  const allowedFields = ['username', 'profile_image', 'bio', 'is_active', 'is_verified'];
  const updates = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (updates.length === 0) {
    return getUserById(userId);
  }
  
  values.push(userId);
  const sql = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = ? AND deleted_at IS NULL
  `;
  
  await query(sql, values);
  return getUserById(userId);
}

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if exists
 */
export async function emailExists(email) {
  const sql = 'SELECT 1 FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1';
  const rows = await query(sql, [email]);
  return rows.length > 0;
}

/**
 * Check if username exists
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} True if exists
 */
export async function usernameExists(username) {
  const sql = 'SELECT 1 FROM users WHERE username = ? AND deleted_at IS NULL LIMIT 1';
  const rows = await query(sql, [username]);
  return rows.length > 0;
}

/**
 * Soft delete user
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteUser(userId) {
  const sql = `
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE
    WHERE id = ? AND deleted_at IS NULL
  `;
  
  const result = await query(sql, [userId]);
  return result.affectedRows > 0;
}

/**
 * Set email verification code
 * @param {string} email - User email
 * @param {string} code - Verification code
 * @returns {Promise<boolean>} Success status
 */
export async function setEmailVerificationCode(email, code) {
  const sql = `
    UPDATE users
    SET email_verification_code = ?,
        email_verification_sent_at = CURRENT_TIMESTAMP
    WHERE email = ? AND deleted_at IS NULL
  `;
  
  const result = await query(sql, [code, email]);
  return result.affectedRows > 0;
}

/**
 * Verify email with code
 * @param {string} email - User email
 * @param {string} code - Verification code
 * @returns {Promise<boolean>} True if verification successful
 */
export async function verifyEmailCode(email, code) {
  const sql = `
    UPDATE users
    SET email_verified = TRUE,
        email_verification_code = NULL
    WHERE email = ? 
      AND email_verification_code = ?
      AND deleted_at IS NULL
  `;
  
  const result = await query(sql, [email, code]);
  return result.affectedRows > 0;
}

/**
 * Check if phone number exists
 * @param {string} phoneNumber - Phone number to check
 * @returns {Promise<boolean>} True if exists
 */
export async function phoneNumberExists(phoneNumber) {
  const sql = 'SELECT 1 FROM users WHERE phone_number = ? AND deleted_at IS NULL LIMIT 1';
  const rows = await query(sql, [phoneNumber]);
  return rows.length > 0;
}

/**
 * Generate a unique 7-digit UID
 * @returns {Promise<string>} Unique 7-digit UID
 */
export async function generateUniqueUID() {
  let uid;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 100;

  while (exists && attempts < maxAttempts) {
    // Generate 7-digit random number
    uid = String(Math.floor(Math.random() * 9000000) + 1000000);
    
    // Check if UID already exists
    const sql = 'SELECT 1 FROM users WHERE uid = ? LIMIT 1';
    const rows = await query(sql, [uid]);
    exists = rows.length > 0;
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique UID');
  }

  return uid;
}

/**
 * Get user by UID
 * @param {string} uid - User UID
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserByUID(uid) {
  const sql = `
    SELECT 
      id, email, username, profile_image, bio, 
      real_name, birth_date, phone_number, uid,
      is_active, is_verified, email_verified,
      created_at, updated_at
    FROM users
    WHERE uid = ? AND deleted_at IS NULL
  `;
  
  const rows = await query(sql, [uid]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Update user UID
 * @param {number} userId - User ID
 * @param {string} newUID - New UID (must be 7 digits)
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserUID(userId, newUID) {
  // Validate UID format (7 digits)
  if (!/^\d{7}$/.test(newUID)) {
    throw new Error('UID must be exactly 7 digits');
  }

  // Check if UID already exists
  const existingUser = await getUserByUID(newUID);
  if (existingUser && existingUser.id !== userId) {
    throw new Error('UID already exists');
  }

  const sql = `
    UPDATE users
    SET uid = ?
    WHERE id = ? AND deleted_at IS NULL
  `;
  
  await query(sql, [newUID, userId]);
  return getUserById(userId);
}

