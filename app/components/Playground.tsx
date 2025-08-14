'use client';

import { useEffect, useMemo } from 'react';
import {
  useConnectionState,
  useLocalParticipant,
  useTracks,
} from '@livekit/components-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ConnectionState, LocalParticipant, Track } from 'livekit-client';

import { Button } from '@/components/ui/button';
import { MicrophoneButton } from '@/components/MicrophoneButton';
import { useMultibandTrackVolume } from '@/hooks/useMultibandTrackVolume';
import { Teleprompter } from '@/components/Teleprompter';
import { X, Loader2 } from 'lucide-react';

export interface PlaygroundProps {
  onConnect: (connect: boolean) => Promise<void>;
}

export function Playground({ onConnect }: PlaygroundProps) {
  const { localParticipant } = useLocalParticipant();
  const roomState = useConnectionState();
  const tracks = useTracks();


  // Auto-enable microphone when connected
  useEffect(() => {
    if (roomState === ConnectionState.Connected) {
      localParticipant.setMicrophoneEnabled(true);
    }
  }, [localParticipant, roomState]);

  // Get local tracks
  const localTracks = tracks.filter(
    ({ participant }) => participant instanceof LocalParticipant
  );

  const localMicTrack = localTracks.find(
    ({ source }) => source === Track.Source.Microphone
  );

  // Volume visualization for microphone
  const localMultibandVolume = useMultibandTrackVolume(
    localMicTrack?.publication.track,
    9
  );


  const audioTileContent = useMemo(() => {
    const isLoading = roomState === ConnectionState.Connecting;
    const isActive = !isLoading && roomState !== ConnectionState.Disconnected;

    // Conversation toolbar (when connected) - positioned as overlay
    const conversationToolbar = (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute left-0 bottom-0 w-full bg-background/95 backdrop-blur-sm border-t border-border p-4"
      >
        <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
          <MicrophoneButton
            isEnabled={localParticipant.isMicrophoneEnabled}
            volumes={localMultibandVolume}
            onClick={() => {
              localParticipant.setMicrophoneEnabled(
                !localParticipant.isMicrophoneEnabled
              );
            }}
          />
          
          <Button
            onClick={() => onConnect(false)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </motion.div>
    );

    // Start conversation button (when disconnected)
    const startConversationButton = (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex flex-col items-center justify-center h-full space-y-4"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Voice Transcription</h2>
          <p className="text-muted-foreground">
            Connect to start your teleprompter session
          </p>
        </div>
        
        <Button
          onClick={() => onConnect(true)}
          disabled={isLoading}
          size="lg"
          className="gap-2 min-w-48"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Start voice transcription'
          )}
        </Button>
      </motion.div>
    );

    return { isActive, conversationToolbar, startConversationButton };
  }, [
    roomState,
    localParticipant,
    localMultibandVolume,
    onConnect,
  ]);

  const { isActive, conversationToolbar, startConversationButton } = audioTileContent;

  return (
    <div className="relative flex-col grow basis-1/2 gap-4 h-full w-full">
      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="teleprompter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <Teleprompter typingSpeed={25} />
          </motion.div>
        ) : (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            {startConversationButton}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Controls Overlay */}
      <AnimatePresence>
        {isActive && conversationToolbar}
      </AnimatePresence>
    </div>
  );
}