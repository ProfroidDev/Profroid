/**
 * Frontend input sanitization utilities
 * Prevents XSS and injection attacks using regex-based character filtering
 */

/**
 * Sanitizes string input to prevent XSS attacks
 * - Removes dangerous HTML/JavaScript characters
 * - Removes dangerous event handler and script keywords
 * - Removes null bytes and control characters
 * - Preserves safe text content
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
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

  // Remove dangerous HTML/JavaScript characters
  sanitized = sanitized.replace(/[<>\"'`]/g, '');
  
  // Remove dangerous protocols (case-insensitive)
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Remove dangerous event handlers and keywords (case-insensitive)
  sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // onclick=, onerror=, onload=, etc.
  sanitized = sanitized.replace(/\bscript\b/gi, '');
  sanitized = sanitized.replace(/\balert\b/gi, '');
  sanitized = sanitized.replace(/\beval\b/gi, '');
  sanitized = sanitized.replace(/\biframe\b/gi, '');
  sanitized = sanitized.replace(/\bimg\b(?=\s+src)/gi, '');
  sanitized = sanitized.replace(/\bsvg\b/gi, '');
  sanitized = sanitized.replace(/\bstyle\b/gi, '');
  sanitized = sanitized.replace(/\blink\b/gi, '');

  return sanitized;
}

/**
 * Sanitizes email input
 * - Converts to lowercase for consistency
 * - Removes dangerous characters
 * - Allows typing while you're still composing the email
 * - NOTE: Final validation happens via validateAndSanitizeEmail() on blur/submit
 * 
 * @param email - The email to sanitize
 * @returns Sanitized email (allows incomplete emails while typing)
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
  // This allows users to type while composing - validation happens in validateAndSanitizeEmail()
  sanitized = sanitized.replace(/[^a-z0-9+\-._@]/g, '');

  return sanitized;
}

/**
 * Sanitizes name/text fields
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

  let sanitized = input.trim();

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // Allow letters, numbers, spaces, hyphens, apostrophes, and accented characters
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

  let sanitized = input.trim();

  // Remove null bytes and control characters
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

  let sanitized = input.trim().toUpperCase();

  // Remove null bytes and control characters
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // Allow only alphanumeric and spaces
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

  let sanitized = input.trim();

  // Remove null bytes and control characters
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // Allow: digits, spaces, hyphens, parentheses, plus sign, periods
  sanitized = sanitized.replace(/[^\d\s\-()+ .]/g, '');

  return sanitized;
}

/**
 * Validates and sanitizes email with stricter rules
 * Ensures proper domain format with valid TLD
 * 
 * @param email - The email to validate and sanitize
 * @returns Object with sanitized email and validation status
 */
export function validateAndSanitizeEmail(
  email: string
): { isValid: boolean; sanitized: string; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, sanitized: '', error: 'Email is required' };
  }

  const sanitized = sanitizeEmail(email);

  if (!sanitized) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Email contains invalid characters or invalid format',
    };
  }

  // More strict email validation
  // Must have proper format with at least 2-character TLD
  const emailRegex = /^[a-z0-9+\-._]+@[a-z0-9+\-._]+\.[a-z]{2,}$/;

  if (!emailRegex.test(sanitized)) {
    return {
      isValid: false,
      sanitized: sanitized,
      error: 'Email must be in format: user@domain.com',
    };
  }

  // Check that it has a valid TLD (at least 2 chars, at most 6 chars, letters only)
  const domainPart = sanitized.split('@')[1];
  const tld = domainPart.split('.').pop() || '';

  if (tld.length < 2 || tld.length > 6 || !/^[a-z]+$/.test(tld)) {
    return {
      isValid: false,
      sanitized: sanitized,
      error: 'Invalid domain extension. Must end with valid TLD like .com, .org, .ca, etc.',
    };
  }

  return { isValid: true, sanitized };
}

/**
 * Sanitizes token input
 * - Removes dangerous characters
 * - Allows alphanumeric, hyphens, underscores, periods only
 * 
 * @param input - The token to sanitize
 * @returns Sanitized token
 */
export function sanitizeToken(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Remove null bytes and control characters
  sanitized = sanitized.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('');

  // Allow: alphanumeric, hyphens, underscores, periods only
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_.]/g, '');

  return sanitized;
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
  data: Record<string, string | number | boolean | null>,
  sanitizers: Record<string, (val: string) => string>
): Record<string, string | number | boolean | null | string> {
  const sanitized: Record<string, string | number | boolean | null | string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sanitizers[key] && typeof value === 'string') {
      sanitized[key] = sanitizers[key](value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
