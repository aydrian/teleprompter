import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, User, Hash } from 'lucide-react';

interface ConnectionControlsProps {
  isConnected: boolean;
  roomName: string;
  participantName: string;
  onConnect: (roomName: string, participantName: string) => void;
  onDisconnect: () => void;
  className?: string;
}

export function ConnectionControls({
  isConnected,
  roomName: currentRoomName,
  participantName: currentParticipantName,
  onConnect,
  onDisconnect,
  className,
}: ConnectionControlsProps) {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState(currentRoomName);
  const [participantName, setParticipantName] = useState(currentParticipantName);

  const handleConnect = () => {
    if (roomName.trim() && participantName.trim()) {
      onConnect(roomName.trim(), participantName.trim());
      setOpen(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isConnected ? "outline" : "default"} className={className}>
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 mr-2" />
              Connect to Room
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isConnected ? 'Room Connection' : 'Connect to LiveKit Room'}
          </DialogTitle>
          <DialogDescription>
            {isConnected 
              ? 'Manage your current room connection or change rooms.'
              : 'Enter the room details to join a LiveKit session for real-time transcription.'
            }
          </DialogDescription>
        </DialogHeader>

        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  Current Room
                </div>
                <div className="font-medium">{currentRoomName}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  Participant
                </div>
                <div className="font-medium">{currentParticipantName}</div>
              </div>
            </div>
            
            <Separator />
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name (e.g., teleprompter-session-1)"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              The room identifier for your teleprompter session
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participant-name">Your Name</Label>
            <Input
              id="participant-name"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How you'll appear to other participants in the room
            </p>
          </div>

          {!isConnected && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <div className="font-medium mb-2">What happens when you connect:</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Join the LiveKit room for real-time audio</li>
                <li>• Start receiving live transcript updates</li>
                <li>• Enable teleprompter agent interaction</li>
                <li>• Begin speech-to-text processing</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isConnected ? (
            <>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
              <Button 
                onClick={handleConnect}
                disabled={!roomName.trim() || !participantName.trim()}
              >
                Switch Room
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleConnect}
              disabled={!roomName.trim() || !participantName.trim()}
              className="w-full sm:w-auto"
            >
              Connect to Room
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}