const express = require('express');
const router = express.Router();
const {
    getTodayStats,
    getStatsByDate,
    getStatsByRange,
} = require('../services/statsService');

// GET /api/stats/today
router.get('/today', async (req, res, next) => {
    try {
        const data = await getTodayStats();
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// GET /api/stats?date=YYYY-MM-DD
// GET /api/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
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