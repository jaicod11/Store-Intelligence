const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { getAlertsForDate, getAlertsForRange } = require('../services/statsService');

// GET /api/alerts                   → last N recent alerts
// GET /api/alerts?date=YYYY-MM-DD   → all alerts that day
// GET /api/alerts?from=&to=         → date range
// GET /api/alerts?type=intrusion    → filter by type
// GET /api/alerts?limit=50          → recent count
router.get('/', async (req, res, next) => {
    try {
        const { date, from, to, type, limit = 50 } = req.query;
        let data;

        if (from && to) {
            data = await getAlertsForRange(from, to);
        } else if (date) {
            data = await getAlertsForDate(date);
        } else {
            const query = {};
            if (type) query.alertType = type;
            data = await Alert.find(query)
                .sort({ timestamp: -1 })
                .limit(Number(limit))
                .lean();
        }

        res.json({ success: true, data, count: data.length });
    } catch (err) { next(err); }
});

module.exports = router;