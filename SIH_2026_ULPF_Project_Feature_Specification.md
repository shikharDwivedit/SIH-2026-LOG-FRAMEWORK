# SIH 2026 — Universal Log Pre-processing Framework (ULPF)
## Complete Feature & Implementation Specification

## 1. Project Definition

Build a **Universal Log Pre-processing Framework (ULPF)** that can ingest heterogeneous enterprise/security events, preserve the original data without information loss, parse source-specific attributes, normalize them into a common taxonomy, maintain traceability, and expose the resulting data to SIEM, Data Lake, search, correlation, threat hunting, and AI/ML analytics.

The implementation will **focus primarily on perimeter/network security devices**, while keeping the framework extensible to the broader source categories named in the SIH problem statement.

## 2. SIH Requirement Mapping

The framework must address:

- Preserve complete raw event data without information loss.
- Extract and parse source-specific attributes.
- Normalize fields into a common event taxonomy.
- Maintain traceability between normalized and original events.
- Provide plug-and-play onboarding of new log sources.
- Provide unified visibility across enterprise environments.
- Provide efficient SIEM and Data Lake integration.
- Produce AI/ML-ready security and operational analytics.
- Reduce parser development effort.
- Support air-gapped deployment.
- Support containerized/platform-independent deployment.
- Be scalable and suitable for Big Data environments handling billions of events per day.

## 3. Source Scope

### Primary implementation focus
- Firewalls
- IDS / IPS
- Routers and security-relevant switches
- VPN gateways
- WAF
- Proxies
- Load balancers
- Network security/monitoring appliances

### Broader framework compatibility
- Servers
- Operating systems
- Applications
- Databases
- Cloud services
- Containers
- Endpoint security tools
- Identity and Access Management systems
- IoT devices
- Other hardware/software systems

**Scope principle:** build a universal framework and demonstrate it strongly with representative network/perimeter sources rather than trying to implement every source category for the SIH demo.

## 4. Supported Log/Event Formats

Support the following format families:

- Syslog
- JSON
- XML
- CSV
- CEF
- LEEF
- Key-value
- Delimited records
- Plain-text logs
- Regex/pattern-based vendor logs
- Proprietary/vendor-specific formats
- Application-specific schemas

The architecture must allow additional formats without changing the overall processing pipeline.

## 5. Ingestion

### Live ingestion
- Syslog UDP
- Syslog TCP
- Syslog TLS where applicable
- HTTP/REST

### File ingestion
- Historical log files
- Rotated logs
- Active/tailing log files
- Batch imports
- Large files through streaming

### Future extensions
- Kafka/Redpanda
- Message queues
- Object storage
- NetFlow/IPFIX
- Other streaming sources

## 6. Source Identification

Determine, where possible:

- Source ID
- Source IP
- Hostname
- Vendor
- Product
- Device type
- Transport
- Format
- Parser

Possible signals:
- configured metadata
- source address
- hostname
- port/transport
- message signature
- format detection
- parser fingerprint

## 7. Automatic Format Detection

Detection chain:

```text
Incoming Event
      ↓
Explicit source configuration?
      ↓ no
Format detection
      ↓
JSON / CEF / LEEF / Syslog / Key-value / Plain text
      ↓
Parser selection
```

Automatic detection is a helper, not a single point of failure.

Unknown input must fall back to:

```text
Raw preserved
+
UNPARSED / UNKNOWN
```

## 8. Lossless Raw Event Preservation

For every accepted event preserve:

- Original event content/bytes
- Event ID
- Raw hash
- Ingestion timestamp
- Source information
- Transport metadata
- File/reference metadata where applicable

Conceptually:

```text
RAW EVENT
   ↓
immutable source of truth

PARSED EVENT
   ↓
derived representation

NORMALIZED EVENT
   ↓
derived representation
```

Prefer:

```text
received bytes
   ↓
hash
   ↓
durable storage
   ↓
decode/parse
```

Do not mutate the original content before hashing if the system claims exact byte preservation.

## 9. Universal Event Schema

Recommended logical sections:

```text
event_id
schema_version
raw_ref
source
event
network
identity
threat
extensions
trace
processing
```

Example:

```json
{
  "event_id": "uuid",
  "schema_version": "1.0",
  "raw_ref": {
    "raw_event_id": "uuid",
    "hash": "sha256",
    "ingested_at": "timestamp"
  },
  "source": {
    "vendor": "",
    "product": "",
    "device_type": "",
    "device_ip": "",
    "hostname": "",
    "log_format": "",
    "transport": ""
  },
  "event": {
    "timestamp": "",
    "category": "",
    "type": "",
    "action": "",
    "outcome": "",
    "severity": "",
    "message": ""
  },
  "network": {
    "source_ip": "",
    "source_port": null,
    "destination_ip": "",
    "destination_port": null,
    "protocol": "",
    "direction": ""
  },
  "identity": {},
  "threat": {},
  "extensions": {
    "vendor_specific": {}
  },
  "trace": {
    "parser_name": "",
    "parser_version": "",
    "transformation_id": ""
  },
  "processing": {
    "status": "",
    "errors": []
  }
}
```

Do not create hundreds of fields without demonstrated source requirements.

## 10. Source-Specific Parsing

The parser extracts what the source actually says.

Example:

```text
srcip=10.0.0.5
dstip=8.8.8.8
action=deny
policy=123
```

becomes structured parsed fields.

The parser should not own the entire universal taxonomy.

## 11. Configuration-Driven Parser Framework

Support declarative parser definitions using:

- Regex
- Key-value mappings
- Delimiters
- JSON path/JMESPath-style extraction
- XML path extraction
- Aliases
- Type conversion
- Conditional mappings
- Static/default fields

Example:

```yaml
name: fortigate
version: 1.0

match:
  vendor: fortinet
  format: key-value

extract:
  source.ip: srcip
  destination.ip: dstip
  event.action: action
  network.protocol: proto
```

## 12. Parser Registry

Maintain:

- Parser ID/name
- Vendor
- Product
- Supported format
- Version
- Configuration
- Status
- Test result
- Activation status

## 13. Plug-and-Play Source Onboarding

Workflow:

```text
New source
    ↓
Register source
    ↓
Identify format/vendor
    ↓
Create/select parser definition
    ↓
Add sample logs
    ↓
Test parser
    ↓
Validate normalized result
    ↓
Activate
    ↓
Process new events
```

Adding a new vendor should normally not require changes to core ingestion, queue, processing pipeline, normalization, storage, or output code.

## 14. Unknown Sources

```text
Unknown source
      ↓
Accept event
      ↓
Preserve raw
      ↓
Try format detection
      ↓
UNPARSED / UNKNOWN
      ↓
Diagnostics
      ↓
Parser created later
      ↓
Replay
      ↓
Normalized
```

## 15. Vendor-Specific / Unmapped Fields

Never discard unmapped fields.

Example:

```json
{
  "extensions": {
    "vendor_specific": {
      "policy_id": "ABC",
      "session_uuid": "123",
      "custom_field": "value"
    }
  }
}
```

Important principle:

> Preserve everything; index only what is necessary.

## 16. Normalization Engine

Convert source-specific concepts into canonical concepts.

Example:

```text
src
srcip
source_address
source_ip
      ↓
source.ip
```

Keep responsibilities separate:

```text
Parser:
"What did the source say?"

Normalizer:
"What does that mean in our universal model?"
```

## 17. Context-Aware Risk

Do not assume global severity or security classifications are universally abnormal.

Example:

```text
SSH
```

may be normal for admin infrastructure and suspicious for a workstation.

Risk/abnormality should support:

- Source context
- Asset context
- Environment
- Historical behavior
- Frequency
- Configurable policy

## 18. Validation

Validate:

- Required fields
- Data types
- IP addresses
- Ports
- Timestamps
- Severity
- Categories
- Enum values
- Schema version
- Structural correctness

Validation failure must not delete raw data.

Possible statuses:

```text
VALID
PARTIALLY_VALID
INVALID
```

## 19. Traceability

Every normalized event should be traceable to its raw source.

Minimum metadata:

```text
event_id
raw_event_id
raw_hash
parser_name
parser_version
schema_version
transformation_id
```

Prefer field lineage:

```text
raw.srcip
    ↓
parsed.srcip
    ↓
normalized.network.source_ip
```

## 20. Parser and Schema Versioning

Every processed event records:

```text
parser_version
schema_version
```

Version changes must not silently destroy historical information. Raw data remains immutable and replayable.

## 21. Failure Handling

Explicitly handle:

- Malformed logs
- Unsupported formats
- Unknown vendors
- Parser failures
- Validation failures
- Storage failures
- Queue failures
- Output failures

No failure may silently discard accepted data.

## 22. Quarantine / Dead-Letter

```text
Event
 ↓
Processing failure
 ↓
Quarantine / Dead Letter
 +
Raw event preserved
 +
Failure reason
```

