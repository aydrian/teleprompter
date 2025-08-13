import { useEffect, useRef, useState } from 'react';
import { useTranscriptSSE } from '@/hooks/use-transcript-sse';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Maximize, Minimize, Settings } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface TeleprompterDisplayProps {
  roomName: string;
  participantName: string;
  className?: string;
}

export function TeleprompterDisplay({ 
  roomName, 
  participantName, 
  className 
}: TeleprompterDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(24);

  const {
    transcripts,
    lastTranscript,
    clearTranscripts,
  } = useTranscriptSSE({
    roomName,
    participantName,
    autoConnect: true,
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  // Only show final transcripts
  const filteredTranscripts = transcripts.filter(t => t.isFinal);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current && lastTranscript) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [lastTranscript]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <Card className={isFullscreen ? 'h-full rounded-none border-0' : 'h-full'}>
        <CardContent className={`${isFullscreen ? 'h-full p-0' : 'h-full p-4'}`}>
          {/* Controls Bar */}
          <div className={`flex items-center justify-between mb-4 ${isFullscreen ? 'absolute top-4 left-4 right-4 z-10 bg-background/90 backdrop-blur rounded-lg p-2' : ''}`}>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearTranscripts}
                disabled={filteredTranscripts.length === 0}
              >
                Clear
              </Button>

              {/* Settings Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Font Size: {fontSize}px</Label>
                      <Slider
                        value={[fontSize]}
                        onValueChange={([value]) => setFontSize(value)}
                        min={16}
                        max={48}
                        step={2}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>

          {/* Transcript Display */}
          <ScrollArea 
            className={`w-full rounded border bg-card ${isFullscreen ? 'h-[calc(100vh-80px)] mt-16' : 'h-[calc(100%-60px)]'}`}
            ref={scrollRef}
          >
            <div className={`p-8 ${isFullscreen ? 'max-w-4xl mx-auto' : ''}`}>
              {filteredTranscripts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground">Listening for speech...</p>
                  <p className="text-sm text-muted-foreground mt-2">Start speaking to see transcripts appear</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTranscripts.map((transcript, index) => (
                    <p
                      key={index}
                      style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: 1.8,
                      }}
                    >
                      {transcript.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}