import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import useAlertStore from '../../store/useAlertStore';

export default function TopBar() {
    const isConnected = useAlertStore((s) => s.isConnected);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-5 flex-shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                </div>
                <div>
                    <p className="text-white text-sm font-semibold leading-none">Store Intelligence</p>
                    <p className="text-slate-500 text-xs mt-0.5">AI-powered CCTV Analytics</p>
                </div>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-5">
                {/* Connection status */}
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-emerald-400 text-xs font-semibold tracking-wide">LIVE</span>
                        </>
                    ) : (
                        <>
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-red-400 text-xs font-semibold">OFFLINE</span>
                        </>
                    )}
                </div>

                {/* Camera badge */}
                <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full font-mono">
                    cam1
                </span>

                {/* Clock */}
                <div className="text-right">
                    <p className="text-white text-sm font-mono tabular-nums">{format(now, 'HH:mm:ss')}</p>
                    <p className="text-slate-500 text-xs">{format(now, 'EEE, MMM d yyyy')}</p>
                </div>
            </div>
        </header>
    );
}