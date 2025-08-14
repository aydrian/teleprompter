import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/teleprompter.tsx"),
  
  // API Routes
  route("api/livekit/token", "routes/api/livekit/token.ts"),
  route("api/livekit/config", "routes/api/livekit/config.ts"),
] satisfies RouteConfig;
