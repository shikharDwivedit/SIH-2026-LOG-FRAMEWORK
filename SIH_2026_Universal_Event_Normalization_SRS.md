# SIH 2026 — Universal Lossless Security Event Normalization Framework
## Software Requirements Specification (SRS)

**Purpose:** Define exactly what needs to be built for the SIH 2026 problem before implementation begins.

---

# 1. Project Overview

## 1.1 Problem

Perimeter network devices such as firewalls, routers, VPN gateways, IDS/IPS, proxies, WAFs, load balancers, and other security/operational systems generate logs in different formats.

Examples:

- Syslog
- CEF
- LEEF
- JSON
- CSV
- Key-value logs
- Vendor-specific text logs
- XML
- Structured/unstructured plain text

The project must provide a **universal event processing framework** that converts these heterogeneous events into a **common, standardized, lossless, analytics-ready representation**.

The framework must preserve the original event while extracting, normalizing, enriching, validating, and routing the event for SIEM, Data Lake, and AI/ML use cases.

---

# 2. Main Goal

Build a framework that accepts **any perimeter network device-generated log/event**, regardless of:

- Source
- Vendor
- Device type
- Technology
- Log format
- Message structure

and produces:

1. The **complete original/raw event**
2. **Parsed source-specific fields**
3. **Normalized/common fields**
4. **Metadata about the source and processing**
5. **Traceability between normalized data and the original event**
6. A representation suitable for **SIEM, Data Lake, cybersecurity analytics, and AI/ML**

The framework should also make onboarding a new log source fast and configuration-driven rather than requiring large amounts of custom parser code.

---

# 3. Core Requirements

The project MUST provide the following capabilities.

## 3.1 Lossless Raw Event Preservation

The original event must never be lost.

For every processed event, retain:

- Original raw message
- Original encoding/content where practical
- Original timestamp if present
- Original source/device information
- Original event identifier if present
- Original vendor-specific fields
- Unrecognized/unknown fields

### Requirement

**No normalized transformation may overwrite or destroy the source event.**

The normalized event and raw event must coexist.

---

# 4. Universal Event Schema

A central part of the project is a **Universal Event Schema**.

The schema should contain common fields that can represent events from many vendors and device types.

## 4.1 Recommended Logical Sections

### A. Event Identity

- `event_id`
- `event_type`
- `event_category`
- `event_name`
- `event_action`
- `event_outcome`
- `event_severity`

### B. Time

- `event_time`
- `ingest_time`
- `processing_time`
- `timezone`

### C. Source

- `source_ip`
- `source_port`
- `source_hostname`
- `source_device`
- `source_device_type`
- `source_vendor`
- `source_product`
- `source_version`
- `source_location`

### D. Destination

- `destination_ip`
- `destination_port`
- `destination_hostname`
- `destination_device`
- `destination_location`

### E. Network

- `protocol`
- `transport_protocol`
- `application_protocol`
- `network_direction`
- `interface`
- `zone`
- `network_segment`

### F. Identity / User

- `user_id`
- `username`
- `user_domain`
- `session_id`
- `source_identity`
- `destination_identity`

### G. Security

- `threat_type`
- `threat_name`
- `attack_type`
- `signature`
- `rule_id`
- `policy_id`
- `malware_name`
- `indicator`
- `risk_score`

### H. Vendor-Specific Data

- `vendor_fields`
- `device_specific_fields`
- `original_attributes`

### I. Processing Metadata

- `parser_name`
- `parser_version`
- `schema_version`
- `normalization_status`
- `processing_status`
- `processing_errors`

### J. Traceability

- `raw_event_id`
- `source_event_id`
- `parser_version`
- `transformation_id`
- `original_field_mapping`

---

# 5. Event Processing Pipeline

The system should follow a clear pipeline.

```text
INPUT LOG
   |
   v
[Ingestion]
   |
   v
[Raw Event Preservation]
   |
   v
[Format Detection]
   |
   v
[Parsing]
   |
   v
[Field Extraction]
   |
   v
[Normalization]
   |
   v
[Validation]
   |
   v
[Enrichment]
   |
   v
[Traceability Metadata]
   |
   v
[Standardized Event]
   |
   +------> SIEM
   |
   +------> Data Lake
   |
   +------> Analytics / AI-ML
```

---

# 6. Functional Requirements

## FR-01: Event Ingestion

The system shall accept events from multiple sources.

