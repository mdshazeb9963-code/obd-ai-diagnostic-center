# OBD AI Diagnostic Center

A responsive vehicle diagnostic workspace with a React frontend, Java 21 / Spring Boot API, MySQL persistence, Redis caching, private scan-file storage, VIN decoding, account-scoped reports, and branded PDF export.

## Features

- Account registration and sign-in, short-lived JWT access tokens, rotating HttpOnly refresh cookies, BCrypt password hashing, role-based access, origin checks for cookie mutations, and API rate limits.
- Upload up to 20 MB of UTF-8 scanner exports. TXT, CSV, JSON, XML, LOG, and custom text-like extensions are inspected. DTC-shaped codes are extracted; the browser demo includes a small offline reference for common codes.
- Vehicle and VIN detection. VIN decoding uses NHTSA vPIC; an identified vehicle can be saved to the garage automatically.
- Pluggable diagnostic data providers, response validation and merging, confidence/source display, MySQL cache, Redis cache, TTL, and scheduled refresh.
- Unresolved codes stay visibly unresolved. When a provider has no verified description, the system does not invent a title, severity, cause, repair, safety recommendation, or cost.
- Private scan history, garage and maintenance records, searchable reports, scan comparison, source-file downloads, PDF export, report deletion, and notifications.
- Optional AI assistant backed by the OpenAI Responses API. AI output is kept separate from provider-verified diagnostic facts.
- Role-protected admin views for system status, users and roles, plan codes, cached data, reports, vehicles, and uploaded source files.
- Vite development server or Docker Compose deployment.

A synthetic scanner export is included at `samples/example-scanner-export.txt` for a first upload. It contains no VIN or personal vehicle data.

## Live frontend preview

