import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import useAlertStore from '../../store/useAlertStore';

ChartJS.register(ArcElement, Tooltip, Legend);

const LABELS = ['Cars', 'Trucks', 'Motorcycles', 'Buses', 'Bicycles'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

const OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
        legend: {
            position: 'right',
            labels: {
                color: '#94a3b8',
                boxWidth: 10,
                padding: 10,
                font: { size: 11 },
            },
        },
        tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
        },
    },
};

export default function VehicleChart() {
    const todayStats = useAlertStore((s) => s.todayStats);
    const vb = todayStats?.vehicleBreakdown ?? {};
    const values = [vb.car ?? 0, vb.truck ?? 0, vb.motorcycle ?? 0, vb.bus ?? 0, vb.bicycle ?? 0];
    const total = values.reduce((a, b) => a + b, 0);

    const data = {
        labels: LABELS,
        datasets: [{
            data: values,
            backgroundColor: COLORS,
            borderColor: '#020817',
            borderWidth: 2,
        }],
    };

    return (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Vehicle Breakdown
            </p>
            <div style={{ height: 140 }}>
                {total === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                        No vehicles yet
                    </div>
                ) : (
                    <Doughnut data={data} options={OPTIONS} />
                )}
            </div>
        </div>
    );
}