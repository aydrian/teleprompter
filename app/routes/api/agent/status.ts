import { agentManager } from "@/lib/agent/agent-manager";

export async function loader() {
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