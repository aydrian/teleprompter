// Server-Sent Events Resource Route for real-time transcript streaming
import type { TranscriptData, ConnectionState } from '@/lib/types/transcript';

// Store active SSE connections
const connections = new Map<string, { controller: ReadableStreamDefaultController; abortController: AbortController }>();
const roomConnections = new Map<string, Set<string>>();

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const roomName = url.searchParams.get('room');
  const participantName = url.searchParams.get('participant');

  if (!roomName || !participantName) {
    return new Response('Missing room or participant parameter', { status: 400 });
  }

  const connectionId = `${roomName}:${participantName}:${Date.now()}`;
  
  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Store connection
      const abortController = new AbortController();
      connections.set(connectionId, { controller, abortController });
      
      // Add to room connections
      if (!roomConnections.has(roomName)) {
        roomConnections.set(roomName, new Set());
      }
      roomConnections.get(roomName)!.add(connectionId);

      // Send initial connection message
      const message = {
        type: 'status',
        status: 'connected',
        message: 'Connected to transcript stream',
        timestamp: Date.now(),
      };
      
      controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
      
      console.log(`SSE connection opened: ${connectionId}`);
    },
    
    cancel() {
      cleanup(connectionId, roomName);
      console.log(`SSE connection closed: ${connectionId}`);
    }
  });

  // Handle connection cleanup when request is aborted
  request.signal.addEventListener('abort', () => {
    cleanup(connectionId, roomName);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

function cleanup(connectionId: string, roomName: string) {
  // Close controller if it exists
  const connection = connections.get(connectionId);
  if (connection) {
    try {
      connection.controller.close();
    } catch (error) {
      // Controller might already be closed
    }
    connection.abortController.abort();
  }
  
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

  const message = {
    type: 'transcript',
    data: transcript,
    sessionId: `${roomName}:${Date.now()}`,
  };

  const data = `data: ${JSON.stringify(message)}\n\n`;
  
  // Send to all connections in the room
  for (const connectionId of roomConns) {
    const connection = connections.get(connectionId);
    if (connection && connection.controller) {
      try {
        connection.controller.enqueue(data);
      } catch (error) {
        console.error(`Failed to send to ${connectionId}:`, error);
        // Clean up failed connection
        const [room] = connectionId.split(':');
        cleanup(connectionId, room);
      }
    }
  }
  
  // For testing - simulate transcripts
  console.log(`Broadcasting transcript to room ${roomName}:`, transcript.text);
}

// Function to broadcast status updates
export function broadcastStatus(roomName: string, status: ConnectionState, message?: string) {
  const roomConns = roomConnections.get(roomName);
  if (!roomConns) {
    return;
  }

  const statusMessage = {
    type: 'status',
    status,
    message,
    timestamp: Date.now(),
  };

  const data = `data: ${JSON.stringify(statusMessage)}\n\n`;
  
  for (const connectionId of roomConns) {
    const connection = connections.get(connectionId);
    if (connection && connection.controller) {
      try {
        connection.controller.enqueue(data);
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