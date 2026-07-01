import React from 'react';
import useAlertStore from '../../store/useAlertStore';

// Intrusion / Crowd / Anomaly use REAL counts from todayStats.alertCounts.
// Loitering is MOCK (hardcoded 0) — not implemented in the backend yet.
export default function AlertsChart() {
    const todayStats = useAlertStore((s) => s.todayStats);
    const ac = todayStats?.alertCounts ?? {};

    const bars = [
        { label: 'Intrusion', value: ac.intrusion ?? 0, color: 'var(--alert)' },
        { label: 'Crowd', value: ac.crowd ?? 0, color: 'var(--warning)' },
        { label: 'Anomaly', value: ac.abnormal ?? 0, color: 'var(--info)' },
        { label: 'Loitering', value: ac.loitering ?? 0, color: 'var(--primary)' }, // now REAL
    ];

    const max = Math.max(1, ...bars.map((b) => b.value));

    return (
        <div className="rounded-lg p-4 flex flex-col gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>
                Alert Types Today
            </div>
            <div className="flex items-end gap-3" style={{ height: 80 }}>
                {bars.map((b) => (
                    <div key={b.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div
                            className="w-full rounded-sm"
                            style={{ height: `${Math.max(4, (b.value / max) * 70)}px`, background: b.color }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex gap-3">
                {bars.map((b) => (
                    <div key={b.label} className="flex-1 text-center" style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>
                        {b.label}
                    </div>
                ))}
            </div>
        </div>
    );
}