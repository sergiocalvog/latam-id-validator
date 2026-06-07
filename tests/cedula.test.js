import { validateCedula } from '../src/validators/cedula.js';

describe('Colombia Cédula Validator', () => {
  // 5 Valid cases
  const validCases = [
    '1020304050',
    '79000000',
    '12345678',
    '10.203.040.50',
    '123456'
  ];

  // 5 Invalid cases
  const invalidCases = [
    { value: '12345', expectedError: 'OUT_OF_RANGE' }, // too short
    { value: '0', expectedError: 'OUT_OF_RANGE' },     // value is zero
    { value: '12345678901', expectedError: 'OUT_OF_RANGE' }, // too long
    { value: 'abc', expectedError: 'FORMAT_INVALID' },
    { value: '10.20a.040', expectedError: 'FORMAT_INVALID' }
  ];

  // 2 Edge cases
  const edgeCases = [
    '  1020304050  ', // leading/trailing spaces
    '10-203-040-50'    // with hyphens instead of dots
  ];

  test('should validate correct Cédulas and estimate region', () => {
    validCases.forEach((val) => {
      const res = validateCedula(val);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.details).toHaveProperty('document_number');
      expect(res.details).toHaveProperty('estimated_region');
    });
  });

  test('should fail invalid Cédulas with correct error codes', () => {
    invalidCases.forEach(({ value, expectedError }) => {
      const res = validateCedula(value);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain(expectedError);
    });
  });

  test('should estimate region correctly according to ranges', () => {
    expect(validateCedula('5.000.000').details.estimated_region).toBe('historical');
    expect(validateCedula('15.000.000').details.estimated_region).toBe('costa_caribe');
    expect(validateCedula('75.000.000').details.estimated_region).toBe('antioquia');
    expect(validateCedula('1.000.000.000').details.estimated_region).toBe('digital');
    expect(validateCedula('50.000.000').details.estimated_region).toBeNull();
  });

  test('should handle edge cases like spacing and hyphens', () => {
    edgeCases.forEach((val) => {
      const res = validateCedula(val);
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe('1020304050');
    });
  });

  test('should normalize differently formatted inputs to the same result', () => {
    const formatted = '10.203.040.50';
    const unformatted = '1020304050';

    const resFormatted = validateCedula(formatted);
    const resUnformatted = validateCedula(unformatted);

    expect(resFormatted.valid).toBe(resUnformatted.valid);
    expect(resFormatted.normalized).toBe(resUnformatted.normalized);
    expect(resFormatted.details.estimated_region).toBe(resUnformatted.details.estimated_region);
  });
});
