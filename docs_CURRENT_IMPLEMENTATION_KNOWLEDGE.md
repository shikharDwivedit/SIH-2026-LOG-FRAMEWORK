# SIH 2026 ULPF — Current Implementation Knowledge Base
## Agent Handoff / Living Project-State Document

> **THIS IS A LIVING DOCUMENT.**
>
> This file describes the **current implementation state of the project at the time of analysis**. It is intended to prevent future AI agents/developers from unnecessarily re-reading the entire codebase to rediscover existing functionality.
>
> **Mandatory rule for every future agent:** after every implementation/update session, update this SAME FILE (`docs/CURRENT_IMPLEMENTATION_KNOWLEDGE.md`) with:
>
> 1. What was changed.
> 2. Which files were added/modified/deleted.
> 3. What existing behavior was preserved.
> 4. What new behavior is now available.
> 5. What tests were added/changed and their result.
> 6. Any known limitations/regressions.
> 7. Any schema/API/config changes.
> 8. Any migration/deployment implications.
> 9. The exact next recommended task.
>
> Do not create a second “current state” document unless explicitly requested.
> If this document conflicts with the actual code, **the code is the source of truth**, and the agent MUST update this document to resolve the discrepancy.

---

# 1. PROJECT IDENTITY

## 1.1 What this project is

This is the team's implementation of the **SIH 2026 Universal Log Pre-processing Framework (ULPF)**.

The project focuses primarily on **perimeter/security/network device logs**, while the processing architecture is designed to be extensible to additional enterprise sources.

Core conceptual pipeline:

```text
INPUT EVENT
    ↓
INGESTION
    ↓
RAW PRESERVATION
    ↓
FORMAT DETECTION
    ↓
PARSER SELECTION
    ↓
PARSING
    ↓
NORMALIZATION
    ↓
VALIDATION
    ↓
TRACEABILITY
    ↓
NORMALIZED STORAGE
    ↓
OUTPUT / SEARCH / ANALYTICS
```

## 1.2 Current implementation philosophy

The codebase intentionally follows a familiar Node/Express layered backend style inspired by the team's preferred Chai aur Code-style structure:

```text
routes
  ↓
controllers
  ↓
services
  ↓
storage / external components

cross-cutting:
middleware
utils
config
constants
```

Domain-specific processing is separated into:

```text
ingestion
parser
normalization
validation
traceability
replay
metrics
output
workers
```

## 1.3 Important scope decision

There is **NO authentication/login subsystem in the intended project scope**.

Do not reintroduce JWT, bcrypt, user roles, login/logout, or IAM work unless the project owner explicitly changes scope.

---

# 2. WHAT HAS ALREADY BEEN IMPLEMENTED

The current project already contains working implementations for:

- Universal event schema v1.
- Raw-event preservation.
- SHA-256 hashing.
- File ingestion.
- HTTP single-event ingestion.
- UDP Syslog collector package.
- Local durable raw-event storage.
- Local processing queue with restart recovery attempt.
- Worker abstraction.
- Automatic log-format detection.
- Parser registry.
- JSON parser definitions.
- Key-value parsing.
- Regex parsing.
- JSON parsing.
- CEF parsing.
- Multiple vendor/sample parser configurations.
- Plug-and-play runtime parser registration.
- Vendor-specific field preservation.
- Universal field normalization.
- Automatic common-field inference for several common aliases.
- Validation of mandatory fields/IPs/ports.
- Dead-letter storage.
- Parser failure handling.
- Unknown-source handling.
- Event traceability.
- Field lineage.
- Parser/schema version metadata.
- Replay of raw events.
- Source registry.
- Source-to-parser preference.
- Metrics and processing statistics.
- CEF output formatting.
- Universal JSONL output.
- Flat/ML-oriented JSONL output.
- REST API.
- Static dashboard/reference UI.
- Parser test bench.
- Parser onboarding wizard UI.
- Source registry UI.
- Event explorer.
- Event detail showing normalized/raw/trace/vendor extension views.
- Dead-letter dashboard.
- Docker build and Docker Compose.
- Sample seeding script.
- Benchmark script with average/p50/p95/p99 latency measurement.
- Unit/acceptance/integration tests for the main prototype flow.

---

# 3. REPOSITORY STRUCTURE — CURRENT

```text
project/
│
├── apps/
│   └── worker/
│       └── event-worker.js
│
├── docs/
│   └── PARSER_ONBOARDING.md
│
├── packages/
│   ├── ingestion/
│   │   ├── index.js
│   │   ├── ingestion-manager.js
│   │   └── syslog-udp-listener.js
│   │
│   ├── ml/
│   │   ├── index.js
│   │   └── anomaly-detector.js
│   │
│   ├── output-adapters/
│   │   ├── index.js
│   │   └── output-adapters.js
│   │
│   ├── queue/
│   │   ├── index.js
│   │   └── event-queue.js
│   │
│   └── storage/
│       ├── index.js
│       ├── raw-event-store.js
│       └── normalized-event-store.js
│
├── parsers/
│   ├── checkpoint/
│   ├── cisco/
│   ├── fortigate/
│   ├── generic-cef/
│   ├── generic-json/
│   ├── generic-syslog/
│   ├── openvpn/
│   ├── paloalto/
│   ├── snort/
│   └── squid/
│
├── public/
│   ├── index.html
│   └── dashboard.html
│
├── samples/
│   ├── firewall/
│   ├── ids/
│   ├── proxy/
│   ├── syslog/
│   ├── vpn/
│   ├── manual-test-formats.txt
│   └── sample_test_logs.log
│
├── schemas/
│   └── universal-event-v1.json
│
├── scripts/
│   ├── benchmark/
│   │   └── benchmark.js
│   └── seed_sample_logs.js
│
├── src/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── storage/
│   ├── dead_letters.json
│   ├── metrics.json
│   ├── normalized_events/
│   ├── queue/
│   └── raw_events/
│
├── tests/
│   ├── pipeline.test.js
│   └── unit/
│       ├── contracts.test.js
│       ├── ingestion.test.js
│       ├── plug_and_play.test.js
│       ├── replay.test.js
│       ├── storage.test.js
│       └── worker.test.js
│
├── AI_AGENT_FIX_SPEC_v2.md
├── Dockerfile
├── docker-compose.yml
├── nodemon.json
├── package.json
├── package-lock.json
└── [other project specification/knowledge markdown files]
```

## 3.1 Important architectural observation

