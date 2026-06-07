import { validateDNI, validateCUIL, validateCUIT } from '../src/validators/dni.js';

describe('Argentina DNI Validator', () => {
  const validDnis = [
    { input: '17.286.695', expected: 17286695 },
    { input: '35123456', expected: 35123456 },
    { input: '1234567', expected: 1234567 },
    { input: '99999999', expected: 99999999 },
    { input: '  17286695  ', expected: 17286695 }
  ];

  const invalidDnis = [
    { value: '500', expectedError: 'OUT_OF_RANGE' },
    { value: '100000000', expectedError: 'OUT_OF_RANGE' },
    { value: 'abc', expectedError: 'FORMAT_INVALID' },
    { value: '12.34.56', expectedError: 'FORMAT_INVALID' },
    { value: '1728669a', expectedError: 'FORMAT_INVALID' }
  ];

  test('should validate correct DNIs', () => {
    validDnis.forEach(({ input, expected }) => {
      const res = validateDNI(input);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.details.document_number).toBe(expected);
    });
  });

  test('should reject invalid DNIs with proper error', () => {
    invalidDnis.forEach(({ value, expectedError }) => {
      const res = validateDNI(value);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain(expectedError);
    });
  });
});

describe('Argentina CUIL / CUIT Validators', () => {
  const validCuils = [
    '20-17286695-7',
    '27-17286695-1',
    '30-17286695-2',
    '20172866957',
    '27172866951'
  ];

  const invalidCuils = [
    { value: '20-17286695-9', expectedError: 'CHECK_DIGIT_INVALID' },
    { value: '20-17286695-2', expectedError: 'CHECK_DIGIT_INVALID' }, // original prompt typo case
    { value: '27-17286695-8', expectedError: 'CHECK_DIGIT_INVALID' }, // original prompt typo case
    { value: '30-17286695-8', expectedError: 'CHECK_DIGIT_INVALID' }, // original prompt typo case
    { value: '99-17286695-7', expectedError: 'INVALID_PREFIX' },
    { value: '20-17286695-7a', expectedError: 'FORMAT_INVALID' },
    { value: '20-1728669-7', expectedError: 'FORMAT_INVALID' },
    { value: 'abc-defgh-i', expectedError: 'FORMAT_INVALID' }
  ];

  test('should validate correct CUILs and extract DNI & gender details', () => {
    validCuils.forEach((val) => {
      const res = validateCUIL(val);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.details).toHaveProperty('dni', '17286695');
      expect(res.details).toHaveProperty('type');
    });
  });

  test('should validate correct CUITs and extract details', () => {
    const res = validateCUIT('30-17286695-2');
    expect(res.valid).toBe(true);
    expect(res.details.type).toBe('company');
  });

  test('should fail for bad CUILs with correct error codes', () => {
    invalidCuils.forEach(({ value, expectedError }) => {
      const res = validateCUIL(value);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain(expectedError);
    });
  });

  test('should normalize separators (dots, hyphens, spaces) consistently', () => {
    const formatted = '20-17.286.695 7';
    const unformatted = '20172866957';

    const resFormatted = validateCUIL(formatted);
    const resUnformatted = validateCUIL(unformatted);

    expect(resFormatted.valid).toBe(resUnformatted.valid);
    expect(resFormatted.normalized).toBe(resUnformatted.normalized);
    expect(resFormatted.details.dni).toBe(resUnformatted.details.dni);
    expect(resFormatted.details.type).toBe(resUnformatted.details.type);
  });
});
