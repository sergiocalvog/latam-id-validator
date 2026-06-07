export function validateDNI(value) {
  if (typeof value !== 'string') {
    return {
      valid: false,
      normalized: '',
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  const trimmed = value.trim();

  // Strict check for dots placement if present
  if (trimmed.includes('.')) {
    if (!/^\d{1,2}\.\d{3}\.\d{3}$/.test(trimmed)) {
      return {
        valid: false,
        normalized: trimmed.replace(/[\s.-]/g, ''),
        details: {},
        errors: ['FORMAT_INVALID']
      };
    }
  } else {
    // If no dots, must contain only digits
    if (!/^\d+$/.test(trimmed)) {
      return {
        valid: false,
        normalized: trimmed.replace(/[\s.-]/g, ''),
        details: {},
        errors: ['FORMAT_INVALID']
      };
    }
  }

  const normalized = trimmed.replace(/[\s.-]/g, '');
  const documentNumber = parseInt(normalized, 10);

  // Range check: must be between 1,000,000 and 99,999,999
  if (documentNumber < 1000000 || documentNumber > 99999999) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['OUT_OF_RANGE']
    };
  }

  return {
    valid: true,
    normalized,
    details: { document_number: documentNumber },
    errors: []
  };
}

/**
 * Common logic to validate Argentine CUIL and CUIT.
 * @param {string} value - Raw document value
 * @param {string} docType - 'CUIL' or 'CUIT'
 * @returns {object} { valid, normalized, details, errors }
 */
function validateCuilCuitCommon(value, docType) {
  if (typeof value !== 'string') {
    return {
      valid: false,
      normalized: '',
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Normalization: strip hyphens, spaces, dots
  const normalized = value.replace(/[\s.-]/g, '');

  // Format check: must be exactly 11 digits
  if (!/^\d{11}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Prefix checks
  const prefix = normalized.substring(0, 2);
  const validPrefixes = ['20', '23', '24', '25', '26', '27', '30', '33'];
  if (!validPrefixes.includes(prefix)) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['INVALID_PREFIX']
    };
  }

  // Determine type
  let type = 'other';
  if (prefix === '20') {
    type = 'male';
  } else if (prefix === '27') {
    type = 'female';
  } else if (prefix === '30' || prefix === '33') {
    type = 'company';
  }

  const dni = normalized.substring(2, 10);
  const digits = normalized.split('').map(Number);

  // Check digit calculation
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * weights[i];
  }
  const remainder = sum % 11;
  const result = 11 - remainder;
  const dv = result === 11 ? 0 : result === 10 ? 9 : result;

  const originalCheckDigit = digits[10];

  if (originalCheckDigit !== dv) {
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
      type,
      dni
    },
    errors: []
  };
}

/**
 * Validates an Argentine CUIL.
 * @param {string} value
 * @returns {object}
 */
export function validateCUIL(value) {
  return validateCuilCuitCommon(value, 'CUIL');
}

/**
 * Validates an Argentine CUIT.
 * @param {string} value
 * @returns {object}
 */
export function validateCUIT(value) {
  return validateCuilCuitCommon(value, 'CUIT');
}
