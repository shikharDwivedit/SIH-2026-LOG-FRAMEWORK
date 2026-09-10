# SIH 2026 Log Framework — AI Agent Fix & Refactor Specification

## Purpose

This document is the implementation instruction for an AI coding agent working on the **existing SIH 2026 Log Framework repository**.

The goal is **NOT to rewrite the project from scratch**.

The existing implementation already contains useful functionality such as:

- Parser definitions for multiple sources
- Parser registry/loading
- Format detection
- Normalization
- Traceability
- Validation
- Dead-letter handling
- Source registry
- CEF/JSONL output
- File ingestion
- Basic API/dashboard

The goal is to **refactor and extend the existing project into a reusable event-normalization framework with a reference application around it**.

---

# 1. Most Important Architectural Change

The project must be treated as two things:

```text
1. UNIVERSAL EVENT FRAMEWORK
   Reusable core processing engine

2. REFERENCE APPLICATION
   API + Dashboard used to operate and demonstrate the framework
```

The framework must not depend on the React dashboard.

The core processing logic should not be tied directly to Express/Fastify, PostgreSQL, OpenSearch, or the frontend.

Target relationship:

```text
                    REFERENCE APPLICATION
                 ┌─────────────────────────┐
                 │ React Dashboard         │
                 └────────────┬────────────┘
                              │
                              ▼
                         REST API
                              │
                              ▼
========================================================
                UNIVERSAL EVENT FRAMEWORK
========================================================
                              │
       ┌──────────────────────┼─────────────────────┐
       ▼                      ▼                     ▼
   Ingestion               Parsing             Normalization
       │                      │                     │
       └──────────────────────┼─────────────────────┘
                              ▼
                         Validation
                              ▼
                         Traceability
                              ▼
                            Replay
                              ▼
                          UniversalEvent
```

---

# 2. Do Not Rewrite Existing Working Functionality

Before changing code:

1. Inspect the complete repository.
2. Identify existing modules and responsibilities.
3. Preserve working parser configurations.
4. Preserve useful sample logs.
5. Preserve useful tests.
6. Preserve currently working normalization behavior where compatible.
7. Refactor incrementally.

Do NOT:

- Delete the existing parser system and replace it unnecessarily.
- Replace all code just to introduce a new folder structure.
- Add unnecessary technologies before the core pipeline works.
- Build a completely new dashboard before fixing the processing architecture.
- Introduce Kafka/Redpanda immediately unless required by a measured requirement.

The existing system is a prototype that should be evolved.

---

# 3. Current Problems To Fix

The implementation currently needs improvement in these areas:

```text
1. Raw events are stored in memory rather than durable storage.
2. Normalized events are stored in memory rather than durable event storage.
3. Processing is too tightly coupled to the API/application process.
4. There is no durable processing queue/worker separation.
5. File ingestion is too dependent on server-side file paths.
6. Live Syslog ingestion needs to become a real collector.
7. Source registry is not durable.
8. Parser detection needs stronger source/vendor/format matching.
9. Parser and normalization responsibilities need clearer separation.
10. Traceability should support field-level lineage.
11. Replay/reprocessing needs to be implemented.
12. Failure/dead-letter flow needs to be durable and visible.
13. Output formatters need to become output adapters/connectors.
14. Normal startup should not continuously generate fake demo events.
15. Authentication/authorization needs to protect management operations.
16. The framework needs clean interfaces/contracts.
17. The core framework should be independently usable from the reference application.
18. TypeScript should be introduced for shared contracts and core modules.
```

---

# 4. Target Technology Direction

Use:

```text
Language             TypeScript
Runtime              Node.js
API                  Fastify
Schema validation    JSON Schema + AJV/Zod
Parser configs       YAML / JSON
Metadata database    PostgreSQL
ORM                  Prisma
Search               OpenSearch
Raw storage          MinIO / local storage abstraction
Queue                Redis Streams or NATS initially
Frontend             React + TypeScript
Container            Docker + Docker Compose
Testing              Vitest
```

Do not introduce every service immediately.

The first objective is to make the core processing architecture correct.

---

# 5. Target Repository Structure

Refactor gradually toward:

```text
sih-2026-log-framework/
│
├── apps/
│   ├── api/
│   ├── worker/
│   └── dashboard/
│
├── packages/
│   ├── core/
│   ├── schema/
│   ├── parser-engine/
│   ├── normalization-engine/
│   ├── ingestion/
│   ├── storage/
│   ├── queue/
│   └── output-adapters/
│
├── parsers/
│   ├── generic-syslog/
│   ├── fortigate/
│   ├── cisco/
│   ├── paloalto/
│   ├── snort/
│   ├── openvpn/
│   └── squid/
│
├── samples/
│   ├── syslog/
│   ├── json/
│   ├── cef/
│   ├── firewall/
│   ├── ids/
│   ├── vpn/
│   └── malformed/
│
├── tests/
│   ├── unit/
│   ├── parser/
│   ├── schema/
│   ├── normalization/
│   ├── traceability/
│   ├── replay/
│   ├── integration/
│   └── load/
│
├── database/
│   ├── migrations/
│   └── seed/
│
├── infrastructure/
│   ├── docker/
│   ├── postgres/
│   ├── opensearch/
│   ├── minio/
│   └── monitoring/
│
├── configs/
│   ├── sources/
│   ├── outputs/
│   └── processing/
│
├── docs/
│   ├── architecture/
│   ├── schema/
│   ├── parser-development/
│   └── deployment/
│
├── scripts/
│   ├── benchmark/
│   ├── replay/
│   └── demo/
│
├── package.json
├── pnpm-workspace.yaml
├── docker-compose.yml
└── README.md
```

Do not move files merely for cosmetic reasons. Move/refactor them when their responsibility is being separated.

---

# 6. Stage 1 — Introduce Shared Types and Contracts

Create shared framework contracts first.

Important types:

```text
RawEvent
ParsedEvent
UniversalEvent
SourceDefinition
ParserDefinition
TraceMetadata
ProcessingResult
ProcessingError
ReplayJob
OutputEvent
```

Example:

```ts
export interface RawEvent {
  eventId: string;
  rawContent: string | Buffer;
  rawHash: string;
  ingestedAt: string;
  sourceId?: string;
  transport?: string;
  format?: string;
}
```

Example:

```ts
export interface UniversalEvent {
  event_id: string;
  schema_version: string;
  raw_ref: {
    event_id: string;
    hash: string;
    storage_path?: string;
    ingested_at: string;
  };
  source: Record<string, unknown>;
  event: Record<string, unknown>;
  network?: Record<string, unknown>;
  identity?: Record<string, unknown>;
  threat?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  trace: Record<string, unknown>;
  processing: Record<string, unknown>;
}
```

These are contracts. Other modules consume them.

---

# 7. Stage 2 — Make the Raw Event Store Durable

Current in-memory raw storage must no longer be the production source of truth.

Create:

```text
packages/storage/
└── raw-event-store.ts
```

Interface:

```ts
interface RawEventStore {
  save(event: RawEvent): Promise<void>;
  get(eventId: string): Promise<RawEvent | null>;
  exists(eventId: string): Promise<boolean>;
}
```

Implement initially:

```text
LocalRawEventStore
```

Then:

```text
MinioRawEventStore
```

The rest of the framework must use the interface.

Required stored metadata:

```text
event_id
raw_content
raw_hash
ingested_at
source_id
transport
format
```

Requirements:

- Store the raw content before parsing.
- Do not normalize raw content.
- Do not silently discard malformed raw content.
- Make raw events retrievable.
- Keep raw storage independent from normalized storage.

---

# 8. Stage 3 — Introduce a Durable Queue

Change the current synchronous processing path.

Target:

```text
Collector
   ↓
Raw Store
   ↓
Queue
   ↓
Worker
   ↓
Framework Pipeline
```

Create:

```text
packages/queue/
```

with a queue interface.

Example:

```ts
interface EventQueue {
  publish(job: ProcessingJob): Promise<void>;
  consume(handler: (job: ProcessingJob) => Promise<void>): Promise<void>;
  retry(job: ProcessingJob): Promise<void>;
}
```

The queue implementation can initially use Redis Streams.

Requirements:

- Buffer bursts.
- Separate ingestion from processing.
- Support retry.
- Expose queue failures.
- Support dead-letter handling.
- Do not allow a parser/database failure to erase the raw event.

---

