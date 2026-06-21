const { format, eachDayOfInterval, parseISO } = require('date-fns');
const DailyStat = require('../models/DailyStat');
const Alert = require('../models/Alert');

function _emptyDay(date, cameraId = 'cam1') {
    return {
        date,
        cameraId,
        totalPeople: 0,
        maleCount: 0,
        femaleCount: 0,
        unknownGenderCount: 0,
        alertCounts: { intrusion: 0, crowd: 0, abnormal: 0, total: 0 },
    };
}

async function getTodayStats(cameraId = 'cam1') {
    const today = format(new Date(), 'yyyy-MM-dd');
    return (await DailyStat.findOne({ date: today, cameraId }).lean()) ||
        _emptyDay(today, cameraId);
}

async function getStatsByDate(date, cameraId = 'cam1') {
    return (await DailyStat.findOne({ date, cameraId }).lean()) ||
        _emptyDay(date, cameraId);
}

async function getStatsByRange(from, to, cameraId = 'cam1') {
    const rows = await DailyStat.find({
        date: { $gte: from, $lte: to },
        cameraId,
    }).sort({ date: 1 }).lean();

    const map = Object.fromEntries(rows.map((r) => [r.date, r]));

    const days = eachDayOfInterval({
        start: parseISO(from),
        end: parseISO(to),
    });

    return days.map((d) => {
        const ds = format(d, 'yyyy-MM-dd');
        return map[ds] || _emptyDay(ds, cameraId);
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

module.exports = {
    getTodayStats,
    getStatsByDate,
    getStatsByRange,
    getAlertsForDate,
    getAlertsForRange,
};