### Minimum demonstration inputs

The prototype should support several representative formats, such as:

- Syslog
- JSON
- CEF
- Plain-text/vendor-specific log

### Possible ingestion methods

- File input
- TCP
- UDP
- HTTP
- REST API
- Message queue/stream

For the SIH prototype, file-based ingestion plus at least one network ingestion mechanism is sufficient for a strong demonstration.

---

## FR-02: Source Identification

The framework shall identify:

- Vendor
- Product/device
- Device type
- Log format
- Parser required

Source identification may use:

- Configuration
- IP/source metadata
- Port
- Header/signature
- Message pattern
- Format detection

---

## FR-03: Format Detection

The system shall detect or determine the incoming event format.

Examples:

```text
JSON
CEF
Syslog
CSV
Plain Text
Vendor Specific
```

The system should also allow explicit configuration where automatic detection is not reliable.

---

## FR-04: Parsing

The framework shall parse source-specific event structures.

Parsing should extract:

- Standard recognizable fields
- Vendor-specific fields
- Nested fields
- Key-value pairs
- Message attributes
- Embedded structured data

---

# 7. Configurable Parser Framework

This is one of the most important project components.

The framework should avoid writing a completely new parser implementation for every source.

## 7.1 Parser Definition

A parser should preferably be represented using configuration/rules.

Example conceptual definition:

```yaml
parser:
  name: firewall_vendor_a
  version: 1.0

match:
  vendor: VendorA
  product: FirewallX

extract:
  src_ip: "source.ip"
  src_port: "source.port"
  dst_ip: "destination.ip"
  dst_port: "destination.port"

normalize:
  action: "event.action"
  severity: "event.severity"
```

The exact implementation can differ.

## 7.2 Parser Requirements

A parser framework should support:

- Parser registration
- Parser versioning
- Parser configuration
- Field extraction
- Field mapping
- Regex/pattern rules
- Key-value extraction
- Nested JSON extraction
- Default values
- Validation
- Error handling
- Testing
- Reload/update without rebuilding the whole system where practical

---

# 8. Common Taxonomy / Normalization

All events should be mapped to a common taxonomy.

Example:

```text
Vendor field                 Universal field
------------------------------------------------
src                           source.ip
dst                           destination.ip
src_port                      source.port
dst_port                      destination.port
act                           event.action
severity                      event.severity
proto                         network.protocol
usr                           user.name
```

Normalization must handle different vendor naming conventions.

## Required behavior

The system should:

- Map equivalent concepts to one canonical field
- Convert values to common types
- Normalize timestamps
- Normalize IP/address representations
- Normalize severity values
- Normalize event categories/actions where possible

---

# 9. Lossless Representation

The output should contain both normalized data and source-specific information.

Recommended conceptual structure:

```json
{
  "event": {
    "id": "12345",
    "category": "network",
    "action": "blocked"
  },

  "source": {
    "ip": "10.0.0.5",
    "vendor": "VendorA",
    "product": "FirewallX"
  },

  "network": {
    "protocol": "TCP"
  },

  "raw": {
    "message": "ORIGINAL LOG HERE"
  },

  "vendor": {
    "custom_field_1": "value",
    "custom_field_2": "value"
  },

  "processing": {
    "parser": "firewall_vendor_a",
    "parser_version": "1.0",
    "schema_version": "1.0"
  },

  "trace": {
    "raw_event_id": "raw-123",
    "transformation_id": "transform-456"
  }
}
```

This is a conceptual example, not a mandatory exact JSON format.

---

# 10. Traceability

Every normalized event must be traceable back to the original event.

## Minimum traceability requirements

The system shall make it possible to determine:

- Which raw event produced this normalized event?
- Which parser processed it?
- Which parser version was used?
- Which source generated it?
- Which fields were mapped?
- Which transformation occurred?
- Whether any fields failed normalization

A field mapping mechanism is strongly recommended.

Example:

```text
raw.src_ip
       |
       +----> source.ip

raw.dst_ip
       |
       +----> destination.ip
```

---

# 11. Unknown and Unmapped Fields

The framework MUST NOT simply discard fields that are not part of the common schema.

Unknown fields should be preserved under a section such as:

```text
vendor_fields
original_attributes
extensions
```

This is critical for the **lossless** requirement.

---

# 12. Error Handling

The system must handle malformed and unexpected events safely.

Possible cases:

- Invalid JSON
- Missing mandatory fields
- Incorrect timestamp
- Unknown vendor
- Unsupported format
- Parser failure
- Invalid field type
- Partial event
- Duplicate event

The system should record processing errors without deleting the original event.

Recommended statuses:

```text
PROCESSED
PARTIALLY_PROCESSED
UNSUPPORTED
PARSER_ERROR
VALIDATION_ERROR
```

---

# 13. Unknown Source Handling

When a source has no existing parser:

1. Preserve the raw event.
2. Record source metadata.
3. Identify the format if possible.
4. Mark the event as unnormalized/partially normalized.
5. Store unknown fields.
6. Generate useful diagnostics for onboarding a parser.

This prevents data loss and supports future onboarding.

---

# 14. Plug-and-Play Source Onboarding

Adding a new log source should be easy.

## New source onboarding flow

```text
New Device
    |
    v
Create Source Definition
    |
    v
Create Parser/Mapping Rules
    |
    v
Test Against Sample Logs
    |
    v
Validate Output
    |
    v
Register Parser
    |
    v
Start Processing
```

## The framework should minimize:

- Custom code
- Manual changes to the core engine
- Duplicate parser logic
- Deployment changes for every new source

---

# 15. Parser Testing Framework

A parser should be testable independently.

Each parser should have:

- Sample input logs
- Expected parsed output
- Expected normalized output
- Error cases

Recommended test process:

```text
Input Log
   |
   v
Parser
   |
   v
Expected Output
   |
   v
Comparison
   |
   v
PASS / FAIL
```

This will make the framework easier to maintain and demonstrate.

---

# 16. Validation

The normalized event must be validated.

Validation should check:

- Required fields
- Data types
- Timestamp validity
- IP format
- Port range
- Severity values
- Enum/category validity
- Schema version

Validation errors should be recorded rather than silently dropping the event.

---

# 17. Enrichment

The framework may provide optional enrichment capabilities.

Examples:

- GeoIP
- Asset information
- Threat intelligence
- Hostname resolution
- Network zone
- Organization/department
- Risk score

Enrichment must not modify or destroy the original event.

For the initial SIH implementation, enrichment should be modular and optional rather than the primary focus.

---

# 18. Deduplication

The system should optionally detect duplicate events.

Possible deduplication key:

```text
hash(raw_event)
```

or a configurable combination of:

```text
source + timestamp + event content + event id
```

Deduplication must be configurable because duplicate events may sometimes be legitimate.

---

# 19. Event Fingerprinting

The framework should support event fingerprints/hashes for:

- Traceability
- Duplicate detection
- Integrity verification
- Auditability

Recommended metadata:

```text
raw_event_hash
normalized_event_hash
```

---

# 20. Schema Versioning

The universal schema must be versioned.

Example:

```text
schema_version = 1.0
```

Changes to the schema should not silently break old events or parsers.

---

# 21. Parser Versioning

Every processed event should identify:

```text
parser_name
parser_version
```

This makes historical events reproducible and auditable.

---

# 22. SIEM Integration

The output must be suitable for SIEM ingestion.

The framework should provide an output interface that can send normalized events to a SIEM through configurable mechanisms.

Possible outputs:

- JSON
- Syslog
- HTTP/REST
- Kafka/message queue
- File
- SIEM-specific connector

The architecture should separate normalization from output connectors.

```text
Normalizer
    |
    +--> SIEM Connector
    +--> Data Lake Connector
    +--> File Connector
    +--> API Connector
```

---

# 23. Data Lake Integration

The normalized events should also be suitable for storage in a Data Lake.

Requirements:

- Structured representation
- Stable schema
- Event metadata
- Raw event retention
- Query-friendly fields
- Partition-friendly timestamps where applicable

---

# 24. AI/ML Readiness

The output must be suitable for analytics and future AI/ML pipelines.

The normalized data should make it easier to perform:

- Anomaly detection
- Threat detection
- Event clustering
- Behavioral analytics
- Classification
- Correlation
- Time-series analysis

The framework itself does NOT need to implement a complete AI/ML model for the core SIH requirement.

It should primarily make high-quality, consistent data available for those systems.

---

# 25. Unified Visibility

Different perimeter devices should produce events that can be queried consistently.

Example:

```text
Firewall A
Firewall B
Router
VPN
IDS
Proxy
WAF
   |
   v
Universal Event Schema
   |
   v
Unified Analytics
```

