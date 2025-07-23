import { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket;

const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (socket) return;

    const initSocket = async () => {
      await fetch('/api/socket');
      socket = io(undefined, {
        path: '/api/socket_io/',
      });

      socket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  return { isConnected, socket };
};

export default useSocket;

