# Vendor Parser Onboarding

This is the plug-and-play path for adding a vendor-specific log format. A new vendor normally needs a parser JSON file, one real sample log, and one test. No vendor branch is added to the event-processing or normalization services.

## The definition has three jobs

1. `match_criteria` identifies the vendor message.
2. `extraction` turns the raw text into named fields.
3. `field_mappings` places named fields in the universal event taxonomy.

Fields not listed in `field_mappings` are retained under `extensions.vendor_specific`, so mapping only the fields needed by downstream consumers is safe.

## Walkthrough: Acme Edge Firewall

Assume the device sends this key-value line:

```text
acme_edge=1 src=192.0.2.10 dst=198.51.100.20 action=allow proto=tcp dst_port=443 ticket=INC-42
```

Create `parsers/acme/acme-edge-firewall.json`:

```json
{
  "name": "acme-edge-firewall",
  "version": "1.0",
  "vendor": "Acme Security",
  "product": "Edge Firewall",
  "device_type": "firewall",
  "format": "key-value",
  "match_criteria": {
    "contains": ["acme_edge="]
  },
  "extraction": {
    "type": "key-value"
  },
  "field_mappings": {
    "src": "network.source_ip",
    "dst": "network.destination_ip",
    "action": "event.action",
    "proto": "network.protocol",
    "dst_port": "network.destination_port"
  }
}
```

### Choosing mappings

Use the universal paths already present in the event schema:

| Vendor field | Universal path |
| --- | --- |
| source address | `network.source_ip` |
| destination address | `network.destination_ip` |
| source/destination port | `network.source_port` / `network.destination_port` |
| action or disposition | `event.action` |
| result or status | `event.outcome` |
| username | `identity.username` |
| rule or policy ID | `threat.rule_id` |
| device name | `source.hostname` |

Use `regex` extraction when the vendor is positional or free-form. Named capture groups are recommended:

```json
{
  "format": "regex",
  "extraction": {
    "type": "regex",
    "pattern": "^ALERT src=(?<src_ip>\\S+) dst=(?<dst_ip>\\S+) action=(?<action>\\S+)$"
  },
  "field_mappings": {
    "src_ip": "network.source_ip",
    "dst_ip": "network.destination_ip",
    "action": "event.action"
  }
}
```

Use `json` extraction when the raw event is a JSON object. JSON property names are mapped exactly like key-value fields.

## Validate before ingesting

Reload definitions after adding the file:

```bash
curl -X POST http://localhost:8000/api/v1/parsers/reload
```

Run a parser-only test. This does not create a durable event:

```bash
curl -X POST http://localhost:8000/api/v1/parsers/test \
  -H 'Content-Type: application/json' \
  -d '{"parser_name":"acme-edge-firewall","log":"acme_edge=1 src=192.0.2.10 dst=198.51.100.20 action=allow proto=tcp dst_port=443 ticket=INC-42"}'
```

Check `matched_parser`, `extracted_fields`, `mapped_fields`, `normalized_event`, and `vendor_specific_retained`. The expected result includes `network.source_ip`, `network.destination_ip`, and `event.action`; `ticket` remains in `extensions.vendor_specific`.

Then ingest one event only after the parser-only result is correct:

```bash
curl -X POST http://localhost:8000/api/v1/events/ingest \
  -H 'Content-Type: application/json' \
  -d '{"log":"acme_edge=1 src=192.0.2.10 dst=198.51.100.20 action=allow proto=tcp dst_port=443 ticket=INC-42","transport":"http"}'
```

For a source-specific route, register the device with `preferred_parser: "acme-edge-firewall"`. An explicit source parser takes precedence over fingerprint and format matching.

## Dashboard workflow

Open **Parser registry**, fill in the vendor metadata, choose an extraction type, enter a fingerprint, and provide the mappings as a JSON object. Use **Test bench** to test the raw line without storage, then use **Reload from disk** when the definition is maintained as a file. The registry displays the number of mapped fields so incomplete definitions are visible.

## Test checklist

Add a focused assertion for every important mapping, one unmapped vendor field, and one realistic sample line. Run:

```bash
npm test
npm run build
```

The checked-in plug-and-play acceptance test also registers the Acme definition in memory and proves runtime registration, normalization, and lossless vendor-field retention without changing the core pipeline.