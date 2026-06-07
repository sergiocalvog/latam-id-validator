/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas) document.
 * @param {string} value - Raw document value
 * @returns {object} { valid, normalized, details, errors }
 */
export function validateCPF(value) {
  if (typeof value !== 'string') {
    return {
      valid: false,
      normalized: '',
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Normalization: strip dots, hyphens, spaces, and convert to uppercase
  const normalized = value.replace(/[\s.-]/g, '');

  // Format validation: must be exactly 11 digits
  if (!/^\d{11}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Reject repeating digit sequences (e.g., 111.111.111-11)
  if (/^(\d)\1{10}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['ALL_DIGITS_EQUAL']
    };
  }

  const digits = normalized.split('').map(Number);
  const regionCode = String(digits[8]);

  // Calculate First Digit
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += digits[i] * (10 - i);
  }
  const remainder1 = (sum1 * 10) % 11;
  const d1 = remainder1 >= 10 ? 0 : remainder1;

  // Calculate Second Digit
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += digits[i] * (11 - i);
  }
  const remainder2 = (sum2 * 10) % 11;
  const d2 = remainder2 >= 10 ? 0 : remainder2;

  // Validate check digits
  if (digits[9] !== d1 || digits[10] !== d2) {
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
    details: { region_code: regionCode },
    errors: []
  };
}
