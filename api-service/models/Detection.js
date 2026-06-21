const mongoose = require('mongoose');

const personDetailSchema = new mongoose.Schema(
    {
        trackId: { type: Number },
        gender: { type: String, enum: ['male', 'female', null], default: null },
        confidence: { type: Number },
    },
    { _id: false }
);

const detectionSchema = new mongoose.Schema(
    {
        timestamp: { type: Date, required: true },
        cameraId: { type: String, default: 'cam1', index: true },
        date: { type: String, index: true },
        frameId: { type: Number },

        peopleCount: { type: Number, default: 0 },
        maleCount: { type: Number, default: 0 },
        femaleCount: { type: Number, default: 0 },

        crowdDetected: { type: Boolean, default: false },

        people: { type: [personDetailSchema], default: [] },
    },
    { timestamps: false }
);

detectionSchema.index({ cameraId: 1, timestamp: -1 });
detectionSchema.index({ date: 1, cameraId: 1, timestamp: 1 });
detectionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('Detection', detectionSchema);