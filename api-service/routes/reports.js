const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const {
    getStatsByDate,
    getStatsByRange,
    getAlertsForDate,
    getAlertsForRange,
} = require('../services/statsService');
const { generateReport } = require('../services/reportService');

// POST /api/reports/generate
// Body: { date: "YYYY-MM-DD" }  or  { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
router.post('/generate', async (req, res, next) => {
    try {
        const { date, from, to } = req.body;
        let stats, alerts, period;

        if (from && to) {
            // ── Range report: aggregate all days ──────────────────────────────
            const statsList = await getStatsByRange(from, to);
            alerts = await getAlertsForRange(from, to);
            period = `${from}  to  ${to}`;
            stats = statsList.reduce(
                (acc, s) => {
                    acc.totalPeople += s.totalPeople;
                    acc.maleCount += s.maleCount;
                    acc.femaleCount += s.femaleCount;
                    acc.unknownGenderCount += s.unknownGenderCount;
                    acc.totalVehicles += s.totalVehicles;
                    ['car', 'truck', 'motorcycle', 'bus', 'bicycle'].forEach((t) => {
                        acc.vehicleBreakdown[t] += s.vehicleBreakdown?.[t] || 0;
                    });
                    acc.alertCounts.intrusion += s.alertCounts?.intrusion || 0;
                    acc.alertCounts.crowd += s.alertCounts?.crowd || 0;
                    acc.alertCounts.abnormal += s.alertCounts?.abnormal || 0;
                    acc.alertCounts.total += s.alertCounts?.total || 0;
                    return acc;
                },
                {
                    totalPeople: 0, maleCount: 0, femaleCount: 0, unknownGenderCount: 0,
                    totalVehicles: 0,
                    vehicleBreakdown: { car: 0, truck: 0, motorcycle: 0, bus: 0, bicycle: 0 },
                    alertCounts: { intrusion: 0, crowd: 0, abnormal: 0, total: 0 },
                }
            );
        } else {
            // ── Single-day report ─────────────────────────────────────────────
            const targetDate = date || format(new Date(), 'yyyy-MM-dd');
            stats = await getStatsByDate(targetDate);
            alerts = await getAlertsForDate(targetDate);
            period = targetDate;
        }

        const generatedAt = new Date();
        const safePeriod = period.replace(/\s+/g, '_');
        const fileName = `store-intelligence-${safePeriod}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);
        generateReport(doc, { period, stats, alerts, generatedAt });
        doc.end();

    } catch (err) { next(err); }
});

module.exports = router;