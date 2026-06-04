const { format } = require('date-fns');

function _divider(doc) {
    const x1 = doc.page.margins.left;
    const x2 = doc.page.width - doc.page.margins.right;
    doc.moveTo(x1, doc.y).lineTo(x2, doc.y)
        .strokeColor('#cccccc').lineWidth(0.5).stroke()
        .strokeColor('#000000').lineWidth(1);
}

function _row(doc, label, value) {
    doc.fontSize(12).font('Helvetica-Bold')
        .text(`${label}:  `, { continued: true })
        .font('Helvetica').text(String(value));
}

function generateReport(doc, { period, stats, alerts, generatedAt }) {
    const vb = stats.vehicleBreakdown || {};
    const ac = stats.alertCounts || {};

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(26).font('Helvetica-Bold')
        .text('Store Intelligence Report', { align: 'center' });
    doc.moveDown(0.4);

    doc.fontSize(14).font('Helvetica')
        .fillColor('#444444')
        .text(`Period: ${period}`, { align: 'center' });
    doc.moveDown(0.3);

    const genDay = format(generatedAt, 'EEEE, MMMM d, yyyy');
    const genTime = format(generatedAt, 'HH:mm:ss');
    doc.fontSize(10).fillColor('#888888')
        .text(`Generated on: ${genDay}  ·  ${genTime}`, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(2);

    // ── Summary ──────────────────────────────────────────────────────────────
    doc.fontSize(16).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    _divider(doc);
    doc.moveDown(0.5);

    _row(doc, 'Total people detected', stats.totalPeople || 0);
    _row(doc, 'Total vehicles detected', stats.totalVehicles || 0);
    _row(doc, 'Total alerts triggered', ac.total || 0);
    doc.moveDown(1.5);

    // ── People breakdown ─────────────────────────────────────────────────────
    doc.fontSize(16).font('Helvetica-Bold').text('People Breakdown');
    doc.moveDown(0.3);
    _divider(doc);
    doc.moveDown(0.5);

    _row(doc, 'Male', stats.maleCount || 0);
    _row(doc, 'Female', stats.femaleCount || 0);
    _row(doc, 'Unknown gender', stats.unknownGenderCount || 0);
    doc.moveDown(1.5);

    // ── Vehicle breakdown ────────────────────────────────────────────────────
    doc.fontSize(16).font('Helvetica-Bold').text('Vehicle Breakdown');
    doc.moveDown(0.3);
    _divider(doc);
    doc.moveDown(0.5);

    [
        ['Cars', vb.car || 0],
        ['Trucks', vb.truck || 0],
        ['Motorcycles', vb.motorcycle || 0],
        ['Buses', vb.bus || 0],
        ['Bicycles', vb.bicycle || 0],
    ].forEach(([label, val]) => _row(doc, label, val));
    doc.moveDown(1.5);

    // ── Alert breakdown ──────────────────────────────────────────────────────
    doc.fontSize(16).font('Helvetica-Bold').text('Alert Breakdown');
    doc.moveDown(0.3);
    _divider(doc);
    doc.moveDown(0.5);

    _row(doc, 'Intrusion alerts', ac.intrusion || 0);
    _row(doc, 'Crowd alerts', ac.crowd || 0);
    _row(doc, 'Abnormal alerts', ac.abnormal || 0);
    doc.moveDown(1.5);

    // ── Alert log ────────────────────────────────────────────────────────────
    doc.fontSize(16).font('Helvetica-Bold').text('Alert Log');
    doc.moveDown(0.3);
    _divider(doc);
    doc.moveDown(0.5);

    if (!alerts || alerts.length === 0) {
        doc.fontSize(12).font('Helvetica').fillColor('#888888')
            .text('No alerts recorded for this period.');
        doc.fillColor('#000000');
    } else {
        const severityColor = { high: '#CC0000', medium: '#E07B00', low: '#007700' };

        alerts.forEach((alert, i) => {
            const ts = format(new Date(alert.timestamp), 'MMM d, yyyy  HH:mm:ss');
            const type = alert.alertType.charAt(0).toUpperCase() + alert.alertType.slice(1);
            const col = severityColor[alert.severity] || '#000000';

            doc.fontSize(12).font('Helvetica-Bold')
                .fillColor(col).text(`${i + 1}. [${type}]  `, { continued: true })
                .fillColor('#000000').font('Helvetica').text(alert.message);

            doc.fontSize(10).fillColor('#666666')
                .text(`      ${ts}   ·   severity: ${alert.severity}`);
            doc.fillColor('#000000').moveDown(0.4);
        });
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.fontSize(8).fillColor('#aaaaaa')
        .text(
            'Store Intelligence System  ·  Confidential',
            doc.page.margins.left,
            doc.page.height - doc.page.margins.bottom - 16,
            { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
        );
}

module.exports = { generateReport };