// WebSocket Resource Route for real-time transcript streaming
import type { 
  WebSocketMessage, 
  ClientMessage, 
  ServerResponse,
  TranscriptData,
  ConnectionState 
} from "@/lib/types/transcript";

// Store active WebSocket connections
const connections = new Map<string, WebSocket>();
const roomConnections = new Map<string, Set<string>>();

export async function loader({ request }: { request: Request }) {
  // Handle WebSocket upgrade
  if (request.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const url = new URL(request.url);
  const roomName = url.searchParams.get("room");
  const participantName = url.searchParams.get("participant");

  if (!roomName || !participantName) {
    return new Response("Missing room or participant parameter", { status: 400 });
  }

  // Note: WebSocket upgrade handling differs by runtime
  // This is a placeholder - actual implementation depends on React Router v7's WebSocket support
  throw new Error("WebSocket upgrade not yet implemented for this runtime");
  
  const connectionId = `${roomName}:${participantName}:${Date.now()}`;
  
  // Store connection
  connections.set(connectionId, server);
  
  // Add to room connections
  if (!roomConnections.has(roomName)) {
    roomConnections.set(roomName, new Set());
  }
  roomConnections.get(roomName)!.add(connectionId);

  // Handle WebSocket events
  server.accept();
  
  server.addEventListener("open", () => {
    console.log(`WebSocket connection opened: ${connectionId}`);
    
    // Send connection confirmation
    const statusMessage: ServerResponse = {
      type: "success",
      message: "Connected to transcript stream",
      timestamp: Date.now(),
    };
    
    server.send(JSON.stringify(statusMessage));
  });

  server.addEventListener("message", (event) => {
    try {
      const message: ClientMessage = JSON.parse(event.data as string);
      handleClientMessage(connectionId, message, server);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
      
      const errorResponse: ServerResponse = {
        type: "error",
        message: "Invalid message format",
        timestamp: Date.now(),
      };
      
      server.send(JSON.stringify(errorResponse));
    }
  });

  server.addEventListener("close", (event) => {
    console.log(`WebSocket connection closed: ${connectionId}`, event.code, event.reason);
    cleanup(connectionId, roomName);
  });

  server.addEventListener("error", (event) => {
    console.error(`WebSocket error: ${connectionId}`, event);
    cleanup(connectionId, roomName);
  });

  // Return the client WebSocket to the browser
  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

function handleClientMessage(
  connectionId: string, 
  message: ClientMessage, 
  socket: WebSocket
) {
  console.log(`Received message from ${connectionId}:`, message);
  
  switch (message.type) {
    case "subscribe":
      // Client wants to subscribe to transcript updates
      const subscribeResponse: ServerResponse = {
        type: "success",
        message: "Subscribed to transcript updates",
        timestamp: Date.now(),
      };
      socket.send(JSON.stringify(subscribeResponse));
      break;
      
    case "unsubscribe":
      // Client wants to unsubscribe
      const unsubscribeResponse: ServerResponse = {
        type: "success", 
        message: "Unsubscribed from transcript updates",
        timestamp: Date.now(),
      };
      socket.send(JSON.stringify(unsubscribeResponse));
      break;
      
    case "control":
      // Handle control commands (start/stop/pause/resume)
      handleControlMessage(connectionId, message, socket);
      break;
      
    default:
      const errorResponse: ServerResponse = {
        type: "error",
        message: `Unknown message type: ${message.type}`,
        timestamp: Date.now(),
      };
      socket.send(JSON.stringify(errorResponse));
  }
}

function handleControlMessage(
  connectionId: string,
  message: ClientMessage,
  socket: WebSocket
) {
  // Forward control commands to the agent
  // This would integrate with the AgentManager
  
  const response: ServerResponse = {
    type: "success",
    message: `Control action '${message.action}' processed`,
    timestamp: Date.now(),
  };
  
  socket.send(JSON.stringify(response));
}

function cleanup(connectionId: string, roomName: string) {
  // Remove connection
  connections.delete(connectionId);
  
  // Remove from room connections
  const roomConns = roomConnections.get(roomName);
  if (roomConns) {
    roomConns.delete(connectionId);
    if (roomConns.size === 0) {
      roomConnections.delete(roomName);
    }
  }
}

// Function to broadcast transcript to all connected clients in a room
export function broadcastTranscript(roomName: string, transcript: TranscriptData) {
  const roomConns = roomConnections.get(roomName);
  if (!roomConns) {
    return;
  }

  const message: WebSocketMessage = {
    type: "transcript",
    data: transcript,
    sessionId: `${roomName}:${Date.now()}`,
  };

  const messageStr = JSON.stringify(message);
  
  // Send to all connections in the room
  for (const connectionId of roomConns) {
    const socket = connections.get(connectionId);
    if (socket && socket.readyState === WebSocket.READY_STATE_OPEN) {
      try {
        socket.send(messageStr);
      } catch (error) {
        console.error(`Failed to send to ${connectionId}:`, error);
        // Clean up failed connection
        const [room] = connectionId.split(":");
        cleanup(connectionId, room);
      }
    }
  }
}

// Function to broadcast status updates
export function broadcastStatus(roomName: string, status: ConnectionState, message?: string) {
  const roomConns = roomConnections.get(roomName);
  if (!roomConns) {
    return;
  }

  const statusMessage: WebSocketMessage = {
    type: "status",
    status,
    message,
    timestamp: Date.now(),
  };

  const messageStr = JSON.stringify(statusMessage);
  
  for (const connectionId of roomConns) {
    const socket = connections.get(connectionId);
    if (socket && socket.readyState === WebSocket.READY_STATE_OPEN) {
      try {
        socket.send(messageStr);
      } catch (error) {
        console.error(`Failed to send status to ${connectionId}:`, error);
      }
    }
  }
}

// Export connection info for debugging
export function getConnectionInfo() {
  return {
    totalConnections: connections.size,
    roomConnections: Object.fromEntries(
      Array.from(roomConnections.entries()).map(([room, conns]) => [
        room,
        conns.size,
      ])
    ),
  };
}