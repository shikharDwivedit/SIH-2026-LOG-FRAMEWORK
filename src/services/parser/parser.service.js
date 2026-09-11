class ParserService {
  parse(rawContent, parserConfig) {
    if (!parserConfig) {
      return {
        extracted: {},
        parser_name: "unparsed",
        parser_version: "0.0",
        success: false
      };
    }

    const extracted = {};
    let success = false;

    try {
      const type = parserConfig.extraction?.type || parserConfig.format;

      if (type === "key-value") {
        const kvPairs = rawContent.match(/\b([a-zA-Z0-9_\-\.]+)=("[^"]*"|\S+)/g) || [];
        for (const pair of kvPairs) {
          const eqIdx = pair.indexOf("=");
          if (eqIdx > 0) {
            const k = pair.substring(0, eqIdx).trim();
            let v = pair.substring(eqIdx + 1).trim();
            if (v.startsWith('"') && v.endsWith('"')) {
              v = v.substring(1, v.length - 1);
            }
            extracted[k] = v;
          }
        }
        success = Object.keys(extracted).length > 0;
      } else if (type === "regex" && parserConfig.extraction?.pattern) {
        const re = new RegExp(parserConfig.extraction.pattern, "i");
        const match = re.exec(rawContent);
        if (match && match.groups) {
          Object.assign(extracted, match.groups);
          success = true;
        } else if (match) {
          for (let i = 1; i < match.length; i++) {
            extracted[`group_${i}`] = match[i];
          }
          success = true;
        }
      } else if (type === "json") {
        const parsedJson = JSON.parse(rawContent);
        Object.assign(extracted, parsedJson);
        success = true;
      } else if (type === "cef") {
        const cefContent = rawContent.trim().replace(/^.*?CEF:/i, "CEF:");
        const sections = cefContent.split("|");
        if (sections.length < 8 || !/^CEF:\d+$/i.test(sections[0])) {
          throw new Error("Invalid CEF header");
        }

        const headerFields = [
          "version",
          "device_vendor",
          "device_product",
          "device_version",
          "signature_id",
          "name",
          "severity"
        ];
        headerFields.forEach((field, index) => {
          extracted[field] = sections[index + 1];
        });

        const extension = sections.slice(7).join("|");
        const extensionPattern = /([a-zA-Z][a-zA-Z0-9_]*)=("(?:[^"\\]|\\.)*"|\S+)/g;
        let match;
        while ((match = extensionPattern.exec(extension)) !== null) {
          extracted[match[1]] = match[2]
            .replace(/^"|"$/g, "")
            .replace(/\\([=|\\])/g, "$1")
            .replace(/\\n/g, "\n");
        }
        success = true;
      }
    } catch (err) {
      success = false;
    }

    return {
      extracted,
      parser_name: parserConfig.name,
      parser_version: parserConfig.version || "1.0",
      vendor: parserConfig.vendor,
      product: parserConfig.product,
      device_type: parserConfig.device_type,
      field_mappings: parserConfig.field_mappings || {},
      success
    };
  }
}

const parserService = new ParserService();

module.exports = { parserService, ParserService };
