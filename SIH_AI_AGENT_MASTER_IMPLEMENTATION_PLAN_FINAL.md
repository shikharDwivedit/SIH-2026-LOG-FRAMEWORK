# SIH 2026 — AI Agent Master Implementation Plan
## Universal Lossless Perimeter Event Normalization Framework

**Source of truth:** the currently opened `main` project folder  
**Additional feature source:** the already-existing sibling `SIH` folder  
**Primary implementation target:** the currently opened `main` project folder  
**Architecture style:** Chai aur Code-style Express backend conventions, adapted to this project's domain  
**Authentication:** Explicitly OUT OF SCOPE and must not be added back

---

# 0. PURPOSE OF THIS DOCUMENT

This document is the operating contract for AI coding agents working on the SIH 2026 project.

Agents must use it to:

- understand the complete project scope;
- know which existing features must be preserved;
- know which additional features from the existing `SIH` reference folder should be ported;
- know what is mandatory, optional, or excluded;
- implement work in controlled stages;
- avoid destructive rewrites;
- resolve issues systematically;
- keep the project understandable and debuggable;
- maintain a clean separation between the universal framework and the reference application.

The target is NOT to blindly combine two repositories.

## 0.1 WORKING DIRECTORY / FILESYSTEM RULE

Assume the AI coding agent is started from the already-open `main` project folder. The additional reference project is already present as a folder named `SIH` and is available on disk; do **not** extract, unzip, or recreate it.

Expected layout conceptually:

```text
parent/
├── main/    ← CURRENT WORKING PROJECT; modify this
└── SIH/     ← EXISTING REFERENCE/FEATURE SOURCE; inspect only
```

If the agent is launched from `main/`, the reference folder will normally be available as `../SIH/`. If the exact relative path differs, locate the existing `SIH` folder without extracting any archive.

Rules:
- Work only on the `main` project unless explicitly asked otherwise.
- Read/inspect `SIH` to understand additional features.
- Do not modify the `SIH` reference folder.
- Do not unzip `the existing `SIH/` folder`.
- Do not create a second copy of the reference project.
- Do not replace `main` with `SIH`.
- Port only approved features from `SIH` into `main` using the Node architecture.

The target is:

```text
CURRENT `main` FOLDER = existing foundation + source of truth
              +
selected useful capabilities from existing `SIH` reference folder
              ↓
     one coherent SIH platform
```

---

# 1. SIH CORE REQUIREMENT

The platform must accept heterogeneous perimeter-device events, preserve the original data, parse source-specific information, normalize it into a common taxonomy, maintain traceability, support low-effort source onboarding, and make the result suitable for SIEM, Data Lake, search, and analytics/AI-ML.

Core SIH requirements:

1. Lossless raw-event preservation.
2. Source-specific parsing and extraction.
3. Universal/common event normalization.
4. Raw-to-normalized traceability.
5. Plug-and-play source onboarding.
6. Unified visibility across sources.
7. SIEM and Data Lake integration.
8. AI/ML-ready data.
9. Reduced parser development effort.
10. Air-gapped deployment.
11. Containerized/platform-independent deployment.

Reference SRS wording must take precedence over agent assumptions.

---

# 2. SOURCE RECONCILIATION RULE

## 2.1 The currently opened `main` folder is authoritative

The currently opened `main` folder is the primary application. Agents must work directly inside this folder and must not unzip/re-extract `main.zip`.

Agents must preserve its working behavior unless a task explicitly changes that behavior.

Existing main functionality includes:

- Express API;
- file ingestion;
- UDP Syslog ingestion;
- raw-event preservation;
- SHA-256 hashing;
- format detection;
- parser registry/loading;
- configuration-driven parser definitions;
- normalization;
- validation;
- traceability/field lineage;
- dead-letter handling;
- source registry;
- replay;
- metrics;
- CEF output;
- JSONL output;
- ML-oriented flat JSONL output;
- local normalized/raw stores;
- dashboard;
- parser onboarding/test workflow;
- sample datasets;
- benchmark script;
- tests.

These are not to be removed just because a second implementation exists elsewhere.

