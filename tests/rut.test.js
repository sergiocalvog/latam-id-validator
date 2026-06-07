import { validateRUT } from '../src/validators/rut.js';

describe('Chile RUT Validator', () => {
  // 5 Valid cases
  const validCases = [
    '12.450.547-K',
    '17.317.684-8',
    '12.450.547-k', // lowercase k
    '8321432-5',    // different body length and check digit
    '19.006.128-0'  // check digit is 0
  ];

  // 5 Invalid cases
  const invalidCases = [
    { value: '12.450.547-1', expectedError: 'CHECK_DIGIT_INVALID' },
    { value: '00.000.000-0', expectedError: 'FORMAT_INVALID' }, // all zeroes body
    { value: 'abc', expectedError: 'FORMAT_INVALID' },
    { value: '1.234-K', expectedError: 'FORMAT_INVALID' },  // too short body
    { value: '12.450.5478-K', expectedError: 'FORMAT_INVALID' } // too long body
  ];

  // 2 Edge cases
  const edgeCases = [
    '  12450547k  ', // with spaces and lowercase
    '12.450.547K'    // without hyphen
  ];

  test('should validate correct RUTs', () => {
    validCases.forEach((val) => {
      const res = validateRUT(val);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.details).toHaveProperty('body');
      expect(res.details).toHaveProperty('check_digit');
    });
  });

  test('should fail invalid RUTs with correct error codes', () => {
    invalidCases.forEach(({ value, expectedError }) => {
      const res = validateRUT(value);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain(expectedError);
    });
  });

  test('should handle edge cases like spacing and casing', () => {
    edgeCases.forEach((val) => {
      const res = validateRUT(val);
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe('12450547K');
    });
  });

  test('should normalize identical RUTs to the exact same format', () => {
    const formatted = '12.450.547-k';
    const unformatted = '12450547K';

    const resFormatted = validateRUT(formatted);
    const resUnformatted = validateRUT(unformatted);

    expect(resFormatted.valid).toBe(resUnformatted.valid);
    expect(resFormatted.normalized).toBe(resUnformatted.normalized);
    expect(resFormatted.details.body).toBe(resUnformatted.details.body);
    expect(resFormatted.details.check_digit).toBe(resUnformatted.details.check_digit);
  });
});
