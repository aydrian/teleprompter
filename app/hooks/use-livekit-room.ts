import { useState, useEffect, useCallback } from "react";
import { Room, RoomEvent, ConnectionState } from "livekit-client";
import { connectToRoom, disconnectFromRoom } from "@/lib/livekit/client-utils";

export interface UseLiveKitRoomOptions {
  roomName?: string;
  participantName?: string;
  autoConnect?: boolean;
}

export interface UseLiveKitRoomReturn {
  room: Room | null;
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (roomName: string, participantName: string) => Promise<void>;
  disconnect: () => void;
}

export function useLiveKitRoom(options: UseLiveKitRoomOptions = {}): UseLiveKitRoomReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectionState === ConnectionState.Connected;
  const isConnecting = connectionState === ConnectionState.Connecting;

  const connect = useCallback(async (roomName: string, participantName: string) => {
    try {
      setError(null);
      setConnectionState(ConnectionState.Connecting);
      
      const newRoom = await connectToRoom(roomName, participantName);
      setRoom(newRoom);
      
      // Listen for connection state changes
      newRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        setConnectionState(state);
      });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      setConnectionState(ConnectionState.Disconnected);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (room) {
      disconnectFromRoom(room);
      setRoom(null);
      setConnectionState(ConnectionState.Disconnected);
      setError(null);
    }
  }, [room]);

  // Auto-connect if options provided
  useEffect(() => {
    if (options.autoConnect && options.roomName && options.participantName && !room) {
      connect(options.roomName, options.participantName);
    }
  }, [options.autoConnect, options.roomName, options.participantName, room, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        disconnectFromRoom(room);
      }
    };
  }, [room]);

  return {
    room,
    connectionState,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}