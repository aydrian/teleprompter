// Transcript message types for real-time communication

export interface TranscriptData {
  text: string;
  isFinal: boolean;
  timestamp: number;
  participantIdentity: string;
  confidence?: number;
  wordTimestamps?: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface TranscriptMessage {
  type: 'transcript';
  data: TranscriptData;
  sessionId: string;
}

export interface TranscriptStatusMessage {
  type: 'status';
  status: 'connected' | 'disconnected' | 'error' | 'ready';
  message?: string;
  timestamp: number;
}

export interface TranscriptControlMessage {
  type: 'control';
  action: 'start' | 'stop' | 'pause' | 'resume' | 'clear';
  timestamp: number;
}

export interface TranscriptErrorMessage {
  type: 'error';
  error: string;
  code?: string;
  timestamp: number;
}

// Union type for all possible WebSocket messages
export type WebSocketMessage = 
  | TranscriptMessage 
  | TranscriptStatusMessage 
  | TranscriptControlMessage 
  | TranscriptErrorMessage;

// Client-to-server messages
export interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'control';
  roomName?: string;
  participantName?: string;
  action?: string;
  timestamp: number;
}

// Server response messages
export interface ServerResponse {
  type: 'success' | 'error' | 'ack';
  message: string;
  timestamp: number;
  requestId?: string;
}

// WebSocket connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

// Transcript streaming configuration
export interface TranscriptStreamConfig {
  roomName: string;
  participantName: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  bufferSize: number;
}