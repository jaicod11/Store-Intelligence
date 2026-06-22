import React from 'react';
import {
    Camera, LayoutDashboard, TriangleAlert, Users,
    BarChart2, Map, FileText, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Cameras', icon: Camera, active: false },
    { label: 'Alerts', icon: TriangleAlert, active: false },
    { label: 'People Analytics', icon: Users, active: false },
    { label: 'Statistics', icon: BarChart2, active: false },
    { label: 'Zone Heatmap', icon: Map, active: false },
    { label: 'Reports', icon: FileText, active: false },
    { label: 'Settings', icon: Settings, active: false },
];

export default function Sidebar({ camerasOnline = 0, camerasTotal = 0 }) {
    return (
        <aside
            className="flex flex-col border-r"
            style={{ width: 220, minWidth: 220, background: 'var(--card)', borderColor: 'var(--border)' }}
        >
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="rounded-md w-8 h-8 flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                    <Camera size={16} style={{ color: 'var(--primary-foreground)' }} />
                </div>
                <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Store Intel</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>AI Analytics</div>
                </div>
            </div>

            <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
                {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
                    <button
                        key={label}
                        // NOTE: only "Dashboard" is wired up right now.
                        // Other pages (Cameras / Alerts / People Analytics / Statistics /
                        // Zone Heatmap / Reports / Settings) will be wired once those
                        // HTML mockups are converted too.
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left"
                        style={
                            active
                                ? { background: 'var(--secondary)', color: 'var(--primary)' }
                                : { color: 'var(--muted-foreground)' }
                        }
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </nav>

            <div className="px-5 py-4 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>SYSTEM LIVE</span>
                </div>
                {/* MOCK — multi-camera not implemented; hardcoded until real camera registry exists */}
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {camerasOnline}/{camerasTotal} cameras online
                </div>
            </div>
        </aside>
    );
}