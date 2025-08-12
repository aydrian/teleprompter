import { agentManager } from "@/lib/agent/agent-manager";
import type { Route } from "./+types/stop";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }

  try {
    if (!agentManager.isRunning()) {
      return Response.json(
        { success: false, message: "Agent is not running" },
        { status: 400 }
      );
    }

    await agentManager.stopAgent();
    
    return Response.json({
      success: true,
      message: "TeleprompterAgent stopped successfully",
      status: agentManager.getStatus(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to stop agent";
    return Response.json(
      { success: false, message },
      { status: 500 }
    );
  }
}