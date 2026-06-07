/**
 * Validates a Colombian Cédula de Ciudadanía document.
 * @param {string} value - Raw document value
 * @returns {object} { valid, normalized, details, errors }
 */
export function validateCedula(value) {
  if (typeof value !== 'string') {
    return {
      valid: false,
      normalized: '',
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Normalization: strip dots, hyphens, spaces
  const normalized = value.replace(/[\s.-]/g, '');

  // Format check: must be digits only
  if (!/^\d+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['FORMAT_INVALID']
    };
  }

  // Length check: 6 to 10 digits
  if (normalized.length < 6 || normalized.length > 10) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['OUT_OF_RANGE']
    };
  }

  const numericValue = parseInt(normalized, 10);

  // Reject if value is 0
  if (numericValue === 0) {
    return {
      valid: false,
      normalized,
      details: {},
      errors: ['OUT_OF_RANGE']
    };
  }

  // Estimate region based on document number range
  let estimatedRegion = null;
  if (numericValue >= 1 && numericValue <= 9999999) {
    estimatedRegion = 'historical';
  } else if (numericValue >= 10000000 && numericValue <= 19999999) {
    estimatedRegion = 'costa_caribe';
  } else if (numericValue >= 70000000 && numericValue <= 79999999) {
    estimatedRegion = 'antioquia';
  } else if (numericValue >= 1000000000) {
    estimatedRegion = 'digital';
  }

  return {
    valid: true,
    normalized,
    details: {
      document_number: normalized,
      estimated_region: estimatedRegion
    },
    errors: []
  };
}
