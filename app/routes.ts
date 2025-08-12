import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  
  // API Routes
  route("api/livekit/token", "routes/api/livekit/token.ts"),
] satisfies RouteConfig;
