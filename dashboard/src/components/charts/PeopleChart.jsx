import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale,
    PointElement, LineElement, Filler, Tooltip,
} from 'chart.js';
import useAlertStore from '../../store/useAlertStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
        },
    },
    scales: {
        x: { display: false },
        y: {
            beginAtZero: true,
            min: 0,
            grid: { color: '#1e293b' },
            ticks: { color: '#475569', stepSize: 1, font: { size: 11 } },
        },
    },
};

export default function PeopleChart() {
    const peopleHistory = useAlertStore((s) => s.peopleHistory);
    const timeLabels = useAlertStore((s) => s.timeLabels);

    const data = {
        labels: timeLabels,
        datasets: [{
            label: 'People in frame',
            data: peopleHistory,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.12)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
        }],
    };

    return (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Live People Count
            </p>
            <div style={{ height: 140 }}>
                <Line data={data} options={OPTIONS} />
            </div>
        </div>
    );
}