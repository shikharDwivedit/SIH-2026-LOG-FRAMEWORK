# SIH 2026 ULPF — Frontend Product & UI Specification

## 1. Document Purpose

This document is the implementation specification for the frontend of the **Universal Log Pre-processing Framework (ULPF)**.

The frontend must expose the real capabilities of the existing backend and make the SIH problem easy to understand during evaluation.

This is an **enterprise security/log-engineering console**, not a generic SaaS dashboard.

The frontend must make these concepts visible:

- heterogeneous log ingestion
- source and format detection
- lossless raw-event preservation
- parser selection
- universal normalization
- vendor-specific field preservation
- traceability
- validation
- dead-letter/quarantine
- replay
- source health
- parser health
- queue/backpressure
- SIEM output
- Data Lake output
- risk/anomaly analysis
- correlation/threat hunting
- schema drift
- production diagnostics

---

# 2. Product Positioning

The UI should communicate the product in one sentence:

> **ULPF converts heterogeneous enterprise security events into a universal, traceable, lossless representation that can feed SIEM, Data Lake and analytics systems.**

The core visual story is:

```text
Sources
  ↓
Ingestion
  ↓
Raw Preservation
  ↓
Detection
  ↓
Parsing
  ↓
Normalization
  ↓
Validation
  ↓
Traceability
  ↓
Storage
  ↓
SIEM / Data Lake / Analytics
```

---

# 3. Scope

## 3.1 Primary source focus

The implementation should emphasize perimeter/security/network sources:

- Firewalls
- IDS/IPS
- Routers
- Switches
- VPN gateways
- WAFs
- Proxies
- Load balancers
- Network monitoring/security devices

The framework remains extensible to:

- servers
- operating systems
- applications
- databases
- cloud services
- containers
- endpoint security
- IAM
- IoT
- other hardware/software sources

## 3.2 Important scope decision

Authentication/login/user-management is **not part of the current project scope**.

Do not create login pages, user-role pages, JWT flows or account-management UI.

The application is treated as an internal security/infrastructure platform.

---

# 4. Current Backend Integration Model

The frontend must work with the existing Node/Express backend conventions.

Backend style:

```text
routes
  ↓
controllers
  ↓
services
  ↓
storage / processing
```

Existing API convention:

```text
/api/v1
```

The frontend must consume the existing standardized API responses and errors.

Do not move backend business logic into React.

---

# 5. UI/UX PRINCIPLES

## 5.1 Overall character

Target:

```text
Enterprise Security Console
+
Log Engineering Platform
+
Operational Observability
```

Avoid:

- generic admin-template appearance
- excessive rounded cards
- glassmorphism
- neon cyberpunk styling
- giant gradients
- animated backgrounds
- decorative 3D graphics
- fake terminal screens
- meaningless “AI” panels
- enormous KPI cards
- excessive empty space

The UI should look like a product that could actually be used by:

- SOC analysts
- security engineers
- infrastructure engineers
- log/platform engineers

## 5.2 Information density

Security operations interfaces need information density.

Prefer:

```text
compact tables
structured panels
clear hierarchy
small but readable metrics
```

over:

```text
large visual blocks
marketing-style whitespace
```

---

# 6. VISUAL LANGUAGE

## 6.1 Theme

Use a restrained dark enterprise theme by default.

Recommended visual hierarchy:

```text
Application background
    ↓
Primary surface
    ↓
Secondary surface
    ↓
Border / separator
    ↓
Content
```

Use a restrained blue/cyan accent for primary actions and neutral status indicators.

## 6.2 Semantic status colors

Use consistent semantics:

```text
Green  → Healthy / Success
Amber  → Warning / Degraded
Red    → Failure / Critical
Blue   → Informational
Gray   → Unknown / Inactive
```

Do not use color as the only status indicator. Every status should have text.

## 6.3 Typography

Use a professional system or Inter-style sans-serif.

Use monospace only for:

- raw logs
- JSON
- schema paths
- parser definitions
- IP addresses
- ports
- hashes
- event IDs

---

# 7. APPLICATION SHELL

Persistent layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar                                                      │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ Sidebar      │ Main Content                                 │
│              │                                              │
│ Overview     │                                              │
│ Events       │                                              │
│ Sources      │                                              │
│ Parsers      │                                              │
│ Pipeline     │                                              │
│ Replay       │                                              │
│ Analytics    │                                              │
│ Outputs      │                                              │
│ Diagnostics  │                                              │
│              │                                              │
│ Settings     │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

