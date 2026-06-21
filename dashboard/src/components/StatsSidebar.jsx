import React, { useState } from 'react';
import { format } from 'date-fns';
import { statsApi, alertsApi, reportsApi } from '../api/client';
import useAlertStore from '../store/useAlertStore';

const today = format(new Date(), 'yyyy-MM-dd');

function Row({ label, value, color = 'text-slate-300' }) {
    return (
        <div className="flex items-center justify-between py-0.5">
            <span className="text-slate-500 text-xs">{label}</span>
            <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
            <div className="bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 space-y-0.5">
                {children}
            </div>
        </div>
    );
}

export default function StatsSidebar() {
    const todayStats = useAlertStore((s) => s.todayStats);

    const [mode, setMode] = useState('date');
    const [selDate, setSelDate] = useState(today);
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reporting, setReport] = useState(false);
    const [error, setError] = useState('');

    const display = stats || todayStats;
    const ac = display?.alertCounts ?? {};

    async function handleQuery() {
        setLoading(true);
        setError('');
        try {
            if (mode === 'date') {
                const [sr, ar] = await Promise.all([
                    statsApi.getByDate(selDate),
                    alertsApi.getByDate(selDate),
                ]);
                setStats(sr.data);
                setAlerts(ar.data);
            } else {
                if (from > to) { setError('From date must be before To date'); setLoading(false); return; }
                const [sr, ar] = await Promise.all([
                    statsApi.getByRange(from, to),
                    alertsApi.getByRange(from, to),
                ]);
                const list = Array.isArray(sr.data) ? sr.data : [sr.data];
                const agg = list.reduce(
                    (acc, s) => {
                        acc.totalPeople += s.totalPeople || 0;
                        acc.maleCount += s.maleCount || 0;
                        acc.femaleCount += s.femaleCount || 0;
                        acc.unknownGenderCount += s.unknownGenderCount || 0;
                        acc.alertCounts.intrusion += s.alertCounts?.intrusion || 0;
                        acc.alertCounts.crowd += s.alertCounts?.crowd || 0;
                        acc.alertCounts.abnormal += s.alertCounts?.abnormal || 0;
                        acc.alertCounts.total += s.alertCounts?.total || 0;
                        return acc;
                    },
                    {
                        totalPeople: 0, maleCount: 0, femaleCount: 0, unknownGenderCount: 0,
                        alertCounts: { intrusion: 0, crowd: 0, abnormal: 0, total: 0 },
                    }
                );
                setStats(agg);
                setAlerts(ar.data);
            }
        } catch (e) {
            setError('Failed to load stats. Try again.');
        } finally {
            setLoading(false);
        }
    }

    async function handleReport() {
        setReport(true);
        try {
            const body = mode === 'date' ? { date: selDate } : { from, to };
            const res = await reportsApi.generate(body);
            const blob = res instanceof Blob ? res : new Blob([res], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `store-report-${mode === 'date' ? selDate : `${from}_${to}`}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            setError('Report generation failed.');
        } finally {
            setReport(false);
        }
    }

    return (
        <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">

            <div className="p-4 border-b border-slate-800 space-y-3">
                <p className="text-white text-sm font-semibold">Detailed Statistics</p>

                <div className="flex rounded-lg overflow-hidden border border-slate-700">
                    {['date', 'range'].map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setStats(null); setAlerts(null); }}
                            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {m === 'date' ? 'Single Day' : 'Date Range'}
                        </button>
                    ))}
                </div>

                {mode === 'date' ? (
                    <input
                        type="date" value={selDate} max={today}
                        onChange={(e) => setSelDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    />
                ) : (
                    <div className="space-y-2">
                        {[['From', from, setFrom], ['To', to, setTo]].map(([label, val, setter]) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className="text-slate-500 text-xs w-7">{label}</span>
                                <input
                                    type="date" value={val} max={today}
                                    onChange={(e) => setter(e.target.value)}
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                    onClick={handleQuery} disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                    {loading ? 'Loading…' : 'View Stats'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {display && (
                    <>
                        <Section title="People">
                            <Row label="Total" value={display.totalPeople ?? 0} color="text-blue-400" />
                            <Row label="Male" value={display.maleCount ?? 0} color="text-sky-400" />
                            <Row label="Female" value={display.femaleCount ?? 0} color="text-pink-400" />
                            <Row label="Unknown gender" value={display.unknownGenderCount ?? 0} />
                        </Section>

                        <Section title="Alerts">
                            <Row label="Total" value={ac.total ?? 0} color="text-red-400" />
                            <Row label="Intrusion" value={ac.intrusion ?? 0} color="text-red-400" />
                            <Row label="Crowd" value={ac.crowd ?? 0} color="text-amber-400" />
                            <Row label="Abnormal" value={ac.abnormal ?? 0} color="text-purple-400" />
                        </Section>
                    </>
                )}

                {alerts && alerts.length > 0 && (
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Alert Log</p>
                        <div className="space-y-1.5">
                            {alerts.map((alert, i) => (
                                <div key={alert._id || i} className="bg-slate-800 rounded-lg p-2.5 border border-slate-700">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded text-white bg-slate-600">
                                            {alert.alertType.toUpperCase()}
                                        </span>
                                        <span className="text-slate-500 text-xs font-mono">
                                            {format(new Date(alert.timestamp), 'HH:mm:ss')}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-xs leading-relaxed">{alert.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {alerts && alerts.length === 0 && (
                    <p className="text-slate-600 text-xs text-center py-4">No alerts for this period.</p>
                )}
            </div>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleReport} disabled={reporting}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {reporting
                        ? <><span className="animate-spin inline-block">⏳</span> Generating…</>
                        : <>📄 Generate PDF Report</>}
                </button>
                <p className="text-slate-700 text-xs text-center mt-1.5 truncate">
                    {mode === 'date' ? selDate : `${from} → ${to}`}
                </p>
            </div>
        </aside>
    );
}