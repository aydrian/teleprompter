import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLiveKitRoom } from "@/hooks/use-livekit-room";

export function LiveKitTest() {
  const [roomName, setRoomName] = useState("test-room");
  const [participantName, setParticipantName] = useState("test-user");
  
  const {
    room,
    connectionState,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  } = useLiveKitRoom();

  const handleConnect = () => {
    connect(roomName, participantName);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>LiveKit Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            disabled={isConnected || isConnecting}
          />
          <Input
            placeholder="Participant name"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            disabled={isConnected || isConnecting}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={isConnected || isConnecting || !roomName || !participantName}
            className="flex-1"
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
          <Button
            onClick={disconnect}
            disabled={!isConnected}
            variant="outline"
            className="flex-1"
          >
            Disconnect
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Status: <span className="font-medium">{connectionState}</span>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isConnected && room && (
          <Alert>
            <AlertDescription>
              Connected to room "{room.name}" as "{room.localParticipant.identity}"
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}