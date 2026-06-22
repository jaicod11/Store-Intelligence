import React from 'react';
import {
    Camera, LayoutDashboard, TriangleAlert, Users,
    BarChart2, Map, FileText, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
    { label: 'Cameras', icon: Camera, page: 'cameras' },
    { label: 'Alerts', icon: TriangleAlert, page: 'alerts' },
    { label: 'People Analytics', icon: Users, page: 'people' },
    { label: 'Statistics', icon: BarChart2, page: 'statistics' },
    { label: 'Zone Heatmap', icon: Map, page: 'heatmap' },
    { label: 'Reports', icon: FileText, page: 'reports' },
    { label: 'Settings', icon: Settings, page: 'settings' },
];

// Pages that actually exist right now. Everything else is a no-op until
// that page's HTML mockup is converted too.
const BUILT_PAGES = ['dashboard', 'statistics'];

export default function Sidebar({ activePage, onNavigate, camerasOnline = 0, camerasTotal = 0 }) {
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
                {NAV_ITEMS.map(({ label, icon: Icon, page }) => {
                    const isActive = activePage === page;
                    const isBuilt = BUILT_PAGES.includes(page);
                    return (
                        <button
                            key={label}
                            onClick={() => isBuilt && onNavigate(page)}
                            disabled={!isBuilt}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left"
                            style={{
                                background: isActive ? 'var(--secondary)' : 'transparent',
                                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                                fontWeight: isActive ? 700 : 500,
                                opacity: isBuilt ? 1 : 0.5,
                                cursor: isBuilt ? 'pointer' : 'default',
                            }}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    );
                })}
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