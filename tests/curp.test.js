import { validateCURP } from '../src/validators/curp.js';

describe('Mexico CURP Validator', () => {
  // 5 Valid cases (mathematically correct check digits)
  const validCases = [
    'BADD110313HCMLNS06',
    'BOXW310820HNERXN09',
    'GODE750102MDFGNN09',
    'PEDM800515HDFRRD06',
    'COLO900101MDFGRN04'
  ];

  // 5 Invalid cases (plus original prompt cases which had invalid check digits)
  const invalidCases = [
    { value: 'BADD110313HCMLNS00', expectedError: 'CHECK_DIGIT_INVALID' },
    { value: 'BADD110313HCMLNS09', expectedError: 'CHECK_DIGIT_INVALID' }, // original prompt typo case
    { value: 'GODE750102MDFGNN04', expectedError: 'CHECK_DIGIT_INVALID' }, // original prompt typo case
    { value: 'PEDM800515HDFRRD04', expectedError: 'CHECK_DIGIT_INVALID' }, // mathematically incorrect check digit
    { value: 'BADD990231HCMLNS06', expectedError: 'INVALID_DATE' },      // Feb 31
    { value: 'BADD110313HYCLNS06', expectedError: 'INVALID_STATE' },     // YC state code
    { value: 'BADD110313WCMLNS06', expectedError: 'INVALID_GENDER' },    // W gender code
    { value: 'BADD110313HCMLNS0A', expectedError: 'FORMAT_INVALID' }      // trailing letter instead of digit
  ];

  // 2 Edge cases
  const edgeCases = [
    'badd110313hcmlns06', // lowercase
    '  BADD110313HCMLNS06  ' // outer spaces
  ];

  test('should validate correct CURPs and extract details', () => {
    validCases.forEach((val) => {
      const res = validateCURP(val);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.details).toHaveProperty('birth_date');
      expect(res.details).toHaveProperty('gender');
      expect(res.details).toHaveProperty('state_code');
      expect(res.details).toHaveProperty('state_name');
    });
  });

  test('should fail and report correct error codes for invalid CURPs', () => {
    invalidCases.forEach(({ value, expectedError }) => {
      const res = validateCURP(value);
      expect(res.valid).toBe(false);
      expect(res.errors).toContain(expectedError);
    });
  });

  test('should handle edge cases like casing and padding', () => {
    edgeCases.forEach((val) => {
      const res = validateCURP(val);
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe('BADD110313HCMLNS06');
    });
  });

  test('should normalize differently cased inputs to same output', () => {
    const mixed = 'Badd110313hcmlns06';
    const upper = 'BADD110313HCMLNS06';

    const resMixed = validateCURP(mixed);
    const resUpper = validateCURP(upper);

    expect(resMixed.valid).toBe(resUpper.valid);
    expect(resMixed.normalized).toBe(resUpper.normalized);
    expect(resMixed.details.birth_date).toBe(resUpper.details.birth_date);
    expect(resMixed.details.gender).toBe(resUpper.details.gender);
    expect(resMixed.details.state_name).toBe(resUpper.details.state_name);
  });
});
