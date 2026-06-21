const mongoose = require('mongoose');

const alertCountsSchema = new mongoose.Schema(
    {
        intrusion: { type: Number, default: 0 },
        crowd: { type: Number, default: 0 },
        abnormal: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
    },
    { _id: false }
);

const dailyStatSchema = new mongoose.Schema(
    {
        date: { type: String, required: true },
        cameraId: { type: String, default: 'cam1' },

        totalPeople: { type: Number, default: 0 },
        maleCount: { type: Number, default: 0 },
        femaleCount: { type: Number, default: 0 },
        unknownGenderCount: { type: Number, default: 0 },

        alertCounts: { type: alertCountsSchema, default: () => ({}) },

        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

dailyStatSchema.index({ date: 1, cameraId: 1 }, { unique: true });
dailyStatSchema.index({ date: 1 });

module.exports = mongoose.model('DailyStat', dailyStatSchema);