There are **two related layers**:

### `src/`
Application-facing services, controllers, routes, utilities, and orchestration.

### `packages/`
Reusable/system-level prototype components such as ingestion manager, local queue, stores, output adapters, and ML utility.

Future agents MUST NOT arbitrarily merge or duplicate these layers. Before moving code, determine whether it is an intentional boundary or existing technical debt.

---

# 4. ENTRYPOINT AND STARTUP

## `src/index.js`

Responsibilities:

1. Starts Express app.
2. Reads config.
3. Creates `LocalEventQueue`.
4. Creates `IngestionManager`.
5. Creates UDP Syslog listener.
6. Creates `EventWorker`.
7. Starts HTTP server on configured port.
8. Starts the worker.
9. Starts UDP Syslog listener.
10. Handles SIGINT/SIGTERM shutdown.

Current default ports:

```text
HTTP API: 8000
Syslog UDP: 5140
Host: 0.0.0.0
```

Graceful shutdown currently stops:

```text
worker
syslog listener
HTTP server
```

---

# 5. APPLICATION / HTTP LAYER

## `src/app.js`

Uses:

```text
Express
```

Middleware:

```text
express.json({ limit: "16kb" })
express.urlencoded({ extended: true, limit: "16kb" })
```

Static content:

```text
frontend/dist
public
docs
```

API namespace:

```text
/api/v1
```

Routes:

```text
/api/v1/healthcheck
/api/v1/events
/api/v1/parsers
/api/v1/sources
/api/v1/output
```

Unknown routes pass through:

```text
notFoundHandler
errorHandler
```

The root serves the built frontend if available; otherwise redirects to `/dashboard.html`.

---

# 6. CURRENT RESPONSE / ERROR CONVENTIONS

## `src/utils/ApiResponse.js`

Current successful-response shape:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

`success` is derived from `statusCode < 400`.

## `src/utils/ApiError.js`

Custom error with:

```text
statusCode
data
message
success=false
errors[]
stack
```

## `src/utils/asyncHandler.js`

Wraps async Express handlers and sends rejected promises to `next(err)`.

## `src/middlewares/error.middleware.js`

Centralized error response handling.

## `src/middlewares/notFound.middleware.js`

Centralized 404 handling.

### Agent rule

Preserve these conventions when adding API functionality. Do not introduce a second response/error format.

---

# 7. CONFIGURATION

## `src/config/env.js`

Current configuration values:

```text
PORT
SYSLOG_UDP_PORT
SYSLOG_UDP_HOST
NODE_ENV
API_VERSION
PARSER_DIR
schemaVersion
```

Defaults:

```text
PORT=8000
SYSLOG_UDP_PORT=5140
SYSLOG_UDP_HOST=0.0.0.0
NODE_ENV=development
API_VERSION=v1
PARSER_DIR=parsers
schemaVersion=1.0
```

Configuration is loaded through `dotenv`.

---

# 8. CONSTANTS

## `src/constants/status.constants.js`

### Processing statuses

```text
PROCESSED
PARTIALLY_PROCESSED
UNSUPPORTED
PARSER_ERROR
VALIDATION_ERROR
```

### Log formats

```text
key-value
syslog
cef
json
regex
unknown
```

Agent rule:
- Do not invent overlapping status strings.
- Extend the central constants when a new status is genuinely required.

---

# 9. UNIVERSAL EVENT SCHEMA

## File

```text
schemas/universal-event-v1.json
```

Current top-level required fields:

```text
event_id
schema_version
raw_ref
source
event
processing
```

Current structure:

```text
UniversalEvent
├── event_id
├── schema_version
├── raw_ref
│   ├── raw_event_id
│   ├── hash
│   └── ingested_at
│
├── source
│   ├── vendor
│   ├── product
│   ├── device_type
│   ├── device_ip
│   ├── hostname
│   ├── log_format
│   └── transport
│
├── event
│   ├── timestamp
│   ├── category
│   ├── type
│   ├── action
│   ├── outcome
│   ├── severity
│   └── message
│
├── network
│   ├── source_ip
│   ├── source_port
│   ├── destination_ip
│   ├── destination_port
│   ├── protocol
│   └── direction
│
├── identity
│   ├── username
│   ├── user_id
│   ├── domain
│   └── session_id
│
├── threat
│   ├── name
│   ├── type
│   ├── signature
│   ├── rule_id
│   └── risk_score
│
├── extensions
│   └── vendor_specific
│
├── trace
│   ├── parser_name
│   ├── parser_version
│   ├── transformation_id
│   └── mapped_fields
│
└── processing
    ├── status
    └── errors
```

The runtime event additionally carries:

```text
trace.field_lineage
```

even though the schema document currently emphasizes `mapped_fields`.

### Important caveat

Do not assume the schema file and runtime object are perfectly identical. When changing the schema, update both and add a contract test.

---

# 10. RAW EVENT MODEL

## `src/services/ingestion/raw-store.service.js`

Creates:

```text
raw_event_id
raw_content
hash
ingested_at
source_id
transport
source_ip
source_vendor
source_product
source_device_type
source_name
```

The raw store uses:

```text
packages/storage/raw-event-store.js
```

Current storage:

```text
storage/raw_events/<event-id>.json
```

The store also maintains an in-memory `Map` indexed by:

```text
eventId
hash:<rawHash>
```

Methods include:

```text
save()
saveSync()
get()
getSync()
getByHash()
getByHashSync()
exists()
list()
listSync()
reset()
```

### Current guarantee

The raw event is persisted before normalization in the main synchronous processing flow.

### Important production limitation

This is a **prototype local filesystem implementation** and is not a billion-event production storage design.

Do not claim that one JSON file per event is the final scalable architecture.

---

# 11. FILE INGESTION

## `src/services/ingestion/file-ingestion.service.js`

Supports:

### `processLogFile()`

- Opens file as UTF-8 stream.
- Uses `readline`.
- Processes one line at a time.
- Trims lines.
- Ignores blank lines.
- Creates raw event.
- Calls line callback.
- Returns collected raw events.

### `processLogFileBatched()`

- Streams file.
- Creates raw event per non-empty line.
- Groups raw events into configurable batches.
- Default caller batch size is usually 25.
- Maximum API batch size is currently capped at 100.
- Allows stop callback.
- Uses `setImmediate()` after batches.

### Important limitation

Current file ingestion tracks file jobs in an **in-memory Map in the controller**, not durable persistent job/checkpoint state.

