import mongoose from 'mongoose';
import config from './env';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(config.mongoUri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${(error as Error).message}`);
        process.exit(1);
    }
};

export default connectDB;
