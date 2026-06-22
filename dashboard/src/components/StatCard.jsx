import React from 'react';

const COLOR_MAP = {
    primary: 'var(--primary)',
    alert: 'var(--alert)',
    info: 'var(--info)',
    warning: 'var(--warning)',
};

export default function StatCard({ label, value, sub, color = 'primary' }) {
    const c = COLOR_MAP[color] || COLOR_MAP.primary;
    return (
        <div
            className="rounded-lg p-5 flex flex-col gap-2 border"
            style={{ background: 'var(--card)', borderColor: c }}
        >
            <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>
                {label}
            </div>
            <div className="text-4xl font-bold" style={{ color: c }}>{value}</div>
            {sub && <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</div>}
        </div>
    );
}