Also, trimming means the current implementation should not be described as exact byte-for-byte preservation of newline/whitespace framing.

---

# 12. HTTP EVENT INGESTION

## `POST /api/v1/events/ingest`

Accepted body fields:

```text
log
source_ip
source_id
parser_name
source_vendor
source_product
source_device_type
source_name
transport
```

Current implementation calls:

```text
eventProcessingService.processSingleRawLog(...)
```

directly and returns the normalized event in the HTTP response.

This is a **synchronous/demo path**, not the final high-scale ingestion path.

---

# 13. UDP SYSLOG INGESTION

## `packages/ingestion/syslog-udp-listener.js`

Current behavior:

```text
UDP packet
  ↓
decode UTF-8
  ↓
trim()
  ↓
IngestionManager.ingest()
```

Metadata includes:

```text
sourceIp = sender IP
transport = syslog-udp
port = sender port
```

Default:

```text
0.0.0.0:5140
```

### Important production limitation

UDP has no application-level delivery guarantee.

For a defensible “lossless after acceptance” architecture, future production deployment should prefer reliable transport where supported:

```text
TCP Syslog
TLS Syslog
HTTP
```

UDP should remain a compatibility option, not the sole durability guarantee.

---

# 14. INGESTION MANAGER

## `packages/ingestion/ingestion-manager.js`

Core responsibility:

```text
payload
  ↓
generate event ID
  ↓
calculate SHA-256
  ↓
create raw event
  ↓
save raw event
  ↓
publish queue job
```

It returns:

```text
rawEvent
jobId
```

### Current metadata carried into queue job

```text
sourceId
transport
sourceIp
other metadata
```

### Important architectural behavior

The implementation intentionally preserves the raw event before queueing/processing.

---

# 15. QUEUE

## `packages/queue/event-queue.js`

Current implementation:

```text
LocalEventQueue
```

Storage:

```text
storage/queue/<job-id>.json
```

Memory:

```text
memoryQueue[]
```

Supports:

```text
publish()
consume()
retry()
getPendingCount()
recoverPendingJobs()
```

Job contains:

```text
jobId
rawEventId
rawContent
metadata
attempts
maxAttempts
status
createdAt
```

Statuses:

```text
PENDING
PROCESSING
COMPLETED
FAILED
```

On startup, pending/processing queue files are reloaded into memory.

### Important production limitation

This is a local single-process prototype queue. It is NOT a distributed queue/consumer-group implementation.

Future scale work should replace this behind the same conceptual interface with:

```text
Redis Streams
NATS JetStream
Redpanda/Kafka
```

depending on final architecture.

---

# 16. WORKER

## `apps/worker/event-worker.js`

The worker periodically calls:

```text
queue.consume()
```

and passes queue jobs to:

```text
eventProcessingService.processSingleRawLog()
```

Current polling mechanism:

```text
setInterval()
```

Worker logging is provided through the project logger.

### Current behavior

The worker returns the processing promise from the queue handler, so the queue awaits
processing before marking a job completed or retrying a failure.

When a queue job provides an accepted `raw_event_id`, the existing raw event is
reused rather than creating a second raw record. If that raw event has already
produced a normalized event, the existing normalized result is returned, making
retries idempotent for the local processing boundary.

---

# 17. MAIN PROCESSING PIPELINE

## `src/services/event/event-processing.service.js`

This is currently the **central orchestration component**.

### Constructor

Loads normalized event files into:

```text
normalizedEventsMap
```

and uses:

```text
LocalNormalizedEventStore
```

### `processSingleRawLog()`

Current sequence:

```text
1. metrics.recordReceived()
2. rawStoreService.createRawEvent()
3. formatDetectorService.detectFormat()
4. parserRegistryService.findMatchingParser()
5. parserService.parse()
6. normalizationService.normalize()
7. eventValidationService.validate()
8. dead-letter handling where needed
10. normalized event synchronously persisted to the local store
11. normalized event stored in Map and indexed by raw event ID
12. metrics.recordProcessed()
13. log result
14. return normalized event
```

### Critical behavior

Normalization still runs even if parsing fails so that the system produces a traceable partial/unsupported representation.

### Failure classification

- No parser + parser failure → `UNSUPPORTED`
- Matching parser but parsing fails → `PARSER_ERROR`
- Validation failure → `VALIDATION_ERROR`

Failed cases are recorded in the dead-letter store.

---

# 18. NORMALIZATION ENGINE

## `src/services/normalization/normalization.service.js`

Creates the UniversalEvent runtime structure.

Default metadata includes:

```text
schema_version=1.0
event timestamp fields
source information
network
identity
threat
extensions
trace
processing
```

### Current defaulting behavior

When fields are unavailable, the implementation uses safe defaults such as:

```text
category → network
type → connection
action → observed
outcome → completed
severity → informational
```

### Mapping logic

First priority:

```text parserConfig.field_mappings
```

Fallback:

```text autoInferFieldMapping()
```

Known automatic aliases include:

```text
srcip/src_ip/source_ip/src
srcport/src_port/source_port
dstip/dst_ip/destination_ip/dst
dstport/dst_port/destination_port
proto/protocol
action/act
user/usr/username
policyid/rule_id/ruleid
```

### Vendor fields

Any extracted field not mapped to the universal schema is preserved in:

```text
extensions.vendor_specific
```

### Type conversion

Source and destination ports are converted to integers where present.

---

# 19. FORMAT DETECTION

## `src/services/parser/format-detector.service.js`

Detection order:

```text
JSON
 ↓
CEF
Normalized persistence is now part of the synchronous local success boundary,
    but this still blocks the event loop and is not a scalable production storage design.
Synchronous filesystem writes exist in hot paths.
Syslog
 ↓
REGEX fallback
```

JSON is validated with `JSON.parse`.

CEF is recognized through `CEF:`.

Key-value requires at least two key-value matches.

Syslog checks for a classic:

```text
<PRI>Mon dd hh:mm:ss
```

pattern.

### Important limitation

This is heuristic detection, not an infallible classifier.

The parser registry still supports explicit source/parser hints.

---

# 20. PARSER LOADING

## `src/services/parser/parser-loader.service.js`

Recursively scans:

```text
parsers/
```

for `.json` files.

For each definition:

```text
parse JSON
validate minimal name + format
load into registry
```

Bad parser files are logged and skipped.

### Important limitation

The current loader uses synchronous filesystem calls at startup/reload.

