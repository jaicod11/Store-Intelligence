import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Camera, User } from 'lucide-react';
import useAlertStore from '../../store/useAlertStore';

const NAV_LINKS = ['Dashboard', 'Cameras', 'Reports', 'Settings'];

export default function TopBar() {
    const isConnected = useAlertStore((s) => s.isConnected);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <header
            className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
            <div className="flex items-center gap-3">
                <div className="rounded-md w-8 h-8 flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                    <Camera size={16} style={{ color: 'var(--primary-foreground)' }} />
                </div>
                <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Store Intelligence</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>AI-powered CCTV Analytics</div>
                </div>
            </div>

            <nav className="flex items-center gap-6">
                {NAV_LINKS.map((link) => (
                    <button key={link} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {link}
                    </button>
                ))}
            </nav>

            <div className="flex items-center gap-4">
                <div
                    className="flex items-center gap-2 px-3 py-1 rounded-md border"
                    style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
                >
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: isConnected ? 'var(--primary)' : 'var(--alert)' }}
                    />
                    <span className="text-sm font-bold" style={{ color: isConnected ? 'var(--primary)' : 'var(--alert)' }}>
                        {isConnected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>

                <div
                    className="px-3 py-1 rounded-md border text-sm"
                    style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                    cam1
                </div>

                <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{format(now, 'HH:mm:ss')}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{format(now, 'EEE, MMM d yyyy')}</div>
                </div>

                <div
                    className="w-8 h-8 rounded-full border flex items-center justify-center"
                    style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}
                >
                    <User size={14} style={{ color: 'var(--primary)' }} />
                </div>
            </div>
        </header>
    );
}