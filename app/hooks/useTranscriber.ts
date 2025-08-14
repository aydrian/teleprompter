import { useState, useEffect, useCallback } from 'react';
import { useConnectionState, useRoomContext } from '@livekit/components-react';
import { ConnectionState, type RpcInvocationData } from 'livekit-client';

interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  participantIdentity: string;
}

interface UseTranscriberReturn {
  state: ConnectionState;
  transcriptions: { [id: string]: TranscriptSegment };
  lastTranscript: TranscriptSegment | null;
  setTranscriptCallback: (callback: (transcript: string) => void) => void;
}

export function useTranscriber(): UseTranscriberReturn {
  const state = useConnectionState();
  const room = useRoomContext();
  const [transcriptions, setTranscriptions] = useState<{
    [id: string]: TranscriptSegment;
  }>({});
  const [lastTranscript, setLastTranscript] = useState<TranscriptSegment | null>(null);
  const [onTranscriptReceived, setOnTranscriptReceived] = useState<((transcript: string) => void) | undefined>();

  // Clear transcriptions when disconnected
  useEffect(() => {
    if (state === ConnectionState.Disconnected) {
      console.log('🔄 useTranscriber: Clearing transcriptions on disconnect');
      setTranscriptions({});
      setLastTranscript(null);
    }
  }, [state]);

  // Set up RPC handler for receiving transcripts from agent
  useEffect(() => {
    if (!room || !room.localParticipant) {
      return;
    }

    console.log('🎤 useTranscriber: Setting up RPC method "receive_transcript"', {
      roomName: room.name,
      participantIdentity: room.localParticipant.identity,
      connectionState: state
    });

    const handleReceiveTranscript = async (rpcInvocation: RpcInvocationData): Promise<string> => {
      console.log('📞 useTranscriber: RPC method "receive_transcript" called', {
        requestId: rpcInvocation.requestId,
        callerIdentity: rpcInvocation.callerIdentity,
        payload: rpcInvocation.payload
      });

      try {
        const payload = JSON.parse(rpcInvocation.payload);
        console.log('📄 useTranscriber: Parsed RPC payload:', payload);

        if (payload && payload.transcript) {
          const segment: TranscriptSegment = {
            id: `${rpcInvocation.callerIdentity}-${Date.now()}`,
            text: payload.transcript,
            timestamp: payload.timestamp || Date.now(),
            isFinal: payload.isFinal !== false, // Default to final if not specified
            participantIdentity: rpcInvocation.callerIdentity,
          };

          console.log('🗣️ useTranscriber: Processing transcript segment:', segment);

          // Update transcriptions state
          setTranscriptions((prev) => {
            const newTranscriptions = { ...prev };
            newTranscriptions[segment.id] = segment;
            return newTranscriptions;
          });

          // Update last transcript
          setLastTranscript(segment);

          // Call the transcript received callback if available
          if (onTranscriptReceived) {
            console.log('🔔 useTranscriber: Calling onTranscriptReceived callback');
            onTranscriptReceived(segment.text);
          }

          console.log('✅ useTranscriber: Transcript processed successfully');
          return "Success: Transcript processed by useTranscriber";
        }

        console.log('⚠️ useTranscriber: Invalid payload - no transcript field');
        return "Error: Invalid transcript data format";
      } catch (error) {
        console.error('💥 useTranscriber: Error processing RPC call:', error);
        return "Error: " + (error instanceof Error ? error.message : String(error));
      }
    };

    // Register RPC method
    room.registerRpcMethod("receive_transcript", handleReceiveTranscript);
    console.log('✅ useTranscriber: RPC method registered successfully');

    return () => {
      if (room) {
        room.unregisterRpcMethod("receive_transcript");
        console.log('🧹 useTranscriber: RPC method unregistered');
      }
    };
  }, [room, state, onTranscriptReceived]);

  // Provide a way to set the transcript callback
  const setTranscriptCallback = useCallback((callback: (transcript: string) => void) => {
    console.log('🔗 useTranscriber: Setting transcript received callback');
    setOnTranscriptReceived(() => callback);
  }, []);

  return { 
    state, 
    transcriptions, 
    lastTranscript,
    setTranscriptCallback
  };
}