Record error code, stage, parser/version, retry count, and timestamp.

## 23. Retry and Backoff

Use:

- Bounded retries
- Exponential backoff
- Jitter
- Maximum retry attempts
- Dead-letter after retry exhaustion

Do not retry permanent failures forever.

## 24. Replay / Reprocessing

```text
Raw Events
    ↓
Replay selection
    ↓
Parser/version
    ↓
Parse
    ↓
Normalize
    ↓
Validate
    ↓
New processed result
```

Support replay by at least one useful selector: event ID, source, or time range.

Historical raw data must remain untouched.

## 25. File Processing at Scale

For millions of files:

Do not load all files into memory or launch unlimited concurrent jobs.

Use:

```text
Files
  ↓
Manifest / discovery
  ↓
Durable file-processing queue
  ↓
Bounded workers
  ↓
Streaming file reads
  ↓
Record processing
```

Maintain checkpoints where practical:

```text
file identity
path
size
mtime
offset
status
```

Handle file rotation correctly.

## 26. Large Event Handling

Use configurable limits for:

- Maximum event size
- Maximum file size
- Maximum nesting depth
- Maximum field count
- Maximum extension size

## 27. Queue and Backpressure

Do not use a simple hard HTTP-style rate limit that drops security events by default.

Use:

```text
Source-aware admission/fairness
          +
Durable buffering
          +
Bounded worker concurrency
          +
Backpressure
```

A token-bucket style mechanism may provide per-source fairness and burst control, but it must not be the default data-loss mechanism.

## 28. At-Least-Once Processing + Idempotency

Target:

```text
At-least-once delivery
+
Idempotent processing
+
Deduplicated persistence
```

Use stable source/event identity where available.

Do not claim end-to-end exactly-once semantics across arbitrary external systems.

## 29. Horizontal Scaling

Support:

```text
                Durable Queue
                     |
          +----------+----------+
          |          |          |
       Worker 1   Worker 2   Worker N
          |          |          |
          +----------+----------+
                     |
               Processing
```

Use partitioning/consumer-group behavior in production queue infrastructure.

## 30. Storage Architecture

Separate logical responsibilities.

### Raw Store
Source of truth for:
- forensics
- replay
- integrity

Preferred:
- MinIO/S3-compatible storage
- Partitioned/batched objects

Avoid one tiny file per event at extreme scale.

### Metadata Store
For:
- sources
- parser registry
- versions
- configs
- replay jobs
- audit records

Recommended relational metadata store.

### Search Store
For:
- normalized events
- threat hunting
- dashboards

Recommended OpenSearch.

## 31. Unified Search / Visibility

Search common fields:

```text
destination.port = 443
severity = high
source.ip = 10.0.0.5
time = last 15 minutes
```

Use the search/indexing layer with pagination rather than loading the entire event corpus into application memory.

## 32. SIEM Integration

Provide output adapters for:

- Syslog
- CEF
- LEEF
- HTTP/JSON
- Compatible SIEM APIs where practical

Production behavior:

```text
Normalized Event
      ↓
Durable Output Queue
      ↓
Connector
      ↓
SIEM
```

Support batching, retry, backoff, failure tracking, and delivery metrics.

## 33. Data Lake Integration

Provide structured export:

- JSON Lines
- Parquet

Possible destination:

- MinIO/S3-compatible storage

Partition by dimensions such as year/month/day/source/category.

## 34. Threat Hunting

Support normalized queries for:

- Repeated denied connections
- Repeated authentication failures
- Unusual outbound activity
- Source/destination investigation
- Port/activity searches
- High-severity activity

## 35. Correlation

Support correlation across devices using:

- Source IP
- Destination IP
- User
- Session
- Time window
- Asset
- Event category

Example:

```text
VPN login anomaly
       +
IDS scan
       +
Firewall deny burst
       ↓
correlated security activity
```

## 36. Rule-Based Risk Scoring

Implement configurable, explainable scoring.

Potential inputs:

- Severity
- Event frequency
- Denied connections
- Unusual port
- Source reputation
- Asset criticality
- Historical deviation
- Environment policy

Do not assume a globally suspicious pattern is always abnormal.

Output:

```text
risk_score
risk_level
reasons
```

## 37. Behavioral Baseline

Potential baseline features:

```text
events/minute
unique destinations
unique ports
normal protocols
normal users
normal traffic volume
normal action distribution
```

Use deviations as inputs to rule-based risk and/or ML.

## 38. AI/ML

AI/ML is downstream and optional for core preprocessing.

