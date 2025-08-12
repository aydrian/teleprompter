import { useEffect, useRef, useState } from 'react';
import { useTranscriptSSE } from '@/hooks/use-transcript-sse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  RotateCcw, 
  Play, 
  Pause, 
  SkipForward,
  SkipBack,
  Monitor,
  Maximize,
  Minimize,
  Type,
  Eye,
  EyeOff
} from 'lucide-react';
import type { TeleprompterSettings } from './SettingsPanel';

interface TeleprompterDisplayProps {
  roomName: string;
  participantName: string;
  settings: TeleprompterSettings;
  className?: string;
}

export function TeleprompterDisplay({ 
  roomName, 
  participantName, 
  settings,
  className 
}: TeleprompterDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manualScrollPosition, setManualScrollPosition] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout>();

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

  // Filter transcripts based on settings
  const filteredTranscripts = settings.showInterim 
    ? transcripts 
    : transcripts.filter(t => t.isFinal);

  // Auto-scroll logic with speed control
  useEffect(() => {
    if (isAutoScrolling && scrollRef.current && settings.scrollSpeed > 0) {
      const interval = Math.max(50, 200 - (settings.scrollSpeed * 2));
      
      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
          const maxScroll = scrollHeight - clientHeight;
          
          if (scrollTop < maxScroll) {
            const scrollAmount = settings.scrollSpeed / 10;
            scrollRef.current.scrollTop += scrollAmount;
            setScrollProgress((scrollRef.current.scrollTop / maxScroll) * 100);
          }
        }
      }, interval);

      return () => {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
        }
      };
    }
  }, [isAutoScrolling, settings.scrollSpeed, filteredTranscripts.length]);

  // Jump to new content when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current && lastTranscript && isAutoScrolling) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [lastTranscript, isAutoScrolling]);

  // Manual scroll handling
  const handleScroll = () => {
    if (scrollRef.current && !isAutoScrolling) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const maxScroll = scrollHeight - clientHeight;
      setManualScrollPosition(scrollTop);
      setScrollProgress((scrollTop / maxScroll) * 100);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Skip forward/backward
  const skipForward = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop += 100;
      setIsAutoScrolling(false);
    }
  };

  const skipBackward = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop -= 100;
      setIsAutoScrolling(false);
    }
  };

  // Jump to top/bottom
  const jumpToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      setIsAutoScrolling(false);
    }
  };

  const jumpToBottom = () => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTop = scrollHeight - clientHeight;
      setIsAutoScrolling(true);
    }
  };

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

  // Apply dynamic styles based on settings
  const teleprompterStyles = {
    fontSize: `${settings.fontSize}px`,
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, sans-serif',
      serif: 'ui-serif, Georgia, serif',
      mono: 'ui-monospace, "Cascadia Code", monospace',
    }[settings.fontFamily],
    lineHeight: settings.lineHeight,
    wordSpacing: `${settings.wordSpacing}em`,
    backgroundColor: settings.backgroundColor,
    color: settings.textColor,
  };

  return (
    <div className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <Card className={isFullscreen ? 'h-full rounded-none border-0' : ''}>
        {/* Header - hidden in fullscreen mode */}
        {!isFullscreen && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Teleprompter
              </CardTitle>
              <div className="flex items-center gap-2">
                {getConnectionBadge()}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Room: {roomName} • Participant: {participantName}
            </div>
          </CardHeader>
        )}

        <CardContent className={`${isFullscreen ? 'h-full p-0' : 'space-y-4'}`}>
          {error && !isFullscreen && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Controls Bar */}
          <div className={`flex items-center gap-2 ${isFullscreen ? 'absolute top-4 left-4 right-4 z-10 bg-background/90 backdrop-blur rounded-lg p-2' : ''}`}>
            <Toggle
              pressed={isAutoScrolling}
              onPressedChange={setIsAutoScrolling}
              aria-label="Toggle auto-scroll"
              size="sm"
            >
              {isAutoScrolling ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Toggle>

            <Button
              variant="outline"
              size="sm"
              onClick={skipBackward}
              disabled={isAutoScrolling}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={skipForward}
              disabled={isAutoScrolling}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex-1 mx-4">
              <Progress value={scrollProgress} className="h-2" />
            </div>

            <Toggle
              pressed={settings.showInterim}
              onPressedChange={() => {}}
              aria-label="Show interim results"
              size="sm"
              disabled
            >
              {settings.showInterim ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Toggle>

            {isFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Minimize className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Transcript Display */}
          <ScrollArea 
            className={`w-full rounded ${isFullscreen ? 'h-[calc(100vh-100px)] mt-16' : 'h-[500px]'} border`}
            ref={scrollRef}
            onScrollCapture={handleScroll}
            style={teleprompterStyles}
          >
            <div className={`p-6 space-y-4 ${isFullscreen ? 'pb-20' : ''}`}>
              {filteredTranscripts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="space-y-4">
                    <Type className="h-12 w-12 mx-auto opacity-50" />
                    <div>
                      {isConnected ? (
                        <>
                          <p className="text-lg opacity-70">Listening for speech...</p>
                          <p className="text-sm opacity-50 mt-2">Start speaking to see transcripts appear</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg opacity-70">Connect to start receiving transcripts</p>
                          <p className="text-sm opacity-50 mt-2">Use the connection controls above</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                filteredTranscripts.map((transcript, index) => (
                  <div
                    key={index}
                    className={`py-2 ${
                      transcript.isFinal 
                        ? settings.highlightFinal 
                          ? 'font-semibold' 
                          : ''
                        : 'opacity-60'
                    } ${
                      settings.showInterim && !transcript.isFinal 
                        ? 'italic' 
                        : ''
                    }`}
                    style={{
                      fontSize: teleprompterStyles.fontSize,
                      fontFamily: teleprompterStyles.fontFamily,
                      lineHeight: teleprompterStyles.lineHeight,
                      wordSpacing: teleprompterStyles.wordSpacing,
                      color: transcript.isFinal ? teleprompterStyles.color : `${teleprompterStyles.color}80`,
                    }}
                  >
                    {transcript.text}
                    
                    {!isFullscreen && transcript.confidence && (
                      <span className="ml-2 text-xs opacity-50">
                        ({Math.round(transcript.confidence * 100)}%)
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer Controls - only in non-fullscreen mode */}
          {!isFullscreen && (
            <>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={jumpToTop}
                  >
                    Jump to Top
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={jumpToBottom}
                  >
                    Jump to Bottom
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearTranscripts}
                    disabled={filteredTranscripts.length === 0}
                  >
                    Clear All
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  {filteredTranscripts.length} transcript{filteredTranscripts.length !== 1 ? 's' : ''}
                  {lastTranscript && (
                    <> • Last: {formatTimestamp(lastTranscript.timestamp)}</>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}