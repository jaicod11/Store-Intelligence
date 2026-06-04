const { format } = require('date-fns');
const Alert = require('../models/Alert');
const DailyStat = require('../models/DailyStat');
const Detection = require('../models/Detection');
const { getSocketIO } = require('../socket/socketManager');
const alertEngine = require('./alertEngine');

// ── In-memory accumulators (reset at midnight) ──────────────────────────────
let _todayStr = null;
let _seenPeople = new Set();     // unique person track IDs
let _maleIds = new Set();
let _femaleIds = new Set();
let _seenVehicles = new Map();   // trackId → vehicleType
let _lastSnapshotTime = 0;
const SNAPSHOT_INTERVAL_MS = 10_000;

// Throttle DB writes: flush every 5 seconds
let _lastFlush = Date.now();
const FLUSH_INTERVAL_MS = 5000;

function _todayDate() {
    return format(new Date(), 'yyyy-MM-dd');
}

function _resetIfNewDay() {
    const today = _todayDate();
    if (_todayStr !== today) {
        _todayStr = today;
        _seenPeople = new Set();
        _maleIds = new Set();
        _femaleIds = new Set();
        _seenVehicles = new Map();
        console.log(`📅  Day rolled over → accumulator reset for ${today}`);
    }
}

// ── Detection events ─────────────────────────────────────────────────────────
async function processDetectionEvent(event) {
    _resetIfNewDay();

    // ── Accumulate unique people (unchanged) ──────────────────────────────────
    for (const person of event.people || []) {
        const id = person.track_id;
        if (id && id !== -1) {
            _seenPeople.add(id);
            if (person.gender === 'male') _maleIds.add(id);
            if (person.gender === 'female') _femaleIds.add(id);
        }
    }

    // ── Accumulate unique vehicles (unchanged) ────────────────────────────────
    for (const vehicle of event.vehicles || []) {
        const id = vehicle.track_id;
        if (id && id !== -1) {
            _seenVehicles.set(id, vehicle.vehicle_type);
        }
    }

    // ── Throttled DailyStat flush (unchanged) ─────────────────────────────────
    const now = Date.now();
    if (now - _lastFlush >= FLUSH_INTERVAL_MS) {
        _lastFlush = now;
        await _flushToDB();
    }

    // ── Throttled Detection snapshot save ────────────────────────────────────
    if (now - _lastSnapshotTime >= SNAPSHOT_INTERVAL_MS) {
        _lastSnapshotTime = now;
        await _saveSnapshot(event);
    }

    // ── Emit live count to dashboard (unchanged) ──────────────────────────────
    const io = getSocketIO();
    if (io) {
        io.emit('detection:update', {
            timestamp: event.timestamp,
            peopleCount: event.people_count,
            vehicleCount: event.vehicle_count,
        });
    }
}

async function _saveSnapshot(event) {
    try {
        const ts = event.timestamp ? new Date(event.timestamp) : new Date();

        // Build vehicle breakdown from this specific frame
        const vehicleBreakdown = { car: 0, truck: 0, motorcycle: 0, bus: 0, bicycle: 0 };
        for (const v of event.vehicles || []) {
            if (Object.prototype.hasOwnProperty.call(vehicleBreakdown, v.vehicle_type)) {
                vehicleBreakdown[v.vehicle_type]++;
            }
        }

        const maleInFrame = (event.people || []).filter((p) => p.gender === 'male').length;
        const femaleInFrame = (event.people || []).filter((p) => p.gender === 'female').length;

        await Detection.create({
            timestamp: ts,
            cameraId: event.camera_id || 'cam1',
            date: format(ts, 'yyyy-MM-dd'),
            frameId: event.frame_id,

            peopleCount: event.people_count || 0,
            maleCount: maleInFrame,
            femaleCount: femaleInFrame,
            vehicleCount: event.vehicle_count || 0,

            vehicleBreakdown,
            crowdDetected: event.crowd_detected || false,

            // Trim to track ID + gender/type only — no raw bboxes
            people: (event.people || []).map((p) => ({
                trackId: p.track_id,
                gender: p.gender || null,
                confidence: p.confidence,
            })),
            vehicles: (event.vehicles || []).map((v) => ({
                trackId: v.track_id,
                vehicleType: v.vehicle_type,
                confidence: v.confidence,
            })),
        });
    } catch (err) {
        console.error('[eventProcessor] Snapshot save failed:', err.message);
    }
}

// ── Alert events ─────────────────────────────────────────────────────────────
async function processAlertEvent(event) {
    // Run through the dedup + normalisation engine first
    const processed = alertEngine.processAlert(event);
    if (!processed) return;   // duplicate — silently dropped

    // Persist to MongoDB
    const alert = await Alert.create(processed);

    // Increment DailyStat alert counters
    const date = format(new Date(processed.timestamp), 'yyyy-MM-dd');
    await DailyStat.findOneAndUpdate(
        { date, cameraId: processed.cameraId },
        {
            $inc: {
                'alertCounts.total': 1,
                [`alertCounts.${processed.alertType}`]: 1,
            },
            $set: { updatedAt: new Date() },
            $setOnInsert: { date, cameraId: processed.cameraId },
        },
        { upsert: true }
    );

    // Push real-time alert to dashboard
    const io = getSocketIO();
    if (io) {
        io.emit('alert:new', {
            _id: alert._id,
            timestamp: alert.timestamp,
            alertType: alert.alertType,
            message: alert.message,
            severity: alert.severity,
        });
        console.log(`🚨  [${alert.alertType.toUpperCase()}] ${alert.message}`);
    }
}

// ── DB flush ─────────────────────────────────────────────────────────────────
async function _flushToDB() {
    const today = _todayStr || _todayDate();

    const vehicleBreakdown = {
        car: 0, truck: 0, motorcycle: 0, bus: 0, bicycle: 0,
    };
    for (const [, type] of _seenVehicles) {
        if (Object.prototype.hasOwnProperty.call(vehicleBreakdown, type)) {
            vehicleBreakdown[type]++;
        }
    }

    await DailyStat.findOneAndUpdate(
        { date: today, cameraId: 'cam1' },
        {
            $set: {
                totalPeople: _seenPeople.size,
                maleCount: _maleIds.size,
                femaleCount: _femaleIds.size,
                unknownGenderCount: _seenPeople.size - _maleIds.size - _femaleIds.size,
                totalVehicles: _seenVehicles.size,
                vehicleBreakdown,
                updatedAt: new Date(),
            },
            $setOnInsert: {
                date: today,
                cameraId: 'cam1',
                alertCounts: { intrusion: 0, crowd: 0, abnormal: 0, total: 0 },
            },
        },
        { upsert: true }
    );
}

module.exports = { processDetectionEvent, processAlertEvent };