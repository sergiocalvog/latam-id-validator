/**
 * Validates a Chilean RUT (Rol Único Tributario) document.
 * @param {string} value - Raw document value
 * @returns {object} { valid, normalized, details, errors }
 */
export function validateRUT(value) {
  if (typeof value !== 'string') {
    return {
      valid: false,
      normalized: '',
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Normalization: strip dots, hyphens, spaces, and convert to uppercase
  const normalized = value.replace(/[\s.-]/g, '').toUpperCase();

  // Format check: must be 7-8 digits followed by a digit or K
  if (!/^\d{7,8}[0-9K]$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  const body = normalized.slice(0, -1);
  const checkDigit = normalized.slice(-1);

  // Reject RUT if the body is all zeroes (e.g., 00.000.000-0)
  if (/^0+$/.test(body)) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Modulo 11 Algorithm
  // Take body digits from right to left
  const digits = body.split('').reverse().map(Number);
  let sum = 0;
  let multiplier = 2;

  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const result = 11 - remainder;

  let expectedCheckDigit;
  if (result === 11) {
    expectedCheckDigit = '0';
  } else if (result === 10) {
    expectedCheckDigit = 'K';
  } else {
    expectedCheckDigit = String(result);
  }

  if (checkDigit !== expectedCheckDigit) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['CHECK_DIGIT_INVALID']
    };
  }

  return {
    valid: true,
    normalized,
    details: {
      body,
      check_digit: checkDigit
    },
    errors: []
  };
}
