import { create } from 'zustand';

const HISTORY_SIZE = 40;
const MAX_FEED = 50;

const useAlertStore = create((set) => ({
    // ── Connection ─────────────────────────────────────────────────────────
    isConnected: false,
    setConnected: (v) => set({ isConnected: v }),

    // ── Live counts (current frame) ────────────────────────────────────────
    livePersonCount: 0,
    liveVehicleCount: 0,

    // ── People count history (for live chart) ──────────────────────────────
    peopleHistory: Array(HISTORY_SIZE).fill(0),
    timeLabels: Array(HISTORY_SIZE).fill(''),

    updateLiveCounts: (peopleCount, vehicleCount, timestamp) =>
        set((state) => {
            const d = new Date(timestamp || Date.now());
            const label = d.toLocaleTimeString('en-US', {
                hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
            });
            return {
                livePersonCount: peopleCount,
                liveVehicleCount: vehicleCount,
                peopleHistory: [...state.peopleHistory.slice(1), peopleCount],
                timeLabels: [...state.timeLabels.slice(1), label],
            };
        }),

    // ── Alert feed ─────────────────────────────────────────────────────────
    alerts: [],
    addAlert: (alert) =>
        set((state) => ({ alerts: [alert, ...state.alerts].slice(0, MAX_FEED) })),
    setAlerts: (alerts) => set({ alerts }),

    // ── Aggregated today stats (from REST) ─────────────────────────────────
    todayStats: null,
    setTodayStats: (stats) => set({ todayStats: stats }),
}));

export default useAlertStore;