Recommended first actual model:

**Isolation Forest**

```text
Normalized events
      ↓
Feature extraction
      ↓
Isolation Forest
      ↓
Anomaly score
```

Potential features:

- events/minute
- unique destination IPs
- unique ports
- failed attempts
- denied events
- connection frequency
- bytes sent/received
- protocol distribution

Evaluate using controlled normal and attack-like scenarios.

## 39. RAG / Analyst Assistance

RAG may be an advanced feature:

```text
Normalized Events
      ↓
Detection/Search
      ↓
Relevant evidence
      ↓
RAG
      ↓
Security knowledge base
      ↓
Analyst explanation
```

Possible local knowledge:

- MITRE ATT&CK
- Security policies
- IR playbooks
- Device documentation
- Parser documentation

RAG must be optional, local/offline-capable, and never a dependency for ingestion/parsing/normalization.

## 40. MITRE ATT&CK Mapping

Optional security analytics feature:

```text
Observed behavior
      ↓
Detection
      ↓
MITRE technique mapping
```

Use it for analyst context, not as a replacement for evidence.

## 41. Schema Drift Detection

Detect when a known vendor changes its event structure.

```text
Expected pattern
       ↓
Unexpected pattern
       ↓
Drift detected
       ↓
Diagnostic
       ↓
Parser update
       ↓
Test
       ↓
Replay
```

## 42. Parser Health

Track:

- Event count
- Success rate
- Failure rate
- Last success
- Last failure
- Version
- Source coverage
- Drift indication

A broken parser should not stop unrelated parsers.

## 43. Source Health

Track per source:

- Last event received
- Events/sec
- Error rate
- Format
- Parser
- Ingestion state

Suggested states:

```text
ACTIVE
DEGRADED
INACTIVE
ERROR
UNKNOWN
```

## 44. Observability

Monitor:

- EPS
- Processing latency
- p50/p95/p99
- Queue depth
- Consumer lag
- Parser failures
- Validation failures
- Dead-letter events
- Raw-storage latency
- Search/index latency
- SIEM delivery latency
- Worker utilization
- Per-source throughput

## 45. Performance

Because the PS targets Big Data scale, benchmark:

```text
1K
10K
100K
1M+
```

Measure:

- Sustained EPS
- Burst EPS
- p50 latency
- p95 latency
- p99 latency
- CPU
- Memory
- Queue depth
- Failure rate
- Output latency

Always report benchmark hardware/resources.

## 46. Production Failure Scenarios

### Worker failure
Unacknowledged jobs must be retryable/reassignable.

### Queue outage
Use durable ingestion persistence and resume after recovery.

### SIEM outage
Keep events in a durable output queue and retry.

### Search outage
Search failure must not destroy raw source data.

### Process restart
Recover pending jobs/checkpoints.

### Storage outage
Expose the failure and preserve recoverability according to the durability boundary.

## 47. Security

Protect against:

- Malformed input
- Oversized events
- Parser abuse
- Regex resource exhaustion
- Resource exhaustion
- Log injection
- Unsafe output encoding
- Secret leakage
- Unsafe configurations
- Container vulnerabilities

Parser configurations must be validated before activation.

## 48. Air-Gapped Deployment

Core operation must work without:

- Cloud APIs
- SaaS enrichment
- External AI services
- Runtime package downloads
- Remote configuration

All required assets must be local, including where used:

- container images
- parser definitions
- schemas
- ML models
- RAG knowledge base
- dependencies

## 49. Containerization

Potential components:

```text
ULPF
├── API
├── Workers
├── Queue
├── Raw Store
├── PostgreSQL
├── OpenSearch
├── MinIO
├── Frontend
└── Optional ML/RAG
```

Support a single-node demo and multi-node production scaling.

## 50. Authentication Scope

Authentication is **not part of the core SIH implementation**.

Do not make login/JWT/OAuth/enterprise IAM a core development track. Keep the project centered on event preprocessing.

## 51. Retention

Separate policies for:

- Raw retention
- Normalized retention
- Dead-letter retention
- Audit/configuration retention

Lossless processing does not mean infinite retention.

## 52. Forensic / Evidence Support

Maintain:

```text
raw event
raw hash
source
ingestion timestamp
parser version
schema version
transformation
processing status
```

Optional incident evidence packages may be added later.

## 53. Incident Layer

Optional:

```text
Events
 ↓
Correlation
 ↓
Detection
 ↓
Alert
 ↓
Incident
```

