import { useState } from 'react';
import { ConnectionControls } from '@/components/ConnectionControls';
import { AgentControls } from '@/components/AgentControls';
import { TeleprompterDisplay } from '@/components/TeleprompterDisplay';
import { Monitor } from 'lucide-react';

export default function TeleprompterPage() {
  const [roomName, setRoomName] = useState('teleprompter-session');
  const [participantName, setParticipantName] = useState('User');
  const [isRoomConnected, setIsRoomConnected] = useState(false);

  const handleConnect = (newRoomName: string, newParticipantName: string) => {
    setRoomName(newRoomName);
    setParticipantName(newParticipantName);
    setIsRoomConnected(true);
  };

  const handleDisconnect = () => {
    setIsRoomConnected(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Teleprompter</h1>
            </div>

            <ConnectionControls
              isConnected={isRoomConnected}
              roomName={roomName}
              participantName={participantName}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {isRoomConnected ? (
          <div className="space-y-4">
            {/* Agent Controls */}
            <AgentControls
              roomName={roomName}
              participantName={participantName}
              isRoomConnected={isRoomConnected}
            />

            {/* Teleprompter Display */}
            <TeleprompterDisplay
              roomName={roomName}
              participantName={participantName}
              className="min-h-[70vh]"
            />
          </div>
        ) : (
          /* Simple Welcome */
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center space-y-4">
              <Monitor className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Connect to get started</h2>
              <p className="text-muted-foreground">
                Click &quot;Connect to Room&quot; above to start receiving transcripts
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}