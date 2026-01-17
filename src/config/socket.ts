import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import config from './env';

let io: Server;

export const initSocket = (server: HttpServer): Server => {
    io = new Server(server, {
        cors: {
            origin: config.cors.origin,
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Kitchen joins branch room
        socket.on('kitchen:join', ({ branchId }: { branchId: string }) => {
            socket.join(`kitchen:${branchId}`);
            console.log(`🍳 Kitchen joined branch: ${branchId}`);
        });

        // Waiter joins branch room
        socket.on('waiter:join', ({ branchId }: { branchId: string }) => {
            socket.join(`waiter:${branchId}`);
            console.log(`🍽️ Waiter joined branch: ${branchId}`);
        });

        // Cashier joins branch room
        socket.on('cashier:join', ({ branchId }: { branchId: string }) => {
            socket.join(`cashier:${branchId}`);
            console.log(`💰 Cashier joined branch: ${branchId}`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Emit events to specific branch rooms
export const emitToKitchen = (branchId: string, event: string, data: any): void => {
    io?.to(`kitchen:${branchId}`).emit(event, data);
};

export const emitToWaiters = (branchId: string, event: string, data: any): void => {
    io?.to(`waiter:${branchId}`).emit(event, data);
};

export const emitToCashiers = (branchId: string, event: string, data: any): void => {
    io?.to(`cashier:${branchId}`).emit(event, data);
};

export const emitToBranch = (branchId: string, event: string, data: any): void => {
    emitToKitchen(branchId, event, data);
    emitToWaiters(branchId, event, data);
    emitToCashiers(branchId, event, data);
};
