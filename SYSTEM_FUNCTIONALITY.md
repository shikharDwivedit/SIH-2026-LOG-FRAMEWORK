# SIH Universal Log Normalization Framework

## 1. What This System Does

This repository is a local, lossless security-event normalization framework and reference application. It accepts heterogeneous perimeter-device logs, preserves the original input, detects a format, selects a configuration-driven parser, normalizes common fields, retains vendor-specific fields, validates the result, stores the normalized event, and exposes the result through an API and Vite dashboard.

The framework is usable without the dashboard through its REST API and processing services.

## 2. Current Architecture

```text
HTTP / file ingestion
              |
              v
       Raw event preservation
       UUID + SHA-256 + local disk
              |
              v
       Format detection
              |
              v
       Parser registry and matcher
              |
              v
       Generic parser engine
              |
              v
       Universal normalization
              |
              v
       Validation + field lineage
              |
       +------+----------------+
       |                       |
       v                       v
Normalized event store   Dead-letter store
       |
       +--> REST API
       +--> Vite dashboard
       +--> CEF / JSONL / flat JSONL output
```

### Main areas

- `src/services/event`: processing and replay orchestration.
- `src/services/parser`: format detection, parser loading, matching, and parsing.
- `src/services/normalization`: universal field mapping and vendor-field retention.
- `src/services/validation`: IP, port, required-field, and status validation.
- `src/services/traceability`: raw-to-normalized lookup and lineage response.
- `src/services/ingestion`: raw storage, file ingestion, and dead-letter handling.
- `packages/storage`: local durable raw and normalized stores.
- `packages/output-adapters`: output adapter contracts and formatting helpers.
- `parsers`: JSON parser definitions, loaded without vendor branches in the core pipeline.
- `frontend`: Vite reference dashboard.

## 3. Run Locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

The API and production-built dashboard use port `8000` by default:

- Dashboard: `http://localhost:8000`
- Test bench: `http://localhost:8000/test`
- Health: `http://localhost:8000/api/v1/healthcheck`
- Metrics: `http://localhost:8000/api/v1/healthcheck/metrics`

For frontend-only development:

```bash
npm run frontend
```

Then open `http://127.0.0.1:5173`. Vite proxies `/api` to port `8000`.

## 4. Demonstration Flow

Normal startup does not seed or generate fake events. This keeps counts truthful and prevents refreshes or restarts from creating traffic.

To load the bundled demonstration logs, start the backend and run:

```bash
npm run seed
```

Then use the dashboard:

1. **Overview**: inspect persisted totals, parser activity, and recent output.
2. **Pipeline view**: inspect received, preserved, parsed, normalized, and output counts.
3. **Event history**: search normalized events across vendor, parser, action, IP, and status.
4. Select an event ID to open **Event detail**. This shows normalized JSON, original raw content, raw hash, parser metadata, and field lineage.
5. **Dead letter**: inspect unsupported input and onboarding diagnostics.
6. **Test bench**: run a parser-only test or ingest exactly one durable event.
7. **Parser registry**: reload definitions or register a configuration-driven parser.
8. **Source registry**: register a source with vendor, product, address, device type, and preferred parser.
9. **Output center**: download CEF, complete JSONL, or flat ML-ready JSONL and preview CEF for the latest event.

## 5. API Reference

All routes are under `/api/v1`.

### Events

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/events/ingest` | Ingest one raw log and return its normalized event. Body: `{ log, source_ip?, transport?, source_id? }`. |
| `GET` | `/events` | List persisted normalized events. |
| `GET` | `/events/:id` | Retrieve one normalized event. |
| `GET` | `/events/:id/trace` | Retrieve raw content, hash, parser metadata, vendor extensions, and field lineage. |
| `POST` | `/events/:rawEventId/replay` | Replay a raw event. Optional body: `{ parser_name }`. |
| `POST` | `/events/ingest-file` | Process a configured server-side file path. This is a prototype endpoint; production deployments should use an import directory or upload boundary. |

Example:

```bash
curl -X POST http://localhost:8000/api/v1/events/ingest \
  -H 'Content-Type: application/json' \
  -d '{"log":"<185>date=2026-09-10 time=15:00:00 devname=fw01 srcip=10.0.0.5 dstip=8.8.8.8 action=deny","transport":"http"}'
```

### Parsers and sources

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/parsers` | List active parser definitions. |
| `POST` | `/parsers` | Register a parser definition in the running registry. Requires `name` and `format`. |
| `POST` | `/parsers/test` | Test a log without storing it. Body: `{ log, parser_name? }`. |
| `POST` | `/parsers/reload` | Reload parser JSON definitions from `parsers/`. |
| `GET` | `/sources` | List persistent source registrations. |
| `POST` | `/sources` | Register a source. Requires `name` and `vendor`. |
| `GET` | `/sources/:id` | Retrieve one source. |
| `DELETE` | `/sources/:id` | Deactivate a source. |

