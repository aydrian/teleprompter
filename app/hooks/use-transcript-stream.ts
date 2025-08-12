import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  WebSocketMessage,
  ClientMessage,
  ServerResponse,
  TranscriptData,
  ConnectionState,
  TranscriptStreamConfig,
} from '@/lib/types/transcript';

interface UseTranscriptStreamOptions {
  roomName: string;
  participantName: string;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface TranscriptStreamState {
  connectionState: ConnectionState;
  isConnected: boolean;
  transcripts: TranscriptData[];
  lastTranscript: TranscriptData | null;
  error: string | null;
  reconnectAttempts: number;
}

export function useTranscriptStream(options: UseTranscriptStreamOptions) {
  const {
    roomName,
    participantName,
    autoConnect = true,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [state, setState] = useState<TranscriptStreamState>({
    connectionState: 'disconnected',
    isConnected: false,
    transcripts: [],
    lastTranscript: null,
    error: null,
    reconnectAttempts: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const updateState = useCallback((updates: Partial<TranscriptStreamState>) => {
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
      const message: WebSocketMessage | ServerResponse = JSON.parse(event.data);

      switch (message.type) {
        case 'transcript': {
          const transcriptMessage = message as WebSocketMessage;
          if (transcriptMessage.data) {
            updateState({
              lastTranscript: transcriptMessage.data,
              transcripts: prev => [...prev, transcriptMessage.data!],
              error: null,
            });
          }
          break;
        }

        case 'status': {
          const statusMessage = message as WebSocketMessage;
          updateState({
            connectionState: statusMessage.status || 'connected',
            error: statusMessage.status === 'error' ? statusMessage.message : null,
          });
          break;
        }

        case 'success':
        case 'error':
        case 'ack': {
          const serverResponse = message as ServerResponse;
          if (serverResponse.type === 'error') {
            updateState({ error: serverResponse.message });
          }
          break;
        }

        default:
          console.warn('Unknown message type:', message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      updateState({ error: 'Failed to parse message from server' });
    }
  }, [updateState]);

  const handleOpen = useCallback(() => {
    console.log('WebSocket connection opened');
    updateState({
      connectionState: 'connected',
      isConnected: true,
      error: null,
      reconnectAttempts: 0,
    });

    // Subscribe to transcript updates
    const subscribeMessage: ClientMessage = {
      type: 'subscribe',
      roomName,
      participantName,
      timestamp: Date.now(),
    };

    wsRef.current?.send(JSON.stringify(subscribeMessage));
  }, [roomName, participantName, updateState]);

  const handleClose = useCallback((event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    
    wsRef.current = null;
    isConnectingRef.current = false;
    
    updateState({
      connectionState: 'disconnected',
      isConnected: false,
    });

    // Auto-reconnect if enabled and not a normal closure
    if (autoReconnect && event.code !== 1000 && state.reconnectAttempts < maxReconnectAttempts) {
      updateState({
        connectionState: 'reconnecting',
        reconnectAttempts: prev => prev + 1,
      });

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectInterval);
    }
  }, [autoReconnect, maxReconnectAttempts, reconnectInterval, state.reconnectAttempts, updateState]);

  const handleError = useCallback((event: Event) => {
    console.error('WebSocket error:', event);
    updateState({
      connectionState: 'error',
      error: 'WebSocket connection error',
    });
  }, [updateState]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnectingRef.current) {
      return;
    }

    clearReconnectTimeout();
    isConnectingRef.current = true;

    updateState({
      connectionState: 'connecting',
      error: null,
    });

    try {
      const wsUrl = new URL('/api/transcripts.ws', window.location.origin);
      wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl.searchParams.set('room', roomName);
      wsUrl.searchParams.set('participant', participantName);

      const ws = new WebSocket(wsUrl.toString());
      
      ws.addEventListener('open', handleOpen);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('close', handleClose);
      ws.addEventListener('error', handleError);

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      isConnectingRef.current = false;
      updateState({
        connectionState: 'error',
        error: 'Failed to create WebSocket connection',
      });
    }
  }, [roomName, participantName, handleOpen, handleMessage, handleClose, handleError, clearReconnectTimeout, updateState]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    
    if (wsRef.current) {
      // Send unsubscribe message before closing
      const unsubscribeMessage: ClientMessage = {
        type: 'unsubscribe',
        timestamp: Date.now(),
      };

      try {
        wsRef.current.send(JSON.stringify(unsubscribeMessage));
      } catch (error) {
        console.warn('Failed to send unsubscribe message:', error);
      }

      wsRef.current.close(1000, 'Normal closure');
      wsRef.current = null;
    }

    isConnectingRef.current = false;
    
    updateState({
      connectionState: 'disconnected',
      isConnected: false,
      reconnectAttempts: 0,
    });
  }, [clearReconnectTimeout, updateState]);

  const sendControlMessage = useCallback((action: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send control message');
      return;
    }

    const controlMessage: ClientMessage = {
      type: 'control',
      action,
      timestamp: Date.now(),
    };

    wsRef.current.send(JSON.stringify(controlMessage));
  }, []);

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
    sendControlMessage,
    clearTranscripts,
    
    // Utils
    isConnecting: state.connectionState === 'connecting',
    isReconnecting: state.connectionState === 'reconnecting',
    canReconnect: state.reconnectAttempts < maxReconnectAttempts,
  };
}