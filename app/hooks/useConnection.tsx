import { createContext, useContext, useState, useCallback } from 'react';

interface ConnectionContextType {
  shouldConnect: boolean;
  wsUrl: string;
  token: string;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

interface ConnectionProviderProps {
  children: React.ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [shouldConnect, setShouldConnect] = useState(false);
  const [wsUrl, setWsUrl] = useState('');
  const [token, setToken] = useState('');

  const connect = useCallback(async () => {
    try {
      console.log('🔌 useConnection: Starting connection process...');
      
      // Fetch token from our API (it will auto-assign room and participant)
      console.log('🎫 useConnection: Requesting token from /api/livekit/token');
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body - API will handle auto-assignment
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ useConnection: Token received:', {
        wsUrl: data.wsUrl,
        hasToken: !!data.token,
        tokenLength: data.token?.length,
        roomName: data.roomName,
        participantName: data.participantName,
        tokenData: data
      });
      
      setWsUrl(data.wsUrl);
      setToken(data.token);
      setShouldConnect(true);
      
      console.log('🎯 useConnection: Connection state updated, should connect:', true);
    } catch (error) {
      console.error('💥 useConnection: Failed to connect:', error);
      throw error;
    }
  }, []);

  const disconnect = () => {
    setShouldConnect(false);
    setToken('');
    setWsUrl('');
  };


  return (
    <ConnectionContext.Provider value={{
      shouldConnect,
      wsUrl,
      token,
      connect,
      disconnect,
    }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}