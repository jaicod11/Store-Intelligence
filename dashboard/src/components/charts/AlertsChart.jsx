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
        x: {
            grid: { display: false },
            ticks: { color: '#475569', font: { size: 11 } },
        },
        y: {
            beginAtZero: true,
            grid: { color: '#1e293b' },
            ticks: { color: '#475569', stepSize: 1, font: { size: 11 } },
        },
    },
};

export default function AlertsChart() {
    const todayStats = useAlertStore((s) => s.todayStats);
    const ac = todayStats?.alertCounts ?? {};

    const data = {
        labels: ['Intrusion', 'Crowd', 'Abnormal'],
        datasets: [{
            data: [ac.intrusion ?? 0, ac.crowd ?? 0, ac.abnormal ?? 0],
            backgroundColor: ['rgba(239,68,68,0.75)', 'rgba(245,158,11,0.75)', 'rgba(139,92,246,0.75)'],
            borderColor: ['#ef4444', '#f59e0b', '#8b5cf6'],
            borderWidth: 1,
            borderRadius: 6,
        }],
    };

    return (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Alert Types Today
            </p>
            <div style={{ height: 140 }}>
                <Bar data={data} options={OPTIONS} />
            </div>
        </div>
    );
}