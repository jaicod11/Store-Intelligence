const COOLDOWN_MS = {
    intrusion: 12_000,
    crowd: 30_000,
    abnormal: 20_000,
    loitering: 60_000,
};

// In-memory map:  `${cameraId}:${alertType}` → last processed timestamp (ms)
const _lastSeen = new Map();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Decide whether this alert should be processed.
 * Returns true the first time an (camera, type) pair is seen, and again
 * only after its cooldown has elapsed.
 *
 * @param {string} cameraId
 * @param {string} alertType  'intrusion' | 'crowd' | 'abnormal'
 * @returns {boolean}
 */
function shouldProcess(cameraId, alertType) {
    const key = `${cameraId}:${alertType}`;
    const now = Date.now();
    const last = _lastSeen.get(key) ?? 0;
    const cooldown = COOLDOWN_MS[alertType] ?? 15_000;

    if (now - last < cooldown) {
        return false;
    }

    _lastSeen.set(key, now);
    return true;
}

/**
 * Derive severity from alert type and optional metadata.
 *
 * @param {string} alertType
 * @param {object} metadata
 * @returns {'low'|'medium'|'high'}
 */
function classifySeverity(alertType, metadata = {}) {
    switch (alertType) {
        case 'intrusion':
            return 'high';

        case 'abnormal':
            return 'high';

        case 'loitering':
            return 'medium';

        case 'crowd': {
            const count = metadata.count ?? 0;
            const threshold = metadata.threshold ?? 10;
            if (count >= threshold * 2.0) return 'high';
            if (count >= threshold * 1.5) return 'medium';
            return 'low';
        }

        default:
            return 'medium';
    }
}

/**
 * Return a clean, user-facing alert message.
 *
 * @param {string} alertType
 * @param {string} rawMessage   Original message from CV service
 * @param {object} metadata
 * @returns {string}
 */
function formatMessage(alertType, rawMessage, metadata = {}) {
    switch (alertType) {
        case 'intrusion':
            return rawMessage ||
                `Person entered restricted area: ${metadata.zone_name ?? 'unknown zone'}`;

        case 'crowd':
            return `Too much crowd detected — ${metadata.count ?? '?'} people in frame`;

        case 'abnormal':
            return rawMessage || 'Abnormal activity detected in camera feed';

        case 'loitering':
            return rawMessage || 'Person loitering detected';

        default:
            return rawMessage ?? 'Unknown alert';
    }
}

/**
 * Full pipeline: validate → deduplicate → classify → normalise.
 * Returns a ready-to-save alert object, or null if the alert should be
 * dropped (duplicate within cooldown window).
 *
 * @param {object} event   Raw alert event from Redis
 * @returns {{ alertType, message, severity, metadata, cameraId, timestamp }|null}
 */
function processAlert(event) {
    const {
        alert_type: alertType,
        camera_id: cameraId = 'cam1',
        message: rawMessage,
        metadata = {},
        timestamp,
    } = event;

    if (!alertType) {
        console.warn('[alertEngine] Received alert with no alert_type — dropped.');
        return null;
    }

    if (!shouldProcess(cameraId, alertType)) {
        console.log(
            `[alertEngine] Duplicate suppressed — [${alertType}] on ${cameraId}`
        );
        return null;
    }

    return {
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        cameraId,
        alertType,
        message: formatMessage(alertType, rawMessage, metadata),
        severity: classifySeverity(alertType, metadata),
        metadata,
    };
}

/**
 * Reset all cooldown state (useful for testing).
 */
function reset() {
    _lastSeen.clear();
}

module.exports = {
    shouldProcess,
    classifySeverity,
    formatMessage,
    processAlert,
    reset,
};