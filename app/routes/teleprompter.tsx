import { useState, useEffect } from 'react';
import { ConnectionControls } from '@/components/ConnectionControls';
import { AgentControls } from '@/components/AgentControls';
import { MediaPreview } from '@/components/MediaPreview';
import { TeleprompterDisplay } from '@/components/TeleprompterDisplay';
import { SettingsPanel, DEFAULT_SETTINGS } from '@/components/SettingsPanel';
import type { TeleprompterSettings } from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Settings, 
  Mic, 
  Video, 
  Info,
  ExternalLink,
  Github,
  BookOpen
} from 'lucide-react';

const STORAGE_KEY = 'teleprompter-settings';

export default function TeleprompterPage() {
  const [roomName, setRoomName] = useState('teleprompter-session-1');
  const [participantName, setParticipantName] = useState('User');
  const [isRoomConnected, setIsRoomConnected] = useState(false);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [settings, setSettings] = useState<TeleprompterSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const handleConnect = (newRoomName: string, newParticipantName: string) => {
    setRoomName(newRoomName);
    setParticipantName(newParticipantName);
    setIsRoomConnected(true);
  };

  const handleDisconnect = () => {
    setIsRoomConnected(false);
  };

  const handleMediaPermissionGranted = (hasAudio: boolean, hasVideo: boolean) => {
    setHasMediaPermissions(hasAudio || hasVideo);
  };

  const handleMediaPermissionDenied = (error: string) => {
    setHasMediaPermissions(false);
    console.error('Media permission denied:', error);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">LiveKit Teleprompter</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time speech transcription for presentations and speeches
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ConnectionControls
                isConnected={isRoomConnected}
                roomName={roomName}
                participantName={participantName}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
              
              <SettingsPanel
                settings={settings}
                onSettingsChange={setSettings}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {isRoomConnected ? (
          <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
            {/* Sidebar */}
            <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
              <div className="h-full pr-4 space-y-4">
                {/* Agent Controls */}
                <AgentControls
                  roomName={roomName}
                  participantName={participantName}
                  isRoomConnected={isRoomConnected}
                />

                {/* Media Preview */}
                <MediaPreview
                  isConnected={isRoomConnected}
                  onPermissionGranted={handleMediaPermissionGranted}
                  onPermissionDenied={handleMediaPermissionDenied}
                />

                {/* Connection Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Session Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Room:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {roomName}
                        </code>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Participant:</span>
                        <span className="font-medium">{participantName}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Connection:</span>
                        <Badge variant="default" className="gap-1">
                          {isRoomConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Media:</span>
                        <Badge 
                          variant={hasMediaPermissions ? "default" : "secondary"} 
                          className="gap-1"
                        >
                          {hasMediaPermissions ? 'Enabled' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Help Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Quick Start
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        1. Start the teleprompter agent
                      </p>
                      <p className="text-muted-foreground">
                        2. Grant microphone permissions
                      </p>
                      <p className="text-muted-foreground">
                        3. Begin speaking to see transcripts
                      </p>
                      <p className="text-muted-foreground">
                        4. Use fullscreen for presentations
                      </p>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Docs
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Github className="h-3 w-3 mr-1" />
                        GitHub
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Teleprompter Display */}
            <ResizablePanel defaultSize={70}>
              <div className="h-full pl-4">
                <TeleprompterDisplay
                  roomName={roomName}
                  participantName={participantName}
                  settings={settings}
                  className="h-full"
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* Welcome Screen */
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16 space-y-8">
              <div className="space-y-4">
                <Monitor className="h-20 w-20 mx-auto text-primary/60" />
                <h2 className="text-3xl font-bold">Welcome to LiveKit Teleprompter</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  A real-time speech-to-text teleprompter powered by LiveKit and Deepgram. 
                  Perfect for presentations, speeches, and live events.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <Card>
                  <CardContent className="p-6 text-center space-y-3">
                    <Mic className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-semibold">Real-time Transcription</h3>
                    <p className="text-sm text-muted-foreground">
                      Live speech-to-text with Deepgram AI for accurate transcription
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center space-y-3">
                    <Video className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-semibold">Multi-participant</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect multiple participants to the same session
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center space-y-3">
                    <Settings className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-semibold">Customizable</h3>
                    <p className="text-sm text-muted-foreground">
                      Adjust font size, scroll speed, and display preferences
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert className="max-w-2xl mx-auto">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Getting Started:</strong> Click "Connect to Room" above to join a session. 
                  You'll need to provide microphone access for speech recognition to work.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => {
                    // Trigger connection dialog
                    document.querySelector('[data-state]')?.click();
                  }}
                  size="lg"
                >
                  Get Started
                </Button>
                
                <Button variant="outline" size="lg">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Demo
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}