import { io, type Socket } from 'socket.io-client';

const SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

let _socket: Socket | null = null;

export const adminSocket = {
  connect(token: string): Socket {
    if (_socket?.connected) {
      // Re-emit join in case this is called after a reconnect
      _socket.emit('join:admin', { token });
      return _socket;
    }
    if (_socket) _socket.disconnect();
    _socket = io(SERVER, { transports: ['websocket', 'polling'] });
    _socket.on('connect', () => {
      _socket!.emit('join:admin', { token });
    });
    return _socket;
  },

  get(): Socket | null {
    return _socket;
  },

  disconnect() {
    _socket?.disconnect();
    _socket = null;
  },
};
