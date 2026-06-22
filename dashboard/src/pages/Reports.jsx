import React, { useState } from 'react';
import { format } from 'date-fns';
import {
    Plus, FileText, Calendar, TriangleAlert, HardDrive,
    Search, ChevronDown, Download, Eye, Trash2, Clock,
} from 'lucide-react';
import { reportsApi } from '../api/client';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';

const today = format(new Date(), 'yyyy-MM-dd');

// MOCK — there is no persisted Report history in MongoDB yet. The current
// backend generates a PDF on-demand and streams it directly; it never saves
// a "Report" record. This list is illustrative. Clicking "PDF" on any row
// IS real though — it calls the real /api/reports/generate endpoint using
// that row's date, so it may return mostly-empty data if no DailyStat
// exists for that historical date.
const MOCK_REPORTS = [
    { id: 'RPT-2026-061', title: 'Daily Summary', date: '21/06/2026', camera: 'All Cameras', type: 'Daily', alerts: 14, people: 127 },
    { id: 'RPT-2026-060', title: 'Daily Summary', date: '20/06/2026', camera: 'All Cameras', type: 'Daily', alerts: 9, people: 103 },
    { id: 'RPT-2026-059', title: 'Weekly Overview', date: '14/06/2026', camera: 'All Cameras', type: 'Weekly', alerts: 61, people: 742 },
    { id: 'RPT-2026-058', title: 'Intrusion Incidents', date: '18/06/2026', camera: 'CAM-06', type: 'Incident', alerts: 3, people: 5 },
    { id: 'RPT-2026-057', title: 'Crowd Analysis', date: '15/06/2026', camera: 'CAM-03', type: 'Incident', alerts: 5, people: 88 },
    { id: 'RPT-2026-056', title: 'Monthly Overview', date: '01/06/2026', camera: 'All Cameras', type: 'Monthly', alerts: 198, people: 3140 },
];

const TYPE_COLOR = {
    Daily: 'var(--primary)',
    Weekly: 'var(--info)',
    Incident: 'var(--alert)',
    Monthly: 'var(--warning)',
};

// MOCK — no node-cron scheduler wired up yet. Toggling these only changes
// local UI state; it does not start/stop any real scheduled job.
const INITIAL_SCHEDULES = [
    { name: 'Daily Summary', freq: 'Every day at 23:59', next: 'Tonight 23:59', enabled: true },
    { name: 'Weekly Overview', freq: 'Every Monday 08:00', next: 'Mon 23 Jun 08:00', enabled: true },
    { name: 'Monthly Overview', freq: '1st of each month', next: '01 Jul 2026', enabled: false },
];

function toISODate(ddmmyyyy) {
    const [dd, mm, yyyy] = ddmmyyyy.split('/');
    return `${yyyy}-${mm}-${dd}`;
}

async function downloadReport(body, filename) {
    const res = await reportsApi.generate(body);
    const blob = res instanceof Blob ? res : new Blob([res], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="rounded-lg p-4 flex items-center gap-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="rounded-md p-2.5" style={{ background: 'var(--muted)' }}>
                <Icon size={20} style={{ color }} />
            </div>
            <div>
                <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
                <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            </div>
        </div>
    );
}

