import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { getUserFromToken } from '../middleware/authMiddleware';
import { socketCorsOptions } from '../config/cors';

interface SocketUser {
  id: string;
  name: string;
  role: 'admin' | 'user';
}

let ioInstance: Server | null = null;

const extractToken = (socket: Socket): string | null => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }

  const authorizationHeader = socket.handshake.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.split(' ')[1] ?? null;
};

export const initializeSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: socketCorsOptions,
  });

  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error('Unauthorized: missing token'));
      }

      const user = await getUserFromToken(token);
      if (!user) {
        return next(new Error('Unauthorized: invalid token'));
      }

      (socket.data as { user?: SocketUser }).user = {
        id: String(user._id),
        name: user.name,
        role: user.role,
      };

      return next();
    } catch (error) {
      return next(new Error('Unauthorized: token verification failed'));
    }
  });

  io.on('connection', (socket) => {
    const currentUser = (socket.data as { user?: SocketUser }).user;
    if (!currentUser) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${currentUser.id}`);

    if (currentUser.role === 'admin') {
      socket.join('admins');
    } else {
      socket.join('users');
    }
  });

  ioInstance = io;
  return io;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO server is not initialized');
  }
  return ioInstance;
};