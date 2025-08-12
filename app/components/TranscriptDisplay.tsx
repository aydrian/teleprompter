import { useEffect, useRef } from 'react';
import { useTranscriptSSE } from '@/hooks/use-transcript-sse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TranscriptDisplayProps {
  roomName: string;
  participantName: string;
  className?: string;
}

export function TranscriptDisplay({ 
  roomName, 
  participantName, 
  className 
}: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const {
    connectionState,
    isConnected,
    transcripts,
    lastTranscript,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    clearTranscripts,
    isConnecting,
    isReconnecting,
    canReconnect,
  } = useTranscriptSSE({
    roomName,
    participantName,
    autoConnect: true,
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current && lastTranscript) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lastTranscript]);

  const getConnectionBadge = () => {
    const variants = {
      connected: 'default',
      connecting: 'secondary',
      disconnected: 'destructive',
      error: 'destructive',
      reconnecting: 'secondary',
    } as const;

    const icons = {
      connected: <Wifi className="h-3 w-3" />,
      connecting: <RotateCcw className="h-3 w-3 animate-spin" />,
      disconnected: <WifiOff className="h-3 w-3" />,
      error: <AlertCircle className="h-3 w-3" />,
      reconnecting: <RotateCcw className="h-3 w-3 animate-spin" />,
    };

    return (
      <Badge variant={variants[connectionState]} className="gap-1">
        {icons[connectionState]}
        {connectionState}
        {isReconnecting && ` (${reconnectAttempts}/5)`}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Transcript</CardTitle>
          <div className="flex items-center gap-2">
            {getConnectionBadge()}
            
            <div className="flex gap-1">
              {!isConnected && !isConnecting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connect}
                  disabled={!canReconnect}
                >
                  Connect
                </Button>
              )}
              
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                >
                  Disconnect
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearTranscripts}
                disabled={transcripts.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Room: {roomName} • Participant: {participantName}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="h-[400px] w-full rounded border" ref={scrollRef}>
          <div className="p-4 space-y-3">
            {transcripts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {isConnected ? (
                  "Listening for speech... Start speaking to see transcripts."
                ) : (
                  "Connect to start receiving transcripts."
                )}
              </div>
            ) : (
              transcripts.map((transcript, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    transcript.isFinal 
                      ? 'bg-background border-border' 
                      : 'bg-muted/50 border-dashed border-muted-foreground/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-relaxed ${
                      transcript.isFinal ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {transcript.text}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      {!transcript.isFinal && (
                        <Badge variant="secondary" className="text-xs">
                          interim
                        </Badge>
                      )}
                      <span>{formatTimestamp(transcript.timestamp)}</span>
                    </div>
                  </div>
                  
                  {transcript.confidence && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Confidence: {Math.round(transcript.confidence * 100)}%
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {lastTranscript && (
          <div className="text-xs text-muted-foreground">
            Last update: {formatTimestamp(lastTranscript.timestamp)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}