### Operations and output

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/healthcheck` | Liveness status. |
| `GET` | `/healthcheck/metrics` | Counters, EPS, latency, parser hits, format counts, and source counts. |
| `GET` | `/healthcheck/dead-letter` | Durable dead-letter records. |
| `GET` | `/output/cef` | Download all events as CEF. |
| `GET` | `/output/jsonl` | Download complete universal events as JSONL. |
| `GET` | `/output/flat` | Download flat ML-oriented JSONL. |
| `GET` | `/output/cef/:id` | Preview one event as CEF. |

## 6. Lossless and Traceable Processing

Every accepted event has:

- A generated `raw_event_id` and `event_id`.
- A SHA-256 hash of the original raw string.
- Raw content stored under `storage/raw_events/`.
- A normalized copy stored under `storage/normalized_events/`.
- `raw_ref` linking normalized output back to the raw record.
- `trace.parser_name`, `trace.parser_version`, `trace.schema_version`, and `trace.transformation_id`.
- `trace.field_lineage`, mapping normalized paths to source fields and parser metadata.
- `extensions.vendor_specific` for fields that do not map to the common taxonomy.

Event time is kept separate from ingestion time:

- `event.event_time`: source timestamp when present, otherwise `null`.
- `event.ingest_time`: framework receipt time.
- `event.processing_time`: normalization time.

A parser or validation failure does not delete the raw record. Unsupported input is also represented in the dead-letter store with a preview and reason.

## 7. Parser Onboarding

A new parser should normally be a definition under `parsers/`, plus sample input and tests. The core event-processing service does not contain vendor-specific `if` branches.

A minimal definition shape is:

```json
{
  "name": "example-firewall",
  "version": "1.0",
  "vendor": "Example",
  "product": "Firewall X",
  "format": "key-value",
  "match_criteria": { "contains": ["example="] },
  "extraction": { "type": "key-value" },
  "field_mappings": {
    "srcip": "network.source_ip",
    "dstip": "network.destination_ip",
    "action": "event.action"
  }
}
```

Workflow:

```text
Create parser definition
        |
        v
POST /parsers or add parsers/<name>.json
        |
        v
POST /parsers/test
        |
        v
POST /parsers/reload
        |
        v
Register source with preferred_parser
        |
        v
Replay raw events with POST /events/:rawEventId/replay
```

## 8. Persistent Data

Development storage is local and intentionally simple:

- `storage/raw_events/*.json`: immutable raw event records.
- `storage/normalized_events/*.json`: normalized event records.
- `storage/metrics.json`: persisted counters and distributions.
- `storage/dead_letters.json`: retained processing failures.
- `storage/sources.json`: source registry.
- `storage/queue/`: local queue job files when the queue package is used.

Runtime storage is ignored by Git. Back it up as application data if the local deployment is important.

## 9. Tests and Verification

```bash
npm test
npm run build
```

The current regression suite verifies FortiGate normalization, Cisco ASA parsing, raw-to-normalized traceability, vendor-field retention, and file ingestion. The Vite build verifies the reference dashboard bundle.

Useful manual acceptance checks:

```bash
# Confirm liveness
curl http://localhost:8000/api/v1/healthcheck

# Ingest exactly one event
curl -X POST http://localhost:8000/api/v1/events/ingest \
  -H 'Content-Type: application/json' \
  -d '{"log":"<185>date=2026-09-10 time=15:00:00 srcip=10.0.0.5 dstip=8.8.8.8 action=deny"}'

# Confirm history and metrics
curl http://localhost:8000/api/v1/events
curl http://localhost:8000/api/v1/healthcheck/metrics
```

Restart the backend and repeat the last two calls. Counts and event history should remain stable; startup should not seed synthetic traffic.

## 10. Container Use

```bash
docker compose up --build
```

The image builds the Vite frontend and serves it through Express. The compose file mounts `storage/` and `parsers/` so event history and parser definitions survive container replacement.

This prototype uses local filesystem storage. PostgreSQL, OpenSearch, MinIO, Redis/NATS, and a separately deployed worker are architectural next steps from the fix specification, not hidden claims of the current implementation.

## 11. Current Scope and Known Gaps

Implemented now:

- Lossless local raw and normalized persistence.
- Multiple configured parsers and formats.
- Format detection, normalization, validation, dead-letter retention.
- Field-level traceability and replay endpoint.
- Persistent source registry.
- HTTP ingestion, file ingestion, local queue package, and output formatting.
- CEF, JSONL, and flat JSONL exports.
- Vite reference dashboard and local test bench.
- Docker build and offline-friendly local parser/runtime behavior.

Still production-scope work:

- Fully awaited asynchronous raw-store interface and durable queue recovery/worker orchestration.
- Native TCP/HTTP multipart collector boundary and configured import directories.
- Startup wiring for the UDP syslog collector and a TCP syslog collector.
- PostgreSQL metadata, OpenSearch search, and MinIO object storage adapters.
- Enforced authentication/authorization and audit logging.
- Network output connectors, benchmark percentile reporting, and full failure-injection coverage.
- TypeScript shared contracts and a separately packaged framework core.

The current design keeps these boundaries explicit so the prototype remains runnable and its implemented guarantees are testable rather than simulated.
