// src/server.ts
import http from 'http';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import app from './app.js';

const PORT = Number(process.env.PORT) || 5000;
const ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
    try {
        // 1. Connect to database first
        await connectDB();

        // 2. Create HTTP server
        const server = http.createServer(app);

        // 3. Start listening
        server.listen(PORT, () => {
            console.log(`───────────────────────────────────────────────`);
            console.log(`🚀 Pharma-Net Backend running`);
            console.log(`   Mode:       ${ENV}`);
            console.log(`   Port:       ${PORT}`);
            console.log(`   URL:        http://localhost:${PORT}`);
            console.log(`   Health:     http://localhost:${PORT}/health`);
            console.log(`───────────────────────────────────────────────`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            server.close(() => {
                console.log('HTTP server closed.');
            });

            await mongoose.connection.close(false);
            console.log('MongoDB connection closed.');

            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();