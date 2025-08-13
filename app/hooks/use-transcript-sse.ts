import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  TranscriptData,
  ConnectionState,
} from '@/lib/types/transcript';

interface UseTranscriptSSEOptions {
  roomName: string;
  participantName: string;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface TranscriptSSEState {
  connectionState: ConnectionState;
  isConnected: boolean;
  transcripts: TranscriptData[];
  lastTranscript: TranscriptData | null;
  error: string | null;
  reconnectAttempts: number;
}

export function useTranscriptSSE(options: UseTranscriptSSEOptions) {
  const {
    roomName,
    participantName,
    autoConnect = true,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [state, setState] = useState<TranscriptSSEState>({
    connectionState: 'disconnected',
    isConnected: false,
    transcripts: [],
    lastTranscript: null,
    error: null,
    reconnectAttempts: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const updateState = useCallback((updates: Partial<TranscriptSSEState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'transcript': {
          if (message.data) {
            setState(prev => ({
              ...prev,
              lastTranscript: message.data,
              transcripts: [...prev.transcripts, message.data],
              error: null,
            }));
          }
          break;
        }

        case 'status': {
          updateState({
            connectionState: message.status || 'connected',
            error: message.status === 'error' ? message.message : null,
          });
          break;
        }

        default:
          console.warn('Unknown SSE message type:', message);
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
      updateState({ error: 'Failed to parse message from server' });
    }
  }, [updateState]);

  const handleOpen = useCallback(() => {
    console.log('SSE connection opened');
    updateState({
      connectionState: 'connected',
      isConnected: true,
      error: null,
      reconnectAttempts: 0,
    });
  }, [updateState]);

  // Connection logic separated to avoid circular dependencies
  const createConnection = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN || isConnectingRef.current) {
      return;
    }

    clearReconnectTimeout();
    isConnectingRef.current = true;

    updateState({
      connectionState: 'connecting',
      error: null,
    });

    try {
      const sseUrl = new URL('/api/transcripts.sse', window.location.origin);
      sseUrl.searchParams.set('room', roomName);
      sseUrl.searchParams.set('participant', participantName);

      const eventSource = new EventSource(sseUrl.toString());
      
      eventSource.addEventListener('open', handleOpen);
      eventSource.addEventListener('message', handleMessage);

      eventSourceRef.current = eventSource;
      isConnectingRef.current = false;
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      isConnectingRef.current = false;
      updateState({
        connectionState: 'error',
        error: 'Failed to create SSE connection',
      });
    }
  }, [roomName, participantName, handleOpen, handleMessage, clearReconnectTimeout, updateState]);

  const handleError = useCallback((event: Event) => {
    console.error('SSE error:', event);
    
    // Check if the connection is closed
    if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
      updateState({
        connectionState: 'disconnected',
        isConnected: false,
      });

      // Auto-reconnect if enabled
      if (autoReconnect && state.reconnectAttempts < maxReconnectAttempts) {
        setState(prev => ({
          ...prev,
          connectionState: 'reconnecting',
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));

        reconnectTimeoutRef.current = setTimeout(() => {
          createConnection();
          // Add error handler after reconnection
          if (eventSourceRef.current) {
            eventSourceRef.current.addEventListener('error', handleError);
          }
        }, reconnectInterval);
      } else {
        updateState({
          connectionState: 'error',
          error: 'SSE connection error',
        });
      }
    }
  }, [autoReconnect, maxReconnectAttempts, reconnectInterval, state.reconnectAttempts, updateState, createConnection]);

  const connect = useCallback(() => {
    createConnection();
    // Add error handler after connection is created
    if (eventSourceRef.current) {
      eventSourceRef.current.addEventListener('error', handleError);
    }
  }, [createConnection, handleError]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    isConnectingRef.current = false;
    
    updateState({
      connectionState: 'disconnected',
      isConnected: false,
      reconnectAttempts: 0,
    });
  }, [clearReconnectTimeout, updateState]);

  const clearTranscripts = useCallback(() => {
    updateState({
      transcripts: [],
      lastTranscript: null,
    });
  }, [updateState]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && roomName && participantName) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, roomName, participantName, connect, disconnect]);

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    clearTranscripts,
    
    // Utils
    isConnecting: state.connectionState === 'connecting',
    isReconnecting: state.connectionState === 'reconnecting',
    canReconnect: state.reconnectAttempts < maxReconnectAttempts,
  };
}