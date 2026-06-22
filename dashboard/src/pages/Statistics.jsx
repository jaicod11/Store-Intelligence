import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, FileText } from 'lucide-react';
import { statsApi, alertsApi, reportsApi } from '../api/client';
import useAlertStore from '../store/useAlertStore';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';

const today = format(new Date(), 'yyyy-MM-dd');

// MOCK — no hourly aggregation endpoint yet. Needs a backend route that
// groups the Detection collection by hour-of-day. Shape matches the
// mockup for now so the layout is correct once real data is wired in.
const MOCK_HOURLY = [9, 22.5, 36, 63, 85.5, 99, 76.5, 108, 94.5, 81, 67.5, 54, 40.5, 31.5, 13.5];
const HOURLY_LABELS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];

// MOCK — zone-level dwell/traffic tracking not implemented yet.
const MOCK_ZONES = [
    { zone: 'Checkout', pct: 90, color: 'var(--alert)' },
    { zone: 'Aisle 1', pct: 65, color: 'var(--warning)' },
    { zone: 'Aisle 3', pct: 80, color: 'var(--alert)' },
    { zone: 'Entrance', pct: 55, color: 'var(--warning)' },
    { zone: 'Back Room', pct: 30, color: 'var(--primary)' },
];

function StatBox({ label, value, color }) {
    return (
        <div className="rounded-lg p-4 flex flex-col gap-1 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>persons detected</div>
        </div>
    );
}

