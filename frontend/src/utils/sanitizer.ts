/**
 * Frontend input sanitization utilities
 * Prevents XSS and injection attacks using regex-based character filtering
 */

/**
 * Sanitizes string input to prevent XSS attacks and SQL injection
 * - Only allows alphanumeric characters and spaces
 * - Removes all special characters
 *
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');

  // Only allow alphanumeric characters and spaces
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');

  return sanitized;
}

/**
 * Sanitizes email input
 * - Converts to lowercase for consistency
 * - Removes dangerous characters (XSS and SQL injection)
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

  let sanitized = email.toLowerCase();

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');

  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>'`";#\\]/g, '');

  // Only allow valid email characters: alphanumeric, +, -, ., _, @, spaces
  sanitized = sanitized.replace(/[^a-z0-9+\-._@\s]/g, '');

  return sanitized;
}

/**
 * Sanitizes name/text fields
 * - Removes dangerous characters (XSS and SQL injection)
 * - Allows letters, numbers, spaces, hyphens, apostrophes
 *
 * @param input - The text to sanitize
 * @returns Sanitized text
 */
export function sanitizeName(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove null bytes and control characters (ASCII 0-31 and 127)
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');

  // Only allow alphanumeric characters, spaces, hyphens, and apostrophes
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-']/g, '');

  // Prevent double dashes
  sanitized = sanitized.replace(/--+/g, '-');

  return sanitized;
}
/**
 * Sanitizes city input
 * - Only allows alphanumeric characters and spaces
 *
 * @param input - The city to sanitize
 * @returns Sanitized city
 */
export function sanitizeCity(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove null bytes and control characters
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');

  // Only allow alphanumeric characters and spaces
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');

  return sanitized;
}

export function sanitizeAddress(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove null bytes and control characters
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');

  // Only allow alphanumeric characters, spaces, hyphens, commas, and periods
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-,.]/g, '');

  // Prevent double dashes
  sanitized = sanitized.replace(/--+/g, '-');

  return sanitized;
}

/**
 * Sanitizes postal code input
 * - Removes dangerous characters (XSS and SQL injection)
 * - Allows alphanumeric and spaces only
 *
 * @param input - The postal code to sanitize
 * @returns Sanitized postal code
 */
export function sanitizePostalCode(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.toUpperCase();

  // Remove null bytes and control characters
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');

  // Only allow alphanumeric and spaces
  sanitized = sanitized.replace(/[^A-Z0-9\s]/g, '');

  return sanitized;
}
/**
 * Sanitizes phone number input
 * - Removes dangerous characters (XSS and SQL injection)
 * - Allows digits, spaces, hyphens, parentheses, plus sign, and periods
 *
 * @param input - The phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove null bytes and control characters
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');

  // Allow digits, spaces, hyphens, parentheses, plus sign, and periods
  sanitized = sanitized.replace(/[^\d\s()+.-]/g, '');

  // Prevent double dashes
  sanitized = sanitized.replace(/--+/g, '-');

  return sanitized;
}

/**
 * Validates and sanitizes email with stricter rules
 * Ensures proper domain format with valid TLD
 *
 * @param email - The email to validate and sanitize
 * @returns Object with sanitized email and validation status
 */
export function validateAndSanitizeEmail(email: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
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
 * - Removes dangerous characters (XSS and SQL injection)
 * - Allows alphanumeric only
 *
 * @param input - The token to sanitize
 * @returns Sanitized token
 */
export function sanitizeToken(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove null bytes and control characters
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');

  // Only allow alphanumeric
  sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');

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
