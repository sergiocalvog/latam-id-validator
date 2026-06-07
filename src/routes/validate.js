import { Hono } from 'hono';
import { validateCPF } from '../validators/cpf.js';
import { validateCURP } from '../validators/curp.js';
import { validateDNI, validateCUIL, validateCUIT } from '../validators/dni.js';
import { validateRUT } from '../validators/rut.js';
import { validateCedula } from '../validators/cedula.js';
import { SUPPORTED_DOCUMENTS } from '../constants/documents.js';
import { validationResponse, batchValidationResponse, apiErrorResponse } from '../utils/response.js';

const router = new Hono();

/**
 * Dispatch validation to the appropriate validator.
 * @param {string} country 
 * @param {string} docType 
 * @param {string} value 
 * @returns {object} { valid, normalized, details, errors }
 */
function performValidation(country, docType, value) {
  const c = String(country || '').trim().toUpperCase();
  const d = String(docType || '').trim().toUpperCase();

  if (c === 'BR' && d === 'CPF') return validateCPF(value);
  if (c === 'MX' && d === 'CURP') return validateCURP(value);
  if (c === 'AR') {
    if (d === 'DNI') return validateDNI(value);
    if (d === 'CUIL') return validateCUIL(value);
    if (d === 'CUIT') return validateCUIT(value);
  }
  if (c === 'CL' && d === 'RUT') return validateRUT(value);
  if (c === 'CO' && d === 'CEDULA') return validateCedula(value);

  return {
    valid: false,
    normalized: String(value || ''),
    details: {},
    errors: ['DOCUMENT_NOT_SUPPORTED']
  };
}

// POST /v1/validate
router.post('/validate', async (c) => {
  const version = c.env.API_VERSION || '1.0.0';
  let body;

  try {
    body = await c.req.json();
  } catch (err) {
    return c.json(
      apiErrorResponse('BAD_REQUEST', 'Invalid JSON payload', version),
      400
    );
  }

  const { country, document_type, value } = body || {};

  if (country === undefined || document_type === undefined || value === undefined) {
    return c.json(
      apiErrorResponse('BAD_REQUEST', 'Missing required fields: country, document_type, value', version),
      400
    );
  }

  const result = performValidation(country, document_type, value);

  return c.json(
    validationResponse(
      result.valid,
      String(country).toUpperCase(),
      String(document_type).toUpperCase(),
      result.normalized,
      result.details,
      result.errors,
      version
    )
  );
});

// POST /v1/validate/batch
router.post('/validate/batch', async (c) => {
  const version = c.env.API_VERSION || '1.0.0';
  const plan = c.get('plan') || 'free';

  // In the free plan, batch is disabled
  if (plan === 'free') {
    return c.json(
      apiErrorResponse('FORBIDDEN', 'Batch validation is disabled on Free plan. Upgrade your plan.', version),
      403
    );
  }

  let body;
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json(
      apiErrorResponse('BAD_REQUEST', 'Invalid JSON payload', version),
      400
    );
  }

  const { documents } = body || {};

  if (!Array.isArray(documents)) {
    return c.json(
      apiErrorResponse('BAD_REQUEST', 'Missing array field "documents"', version),
      400
    );
  }

  if (documents.length === 0) {
    return c.json(
      apiErrorResponse('BAD_REQUEST', 'Documents array cannot be empty', version),
      400
    );
  }

  if (documents.length > 100) {
    return c.json(
      apiErrorResponse('BAD_REQUEST', 'Batch exceeds maximum limit of 100 documents', version),
      400
    );
  }

  const results = documents.map((doc) => {
    const { country, document_type, value } = doc || {};

    if (country === undefined || document_type === undefined || value === undefined) {
      return {
        valid: false,
        country: country !== undefined ? String(country).toUpperCase() : '',
        document_type: document_type !== undefined ? String(document_type).toUpperCase() : '',
        normalized: value !== undefined ? String(value) : '',
        details: {},
        errors: ['FORMAT_INVALID']
      };
    }

    const valResult = performValidation(country, document_type, value);
    return {
      valid: valResult.valid,
      country: String(country).toUpperCase(),
      document_type: String(document_type).toUpperCase(),
      normalized: valResult.normalized,
      details: valResult.details,
      errors: valResult.errors
    };
  });

  return c.json(batchValidationResponse(results, version));
});

// GET /v1/documents
router.get('/documents', (c) => {
  const version = c.env.API_VERSION || '1.0.0';
  return c.json({
    success: true,
    data: {
      documents: SUPPORTED_DOCUMENTS
    },
    meta: {
      version,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID()
    }
  });
});

// GET /v1/health
router.get('/health', (c) => {
  const version = c.env.API_VERSION || '1.0.0';
  return c.json({
    success: true,
    data: {
      status: 'healthy'
    },
    meta: {
      version,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID()
    }
  });
});

export default router;