export default function Statistics({ onNavigate }) {
    const todayStats = useAlertStore((s) => s.todayStats);

    const [mode, setMode] = useState('date');
    const [selDate, setSelDate] = useState(today);
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [stats, setStats] = useState(null);
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
                const sr = await statsApi.getByDate(selDate);
                setStats(sr.data);
            } else {
                if (from > to) { setError('From date must be before To date'); setLoading(false); return; }
                const sr = await statsApi.getByRange(from, to);
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

    const hourlyMax = Math.max(...MOCK_HOURLY);
    const alertBars = [
        { label: 'Intrusion', value: ac.intrusion ?? 0, color: 'var(--alert)' },
        { label: 'Crowd', value: ac.crowd ?? 0, color: 'var(--warning)' },
        { label: 'Anomaly', value: ac.abnormal ?? 0, color: 'var(--info)' },
        { label: 'Loitering', value: 0, color: 'var(--primary)' }, // MOCK
    ];
    const alertMax = Math.max(1, ...alertBars.map((b) => b.value));

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--background)' }}>
            <TopBar />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="statistics" onNavigate={onNavigate} camerasOnline={8} camerasTotal={9} />

                <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                    {/* Header + controls */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-bold text-2xl" style={{ color: 'var(--foreground)' }}>Detailed Statistics</div>
                            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                {mode === 'date'
                                    ? format(new Date(selDate), 'EEEE, d MMMM yyyy')
                                    : `${from} to ${to}`}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex rounded-md overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                                {['date', 'range'].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => { setMode(m); setStats(null); }}
                                        className="text-xs px-4 py-2 font-bold"
                                        style={
                                            mode === m
                                                ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                                                : { color: 'var(--muted-foreground)' }
                                        }
                                    >
                                        {m === 'date' ? 'Single Day' : 'Date Range'}
                                    </button>
                                ))}
                            </div>

                            {mode === 'date' ? (
                                <div
                                    className="flex items-center gap-2 rounded-md px-3 py-2 border"
                                    style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                                >
                                    <input
                                        type="date" value={selDate} max={today}
                                        onChange={(e) => setSelDate(e.target.value)}
                                        className="text-sm bg-transparent outline-none"
                                        style={{ color: 'var(--foreground)' }}
                                    />
                                    <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {[['From', from, setFrom], ['To', to, setTo]].map(([label, val, setter]) => (
                                        <div
                                            key={label}
                                            className="flex items-center gap-2 rounded-md px-3 py-2 border"
                                            style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                                        >
                                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                                            <input
                                                type="date" value={val} max={today}
                                                onChange={(e) => setter(e.target.value)}
                                                className="text-sm bg-transparent outline-none"
                                                style={{ color: 'var(--foreground)' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleQuery} disabled={loading}
                                className="text-sm font-bold px-4 py-2 rounded-md border"
                                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                            >
                                {loading ? 'Loading…' : 'View'}
                            </button>

                            <button
                                onClick={handleReport} disabled={reporting}
                                className="text-sm font-bold px-4 py-2 rounded-md flex items-center gap-2"
                                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                            >
                                <FileText size={14} />
                                {reporting ? 'Generating…' : 'Generate PDF Report'}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-sm" style={{ color: 'var(--alert)' }}>{error}</p>}

                    {/* Stat boxes — REAL data */}
                    <div className="grid grid-cols-4 gap-4">
                        <StatBox label="Total" value={display?.totalPeople ?? 0} color="var(--primary)" />
                        <StatBox label="Male" value={display?.maleCount ?? 0} color="var(--info)" />
                        <StatBox label="Female" value={display?.femaleCount ?? 0} color="var(--warning)" />
                        <StatBox label="Unknown" value={display?.unknownGenderCount ?? 0} color="var(--muted-foreground)" />
                    </div>

                    {/* Hourly chart (MOCK) + Alert breakdown (REAL + mock loitering) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg p-5 flex flex-col gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>
                                People Count — Hourly
                            </div>
                            {/* MOCK — see comment at top of file */}
                            <div className="flex items-end gap-1" style={{ height: 120 }}>
                                {MOCK_HOURLY.map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                                        <div
                                            className="w-full rounded-sm"
                                            style={{
                                                height: `${(h / hourlyMax) * 110}px`,
                                                background: i === MOCK_HOURLY.length - 1 ? 'var(--primary)' : 'var(--secondary)',
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-1">
                                {HOURLY_LABELS.map((h) => (
                                    <div key={h} className="flex-1 text-center" style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>{h}</div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg p-5 flex flex-col gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>
                                Alert Types — Breakdown
                            </div>
                            <div className="flex items-end gap-6 px-4" style={{ height: 120 }}>
                                {alertBars.map((b) => (
                                    <div key={b.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                                        <div className="w-full rounded-sm" style={{ height: `${Math.max(6, (b.value / alertMax) * 110)}px`, background: b.color }} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-6 px-4">
                                {alertBars.map((b) => (
                                    <div key={b.label} className="flex-1 text-center" style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{b.label}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Alerts summary (REAL + mock loitering) + Zone heatmap (MOCK) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg p-5 flex flex-col gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>
                                Alerts Summary
                            </div>
                            <div className="flex flex-col gap-2">
                                {[
                                    ['Total', ac.total ?? 0, 'var(--alert)'],
                                    ['Intrusion', ac.intrusion ?? 0, 'var(--alert)'],
                                    ['Crowd', ac.crowd ?? 0, 'var(--warning)'],
                                    ['Anomaly', ac.abnormal ?? 0, 'var(--info)'],
                                    ['Loitering', 0, 'var(--primary)'], // MOCK
                                ].map(([label, value, color]) => (
                                    <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{label}</span>
                                        <span className="font-bold text-lg" style={{ color }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg p-5 flex flex-col gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                            <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>
                                Zone Heatmap
                            </div>
                            {/* MOCK — zone-level traffic tracking not implemented yet */}
                            <div className="flex flex-col gap-4">
                                {MOCK_ZONES.map(({ zone, pct, color }) => (
                                    <div key={zone} className="flex flex-col gap-1">
                                        <div className="flex justify-between">
                                            <span className="text-sm" style={{ color: 'var(--foreground)' }}>{zone}</span>
                                            <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
                                        </div>
                                        <div className="rounded-sm" style={{ height: 6, background: 'var(--muted)' }}>
                                            <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}