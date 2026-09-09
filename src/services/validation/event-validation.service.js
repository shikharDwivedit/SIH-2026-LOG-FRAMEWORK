const { ProcessingStatus } = require("../../constants/status.constants");

class EventValidationService {
  validate(universalEvent) {
    const errors = [];

    if (!universalEvent.event_id) errors.push("Missing mandatory field: event_id");
    if (!universalEvent.schema_version) errors.push("Missing mandatory field: schema_version");
    if (!universalEvent.raw_ref || !universalEvent.raw_ref.hash) {
      errors.push("Missing raw reference hash");
    }
    if (!universalEvent.event || !universalEvent.event.timestamp) {
      errors.push("Missing event timestamp");
    }

    if (errors.length > 0) {
      universalEvent.processing.status = ProcessingStatus.VALIDATION_ERROR;
      universalEvent.processing.errors.push(...errors);
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }
}

const eventValidationService = new EventValidationService();

module.exports = { eventValidationService, EventValidationService };
