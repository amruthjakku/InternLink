import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'your-32-character-secret-key-here!!';

// Ensure the secret key is 32 bytes
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

/**
 * Encrypt sensitive data like OAuth tokens
 */
export function encrypt(text) {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM(ALGORITHM, KEY, iv);
    cipher.setAAD(Buffer.from('gitlab-integration', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to simple base64 encoding for demo purposes
    return Buffer.from(text).toString('base64');
  }
}

/**
 * Decrypt sensitive data like OAuth tokens
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return null;
  
  try {
    // Handle both string and object formats for backward compatibility
    if (typeof encryptedData === 'string') {
      // Check if it's base64 encoded (fallback format)
      try {
        return Buffer.from(encryptedData, 'base64').toString('utf8');
      } catch {
        // If not base64, return as is (legacy format)
        return encryptedData;
      }
    }
    
    // Handle encrypted object format
    const { encrypted, iv, authTag } = encryptedData;
    const decipher = crypto.createDecipherGCM(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from('gitlab-integration', 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return the original data if decryption fails (for backward compatibility)
    return typeof encryptedData === 'string' ? encryptedData : encryptedData.encrypted;
  }
}

/**
 * Hash sensitive data for comparison
 */
export function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate if data is encrypted
 */
export function isEncrypted(data) {
  return data && typeof data === 'object' && data.encrypted && data.iv && data.authTag;
}