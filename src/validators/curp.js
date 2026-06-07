import { STATES } from '../constants/states.js';

/**
 * Validates a Mexican CURP (Clave Única de Registro de Población) document.
 * @param {string} value - Raw document value
 * @returns {object} { valid, normalized, details, errors }
 */
export function validateCURP(value) {
  if (typeof value !== 'string') {
    return {
      valid: false,
      normalized: '',
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Normalization: trim, uppercase, remove whitespace
  const normalized = value.trim().toUpperCase();

  // Basic structure check: must be exactly 18 characters
  if (normalized.length !== 18) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Enforce structural regular expression
  // [0]: Initial of first surname (A-Z)
  // [1]: First internal vowel of first surname (A-Z)
  // [2]: Initial of second surname (A-Z)
  // [3]: Initial of first name (A-Z)
  // [4-9]: Birth date YYMMDD
  // [10]: Gender (H = Hombre, M = Mujer, X = Non-binary)
  // [11-12]: State code (e.g. DF, NE)
  // [13-15]: Internal consonants of first surname, second surname, first name
  // [16]: Century homoclave (0-9 or A-Z)
  // [17]: Check digit (0-9)
  const regex = /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HMX](AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TL|TS|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;
  
  if (!regex.test(normalized)) {
    // Determine specific errors for better detail if format fails
    const errors = [];
    
    // Gender check
    const genderChar = normalized[10];
    if (!['H', 'M', 'X'].includes(genderChar)) {
      errors.push('INVALID_GENDER');
    }

    // State check
    const stateCode = normalized.substring(11, 13);
    if (!STATES[stateCode]) {
      errors.push('INVALID_STATE');
    }

    // Date check (if year, month, day are digits)
    const datePart = normalized.substring(4, 10);
    if (/^\d{6}$/.test(datePart)) {
      const yearPrefix = /^[0-9]$/.test(normalized[16]) ? '19' : '20';
      const year = yearPrefix + normalized.substring(4, 6);
      const month = normalized.substring(6, 8);
      const day = normalized.substring(8, 10);
      const testDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      if (
        isNaN(testDate.getTime()) ||
        testDate.getUTCDate() !== Number(day) ||
        (testDate.getUTCMonth() + 1) !== Number(month) ||
        testDate.getUTCFullYear() !== Number(year)
      ) {
        errors.push('INVALID_DATE');
      }
    }

    return {
      valid: false,
      normalized,
      details: {},
      errors: errors.length > 0 ? errors : ['FORMAT_INVALID']
    };
  }

  // Extract variables for detailed checks
  const genderChar = normalized[10];
  const stateCode = normalized.substring(11, 13);
  const stateName = STATES[stateCode] || 'Unknown';

  // Century identification
  // If homoclave (index 16) is a number (0-9), birth year is 19YY.
  // If it's a letter (A-Z), birth year is 20YY.
  const centuryChar = normalized[16];
  const yearPrefix = /^[0-9]$/.test(centuryChar) ? '19' : '20';
  const year = yearPrefix + normalized.substring(4, 6);
  const month = normalized.substring(6, 8);
  const day = normalized.substring(8, 10);

  // Parse and validate date existence (e.g. Feb 29 in non-leap year)
  const birthDateStr = `${year}-${month}-${day}`;
  const birthDate = new Date(`${birthDateStr}T00:00:00.000Z`);
  if (
    isNaN(birthDate.getTime()) ||
    birthDate.getUTCDate() !== Number(day) ||
    (birthDate.getUTCMonth() + 1) !== Number(month) ||
    birthDate.getUTCFullYear() !== Number(year)
  ) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['INVALID_DATE']
    };
  }

  // Calculate Check Digit
  const dict = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = normalized[i];
    const val = dict.indexOf(char);
    // If a char is not found (which shouldn't happen if regex passed), indexOf returns -1
    const weight = 18 - i;
    sum += (val >= 0 ? val : 0) * weight;
  }
  const remainder = sum % 10;
  const calculatedCheckDigit = (10 - remainder) % 10;
  const originalCheckDigit = Number(normalized[17]);

  if (originalCheckDigit !== calculatedCheckDigit) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['CHECK_DIGIT_INVALID']
    };
  }

  // Map H/M/X to M/F/X
  const genderMap = { H: 'M', M: 'F', X: 'X' };
  const gender = genderMap[genderChar];

  return {
    valid: true,
    normalized,
    details: {
      birth_date: birthDateStr,
      gender,
      state_code: stateCode,
      state_name: stateName
    },
    errors: []
  };
}
