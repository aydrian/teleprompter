import { AccessToken } from "livekit-server-sdk";
import type { Route } from "./+types/token";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const roomName = url.searchParams.get("room");
  const participantName = url.searchParams.get("name");

  if (!roomName || !participantName) {
    throw new Response("Missing room or name parameter", { status: 400 });
  }

  // Get environment variables
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    throw new Response("LiveKit credentials not configured", { status: 500 });
  }

  try {
    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    });

    // Grant permissions
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    return Response.json({
      token: jwt,
      wsUrl,
      room: roomName,
      identity: participantName,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Response("Failed to generate token", { status: 500 });
  }
}