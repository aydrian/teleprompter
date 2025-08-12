import { agentManager } from "@/lib/agent/agent-manager";
import type { Route } from "./+types/status";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const status = agentManager.getStatus();
    
    return Response.json({
      success: true,
      status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get agent status";
    return Response.json(
      { success: false, message },
      { status: 500 }
    );
  }
}