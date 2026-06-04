const mongoose = require('mongoose');

async function connectDB() {
    const uri =
        process.env.MONGO_URI ||
        'mongodb://localhost:27017/store_intelligence';

    mongoose.connection.on('connected', () =>
        console.log('✅  MongoDB connected')
    );
    mongoose.connection.on('error', (err) =>
        console.error('❌  MongoDB error:', err)
    );

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
    });
}

module.exports = { connectDB };