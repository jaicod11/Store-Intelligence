const { format, eachDayOfInterval, parseISO } = require('date-fns');
const DailyStat = require('../models/DailyStat');
const Alert = require('../models/Alert');
const Detection = require('../models/Detection');

function _emptyDay(date, cameraId = 'cam1') {
    return {
        date,
        cameraId,
        totalPeople: 0,
        maleCount: 0,
        femaleCount: 0,
        unknownGenderCount: 0,
        totalDwellSeconds: 0,
        dwellSampleCount: 0,
        avgDwellSeconds: 0,
        alertCounts: { intrusion: 0, crowd: 0, abnormal: 0, loitering: 0, total: 0 },
    };
}

// Adds a computed avgDwellSeconds field without storing it directly
function _withAvgDwell(doc) {
    const totalDwellSeconds = doc.totalDwellSeconds || 0;
    const dwellSampleCount = doc.dwellSampleCount || 0;
    return {
        ...doc,
        avgDwellSeconds: dwellSampleCount > 0 ? totalDwellSeconds / dwellSampleCount : 0,
    };
}

async function getTodayStats(cameraId = 'cam1') {
    const today = format(new Date(), 'yyyy-MM-dd');
    const doc = await DailyStat.findOne({ date: today, cameraId }).lean();
    return _withAvgDwell(doc || _emptyDay(today, cameraId));
}

async function getStatsByDate(date, cameraId = 'cam1') {
    const doc = await DailyStat.findOne({ date, cameraId }).lean();
    return _withAvgDwell(doc || _emptyDay(date, cameraId));
}

async function getStatsByRange(from, to, cameraId = 'cam1') {
    const rows = await DailyStat.find({
        date: { $gte: from, $lte: to },
        cameraId,
    }).sort({ date: 1 }).lean();

    const map = Object.fromEntries(rows.map((r) => [r.date, r]));

    const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) });

    return days.map((d) => {
        const ds = format(d, 'yyyy-MM-dd');
        return _withAvgDwell(map[ds] || _emptyDay(ds, cameraId));
    });
}

async function getAlertsForDate(date, cameraId = 'cam1') {
    return Alert.find({
        cameraId,
        timestamp: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`),
        },
    }).sort({ timestamp: -1 }).lean();
}

async function getAlertsForRange(from, to, cameraId = 'cam1') {
    return Alert.find({
        cameraId,
        timestamp: {
            $gte: new Date(`${from}T00:00:00.000Z`),
            $lte: new Date(`${to}T23:59:59.999Z`),
        },
    }).sort({ timestamp: -1 }).lean();
}

// NEW — hourly people-count aggregation for the Statistics page chart.
// Groups Detection snapshots by hour-of-day in IST.
async function getHourlyPeopleCounts(date, cameraId = 'cam1') {
    const rows = await Detection.aggregate([
        { $match: { date, cameraId } },
        {
            $group: {
                _id: { $hour: { date: '$timestamp', timezone: 'Asia/Kolkata' } },
                avgPeople: { $avg: '$peopleCount' },
                maxPeople: { $max: '$peopleCount' },
                sampleCount: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const map = Object.fromEntries(rows.map((r) => [r._id, r]));

    return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        avgPeople: map[hour] ? Math.round(map[hour].avgPeople * 10) / 10 : 0,
        maxPeople: map[hour] ? map[hour].maxPeople : 0,
        sampleCount: map[hour] ? map[hour].sampleCount : 0,
    }));
}

module.exports = {
    getTodayStats,
    getStatsByDate,
    getStatsByRange,
    getAlertsForDate,
    getAlertsForRange,
    getHourlyPeopleCounts,
};