A user should not need to understand every vendor-specific field to perform common queries.

---

# 26. Processing Modes

The architecture should support at least:

## Batch Mode

Process:

```text
log file -> events -> normalized output
```

Useful for:

- Testing
- Demonstrations
- Historical data

## Streaming/Real-Time Mode

Process:

```text
device -> ingestion -> parser -> normalization -> output
```

Useful for:

- Live SIEM integration
- Real-time monitoring

For the SIH prototype, implementing both batch and a simple streaming path would significantly strengthen the demonstration.

---

# 27. Performance Requirements

The framework should be designed for high event volumes.

Measure at least:

- Events per second
- Average processing latency
- CPU usage
- Memory usage
- Failure rate

The benchmark should compare performance across representative log types.

The exact target throughput can be selected during implementation based on the available demo hardware.

---

# 28. Scalability

The design should allow:

- Multiple parser workers
- Parallel event processing
- Multiple input sources
- Multiple output destinations
- Horizontal scaling in future

A modular architecture is preferred over a monolithic parser.

---

# 29. Air-Gapped Deployment

This is an explicit SIH requirement.

The solution must be deployable without Internet access.

Therefore:

- No mandatory external API dependency
- No cloud-only service dependency
- Dependencies must be installable offline
- Parser definitions must be locally available
- Configuration must work without Internet access
- Documentation must describe offline installation

The demo environment should ideally demonstrate deployment with networking isolated from the Internet.

---

# 30. Containerization

The solution may be packaged as containers.

Containerization is strongly recommended.

Possible components:

```text
ingestion
parser/normalizer
API
storage
UI
message broker
```

For a prototype, these can be consolidated where appropriate.

Example conceptual deployment:

```text
Docker / Podman
       |
       +---- Event Processor
       +---- API
       +---- Storage
       +---- Optional UI
```

The solution should remain platform independent as far as practical.

---

# 31. Configuration Management

Configuration should be externalized from core source code.

Configuration should include:

- Source definitions
- Parser definitions
- Field mappings
- Schema version
- Output destinations
- Processing options
- Logging settings
- Validation settings

A configuration-driven framework is preferred.

---

# 32. API / Control Interface

A lightweight API is recommended.

Possible API functions:

```text
POST /events
GET  /events/{id}
GET  /schema
GET  /parsers
POST /parsers
GET  /health
GET  /metrics
```

The exact endpoints can be changed during implementation.

The purpose is to allow the system to be inspected and integrated programmatically.

---

# 33. Monitoring and Observability

The framework should expose operational metrics.

Recommended metrics:

- Events received
- Events processed
- Events failed
- Events partially parsed
- Events dropped
- Events per second
- Parser errors
- Validation errors
- Processing latency
- Queue/backlog size

A health endpoint is recommended.

---

# 34. Audit Logging

The framework should maintain operational logs for:

- Parser changes
- Configuration changes
- Errors
- Processing failures
- Source registration
- Schema changes

Audit logs should not contain sensitive data unnecessarily.

---

# 35. Security Requirements

Because this is a cybersecurity-oriented system, security must be built into the framework.

The solution should consider:

- Input validation
- Secure API access
- Authentication where applicable
- Authorization for administrative functions
- Secure configuration
- Container security
- Dependency security
- Log injection protection
- Resource exhaustion protection
- Safe handling of maliciously crafted logs

The original event must be treated as untrusted input.

---

# 36. Data Integrity

The system should protect event integrity through:

- Raw event retention
- Event IDs
- Hash/fingerprint
- Transformation metadata
- Versioned schema
- Parser version
- Processing timestamps

---

# 37. Storage Requirements

The prototype needs a place to store or inspect events.

Possible choices:

- PostgreSQL
- Elasticsearch/OpenSearch
- MongoDB
- SQLite for a very small prototype
- Object storage/Data Lake format
- File/JSON storage for a minimal demo

A practical SIH architecture may use:

```text
Raw Event Store
+
Normalized Event Store
```

while maintaining a relationship between them.

---

# 38. Search and Query

A basic interface for searching normalized events is recommended.

Useful filters:

- Time range
- Source IP
- Destination IP
- Vendor
- Device type
- Event category
- Action
- Severity
- User
- Event ID
- Parser
- Processing status

This directly supports the unified visibility requirement.

---

# 39. Demonstration UI

A simple web dashboard is highly recommended for the SIH demo.