## 2.2 Existing `SIH` folder is a feature reservoir

The already-existing `SIH` folder contains the additional/reference security-operation features. It is already available on disk. Agents must NOT extract `the existing `SIH/` folder`, recreate the folder, copy the entire reference project, or replace the main architecture with it.

Agents must treat those files as:

- requirements inspiration;
- behavior/reference;
- feature inventory;
- test-case inspiration;

and NOT as a reason to:

- introduce Python into the main runtime;
- replace the Node architecture;
- copy the FastAPI structure;
- duplicate the whole application;
- blindly copy incomplete implementations.

Where an `SIH` feature is accepted into scope, implement its equivalent using the established Node project architecture in `main`.

---

# 3. FEATURES FOUND IN `main.zip`

The following existing capabilities must be preserved and improved rather than discarded.

## Core processing

- raw event creation;
- event IDs;
- SHA-256 integrity hash;
- raw storage;
- format detection;
- parser registry;
- parser loading;
- parser matching;
- generic parser execution;
- normalization;
- vendor-specific field retention;
- schema validation;
- traceability;
- field lineage;
- processing status;
- dead-letter handling;
- replay;
- source registry;
- metrics;
- output adapters.

## Existing parsers

- Generic Syslog
- Cisco ASA
- FortiGate
- Palo Alto
- Snort
- OpenVPN
- Squid
- Check Point

## Existing input/output

- File ingestion
- UDP Syslog ingestion
- HTTP ingestion
- CEF output
- Complete JSONL output
- Flat ML-oriented JSONL output

## Existing UI capability

- Overview
- Pipeline visualization
- Event explorer
- Event detail
- Raw/normalized/trace/vendor views
- Dead-letter view
- Parser registry
- Parser creation wizard
- Parser test bench
- Source registry
- Output center
- Runtime metrics

---

# 4. FEATURES FOUND IN THE EXISTING `SIH/` FOLDER TO RECONCILE

These are the major additional capabilities identified in the existing `SIH` reference folder.

## 4.1 Format and parser capabilities

- RFC 5424 parsing
- CEF parser
- LEEF parser
- JSON parser
- JSONL parser
- CSV parser
- XML parser
- Windows EVTX parser
- generic parser registry
- unknown-format structural analyzer

## 4.2 Normalization capabilities

- canonical security event model
- canonical field vocabulary
- mapping management
- schema explorer
- schema drift detection
- mapping provenance
- confidence-based mapping suggestions

## 4.3 Reliability and evidence

- raw evidence object storage
- immutable evidence metadata
- integrity verification
- quarantine
- quarantine analysis
- replay from quarantine
- processing run/stage tracking
- replay history

## 4.4 Security analytics

- deterministic detection rules
- threshold-based detection
- alert generation
- risk scoring
- risk factors/explanations
- event correlation
- MITRE ATT&CK mapping
- alert status handling
- incident creation/management
- evidence association

## 4.5 Enrichment

- enrichment orchestration
- enrichment caching
- circuit breaker behavior
- GeoIP
- DNS
- RDAP
- MITRE information
- STIX/TAXII
- VirusTotal
- AbuseIPDB
- AlienVault OTX

## 4.6 Operations and visibility

- dashboard metrics
- audit logging
- reports
- event timeline
- health/readiness
- metrics
- parser status
- ingestion monitoring
- live event stream

## 4.7 Testing/demo

- synthetic telemetry generation
- scenario-based test lab
- malformed-event scenarios
- schema-drift scenarios
- unknown-vendor scenarios
- replay/quarantine tests
- end-to-end tests

---

# 5. FINAL SCOPE CLASSIFICATION

## A. P0 — MANDATORY CORE

These features directly solve the SIH problem and must work reliably.

### P0-01 Universal Event Schema

- canonical event model;
- schema version;
- source metadata;
- event metadata;
- network fields;
- identity fields where available;
- threat/security fields where available;
- extensions/vendor-specific area;
- processing metadata;
- traceability metadata.

### P0-02 Lossless Raw Preservation