export default function Reports({ onNavigate }) {
    const [search, setSearch] = useState('');
    const [typeFilter, setType] = useState('All Types');
    const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
    const [busyRow, setBusyRow] = useState(null);
    const [busyNew, setBusyNew] = useState(false);
    const [error, setError] = useState('');

    const filtered = MOCK_REPORTS.filter((r) => {
        const matchesSearch = !search || r.id.toLowerCase().includes(search.toLowerCase()) || r.title.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'All Types' || r.type === typeFilter;
        return matchesSearch && matchesType;
    });

    async function handleRowDownload(row) {
        setBusyRow(row.id);
        setError('');
        try {
            await downloadReport({ date: toISODate(row.date) }, `${row.id}.pdf`);
        } catch (e) {
            setError(`Failed to generate ${row.id} — no data may exist for that date.`);
        } finally {
            setBusyRow(null);
        }
    }

    async function handleNewReport() {
        setBusyNew(true);
        setError('');
        try {
            await downloadReport({ date: today }, `store-report-${today}.pdf`);
        } catch (e) {
            setError('Report generation failed.');
        } finally {
            setBusyNew(false);
        }
    }

    function toggleSchedule(name) {
        // MOCK — visual only, no backend cron job exists
        setSchedules((prev) => prev.map((s) => (s.name === name ? { ...s, enabled: !s.enabled } : s)));
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--background)' }}>
            <TopBar />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="reports" onNavigate={onNavigate} camerasOnline={8} camerasTotal={9} />

                <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-bold text-2xl" style={{ color: 'var(--foreground)' }}>Reports</div>
                            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                Generate and manage AI-powered surveillance reports
                            </div>
                        </div>
                        <button
                            onClick={handleNewReport} disabled={busyNew}
                            className="text-sm font-bold px-5 py-2.5 rounded-md flex items-center gap-2"
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        >
                            <Plus size={15} />
                            {busyNew ? 'Generating…' : 'New Report'}
                        </button>
                    </div>

                    {error && <p className="text-sm" style={{ color: 'var(--alert)' }}>{error}</p>}

                    {/* MOCK — no Report history collection exists; these 4 numbers are static */}
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard icon={FileText} label="Total Reports" value="42" color="var(--primary)" />
                        <StatCard icon={Calendar} label="This Month" value="18" color="var(--info)" />
                        <StatCard icon={TriangleAlert} label="Incident Reports" value="11" color="var(--alert)" />
                        <StatCard icon={HardDrive} label="Storage Used" value="1.8 GB" color="var(--warning)" />
                    </div>

                    {/* Filters — search + type are real (client-side filter over mock list) */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-md px-3 py-2 border flex-1" style={{ background: 'var(--input)', borderColor: 'var(--border)' }}>
                            <Search size={14} style={{ color: 'var(--muted-foreground)' }} />
                            <input
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search reports..."
                                className="text-sm bg-transparent outline-none flex-1"
                                style={{ color: 'var(--foreground)' }}
                            />
                        </div>

                        <select
                            value={typeFilter} onChange={(e) => setType(e.target.value)}
                            className="text-sm rounded-md px-3 py-2 border outline-none"
                            style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        >
                            {['All Types', 'Daily', 'Weekly', 'Monthly', 'Incident'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>

                        {/* MOCK — decorative only, not wired */}
                        <div className="flex items-center gap-2 rounded-md px-3 py-2 border" style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                            <span className="text-sm">Jun 2026</span>
                            <ChevronDown size={14} style={{ color: 'var(--muted-foreground)' }} />
                        </div>
                        <div className="flex items-center gap-2 rounded-md px-3 py-2 border" style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                            <span className="text-sm">All Cameras</span>
                            <ChevronDown size={14} style={{ color: 'var(--muted-foreground)' }} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border flex flex-col" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div
                            className="grid border-b px-5 py-3"
                            style={{ gridTemplateColumns: '1.5fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.7fr 1fr', borderColor: 'var(--border)' }}
                        >
                            {['Report ID', 'Title', 'Date', 'Camera', 'Type', 'Alerts', 'People', 'Actions'].map((h) => (
                                <div key={h} className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>{h}</div>
                            ))}
                        </div>

                        {filtered.map((row) => (
                            <div
                                key={row.id}
                                className="grid border-b px-5 py-4 items-center"
                                style={{ gridTemplateColumns: '1.5fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.7fr 1fr', borderColor: 'var(--border)' }}
                            >
                                <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{row.id}</div>
                                <div className="text-sm" style={{ color: 'var(--foreground)' }}>{row.title}</div>
                                <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.date}</div>
                                <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{row.camera}</div>
                                <div
                                    className="text-xs font-bold border rounded px-2 py-0.5 w-fit"
                                    style={{ color: TYPE_COLOR[row.type], borderColor: TYPE_COLOR[row.type] }}
                                >
                                    {row.type}
                                </div>
                                <div className="text-sm font-bold" style={{ color: 'var(--alert)' }}>{row.alerts}</div>
                                <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{row.people}</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRowDownload(row)}
                                        disabled={busyRow === row.id}
                                        className="text-xs px-3 py-1 rounded flex items-center gap-1"
                                        style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
                                    >
                                        <Download size={11} />
                                        {busyRow === row.id ? '…' : 'PDF'}
                                    </button>
                                    {/* MOCK — no stored report to view/delete */}
                                    <Eye size={15} style={{ color: 'var(--muted-foreground)', opacity: 0.4, cursor: 'not-allowed' }} />
                                    <Trash2 size={15} style={{ color: 'var(--muted-foreground)', opacity: 0.4, cursor: 'not-allowed' }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Scheduled reports — MOCK, no cron backend */}
                    <div className="rounded-lg p-5 flex flex-col gap-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between">
                            <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>Scheduled Reports</div>
                            <button className="text-xs flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                                <Plus size={12} /> Add Schedule
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {schedules.map((s) => (
                                <div key={s.name} className="rounded-lg p-4 flex flex-col gap-2 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{s.name}</span>
                                        <button
                                            onClick={() => toggleSchedule(s.name)}
                                            className="w-8 h-4 rounded-full flex items-center"
                                            style={{ background: s.enabled ? 'var(--primary)' : 'var(--muted-foreground)', justifyContent: s.enabled ? 'flex-end' : 'flex-start', padding: '0 2px' }}
                                        >
                                            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--card)' }} />
                                        </button>
                                    </div>
                                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.freq}</div>
                                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                        <Clock size={11} /> Next: {s.next}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}