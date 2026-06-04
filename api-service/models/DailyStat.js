const mongoose = require('mongoose');

const vehicleBreakdownSchema = new mongoose.Schema(
    {
        car: { type: Number, default: 0 },
        truck: { type: Number, default: 0 },
        motorcycle: { type: Number, default: 0 },
        bus: { type: Number, default: 0 },
        bicycle: { type: Number, default: 0 }
    },
    { _id: false }
);

const alertCountsSchema = new mongoose.Schema(
    {
        intrusion: { type: Number, default: 0 },
        crowd: { type: Number, default: 0 },
        abnormal: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    { _id: false }
);

const dailyStatSchema = new mongoose.Schema(
    {
        date: { type: String, required: true },   // 'YYYY-MM-DD'
        cameraId: { type: String, default: 'cam1' },

        // People
        totalPeople: { type: Number, default: 0 },
        maleCount: { type: Number, default: 0 },
        femaleCount: { type: Number, default: 0 },
        unknownGenderCount: { type: Number, default: 0 },

        // Vehicles
        totalVehicles: { type: Number, default: 0 },
        vehicleBreakdown: { type: vehicleBreakdownSchema, default: () => ({}) },

        // Alerts
        alertCounts: { type: alertCountsSchema, default: () => ({}) },

        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

// Unique per (date, camera)
dailyStatSchema.index({ date: 1, cameraId: 1 }, { unique: true });

module.exports = mongoose.model('DailyStat', dailyStatSchema);