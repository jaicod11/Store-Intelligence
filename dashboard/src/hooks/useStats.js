import { useEffect, useCallback } from 'react';
import { statsApi, alertsApi } from '../api/client';
import useAlertStore from '../store/useAlertStore';

export default function useStats() {
    const { setTodayStats, setAlerts } = useAlertStore();

    const refresh = useCallback(async () => {
        try {
            const res = await statsApi.getToday();
            if (res.success) setTodayStats(res.data);
        } catch (_) { }
    }, [setTodayStats]);

    const loadAlerts = useCallback(async () => {
        try {
            const res = await alertsApi.getRecent(50);
            if (res.success) setAlerts(res.data);
        } catch (_) { }
    }, [setAlerts]);

    useEffect(() => {
        refresh();
        loadAlerts();
        const t = setInterval(refresh, 30_000);
        return () => clearInterval(t);
    }, [refresh, loadAlerts]);
}