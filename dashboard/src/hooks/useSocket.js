import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAlertStore from '../store/useAlertStore';

export default function useSocket() {
    const socketRef = useRef(null);
    const { setConnected, updateLiveCounts, addAlert } = useAlertStore();

    useEffect(() => {
        const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

        socketRef.current = io(url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
        });

        const socket = socketRef.current;

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        socket.on('detection:update', ({ peopleCount, timestamp }) =>
            updateLiveCounts(peopleCount, timestamp)
        );

        socket.on('alert:new', (alert) => addAlert(alert));

        return () => socket.disconnect();
    }, []);
}