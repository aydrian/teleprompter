import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  
  // Main Application Routes
  route("teleprompter", "routes/teleprompter.tsx"),
  route("transcript-test", "routes/transcript-test.tsx"),
  
  // API Routes
  route("api/livekit/token", "routes/api/livekit/token.ts"),
  route("api/transcripts.sse", "routes/api/transcripts.sse.ts"),
  route("api/test-transcript", "routes/api/test-transcript.ts"),
  
  // Agent API Routes
  route("api/agent/start", "routes/api/agent/start.ts"),
  route("api/agent/stop", "routes/api/agent/stop.ts"),
  route("api/agent/status", "routes/api/agent/status.ts"),
] satisfies RouteConfig;
