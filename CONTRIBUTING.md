# Contributing to LATAM ID Validator

Thank you for your interest in contributing to the LATAM ID Validator API! We welcome contributions to support new countries, improve validation logic, or enhance the documentation.

## How to Add Support for a New Country

To add validation support for a new country or document type, please follow these structured steps:

### 1. Create the Validator
Create a new file in `src/validators/` named after the country code or document type (e.g., `src/validators/uy.js` or `src/validators/rut.js`).
The validator must export a single function `validateDocument(value)` that is pure and behaves as follows:
- It must accept a string value.
- It must normalize the input (e.g., strip spaces, hyphens, dots, and cast to uppercase).
- It must perform structural, range, and mathematical checksum validations (e.g., Modulo 11).
- It must return an object with the following structure:
```javascript
{
  valid: boolean,
  normalized: string,
  details: {
    // any extracted metadata, e.g., birth_date, gender, state, region
  },
  errors: [] // Array of string error codes (e.g., 'FORMAT_INVALID', 'CHECK_DIGIT_INVALID')
}
```

### 2. Register the Document Type
Add your document description and rules to the document catalog in `src/constants/documents.js`.

### 3. Add to Route Dispatcher
Import and integrate your validator function inside `src/routes/validate.js` inside the `performValidation(country, docType, value)` function.

### 4. Create Unit & Integration Tests
Add a test file under `tests/` (e.g., `tests/uy.test.js`) including:
- At least 5 known valid cases.
- At least 5 invalid cases with different error types.
- At least 2 edge cases (formatting, casing, separators).
- A normalization test.
Run `npm run test:coverage` to ensure all tests pass and coverage remains above 90%.

### 5. Update Documentation & Spec
- Add the new document details to the table of supported documents in [README.md](README.md).
- Update the API OpenAPI spec in [openapi.yaml](openapi.yaml) to document the new `document_type` and example payloads.

---

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`.
2. Make sure you install dependencies with `npm install`.
3. Write clean, commented code.
4. Run `npm test` to verify that all tests pass.
5. Submit a pull request describing your changes and test coverage details.
