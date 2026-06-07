# LATAM ID Validator API — Prompt Maestro de Implementación

> **Nombre del producto:** `LATAM ID Validator API`  
> **Nombre del repositorio:** `latam-id-validator`  
> **Nombre en RapidAPI:** `LATAM ID Validator`  
> Versión del documento: 1.0 | Junio 2026

---

## Índice

1. [Prompt principal para IDE](#1-prompt-principal-para-ide)
2. [Adaptación para Cloudflare Workers](#2-adaptación-para-cloudflare-workers)
3. [Repositorio GitHub — Estructura y SEO](#3-repositorio-github--estructura-y-seo)
4. [Publicación en RapidAPI — SEO y configuración](#4-publicación-en-rapidapi--seo-y-configuración)
5. [OpenAPI spec para RapidAPI](#5-openapi-spec-para-rapidapi)
6. [Checklist de lanzamiento](#6-checklist-de-lanzamiento)

---

## 1. Prompt principal para IDE

> Pega este bloque completo en Cursor, Windsurf, Claude Code o cualquier IDE con AI.  
> El IDE generará todos los archivos del proyecto listos para desplegar.

---

```
Eres un desarrollador backend senior. Vas a construir "LATAM ID Validator API",
una API REST de producción que valida documentos de identidad de América Latina.

La API debe estar lista para:
  - Desplegarse en Cloudflare Workers (runtime edge, sin Node.js tradicional)
  - Publicarse en RapidAPI como producto monetizable
  - Tener tests completos con Jest

════════════════════════════════════════════════════════
NOMBRE DEL PROYECTO: latam-id-validator
RUNTIME: Cloudflare Workers (Hono framework)
SIN dependencias externas para la lógica de validación
════════════════════════════════════════════════════════

───────────────────────────────────────
ESTRUCTURA DE ARCHIVOS A GENERAR
───────────────────────────────────────

latam-id-validator/
├── src/
│   ├── index.js                  ← entry point Cloudflare Workers (Hono)
│   ├── validators/
│   │   ├── cpf.js                ← Brasil
│   │   ├── curp.js               ← México
│   │   ├── dni.js                ← Argentina (DNI + CUIL + CUIT)
│   │   ├── rut.js                ← Chile
│   │   └── cedula.js             ← Colombia
│   ├── routes/
│   │   └── validate.js           ← routing Hono
│   ├── middleware/
│   │   ├── apiKey.js             ← auth por header X-RapidAPI-Key o X-API-Key
│   │   └── rateLimit.js          ← rate limit por plan via KV
│   ├── constants/
│   │   ├── states.js             ← tabla estados CURP México
│   │   └── documents.js          ← catálogo de tipos de documento
│   └── utils/
│       └── response.js           ← helpers de respuesta estándar
├── tests/
│   ├── cpf.test.js
│   ├── curp.test.js
│   ├── dni.test.js
│   ├── rut.test.js
│   ├── cedula.test.js
│   └── integration.test.js
├── wrangler.toml                 ← configuración Cloudflare Workers
├── openapi.yaml                  ← spec OpenAPI 3.0 para RapidAPI
├── package.json
├── .env.example
└── README.md                     ← README optimizado para GitHub SEO

───────────────────────────────────────
ENDPOINTS A IMPLEMENTAR
───────────────────────────────────────

POST /v1/validate
  Valida un único documento.
  Body: { "country": "BR", "document_type": "CPF", "value": "529.982.247-25" }

POST /v1/validate/batch
  Valida hasta 100 documentos en una llamada.
  Body: { "documents": [ ...hasta 100 items... ] }

GET  /v1/documents
  Catálogo de países y tipos de documento soportados.

GET  /v1/health
  Estado de la API. No requiere autenticación.

───────────────────────────────────────
FORMATO DE RESPUESTA ESTÁNDAR
───────────────────────────────────────

// Respuesta de validación exitosa (HTTP 200 siempre):
{
  "success": true,
  "data": {
    "valid": true,
    "country": "BR",
    "document_type": "CPF",
    "normalized": "52998224725",
    "details": { "region_code": "2" },
    "errors": []
  },
  "meta": {
    "version": "1.0.0",
    "timestamp": "ISO8601",
    "request_id": "uuid-v4"
  }
}

// Respuesta de validación fallida (HTTP 200 igualmente):
{
  "success": true,
  "data": {
    "valid": false,
    "country": "BR",
    "document_type": "CPF",
    "normalized": "52998224700",
    "details": {},
    "errors": ["CHECK_DIGIT_INVALID"]
  }
}

// Error de API (auth, formato, rate limit):
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "Invalid API key" },
  "meta": { "version": "1.0.0", "timestamp": "ISO8601", "request_id": "uuid" }
}

NOTA: Las respuestas de validación SIEMPRE retornan HTTP 200.
Los códigos 4xx/5xx son SOLO para errores de infraestructura de la API.

───────────────────────────────────────
DOCUMENTOS SOPORTADOS Y ALGORITMOS
───────────────────────────────────────

━━━ BRASIL — CPF ━━━━━━━━━━━━━━━━━━━━━
country: "BR" | document_type: "CPF"
Longitud: 11 dígitos numéricos
Acepta formatos: "529.982.247-25", "52998224725"

Algoritmo Módulo 11:
  DÍGITO 1:
    pesos = [10, 9, 8, 7, 6, 5, 4, 3, 2]
    suma  = sum(digito[i] * pesos[i]) para i in 0..8
    resto = (suma * 10) % 11
    d1    = (resto >= 10) ? 0 : resto

  DÍGITO 2:
    pesos = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
    suma  = sum(digito[i] * pesos[i]) para i in 0..9  ← incluye d1
    resto = (suma * 10) % 11
    d2    = (resto >= 10) ? 0 : resto

  RECHAZAR si todos los dígitos son iguales:
    "00000000000", "11111111111", ..., "99999999999"

  details a retornar:
    region_code: digito[8] como string

Casos de test (úsalos en tests/cpf.test.js):
  VÁLIDOS:   "529.982.247-25" | "111.444.777-35" | "123.456.789-09"
  INVÁLIDOS: "111.111.111-11" (repetidos) | "529.982.247-26" (dígito malo)
             "000.000.000-00" (repetidos) | "1234" (formato)

━━━ MÉXICO — CURP ━━━━━━━━━━━━━━━━━━━━
country: "MX" | document_type: "CURP"
Longitud: exactamente 18 caracteres
Acepta formatos: mayúsculas y minúsculas (normalizar a mayúsculas)

Estructura por posición:
  [0]     Inicial primer apellido (A-Z)
  [1]     Primera vocal interna primer apellido (A,E,I,O,U,X)
  [2]     Inicial segundo apellido (A-Z)
  [3]     Inicial nombre (A-Z)
  [4-5]   Año nacimiento (YY, 00-99)
  [6-7]   Mes nacimiento (01-12)
  [8-9]   Día nacimiento (01-31)
  [10]    Sexo: H=hombre, M=mujer, X=no binario ← X válido desde 2022, NO rechazar
  [11-12] Código estado (ver lista completa abajo)
  [13]    Consonante interna primer apellido [B-DF-HJ-NP-TV-Z]
  [14]    Consonante interna segundo apellido [B-DF-HJ-NP-TV-Z]
  [15]    Consonante interna nombre [B-DF-HJ-NP-TV-Z]
  [16]    Homoclave: letra A-Z o dígito 0-9 (asignada por RENAPO)
  [17]    Dígito verificador (0-9)

Regex de estructura:
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HMX](AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TL|TS|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/

Estados válidos en [11-12]:
  AS=Aguascalientes | BC=Baja California | BS=Baja California Sur
  CC=Campeche | CS=Chiapas | CH=Chihuahua | CL=Colima | CM=Campeche
  DF=Ciudad de México | DG=Durango | GT=Guanajuato | GR=Guerrero
  HG=Hidalgo | JC=Jalisco | MC=Estado de México | MN=Michoacán
  MS=Morelos | NT=Nayarit | NL=Nuevo León | OC=Oaxaca | PL=Puebla
  QT=Querétaro | QR=Quintana Roo | SP=San Luis Potosí | SL=Sinaloa
  SR=Sonora | TC=Tabasco | TL=Tlaxcala | TS=Tamaulipas | VZ=Veracruz
  YN=Yucatán | ZS=Zacatecas | NE=Nacido en el extranjero

  details a retornar:
    birth_date: "YYYY-MM-DD" (reconstruir desde posiciones [4-9])
    gender: "M" | "F" | "X"
    state_code: string 2 letras
    state_name: string nombre completo

Casos de test:
  VÁLIDOS:   "BADD110313HCMLNS09" | "GODE750102MDFGNN04"
  INVÁLIDOS: "BADD110313HCMLNS00" (dígito) | "BADD990231HCMLNS09" (fecha)

━━━ ARGENTINA — DNI / CUIL / CUIT ━━━━
country: "AR"
document_type: "DNI" | "CUIL" | "CUIT"

── DNI:
  Formato: 7-8 dígitos numéricos
  Acepta: "17.286.695", "17286695", "7286695"
  Rango válido: 1.000.000 – 99.999.999
  SIN dígito verificador matemático — solo validar formato y rango
  details: { document_number: integer }

── CUIL / CUIT:
  Formato: XX-XXXXXXXX-X (11 dígitos)
  Prefijos válidos:
    20 = masculino | 27 = femenino
    23,24,25,26 = ambos (duplicados)
    30,33 = empresa

  Algoritmo dígito verificador:
    pesos   = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    suma    = sum(digito[i] * pesos[i]) para i in 0..9
    resto   = suma % 11
    result  = 11 - resto
    dv      = (result == 11) ? 0 : (result == 10) ? 9 : result

  details CUIL: { type: "male"|"female"|"company"|"other", dni: string }

Casos de test:
  DNI VÁLIDOS:   "17.286.695" | "35123456"
  DNI INVÁLIDOS: "500" (rango) | "abc" (formato)
  CUIL VÁLIDOS:  "20-17286695-2" | "27-17286695-8"
  CUIL INVÁLIDOS: "20-17286695-9" (dígito) | "99-17286695-2" (prefijo)

━━━ CHILE — RUT ━━━━━━━━━━━━━━━━━━━━━━
country: "CL" | document_type: "RUT"
Formato: XXXXXXXX-Z (7-8 dígitos + guión + verificador)
Verificador: dígito 0-9 o letra K (aceptar k minúscula)
Acepta: "12.450.547-K", "12450547-K", "12450547k", "12450547K"

Algoritmo Módulo 11:
  1. Tomar dígitos del cuerpo de DERECHA a IZQUIERDA
  2. Multiplicar por secuencia cíclica: [2,3,4,5,6,7] (volver a 2 al llegar a 7)
  3. suma   = sum de los productos
  4. resto  = suma % 11
  5. result = 11 - resto
  Mapeo:
    result == 11  →  verificador = "0"
    result == 10  →  verificador = "K"
    otros         →  verificador = String(result)

  details: { body: string, check_digit: string }

Casos de test:
  VÁLIDOS:   "12.450.547-K" | "17.317.684-8" | "12.450.547-k"
  INVÁLIDOS: "12.450.547-1" (dígito) | "00.000.000-0" (cuerpo ceros)

━━━ COLOMBIA — CÉDULA ━━━━━━━━━━━━━━━━
country: "CO" | document_type: "CEDULA"
Formato: 6 a 10 dígitos numéricos (sin verificador matemático)
Acepta: con o sin puntos separadores

Reglas:
  - Rechazar si longitud fuera de 6-10 dígitos
  - Rechazar si valor == 0
  - NO rechazar por rango — solo informar región estimada

Rangos orientativos (solo para details.estimated_region):
  1 – 9.999.999        → "historical"
  10.000.000 – 19.999.999 → "costa_caribe"
  70.000.000 – 79.999.999 → "antioquia"
  1.000.000.000+       → "digital"

  details: { document_number: string, estimated_region: string|null }

Casos de test:
  VÁLIDOS:   "1020304050" | "79000000" | "12345678"
  INVÁLIDOS: "12345" (corto) | "0" (cero) | "12345678901" (largo)

───────────────────────────────────────
CÓDIGOS DE ERROR (campo "errors" array)
───────────────────────────────────────

FORMAT_INVALID        → El valor no cumple el patrón de formato esperado
CHECK_DIGIT_INVALID   → El dígito verificador calculado no coincide
ALL_DIGITS_EQUAL      → Todos los dígitos son iguales (CPF inválido)
INVALID_DATE          → La fecha de nacimiento codificada en el CURP no existe
INVALID_STATE         → El código de estado del CURP no está en la lista válida
INVALID_GENDER        → El carácter de género no es H, M ni X
OUT_OF_RANGE          → El número está fuera del rango válido (DNI, Cédula)
INVALID_PREFIX        → El prefijo de tipo no es válido (CUIL/CUIT)
DOCUMENT_NOT_SUPPORTED → La combinación country+document_type no existe

───────────────────────────────────────
AUTENTICACIÓN
───────────────────────────────────────

Leer API key de estos headers en orden de prioridad:
  1. X-RapidAPI-Key   ← header que RapidAPI inyecta automáticamente
  2. X-API-Key        ← header para uso directo sin RapidAPI

La key se valida contra la variable de entorno API_KEYS (CSV separado por comas).
El endpoint GET /v1/health NO requiere autenticación.

Si la key es inválida o no existe → HTTP 401:
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "Invalid or missing API key" },
  "meta": { ... }
}

───────────────────────────────────────
CONFIGURACIÓN CLOUDFLARE WORKERS (wrangler.toml)
───────────────────────────────────────

Genera el archivo wrangler.toml con:
  name = "latam-id-validator"
  main = "src/index.js"
  compatibility_date = "2024-01-01"
  [vars]
    API_VERSION = "1.0.0"
  [[kv_namespaces]]
    binding = "RATE_LIMIT_KV"
    id = "PLACEHOLDER_KV_ID"

El entry point src/index.js debe usar el framework Hono:
  import { Hono } from 'hono'
  import { cors } from 'hono/cors'
  El export default debe ser { fetch: app.fetch }

───────────────────────────────────────
TESTS — REQUISITOS MÍNIMOS POR ARCHIVO
───────────────────────────────────────

Cada archivo tests/XXX.test.js debe incluir:
  - 5 casos válidos conocidos (valores reales documentados)
  - 5 casos inválidos con distintos tipos de error
  - 2 casos de edge (formato alternativo, minúsculas, puntos/guiones)
  - Test de normalización (mismos dígitos, distintos formatos → mismo resultado)

tests/integration.test.js:
  - POST /v1/validate con cada tipo de documento
  - POST /v1/validate/batch con 3 documentos mezclados
  - GET /v1/documents → verificar estructura
  - GET /v1/health → verificar 200 sin auth
  - Request sin API key → verificar 401
  - Body malformado → verificar 400

───────────────────────────────────────
README.md — CONTENIDO EXACTO A GENERAR
───────────────────────────────────────

El README debe contener exactamente estas secciones en este orden:

1. Badge de estado (tests passing), versión, licencia MIT
2. Título h1: "LATAM ID Validator API"
3. Descripción de 3 líneas con keywords de SEO
4. Tabla de documentos soportados (país, tipo, nombre, tiene checksum)
5. Quick Start con ejemplo curl para cada tipo de documento
6. Sección "Response format" con ejemplo JSON completo
7. Sección "Error codes" con tabla de todos los códigos
8. Sección "Deploy to Cloudflare Workers" con pasos exactos
9. Sección "Publish to RapidAPI" con pasos resumidos
10. Sección "Plans & Pricing" con tabla de planes
11. Sección "Contributing"
12. Licencia MIT

Palabras clave obligatorias en el README (distribuidas naturalmente):
  CPF validator, CURP validator, RUT Chile validator, DNI Argentina,
  cédula Colombia, LATAM identity validation, Brazil tax ID,
  Mexico CURP API, KYC LATAM, document verification API,
  fintech identity API, REST API identity documents

───────────────────────────────────────
PACKAGE.JSON
───────────────────────────────────────

{
  "name": "latam-id-validator",
  "version": "1.0.0",
  "description": "REST API to validate Latin American identity documents: CPF (Brazil), CURP (Mexico), DNI/CUIL (Argentina), RUT (Chile), Cédula (Colombia)",
  "keywords": [
    "cpf", "curp", "rut", "dni", "cedula", "latam", "identity",
    "validator", "api", "kyc", "fintech", "brazil", "mexico",
    "argentina", "chile", "colombia", "cloudflare-workers"
  ],
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "wrangler": "^3.0.0",
    "jest": "^29.0.0",
    "@cloudflare/workers-types": "^4.0.0"
  }
}

───────────────────────────────────────
GENERA TODOS LOS ARCHIVOS AHORA
───────────────────────────────────────

Importante:
- Cero dependencias externas en la lógica de validación (solo Hono para routing)
- Cada validador es una función pura: validateXXX(value) → { valid, normalized, details, errors }
- Normalizar SIEMPRE el input antes de validar: strip puntos, guiones, espacios, uppercase
- Los tests deben poder ejecutarse con "npm test" sin configuración adicional
- El código debe funcionar en el runtime de Cloudflare Workers (no Node.js APIs)
  → No usar: fs, path, process.env directamente (usar c.env en Hono), Buffer
  → Sí usar: crypto.randomUUID(), fetch nativo
```

---

## 2. Adaptación para Cloudflare Workers

> Este bloque es el prompt complementario para que el IDE adapte correctamente la API al runtime de Cloudflare Workers con Hono.

---

```
Adapta el proyecto "latam-id-validator" al runtime de Cloudflare Workers con estas reglas:

━━━ ENTRY POINT (src/index.js) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import validateRoutes from './routes/validate.js'

const app = new Hono()

app.use('*', cors())
app.use('*', logger())
app.route('/v1', validateRoutes)

export default app

━━━ VARIABLES DE ENTORNO EN CLOUDFLARE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

En Cloudflare Workers las variables se acceden via:
  c.env.API_KEYS         ← string CSV de keys válidas
  c.env.API_VERSION      ← "1.0.0"
  c.env.RATE_LIMIT_KV    ← binding al KV namespace

NO usar process.env. En el middleware pasar el objeto env de Hono.

━━━ RATE LIMITING CON CLOUDFLARE KV ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usar KV namespace para contar requests por key/minuto:
  key en KV: "rl:{apiKey}:{Math.floor(Date.now()/60000)}"
  value: contador de requests
  TTL del KV entry: 120 segundos

Planes (leer plan de cabecera X-Plan, default "free"):
  free:       100 req/min
  basic:      1000 req/min
  pro:        10000 req/min
  enterprise: sin límite

Si se supera el límite → HTTP 429:
  { "success": false, "error": { "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Upgrade your plan." } }

━━━ WRANGLER.TOML COMPLETO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

name = "latam-id-validator"
main = "src/index.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
API_VERSION = "1.0.0"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "TU_KV_NAMESPACE_ID"
preview_id = "TU_KV_NAMESPACE_PREVIEW_ID"

[route]
pattern = "latam-id-validator.TU_SUBDOMINIO.workers.dev/*"

━━━ PASOS DE DESPLIEGUE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generar estos comandos en el README sección "Deploy":

  # 1. Instalar Wrangler
  npm install -g wrangler

  # 2. Login en Cloudflare
  wrangler login

  # 3. Crear KV namespace para rate limiting
  wrangler kv:namespace create "RATE_LIMIT_KV"
  # Copiar el ID que devuelve y pegarlo en wrangler.toml

  # 4. Configurar API keys como secret (NO en wrangler.toml)
  wrangler secret put API_KEYS
  # Introducir: key1,key2,key3

  # 5. Desplegar
  wrangler deploy

  # URL resultante:
  # https://latam-id-validator.TU_SUBDOMINIO.workers.dev

━━━ DOMINIO PERSONALIZADO (opcional) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para apuntar api.tudominio.com al Worker:
  1. En Cloudflare Dashboard → Workers → latam-id-validator → Triggers
  2. Add Custom Domain → api.tudominio.com
  3. DNS se configura automáticamente si el dominio está en Cloudflare

━━━ RESTRICCIONES DEL RUNTIME ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NO usar en el código:
  ✗ fs, path, os (módulos Node.js)
  ✗ process.env (usar c.env)
  ✗ Buffer (usar TextEncoder/TextDecoder)
  ✗ setTimeout largo (límite 30s en Workers free)

SÍ disponible:
  ✓ fetch nativo
  ✓ crypto.randomUUID()
  ✓ crypto.subtle
  ✓ TextEncoder / TextDecoder
  ✓ URL, URLSearchParams
  ✓ Response, Request, Headers
```

---

## 3. Repositorio GitHub — Estructura y SEO

### 3.1 Configuración del repositorio

```
NOMBRE DEL REPO:    latam-id-validator
DESCRIPCIÓN:        REST API to validate Latin American identity documents —
                    CPF (Brazil), CURP (Mexico), DNI/CUIL (Argentina),
                    RUT (Chile), Cédula (Colombia). Zero external dependencies.
VISIBILITY:         Public
TOPICS (máx 20):    cpf-validator, curp-validator, rut-validator, dni-argentina,
                    cedula-colombia, latam, identity-validation, kyc-api,
                    cloudflare-workers, hono, rest-api, fintech, document-validation,
                    brazil-cpf, mexico-curp, chile-rut, argentina-dni, colombia-cedula,
                    identity-api, open-source
WEBSITE:            https://rapidapi.com/TU_USUARIO/api/latam-id-validator
```

### 3.2 Prompt para generar el README.md completo

```
Genera el archivo README.md del repositorio "latam-id-validator" con el
siguiente contenido exacto, optimizado para SEO en GitHub y Google:

━━━ SECCIÓN 1: HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# LATAM ID Validator API

[![Tests](https://github.com/TU_USUARIO/latam-id-validator/actions/workflows/test.yml/badge.svg)]()
[![npm version](https://badge.fury.io/js/latam-id-validator.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()
[![Cloudflare Workers](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Workers-orange)]()

> Validate Latin American identity documents via REST API.
> Supports CPF (Brazil), CURP (Mexico), DNI/CUIL/CUIT (Argentina),
> RUT (Chile), and Cédula de Ciudadanía (Colombia).
> 100% algorithmic validation — no external databases required.

**[→ Try it on RapidAPI](https://rapidapi.com/TU_USUARIO/api/latam-id-validator)**

━━━ SECCIÓN 2: TABLA DE DOCUMENTOS SOPORTADOS ━━━━━━━━━━━━━━━━━━

## Supported Documents

| Country | Document Type | Full Name | Has Checksum |
|---|---|---|---|
| 🇧🇷 Brazil | `CPF` | Cadastro de Pessoas Físicas | ✅ Mod-11 |
| 🇲🇽 Mexico | `CURP` | Clave Única de Registro de Población | ✅ Structural |
| 🇦🇷 Argentina | `DNI` | Documento Nacional de Identidad | ❌ Format only |
| 🇦🇷 Argentina | `CUIL` | Código Único de Identificación Laboral | ✅ Mod-11 |
| 🇦🇷 Argentina | `CUIT` | Código Único de Identificación Tributaria | ✅ Mod-11 |
| 🇨🇱 Chile | `RUT` | Rol Único Tributario | ✅ Mod-11 |
| 🇨🇴 Colombia | `CEDULA` | Cédula de Ciudadanía | ❌ Format only |

━━━ SECCIÓN 3: QUICK START CON CURL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Quick Start

### Validate a Brazilian CPF
curl -X POST https://latam-id-validator.workers.dev/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"country":"BR","document_type":"CPF","value":"529.982.247-25"}'

### Validate a Mexican CURP
curl -X POST https://latam-id-validator.workers.dev/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"country":"MX","document_type":"CURP","value":"BADD110313HCMLNS09"}'

### Validate a Chilean RUT
curl -X POST https://latam-id-validator.workers.dev/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"country":"CL","document_type":"RUT","value":"12.450.547-K"}'

### Validate Argentine DNI
curl -X POST https://latam-id-validator.workers.dev/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"country":"AR","document_type":"DNI","value":"17.286.695"}'

### Batch validation (up to 100 documents)
curl -X POST https://latam-id-validator.workers.dev/v1/validate/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "documents": [
      {"country":"BR","document_type":"CPF","value":"529.982.247-25"},
      {"country":"CL","document_type":"RUT","value":"12.450.547-K"},
      {"country":"MX","document_type":"CURP","value":"BADD110313HCMLNS09"}
    ]
  }'

━━━ SECCIÓN 4: RESPONSE FORMAT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ SECCIÓN 5: ERROR CODES (tabla completa) ━━━━━━━━━━━━━━━━━━━━━

━━━ SECCIÓN 6: DEPLOY TO CLOUDFLARE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ SECCIÓN 7: PLANS & PRICING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Plan | Price/month | Requests/month | Batch | Support |
|---|---|---|---|---|
| Free | $0 | 1,000 | ❌ | Community |
| Starter | $9 | 10,000 | ✅ | Email |
| Growth | $29 | 100,000 | ✅ | Email |
| Business | $99 | 500,000 | ✅ | Priority |
| Enterprise | Custom | Unlimited | ✅ | Dedicated |

**[→ Subscribe on RapidAPI](https://rapidapi.com/TU_USUARIO/api/latam-id-validator)**

━━━ SECCIÓN 8: USE CASES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Use Cases

- **KYC / Onboarding:** Validate customer identity documents during
  registration in fintech apps, neobanks, and e-commerce platforms.
- **Form validation:** Real-time CPF, CURP, and RUT validation in
  web and mobile forms before submission.
- **Data quality:** Bulk validation of identity document datasets
  for CRM cleaning, migration, or compliance audits.
- **Payroll systems:** Validate CUIL/CUIT for Argentine payroll
  and HR platforms.

━━━ SECCIÓN 9: CONTRIBUTING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ SECCIÓN 10: LICENSE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MIT License. See LICENSE file.
```

### 3.3 Archivos adicionales del repositorio

```
Generar también estos archivos:

── .github/workflows/test.yml ────────────────────────────────────
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

── CONTRIBUTING.md ───────────────────────────────────────────────
Instrucciones para añadir nuevo país:
  1. Crear src/validators/XX.js con función validateXX(value)
  2. Añadir entrada en src/constants/documents.js
  3. Añadir casos de test en tests/XX.test.js
  4. Actualizar openapi.yaml con nuevo document_type
  5. Actualizar README tabla de documentos soportados

── .github/ISSUE_TEMPLATE/bug_report.md ─────────────────────────
Campos:
  - Document type and country
  - Input value (anonymized)
  - Expected result
  - Actual result
  - API version

── LICENSE ───────────────────────────────────────────────────────
MIT License — año actual — TU_NOMBRE
```

---

## 4. Publicación en RapidAPI — SEO y configuración

### 4.1 Configuración del listing

```
NOMBRE EN RAPIDAPI:    LATAM ID Validator
CATEGORY:              Data → Identity Verification
SUBCATEGORY:           KYC & Document Validation

DESCRIPCIÓN CORTA (160 chars máx — aparece en search results):
  "Validate CPF (Brazil), CURP (Mexico), RUT (Chile), DNI (Argentina)
  and Cédula (Colombia) identity documents via REST API. KYC ready."

DESCRIPCIÓN LARGA (aparece en la página del listing):

  ## LATAM ID Validator API

  The most complete identity document validation API for Latin America.
  Validate CPF (Brazil), CURP (Mexico), RUT (Chile), DNI/CUIL/CUIT
  (Argentina), and Cédula de Ciudadanía (Colombia) in a single unified API.

  ### Why LATAM ID Validator?

  - **No external databases.** Pure algorithmic validation — instant
    responses with zero latency from external data sources.
  - **Unified API.** One endpoint for 5 countries and 7 document types.
  - **Detailed responses.** Extracts birth date, gender, state, and region
    from documents that encode this information.
  - **Batch support.** Validate up to 100 documents per request.
  - **KYC ready.** Built for fintech, neobanks, and e-commerce onboarding.

  ### Supported Documents

  | Country | Document | Description |
  |---|---|---|
  | Brazil | CPF | Individual taxpayer ID (Mod-11 checksum) |
  | Mexico | CURP | Population registry ID (18-char structured) |
  | Argentina | DNI | National identity document |
  | Argentina | CUIL/CUIT | Labor/tax ID (Mod-11 checksum) |
  | Chile | RUT | Tax role ID (Mod-11 checksum, "K" digit) |
  | Colombia | Cédula | Citizen identity card |

  ### Use Cases

  - Real-time form validation for CPF, CURP, RUT, DNI, and Cédula fields
  - KYC/AML onboarding flows for fintech and banking apps
  - Bulk identity data validation for CRM and database cleaning
  - Payroll system validation for CUIL/CUIT in Argentina
  - E-commerce checkout document verification across LATAM

TAGS EN RAPIDAPI (máx 5):
  latam, identity-validation, cpf, kyc, document-verification
```

### 4.2 Planes de precios en RapidAPI

```
Configurar en RapidAPI → Monetization → Plans:

PLAN 1 — Free
  Price: $0/month
  Rate limit: 100 requests/month (hard limit)
  Endpoints habilitados: /v1/validate, /v1/documents, /v1/health
  Batch: deshabilitado
  Description: "Try the API. Perfect for testing and integration."

PLAN 2 — Starter ($9/month)
  Price: $9/month
  Rate limit: 10,000 requests/month
  Endpoints habilitados: todos
  Batch: habilitado
  Overage: $0.002 per extra request
  Description: "For side projects and small apps."

PLAN 3 — Growth ($29/month)
  Price: $29/month
  Rate limit: 100,000 requests/month
  Endpoints habilitados: todos
  Batch: habilitado (hasta 100 docs)
  Overage: $0.001 per extra request
  Description: "For growing apps and startups."

PLAN 4 — Business ($99/month)
  Price: $99/month
  Rate limit: 500,000 requests/month
  Endpoints habilitados: todos
  Batch: habilitado (hasta 100 docs)
  Overage: $0.0005 per extra request
  Description: "For fintech and enterprise onboarding."
```

### 4.3 Ejemplos de código en RapidAPI

```
Para cada endpoint, añadir snippet en estos lenguajes:
  JavaScript (fetch), Python (requests), cURL, PHP, Ruby

Ejemplo para POST /v1/validate — JavaScript:

const response = await fetch(
  'https://latam-id-validator.p.rapidapi.com/v1/validate',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY',
      'X-RapidAPI-Host': 'latam-id-validator.p.rapidapi.com'
    },
    body: JSON.stringify({
      country: 'BR',
      document_type: 'CPF',
      value: '529.982.247-25'
    })
  }
);
const data = await response.json();
console.log(data);

Ejemplo para POST /v1/validate — Python:

import requests

url = "https://latam-id-validator.p.rapidapi.com/v1/validate"
payload = {"country": "MX", "document_type": "CURP", "value": "BADD110313HCMLNS09"}
headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
    "X-RapidAPI-Host": "latam-id-validator.p.rapidapi.com"
}
response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## 5. OpenAPI spec para RapidAPI

```
Genera el archivo openapi.yaml completo con las siguientes secciones.
Este archivo se sube directamente a RapidAPI para importar los endpoints.

━━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

openapi: 3.0.3
info:
  title: LATAM ID Validator API
  description: |
    Validate Latin American identity documents — CPF (Brazil), CURP (Mexico),
    RUT (Chile), DNI/CUIL/CUIT (Argentina), Cédula (Colombia).
    Pure algorithmic validation. No external databases. KYC ready.
  version: 1.0.0
  contact:
    name: LATAM ID Validator Support
    url: https://github.com/TU_USUARIO/latam-id-validator
  license:
    name: MIT
servers:
  - url: https://latam-id-validator.workers.dev
    description: Production (Cloudflare Workers)
  - url: https://latam-id-validator.p.rapidapi.com
    description: RapidAPI Gateway

━━━ SECURITY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    RapidAPIKeyAuth:
      type: apiKey
      in: header
      name: X-RapidAPI-Key

security:
  - ApiKeyAuth: []
  - RapidAPIKeyAuth: []

━━━ PATHS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Incluir paths completos con:
  - POST /v1/validate
      requestBody con schema y ejemplos para CPF, CURP, RUT, DNI, CEDULA
      responses: 200 (valid), 200 (invalid), 400, 401, 429
  - POST /v1/validate/batch
      requestBody con array de documents
      responses: 200 con summary
  - GET /v1/documents
      responses: 200 con catálogo completo
  - GET /v1/health
      sin security
      responses: 200

━━━ SCHEMAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Definir en components/schemas:
  ValidateRequest:
    type: object
    required: [country, document_type, value]
    properties:
      country: { type: string, example: "BR", enum: [BR,MX,AR,CL,CO] }
      document_type: { type: string, example: "CPF",
                       enum: [CPF,CURP,DNI,CUIL,CUIT,RUT,CEDULA] }
      value: { type: string, example: "529.982.247-25" }

  ValidateResponse:
    type: object
    properties:
      success: { type: boolean }
      data:
        type: object
        properties:
          valid: { type: boolean }
          country: { type: string }
          document_type: { type: string }
          normalized: { type: string }
          details: { type: object }
          errors: { type: array, items: { type: string } }
      meta:
        type: object
        properties:
          version: { type: string }
          timestamp: { type: string, format: date-time }
          request_id: { type: string, format: uuid }
```

---

## 6. Checklist de lanzamiento

### Desarrollo
- [ ] Todos los validadores implementados (CPF, CURP, DNI/CUIL, RUT, Cédula)
- [ ] Tests pasando: `npm test` sin errores
- [ ] Cobertura de tests > 90%
- [ ] Endpoint `/v1/health` retorna 200 sin auth
- [ ] Endpoint `/v1/documents` retorna catálogo completo
- [ ] Batch endpoint funciona con 1, 50 y 100 documentos
- [ ] Auth 401 cuando falta X-API-Key
- [ ] Rate limiting funciona con KV de Cloudflare

### Cloudflare
- [ ] `wrangler deploy` sin errores
- [ ] KV namespace creado y binding configurado
- [ ] Secret `API_KEYS` configurado vía `wrangler secret put`
- [ ] URL pública funciona: `https://latam-id-validator.TU_SUBDOMINIO.workers.dev/v1/health`
- [ ] CORS configurado (responde a OPTIONS)

### GitHub
- [ ] Repositorio público creado: `latam-id-validator`
- [ ] Descripción y topics configurados (ver sección 3.1)
- [ ] README.md completo con todas las secciones
- [ ] GitHub Actions workflow activo (badge verde)
- [ ] `openapi.yaml` en raíz del repo
- [ ] `LICENSE` (MIT) presente
- [ ] `CONTRIBUTING.md` presente
- [ ] `.env.example` con todas las variables documentadas
- [ ] Website del repo apuntando a RapidAPI listing

### RapidAPI
- [ ] Cuenta de provider creada en rapidapi.com
- [ ] API creada con nombre "LATAM ID Validator"
- [ ] Base URL configurada con URL de Cloudflare Workers
- [ ] `openapi.yaml` importado (todos los endpoints visibles)
- [ ] Descripción corta y larga completadas (ver sección 4.1)
- [ ] Tags configurados: `latam, identity-validation, cpf, kyc, document-verification`
- [ ] Categoría: Data → Identity Verification
- [ ] 4 planes configurados (Free, Starter, Growth, Business)
- [ ] Ejemplos de código en JS y Python para cada endpoint
- [ ] API key de prueba funciona desde el playground de RapidAPI
- [ ] Screenshot del playground en la galería del listing

### SEO y visibilidad
- [ ] README contiene todas las keywords listadas
- [ ] Todos los topics de GitHub configurados
- [ ] Descripción de RapidAPI incluye CPF, CURP, RUT, DNI, Cédula, KYC, LATAM
- [ ] URL canónica del repo apunta al listing de RapidAPI
- [ ] `package.json` keywords completos

---

*LATAM ID Validator API — Prompt Maestro v1.0 | Junio 2026*