Open the [live website](https://mdshazeb9963-code.github.io/obd-ai-diagnostic-center/). It opens directly into an interactive, no-login browser demo. You do not need to press keys, install software, create an account, or enter an API key to try it. Choose **Upload a scan** or click **Try sample report**.

GitHub Pages publishes the demo from `frontend/` on pushes to `main`. In this mode, text scanner exports and PDFs with selectable text are parsed locally; image-only PDF scans need OCR first. Reports, vehicles, and service notes are stored in that browser's local storage. The demo does not send uploaded files to a server. Clearing the browser's site data removes demo records.

The browser demo includes plain-language meanings and possible causes for a limited set of common codes, plus a few Toyota-specific references. These references do not verify the uploaded code, confirm vehicle applicability, assign severity, or diagnose a failed part. For unsupported or manufacturer-specific codes, the report explains what vehicle details are needed instead of guessing. Its sample scan is synthetic. VIN decoding, account sync, provider-verified results, and AI responses require connected services and are not part of the static demo. Run the Docker Compose full stack below to exercise the Spring API, MySQL, and Redis locally; configure optional diagnostic and AI providers for those features.

## Requirements

For the full container setup, install Docker Desktop with Docker Compose. For a split local setup, install Java 21, Node.js 22+, MySQL 8.4, and Redis 7. The Maven wrapper downloads Maven 3.9.9 on first use. A compatible diagnostic data provider is needed for resolved DTC details; OpenAI API access is optional.

## Start the full stack

Copy .env.example to .env. Replace the database and Redis passwords. Generate a 32-byte JWT secret:

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Paste the generated value into JWT_SECRET. To bootstrap an administrator, set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters. The .env file is ignored by Git.

Start the containers:

```powershell
docker compose up --build
```

Open http://localhost:5173. Swagger UI is at /docs, OpenAPI JSON at /openapi, and the health endpoint at /actuator/health. Database migrations run automatically.

The mysql_data, redis_data, and scan_uploads volumes keep database state, cache state, and original scanner files outside the containers. Use docker compose down to stop without deleting records; docker compose down -v removes all volumes.

## Development

Start MySQL and Redis locally, set the required environment variables from .env.example, then run the API:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

The Vite server proxies /api to http://localhost:8080. Over local HTTP, set SECURE_COOKIE=false. Set SECURE_COOKIE=true behind HTTPS.

## Diagnostic data provider contract

There is no single public automotive API that provides complete manufacturer-specific diagnostic procedures and repair costs for every vehicle. Configure one or more compatible providers. Set OBD_DIAGNOSTIC_PROVIDER_URL for one provider or OBD_DIAGNOSTIC_PROVIDER_URLS to a comma-separated list. For each code, the API requests GET {base-url}/codes/{encoded-code}. If OBD_DIAGNOSTIC_PROVIDER_API_KEY is set, it is sent as a Bearer credential.

Provider JSON shape:

```json
{
  "code": "<VALID_DTC>",
  "title": "Provider-supplied title",
  "description": "Provider-supplied description",
  "symptoms": [],
  "causes": [],
  "diagnosticProcedure": "Provider-supplied procedure",
  "repairProcedure": "Provider-supplied procedure",
  "commonFixes": [],
  "safetyImpact": "Provider-supplied safety context",
  "severity": "UNKNOWN",
  "drivingRecommendation": "Provider-supplied recommendation",
  "estimatedCostLow": null,
  "estimatedCostHigh": null,
  "currency": null,
  "repairDifficulty": null,
  "estimatedMinutes": null,
  "estimatedPartsLow": null,
  "estimatedPartsHigh": null,
  "estimatedLaborLow": null,
  "estimatedLaborHigh": null,
  "recommendedTools": [],
  "commonParts": [],
  "confidence": 0.0,
  "source": "Provider name and reference"
}
```

Accepted provider severities are INFO, LOW, MEDIUM, HIGH, and CRITICAL. Results are merged only if they identify the requested code. Conflicting severities become UNKNOWN; conflicting cost figures are omitted. Verified entries expire after seven days by default and are refreshed by a scheduled job. Unresolved results are not cached.

The backend has no comprehensive automotive DTC dataset or fake repair-cost estimator. The frontend's small offline reference is not a replacement for a provider's complete, vehicle-specific database. Without a configured provider, upload, parsing, garage/history, report storage, PDF export, and source downloads still work, but provider-dependent findings remain unresolved.

## VIN and health score

VIN decoding uses NHTSA's extended vPIC API. vPIC returns vehicle attributes; it does not provide full diagnostic repair procedures. See the [official vPIC API documentation](https://vpic.nhtsa.dot.gov/api/Home/Index).

A health score appears only when a provider supplies a recognized severity. The score starts at 100 and subtracts 5, 15, 30, or 45 points for LOW, MEDIUM, HIGH, or CRITICAL findings, bounded at zero. It is a report trend indicator, not an OEM test or a substitute for inspection.

## AI setup

Set OPENAI_API_KEY to enable the assistant and scan explanations. OPENAI_MODEL defaults to gpt-4.1-mini; OPENAI_BASE_URL can point to a compatible Responses API endpoint. AI requests receive recent saved scan findings and are instructed to distinguish provider facts from inference. Without a key, the assistant reports that it is unavailable instead of fabricating analysis.

The per-code Listen control can translate an individual finding to Hindi, Hinglish, Urdu, Telugu, Tamil, Bengali, Marathi, Kannada, Malayalam, Punjabi, Gujarati, Arabic, Spanish, French, Portuguese, German, or Japanese. Translation is generated by the configured AI provider; the browser then reads it using an installed voice for that language. Voice availability and quality depend on the device. English speech stays local to the browser. Translation posts only the selected code, title, description, possible causes, and next step; it does not send the uploaded scan, report, or VIN. The endpoint is public so a mechanic does not need an account, validates the language and payload, and limits requests by IP. Keep OPENAI_API_KEY on the backend server.

To enable translated Listen on GitHub Pages, first deploy the backend at a public HTTPS API URL and set its OPENAI_API_KEY plus ALLOWED_ORIGINS to include `https://mdshazeb9963-code.github.io`. In the GitHub repository settings, add a repository **variable** named `TRANSLATION_API_URL` with the backend origin (for example `https://api.example.com`), then run the Pages workflow again. Do not put the provider key in a GitHub Pages variable or frontend build.

## REST API

All routes are under /api/v1.

| Area | Routes |
|---|---|
| Authentication | POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me |
| Scans | POST /scans/upload |
| Reports | GET /reports, GET /reports/{id}, GET /reports/{id}/pdf, GET /reports/{id}/source, DELETE /reports/{id} |
| Vehicles | GET /vehicles, POST /vehicles, PUT /vehicles/{id}, DELETE /vehicles/{id}, GET /vehicles/decode-vin/{vin} |
| Maintenance | GET or POST /vehicles/{vehicleId}/maintenance, DELETE /vehicles/{vehicleId}/maintenance/{id} |
| Notifications | GET /notifications, POST /notifications/{id}/read, DELETE /notifications/{id} |
| AI | POST /ai/assistant, POST /ai/speech-translation (public, rate-limited; translated Listen) |
| Subscription | GET /subscriptions/me |
| Admin | /admin/overview, /admin/users, /admin/users/{id}/plan, /admin/users/{id}/role, /admin/plans, /admin/reports, /admin/uploads, /admin/vehicles, /admin/cache/{code}/refresh |

Swagger UI documents request and response schemas at /docs. Public registration creates USER accounts. Only ADMIN_EMAIL / ADMIN_PASSWORD bootstrap or an existing admin can grant administrative access.

## Key environment variables

| Variable | Purpose |
|---|---|
| DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD | MySQL connection |
| REDIS_HOST, REDIS_PORT, REDIS_PASSWORD | Redis cache and shared rate limits |
| JWT_SECRET | Base64 signing key; generate from at least 32 random bytes |
| SECURE_COOKIE | Set true behind HTTPS |
| ALLOWED_ORIGINS | Comma-separated exact browser origins |
| OBD_DIAGNOSTIC_PROVIDER_URL, OBD_DIAGNOSTIC_PROVIDER_URLS, OBD_DIAGNOSTIC_PROVIDER_API_KEY | Automotive data adapters |
| OPENAI_API_KEY, OPENAI_MODEL, OPENAI_BASE_URL | Optional AI provider |
| ADMIN_EMAIL, ADMIN_PASSWORD | Optional admin bootstrap |
| UPLOAD_DIRECTORY | Private source-file directory; defaults to ./data/uploads |
| DB_POOL_SIZE, PORT | Connection pool size and API port |

## Tests and checks

Frontend:

```powershell
cd frontend
npm test
npm run build
npm audit
```

Backend:

```powershell
cd backend
.\mvnw.cmd test
```

The backend suite covers code extraction across code families, unknown text extensions, invalid/binary files, account ownership, uploads, scan quotas, source download, PDF generation, notifications, refresh-token rotation, and translation privacy/configuration. Frontend interaction tests cover sign-in form switching, sign-in, multi-step upload and report navigation, per-code English playback, selected-code translation payloads, translation cancellation, garage entry, and notifications navigation.

## Deployment notes

Use unique production passwords and a generated JWT_SECRET, set SECURE_COOKIE=true, restrict ALLOWED_ORIGINS, and terminate HTTPS at a trusted ingress. Restrict database and Redis network access. Back up MySQL and the private upload volume.

For multiple API replicas, keep JWTs stateless and Redis shared. The included file store uses a private local volume; replicas must share durable storage, or LocalFileStorageService must be replaced by an object-storage adapter before deploying across hosts. The plan catalog and admin plan assignment do not process payments; connect a billing provider and signed webhook flow before selling subscriptions. No load test has been performed for 10,000 users; size the infrastructure for the deployment and verify with production-like load tests.