- preserve exact raw content;
- event ID;
- raw hash;
- raw timestamp/ingestion metadata;
- storage reference;
- immutable semantics;
- retrieve raw event by ID.

### P0-03 Multi-Format Detection

Support at minimum:

- Syslog;
- JSON;
- CEF;
- key-value/vendor text.

### P0-04 Parser Engine

- parser registry;
- parser loading;
- parser matching;
- extraction;
- parser versions;
- parser tests;
- configuration-driven definitions.

### P0-05 Plug-and-Play Source Onboarding

New source workflow:

```text
sample log
→ parser definition
→ parser test
→ registration
→ activation
→ processing
```

No vendor-specific hardcoded branch in the core pipeline.

### P0-06 Normalization

- vendor aliases → canonical fields;
- timestamp normalization;
- severity normalization;
- common categories/actions;
- type conversion;
- preservation of unknown fields.

### P0-07 Field-Level Traceability

Support:

```text
raw field
→ parsed field
→ normalized field
```

and event-level links:

```text
event_id
raw_event_id
raw_hash
parser_name
parser_version
schema_version
transformation_id
```

### P0-08 Validation

- schema validation;
- IP validation;
- port validation;
- timestamp validation;
- required field checks;
- normalization status.

### P0-09 Failure / Dead Letter

Malformed or unsupported events must:

- retain raw data;
- receive failure status;
- record reason;
- become visible in dead-letter/quarantine handling;
- never disappear silently.

### P0-10 Replay

Raw events must be re-processable with:

- current parser;
- selected parser;
- newer parser version.

### P0-11 Ingestion

Minimum:

- file streaming;
- Syslog UDP/TCP where implemented;
- HTTP ingestion.

### P0-12 Unified Search/Visibility

Search common fields across vendors and formats.

### P0-13 SIEM/Data Lake Output

At minimum provide demonstrable:

- CEF/Syslog-compatible output;
- JSON/JSONL;
- Data Lake-friendly structured output such as JSONL or Parquet.

### P0-14 Air-Gapped Operation

No runtime Internet dependency.

### P0-15 Container Deployment

Docker/Docker Compose-based reproducible deployment.

---

# 6. P1 — STRONG SIH EXTENSIONS

These features improve the solution materially and should be implemented after P0 is stable.

## P1-01 Unknown Format Analyzer

When no parser matches:

- infer delimiters;
- identify likely field types;
- identify likely IP/domain/hash/timestamp fields;
- suggest canonical mappings;
- present suggestions for analyst approval;
- never auto-activate uncertain mappings without approval.

This is a strong implementation of reduced parser-development effort.

## P1-02 Schema Drift Detection

Detect when a known source changes a field name or structure.

Example:

```text
Expected: src_ip
Observed: client_ip
          ↓
Possible drift
```

Record:

- expected field;
- observed field;
- suggested canonical field;
- confidence;
- reason;
- affected event count;
- approval status.

## P1-03 Mapping Management

Provide:

- list mappings;
- add mapping;
- deactivate/delete mapping where safe;
- mapping version/provenance;
- confidence;
- source of mapping.

## P1-04 Deterministic Security Detection

Implement configurable rules against normalized events.

Examples:

- repeated authentication failures;
- unusual ports;
- threshold/frequency patterns;
- known malicious indicator context;
- suspicious activity chains.

Rules must be deterministic and explainable.

## P1-05 Alerts

Alert fields:

- alert ID;
- event ID;
- rule ID;
- severity;
- risk score;
- description;
- evidence/details;
- MITRE mapping where applicable;
- alert status.

## P1-06 Risk Scoring

Use explainable deterministic risk scoring before ML.

Risk should expose factors, not just a number.

Example:

```text
Base severity       +60
Repeated behavior   +10
Detection rule      +20
External source     +5
--------------------------------
Risk score           95
```

## P1-07 MITRE ATT&CK Mapping

Maintain a small static, defensible subset of ATT&CK mappings.

Do NOT claim complete ATT&CK coverage.

Store:

- technique ID;
- technique name;
- tactic;
- confidence;
- mapping reason;
- source of mapping.

## P1-08 Event Correlation

Correlate normalized events within a configurable time window using shared attributes such as:

