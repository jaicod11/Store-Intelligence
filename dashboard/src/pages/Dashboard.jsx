import React from 'react';
import useSocket from '../hooks/useSocket';
import useStats from '../hooks/useStats';
import useAlertStore from '../store/useAlertStore';

import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import StatCard from '../components/StatCard';
import LiveFeed from '../components/LiveFeed';
import PeopleChart from '../components/charts/PeopleChart';
import AlertsChart from '../components/charts/AlertsChart';
import AlertPanel from '../components/AlertPanel';

export default function Dashboard({ onNavigate }) {
    useSocket();
    useStats();

    const livePersonCount = useAlertStore((s) => s.livePersonCount);
    const todayStats = useAlertStore((s) => s.todayStats);
    const alerts = useAlertStore((s) => s.alerts);

    const hasActiveAlert = alerts.length > 0;

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--background)' }}>
            <TopBar />

            <div className="flex flex-1 overflow-hidden">
                {/* MOCK — 9 total / 8 online is hardcoded until a real camera registry exists */}
                <Sidebar activePage="dashboard" onNavigate={onNavigate} camerasOnline={8} camerasTotal={9} />

                <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

                    {/* Stat cards — first two REAL, last two MOCK */}
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard
                            label="People Today"
                            value={todayStats?.totalPeople ?? 0}
                            sub={`${livePersonCount} in frame right now`}
                            color="primary"
                        />
                        <StatCard
                            label="Alerts Today"
                            value={todayStats?.alertCounts?.total ?? 0}
                            sub={`${alerts.length} active in feed`}
                            color="alert"
                        />
                        {/* MOCK — multi-camera registry not built yet */}
                        <StatCard label="Cameras Online" value="8" sub="of 9 total cameras" color="info" />
                        {/* MOCK — dwell-time tracking not built yet */}
                        <StatCard label="Avg Dwell Time" value="4.2m" sub="per customer visit" color="warning" />
                    </div>

                    {/* Camera tiles — tile 1 REAL, tiles 2 & 3 MOCK */}
                    <div className="grid grid-cols-3 gap-4">
                        <LiveFeed
                            camId="CAM-01"
                            location="Main Entrance"
                            personsCount={livePersonCount}
                            hasAlert={hasActiveAlert}
                            isLive
                        />
                        <LiveFeed camId="CAM-03" location="Checkout Area" personsCount={3} hasAlert isLive={false} />
                        <LiveFeed camId="CAM-06" location="Back Storage" personsCount={3} hasAlert isLive={false} />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-2 gap-4">
                        <PeopleChart />
                        <AlertsChart />
                    </div>

                    <AlertPanel />
                </main>
            </div>
        </div>
    );
}