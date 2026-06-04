import React from 'react';
import { format } from 'date-fns';
import useAlertStore from '../store/useAlertStore';

const TYPE = {
    intrusion: { label: 'INTRUSION', bg: 'bg-red-950', border: 'border-red-800', badge: 'bg-red-600', text: 'text-red-400' },
    crowd: { label: 'CROWD', bg: 'bg-amber-950', border: 'border-amber-800', badge: 'bg-amber-500', text: 'text-amber-400' },
    abnormal: { label: 'ABNORMAL', bg: 'bg-purple-950', border: 'border-purple-800', badge: 'bg-purple-600', text: 'text-purple-400' },
};

function AlertItem({ alert }) {
    const cfg = TYPE[alert.alertType] || TYPE.abnormal;
    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
            <span className={`shrink-0 mt-0.5 text-white text-xs font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>
                {cfg.label.slice(0, 3)}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-slate-200 text-sm truncate">{alert.message}</p>
                <p className={`text-xs mt-0.5 ${cfg.text}`}>
                    {format(new Date(alert.timestamp), 'HH:mm:ss')} · {alert.severity} severity
                </p>
            </div>
        </div>
    );
}

export default function AlertPanel() {
    const alerts = useAlertStore((s) => s.alerts);

    return (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Live Alert Feed
                </p>
                {alerts.length > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {alerts.length}
                    </span>
                )}
            </div>

            {alerts.length === 0 ? (
                <div className="py-10 text-center text-slate-600 text-sm">
                    No alerts — system monitoring...
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {alerts.slice(0, 10).map((alert, i) => (
                        <AlertItem key={alert._id || i} alert={alert} />
                    ))}
                </div>
            )}
        </div>
    );
}