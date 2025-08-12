import { useState } from 'react';
import { Form, useFetcher } from 'react-router';
import { TranscriptDisplay } from '@/components/TranscriptDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

export default function TranscriptTestPage() {
  const [roomName, setRoomName] = useState('test-room');
  const [participantName, setParticipantName] = useState('test-user');
  const [isConnected, setIsConnected] = useState(false);
  const [testText, setTestText] = useState('Hello, this is a test transcript message.');
  const [isFinal, setIsFinal] = useState(true);
  
  const fetcher = useFetcher();

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">
          Transcript WebSocket Test
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Test the real-time transcript streaming functionality
        </p>

        {!isConnected ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="participantName">Participant Name</Label>
                <Input
                  id="participantName"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              
              <Button 
                onClick={handleConnect}
                disabled={!roomName.trim() || !participantName.trim()}
                className="w-full"
              >
                Connect to Transcript Stream
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <TranscriptDisplay
              roomName={roomName}
              participantName={participantName}
              className="w-full"
            />
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Transcript Broadcast</CardTitle>
                </CardHeader>
                <CardContent>
                  <fetcher.Form method="post" action="/api/test-transcript" className="space-y-4">
                    <input type="hidden" name="roomName" value={roomName} />
                    
                    <div className="space-y-2">
                      <Label htmlFor="testText">Test Text</Label>
                      <Textarea
                        id="testText"
                        name="text"
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        placeholder="Enter text to broadcast"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFinal"
                        name="isFinal"
                        checked={isFinal}
                        onCheckedChange={(checked) => setIsFinal(!!checked)}
                      />
                      <Label htmlFor="isFinal">Final transcript (unchecked = interim)</Label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={!testText.trim() || fetcher.state === 'submitting'}
                      className="w-full"
                    >
                      {fetcher.state === 'submitting' ? 'Broadcasting...' : 'Broadcast Test Transcript'}
                    </Button>
                  </fetcher.Form>
                  
                  {fetcher.data && (
                    <div className="mt-4 p-3 rounded bg-muted text-sm">
                      <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleDisconnect}>
                  Change Connection Settings
                </Button>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Start the Teleprompter Agent:</strong>
              <p className="text-muted-foreground">
                The LiveKit agent needs to be running and connected to the same room
                to generate transcripts.
              </p>
            </div>
            
            <div>
              <strong>2. SSE Connection:</strong>
              <p className="text-muted-foreground">
                This component connects to <code>/api/transcripts.sse</code> using Server-Sent Events
                and listens for real-time transcript updates.
              </p>
            </div>
            
            <div>
              <strong>3. Expected Behavior:</strong>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>SSE connection should connect automatically</li>
                <li>Interim transcripts appear with dashed borders</li>
                <li>Final transcripts appear with solid borders</li>
                <li>Auto-scrolling to latest transcript</li>
                <li>Connection status and automatic reconnection</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}