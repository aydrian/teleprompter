import { AccessToken } from "livekit-server-sdk";
import type { Route } from "./+types/token";

// Handle POST requests (for automatic room/participant assignment)
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    // If room and participant are provided, use them; otherwise auto-assign
    const roomName = body.roomName || "teleprompter-room";
    const participantName = body.participantName || `User-${Date.now()}`;

    console.log('🎫 Token API: Generating token for:', { roomName, participantName });
    return await generateToken(roomName, participantName);
  } catch (error) {
    console.error("Error in token action:", error);
    throw new Response("Failed to process token request", { status: 500 });
  }
}

// Handle GET requests (for query parameter based requests)
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const roomName = url.searchParams.get("room");
  const participantName = url.searchParams.get("name");

  if (!roomName || !participantName) {
    throw new Response("Missing room or name parameter", { status: 400 });
  }

  return await generateToken(roomName, participantName);
}

// Shared token generation function
async function generateToken(roomName: string, participantName: string) {
  // Get environment variables
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    throw new Response("LiveKit credentials not configured", { status: 500 });
  }

  try {
    // Create access token with metadata to trigger agent assignment
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      // Add metadata that might trigger agent assignment
      metadata: JSON.stringify({
        requestAgent: true,
        agentType: 'teleprompter',
      }),
    });

    // Grant permissions
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      // Add agent-related permissions to trigger agent assignment
      roomAdmin: true, // Allow room administration
    });

    console.log('🔧 Token API: Added grants for room:', roomName);

    const jwt = await token.toJwt();

    const tokenData = {
      token: jwt,
      wsUrl,
      room: roomName,
      roomName: roomName, // Add both for compatibility
      identity: participantName,
      participantName: participantName, // Add both for compatibility
    };

    console.log('✅ Token API: Generated token:', {
      hasToken: !!jwt,
      tokenLength: jwt.length,
      wsUrl,
      roomName,
      participantName,
    });

    return tokenData;
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Response("Failed to generate token", { status: 500 });
  }
}