# 9. Stage 4 — Separate Worker from API

Create:

```text
apps/worker/
```

The worker should:

```text
consume queue job
        ↓
load RawEvent
        ↓
detect source/format
        ↓
parse
        ↓
normalize
        ↓
validate
        ↓
trace
        ↓
store normalized event
        ↓
output
```

The API must not be responsible for the entire processing lifecycle.

API responsibilities:

```text
configuration
source management
parser management
event queries
replay requests
health
metrics
authentication
```

Worker responsibilities:

```text
event processing
parsing
normalization
validation
traceability
output delivery
```

---

# 10. Stage 5 — Improve Ingestion

Create a common ingestion interface.

Supported MVP input paths:

```text
File
Syslog UDP
Syslog TCP
HTTP
```

Every input must eventually produce:

```text
RawEvent
```

Therefore:

```text
File ──────┐
Syslog ────┤
HTTP ──────┘
     ↓
  RawEvent
```

The parser/normalization system must not know whether the event came from a file or network.

## File ingestion

Do not make users provide arbitrary server-side filesystem paths.

Support:

```text
configured import directory
or
multipart upload/import API
```

Process large files as streams.

Track file offsets/checkpoints where practical.

---

# 11. Stage 6 — Remove Fake Runtime Event Generation

If current startup automatically seeds/generates events, remove that behavior from normal startup.

Normal startup should:

```text
start application
start workers
start collectors
start API
```

It should NOT continuously generate fake events.

Move demo generation into:

```text
scripts/demo/
```

Example:

```bash
npm run demo:seed
```

This separation is mandatory for a credible SIH framework.

---

# 12. Stage 7 — Improve Parser Framework

Keep the existing parser definitions and evolve them.

The parser system should consist of:

```text
Parser Registry
Parser Definition Loader
Parser Matcher
Generic Parser Engine
Parser Test Runner
```

Parser definitions should be external configuration.

Example:

```yaml
name: fortigate
version: 1.0

match:
  vendor: Fortinet
  product: FortiGate
  format: syslog

extraction:
  type: key-value

mapping:
  srcip: network.source_ip
  dstip: network.destination_ip
  action: event.action
```

The exact format can remain compatible with the existing repository where practical.

---

# 13. Stage 8 — Make Plug-and-Play Genuine

This is a major SIH feature.

The core engine must never contain vendor-specific branches like:

```text
if vendor == Cisco
if vendor == Fortigate
if vendor == Palo Alto
```

Instead:

```text
Raw Event
   ↓
Parser Registry
   ↓
Matching Parser Definition
   ↓
Generic Parser Engine
```

Adding a vendor should require:

```text
new parser config
+
sample logs
+
tests
```

and NOT:

```text
core source-code modification
```

## New source onboarding flow

```text
New Source
    ↓
Register Source
    ↓
Create Parser Definition
    ↓
Run Parser Tests
    ↓
Validate Normalized Output
    ↓
Activate Parser
    ↓
Replay old raw logs if needed
```

---

# 14. Stage 9 — Improve Parser Matching

Use a priority-based matching strategy:

```text
1. Explicit source/parser configuration
2. Vendor + product
3. Strong message fingerprint
4. Format
5. Unknown
```

Do not choose a parser using format alone when several parsers can handle the same format.

Example:

```text
source_id = FW-001
parser = fortigate-v1
```

should directly select the configured parser.

---

# 15. Stage 10 — Separate Parsing and Normalization

This distinction must be explicit.

## Parser

Answers:

> What fields does this vendor/source provide?

Example:

```json
{
  "srcip": "10.0.0.5",
  "dstip": "8.8.8.8",
  "act": "deny"
}
```

## Normalizer

Answers:

> What do those fields mean in the universal taxonomy?

Example:

```text
srcip → network.source_ip
dstip → network.destination_ip
act   → event.action
```

The parser should not contain the entire universal taxonomy.

The normalizer should map parsed concepts into the common model.

---

# 16. Stage 11 — Preserve Unmapped/Vendor Fields

Never discard fields simply because they are not in the common schema.

Store them under:

```text
extensions.vendor_specific
```

Example:

```json
{
  "event": {
    "action": "deny"
  },
  "network": {
    "source_ip": "10.0.0.5"
  },
  "extensions": {
    "vendor_specific": {
      "policy_uuid": "abc123",
      "session_id": "xyz789"
    }
  }
}
```