The dashboard should show:

### Overview

- Total events
- Processed events
- Failed events
- Events by source
- Events by severity

### Event Explorer

Show:

- Raw event
- Parsed fields
- Normalized event
- Vendor-specific fields
- Processing metadata
- Traceability

### Parser View

Show:

- Registered parsers
- Parser versions
- Supported sources

### Pipeline View

Show:

```text
Received
  ->
Parsed
  ->
Normalized
  ->
Validated
  ->
Delivered
```

The UI does not need to be complex.

---

# 40. Input Source Demonstration

For a strong SIH demo, create sample logs from several source categories.

Recommended minimum:

1. Firewall
2. Router
3. IDS/IPS
4. VPN
5. Proxy/WAF

Use multiple formats/vendors.

The goal is to prove that heterogeneous inputs become a common representation.

---

# 41. Output Demonstration

For each sample event, demonstrate:

```text
Original Event
      |
      v
Parser
      |
      v
Extracted Fields
      |
      v
Normalized Universal Event
      |
      v
Traceability
      |
      +----> SIEM-style JSON
      +----> Data Lake record
```

---

# 42. Key Differentiator: Lossless + Normalized

The project must avoid the common trade-off where normalization removes vendor-specific information.

The framework should achieve:

```text
                 +--------------------+
                 |    RAW EVENT       |
                 | COMPLETE / LOSSLESS |
                 +---------+----------+
                           |
                           v
                    Parse + Extract
                           |
                           v
                 +--------------------+
                 | UNIVERSAL EVENT    |
                 | STANDARDIZED       |
                 +---------+----------+
                           |
                           +----> Vendor Extensions
                           |
                           +----> Traceability
                           |
                           +----> SIEM / Data Lake
```

---

# 43. Suggested High-Level Architecture

```text
                PERIMETER DEVICES
                       |
       +---------------+---------------+
       |               |               |
    Firewall         Router           IDS
       |               |               |
       +---------------+---------------+
                       |
                       v
                [INGESTION LAYER]
                       |
                       v
             [RAW EVENT PRESERVER]
                       |
                       v
             [FORMAT DETECTION]
                       |
                       v
                 [PARSER ENGINE]
                       |
                       v
              [FIELD EXTRACTION]
                       |
                       v
              [NORMALIZATION]
                       |
                       v
                 [VALIDATION]
                       |
                       v
                 [ENRICHMENT]
                       |
                       v
              [TRACEABILITY]
                       |
            +----------+----------+
            |          |          |
            v          v          v
          [SIEM]   [DATA LAKE] [API/UI]
                                  |
                                  v
                              [ANALYTICS]
```

---

# 44. Major Software Modules to Build

These are the main components the implementation should eventually contain.

## Module 1 — Ingestion Engine

Responsible for:

- Receiving events
- Reading files/streams
- Attaching source metadata
- Passing events to processing pipeline

## Module 2 — Raw Event Store

Responsible for:

- Exact raw event preservation
- Event IDs
- Hashes
- Retrieval

## Module 3 — Source Registry

Responsible for:

- Source definitions
- Vendor information
- Device types
- Format association
- Parser association

## Module 4 — Format Detector

Responsible for:

- Detecting format
- Selecting parser family

## Module 5 — Parser Engine

Responsible for:

- Parsing
- Extraction
- Vendor-specific rules

## Module 6 — Universal Normalizer

Responsible for:

- Field mapping
- Canonical data types
- Common taxonomy

## Module 7 — Schema Manager

Responsible for:

- Universal schema
- Schema validation
- Schema versions

## Module 8 — Traceability Engine

Responsible for:

- Raw-to-normalized relationship
- Field mappings
- Transformation metadata

## Module 9 — Validation Engine

Responsible for:

- Schema validation
- Type validation
- Data-quality checks

## Module 10 — Optional Enrichment Engine

Responsible for:

- Context enrichment
- Threat/asset metadata

## Module 11 — Output Connectors

Responsible for:

- SIEM
- Data Lake
- API
- File/stream output

## Module 12 — Parser Onboarding System

Responsible for:

- Adding parser definitions
- Testing parsers
- Versioning
- Managing source mappings

## Module 13 — Storage Layer

Responsible for:

- Raw events
- Normalized events
- Metadata
- Querying

## Module 14 — API

Responsible for:

- Event access
- Parser management
- Schema access
- Health
- Metrics

