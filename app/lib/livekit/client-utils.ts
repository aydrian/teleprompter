import { Room, RoomEvent, RemoteParticipant } from "livekit-client";

export interface TokenResponse {
  token: string;
  wsUrl: string;
  room: string;
  identity: string;
}

/**
 * Fetch a token from the server
 */
export async function fetchToken(roomName: string, participantName: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    room: roomName,
    name: participantName,
  });

  const response = await fetch(`/api/livekit/token?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Connect to a LiveKit room
 */
export async function connectToRoom(roomName: string, participantName: string): Promise<Room> {
  const tokenData = await fetchToken(roomName, participantName);
  
  const room = new Room({
    // Automatically manage audio/video tracks
    adaptiveStream: true,
    dynacast: true,
  });

  // Set up event listeners
  room.on(RoomEvent.Connected, () => {
    console.log("Connected to room:", tokenData.room);
  });

  room.on(RoomEvent.Disconnected, (reason) => {
    console.log("Disconnected from room:", reason);
  });

  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    console.log("Participant connected:", participant.identity);
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    console.log("Participant disconnected:", participant.identity);
  });

  // Connect to the room
  await room.connect(tokenData.wsUrl, tokenData.token);
  
  return room;
}

/**
 * Disconnect from a LiveKit room
 */
export function disconnectFromRoom(room: Room) {
  room.disconnect();
}