Fine for small parser libraries; not ideal for huge registries.

---

# 21. PARSER REGISTRY

## `src/services/parser/parser-registry.service.js`

Maintains:

```text
parsersMap
```

Keys include:

```text
name:version
name
```

Matching priority:

```text
1. Explicit parserName
2. Source's preferred_parser
3. Vendor + optional product hint
4. match_criteria.contains
5. match_criteria.regex
6. format-based generic fallback
7. null
```

This is the core of plug-and-play parser selection.

---

# 22. PARSER ENGINE

## `src/services/parser/parser.service.js`

Current parser types:

### Key-value

Extracts:

```text
key=value
```

Pairs.

Quoted values are unquoted.

### Regex

Uses:

```text
new RegExp(pattern, "i")
```

Supports:

- named capture groups
- numbered groups

### JSON

Uses:

```text
JSON.parse(rawContent)
```

and returns object properties.

### CEF

Parses:

```text
CEF header
+
extension key-values
```

with basic unescaping.

### Current limitation

The parser engine does NOT yet provide a fully general JSON-path/JMESPath extraction system; generic JSON currently copies the JSON object's top-level properties.

Do not claim deep-path extraction unless it is implemented later.

---

# 23. CURRENT PARSER DEFINITIONS

Current configured parsers:

## `parsers/fortigate/fortigate-kv.json`

```text
Name: fortigate
Vendor: Fortinet
Product: FortiGate
Device: firewall
Format: key-value
Match: devname=
```

Maps:

```text
srcip → network.source_ip
srcport → network.source_port
dstip → network.destination_ip
dstport → network.destination_port
proto → network.protocol
action → event.action
status → event.outcome
level → event.severity
msg → event.message
user → identity.username
policyid → threat.rule_id
service → network.direction
```

## `parsers/cisco/cisco-asa.json`

```text
Name: cisco-asa
Vendor: Cisco
Product: ASA Firewall
Device: firewall
Format: regex
Match: %ASA-<severity>-<message>
```

Extracts timestamp/hostname/protocol/source/destination/ports and maps them into universal network/event fields.

## `parsers/paloalto/paloalto-kv.json`

```text
Name: paloalto
Vendor: Palo Alto Networks
Product: PA-Series NGFW
Device: firewall
Format: key-value
Match: TRAFFIC / THREAT patterns
```

Maps source/destination/ports/protocol/action/severity/threat/name/category/user/rule.

## `parsers/checkpoint/parser.json`

```text
Name: checkpoint-fw
Vendor: Check Point
Product: Check Point Firewall-1
Device: firewall
Format: key-value
Match: product=VPN-1
```

Maps source/destination/ports/protocol/action/user/rule/origin.

## `parsers/snort/snort-ids.json`

```text
Name: snort-ids
Vendor: Snort
Product: Snort IDS/IPS
Device: ids
Format: regex
```

Extracts network fields, protocol, alert message, SID/signature, hostname.

## `parsers/squid/squid-proxy.json`

```text
Name: squid-proxy
Vendor: Squid
Product: Squid Proxy / WAF
Device: proxy
Format: regex
```

Extracts timestamp/source/destination/method/status/user/url.

## `parsers/openvpn/openvpn-syslog.json`

```text
Name: openvpn
Vendor: OpenVPN
Product: OpenVPN Community
Device: vpn
Format: regex
```

Extracts timestamp/hostname/message/source IP/source port where pattern matches.

## `parsers/generic-json/json-generic.json`

Generic JSON parser.

Supports common field aliases such as:

```text
timestamp
event_time
category
type
action
outcome
severity
message
vendor
product
hostname
src_ip/source_ip
src_port/source_port
dst_ip/destination_ip
dst_port/destination_port
protocol
username/user
rule_id
```

## `parsers/generic-cef/cef-generic.json`

Generic CEF parser.

Maps:

```text
device vendor/product/version
signature ID
name
severity
src/spt
dst/dpt
protocol
action
outcome
suser
```

## `parsers/generic-syslog/syslog-generic.json`

Generic RFC3164-style syslog regex parser.

Extracts:

```text
PRI
timestamp
hostname
message
```

---

# 24. PLUG-AND-PLAY FUNCTIONALITY

Already implemented.

Two supported onboarding paths:

### Runtime registration

```text
POST /api/v1/parsers
```

### Definition file

```text
parsers/<vendor>/<parser>.json
```

The core processing service does not contain per-vendor parser branches.

The acceptance test proves:

```text
register new Acme parser
     ↓
process Acme log
     ↓
normalized output
     ↓
vendor field "ticket" retained
```

and dynamically loads the Check Point parser from disk.

This is one of the strongest currently implemented requirements.

---

# 25. SOURCE REGISTRY

## `src/services/source/source-registry.service.js`

Persists source definitions to:

```text
storage/sources.json
```

Indexes sources by:

```text
source_id
device_ip
hostname
```

Source definition includes:

```text
source_id
name
vendor
product
device_type
device_ip
hostname
preferred_parser
log_format
transport
description
registered_at
active
```

Capabilities:

```text
register()
getAll()
getById()
findByIp()
findByHostname()
deactivate()
getCount()
```

### Parser selection behavior

A source's:

```text
preferred_parser
```

takes priority when the source ID is provided to the parser registry.

---

# 26. VALIDATION

## `src/services/validation/event-validation.service.js`

Current checks:

### Required

```text
event_id
schema_version
raw_ref.hash
event
```

### IP validation

IPv4 and strict 8-group IPv6 regex.

### Port validation

```text
0–65535
```

### Failure

Sets:

```text
processing.status = VALIDATION_ERROR
```

and appends errors.

### Current limitation

IPv6 validation is strict and does not support all legal compressed IPv6 representations.

---

# 27. DEAD-LETTER STORE

## `src/services/ingestion/dead-letter.service.js`

Stores failed events in:

```text
storage/dead_letters.json
```

Record includes:

```text
dead_letter_id
raw_event_id
raw_hash
raw_content
ingested_at
source_id
transport
error_code
error_message
errors
detected_format
attempted_parser
recorded_at
diagnostics
```

Diagnostics include:

```text
raw_length
detected_format
sample_preview
onboarding hint
```

### Supported use

An analyst can inspect failed events and use the information to create a parser.

### Production limitation

One ever-growing JSON file and in-memory Map are not scalable.

---

# 28. REPLAY

## `src/services/event/replay.service.js`

Supports:

