// src/config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'pharma_net_db';

if (!MONGODB_URI) {
    throw new Error('❌ MONGODB_URI is not defined in environment variables.');
}

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: MONGODB_DB_NAME,
            // modern defaults (mongoose 8+ handles most of these automatically)
            retryWrites: true,
            w: 'majority',
        });

        console.log(`MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // usually better to crash in development
    }
};

export default connectDB;

// Graceful shutdown handler
mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});