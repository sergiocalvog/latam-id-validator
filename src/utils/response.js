/**
 * Generates metadata object for standard API responses.
 * @param {string} version
 * @returns {object}
 */
const getMeta = (version = "1.0.0") => ({
  version,
  timestamp: new Date().toISOString(),
  request_id: crypto.randomUUID()
});

/**
 * Returns a standard validation response (always HTTP 200).
 * @param {boolean} valid
 * @param {string} country
 * @param {string} docType
 * @param {string} normalized
 * @param {object} details
 * @param {string[]} errors
 * @param {string} version
 * @returns {object}
 */
export const validationResponse = (valid, country, docType, normalized, details = {}, errors = [], version = "1.0.0") => {
  return {
    success: true,
    data: {
      valid,
      country,
      document_type: docType,
      normalized,
      details,
      errors
    },
    meta: getMeta(version)
  };
};

/**
 * Returns a standard validation response for batch validation (HTTP 200).
 * @param {object[]} results
 * @param {string} version
 * @returns {object}
 */
export const batchValidationResponse = (results, version = "1.0.0") => {
  return {
    success: true,
    data: {
      results
    },
    meta: getMeta(version)
  };
};

/**
 * Returns a standard API error response.
 * @param {string} code
 * @param {string} message
 * @param {string} version
 * @returns {object}
 */
export const apiErrorResponse = (code, message, version = "1.0.0") => {
  return {
    success: false,
    error: {
      code,
      message
    },
    meta: getMeta(version)
  };
};
