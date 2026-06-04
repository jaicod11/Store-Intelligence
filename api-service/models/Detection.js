const mongoose = require('mongoose');

/**
 * Detection snapshot — saved every ~10 seconds (throttled inside eventProcessor).
 * Not every frame, just enough to reconstruct what was happening at any point in
 * time and power historical analytics beyond what DailyStat aggregates.
 */

const personDetailSchema = new mongoose.Schema(
    {
        trackId: { type: Number },
        gender: { type: String, enum: ['male', 'female', null], default: null },
        confidence: { type: Number },
    },
    { _id: false }
);

const vehicleDetailSchema = new mongoose.Schema(
    {
        trackId: { type: Number },
        vehicleType: {
            type: String,
            enum: ['car', 'truck', 'motorcycle', 'bus', 'bicycle', 'unknown'],
        },
        confidence: { type: Number },
    },
    { _id: false }
);

const vehicleCountSchema = new mongoose.Schema(
    {
        car: { type: Number, default: 0 },
        truck: { type: Number, default: 0 },
        motorcycle: { type: Number, default: 0 },
        bus: { type: Number, default: 0 },
        bicycle: { type: Number, default: 0 },
    },
    { _id: false }
);

const detectionSchema = new mongoose.Schema(
    {
        timestamp: { type: Date, required: true },
        cameraId: { type: String, default: 'cam1', index: true },
        date: { type: String, index: true },   // 'YYYY-MM-DD' — fast date-only queries
        frameId: { type: Number },

        // ── Counts ────────────────────────────────────────────────────────────
        peopleCount: { type: Number, default: 0 },
        maleCount: { type: Number, default: 0 },
        femaleCount: { type: Number, default: 0 },
        vehicleCount: { type: Number, default: 0 },

        // ── Vehicle breakdown for this snapshot ───────────────────────────────
        vehicleBreakdown: {
            type: vehicleCountSchema,
            default: () => ({}),
        },

        // ── Flags ─────────────────────────────────────────────────────────────
        crowdDetected: { type: Boolean, default: false },

        // ── Individual detections (trimmed — track ID + gender/type only) ─────
        // Kept small deliberately: bboxes are not stored (no PII concern).
        people: { type: [personDetailSchema], default: [] },
        vehicles: { type: [vehicleDetailSchema], default: [] },
    },
    { timestamps: false }
);

// Compound index for time-range queries per camera
detectionSchema.index({ cameraId: 1, timestamp: -1 });
// Date-based bucket queries (hourly breakdown, etc.)
detectionSchema.index({ date: 1, cameraId: 1, timestamp: 1 });

// Auto-expire old snapshots after 30 days to keep collection lean
detectionSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 30 }
);

module.exports = mongoose.model('Detection', detectionSchema);