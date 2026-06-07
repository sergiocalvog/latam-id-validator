# LATAM ID Validator API

[![Tests](https://github.com/scalvo/latam-id-validator/actions/workflows/test.yml/badge.svg)]()
[![npm version](https://badge.fury.io/js/latam-id-validator.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()
[![Cloudflare Workers](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Workers-orange)]()

> Validate Latin American identity documents via REST API.
> Supports CPF (Brazil), CURP (Mexico), DNI/CUIL/CUIT (Argentina),
> RUT (Chile), and Cédula de Ciudadanía (Colombia).
> 100% algorithmic validation — no external databases required.

**[→ Try it on RapidAPI](https://rapidapi.com/scalvo/api/latam-id-validator)**

Validate identity documents across South and Central America with ease. This high-performance document verification API is tailor-made for KYC LATAM compliance, fintech identity API platforms, and user onboarding pipelines. Whether you need a Brazil tax ID, Mexico CURP API, RUT Chile validator, DNI Argentina, or cédula Colombia validation service, our unified REST API identity documents engine guarantees sub-millisecond edge response times.

---

## Supported Documents

Our LATAM identity validation suite supports the following documents:

| Country | Document Type | Full Name | Has Checksum |
|---|---|---|---|
| 🇧🇷 Brazil | `CPF` | Cadastro de Pessoas Físicas | ✅ Mod-11 |
| 🇲🇽 Mexico | `CURP` | Clave Única de Registro de Población | ✅ Structural |
| 🇦🇷 Argentina | `DNI` | Documento Nacional de Identidad | ❌ Format only |
| 🇦🇷 Argentina | `CUIL` | Código Único de Identificación Laboral | ✅ Mod-11 |
| 🇦🇷 Argentina | `CUIT` | Código Único de Identificación Tributaria | ✅ Mod-11 |
| 🇨🇱 Chile | `RUT` | Rol Único Tributario | ✅ Mod-11 |
| 🇨🇴 Colombia | `CEDULA` | Cédula de Ciudadanía | ❌ Format only |

---

## Quick Start

Get started with these example `curl` calls. Replace `YOUR_API_KEY` with your actual token.

### Validate a Brazilian CPF
```bash
curl -X POST https://latam-id-validator.workers.dev/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"country":"BR","document_type":"CPF","value":"529.982.247-25"}'
```

### Validate a Mexican CURP
```bash
curl -X POST https://latam-id-validator.workers.dev/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"country":"MX","document_type":"CURP","value":"BADD110313HCMLNS06"}'
```

### Validate a Chilean RUT
```bash
curl -X POST https://latam-id-validator.workers.dev/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"country":"CL","document_type":"RUT","value":"12.450.547-K"}'
```

### Validate Argentine DNI
```bash
curl -X POST https://latam-id-validator.workers.dev/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"country":"AR","document_type":"DNI","value":"17.286.695"}'
```

### Batch validation (up to 100 documents)
*Note: Available on Basic plans and above.*
```bash
curl -X POST https://latam-id-validator.workers.dev/v1/validate/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Plan: basic" \
  -d '{
    "documents": [
      {"country":"BR","document_type":"CPF","value":"529.982.247-25"},
      {"country":"CL","document_type":"RUT","value":"12.450.547-K"},
      {"country":"MX","document_type":"CURP","value":"BADD110313HCMLNS06"}
    ]
  }'
```

---

## Response Format

The validation endpoint always returns HTTP 200 for logical results, containing a standardized JSON envelope. Infrastructure and auth errors use 4xx/5xx codes.

### Successful Validation Response (HTTP 200)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "country": "BR",
    "document_type": "CPF",
    "normalized": "52998224725",
    "details": {
      "region_code": "2"
    },
    "errors": []
  },
  "meta": {
    "version": "1.0.0",
    "timestamp": "2026-06-07T15:00:00.000Z",
    "request_id": "c0bb1507-6f89-49eb-8378-d5d4d3d2f97a"
  }
}
```

### Failed Validation Response (HTTP 200)
```json
{
  "success": true,
  "data": {
    "valid": false,
    "country": "BR",
    "document_type": "CPF",
    "normalized": "52998224726",
    "details": {},
    "errors": [
      "CHECK_DIGIT_INVALID"
    ]
  },
  "meta": {
    "version": "1.0.0",
    "timestamp": "2026-06-07T15:00:00.000Z",
    "request_id": "e43b1717-3f81-42ab-873b-e5d4d3d2f97a"
  }
}
```

---

## Error Codes

When `valid` is `false`, the `errors` array will contain one or more of these error codes:

| Error Code | Description |
|---|---|
| `FORMAT_INVALID` | The value does not meet the expected format pattern |
| `CHECK_DIGIT_INVALID` | Calculated check digit does not match |
| `ALL_DIGITS_EQUAL` | All digits are identical (e.g. CPF 111.111.111-11) |
| `INVALID_DATE` | Birth date encoded in CURP does not exist |
| `INVALID_STATE` | CURP state code is not in the valid list |
| `INVALID_GENDER` | Gender char is not H, M, or X |
| `OUT_OF_RANGE` | The number is out of bounds (DNI, Cédula) |
| `INVALID_PREFIX` | Prefix is not valid (CUIL/CUIT) |
| `DOCUMENT_NOT_SUPPORTED` | The combination of country + document_type is not supported |

---

## Deploy to Cloudflare Workers

Deploy this API to the Cloudflare edge network in minutes:

### 1. Install Wrangler
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Create KV Namespace for Rate Limiting
```bash
wrangler kv:namespace create "RATE_LIMIT_KV"
```
Copy the returned ID and insert it into your `wrangler.toml` under `[[kv_namespaces]]`.

### 4. Configure API Keys Secret
Configure your secrets (comma-separated valid keys) in Cloudflare:
```bash
wrangler secret put API_KEYS
```
*Input: key1,key2,key3*

### 5. Deploy
```bash
wrangler deploy
```
Your worker will be active at `https://latam-id-validator.YOUR_SUBDOMAIN.workers.dev`.

---

## Publish to RapidAPI

To monetize this API on RapidAPI:
1. Create a provider account on [RapidAPI Provider Portal](https://rapidapi.com/studio).
2. Create a new API named **"LATAM ID Validator"**.
3. Go to **Definition** -> **Endpoints** and import the `openapi.yaml` file from this project to automatically populate endpoints, requests, and schemas.
4. Set the **Target URL** to your Cloudflare Workers URL.
5. Define your pricing plans in **Monetization** using the tiers below.

---

## Plans & Pricing

We offer flexible subscription plans on RapidAPI:

| Plan | Price/month | Requests/month | Batch | Support |
|---|---|---|---|---|
| Free | $0 | 1,000 | ❌ | Community |
| Starter | $9 | 10,000 | ✅ (up to 100) | Email |
| Growth | $29 | 100,000 | ✅ (up to 100) | Email |
| Business | $99 | 500,000 | ✅ (up to 100) | Priority |
| Enterprise | Custom | Unlimited | ✅ (up to 100) | Dedicated |

**[→ Subscribe on RapidAPI](https://rapidapi.com/scalvo/api/latam-id-validator)**

---

## Use Cases

- **KYC / Onboarding:** Validate customer identity documents during registration in fintech apps, neobanks, and e-commerce platforms.
- **Form validation:** Real-time CPF validator, CURP validator, and RUT Chile validator in web forms.
- **Data quality:** Clean up user databases, ERPs, and CRMs via bulk batch validation requests.
- **Payroll systems:** Check CUIL/CUIT identifiers for Argentine payroll integration.

---

## Contributing

We welcome contributions to add more countries. Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for details on adding new validators, schemas, and test specs.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