## 7.1 Sidebar

Primary navigation:

1. Overview
2. Events
3. Sources
4. Parsers
5. Pipeline
6. Replay
7. Analytics
8. Outputs
9. Diagnostics
10. Settings

Show a small product identity:

```text
ULPF
Universal Log Pre-processing Framework
```

The active navigation item must be visually obvious but restrained.

---

# 8. TOP BAR

The top bar communicates runtime status.

Show:

```text
ULPF
Environment: LAB / DEMO / AIR-GAPPED
Collector Status
Queue Status
Current EPS
Backend Status
```

Example:

```text
ULPF
LAB
● Collectors Healthy
12.4K EPS
Queue 18%
```

Also provide:

- global search
- documentation/help access
- system status indicator

Do not include a user/account menu because authentication is out of scope.

---

# 9. OVERVIEW PAGE

The Overview page should answer three questions immediately:

1. Is the platform healthy?
2. What is happening right now?
3. Where is the current processing pressure?

## 9.1 Metrics

Show compact metrics:

```text
Events Ingested
Events/sec
Events Processed
p95 Processing Latency
Queue Depth
Dead Letters
Active Sources
Active Parsers
```

Example synthetic values:

```text
4.82M Events
12.4K EPS
4.81M Processed
84ms p95
18,240 Queue
317 Dead Letters
24 Sources
18 Parsers
```

All values must come from the backend in the real application.

## 9.2 Throughput chart

Show:

```text
Received
Processed
Failed
```

over selectable ranges:

```text
5m
15m
1h
6h
24h
```

## 9.3 Pipeline status

Show:

```text
Collectors
Raw Store
Queue
Parser
Normalizer
Validator
Storage
Outputs
```

Each stage shows:

```text
status
EPS
latency
errors
```

## 9.4 Source distribution

Show top sources and their traffic:

```text
Source       EPS     Parser        Status
FW-HQ-01     4.2K    fortigate-v1  Healthy
FW-DMZ-01    3.1K    paloalto-v1   Healthy
IDS-01       2.7K    snort-v1      Healthy
VPN-01       1.8K    openvpn-v1    Warning
```

## 9.5 Category distribution

Display normalized event categories:

- Network
- Authentication
- Threat
- HTTP/Application
- System
- Other

---

# 10. EVENTS PAGE

The Events page is the primary investigation workspace.

Use a dense data table.

Columns:

```text
Time
Event ID
Vendor
Product
Source
Category
Action
Severity
Source IP
Destination IP
Parser
Status
```

Features:

- server-side pagination
- search
- filtering
- sorting
- time range
- column visibility
- compact density
- row click to Event Details

Never download/render the entire event corpus.

---

# 11. EVENT SEARCH

Common searchable fields:

```text
event.action
event.category
event.type
event.outcome
event.severity
source.vendor
source.product
source.device_type
network.source_ip
network.destination_ip
network.source_port
network.destination_port
network.protocol
identity.username
threat.name
parser
processing.status
```

Support:

```text
free-text search
field filters
time range
combined filters
```

Example:

```text
destination.port = 443
severity = high
last 1 hour
```

The frontend must use the backend/search service for large result sets.

---

# 12. EVENT DETAIL PAGE

This is the most important screen for demonstrating the ULPF concept.

The layout must make five things immediately clear:

```text
What arrived?
What did we understand?
What did we normalize?
Where did it come from?
Did we lose anything?
```

Use tabs or clearly separated sections:

```text
Normalized
Raw
Traceability
Vendor Extensions
Processing
Analytics
```

---

# 13. EVENT DETAIL — HEADER

Display:

```text
Event ID
Processing Status
Timestamp
Source
Vendor
Product
Parser
Parser Version
Schema Version
```

Example:

```text
EVT-8F4A91
NORMALIZED

FortiGate / Firewall
Parser: fortigate-v1.3
Schema: 1.0
2026-09-18 21:42:16 UTC
```

---

# 14. RAW EVENT VIEW

Show the original event without mutating it.

Display:

```text
Raw Event ID
Raw Hash
Ingestion Time
Transport
Source Metadata
Raw Content
```

Actions:

```text
Copy
Download
View Hash
```

The raw content must be rendered as data, never as HTML.

---

# 15. NORMALIZED EVENT VIEW

