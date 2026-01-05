// Postal code validation rules by province
// Only Quebec (QC) and Ontario (ON) are allowed for appointments
// Format: First letter of postal code indicates province
export const VALID_PROVINCES = {
  "QC": ["G", "H", "J"],  // Quebec postal codes start with G, H, or J
  "ON": ["K", "L", "M", "N", "P"],  // Ontario postal codes start with K, L, M, N, or P
  "QUEBEC": ["G", "H", "J"],
  "ONTARIO": ["K", "L", "M", "N", "P"],
};

/**
 * Validates that the province is either Quebec or Ontario
 */
export function validateProvinceRestriction(province: string): boolean {
  if (!province) return false;
  const normalizedProvince = province.trim().toUpperCase();
  return (
    normalizedProvince === "QC" ||
    normalizedProvince === "ON" ||
    normalizedProvince === "QUEBEC" ||
    normalizedProvince === "ONTARIO"
  );
}

/**
 * Validates Canadian postal code format (A1A 1A1)
 * Must be exactly 7 characters: Letter-Digit-Letter SPACE Digit-Letter-Digit
 */
export function validatePostalCodeFormat(postalCode: string): boolean {
  if (!postalCode) return false;
  
  const normalized = postalCode.trim().toUpperCase();
  
  // Must be exactly 7 characters with space in the middle (A1A 1A1)
  // Or 6 characters without space (A1A1A1) - we'll accept both
  const withSpace = /^[A-Z]\d[A-Z]\s\d[A-Z]\d$/;
  const withoutSpace = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
  
  return withSpace.test(normalized) || withoutSpace.test(normalized);
}

/**
 * Validates that the postal code matches the given province
 * Returns true if valid, false otherwise
 */
export function validatePostalCodeForProvince(postalCode: string, province: string): boolean {
  if (!postalCode || !province) return false;
  
  const normalizedProvince = province.trim().toUpperCase();
  const normalizedPostalCode = postalCode.trim().toUpperCase();
  
  if (normalizedPostalCode.length === 0) return false;
  
  const firstChar = normalizedPostalCode.charAt(0);
  const validChars = VALID_PROVINCES[normalizedProvince as keyof typeof VALID_PROVINCES];
  
  if (!validChars) return false;
  
  return validChars.includes(firstChar);
}

/**
 * Gets validation error message for postal code and province combination
 * Returns null if valid, error key if invalid
 */
export function getProvincePostalCodeError(
  postalCode: string,
  province: string
): string | null {
  if (!postalCode || !province) return null;
  
  // Check if province is valid (QC or ON only)
  if (!validateProvinceRestriction(province)) {
    return "validation.provinceNotAllowed";
  }
  
  // Check format first (A1A 1A1 or A1A1A1)
  if (!validatePostalCodeFormat(postalCode)) {
    return "validation.invalidPostalCode";
  }
  
  // Check if postal code first letter matches the province
  if (!validatePostalCodeForProvince(postalCode, province)) {
    const normalizedProvince = province.trim().toUpperCase();
    if (normalizedProvince === "QC" || normalizedProvince === "QUEBEC") {
      return "validation.postalCodeNotQC";
    } else if (normalizedProvince === "ON" || normalizedProvince === "ONTARIO") {
      return "validation.postalCodeNotON";
    }
    return "validation.invalidPostalCode";
  }
  
  return null;
}

// Legacy function for backward compatibility
export const postalCodeRules: Record<string, Record<string, RegExp>> = {
  "Ontario": {
    "Toronto": /^M\d[A-Z]\s?\d[A-Z]\d$/i,
    "Ottawa": /^K[0-2][A-Z]\s?\d[A-Z]\d$/i,
    "Hamilton": /^L[89][A-Z]\s?\d[A-Z]\d$/i,
    "London": /^N[5-6][A-Z]\s?\d[A-Z]\d$/i,
  },
  "Quebec": {
    "Montreal": /^H[1-4][A-Z]\s?\d[A-Z]\d$/i,
    "Quebec City": /^G[1-3][A-Z]\s?\d[A-Z]\d$/i,
    "Laval": /^H[7-9][A-Z]\s?\d[A-Z]\d$/i,
    "Gatineau": /^J[8-9][A-Z]\s?\d[A-Z]\d$/i,
  },
};

export function validatePostalCodeForCity(postalCode: string, city: string, province: string): boolean {
  // Only allow Quebec and Ontario provinces
  if (province !== "Ontario" && province !== "Quebec") {
    return false; // Reject any province other than Ontario or Quebec
  }
  
  const provinceData = postalCodeRules[province];
  if (!provinceData) return false; // Province must be in our rules
  
  const pattern = provinceData[city];
  if (!pattern) return true; // If city not in rules, allow any postal code for that province
  
  return pattern.test(postalCode);
}

export function getPostalCodeError(postalCode: string, city: string, province: string): string | null {
  if (!postalCode) return null;
  
  // Check if province is Quebec or Ontario
  if (province !== "Ontario" && province !== "Quebec") {
    return "validation.provinceNotAllowed";
  }
  
  if (!validatePostalCodeForCity(postalCode, city, province)) {
    return `validation.postalCodeMismatch`;
  }
  return null;
}