- source IP;
- user;
- device/source;
- destination;
- session identifiers where present.

Correlation should produce explainable groups, not arbitrary black-box conclusions.

## P1-09 Incidents

Allow related alerts/events to be grouped into an incident.

Include:

- title;
- severity;
- status;
- first/last seen;
- affected assets;
- indicators;
- related events;
- MITRE mappings;
- notes.

This is an analyst workflow feature, not a replacement for a full case-management platform.

## P1-10 Evidence + Integrity Verification

Maintain:

- raw evidence reference;
- SHA-256;
- content type;
- size;
- storage location;
- preservation status;
- integrity verification result;
- access metadata.

Integrity verification must re-read the stored raw object and compare hashes.

## P1-11 Quarantine

Failed/unknown events should be inspectable in a dedicated quarantine workflow.

Support:

- reason;
- processing stage;
- detected format;
- confidence;
- parser/version attempt;
- errors;
- structural analysis;
- suggested mappings;
- approval;
- replay.

## P1-12 Processing Timeline

Expose stage history such as:

```text
INGESTED
PRESERVED
HASHED
DETECTED
PARSED
NORMALIZED
VALIDATED
ENRICHED
ROUTED
```

Each stage may record:

- status;
- component;
- start time;
- end time;
- duration;
- error.

## P1-13 Audit Logging

Record administrative and processing-management operations.

Do not log secrets.

## P1-14 Test Lab / Synthetic Telemetry

Provide defensive-only synthetic log generation for demos and regression testing.

Scenarios can include:

- brute-force pattern;
- port-scan-like activity;
- suspicious authentication;
- malware indicator event;
- web attack-like event;
- privilege escalation-like event;
- unknown vendor;
- malformed input;
- schema drift.

These are synthetic telemetry records only. No real attack execution, scanning, exploitation, or credential attacks.

---

# 7. P2 — OPTIONAL / ADVANCED FEATURES

Implement only after P0 and P1 are stable.

## P2-01 Threat Intelligence Providers

Potential providers identified from the existing `SIH` reference folder:

- VirusTotal;
- AbuseIPDB;
- AlienVault OTX;
- STIX/TAXII.

They MUST be optional.

They MUST NOT be required for the core pipeline.

They MUST be disabled/replaceable in air-gapped mode unless a local equivalent is supplied.

Use:

- caching;
- timeouts;
- circuit breakers;
- failure isolation.

## P2-02 Local Enrichment

Prefer offline-capable sources where possible:

- local GeoIP;
- local DNS;
- local asset metadata;
- local MITRE data;
- local RDAP dataset if available.

## P2-03 Advanced AI/ML

Only after deterministic normalization and detection are stable.

Candidate functions:

- anomaly detection;
- clustering;
- risk prediction;
- behavioral analytics.

The ML layer must consume normalized events.

It must not become the parser itself.

## P2-04 Live Stream UI

WebSocket-based dashboard updates showing newly processed events.

## P2-05 Reports

Generate event/incident reports with:

- normalized event;
- raw evidence reference;
- integrity information;
- detections;
- ATT&CK context;
- enrichment;
- replay history;
- audit trail.

Reports must clearly state that they are platform-generated operational reports, not legal-admissibility claims.

## P2-06 Additional Formats

- Windows EVTX;
- XML;
- CSV;
- additional flow-record formats.

These are secondary to perimeter security formats.

---

# 8. EXPLICITLY EXCLUDED

Agents MUST NOT add these unless the human owner explicitly requests them.

## EX-01 Authentication / Login / RBAC

Authentication was intentionally removed from the project scope.

Do not reintroduce:

- JWT login;
- password auth;
- bcrypt user auth;
- roles/permissions;
- refresh tokens;
- OAuth/SSO;
- user management.

## EX-02 Full SIEM Replacement

The project is not a commercial SIEM.

Do not build:

- full SOC case management;
- giant query language;
- enterprise user directory;
- comprehensive correlation platform;
- full detection marketplace.

## EX-03 Offensive Security Tooling

Do not implement:

- port scanners;
- exploitation tools;
- attack execution;
- credential attacks;
- malware execution;
- intrusive device discovery.

Synthetic test telemetry is permitted; real attacks are not part of the project.

## EX-04 Mandatory External Internet Services

Do not make core normalization depend on:

- cloud APIs;
- external threat-intelligence APIs;
- Internet DNS;
- external LLM APIs.

---

# 9. TARGET ARCHITECTURE

The project should evolve toward one coherent Node architecture.

```text
                       REFERENCE APPLICATION
                  ┌───────────────────────────┐
                  │ Dashboard / API / Ops UI  │
                  └─────────────┬─────────────┘
                                │
                                ▼
                     Controller / Route Layer
                                │
                                ▼
                            Services
                                │
============================================================
                 UNIVERSAL EVENT FRAMEWORK
============================================================
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
      Ingestion              Parsing             Normalization
          │                     │                     │
          ▼                     ▼                     ▼
   Raw Preservation       Parser Registry       Canonical Model
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                ▼
                           Validation
                                ▼
                          Traceability
                                ▼
                           Detection
                                ▼
                          Enrichment
                                ▼
                         Risk / Alerts
                                ▼
                           Incidents
                                ▼
                            Outputs
```

---

# 10. BACKEND ARCHITECTURE STYLE

The implementation should remain familiar to a Chai aur Code-style Node developer.

Use:

```text
routes
controllers
services
models/repositories
middlewares
utils
config
validators
constants
workers
```

Domain-specific processing belongs under services/packages such as:

```text
services/ingestion
services/parser
services/normalization
services/validation
services/traceability
services/quarantine
services/replay
services/detection
services/enrichment
services/correlation
services/incident
services/output
services/report
```

Keep controllers thin.

Use centralized:

- `ApiResponse`
- `ApiError`
- `asyncHandler`
- error middleware
- logging

Do not invent a new architecture for every feature.

---

# 11. DATA OWNERSHIP

Use the following conceptual ownership.

```text
Raw Event
   ↓
source of truth

Normalized Event
   ↓
search/analytics representation

Parser Definition
   ↓
translation rules

Mapping
   ↓
canonical field decision

Processing Run
   ↓
stage history

Alert
   ↓
detection result

Incident
   ↓
analyst grouping
```

No layer should silently overwrite another layer's responsibility.

---

# 12. EVENT LIFECYCLE

The canonical event lifecycle is:

```text
1. RECEIVE
2. IDENTIFY
3. PRESERVE RAW
4. HASH
5. DETECT FORMAT
6. SELECT PARSER
7. PARSE
8. NORMALIZE
9. VALIDATE
10. RECORD TRACEABILITY
11. OPTIONAL ENRICHMENT
12. DETECTION / RISK
13. STORE
14. OUTPUT
15. SEARCH / VISUALIZE
```

Failure at any stage must preserve the raw event.

---

# 13. PLUG-AND-PLAY CONTRACT

The framework must support:

```text
New vendor
   ↓
Create parser definition
   ↓
Test against samples
   ↓
Register parser
   ↓
Register source
   ↓
Activate
   ↓
Process
```

Adding a vendor must NOT require modifying:

- core processing pipeline;
- universal normalization engine;
- unrelated outputs;
- dashboard internals.

---

# 14. UNKNOWN SOURCE CONTRACT

For an unknown source:

```text
Unknown event
    ↓
raw preserved
    ↓
format analysis
    ↓
structural analysis
    ↓
possible mapping suggestions
    ↓
quarantine / review
    ↓
new parser
    ↓
replay
```

Never silently discard it.

---

# 15. VERSIONING RULES

Version independently:

- universal schema;
- parser definitions;
- mappings;
- detection rules where useful.

Every normalized result must record the versions used.

Never mutate historical raw data.

A parser correction should create a new parser version where behavior materially changes.

---

# 16. AGENT EXECUTION MODEL

AI agents must work in small, verifiable increments.

For every task:

1. Read the relevant code first.
2. Identify existing behavior.
3. Identify tests covering the behavior.
4. Implement the smallest coherent change.
5. Add/update tests.
6. Run the relevant tests.
7. Run the broader regression suite when the change stabilizes.
8. Report exactly what changed.

