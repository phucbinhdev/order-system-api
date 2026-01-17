import http from 'http';
import app from './app';
import config from './config/env';
import connectDB from './config/database';
import { initSocket } from './config/socket';

const startServer = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Create HTTP server
        const server = http.createServer(app);

        // Initialize Socket.io
        initSocket(server);

        // Start server
        server.listen(config.port, () => {
            console.log(`
🚀 Server running in ${config.nodeEnv} mode
📡 HTTP: http://localhost:${config.port}
🔌 WebSocket: ws://localhost:${config.port}
📚 API: http://localhost:${config.port}/api
      `);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
