import { io } from 'socket.io-client';

// Strip trailing /api or /api/ so the socket connects to the server root
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5005';
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, '');

let socket = null;

export const connectSocket = (token) => {
  // If a socket reference exists but is disconnected, clean it up first
  if (socket && !socket.connected) {
    socket.removeAllListeners();
    socket = null;
  }

  if (socket) {
    return;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onAnnouncement = (callback) => {
  if (!socket) return () => {};
  socket.on('announcement:new', callback);
  return () => socket.off('announcement:new', callback);
};

export const onAnnouncementDeleted = (callback) => {
  if (!socket) return () => {};
  socket.on('announcement:deleted', callback);
  return () => socket.off('announcement:deleted', callback);
};
