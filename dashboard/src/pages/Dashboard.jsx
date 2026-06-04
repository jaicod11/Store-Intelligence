import React from 'react';
import useSocket from '../hooks/useSocket';
import useStats from '../hooks/useStats';
import useAlertStore from '../store/useAlertStore';

import TopBar from '../components/layout/TopBar';
import PeopleChart from '../components/charts/PeopleChart';
import VehicleChart from '../components/charts/VehicleChart';
import AlertsChart from '../components/charts/AlertsChart';
import AlertPanel from '../components/AlertPanel';
import StatsSidebar from '../components/StatsSidebar';

function StatCard({ label, value, sub, colorClass }) {
    return (
        <div className={`rounded-xl p-4 border ${colorClass}`}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 opacity-70">{label}</p>
            <p className="text-4xl font-bold tabular-nums">{value}</p>
            {sub && <p className="text-xs mt-1.5 opacity-50">{sub}</p>}
        </div>
    );
}

export default function Dashboard() {
    useSocket();
    useStats();

    const livePersonCount = useAlertStore((s) => s.livePersonCount);
    const liveVehicleCount = useAlertStore((s) => s.liveVehicleCount);
    const todayStats = useAlertStore((s) => s.todayStats);
    const alerts = useAlertStore((s) => s.alerts);

    return (
        <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
            <TopBar />

            <div className="flex flex-1 overflow-hidden">
                {/* ── Main content ─────────────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto p-5 space-y-4">

                    {/* Stat cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard
                            label="People Today"
                            value={todayStats?.totalPeople ?? 0}
                            sub={`${livePersonCount} in frame right now`}
                            colorClass="bg-blue-950 border-blue-800 text-blue-300"
                        />
                        <StatCard
                            label="Vehicles Today"
                            value={todayStats?.totalVehicles ?? 0}
                            sub={`${liveVehicleCount} in frame right now`}
                            colorClass="bg-emerald-950 border-emerald-800 text-emerald-300"
                        />
                        <StatCard
                            label="Alerts Today"
                            value={todayStats?.alertCounts?.total ?? 0}
                            sub={`${alerts.length} loaded in feed`}
                            colorClass="bg-red-950 border-red-900 text-red-300"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-3 gap-4">
                        <PeopleChart />
                        <VehicleChart />
                        <AlertsChart />
                    </div>

                    {/* Live alert feed */}
                    <AlertPanel />
                </main>

                {/* ── Right sidebar ─────────────────────────────────────────── */}
                <StatsSidebar />
            </div>
        </div>
    );
}