Show the universal event grouped logically.

Example:

```text
EVENT
category      network
type          connection
action        deny
outcome       blocked
severity      high

NETWORK
source.ip         10.10.10.5
source.port       44721
destination.ip    8.8.8.8
destination.port  443
protocol           TCP
```

Provide:

```text
structured view
JSON view
copy
download
```

---

# 16. TRACEABILITY VIEW

Show:

```text
Raw Event ID
Raw Hash
Parser
Parser Version
Schema Version
Transformation ID
```

Then visualize field lineage:

```text
raw.srcip
   ↓
parsed.srcip
   ↓
network.source_ip
```

And:

```text
raw.action
   ↓
parsed.action
   ↓
event.action
```

This should be one of the visually strongest screens in the application because it demonstrates a core ULPF requirement.

---

# 17. VENDOR EXTENSIONS VIEW

Show fields that were not mapped to the universal schema.

Example:

```text
policy_uuid
session_uuid
appliance_zone
custom_code
```

Explain:

```text
Preserved vendor-specific information
```

Do not hide these fields.

---

# 18. PROCESSING TIMELINE

Show event lifecycle:

```text
Received       21:42:16.021
Raw Persisted  21:42:16.024
Queued         21:42:16.027
Parsed         21:42:16.031
Normalized     21:42:16.032
Validated      21:42:16.034
Stored         21:42:16.036
Delivered      21:42:16.042
```

This is useful for:

- troubleshooting
- performance analysis
- judge demonstrations

---

# 19. ANALYTICS VIEW

When analytical information exists, show it separately from deterministic event data.

Display:

```text
Rule-based risk score
ML anomaly score
Detection reasons
Correlation
ATT&CK mapping
```

Never imply that a probabilistic ML score is an absolute truth.

---

# 20. SOURCES PAGE

The Sources page is the source registry.

Columns:

```text
Source
Vendor
Product
Device Type
Transport
Format
Parser
EPS
Last Event
Status
```

Actions:

```text
View
Edit
Disable
Test
```

---

# 21. SOURCE DETAIL

Display:

```text
Source Metadata
Transport
Format
Parser
Current EPS
Historical EPS
Last Event
Parser Success Rate
Error Rate
Recent Events
```

Provide clear health status.

Example:

```text
ACTIVE
4.2K EPS
Last event 2s ago
Parser success 99.98%
```

---

# 22. SOURCE ONBOARDING

Provide a guided onboarding workflow.

Steps:

```text
1. Identity
2. Transport
3. Format
4. Parser
5. Test
6. Activate
```

Do not create a generic multi-step form.

Each step should explain the actual ULPF concept being configured.

---

# 23. PARSERS PAGE

Display the parser registry.

Columns:

```text
Parser
Version
Vendor
Product
Format
Sources
Success Rate
Status
Last Used
```

Actions:

```text
View
Test
Enable
Disable
Create New Version
```

---

# 24. PARSER DETAIL

Display:

```text
Identity
Vendor
Product
Device Type
Format
Version
Match Criteria
Field Mappings
Sample Logs
Test Results
Usage
Failure Rate
```

Example:

```text
fortigate-v1.3

srcip   → network.source_ip
dstip   → network.destination_ip
action  → event.action
policyid → threat.rule_id
```

---

# 25. PLUG-AND-PLAY PARSER ONBOARDING

This screen should make the main differentiator obvious.

Workflow:

```text
New Parser
   ↓
Provide Sample Log
   ↓
Define Detection
   ↓
Map Fields
   ↓
Run Test
   ↓
Preview Parsed Event
   ↓
Preview Normalized Event
   ↓
Review Unmapped Fields
   ↓
Activate
```

Show a factual indicator:

```text
Core processing code modified: 0
```

only if the implementation can prove it.

Do not fake metrics.

---

# 26. PARSER TEST BENCH

The test bench must show:

```text
Input
Format Detection
Parser Selection
Parsed Fields
Normalized Event
Validation
Unmapped Fields
Traceability
```

Errors should be local and understandable.

Example:

```text
Parser Test Failed

Field: srcip
Reason: Invalid IPv4 value
```

---

# 27. PIPELINE PAGE

The Pipeline page is an engineering/operations view.

Stages:

```text
Collectors
Raw Preservation
Queue
Workers
Format Detection
Parser
Normalizer
Validator
Storage
Outputs
```