The project must be able to claim:

> Normalization does not mean information loss.

---

# 17. Stage 12 — Improve Timestamp Handling

Do not replace a missing event timestamp with the ingestion time while presenting it as the event time.

Maintain separate values:

```text
event_time
ingest_time
processing_time
```

If event time is missing:

```text
event_time = null
ingest_time = actual ingestion time
```

Record the absence rather than silently confusing the two.

---

# 18. Stage 13 — Validation

Validate normalized events against the universal schema.

Check:

```text
IP addresses
ports
timestamps
required fields
data types
enumerations
schema version
```

Return explicit statuses:

```text
VALID
PARTIALLY_VALID
INVALID
```

Invalid events must remain linked to their raw source.

---

# 19. Stage 14 — Field-Level Traceability

Improve the current event-level traceability.

The system should support:

```text
RAW FIELD
   ↓
PARSED FIELD
   ↓
NORMALIZED FIELD
```

Example:

```text
raw.srcip
   ↓
parsed.srcip
   ↓
network.source_ip
```

Store trace information such as:

```json
{
  "network.source_ip": {
    "source_field": "srcip",
    "raw_event_id": "RAW-123",
    "parser": "fortigate-v1"
  }
}
```

At minimum, event-level traceability must contain:

```text
event_id
raw_event_id
raw_hash
parser_name
parser_version
schema_version
transformation_id
```

---

# 20. Stage 15 — Dead-Letter Handling

Processing failures must become durable records.

Possible states:

```text
PROCESSED
PARTIALLY_PROCESSED
UNSUPPORTED
PARSER_ERROR
VALIDATION_ERROR
OUTPUT_ERROR
```

Failure flow:

```text
Raw Event
    ↓
Processing
    ↓
FAILURE
    ↓
Dead Letter
    +
Raw Event remains available
```

The dead-letter record should reference the original raw event.

---

# 21. Stage 16 — Replay/Reprocessing

Implement:

```text
ReplayService
```

Minimum capability:

```text
replay(eventId)
```

Target:

```text
Raw Event
   ↓
Replay
   ↓
Selected Parser Version
   ↓
Normalization
   ↓
Validation
   ↓
New Processing Result
```

Later support:

```text
replay by source
replay by time range
replay by parser
```

Never destroy the original processing history.

Replay is especially important for the plug-and-play story:

```text
Unknown Event
   ↓
Create Parser
   ↓
Replay
   ↓
Now Normalized
```

---

# 22. Stage 17 — Persistent Source Registry

Current source registry must become durable.

Store in PostgreSQL:

```text
source_id
name
vendor
product
device_type
address
transport
format
parser_id
status
created_at
updated_at
```

Do not keep the production source registry only in a JavaScript Map.

---

# 23. Stage 18 — PostgreSQL

Use PostgreSQL for application metadata.

Recommended entities:

```text
User
Role
Source
Parser
ParserVersion
ReplayJob
AuditLog
OutputDestination
ProcessingJob
```

Do not use PostgreSQL as a replacement for raw object storage or high-volume event search.

---

# 24. Stage 19 — OpenSearch

Use OpenSearch for normalized event search.

Every normalized event should contain searchable common fields.

Example:

```text
event_time
source.vendor
source.product
event.category
event.action
event.severity
network.source_ip
network.destination_ip
network.source_port
network.destination_port
```

Users must be able to search across vendors using common fields.

---

# 25. Stage 20 — Raw Storage Abstraction

Use the abstraction:

```text
RawEventStore
```

with:

```text
LocalRawEventStore
MinioRawEventStore
```

This preserves platform independence.

Development:

```text
local filesystem
```

Deployment:

```text
MinIO
```

The framework core must not know which implementation is selected.

---

# 26. Stage 21 — Output Adapter Architecture

Separate:

```text
FORMATTER
```

from:

```text
CONNECTOR
```

Example:

```text
CEF Formatter
      ↓
Syslog Connector
```

Interface:

```ts
interface OutputAdapter {
  send(event: UniversalEvent): Promise<void>;
  sendBatch(events: UniversalEvent[]): Promise<void>;
  health(): Promise<OutputHealth>;
}
```

