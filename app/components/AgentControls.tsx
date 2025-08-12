import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAgentStatus } from "@/hooks/use-agent-status";
import { Play, Square, RefreshCw } from "lucide-react";

export function AgentControls() {
  const {
    status,
    isLoading,
    error,
    startAgent,
    stopAgent,
    refreshStatus,
  } = useAgentStatus();

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          TeleprompterAgent Controls
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={status?.running ? "default" : "secondary"}>
              {status?.running ? "Running" : "Stopped"}
            </Badge>
            {status?.connected && (
              <Badge variant="outline">Connected</Badge>
            )}
          </div>
          
          {status?.lastStarted && (
            <div className="text-xs text-muted-foreground">
              Last started: {formatTimestamp(status.lastStarted)}
            </div>
          )}
          
          {status?.lastStopped && (
            <div className="text-xs text-muted-foreground">
              Last stopped: {formatTimestamp(status.lastStopped)}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={startAgent}
            disabled={isLoading || status?.running}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? "Starting..." : "Start Agent"}
          </Button>
          
          <Button
            onClick={stopAgent}
            disabled={isLoading || !status?.running}
            variant="outline"
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            {isLoading ? "Stopping..." : "Stop Agent"}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Agent Error Display */}
        {status?.error && (
          <Alert variant="destructive">
            <AlertDescription>Agent Error: {status.error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {status?.running && !error && (
          <Alert>
            <AlertDescription>
              Agent is running and ready to transcribe speech!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}