```text
replayRawEvent(rawEventId, options)
replayAllDeadLetter(options)
```

Replay flow:

```text
raw event
 ↓
existing raw content
 ↓
processing pipeline
 ↓
new normalized event
```

If successful, the matching dead-letter record is removed from the in-memory/file-based store.

### Important limitation

Replay currently creates a new processing event rather than a full immutable versioned history model.

Future production work should preserve replay lineage/version history.

---

# 29. TRACEABILITY

## `src/services/traceability/traceability.service.js`

Retrieves:

```text
event_id
raw_event_id
raw_hash
raw_content
parser_name
parser_version
transformation_id
mapped_fields
field_lineage
schema_version
processing_status
processing_errors
vendor_specific_extensions
```

Field lineage is created during normalization:

```text
normalized path
    ↓
source field
    ↓
raw event ID
    ↓
parser/version
```

This is a major feature for forensic investigation and debugging.

---

# 30. NORMALIZED STORAGE

## `packages/storage/normalized-event-store.js`

Current storage:

```text
storage/normalized_events/<event-id>.json
```

Supports:

```text
save()
loadAll()
reset()
```

The event-processing service additionally loads every normalized event into:

```text
normalizedEventsMap
```

### Production limitation

Do not scale this design to millions/billions of events.

Future design should use a real event/search store such as:

```text
OpenSearch
```

for searchable normalized events, while retaining raw events in object/append-oriented storage.

---

# 31. EVENT QUERYING

## `GET /api/v1/events`

Supports:

```text
page
limit
search
```

Current implementation:

1. Gets all normalized events from the in-memory Map.
2. Sorts them.
3. JSON-stringifies each for search.
4. Filters.
5. Paginates.

### This is a prototype limitation.

Production should move filtering/pagination into the storage/search layer.

---

# 32. OUTPUT ADAPTERS

## `src/services/output/cef.adapter.js`

Formats normalized events into CEF.

## `src/services/output/jsonl.adapter.js`

Supports:

```text
formatJSONL()
formatJSONLBatch()
formatFlat()
```

### Flat output

Provides easier ML-oriented columns:

```text
event_id
schema_version
raw_hash
raw_event_id
ingested_at
vendor
product
device_type
device_ip
hostname
log_format
transport
event_timestamp
category
event_type
action
outcome
severity
message
src_ip
src_port
dst_ip
dst_port
protocol
direction
username
user_id
domain
session_id
threat_name
threat_type
signature
rule_id
risk_score
parser_name
parser_version
transformation_id
processing_status
processing_errors
vendor_specific
```

---

# 33. OUTPUT ADAPTER PACKAGE

## `packages/output-adapters/output-adapters.js`

Defines prototype adapters:

```text
CefOutputAdapter
JsonlOutputAdapter
FlatOutputAdapter
```

Each exposes:

```text
send()
sendBatch()
health()
```

### Important limitation

The current adapters primarily return/format output; they are not yet durable external SIEM delivery systems with acknowledgment, backoff, persistent output queues, and destination health management.

---

# 34. CURRENT REST API

All API routes are under:

```text
/api/v1
```

## Events

```text
GET    /events
POST   /events/ingest
POST   /events/ingest-file
POST   /events/ingest-file/start
GET    /events/ingest-file/:jobId
POST   /events/ingest-file/:jobId/stop
GET    /events/:id
GET    /events/:id/trace
POST   /events/:id/replay
```

## Parsers

```text
GET  /parsers
POST /parsers
POST /parsers/test
POST /parsers/reload
```

## Sources

```text
GET    /sources
POST   /sources
GET    /sources/:id
DELETE /sources/:id
```

## Output

```text
GET /output/cef
GET /output/cef/:id
GET /output/jsonl
GET /output/flat
```

## Health/metrics

```text
GET /healthcheck
GET /healthcheck/metrics
GET /healthcheck/dead-letter
POST /healthcheck/reset
```

---

# 35. FILE INGESTION JOB CONTROL

The controller has an in-memory:

```text
fileIngestionJobs = Map()
```

Jobs contain:

```text
jobId
filePath
batchSize
source metadata
status
processed
startedAt
completedAt
error
stopRequested
```

Supported:

```text
start
status
stop
```

### Major limitation

Jobs disappear on process restart.

Future production version should persist job state and file checkpoints.

---

# 36. METRICS

## `src/services/metrics/metrics.service.js`

Current counters:

```text
eventsReceived
eventsProcessed
eventsFailed
eventsPartial
eventsUnsupported
validationErrors
parserErrors
deadLettered
```

Also tracks:

```text
parserHits
formatCounts
sourceCounts
last 1000 processing times
```

Calculates:

```text
events_per_second
avg_processing_latency_ms
uptime_seconds
```

Metrics persist to:

```text
storage/metrics.json
```

### Production limitation

`persist()` performs synchronous filesystem writes and is currently called extremely frequently.

This will become a bottleneck at high EPS.

Future production design should use asynchronous/periodic aggregated metrics and Prometheus-style instrumentation.

---

# 37. ML PACKAGE — CURRENT REALITY

## `packages/ml/anomaly-detector.js`

Current detector is **RULE-BASED**, not machine learning.

Rules:

```text
blocked/deny/drop/failed action
    → +0.35

critical/high/emergency severity
    → +0.40

source port 31337 / 4444 / 6667
    → +0.50

unsupported/parser error
    → +0.25
```

Score is capped at:

```text
1.0
```

Anomaly threshold:

```text
>= 0.5
```

Returns:

```text
isAnomaly
score
reasons
recommendedAction
```

### Critical agent rule

Do NOT describe this as an ML model.

Current terminology:

> **Rule-based risk/anomaly scoring baseline**

Future ML work may add an actual offline model such as Isolation Forest.

---

# 38. FRONTEND / DASHBOARD

## `public/dashboard.html`

The current reference UI provides:

### Overview

- Events received
- Processed
- Failed
- Dead lettered
- EPS
- Average latency
- Parser count
- Source count
- Events by parser
- Format distribution
- Quick ingest

### Pipeline View

Stages shown:

```text
Ingestion
Raw Store
Format Detect
Parse
Normalize
Validate
Output
Dead Letter
```

### Event Explorer

Filtering by:

```text
search
status
vendor
```

Table columns include:

```text
Event ID
Vendor
Parser
Format
Source IP
Destination IP
Action
Severity
Status
```

### Event Detail

Tabs:

```text
Normalized
Raw
Traceability
Vendor Extensions
```

