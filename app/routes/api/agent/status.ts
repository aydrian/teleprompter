import { agentManager } from "@/lib/agent/agent-manager";

export async function loader() {
  try {
    const status = agentManager.getStatus();
    
    return {
      success: true,
      status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get agent status";
    throw new Response(
      JSON.stringify({ success: false, message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}