Keep this thin; do not turn it into a full SIEM/SOAR.

## 54. Multi-Environment Support

Carry context such as:

- environment
- organization
- region/site
- cloud/provider
- asset

without changing the core event model.

## 55. User Experience

Potential UI sections:

```text
Dashboard
Events
Sources
Parsers
Threat Hunting
Analytics
Outputs
System Health
```

The event detail view should show:

```text
NORMALIZED EVENT
RAW EVENT
TRACEABILITY
VENDOR EXTENSIONS
PROCESSING
```

## 56. Technology Stack

Core:
- Node.js
- TypeScript
- Express.js

Backend conventions:
```text
routes
controllers
services
models
middleware
utils
validators
config
```

Use predictable response/error conventions such as:
- ApiError
- ApiResponse
- asyncHandler
- centralized error middleware

Storage:
- PostgreSQL for metadata
- OpenSearch for event search
- MinIO/S3-compatible storage for raw events

Queue:
- Redis Streams or NATS JetStream initially
- Redpanda/Kafka as a scale-up option

Frontend:
- React + TypeScript

ML:
- Separate Python model/service is acceptable for ML only
- Isolation Forest as the initial model

Deployment:
- Docker
- Docker Compose

## 57. Priority Classification

### P0 — Must Have

1. Multi-source ingestion
2. File ingestion
3. Syslog ingestion
4. Format detection
5. Raw preservation
6. Event identity + hash
7. Parser registry
8. Configuration-driven parser engine
9. Representative parsers
10. Universal schema
11. Normalization
12. Vendor-field preservation
13. Traceability
14. Validation
15. Dead-letter/quarantine
16. Replay
17. Plug-and-play onboarding
18. Unified search/visibility
19. SIEM output
20. Data Lake output
21. Air-gapped operation
22. Containerization

### P1 — Production Hardening

1. Durable queue
2. File checkpoints
3. Idempotency
4. Source-aware rate control
5. Backpressure
6. Output retry
7. Bulk writes
8. Schema drift
9. Parser health
10. Source health
11. Observability
12. Horizontal workers
13. Graceful shutdown
14. Capacity monitoring

### P2 — Advanced Differentiators

1. Behavioral baseline
2. Context-aware risk scoring
3. Real ML anomaly detection
4. Correlation
5. Threat hunting improvements
6. MITRE ATT&CK mapping
7. Incident grouping
8. Evidence packaging
9. RAG analyst assistant
10. Automated parser suggestions

## 58. Features That Must Not Become Core Scope

Do not let the project expand into:

- Full commercial SIEM
- Full SOAR
- Full EDR
- Complete threat intelligence platform
- Enterprise IAM
- Mandatory cloud-only services
- Mandatory external APIs
- Mandatory LLM dependency
- Hundreds of vendor integrations before reliability is proven

## 59. Demonstration Strategy

Show:

```text
Different log formats
        ↓
Central ingestion
        ↓
Raw preservation
        ↓
Automatic/source-based parser selection
        ↓
Normalization
        ↓
Vendor-field preservation
        ↓
Traceability
        ↓
Unified search
        ↓
SIEM/Data Lake output
        ↓
Risk/anomaly result
        ↓
Add new parser
        ↓
Replay old event
```

## 60. Definition of Success

A successful implementation proves:

```text
Different input
       ↓
Same framework
       ↓
Original preserved
       ↓
Source attributes extracted
       ↓
Common taxonomy
       ↓
Unknown fields preserved
       ↓
Traceability available
       ↓
New sources easy to onboard
       ↓
Search across vendors
       ↓
SIEM/Data Lake ready
       ↓
AI/ML ready
       ↓
Operable at scale
       ↓
Air-gapped
```

## 61. Final Product Statement

> **ULPF is a lossless, extensible, vendor-agnostic event preprocessing framework focused on perimeter/network security sources. It accepts heterogeneous logs, preserves the original data, identifies and parses source-specific attributes, normalizes them into a controlled universal taxonomy, preserves vendor-specific information, maintains end-to-end traceability, supports configuration-driven plug-and-play onboarding, and produces reliable data for SIEM, Data Lake, search, threat hunting, correlation, and AI/ML analytics.**

## 62. Development Principle

Build in this order:

```text
Correctness
   ↓
Losslessness
   ↓
Extensibility
   ↓
Recoverability
   ↓
Scale
   ↓
Analytics
   ↓
UI polish
```

The system must always be able to answer:

> **What did we receive, what did we do to it, what did we produce, and can we get back to the original?**
