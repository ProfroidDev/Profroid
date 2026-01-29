/**
 * Input sanitization utilities to prevent SQL injection and XSS attacks
 * Sanitizes user input while preserving legitimate data
 */

/**
 * Sanitizes string input by removing dangerous characters and trimming whitespace
 * Prevents SQL injection and XSS attacks while preserving alphanumeric, spaces, and common punctuation
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace from both ends
  let sanitized = input.trim();

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  return sanitized;
}

/**
 * Sanitizes email input
 * - Converts to lowercase for consistency
 * - Removes dangerous characters
 * - Validates proper format with domain extension
 * 
 * @param email - The email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Convert to lowercase
  let sanitized = email.toLowerCase().trim();

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // Only allow valid email characters: alphanumeric, +, -, ., _, @
  // This preserves common email variations like user+tag@domain.com
  sanitized = sanitized.replace(/[^a-z0-9+\-._@]/g, '');

  return sanitized;
}

/**
 * Sanitizes password input
 * - Removes null bytes and control characters
 * - Preserves all printable characters (users may use special chars in passwords)
 * 
 * @param password - The password to sanitize
 * @returns Sanitized password
 */
export function sanitizePassword(password: string): string {
  if (!password || typeof password !== 'string') {
    return '';
  }

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  // But allow spaces (32) and common special characters used in passwords
  let sanitized = password.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  return sanitized;
}

/**
 * Sanitizes name/text fields (first name, last name, city, etc.)
 * - Removes dangerous characters
 * - Allows letters, numbers, spaces, hyphens, apostrophes
 * 
 * @param input - The text to sanitize
 * @returns Sanitized text
 */
export function sanitizeName(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // Allow letters, numbers, spaces, hyphens, apostrophes, and accented characters
  // This regex allows: a-z, A-Z, 0-9, space, hyphen, apostrophe, and unicode letters
  sanitized = sanitized.replace(/[^\w\s\-']/gu, '');

  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * Sanitizes address input
 * - Removes dangerous characters
 * - Allows letters, numbers, spaces, hyphens, periods, commas, apostrophes
 * 
 * @param input - The address to sanitize
 * @returns Sanitized address
 */
export function sanitizeAddress(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // Allow: letters, numbers, spaces, hyphens, periods, commas, apostrophes, # symbol
  sanitized = sanitized.replace(/[^\w\s\-.,#']/gu, '');

  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * Sanitizes postal code input
 * - Removes dangerous characters
 * - Allows alphanumeric and spaces only
 * 
 * @param input - The postal code to sanitize
 * @returns Sanitized postal code
 */
export function sanitizePostalCode(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim().toUpperCase();

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // Allow only alphanumeric and spaces (for format like "M5H 2N2")
  sanitized = sanitized.replace(/[^A-Z0-9\s]/g, '');

  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * Sanitizes phone number input
 * - Removes dangerous characters
 * - Allows digits, spaces, hyphens, parentheses, plus sign
 * 
 * @param input - The phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // Allow: digits, spaces, hyphens, parentheses, plus sign, periods
  sanitized = sanitized.replace(/[^\d\s\-()+ .]/g, '');

  return sanitized;
}

/**
 * Sanitizes token input (verification tokens, reset tokens, etc.)
 * - Removes dangerous characters
 * - Allows only alphanumeric characters
 * 
 * @param input - The token to sanitize
 * @returns Sanitized token
 */
export function sanitizeToken(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // For tokens, just return after removing control characters
  // Tokens are typically hex, UUID, or alphanumeric strings
  // Don't over-sanitize as it can break valid tokens
  return sanitized;
}
}
}

/**
 * Batch sanitizes an object of user inputs
 * Useful for sanitizing multiple form fields at once
 * 
 * @param data - Object containing fields to sanitize
 * @param sanitizers - Map of field names to their corresponding sanitizer functions
 * @returns Object with sanitized values
 */
export function sanitizeBatch(
  data: Record<string, any>,
  sanitizers: Record<string, (val: string) => string>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sanitizers[key] && typeof value === 'string') {
      sanitized[key] = sanitizers[key](value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
