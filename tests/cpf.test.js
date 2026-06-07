import { validateCPF } from '../src/validators/cpf.js';

describe('Brasil CPF Validator', () => {
  // 5 Valid cases
  const validCases = [
    { input: '529.982.247-25', expected: '52998224725' },
    { input: '111.444.777-35', expected: '11144477735' },
    { input: '123.456.789-09', expected: '12345678909' },
    { input: '52998224725', expected: '52998224725' },
    { input: '11144477735', expected: '11144477735' }
  ];

  // 5 Invalid cases (different errors)
  const invalidCases = [
    { value: '111.111.111-11', expectedError: 'ALL_DIGITS_EQUAL' },
    { value: '000.000.000-00', expectedError: 'ALL_DIGITS_EQUAL' },
    { value: '529.982.247-26', expectedError: 'CHECK_DIGIT_INVALID' },
    { value: '1234', expectedError: 'FORMAT_INVALID' },
    { value: 'abc.def.ghi-jk', expectedError: 'FORMAT_INVALID' }
  ];

  // 2 Edge cases
  const edgeCases = [
    '  529.982.247-25  ', // with leading/trailing spaces
    '529-982-247.25'      // weird but normalized separators
  ];

  test('should validate correct CPFs', () => {
    validCases.forEach(({ input, expected }) => {
      const res = validateCPF(input);
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe(expected);
      expect(res.errors).toHaveLength(0);
      expect(res.details).toHaveProperty('region_code');
    });
  });

  test('should detect invalid CPFs with correct errors', () => {
    invalidCases.forEach(({ value, expectedError }) => {
      const res = validateCPF(value);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain(expectedError);
    });
  });

  test('should handle edge case formats correctly', () => {
    edgeCases.forEach((val) => {
      const res = validateCPF(val);
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe('52998224725');
    });
  });

  test('should normalize identical inputs to same result', () => {
    const formatted = '529.982.247-25';
    const unformatted = '52998224725';
    
    const resFormatted = validateCPF(formatted);
    const resUnformatted = validateCPF(unformatted);

    expect(resFormatted.normalized).toBe(resUnformatted.normalized);
    expect(resFormatted.valid).toBe(resUnformatted.valid);
    expect(resFormatted.details.region_code).toBe(resUnformatted.details.region_code);
  });
});