Never implement several unrelated features in one unbounded change.

---

# 17. AGENT RESTRICTIONS

## R-01 Do not rewrite the repository

Do not replace the current project wholesale.

## R-02 Do not merge Python into the main runtime

Translate selected `SIH` reference-folder capabilities to Node.

## R-03 Do not add authentication

This is permanently excluded unless explicitly reopened by the human owner.

## R-04 Do not introduce a dependency without justification

For each new dependency, state:

- why it is needed;
- what problem it solves;
- why existing code is insufficient;
- whether it works offline;
- whether it increases operational complexity.

## R-05 Do not over-engineer

Prefer a simple conventional implementation over unnecessary patterns.

## R-06 Preserve losslessness

Never transform first and preserve later.

## R-07 No silent drops

Every failed event must have a visible status/path.

## R-08 No fake claims

Do not claim:

- OCSF compliance if only a subset is implemented;
- guaranteed delivery from UDP itself;
- complete vendor coverage;
- complete ATT&CK coverage;
- production SIEM parity;
- AI accuracy without benchmark evidence.

## R-09 No hidden network calls

No telemetry, cloud API, package download, or external call may be added to the runtime without explicit documentation and configuration.

## R-10 Keep startup deterministic

Do not generate fake events on every startup or page refresh.

## R-11 Do not store secrets in Git

Use environment/configuration files.

## R-12 Do not make UI the core dependency

The framework must work through services/API without the dashboard.

## R-13 Keep security testing defensive

Synthetic scenarios only.

## R-14 Preserve existing tests

Do not delete failing tests to make the suite green.

## R-15 Fix root causes

Do not patch symptoms with hardcoded special cases.

---

# 18. ISSUE RESOLUTION PROTOCOL

When an agent encounters a bug:

## Step 1 — Reproduce

Record:

- input;
- expected behavior;
- actual behavior;
- exact error;
- stage where it fails.

## Step 2 — Classify

Use one category:

```text
INGESTION
PARSING
DETECTION
NORMALIZATION
VALIDATION
TRACEABILITY
STORAGE
QUEUE
REPLAY
OUTPUT
API
UI
ML
DEPLOYMENT
```

## Step 3 — Find the owning module

Fix the problem in the component responsible for the behavior.

## Step 4 — Add a regression test

The bug should become a permanent test case.

## Step 5 — Fix minimally

Do not rewrite unrelated code.

## Step 6 — Re-run nearby tests

Then run the full relevant regression suite.

## Step 7 — Document remaining limitation

If the correct fix is blocked, report the blocker instead of implementing an unsafe workaround.

---

# 19. ACCEPTANCE TEST PHILOSOPHY

Every major capability needs an observable acceptance test.

Examples:

### Lossless

```text
input raw bytes
→ stored raw bytes
→ hash matches
```

### Parser

```text
sample
→ expected parsed fields
```

### Normalization

```text
vendor aliases
→ same canonical fields
```

### Traceability

```text
normalized field
→ parsed field
→ raw reference
```

### Plug-and-play

```text
new config
→ new source supported
without core-code change
```

### Failure

```text
bad input
→ raw preserved
→ failure/quarantine record
```

### Replay

```text
raw event
→ new parser
→ new normalized result
```

### Air gap

```text
Internet disabled
→ platform still starts and processes events
```

---

# 20. TEST DATA REQUIREMENTS

Maintain representative datasets for:

```text
Syslog
JSON
CEF
LEEF
Key-value
CSV
Unknown
Malformed
Schema drift
```

Source categories should include at least:

```text
Firewall
Router
IDS/IPS
VPN
Proxy/WAF
```

Tests must include:

- known-good records;
- missing fields;
- unknown fields;
- malformed records;
- duplicate records where relevant;
- vendor-specific custom fields;
- timestamp variations.

---

# 21. PERFORMANCE RULES

Agents must benchmark rather than guess.

Track:

- EPS;
- p50 latency;
- p95 latency;
- p99 latency;
- CPU;
- memory;
- queue depth;
- failure rate.

