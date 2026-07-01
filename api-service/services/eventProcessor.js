const { format } = require('date-fns');
const Alert = require('../models/Alert');
const DailyStat = require('../models/DailyStat');
const Detection = require('../models/Detection');
const alertEngine = require('./alertEngine');
const { getSocketIO } = require('../socket/socketManager');

let _todayStr = null;
let _seenPeople = new Set();
let _maleIds = new Set();
let _femaleIds = new Set();

let _lastFlush = Date.now();
const FLUSH_INTERVAL_MS = 5000;

let _lastSnapshotTime = 0;
const SNAPSHOT_INTERVAL_MS = 10_000;

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
        console.log(`📅  Day rolled over → accumulator reset for ${today}`);
    }
}

async function processDetectionEvent(event) {
    _resetIfNewDay();

    for (const person of event.people || []) {
        const id = person.track_id;
        if (id && id !== -1) {
            _seenPeople.add(id);
            if (person.gender === 'male') _maleIds.add(id);
            if (person.gender === 'female') _femaleIds.add(id);
        }
    }

    const now = Date.now();
    if (now - _lastFlush >= FLUSH_INTERVAL_MS) {
        _lastFlush = now;
        await _flushToDB();
    }

    if (now - _lastSnapshotTime >= SNAPSHOT_INTERVAL_MS) {
        _lastSnapshotTime = now;
        await _saveSnapshot(event);
    }

    const io = getSocketIO();
    if (io) {
        io.emit('detection:update', {
            timestamp: event.timestamp,
            peopleCount: event.people_count,
        });
    }
}

async function _saveSnapshot(event) {
    try {
        const ts = event.timestamp ? new Date(event.timestamp) : new Date();
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

            crowdDetected: event.crowd_detected || false,

            people: (event.people || []).map((p) => ({
                trackId: p.track_id,
                gender: p.gender || null,
                confidence: p.confidence,
            })),
        });
    } catch (err) {
        console.error('[eventProcessor] Snapshot save failed:', err.message);
    }
}

async function processAlertEvent(event) {
    const processed = alertEngine.processAlert(event);
    if (!processed) return;

    const alert = await Alert.create(processed);

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

async function _flushToDB() {
    const today = _todayStr || _todayDate();

    await DailyStat.findOneAndUpdate(
        { date: today, cameraId: 'cam1' },
        {
            $set: {
                totalPeople: _seenPeople.size,
                maleCount: _maleIds.size,
                femaleCount: _femaleIds.size,
                unknownGenderCount: _seenPeople.size - _maleIds.size - _femaleIds.size,
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

async function processDwellEvent(event) {
    try {
        const ts = event.timestamp ? new Date(event.timestamp) : new Date();
        const date = format(ts, 'yyyy-MM-dd');
        const cameraId = event.camera_id || 'cam1';

        await DailyStat.findOneAndUpdate(
            { date, cameraId },
            {
                $inc: {
                    totalDwellSeconds: event.dwell_seconds || 0,
                    dwellSampleCount: 1,
                },
                $set: { updatedAt: new Date() },
                $setOnInsert: {
                    date,
                    cameraId,
                    alertCounts: { intrusion: 0, crowd: 0, abnormal: 0, loitering: 0, total: 0 },
                },
            },
            { upsert: true }
        );
    } catch (err) {
        console.error('[eventProcessor] Dwell event processing failed:', err.message);
    }
}

module.exports = { processDetectionEvent, processAlertEvent, processDwellEvent };