require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./socket/socketManager');
const routes = require('./routes/index');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api', routes);

app.get('/health', (req, res) =>
    res.json({ status: 'ok', service: 'api-service' })
);

app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ success: false, error: err.message });
});

async function bootstrap() {
    try {
        await connectDB();
        await connectRedis();
        initSocket(server);

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () =>
            console.log(`✅  API Service → http://localhost:${PORT}`)
        );
    } catch (err) {
        console.error('❌  Bootstrap failed:', err);
        process.exit(1);
    }
}

bootstrap();