Optimize only after measurement.

Do not prematurely replace simple components with distributed infrastructure.

---

# 22. AIR-GAP RULES

Any feature marked core must work without Internet access.

External enrichment must be optional.

ML must support local execution.

Parser definitions must be local.

Docker images must be locally available.

No runtime dependency installation.

No mandatory cloud service.

---

# 23. AI/ML RULES

AI/ML is a downstream consumer of normalized data.

Preferred order:

```text
raw
→ parsed
→ normalized
→ validated
→ features
→ ML
```

Do not use an LLM for deterministic parsing.

Do not replace deterministic rules with ML when explainability is required.

Start with an explainable anomaly model before advanced models.

Any ML claim must include:

- dataset/source;
- preprocessing;
- features;
- train/test method;
- metric;
- limitations.

---

# 24. OBSERVABILITY REQUIREMENTS

Expose:

- events received;
- events processed;
- parser hits;
- format counts;
- partial events;
- parser failures;
- validation errors;
- dead-letter/quarantine count;
- output failures;
- throughput;
- latency;
- queue backlog.

Operational metrics must describe the platform itself.

---

# 25. RECOMMENDED MASTER FEATURE BACKLOG

## Phase A — Foundation

- [ ] Universal schema finalization
- [ ] shared event contracts
- [ ] raw event abstraction
- [ ] hash/integrity utilities
- [ ] filesystem raw store
- [ ] parser contract
- [ ] normalization contract

## Phase B — Core Pipeline

- [ ] file ingestion
- [ ] Syslog ingestion
- [ ] format detection
- [ ] parser registry
- [ ] parser engine
- [ ] normalization
- [ ] validation
- [ ] traceability
- [ ] dead-letter/quarantine
- [ ] replay

## Phase C — Plug-and-Play

- [ ] source registry
- [ ] parser registry UI/API
- [ ] parser test bench
- [ ] parser sample tests
- [ ] parser versioning
- [ ] unknown analyzer
- [ ] schema drift detection
- [ ] mapping management

## Phase D — Persistence / Search

- [ ] PostgreSQL or chosen metadata DB
- [ ] MinIO/raw object store
- [ ] OpenSearch
- [ ] normalized-event indexing
- [ ] event search/filtering
- [ ] integrity verification

## Phase E — Security Analytics

- [ ] detection rules
- [ ] alerts
- [ ] risk score
- [ ] risk factors
- [ ] MITRE ATT&CK mapping
- [ ] correlation
- [ ] incidents
- [ ] event timeline

## Phase F — Enrichment

- [ ] enrichment interface
- [ ] cache
- [ ] timeout/circuit breaker
- [ ] offline/local providers
- [ ] optional external providers

## Phase G — Outputs

- [ ] CEF
- [ ] Syslog
- [ ] JSON/JSONL
- [ ] Parquet
- [ ] SIEM adapter abstraction
- [ ] Data Lake adapter abstraction

## Phase H — Demo / Product

- [ ] dashboard integration
- [ ] live stream
- [ ] test lab
- [ ] reports
- [ ] operational metrics
- [ ] audit logging

## Phase I — AI/ML

- [ ] normalized feature extraction
- [ ] anomaly baseline
- [ ] anomaly score
- [ ] dashboard visualization
- [ ] benchmark and document model

## Phase J — Deployment

- [ ] Dockerfile
- [ ] Docker Compose
- [ ] local offline package
- [ ] air-gap test
- [ ] startup health checks
- [ ] deployment documentation

---

# 26. MULTI-AGENT IMPLEMENTATION ORDER

Agents should NOT all modify the same core files at once.

Recommended division:

## Agent A — Core Framework

Own:

- shared event types;
- schema;
- raw preservation;
- normalization;
- validation;
- traceability;
- replay orchestration.

## Agent B — Parser / Source Onboarding

Own:

- parser engine;
- format detection;
- parser registry;
- parser definitions;
- unknown analyzer;
- schema drift;
- mapping management;
- parser tests.

## Agent C — Infrastructure / Storage / Outputs

Own:

