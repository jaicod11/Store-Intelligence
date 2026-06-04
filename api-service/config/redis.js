const { createClient } = require('redis');
const { processDetectionEvent, processAlertEvent } = require('../services/eventProcessor');

const CHANNEL_DETECTIONS = 'store:detections';
const CHANNEL_ALERTS = 'store:alerts';

async function connectRedis() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    // Main client (for future pub/emit use if needed)
    const client = createClient({ url });
    client.on('error', (err) => console.error('Redis client error:', err));
    await client.connect();

    // Dedicated subscriber client (Redis requires separate client for subscribe mode)
    const subscriber = client.duplicate();
    subscriber.on('error', (err) => console.error('Redis subscriber error:', err));
    await subscriber.connect();

    await subscriber.subscribe(CHANNEL_DETECTIONS, async (message) => {
        try {
            const event = JSON.parse(message);
            await processDetectionEvent(event);
        } catch (err) {
            console.error('Detection event processing error:', err.message);
        }
    });

    await subscriber.subscribe(CHANNEL_ALERTS, async (message) => {
        try {
            const event = JSON.parse(message);
            await processAlertEvent(event);
        } catch (err) {
            console.error('Alert event processing error:', err.message);
        }
    });

    console.log(`✅  Redis subscribed → ${CHANNEL_DETECTIONS}, ${CHANNEL_ALERTS}`);
    return client;
}

module.exports = { connectRedis };