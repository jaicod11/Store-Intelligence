import React from 'react';
import { format } from 'date-fns';
import useAlertStore from '../store/useAlertStore';

const TYPE_COLOR = {
    intrusion: 'var(--alert)',
    crowd: 'var(--warning)',
    abnormal: 'var(--warning)',
};

export default function AlertPanel() {
    const alerts = useAlertStore((s) => s.alerts);

    return (
        <div className="rounded-lg p-4 flex flex-col gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
                <div className="text-xs tracking-widest font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>
                    Live Alert Feed
                </div>
                {alerts.length > 0 && (
                    <div className="text-xs px-2 py-0.5 rounded-md font-bold text-white" style={{ background: 'var(--alert)' }}>
                        {alerts.length} ACTIVE
                    </div>
                )}
            </div>

            {alerts.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No alerts — system monitoring...
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {alerts.slice(0, 10).map((alert, i) => {
                        const color = TYPE_COLOR[alert.alertType] || 'var(--info)';
                        const isDimmed = alert.alertType === 'intrusion';
                        return (
                            <div
                                key={alert._id || i}
                                className="flex items-center justify-between border rounded px-3 py-2"
                                style={{
                                    borderColor: color,
                                    background: isDimmed ? 'var(--alert-dim)' : 'transparent',
                                    color,
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                                    <span className="font-bold text-xs">{alert.alertType.toUpperCase()}</span>
                                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>— {alert.message}</span>
                                </div>
                                <span className="text-xs opacity-60">{format(new Date(alert.timestamp), 'HH:mm:ss')}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}