import { create } from 'zustand';

const HISTORY_SIZE = 40;
const MAX_FEED = 50;

const useAlertStore = create((set) => ({
    isConnected: false,
    setConnected: (v) => set({ isConnected: v }),

    livePersonCount: 0,

    peopleHistory: Array(HISTORY_SIZE).fill(0),
    timeLabels: Array(HISTORY_SIZE).fill(''),

    updateLiveCounts: (peopleCount, timestamp) =>
        set((state) => {
            const d = new Date(timestamp || Date.now());
            const label = d.toLocaleTimeString('en-US', {
                hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
            });
            return {
                livePersonCount: peopleCount,
                peopleHistory: [...state.peopleHistory.slice(1), peopleCount],
                timeLabels: [...state.timeLabels.slice(1), label],
            };
        }),

    alerts: [],
    addAlert: (alert) =>
        set((state) => ({ alerts: [alert, ...state.alerts].slice(0, MAX_FEED) })),
    setAlerts: (alerts) => set({ alerts }),

    todayStats: null,
    setTodayStats: (stats) => set({ todayStats: stats }),
}));

export default useAlertStore;