import axios from 'axios';

const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 15_000,
});

http.interceptors.response.use(
    (res) => res.data,
    (err) => {
        console.error('[API]', err.response?.data?.error || err.message);
        return Promise.reject(err);
    }
);

export const statsApi = {
    getToday: () => http.get('/api/stats/today'),
    getByDate: (date) => http.get(`/api/stats?date=${date}`),
    getByRange: (from, to) => http.get(`/api/stats?from=${from}&to=${to}`),
    getHourly: (date) => http.get(`/api/stats/hourly?date=${date}`),
};

export const alertsApi = {
    getRecent: (limit = 50) => http.get(`/api/alerts?limit=${limit}`),
    getByDate: (date) => http.get(`/api/alerts?date=${date}`),
    getByRange: (from, to) => http.get(`/api/alerts?from=${from}&to=${to}`),
};

export const reportsApi = {
    generate: (body) =>
        http.post('/api/reports/generate', body, { responseType: 'blob' }),
};