### Dead Letter

Shows:

```text
Raw Event ID
Detected Format
Error
Timestamp
Preview
```

### Parser Manager

Shows:

```text
Name
Version
Vendor
Product
Device Type
Format
Match Criteria
Fields Mapped
```

### Parser Wizard

Step-based UI:

```text
1. Identity
2. Detection
3. Field Mapping
4. Test & Register
```

### Test Console / Test Bench

Supports parser-only test before durable ingest.

### Source Registry

Shows registered sources.

### Output Center

Provides output/download functionality.

---

# 39. FRONTEND JAVASCRIPT FUNCTIONS ALREADY PRESENT

The dashboard already has functions including:

```text
navigate
toast
apiFetch
refreshAll
loadMetrics
loadPipelineData
loadEvents
filterEvents
renderEvents
showEventDetail
closeDetail
switchTab
loadDeadLetter
loadParsers
reloadParsers
populateParserSelect
loadSources
registerSource
quickIngest
runParserTest
previewCEF
updateFormatHelp
addMapRow
removeMapRow
buildParserConfig
wizardNext
wizardPrev
setWizardStep
wizardTestParser
wizardRegister
init
```

Future frontend agents should inspect existing behavior through these functions rather than rebuilding pages.

---

# 40. SAMPLE DATA

Current sample categories:

```text
firewall/
    fortigate_sample.log
    paloalto_sample.log

syslog/
    cisco_asa_sample.log

ids/
    snort_sample.log

vpn/
    openvpn_sample.log

proxy/
    squid_sample.log

sample_test_logs.log
manual-test-formats.txt
```

Sample data is intended for:

- parser testing
- demo seeding
- manual validation
- format demonstration

---

# 41. DEMO SEEDING

## `scripts/seed_sample_logs.js`

Reads:

```text
samples/sample_test_logs.log
```

and sends each non-comment, non-empty line to:

```text
POST /api/v1/events/ingest
```

with:

```text
transport=http
```

It waits roughly 150 ms between lines.

### Important

This is a demo tool, not a high-throughput ingestion benchmark.

---

# 42. AUTO-SEEDING

There is also:

```text
src/services/event/auto-seed.service.js
```

It contains logic to:

- Register sample sources.
- Load sample logs.
- Process initial data.

However, normal current startup path in `src/index.js` does not call the seed function.

Therefore:

> **Do not assume the system automatically creates sample traffic on startup.**

---

# 43. BENCHMARK

## `scripts/benchmark/benchmark.js`

Current benchmark:

```text
5000 events
```

Same sample event repeated.

Measures:

```text
total duration
EPS
average latency
p50
p95
p99
heap delta
```

### Important interpretation

This benchmarks direct processing:

```text
eventProcessingService.processSingleRawLog()
```

It does NOT represent a full production benchmark through:

```text
real network ingestion
durable queue
multiple workers
bulk storage
SIEM/Data Lake
```

Future benchmark work must document the tested architecture and resource limits.

---

# 44. TEST COVERAGE CURRENTLY PRESENT

## `tests/pipeline.test.js`

Demonstrates:

- FortiGate normalization.
- SHA-256/traceability.
- Cisco ASA parsing.
- Stream file ingestion.
- Generic JSON parsing.
- Generic CEF parsing.

## `tests/unit/contracts.test.js`

Checks:

- schema file exists
- runtime event contract
- mandatory fields
- processing status
- trace object
- extensions object

## `tests/unit/storage.test.js`

Checks:

- raw event saved to disk
- retrieval works
- restart simulation reloads raw event

## `tests/unit/ingestion.test.js`

Checks:

- IngestionManager
- raw persistence
- queue publication
- common ingestion interface

## `tests/unit/worker.test.js`

Checks:

- queue job creation
- worker consumes job
- normalized event generated

## `tests/unit/plug_and_play.test.js`

Checks:

- runtime parser registration
- new vendor processing
- Check Point config loading
- vendor-field preservation

## `tests/unit/replay.test.js`

Checks:

- unknown event becomes UNSUPPORTED
- dead letter created
- parser added
- raw event replayed
- dead letter resolved

---

# 45. CURRENT NPM COMMANDS

From `package.json`:

```bash
npm install
npm start
npm run dev
npm run frontend
npm run build
npm test
npm run seed
```

### `npm test`

Runs:

```text
pipeline.test.js
contracts.test.js
storage.test.js
ingestion.test.js
plug_and_play.test.js
replay.test.js
worker.test.js
```

---

# 46. DOCKER

## `Dockerfile`

Builds the application and frontend bundle.

## `docker-compose.yml`

Runs the application with mounted local storage/parser directories.

### Current deployment model

This is a **single-container/local-state prototype**.

It is not yet the final distributed production architecture.

---

# 47. CURRENT PROJECT STRENGTHS

These are already strong enough to preserve:

## 47.1 Lossless concept

Raw event saved before transformation.

## 47.2 Parser-driven architecture

Parser definitions are external to core processing code.

## 47.3 Plug-and-play proof

New parser can be registered without vendor code branches.

## 47.4 Vendor extension retention

Unmapped fields are retained.

## 47.5 Traceability

Raw reference, hash, parser/version, mappings, lineage.

## 47.6 Replay

Historical raw event can be processed again.

## 47.7 Multiple formats

JSON, CEF, Syslog, key-value, regex.

## 47.8 Useful dashboard

The UI demonstrates the complete lifecycle clearly.

## 47.9 Tests

The major conceptual requirements have acceptance coverage.

---

# 48. CURRENT TECHNICAL LIMITATIONS — DO NOT HIDE THESE FROM FUTURE AGENTS

The following are known limitations, not unknown bugs.

## Scale / storage

- One JSON file per raw event.
- One JSON file per normalized event.
- Entire datasets loaded into memory in several places.
- JSON dead-letter/metrics files grow indefinitely.
- In-memory file-ingestion jobs.

## Queue

- Local filesystem queue.
- Single-process queue model.
- No distributed consumer groups.
- No robust queue acknowledgment semantics.

## Processing

- Normalized persistence is now part of the synchronous local success boundary, but this still blocks the event loop and is not a scalable production storage design.
- Synchronous filesystem writes exist in hot paths.

## File ingestion

- No durable file checkpoint model.
- Limited rotation/identity tracking.
- Job state is lost on restart.
- Lines are trimmed before raw preservation.

## Networking

