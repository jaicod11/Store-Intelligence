const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
    {
        timestamp: { type: Date, required: true, index: true },
        cameraId: { type: String, default: 'cam1', index: true },
        alertType: {
            type: String,
            enum: ['intrusion', 'crowd', 'abnormal'],
            required: true,
            index: true,
        },
        message: { type: String, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: false }
);

// Fast date-range + type queries
alertSchema.index({ timestamp: -1, alertType: 1 });
alertSchema.index({ cameraId: 1, timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);