## Module 15 — Monitoring

Responsible for:

- Metrics
- Errors
- Processing status
- System health

## Module 16 — Web Dashboard

Responsible for:

- Unified visibility
- Event exploration
- Source visibility
- Parser status
- Processing statistics

## Module 17 — Deployment Layer

Responsible for:

- Docker/Podman
- Offline deployment
- Configuration
- Reproducible installation

---

# 45. Non-Functional Requirements

## NFR-01 — Reliability

A parser failure must not cause loss of the original event.

## NFR-02 — Extensibility

Adding a new source should require minimal changes to the core framework.

## NFR-03 — Maintainability

Parser logic should be modular and independently testable.

## NFR-04 — Performance

The framework should process events efficiently and support parallel processing.

## NFR-05 — Portability

The framework should run on common Linux environments and preferably inside containers.

## NFR-06 — Offline Operation

All core functionality must operate in an air-gapped environment.

## NFR-07 — Observability

Processing statistics and failures must be measurable.

## NFR-08 — Security

The framework must safely handle untrusted input.

## NFR-09 — Data Integrity

The source event must remain recoverable after processing.

## NFR-10 — Version Compatibility

Schema and parser versions must be identifiable and manageable.

---

# 46. Minimum Viable Product (MVP)

The first working version should include:

1. Event ingestion
2. Raw event preservation
3. At least 3–5 different log sources
4. Multiple input formats
5. Format detection
6. Configurable parsing
7. Universal event schema
8. Field normalization
9. Vendor-specific field preservation
10. Traceability
11. Validation
12. Error handling
13. JSON output
14. Basic storage
15. Basic event search
16. Basic dashboard
17. Docker deployment
18. Offline deployment instructions
19. Automated parser tests
20. Sample datasets

---

# 47. Strong SIH Version

After the MVP, improve the project with:

- Streaming ingestion
- Multiple output connectors
- Parser auto-discovery
- Schema version management
- Enrichment plugins
- Event fingerprinting
- Deduplication
- Metrics
- API
- Better dashboard
- Performance benchmarks
- Parser onboarding UI
- Hot-reloadable parser configurations
- Message queue for scalable processing

---

# 48. Recommended Demo Scenario

The final demo should tell one simple story.

### Step 1

Send logs from several simulated perimeter devices.

### Step 2

Show that the inputs are different.

Example:

```text
Firewall -> CEF
Router   -> Syslog
IDS      -> JSON
VPN      -> Vendor text
WAF      -> Key-value
```

### Step 3

Show automatic/source-based parser selection.

### Step 4

Show the raw event remaining unchanged.

### Step 5

Show extracted vendor fields.

### Step 6

Show all events converted to the same universal schema.

### Step 7

Show field traceability.

### Step 8

Search across all devices using a common field.

Example:

```text
Find all events where destination.port = 443
```

### Step 9

Show the normalized events being routed to a SIEM/Data Lake-style output.

### Step 10

Show adding a new parser with configuration rather than rewriting the engine.

This should directly demonstrate the SIH evaluation points.

---

# 49. Evaluation Mapping

| SIH Requirement | Project Component |
|---|---|
| Preserve raw data | Raw Event Store |
| Parse source attributes | Parser Engine |
| Common taxonomy | Universal Schema + Normalizer |
| Traceability | Traceability Engine |
| Plug-and-play sources | Parser/Source Registry |
| Unified visibility | Dashboard + Query |
| SIEM integration | Output Connectors |
| Data Lake integration | Data Lake Connector |
| AI/ML readiness | Structured normalized events |
| Reduced parser effort | Configuration-driven parser framework |
| Air-gapped deployment | Offline/container deployment |
| Platform independence | Containers |

---

# 50. Deliverables Required by SIH

## 50.1 Source Code

Must include:

- Full source code
- Parser definitions
- Sample logs
- Configuration
- Tests
- Docker/Podman files
- Setup scripts
- Documentation

Repository should be clean and runnable.

---

## 50.2 README

The README must explain:

1. What the project does
2. Architecture overview
3. Requirements
4. Installation
5. Offline installation
6. Container deployment
7. Configuration
8. How to add a parser
9. How to run sample logs
10. How to access the UI/API
11. How to run tests
12. Example input
13. Example normalized output
14. Troubleshooting

---

## 50.3 Architecture Document — Maximum 2 Pages

Include only the most important architecture information:

### Page 1

- Problem
- Solution
- Architecture diagram
- Main components
- Data flow

### Page 2

- Universal schema
- Lossless strategy
- Traceability
- Parser onboarding
- SIEM/Data Lake integration
- Air-gapped/container deployment

---

## 50.4 Demo Video — Maximum 2 Minutes

The video should prioritize:

```text
Different Logs
      ->
One Framework
      ->
Universal Representation
      ->
Traceability
      ->
SIEM/Data Lake Ready
      ->
Easy New-Parser Onboarding
```

Avoid spending most of the video on source code.

---

## 50.5 Technical Presentation — Maximum 5 Slides

Recommended slide structure:

### Slide 1 — Problem + Solution

- Problem with heterogeneous logs
- Proposed universal framework
- Key differentiator

### Slide 2 — Architecture

- End-to-end pipeline
- Components
- Data flow

### Slide 3 — Universal Event Model

- Raw event
- Normalized fields
- Vendor extensions
- Traceability

### Slide 4 — Innovation + Benefits

- Lossless normalization
- Plug-and-play parser onboarding
- SIEM/Data Lake integration
- Air-gapped/container support
- Reduced parser effort

### Slide 5 — Demo + Results

- Supported sources
- Performance
- Example transformation
- Deployment
- Future scalability

---

# 51. Project Success Criteria

The project should be considered successful when it can demonstrate all of the following:

- Different vendor/device logs enter the same framework.
- Original events remain fully preserved.
- Source-specific fields are extracted.
- Common fields are normalized.
- Vendor-specific fields are not lost.
- Every normalized event can be traced to its source event.
- New parsers can be added with minimal effort.
- Events can be searched through a unified model.
- Output can be delivered to SIEM/Data Lake-compatible interfaces.
- The data can directly feed analytics/AI/ML pipelines.
- The system operates without Internet access.
- The system can run in containers.
- The whole project can be reproduced from the repository.

---

# 52. Explicit Out-of-Scope Items for the First Version

To prevent the project from becoming too large, the following should NOT be treated as mandatory core requirements:

- Building a complete commercial SIEM
- Building a full Data Lake platform
- Building a production-grade threat intelligence platform
- Building a sophisticated AI/ML detection model
- Supporting every vendor on Earth
- Building dozens of proprietary connectors
- Implementing full-scale distributed cloud infrastructure

The core deliverable is the **universal event normalization and processing framework**.

---

# 53. Final Build Breakdown

The entire project can be thought of as these 10 major building blocks:

```text
1. INGEST
   Receive logs/events.

2. PRESERVE
   Store the complete raw event.

3. DETECT
   Identify source/format/parser.

4. PARSE
   Extract source-specific information.

5. NORMALIZE
   Convert fields to universal taxonomy.

6. EXTEND
   Preserve vendor-specific fields.

7. TRACE
   Connect normalized data back to raw data.

8. VALIDATE
   Verify schema/data quality.

9. DELIVER
   Send to SIEM/Data Lake/API/storage.

10. VISUALIZE
    Provide unified event visibility and operational metrics.
```

These ten blocks form the core implementation scope.

---

# 54. Recommended Initial Technology Direction

The exact technology stack can be selected later, but a practical prototype could use:

```text
Backend        : Python / Java / Go
API             : FastAPI / Spring Boot / equivalent
Schema          : JSON / JSON Schema
Parser Rules    : YAML / JSON configuration
Storage         : PostgreSQL + object/file store
Streaming       : Kafka / Redpanda / lightweight queue
Frontend        : React / equivalent
Container       : Docker / Podman
Testing         : Pytest / JUnit / equivalent
```

This section is guidance, not a mandatory SIH requirement.

---

# 55. Final SRS Statement

The system shall provide a **universal, lossless, extensible, configurable, and platform-independent security event processing framework** capable of ingesting heterogeneous perimeter-device logs, preserving the original events, extracting source-specific attributes, normalizing them into a common event taxonomy, retaining vendor-specific information, maintaining end-to-end traceability, and delivering analytics-ready events to SIEM, Data Lake, and other downstream systems.

The framework shall support plug-and-play onboarding of new log sources, minimize parser development effort, provide unified visibility, and operate in an air-gapped/containerized environment.

This SRS defines the project scope and requirements. **Implementation, technology selection, database design, API design, parser grammar, UI design, and coding should be decided after this specification is agreed upon.**
