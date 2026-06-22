import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';

export default function App() {
    const [page, setPage] = useState('dashboard');

    if (page === 'statistics') return <Statistics onNavigate={setPage} />;
    return <Dashboard onNavigate={setPage} />;
}