- UDP collector is available but UDP cannot guarantee delivery.
- TCP/TLS collectors are not yet fully implemented/wired.

## Search

- In-memory filtering and pagination.
- Not backed by OpenSearch yet.

## SIEM/Data Lake

- Output formatting exists.
- Durable external delivery/ack/retry architecture is not yet complete.

## ML

- Current anomaly detector is rules, not ML.

## Observability

- Metrics stored in JSON and synchronously persisted.
- No Prometheus-native metric pipeline yet.

## Schema validation

- JSON Schema exists.
- Runtime validation is partly custom rather than fully schema-driven.

## Authentication

- Intentionally out of scope for the current project.

---

# 49. WHAT FUTURE AGENTS MUST NOT DO

## Do not rewrite the project from scratch

The current pipeline is already implemented and tested.

Extend it.

## Do not remove working functionality

Before changing a module:

```text
understand current behavior
→ preserve it
→ add/change behavior
→ run tests
```

## Do not introduce Python into the main backend

Main runtime remains:

```text
Node.js / JavaScript
Express
```

An isolated ML service may be introduced later if explicitly approved.

## Do not add authentication

Not part of current scope.

## Do not replace Express with another framework without explicit approval

The team deliberately uses the familiar Chai-style Express architecture.

## Do not create hardcoded vendor branches

Avoid:

```javascript
if (vendor === "Cisco") ...
if (vendor === "Fortinet") ...
```

when the behavior belongs in parser configuration.

## Do not destroy vendor-specific fields

Unmapped information must remain available.

## Do not make AI responsible for parsing

Parsing/normalization must remain deterministic and traceable.

## Do not claim production scalability from the current local-file implementation

The production scalability layer still needs to be built.

## Do not introduce large infrastructure without justification

Examples:

```text
Kafka cluster
Kubernetes
microservice mesh
service discovery
distributed tracing stack
```

should not be added simply for appearance.

---

# 50. CURRENT SIH GAP PRIORITIES

The next work should NOT be “add random features.”

Prioritize these:

## P0 — Production correctness

1. Make raw persistence an explicit durable acceptance boundary.
2. Preserve exact raw bytes/content before parsing.
3. Make processing fully asynchronous and awaited.
4. Add idempotency.
5. Add durable queue semantics.
6. Add durable file checkpoints.
7. Add failure-safe output handling.
8. Remove in-memory full-dataset assumptions.

## P1 — Production scale

1. Durable scalable queue.
2. Multiple workers.
3. Bulk processing.
4. Partitioned raw storage.
5. OpenSearch for event search.
6. MinIO/object storage.
7. PostgreSQL or another metadata database if approved.
8. Source-level rate control.
9. Backpressure.
10. Output queues/retries.

## P1 — SIH feature strengthening

1. Schema drift detection.
2. Parser health monitoring.
3. Better source health.
4. Context-aware risk scoring.
5. Correlation.
6. Threat hunting.
7. MITRE ATT&CK mapping.

## P2 — Advanced analytics

1. Actual ML anomaly model.
2. Behavioral baseline.
3. RAG analyst assistant.
4. Advanced enrichment.
5. Automated parser suggestions.

---

# 51. PRODUCTION ARCHITECTURE TARGET

The target architecture should evolve toward:

```text
                 PERIMETER SOURCES
                        |
              +---------+---------+
              |         |         |
           Collector Collector Collector
              |         |         |
              +---------+---------+
                        |
                Durable Acceptance
                        |
                 +------+------+
                 |             |
              Raw Store      Event Queue
                 |             |
                 |       +-----+-----+-----+
                 |       |     |     |     |
                 |      W1    W2    W3    WN
                 |       |     |     |     |
                 |       +-----+-----+-----+
                 |             |
                 |        Parse/Normalize
                 |             |
                 |         Validation
                 |             |
                 +------> Traceability
                               |
                       Normalized Store
                               |
                 +-------------+-------------+
                 |             |             |
                SIEM        Data Lake        ML
```

---

# 52. RATE CONTROL RULE

The log data plane should NOT use a simplistic hard global rate limiter that discards security events.

Use:

```text
source-aware rate control
+
durable buffering
+
bounded workers
+
backpressure
+
explicit overload policy
```

Management/control APIs can use normal token-bucket limiting.

Production principle:

> Rate-limit the control plane; buffer and regulate the data plane.

---

# 53. DATA LOSS CLAIM

The correct claim is:

> Once an event has crossed the durable ingestion acceptance boundary, downstream parser, worker, storage, SIEM, or ML failures must not cause loss of the accepted raw event.

Do NOT claim:

> “The network can never lose a UDP packet.”

Do NOT claim:

> “The platform can buffer infinite data.”

---

# 54. REPLAY / RECOVERY PRINCIPLE

Raw events should remain the recoverable source of truth.

Therefore:

```text
parser bug
schema change
worker crash
SIEM outage
OpenSearch outage
normalization change
```

must not require the source device to resend historical data.

---

# 55. SIEM / DATA LAKE PRINCIPLE

The project is NOT a complete SIEM or Data Lake.

It is the **pre-processing/normalization layer feeding them**.

Correct model:

```text
heterogeneous sources
       ↓
ULPF
       ↓
universal events
       ↓
SIEM / Data Lake / analytics
```

---

# 56. ML PRINCIPLE

Core processing:

```text
deterministic
traceable
reproducible
```

ML:

```text
optional
probabilistic
downstream
```

Current implementation:

```text
rule-based risk score
```

Future:

```text
normalized events
→ behavioral features
→ Isolation Forest or approved model
→ anomaly score
```

---

# 57. AGENT WORKING RULES

Every future implementation agent must follow this procedure:

## Before coding

1. Read this file first.
2. Identify the relevant current module.
3. Check the existing tests for that module.
4. State what current behavior must be preserved.
5. State exactly what new behavior will be added.

## During coding

1. Modify the smallest set of files necessary.
2. Follow existing naming/layout conventions.
3. Reuse `ApiResponse`, `ApiError`, `asyncHandler`, logger, constants, and current service boundaries.
4. Do not silently rewrite unrelated code.
5. Do not add dependencies without necessity.
6. Add/update tests with the feature.
7. Keep error behavior explicit.

## After coding

Run appropriate tests.

At minimum:

```bash
npm test
```

and when relevant:

```bash
npm run build
```

For scale-sensitive changes, run the appropriate benchmark.

## REQUIRED DOCUMENT UPDATE

Before finishing the task, update:

