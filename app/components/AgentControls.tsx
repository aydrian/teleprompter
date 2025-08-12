import { useState } from 'react';
import { useFetcher } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  Mic, 
  Activity, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';

interface AgentStatus {
  active: boolean;
  connected: boolean;
  transcribing: boolean;
  roomName?: string;
  participantCount?: number;
  lastActivity?: number;
  error?: string;
}

interface AgentControlsProps {
  roomName: string;
  participantName: string;
  isRoomConnected: boolean;
  className?: string;
}

export function AgentControls({ 
  roomName, 
  participantName, 
  isRoomConnected,
  className 
}: AgentControlsProps) {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    active: false,
    connected: false,
    transcribing: false,
  });

  const startFetcher = useFetcher();
  const stopFetcher = useFetcher();
  const statusFetcher = useFetcher();

  const isStarting = startFetcher.state === 'submitting';
  const isStopping = stopFetcher.state === 'submitting';
  const isLoading = isStarting || isStopping;

  const handleStartAgent = () => {
    const formData = new FormData();
    formData.append('roomName', roomName);
    formData.append('participantName', participantName);
    
    startFetcher.submit(formData, {
      method: 'post',
      action: '/api/agent/start'
    });
  };

  const handleStopAgent = () => {
    const formData = new FormData();
    formData.append('roomName', roomName);
    
    stopFetcher.submit(formData, {
      method: 'post',
      action: '/api/agent/stop'
    });
  };

  const handleCheckStatus = () => {
    statusFetcher.load(`/api/agent/status?room=${encodeURIComponent(roomName)}`);
  };

  const getAgentStatusBadge = () => {
    if (!agentStatus.connected) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Disconnected
        </Badge>
      );
    }

    if (agentStatus.active && agentStatus.transcribing) {
      return (
        <Badge variant="default" className="gap-1">
          <Activity className="h-3 w-3" />
          Active & Transcribing
        </Badge>
      );
    }

    if (agentStatus.active) {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  const canStartAgent = isRoomConnected && !agentStatus.active && !isLoading;
  const canStopAgent = agentStatus.active && !isLoading;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Teleprompter Agent</CardTitle>
          {getAgentStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mic className="h-3 w-3" />
              Speech Recognition
            </div>
            <div className="font-medium">
              {agentStatus.transcribing ? 'Active' : 'Inactive'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              Room Participants
            </div>
            <div className="font-medium">
              {agentStatus.participantCount || 0}
            </div>
          </div>
        </div>

        {/* Agent Controls */}
        <Separator />
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={handleStartAgent}
              disabled={!canStartAgent}
              className="flex-1"
              variant={agentStatus.active ? "outline" : "default"}
            >
              {isStarting ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Agent
                </>
              )}
            </Button>

            <Button
              onClick={handleStopAgent}
              disabled={!canStopAgent}
              variant="destructive"
              className="flex-1"
            >
              {isStopping ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Agent
                </>
              )}
            </Button>
          </div>

          <Button
            onClick={handleCheckStatus}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={statusFetcher.state === 'loading'}
          >
            {statusFetcher.state === 'loading' ? (
              <>
                <Activity className="h-3 w-3 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Refresh Status'
            )}
          </Button>
        </div>

        {/* Error Display */}
        {agentStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{agentStatus.error}</AlertDescription>
          </Alert>
        )}

        {/* Connection Requirements */}
        {!isRoomConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect to a LiveKit room first to enable agent controls.
            </AlertDescription>
          </Alert>
        )}

        {/* Last Activity */}
        {agentStatus.lastActivity && (
          <div className="text-xs text-muted-foreground">
            Last activity: {new Date(agentStatus.lastActivity).toLocaleTimeString()}
          </div>
        )}

        {/* Fetcher Results */}
        {(startFetcher.data || stopFetcher.data || statusFetcher.data) && (
          <div className="text-xs bg-muted p-2 rounded">
            <details>
              <summary className="cursor-pointer">Debug Response</summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(
                  startFetcher.data || stopFetcher.data || statusFetcher.data, 
                  null, 
                  2
                )}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}