MVP adapters:

```text
Syslog
HTTP/JSON
CEF
JSONL
Parquet
```

A temporary SIEM/Data Lake destination can be local/MinIO for demonstration.

---

# 27. Stage 22 — Authentication

Add a basic management authentication layer.

Required:

```text
Login
Logout
Password hashing
Session/JWT
Role checks
```

Roles:

```text
Admin
Analyst
Viewer
```

Do not overbuild identity management.

Authentication protects:

```text
parser management
source management
configuration
replay
outputs
user management
```

---

# 28. Stage 23 — Reference Application

Create:

```text
apps/api/
apps/dashboard/
```

The API is a client of the framework.

The dashboard is a client of the API.

This keeps the framework reusable.

---

# 29. Stage 24 — Dashboard

Dashboard pages:

```text
Login

Dashboard
Events
Event Details
Sources
Parsers
Analytics
Outputs
Settings
```

Most important screen:

```text
EVENT DETAILS

Normalized Event
----------------
source.ip = 10.0.0.5
destination.ip = 8.8.8.8
action = deny

Original Event
--------------
srcip=10.0.0.5 dstip=8.8.8.8 action=deny

Traceability
------------
Raw Event: RAW-123
Parser: fortigate-v1
Schema: 1.0
```

This screen should visibly prove:

```text
lossless
+
normalized
+
traceable
```

---

# 30. Stage 25 — AI/ML Layer

Do not redesign the framework around AI.

AI/ML is downstream.

Target:

```text
Normalized Events
      ↓
Feature Extraction
      ↓
Anomaly Detection
      ↓
Risk Score
      ↓
Dashboard
```

Start with one useful feature:

```text
Anomaly Detection
```

The core framework must work without the ML layer.

---

# 31. Stage 26 — Performance

Create a benchmark script.

Measure:

```text
Events Per Second
p50 latency
p95 latency
p99 latency
CPU
memory
queue depth
error rate
```

Test:

```text
1K
10K
100K
1M
```

or appropriate workloads for available hardware.

Do not hardcode an unsupported performance claim.

Report the machine/container resources used.

---

# 32. Stage 27 — Failure Testing

Explicitly test:

```text
Malformed log
Unknown vendor
Unsupported format
Parser crash
Database unavailable
Queue unavailable
OpenSearch unavailable
SIEM unavailable
```

Expected property:

```text
Raw event remains available.
```

This is a critical acceptance requirement.

---

# 33. Stage 28 — Containerization

Only after the system is stable.

Target development deployment:

```text
docker-compose.yml

services:
  api
  worker
  dashboard
  postgres
  opensearch
  minio
  redis
```

Each service should have clear responsibility.

---

# 34. Stage 29 — Air-Gapped Deployment

Verify the complete deployment with Internet disabled.

Requirements:

```text
No runtime package downloads
No mandatory cloud API
No external telemetry dependency
All required container images locally available
Parser definitions locally available
ML model files locally available
```

Create an offline package/script for deployment.

---

# 35. Recommended Implementation Order

The AI agent MUST implement in this order unless a repository-specific dependency requires otherwise:

```text
1. Inspect existing repository
2. Introduce TypeScript/shared contracts
3. Define/finalize UniversalEvent
4. Extract core processing interfaces
5. Make raw storage durable
6. Add queue abstraction
7. Separate worker from API
8. Improve ingestion
9. Improve parser registry/matching
10. Separate parser and normalization
11. Preserve vendor-specific fields
12. Add schema validation
13. Add field-level traceability
14. Add dead-letter handling
15. Add replay
16. Persist source/parser metadata
17. Add PostgreSQL
18. Add OpenSearch
19. Add raw MinIO storage
20. Add output adapters
21. Add authentication
22. Refactor API
23. Refactor dashboard
24. Add AI/ML
25. Performance testing
26. Failure testing
27. Docker
28. Air-gap packaging
29. Documentation/demo
```

---

# 36. Plug-and-Play Acceptance Test

The implementation is NOT complete until this exact scenario works.

## Existing

```text
Fortigate
Cisco
Palo Alto
```

## New vendor

Create:

```text
parsers/checkpoint/parser.yaml
```

without modifying core processing code.

Then:

```text
Register source
      ↓
Load parser
      ↓
Run parser test
      ↓
Activate parser
      ↓
Send Check Point event
      ↓
Framework processes it
```

Then verify:

```text
Raw event preserved
Parsed fields available
Normalized UniversalEvent available
Traceability available
Searchable event available
```

The final test should prove:

> **New source support was added without modifying the core event-processing engine.**

---

# 37. Unknown Source Acceptance Test

Send a log from an unsupported vendor.

Expected:

```text
RAW STORED
status = UNSUPPORTED / UNPARSED
failure reason recorded
```

Then add the parser.

Run:

```text
Replay RAW EVENT
```

Expected:

```text
RAW EVENT
   ↓
NEW PARSER
   ↓
NORMALIZED EVENT
```

No raw data should have been lost.

---

# 38. Lossless Acceptance Test

Send:

```text
original raw string
```

After processing, retrieve the original raw event.

Verify:

```text
stored_content === original_content
```

Also verify the SHA-256 hash.

A normalized output must never be the only representation of the source event.

---

# 39. Framework Acceptance Test

The framework must be usable without the dashboard.

At minimum, demonstrate:

```text
Node process
   ↓
Framework API / core library
   ↓
Raw event
   ↓
Universal event
```

The React dashboard must not be required for the core normalization engine to function.

---

# 40. Code Quality Rules for the AI Agent

The AI agent must:

- Prefer small modules with one responsibility.
- Avoid large "god" services.
- Avoid vendor-specific conditionals in core processing.
- Use TypeScript interfaces for module boundaries.
- Keep configuration outside business logic.
- Add tests when modifying core processing.
- Preserve backward compatibility where practical.
- Avoid unnecessary dependencies.
- Avoid adding a database dependency to the framework core.
- Avoid putting UI logic inside the backend processing engine.
- Avoid exposing arbitrary server filesystem paths through APIs.
- Never silently discard events.

---

# 41. Things NOT To Overbuild

Do not spend significant implementation time on:

```text
Full commercial SIEM
Full enterprise IAM
Kubernetes cluster
Complex microservice mesh
Large LLM system
Hundreds of vendor parsers
Advanced threat intelligence platform
Cloud deployment
```

The central value remains:

```text
Lossless
+
Universal
+
Config-driven
+
Traceable
+
Reliable
+
Plug-and-play
```

---

# 42. Final Definition of the Product

The completed repository should demonstrate:

```text
                 YOUR FRAMEWORK
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
    Ingestion         Parsing        Normalization
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                    Validation
                        ▼
                   Traceability
                        ▼
                      Replay
                        ▼
                Universal Event
                        │
          ┌─────────────┼───────────────┐
          ▼             ▼               ▼
       SIEM          Data Lake          ML
```

Around it:

```text
Reference Application
        │
   ┌────┴────┐
   ▼         ▼
  API      Dashboard
```

The **framework is the product**.

The API and dashboard are the **reference application that demonstrates and operates the product**.

---

# 43. Definition of Done

The AI agent must not declare the project complete merely because the application starts.

The project is complete when all of the following work:

```text
[ ] Existing parsers still work
[ ] Raw events survive application restart
[ ] Every accepted event has an event ID
[ ] Every raw event has a SHA-256 hash
[ ] File ingestion works
[ ] Syslog ingestion works
[ ] Events enter a durable processing queue
[ ] Workers process events independently
[ ] Parser definitions are external/config-driven
[ ] New parser can be added without core-code modification
[ ] Parsing and normalization are separate
[ ] Unknown fields are preserved
[ ] Universal schema validation works
[ ] Raw-to-normalized traceability works
[ ] Dead-letter handling works
[ ] Replay works
[ ] Sources persist across restart
[ ] Normalized events are searchable
[ ] SIEM output adapter works
[ ] Data Lake output works
[ ] Basic authentication works
[ ] Dashboard displays raw + normalized + trace
[ ] Framework can operate without dashboard
[ ] Optional anomaly detection works
[ ] Performance benchmark exists
[ ] Failure tests pass
[ ] Docker deployment works
[ ] Offline/air-gapped deployment works
[ ] README updated
[ ] Architecture document updated
[ ] Demo flow works
```

---

# 44. AI Agent Execution Rule

**Do not implement all stages in one pass.**

