const express = require('express');
const router = express.Router();
const { format } = require('date-fns');
const {
    getTodayStats,
    getStatsByDate,
    getStatsByRange,
    getHourlyPeopleCounts,
} = require('../services/statsService');

router.get('/today', async (req, res, next) => {
    try {
        const data = await getTodayStats();
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// NEW — GET /api/stats/hourly?date=YYYY-MM-DD
router.get('/hourly', async (req, res, next) => {
    try {
        const { date } = req.query;
        const targetDate = date || format(new Date(), 'yyyy-MM-dd');
        const data = await getHourlyPeopleCounts(targetDate);
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
    try {
        const { date, from, to } = req.query;
        let data;

        if (from && to) {
            data = await getStatsByRange(from, to);
        } else if (date) {
            data = await getStatsByDate(date);
        } else {
            data = await getTodayStats();
        }

        res.json({ success: true, data });
    } catch (err) { next(err); }
});

module.exports = router;