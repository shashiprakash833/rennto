import React, { createContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const NetworkContext = createContext({ isConnected: true });

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false);
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected !== false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};
