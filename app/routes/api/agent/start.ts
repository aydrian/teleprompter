import { agentManager } from "@/lib/agent/agent-manager";
import type { Route } from "./+types/start";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }

  try {
    if (agentManager.isRunning()) {
      throw new Response(
        JSON.stringify({ success: false, message: "Agent is already running" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await agentManager.startAgent();
    
    return {
      success: true,
      message: "TeleprompterAgent started successfully",
      status: agentManager.getStatus(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start agent";
    throw new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}