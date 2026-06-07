import app from '../src/index.js';

describe('API Integration Tests', () => {
  const env = {
    API_KEYS: 'valid-test-key,another-key',
    API_VERSION: '1.0.0',
    RATE_LIMIT_KV: null // Will fall back to local mock internally
  };

  test('GET /v1/health - should return 200 without auth', async () => {
    const res = await app.request('/v1/health', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('healthy');
    expect(body.meta).toHaveProperty('version', '1.0.0');
  });

  test('GET /v1/documents - should return 401 without API key', async () => {
    const res = await app.request('/v1/documents', {}, env);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /v1/documents - should return 200 with valid API key', async () => {
    const res = await app.request('/v1/documents', {
      headers: { 'X-API-Key': 'valid-test-key' }
    }, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.documents)).toBe(true);
    expect(body.data.documents.length).toBeGreaterThan(0);
  });

  test('POST /v1/validate - should validate a document successfully', async () => {
    const payload = {
      country: 'BR',
      document_type: 'CPF',
      value: '529.982.247-25'
    };

    const res = await app.request('/v1/validate', {
      method: 'POST',
      headers: {
        'X-API-Key': 'valid-test-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.valid).toBe(true);
    expect(body.data.normalized).toBe('52998224725');
  });

  test('POST /v1/validate - should return DOCUMENT_NOT_SUPPORTED for unsupported combo', async () => {
    const payload = {
      country: 'ZZ',
      document_type: 'PASSPORT',
      value: '12345678'
    };

    const res = await app.request('/v1/validate', {
      method: 'POST',
      headers: {
        'X-API-Key': 'valid-test-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }, env);

    expect(res.status).toBe(200); // Business logic errors should return 200
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.valid).toBe(false);
    expect(body.data.errors).toContain('DOCUMENT_NOT_SUPPORTED');
  });

  test('POST /v1/validate - should return 400 for malformed JSON body', async () => {
    const res = await app.request('/v1/validate', {
      method: 'POST',
      headers: {
        'X-API-Key': 'valid-test-key',
        'Content-Type': 'application/json'
      },
      body: '{ malformed json'
    }, env);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  test('POST /v1/validate - should return 400 for missing required fields', async () => {
    const payload = {
      country: 'BR'
    };

    const res = await app.request('/v1/validate', {
      method: 'POST',
      headers: {
        'X-API-Key': 'valid-test-key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }, env);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  test('POST /v1/validate/batch - should return 403 Forbidden for Free plan users', async () => {
    const payload = {
      documents: [
        { country: 'BR', document_type: 'CPF', value: '529.982.247-25' }
      ]
    };

    const res = await app.request('/v1/validate/batch', {
      method: 'POST',
      headers: {
        'X-API-Key': 'valid-test-key',
        'X-Plan': 'free', // explicitly free
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }, env);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  test('POST /v1/validate/batch - should execute batch of up to 100 documents for non-free plans', async () => {
    const payload = {
      documents: [
        { country: 'BR', document_type: 'CPF', value: '529.982.247-25' },
        { country: 'CL', document_type: 'RUT', value: '12.450.547-K' },
        { country: 'MX', document_type: 'CURP', value: 'BADD110313HCMLNS06' }
      ]
    };

    const res = await app.request('/v1/validate/batch', {
      method: 'POST',
      headers: {
        'X-API-Key': 'valid-test-key',
        'X-Plan': 'basic', // basic plan enables batch
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.results).toHaveLength(3);
    expect(body.data.results[0].valid).toBe(true);
    expect(body.data.results[1].valid).toBe(true);
    expect(body.data.results[2].valid).toBe(true);
  });
});
