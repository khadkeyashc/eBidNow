import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Initialize socket on component mount
  useEffect(() => {
    console.log('Initializing Socket.io connection');
    
    // Create socket instance
    const socketInstance = io('http://localhost:5000', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      timeout: 10000,
      transports: ['websocket', 'polling'] // Try WebSocket first, then polling
    });
    
    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Socket.io connected successfully with ID:', socketInstance.id);
      setConnected(true);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log(`Socket.io disconnected: ${reason}`);
      setConnected(false);
    });
    
    socketInstance.on('error', (error) => {
      console.error('Socket.io error:', error);
    });
    
    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket.io reconnection attempt #${attemptNumber}`);
    });
    
    socketInstance.on('reconnect_failed', () => {
      console.error('Socket.io reconnection failed');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error.message);
    });
    
    // Store socket instance
    setSocket(socketInstance);
    
    // Clean up on unmount
    return () => {
      console.log('Cleaning up Socket.io connection');
      socketInstance.disconnect();
    };
  }, []);
  
  // Join an auction room
  const joinAuction = (auctionId) => {
    if (socket && connected) {
      console.log(`Joining auction room: ${auctionId}`);
      socket.emit('joinAuction', auctionId);
    } else {
      console.error('Cannot join auction: Socket not connected');
    }
  };

  // Leave an auction room
  const leaveAuction = (auctionId) => {
    if (socket && connected) {
      console.log(`Leaving auction room: ${auctionId}`);
      socket.emit('leaveAuction', auctionId);
    } else {
      console.error('Cannot leave auction: Socket not connected');
    }
  };

  // Place a new bid
  const placeBid = (bid) => {
    if (socket && connected) {
      console.log(`Placing bid:`, bid);
      socket.emit('newBid', bid);
    } else {
      console.error('Cannot place bid: Socket not connected');
    }
  };

  // Listen for bid updates (this is kept for compatibility but not needed with updated architecture)
  const onBidPlaced = (callback) => {
    if (socket) {
      socket.on('bidPlaced', callback);
    }
    
    return () => {
      if (socket) {
        socket.off('bidPlaced', callback);
      }
    };
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinAuction,
        leaveAuction,
        placeBid,
        onBidPlaced
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);

export default SocketContext; 