- storage abstractions;
- database;
- queue/buffer;
- object storage;
- OpenSearch;
- output adapters;
- metrics;
- Docker/air-gap packaging.

## Agent D — Reference Application

Own:

- controllers;
- routes;
- event explorer;
- parser/source management UI;
- quarantine/replay UI;
- detection/alert/incident UI;
- reports;
- live stream.

Authentication remains excluded.

## Shared Final Integration

All agents must integrate only through documented contracts.

---

# 27. AGENT CHECKPOINTS

An agent must stop and request review (or report a checkpoint) after:

- changing a shared schema;
- changing parser contracts;
- changing processing status semantics;
- changing raw storage semantics;
- changing replay behavior;
- changing normalized field names;
- introducing a new infrastructure dependency;
- changing the Docker topology;
- changing SIEM/Data Lake output contracts.

Do not silently make breaking contract changes.

---

# 28. PR / CHANGE REQUIREMENTS

Every meaningful change should contain:

```text
Problem
Solution
Files changed
Tests added/updated
How to run
Backward-compatibility impact
Known limitations
```

The agent must identify whether the change is:

- new feature;
- bug fix;
- refactor;
- performance improvement;
- documentation.

Avoid mixing unrelated categories in one change.

---

# 29. CODE QUALITY RULES

Prefer:

- readable names;
- short functions;
- explicit control flow;
- deterministic behavior;
- standard Node APIs where sufficient;
- simple abstractions;
- reusable services;
- centralized error handling.

Avoid:

- deeply nested abstractions;
- global mutable state unless justified;
- giant controllers;
- vendor-specific branches in core logic;
- hidden side effects;
- magic constants;
- duplicated parser logic.

---

# 30. DEFINITION OF COMPLETE SIH MVP

The MVP is complete when the following live demo works:

```text
1. Start platform offline
2. Submit logs from several formats/vendors
3. Preserve every raw event
4. Detect format
5. Select parser
6. Extract source fields
7. Normalize to universal schema
8. Preserve vendor-specific fields
9. Validate result
10. Show traceability
11. Search events uniformly
12. Show unsupported/malformed events safely quarantined
13. Add a new parser configuration
14. Test the parser
15. Activate it
16. Replay previous raw events
17. Deliver output for SIEM/Data Lake use
18. Show processing metrics
19. Optionally show deterministic alert/risk result
20. Demonstrate that no Internet is required
```

---

# 31. DEMO-FIRST PRIORITY

The final two-minute demo should prove the central SIH claim rather than showcase every feature.

Preferred narrative:

```text
Heterogeneous Logs
       ↓
One Collector
       ↓
Raw Preserved
       ↓
Format Detected
       ↓
Parser Selected
       ↓
Normalized Universal Event
       ↓
Vendor Fields Retained
       ↓
Field-Level Traceability
       ↓
Unified Search
       ↓
New Parser Added Without Core-Code Change
       ↓
Replay
       ↓
SIEM/Data Lake/Analytics Ready
```

Advanced features such as ATT&CK, enrichment, incidents, reports, and ML should support this story rather than obscure it.

---

# 32. FINAL INSTRUCTION TO ALL AI AGENTS

Build the system as a **coherent universal event normalization framework with a reference security-operations application around it**.

Do not turn it into a random collection of SIEM features.

The order of importance is:

```text
LOSSLESS DATA
      ↓
CORRECT PARSING
      ↓
UNIVERSAL NORMALIZATION
      ↓
TRACEABILITY
      ↓
PLUG-AND-PLAY ONBOARDING
      ↓
RELIABLE PROCESSING
      ↓
UNIFIED VISIBILITY
      ↓
SIEM / DATA LAKE OUTPUT
      ↓
SECURITY ANALYTICS
      ↓
AI/ML
```

When in doubt, prefer the smallest implementation that:

- satisfies the SIH requirement;
- preserves existing working behavior;
- is easy for a Node/Express developer to understand;
- is easy to test and debug;
- works offline;
- does not introduce unnecessary operational complexity.

**Never sacrifice losslessness, traceability, debuggability, or scope discipline merely to add another feature.**
