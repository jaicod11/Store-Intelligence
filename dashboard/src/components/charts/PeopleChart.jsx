import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js';
import useAlertStore from '../../store/useAlertStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#0e1812',
            titleColor: '#5a7a65',
            bodyColor: '#e8f5ef',
            borderColor: '#1e2e24',
            borderWidth: 1,
        },
    },
    scales: {
        x: { display: false },
        y: { display: false, beginAtZero: true },
    },
};

// REAL DATA — last 40 live readings from Socket.io, same source as before.
// (Visually restyled as bars to match the new design; not hour-bucketed yet —
// true hourly aggregation would need a new backend endpoint.)
export default function PeopleChart() {
    const peopleHistory = useAlertStore((s) => s.peopleHistory);

    const data = {
        labels: peopleHistory.map((_, i) => i),
        datasets: [{
            data: peopleHistory,
            backgroundColor: peopleHistory.map((_, i) =>
                i === peopleHistory.length - 1 ? '#22c55e' : '#14261b'
            ),
            borderRadius: 2,
        }],
    };

    return (
        <div className="rounded-lg p-4 flex flex-col gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Live People Count
            </div>
            <div style={{ height: 80 }}>
                <Bar data={data} options={OPTIONS} />
            </div>
        </div>
    );
}