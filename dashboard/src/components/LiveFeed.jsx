import React from 'react';

/**
 * Camera tile with bounding box overlay.
 *
 * isLive=true (CAM-01 / cam1): header text uses REAL data from props
 * (personsCount, hasAlert) — passed in from the live Socket.io store.
 *
 * isLive=false (CAM-03, CAM-06): fully MOCK. Multi-camera detection
 * pipelines aren't built yet — these exist for visual/demo completeness.
 *
 * Bounding box positions are hardcoded decorative overlays in both cases —
 * the backend doesn't stream per-frame box coordinates to the dashboard
 * yet. That's the natural next upgrade (see DESIGN.md future work).
 */
export default function LiveFeed({ camId, location, personsCount, hasAlert, isLive }) {
    return (
        <div className="rounded-lg overflow-hidden flex flex-col border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: isLive ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{camId}</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>— {location}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{personsCount} persons detected</span>
                    {hasAlert && (
                        <div
                            className="text-xs px-2 py-0.5 rounded border"
                            style={{ background: 'var(--alert-dim)', borderColor: 'var(--alert)', color: 'var(--alert)' }}
                        >
                            ALERT
                        </div>
                    )}
                </div>
            </div>

            <div className="relative" style={{ height: 180, background: 'radial-gradient(ellipse at center, #0d1a12 0%, #050907 100%)' }}>
                <div className="absolute inset-0">
                    <div className="absolute rounded border-2" style={{ top: '20%', left: '18%', width: '14%', height: '55%', borderColor: 'var(--primary)' }}>
                        <div className="text-xs px-1" style={{ fontSize: 9, background: 'var(--primary)', color: 'var(--primary-foreground)' }}>PERSON 1</div>
                    </div>
                    <div className="absolute rounded border-2" style={{ top: '25%', left: '50%', width: '12%', height: '48%', borderColor: 'var(--primary)' }}>
                        <div className="text-xs px-1" style={{ fontSize: 9, background: 'var(--primary)', color: 'var(--primary-foreground)' }}>PERSON 2</div>
                    </div>
                    {hasAlert && (
                        <div className="absolute rounded border-2" style={{ top: '15%', left: '72%', width: '13%', height: '50%', borderColor: 'var(--alert)' }}>
                            <div className="text-xs px-1" style={{ fontSize: 9, background: 'var(--alert)', color: '#fff' }}>ANOMALY</div>
                        </div>
                    )}
                    <div className="absolute left-0 right-0 border-t opacity-30" style={{ top: '50%', borderColor: 'var(--primary)' }} />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--alert)' }} />
                        <span className="text-xs font-bold" style={{ color: 'var(--alert)' }}>REC</span>
                    </div>
                </div>
            </div>
        </div>
    );
}