For every stage show:

```text
status
EPS
latency
error count
queue/backlog
```

Users should be able to drill into a failing stage.

---

# 28. QUEUE / PROCESSING VIEW

Show:

```text
Pending
Processing
Completed
Retrying
Failed
Dead Letter
```

Also:

```text
Queue Depth
Oldest Pending Event
Consumer Lag
Worker Count
Worker Utilization
```

This screen should make backpressure and reliability understandable.

---

# 29. REPLAY PAGE

Replay is a recovery feature.

Allow:

```text
Replay Event
Replay Source
Replay Time Range
Replay Dead Letters
```

Before starting, show:

```text
Events Selected
Current Parser
Target Parser
Current Schema
Target Schema
```

During execution:

```text
Job ID
Progress
Processed
Succeeded
Failed
Remaining
```

Never overwrite raw events.

---

# 30. DEAD LETTER / QUARANTINE PAGE

Show:

```text
Raw Event ID
Source
Format
Error
Parser
Attempts
First Seen
Status
```

Details should include:

```text
Raw Event
Detection Result
Parser Failure
Diagnostics
Replay
```

Provide a direct path from:

```text
unknown event
→ diagnose
→ parser onboarding
→ replay
```

---

# 31. SCHEMA DRIFT PAGE

If schema-drift support exists, show:

```text
Source
Parser
Expected Field
Observed Field
First Seen
Affected Events
Status
```

Example:

```text
Expected: srcip
Observed: sourceIp
Affected: 18,204 events
Status: Investigate
```

Actions:

```text
Investigate
Create Parser Version
Replay
```

---

# 32. OUTPUTS PAGE

Show downstream destinations:

```text
Destination
Type
EPS
Queue/Lag
Last Success
Failure Rate
Status
```

Examples:

```text
SIEM-HQ
CEF
8.2K EPS
32ms
Healthy

DataLake
Parquet
10.1K EPS
4.3s
Healthy
```

All information should come from backend state.

---

# 33. SIEM DELIVERY VIEW

Make the delivery pipeline visible:

```text
Normalized Events
      ↓
Output Queue
      ↓
SIEM Adapter
      ↓
SIEM
```

Show:

```text
sent
acknowledged
failed
retrying
queued
```

This demonstrates that SIEM integration is an operational subsystem, not merely a download button.

---

# 34. DATA LAKE VIEW

Show:

```text
Destination
Format
Partition
Records
Objects/files
Last Batch
Lag
Status
```

Example:

```text
Destination: MinIO
Format: Parquet
Partition: year=2026/month=09/day=18/source=fortigate

Rows: 1,204,283
Last batch: 22:04:10
Status: Healthy
```

---

# 35. ANALYTICS PAGE

Group into:

```text
Threat Activity
Behavior
Anomalies
Risk
Correlation
```

Use charts only when they provide operational meaning.

Useful views:

- event trends
- top sources
- high-severity events
- denied traffic
- unusual activity
- parser anomalies

---

# 36. CONTEXT-AWARE RISK VIEW

Risk should show why the system considers activity unusual.

Example:

```text
Risk Score: 72

Reasons
+ Repeated denied connections
+ 184 unique destination ports
+ Unusual outbound activity

Context
Normal destinations/day: 6
Current observation: 184
```

Clearly label:

```text
Rule-Based Risk
```

or:

```text
ML Anomaly Score
```

Do not combine them into an unexplained number.

---

# 37. THREAT HUNTING PAGE

Provide common-field search.

Example:

```text
source.ip = 10.10.20.18
AND destination.port IN [22,23,3389]
AND time < 15m
```

Display results using the Event Explorer.

The frontend should not implement the query engine itself.

---

# 38. CORRELATION PAGE

Group related events into an activity.

Example:

```text
Activity #ACT-1842

10:22 VPN authentication failure
10:22 VPN authentication failure
10:23 Firewall outbound spike
10:23 IDS scan detection
10:24 Proxy anomaly
```

Show relationships:

```text
shared IP
shared user
shared destination
time window
```

Keep relationships explainable.

---

# 39. MITRE ATT&CK VIEW

If the backend provides ATT&CK mappings, show:

```text
Observed Behavior
Tactic
Technique
Evidence
Related Events
```

Never assign a technique without backend evidence.

---

# 40. DIAGNOSTICS PAGE

A technical operations page.

Components:

