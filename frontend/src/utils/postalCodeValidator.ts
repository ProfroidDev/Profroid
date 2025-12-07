// Postal code validation rules by province/city
// Format: Province -> { City -> Postal Code Pattern }
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
  "British Columbia": {
    "Vancouver": /^V[5-6][A-Z]\s?\d[A-Z]\d$/i,
    "Victoria": /^V[89][A-Z]\s?\d[A-Z]\d$/i,
    "Surrey": /^V[34][A-Z]\s?\d[A-Z]\d$/i,
    "Burnaby": /^V[35][A-Z]\s?\d[A-Z]\d$/i,
  },
  "Alberta": {
    "Calgary": /^T[12][A-Z]\s?\d[A-Z]\d$/i,
    "Edmonton": /^T[56][A-Z]\s?\d[A-Z]\d$/i,
    "Red Deer": /^T4[A-Z]\s?\d[A-Z]\d$/i,
  },
  "Manitoba": {
    "Winnipeg": /^R[23][A-Z]\s?\d[A-Z]\d$/i,
    "Brandon": /^R7[A-Z]\s?\d[A-Z]\d$/i,
  },
  "Saskatchewan": {
    "Saskatoon": /^S7[A-Z]\s?\d[A-Z]\d$/i,
    "Regina": /^S4[A-Z]\s?\d[A-Z]\d$/i,
  },
  "Nova Scotia": {
    "Halifax": /^B3[A-Z]\s?\d[A-Z]\d$/i,
    "Cape Breton": /^B1[A-Z]\s?\d[A-Z]\d$/i,
  },
};

export function validatePostalCodeForCity(postalCode: string, city: string, province: string): boolean {
  const provinceData = postalCodeRules[province];
  if (!provinceData) return true; // If province not in rules, allow any postal code
  
  const pattern = provinceData[city];
  if (!pattern) return true; // If city not in rules, allow any postal code for that province
  
  return pattern.test(postalCode);
}

export function getPostalCodeError(postalCode: string, city: string, province: string): string | null {
  if (!postalCode) return null;
  if (!validatePostalCodeForCity(postalCode, city, province)) {
    return `Postal code does not match ${city}, ${province}`;
  }
  return null;
}