The agent must work incrementally.

For each stage:

```text
Inspect
  ↓
Modify
  ↓
Run existing tests
  ↓
Add/update tests
  ↓
Verify
  ↓
Only then continue
```

Before any major refactor, identify which existing files will be affected.

At the end of each stage, report:

```text
Files changed
Functionality added
Tests run
Tests passed
Remaining issues
```

Never claim a feature is implemented unless it has been tested.

---

# 45. First Task For the AI Agent

Before making code changes:

1. Inspect the full current repository.
2. Build a map of the existing architecture.
3. Identify:
   - current ingestion code
   - parser system
   - normalization code
   - traceability code
   - validation code
   - storage
   - API
   - frontend
   - demo/seed behavior
4. Compare those components against this specification.
5. Produce a short migration plan.
6. Then implement **Stage 1 only**.

Do not immediately rewrite the repository.


---

# 46. Controlled Agent Execution Protocol

The AI coding agent is working on this repository under human supervision.

The agent MUST NOT make the entire migration in one pass.

## Execution model

Use this cycle for every implementation stage:

```text
READ SPECIFICATION
      ↓
INSPECT CURRENT CODE
      ↓
IDENTIFY FILES TO CHANGE
      ↓
IMPLEMENT ONE STAGE
      ↓
RUN TESTS
      ↓
VERIFY BEHAVIOR
      ↓
REPORT RESULT
      ↓
WAIT FOR NEXT STAGE / HUMAN REVIEW
```

The agent must keep the repository in a runnable state after every completed stage.

## Stage boundaries

The agent must treat these as explicit checkpoints:

```text
CHECKPOINT 1
Shared contracts + UniversalEvent

CHECKPOINT 2
Durable raw storage

CHECKPOINT 3
Queue + worker separation

CHECKPOINT 4
Ingestion abstraction

CHECKPOINT 5
Parser framework

CHECKPOINT 6
Normalization

CHECKPOINT 7
Traceability + validation

CHECKPOINT 8
Dead-letter + replay

CHECKPOINT 9
Persistent metadata/search storage

CHECKPOINT 10
API + authentication

CHECKPOINT 11
Dashboard

CHECKPOINT 12
Output adapters

CHECKPOINT 13
AI/ML

CHECKPOINT 14
Performance + failure testing

CHECKPOINT 15
Docker + air-gapped deployment
```

Do not jump directly from an early checkpoint to the final architecture unless the intermediate changes are already present and verified.

---

# 47. Existing Repository Preservation Rule

The current repository contains working functionality.

Before replacing any existing component, determine:

```text
What does it currently do?
Why does the new architecture require a change?
Can it be adapted instead of replaced?
```

Prefer:

```text
ADAPT → REFACTOR → EXTEND
```

over:

```text
DELETE → REWRITE
```

unless the existing implementation directly prevents the required architecture.

Existing parser definitions, sample logs, useful tests, normalization logic, validation logic, traceability logic, and API behavior should be preserved where compatible.

---

# 48. Core Framework Independence Rule

The following must remain independent of the React dashboard:

```text
Universal Event schema
Parser engine
Normalization engine
Validation
Traceability
Replay
Raw event storage interface
Queue interface
Output adapter interface
```

The framework must be callable without opening the dashboard.

A CLI/test/worker must be able to demonstrate:

```text
RawEvent
   ↓
Framework
   ↓
UniversalEvent
```

The dashboard is a **reference application**, not the framework itself.

---

# 49. Plug-and-Play Rule

The agent must enforce this architectural rule:

> A new supported source must be addable without modifying the core processing pipeline.

A new source should normally require:

```text
parser definition
+
mapping/configuration
+
sample logs
+
tests
```

The agent must actively detect and avoid vendor-specific branches such as:

```text
if vendor == "Cisco"
if vendor == "Fortigate"
if vendor == "PaloAlto"
```

inside the core processing engine.

Vendor-specific behavior belongs in parser definitions or parser-specific modules.

## Required demonstration

After the parser framework is implemented, add one new representative parser and prove that:

```text
new parser added
        ↓
core engine unchanged
        ↓
new source processed successfully
```

---

# 50. Lossless Processing Rule

The agent must preserve the original event as the source of truth.

Required lifecycle:

```text
EVENT RECEIVED
      ↓
RAW EVENT DURABLY STORED
      ↓
PROCESSING
      ↓
NORMALIZED EVENT
```

The agent must NOT implement a design where:

```text
raw event
   ↓
parse
   ↓
raw event discarded
```

The following must remain possible:

```text
raw event retrieval
raw hash verification
replay
traceability
```

---

# 51. No Silent Data Loss Rule

Any event that cannot be processed must end in an explicit state:

```text
PROCESSED
PARTIALLY_PROCESSED
UNSUPPORTED
PARSER_ERROR
VALIDATION_ERROR
OUTPUT_ERROR
```

It must not simply disappear.

Failure handling should maintain:

```text
raw event
+
failure status
+
failure reason
+
retry/replay possibility where applicable
```

---

# 52. No Fake Functionality Rule

The AI agent must not satisfy a feature only cosmetically.

Examples:

### Do not claim "durable storage" when using only:

```text
Map
Array
in-memory object
```

### Do not claim "queueing" when:

```text
API → process function
```

is still synchronous with no buffering.

### Do not claim "plug-and-play" when adding a parser requires changing:

```text
core pipeline source code
```

### Do not claim "traceability" if the system only stores one event ID but cannot identify the source field for normalized fields when field lineage is required.

### Do not claim "air-gapped" if runtime still requires:

```text
Internet package installation
external cloud APIs
remote authentication
external telemetry
```

---

# 53. Testing Requirement for Every Stage

Every completed stage must include verification.

The agent should report:

```text
Stage:
Files changed:
Behavior added:
Tests added:
Tests run:
Tests passed:
Known limitations:
```

If existing tests fail after a change:

1. Identify whether the failure is caused by the change.
2. Fix the regression before moving forward.
3. Do not hide failures by weakening/deleting tests unless the test itself is obsolete and the replacement behavior is documented.

---

# 54. Human Review Checkpoint

After completing a meaningful checkpoint, the agent should provide a short summary rather than immediately performing unrelated future work.

Example:

```text
CHECKPOINT 2 COMPLETE

Implemented:
- RawEvent contract
- LocalRawEventStore
- SHA-256 hashing
- restart-safe raw persistence

Verified:
- save/retrieve
- hash integrity
- restart persistence

Remaining:
- queue
- worker
```

The human reviewer can then inspect the changes before the next architectural stage.

If the agent environment requires continuous execution, it may continue only to the next explicitly authorized stage; it must not silently expand scope.

---

# 55. First Action After Reading This Specification

Before modifying code, the agent must:

```text
1. Inspect the full current repository.
2. Identify current architecture.
3. Map existing files to the target architecture.
4. Identify reusable code.
5. Identify conflicting code.
6. Propose the smallest safe first refactor.
7. Implement only the first checkpoint.
8. Run tests.
9. Report the result.
```

Do not begin by creating the complete target folder structure.

Create/refactor folders only when the corresponding responsibility is actually being moved or introduced.

---

# 56. Priority Order When Requirements Conflict

Use this priority:

```text
1. Data preservation / no silent loss
2. Correct event semantics
3. Universal schema correctness
4. Parser plug-and-play
5. Traceability
6. Processing reliability
7. Testability
8. Performance
9. API/UI convenience
10. Visual polish
```

A visually impressive dashboard must never take priority over correct event processing.

---

# 57. Definition of a Correct Refactor

A refactor is successful only when:

```text
existing useful behavior
        +
new framework architecture
        =
working project
```

The target is not simply a new folder structure.

The target is a system in which:

```text
new source
   ↓
new parser configuration
   ↓
same core framework
   ↓
same universal event schema
   ↓
same traceability
   ↓
same outputs
```

---

# 58. Agent Stop Conditions

The agent must stop and report instead of making speculative changes when:

- The repository contradicts an assumption in this document.
- A required dependency is missing.
- A migration would cause data loss.
- A parser behavior is ambiguous.
- A schema change would break existing events without a migration path.
- A technology choice would require rewriting a large working subsystem unnecessarily.
- Tests cannot be executed because of an environment issue.

In those cases, report:

```text
BLOCKED AREA
WHY IT IS BLOCKED
FILES INVOLVED
SAFE OPTIONS
```

Do not silently invent behavior.