```text
Collector Health
Queue Health
Worker Health
Raw Store Health
Parser Health
Normalizer Health
Validation Health
Search Health
SIEM Health
Data Lake Health
```

Show:

```text
Healthy
Warning
Degraded
Failed
```

and the relevant metric behind the status.

---

# 41. SYSTEM LOG VIEW

Provide a compact application/processing log viewer.

Filters:

```text
time
component
severity
search
```

Do not expose:

- secrets
- credentials
- tokens
- internal stack traces to normal users

---

# 42. REAL-TIME UPDATES

Use WebSocket/Socket.IO only for information where live updates are valuable:

```text
EPS
Pipeline health
Queue depth
New event notifications
Replay progress
Parser test progress
```

Do not live-stream enormous event sets directly into the browser.

---

# 43. FRONTEND PERFORMANCE RULES

The browser must never attempt to display the entire event corpus.

Use:

```text
server-side pagination
virtualized rows
debounced search
lazy loading
chart aggregation
bounded result sets
```

Avoid:

```text
fetch millions of events
→ store in browser
→ render all rows
```

---

# 44. API LAYER

Create a single API integration layer.

Suggested frontend structure:

```text
src/services/
├── api.js
├── events.js
├── sources.js
├── parsers.js
├── replay.js
├── outputs.js
├── analytics.js
└── metrics.js
```

The API layer handles:

- base URL
- response unwrapping
- common errors
- request cancellation
- retry where appropriate
- API status handling

Do not duplicate HTTP code across components.

---

# 45. EXISTING API CONTRACTS

Integrate with the existing backend routes.

Current relevant endpoints include:

```text
GET    /api/v1/events
POST   /api/v1/events/ingest
POST   /api/v1/events/ingest-file
POST   /api/v1/events/ingest-file/start
GET    /api/v1/events/ingest-file/:jobId
POST   /api/v1/events/ingest-file/:jobId/stop

GET    /api/v1/events/:id
GET    /api/v1/events/:id/trace
POST   /api/v1/events/:id/replay

GET    /api/v1/parsers
POST   /api/v1/parsers
POST   /api/v1/parsers/test
POST   /api/v1/parsers/reload

GET    /api/v1/sources
POST   /api/v1/sources
GET    /api/v1/sources/:id
DELETE /api/v1/sources/:id

GET    /api/v1/output/cef
GET    /api/v1/output/cef/:id
GET    /api/v1/output/jsonl
GET    /api/v1/output/flat

GET    /api/v1/healthcheck
GET    /api/v1/healthcheck/metrics
GET    /api/v1/healthcheck/dead-letter
POST   /api/v1/healthcheck/reset
```

Do not invent frontend-only fake endpoints.

If a required feature has no backend endpoint, identify it as a backend dependency instead of faking the result.

---

# 46. RESPONSE / ERROR HANDLING

The backend uses a standard response pattern:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

Error responses use the backend's `ApiError` conventions.

Frontend API handling should centralize:

```text
success parsing
validation errors
HTTP errors
network errors
timeout errors
```

---

# 47. UI COMPONENT LIBRARY

Build reusable components:

```text
AppShell
Sidebar
Topbar
StatusBadge
MetricStrip
Metric
PipelineStage
EventTable
EventFilters
EventDetails
RawEventViewer
NormalizedEventViewer
TraceabilityViewer
VendorExtensionViewer
ProcessingTimeline
SourceTable
SourceDetails
SourceWizard
ParserTable
ParserDetails
ParserWizard
ParserTestBench
ReplayForm
ReplayProgress
DeadLetterTable
RiskPanel
AnomalyPanel
CorrelationTimeline
OutputTable
OutputDetails
Chart
EmptyState
LoadingState
ErrorState
```

Do not make a new component for every simple `<div>`.

---

# 48. DATA VISUALIZATION

Use charts selectively.

Good chart types:

```text
line → throughput/time
bar → source/category comparison
donut → compact category distribution
timeline → processing/correlation
```

Avoid decorative charts with no operational purpose.

---

# 49. EMPTY / LOADING / ERROR STATES

Every page must support:

```text
Loading
Empty
Error
Partial
```

Example:

```text
No normalized events found.

Try:
- expanding the time range
- clearing filters
- checking source activity
```

Backend unavailable:

```text
ULPF API unavailable

Last successful connection:
22:03:41

Retry
```

Parser failure:

```text
Parser test failed

Parser: fortigate-v1.3
Field: srcip
Reason: invalid value
```

---

# 50. DEMO MODE

Support an explicit synthetic/demo environment.

Demo data must originate from:

```text
backend seed/sample ingestion
```

not hardcoded frontend arrays.

The UI should clearly indicate:

```text
Environment: DEMO
Data: Synthetic
```

This protects credibility during judging.

---

# 51. SIH DEMO WORKFLOW

The frontend must make this sequence easy to demonstrate:

```text
1. Overview
2. Show multiple sources
3. Show different formats
4. Send/upload sample event
5. Open Event Explorer
6. Open Event Details
7. Show Raw Event
8. Show Normalized Event
9. Show Traceability
10. Show Vendor Extensions
11. Open Parser Registry
12. Add/Test a parser
13. Demonstrate zero core-code-change onboarding
14. Replay a failed/old event
15. Show SIEM/Data Lake output
16. Show pipeline health
17. Show risk/anomaly/correlation
```

The UI should support this flow without excessive navigation.

---

# 52. RESPONSIVE BEHAVIOR

Desktop-first.

Desktop:

```text
full sidebar
dense tables
multi-column detail
```

Tablet:

```text
collapsed sidebar
reduced table columns
stacked detail panels
```

Mobile:

```text
priority fields
stacked panels
simplified tables
```

Do not optimize for mobile at the expense of the SOC workstation experience.

---

# 53. ACCESSIBILITY

Follow practical accessibility standards:

- keyboard navigation
- visible focus state
- semantic HTML
- readable contrast
- accessible labels
- status text in addition to color
- readable error messages

---

# 54. OFFLINE / AIR-GAPPED FRONTEND

The frontend must work without external web dependencies.

Do not require:

```text
CDN
Google Fonts
external analytics
remote images
external APIs
third-party online dashboards
```

Bundle required assets with the application.

---

# 55. FRONTEND SECURITY

Treat backend content and raw logs as untrusted.

Requirements:

- escape displayed raw content
- never inject raw logs as HTML
- do not expose tokens/secrets
- do not expose stack traces
- validate file selection before upload
- enforce backend-provided size/type constraints
- do not execute log content

---

# 56. FILE IMPORT UX

For file ingestion:

```text
Select file
   ↓
Choose/identify source
   ↓
Format
   ↓
Start
   ↓
Progress
```

Show:

```text
File size
Records discovered
Records processed
Records failed
Current rate
```

For very large files, show progress and backend job state rather than freezing the browser.

---

# 57. FRONTEND FILE HANDLING

The UI is not responsible for storing millions of event files.

The frontend only:

```text
selects
uploads
tracks
displays
```

The backend manages:

```text
raw storage
checkpoints
queueing
processing
retention
```

---

# 58. CODE ORGANIZATION

Recommended frontend structure:

```text
frontend/
└── src/
    ├── app/
    │   ├── router.js
    │   └── app-shell.js
    │
    ├── pages/
    │   ├── overview/
    │   ├── events/
    │   ├── sources/
    │   ├── parsers/
    │   ├── pipeline/
    │   ├── replay/
    │   ├── analytics/
    │   ├── outputs/
    │   └── diagnostics/
    │
    ├── components/
    │   ├── common/
    │   ├── events/
    │   ├── sources/
    │   ├── parsers/
    │   ├── pipeline/
    │   ├── replay/
    │   ├── analytics/
    │   └── outputs/
    │
    ├── services/
    │   ├── api.js
    │   ├── events.js
    │   ├── sources.js
    │   ├── parsers.js
    │   ├── replay.js
    │   ├── outputs.js
    │   └── metrics.js
    │
    ├── hooks/
    ├── utils/
    ├── types/
    └── styles/
```

Adapt this to the existing frontend rather than performing a rewrite purely for organization.

---

# 59. STATE MANAGEMENT

Use the simplest state approach that works.

Use:

```text
component state
```

for local UI state.

Use:

```text
server-state/query caching
```

for API data.

Do not introduce a global state framework unless it is necessary.

---

# 60. FRONTEND TESTING

Test:

```text
navigation
event search
event details
traceability rendering
parser onboarding
parser test bench
source onboarding
replay progress
dead-letter flows
API failures
loading states
empty states
```

Important integration tests:

```text
backend API
    ↓
frontend service
    ↓
component
```

---

# 61. VISUAL QUALITY BAR

