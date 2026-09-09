class AnomalyDetector {
  static analyze(event) {
    let score = 0.0;
    const reasons = [];

    const action = (event.event?.action || '').toLowerCase();
    const severity = (event.event?.severity || '').toLowerCase();
    const srcPort = event.network?.source_port || 0;
    const status = event.processing?.status;

    if (['deny', 'drop', 'blocked', 'failed'].includes(action)) {
      score += 0.35;
      reasons.push(`Blocked action detected ('${action}')`);
    }

    if (['critical', 'high', 'emergency'].includes(severity)) {
      score += 0.4;
      reasons.push(`High severity security event ('${severity}')`);
    }

    if (srcPort === 31337 || srcPort === 4444 || srcPort === 6667) {
      score += 0.5;
      reasons.push(`Known backdoor/suspicious source port (${srcPort})`);
    }

    if (status === 'UNSUPPORTED' || status === 'PARSER_ERROR') {
      score += 0.25;
      reasons.push(`Processing failure / unparsed event format`);
    }

    const finalScore = Math.min(1.0, parseFloat(score.toFixed(2)));
    const isAnomaly = finalScore >= 0.5;

    return {
      isAnomaly,
      score: finalScore,
      reasons,
      recommendedAction: isAnomaly ? "Escalate to SOC analyst & check firewall rules" : "Normal perimeter event"
    };
  }
}

module.exports = { AnomalyDetector };