```text
docs/CURRENT_IMPLEMENTATION_KNOWLEDGE.md
```

with:

```text
Date
Agent/task
Summary
Files changed
Existing behavior preserved
New behavior
Tests run
Test results
Known issues
API/schema/config changes
Next step
```

---

# 58. CHANGE LOG — LIVING SECTION

Future agents MUST append entries here.

## 2026-09-11 — Initial implementation inventory

**Task:** Full source/codebase inspection and agent handoff documentation.

**Baseline established:**
- Node/Express application.
- Universal event schema v1.
- Raw event persistence/hash.
- File + HTTP ingestion.
- UDP Syslog collector package.
- Local queue + worker.
- Format detection.
- Config-driven parser registry.
- Multiple vendor/format parser definitions.
- Normalization.
- Vendor-specific field retention.
- Validation.
- Dead letter.
- Replay.
- Traceability/field lineage.
- Source registry.
- Metrics.
- CEF/JSONL/flat outputs.
- Reference dashboard.
- Parser wizard/test bench.
- Test suite and benchmark.

**Known limitations recorded:**
- Local file/in-memory storage at scale.
- Local queue.
- In-memory job/search state.
- Hot-path synchronous persistence.
- Incomplete durable acceptance semantics.
- No idempotency guarantee.
- No durable file checkpoints.
- UDP delivery limitation.
- Basic output adapters.
- Rule-based rather than ML anomaly detector.
- Authentication intentionally out of scope.

**Next recommended task:** Production correctness of the ingestion/queue boundary before adding more UI or advanced analytics.

## 2026-09-13 — Await worker processing before queue acknowledgement

**Task:** Fix the worker/queue processing promise boundary.

**Objective:** Ensure queue completion and retry handling reflect the actual result of event processing.

**Implementation summary:**
- Updated `apps/worker/event-worker.js` to return `eventProcessingService.processSingleRawLog()` from the queue handler.
- Added a delayed-processing regression check to `tests/unit/worker.test.js`.

**Existing behavior preserved:**
- The local queue, worker polling model, metadata mapping, and event-processing pipeline remain unchanged.
- Successful jobs are still removed from the local queue after processing.

**New functionality:**
- Queue acknowledgement now waits for processing completion.
- Processing rejections can now reach the queue retry/failure path.

**Files modified:**
- `apps/worker/event-worker.js`
- `tests/unit/worker.test.js`
- `docs_CURRENT_IMPLEMENTATION_KNOWLEDGE.md`

**Tests executed:**
- `node tests/unit/worker.test.js` — passed.

**API/schema/config/storage changes:** None.

**Known limitations:** The queue remains a single-process local filesystem prototype and does not yet provide distributed acknowledgement or consumer-group semantics.

**Next recommended task:** Make normalized persistence part of the awaited processing success boundary, then add idempotent processing keys.

## 2026-09-13 — Durable normalized write and queue idempotency

**Task:** Complete the next production-correctness slice after worker promise handling.

**Objective:** Ensure normalized persistence is part of the local processing success boundary and retries do not duplicate accepted events.

**Implementation summary:**
- Added `saveSync()` to the local normalized event store.
- Propagated `raw_event_id` from `IngestionManager` through queue jobs and the worker.
- Reused the accepted raw event during queue processing.
- Added a processed-raw index so repeated processing returns the existing normalized event.
- Added regression coverage for duplicate processing.

**Existing behavior preserved:**
- Direct synchronous processing remains compatible with existing controllers, replay, benchmarks, and tests.
- Parser selection, normalization, validation, dead-letter handling, and traceability remain unchanged.
- The local queue retry model remains unchanged.

**New functionality:**
- Normalized event persistence completes before processing returns.
- Queue retries for an already processed raw event are idempotent.
- Accepted raw events are not duplicated when a worker processes their queue job.

**Files modified:**
- `packages/storage/normalized-event-store.js`
- `packages/ingestion/ingestion-manager.js`
- `apps/worker/event-worker.js`
- `src/services/event/event-processing.service.js`
- `tests/unit/worker.test.js`
- `docs_CURRENT_IMPLEMENTATION_KNOWLEDGE.md`

**Tests executed:**
- `node tests/unit/worker.test.js` — passed.

**API/schema/config/storage changes:** No API, schema, or configuration changes. Local normalized writes are now synchronous.

**Known limitations:** Idempotency is currently local-process/local-store based and does not provide distributed deduplication. Synchronous filesystem writes remain unsuitable for high-volume production throughput.

**Next recommended task:** Add durable file checkpoints and restart-safe file ingestion jobs, then validate partial-file recovery.

---

# 59. QUICK REFERENCE FOR NEW AGENTS

If an agent only has two minutes, understand this:

```text
MAIN PIPELINE
=============
HTTP/File/Syslog
    ↓
Raw Store
    ↓
Format Detector
    ↓
Parser Registry
    ↓
Parser
    ↓
Normalizer
    ↓
Validator
    ↓
Traceability
    ↓
Normalized Store
    ↓
Outputs
```

```text
PLUG-AND-PLAY
=============
new parser JSON
    ↓
registry
    ↓
test
    ↓
activate
    ↓
process
```

```text
FAILURE
=======
raw preserved
    ↓
dead letter
    ↓
new parser/config
    ↓
replay
```

```text
CURRENT TECHNOLOGY
==================
Node.js
Express
CommonJS
dotenv
local filesystem
JSON configuration
Vite dashboard
Docker
```

```text
NOT CURRENTLY PRODUCTION-SCALE
==============================
local JSON event files
in-memory event/search maps
local file queue
single worker model
```

```text
DO NOT BREAK
============
Universal schema
Parser abstraction
Normalization
Vendor extensions
Traceability
Replay
ApiResponse
ApiError
asyncHandler
Central error handling
Existing tests
```

---

# 60. FINAL INSTRUCTION TO ALL AI AGENTS

**Treat this file as the project's memory.**

Do not waste time re-discovering functionality already described here.

Read this document before making changes.

Use the actual source code to verify details when necessary.

When you discover that the document is outdated:

1. Fix the implementation if the implementation is wrong and the intended behavior is approved.
2. Fix this document if the implementation is the new intended behavior.
3. Record the change in the Change Log.
4. Never leave the project-state document knowingly stale.

The goal is that a new agent should be able to understand the architecture, available functionality, API surface, data flow, test coverage, limitations, and next work **from this document first**, then inspect only the files relevant to its assigned task.