A page is not complete merely because it functions.

Check:

```text
spacing
alignment
typography
contrast
table density
consistent status indicators
loading state
error state
empty state
responsive behavior
```

The UI should look intentionally designed.

---

# 62. THINGS THE FRONTEND MUST NOT DO

Never:

- hardcode fake production metrics
- generate fake events to fill empty tables
- pretend ML scores exist when backend has not produced them
- hide backend failures with static fallback data
- implement parsing in React
- implement normalization in React
- duplicate backend business rules
- expose internal file paths
- expose secrets
- create unnecessary screens
- use visual effects to compensate for missing functionality

---

# 63. IMPLEMENTATION ORDER

## Phase 1 — Shell

```text
App shell
Sidebar
Topbar
Routing
Design tokens
Global styles
```

## Phase 2 — Core operations

```text
Overview
Events
Event Details
```

## Phase 3 — Source/parser management

```text
Sources
Source Details
Source Onboarding
Parsers
Parser Details
Parser Test Bench
Parser Onboarding
```

## Phase 4 — Reliability

```text
Pipeline
Queue
Dead Letters
Replay
Diagnostics
```

## Phase 5 — Outputs

```text
SIEM
Data Lake
Output Health
```

## Phase 6 — Analytics

```text
Risk
Anomaly
Correlation
Threat Hunting
ATT&CK
Schema Drift
```

## Phase 7 — Polish

```text
loading/empty/error states
performance
accessibility
offline packaging
demo flow
```

---

# 64. FRONTEND AGENT RULES

Before implementing any feature:

1. Read `docs/CURRENT_IMPLEMENTATION_KNOWLEDGE.md`.
2. Read this specification.
3. Inspect only the existing frontend code relevant to the assigned task.
4. Reuse existing API endpoints and backend behavior.
5. Preserve working UI functionality.
6. Do not rewrite unrelated screens.
7. Do not invent fake backend features.
8. Add appropriate tests.
9. Build/run the frontend after meaningful changes.
10. Update the project knowledge document.

---

# 65. LIVING PROJECT KNOWLEDGE REQUIREMENT

After every frontend implementation/update session, update:

```text
docs/CURRENT_IMPLEMENTATION_KNOWLEDGE.md
```

Add:

```text
Date
Task
Objective
Files added
Files modified
Files removed
Existing behavior preserved
New frontend functionality
API dependencies
Visual/component changes
Tests run
Build result
Known limitations
Known regressions
Next recommended task
```

This is mandatory.

The knowledge file is the project's ongoing memory.

Never finish a task while knowingly leaving the project-state document stale.

---

# 66. FRONTEND DEFINITION OF DONE

A frontend feature is complete only when:

```text
UI
+
Real API integration
+
Loading
+
Empty state
+
Error state
+
Correct backend semantics
+
Tests
+
Responsive behavior
+
Documentation update
```

For operational features also verify:

```text
large-data behavior
+
failure behavior
```

---

# 67. FINAL PRODUCT MAP

The final application should feel like one coherent product:

```text
                    ULPF
                     │
      ┌──────────────┼──────────────┐
      │              │              │
   OPERATIONS    INVESTIGATION   ANALYTICS
      │              │              │
   Pipeline        Events          Risk
   Sources         Raw             Anomaly
   Parsers         Normalized      Correlation
   Replay          Trace           Hunting
   Outputs         Extensions      ATT&CK
   Diagnostics     Processing
                     │
                     ▼
                SIEM / DATA LAKE
```

The most important visual message is:

```text
DIFFERENT LOGS
      ↓
ONE ULPF PIPELINE
      ↓
LOSSLESS UNIVERSAL EVENT
      ↓
TRACEABLE + SEARCHABLE
      ↓
SIEM / DATA LAKE / ANALYTICS
```

---

# 68. FINAL QUALITY STATEMENT

The interface must look like a mature internal security product.

A judge should be able to open the application and quickly understand:

- where events originate
- how much traffic is arriving
- whether processing is healthy
- how a source is onboarded
- how parsers work
- what the universal event looks like
- that raw data is preserved
- how normalized fields trace back to source data
- what happens when parsing fails
- how replay works
- how outputs reach SIEM/Data Lake
- how analytics are derived
- how the platform behaves under operational pressure

Do not optimize for flashy visuals.

Optimize for **clarity, evidence, operational usefulness, and trust**.
