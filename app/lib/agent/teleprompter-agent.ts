// TeleprompterAgent - Port of Python cartesia-ink.py example to TypeScript
import {
  type JobContext,
  type JobProcess,
  defineAgent,
  log,
  initializeLogger,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
// LiveKit RTC imports handled by agents framework

import type { TranscriptData } from "@/lib/types/transcript";
import { broadcastTranscript, broadcastStatus } from "@/routes/api/transcripts.sse";

// Type definitions for audio processing
interface AudioFrame {
  data?: Float32Array;
  [key: string]: unknown;
}

interface Participant {
  identity?: string;
}

interface AudioTrack {
  on?: (event: string, callback: (frame: AudioFrame) => void) => void;
  [key: string]: unknown;
}

interface SpeechEvent {
  alternatives?: Array<{ text: string }>;
  [key: string]: unknown;
}

/**
 * TeleprompterAgent - Captures speech and sends transcripts to frontend
 * Based on the Python cartesia-ink.py example
 */
export class TeleprompterAgent {
  private stt: openai.STT;
  private ctx: JobContext;
  private isActive: boolean = false;
  private roomName: string;
  private audioBuffers: Map<string, Float32Array[]> = new Map();
  private processingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(ctx: JobContext, roomName?: string) {
    this.ctx = ctx;
    this.roomName = roomName || ctx.room.name || 'default';
    this.stt = new openai.STT({
      apiKey: process.env.OPENAI_API_KEY,
      language: 'en',
      model: 'whisper-1',
    });
  }

  /**
   * Start the teleprompter agent
   */
  async start(): Promise<void> {
    if (this.isActive) {
      log().warn('TeleprompterAgent is already active');
      return;
    }

    this.isActive = true;
    log().info('Starting TeleprompterAgent with OpenAI STT');
    
    // Subscribe to all audio tracks in the room
    this.ctx.room.on('trackSubscribed', (track, _publication) => {
      if (track.kind?.toString() === 'audio') {
        log().info('Audio track subscribed - setting up OpenAI STT processing');
        this.processAudioTrack(track, { identity: 'remote-participant' });
      }
    });

    // Subscribe to existing audio tracks
    for (const participant of this.ctx.room.remoteParticipants.values()) {
      for (const trackPub of participant.trackPublications.values()) {
        if (trackPub.track && trackPub.track.kind?.toString() === 'audio') {
          trackPub.setSubscribed(true);
        }
      }
    }

    // Broadcast status to WebSocket clients
    broadcastStatus(this.roomName, 'connected', 'Teleprompter agent started with OpenAI');
    
    log().info('TeleprompterAgent started successfully with OpenAI STT');
  }

  /**
   * Stop the teleprompter agent
   */
  async stop(): Promise<void> {
    if (!this.isActive) {
      log().warn('TeleprompterAgent is not active');
      return;
    }

    this.isActive = false;
    log().info('Stopping TeleprompterAgent');

    // Clear all processing intervals
    for (const [participantId, interval] of this.processingIntervals) {
      clearInterval(interval);
      log().info(`Cleared processing interval for ${participantId}`);
    }
    this.processingIntervals.clear();

    // Clear all audio buffers
    this.audioBuffers.clear();
    
    // Broadcast status to WebSocket clients
    broadcastStatus(this.roomName, 'disconnected', 'Teleprompter agent stopped');
    
    log().info('TeleprompterAgent stopped');
  }

  /**
   * Get the current status of the agent
   */
  getStatus(): { active: boolean; connected: boolean } {
    return {
      active: this.isActive,
      connected: this.ctx.room.connectionState.toString() === 'connected',
    };
  }

  /**
   * Process audio track for STT
   */
  private async processAudioTrack(track: unknown, participant: Participant): Promise<void> {
    if (!this.isActive) return;

    const participantId = participant?.identity || 'unknown';
    
    try {
      log().info(`Setting up OpenAI STT processing for ${participantId}`);
      
      // Initialize audio buffer for this participant
      this.audioBuffers.set(participantId, []);
      
      // Set up audio frame listener
      const audioTrack = track as AudioTrack;
      if (audioTrack.on) {
        audioTrack.on('data', (audioFrame: AudioFrame) => {
          if (this.isActive) {
            this.bufferAudioFrame(participantId, audioFrame);
          }
        });
      }
      
      // Start periodic recognition processing (every 2 seconds)
      const interval = setInterval(async () => {
        if (this.isActive) {
          await this.processAudioBuffer(participantId);
        } else {
          clearInterval(interval);
          this.processingIntervals.delete(participantId);
        }
      }, 2000);
      
      this.processingIntervals.set(participantId, interval);
      
      log().info(`OpenAI STT processing started for ${participantId}`);
    } catch (error) {
      log().error('Error setting up audio track processing:', error);
    }
  }

  /**
   * Buffer audio frame from participant
   */
  private bufferAudioFrame(participantId: string, audioFrame: AudioFrame): void {
    try {
      // Convert audio frame to Float32Array if needed
      let audioData: Float32Array;
      if (audioFrame instanceof Float32Array) {
        audioData = audioFrame;
      } else if (audioFrame.data instanceof Float32Array) {
        audioData = audioFrame.data;
      } else {
        // Skip if we can't process this audio format
        return;
      }
      
      const buffer = this.audioBuffers.get(participantId) || [];
      buffer.push(audioData);
      this.audioBuffers.set(participantId, buffer);
      
      // Limit buffer size to prevent memory issues (keep last 10 seconds worth)
      const maxChunks = 500; // Approximate 10 seconds at typical sample rates
      if (buffer.length > maxChunks) {
        buffer.splice(0, buffer.length - maxChunks);
      }
    } catch (error) {
      log().error('Error buffering audio frame:', error);
    }
  }

  /**
   * Process accumulated audio buffer using OpenAI STT
   */
  private async processAudioBuffer(participantId: string): Promise<void> {
    const buffer = this.audioBuffers.get(participantId);
    if (!buffer || buffer.length === 0) {
      return;
    }

    try {
      // Concatenate all audio chunks
      const totalLength = buffer.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Float32Array(totalLength);
      
      let offset = 0;
      for (const chunk of buffer) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to the format expected by OpenAI STT (array of AudioFrames)
      // For now, create a simple audio frame representation
      const audioFrames = [{
        data: combinedAudio,
        sampleRate: 16000,
        channels: 1,
        samplesPerChannel: combinedAudio.length
      }];

      // Use OpenAI STT _recognize method
      // Note: Using type assertion for compatibility with our audio frame format
      const speechEvent = await (this.stt._recognize as unknown as (buffer: unknown) => Promise<SpeechEvent>)(audioFrames);
      
      if (speechEvent && speechEvent.alternatives && speechEvent.alternatives.length > 0) {
        const transcript = speechEvent.alternatives[0].text;
        if (transcript && transcript.trim().length > 0) {
          await this.handleTranscriptResult(transcript, true, { identity: participantId });
        }
      }

      // Clear processed buffer
      this.audioBuffers.set(participantId, []);
      
    } catch (error) {
      log().error('Error processing audio buffer:', error);
      // Clear buffer on error to prevent accumulation
      this.audioBuffers.set(participantId, []);
    }
  }

  /**
   * Handle transcript results from OpenAI STT
   */
  private async handleTranscriptResult(transcript: string | { text?: string }, isFinal: boolean, participant?: Participant): Promise<void> {
    if (!this.isActive) return;

    const text = typeof transcript === 'string' ? transcript : transcript.text || '';
    const participantIdentity = participant?.identity || this.ctx.room.localParticipant?.identity || 'unknown';
    
    const transcriptData: TranscriptData = {
      text,
      isFinal,
      timestamp: Date.now(),
      participantIdentity,
    };

    // Only process non-empty transcripts
    if (transcriptData.text.trim().length > 0) {
      await this.sendTranscript(transcriptData);
    }
  }

  /**
   * Send transcript to all participants via data track and WebSocket
   */
  private async sendTranscript(transcript: TranscriptData): Promise<void> {
    try {
      // Broadcast via WebSocket to all connected clients
      broadcastTranscript(this.roomName, transcript);

      const data = JSON.stringify({
        type: 'transcript',
        data: transcript,
      });

      // Send as data packet to all participants
      await this.ctx.room.localParticipant?.publishData(
        new TextEncoder().encode(data),
        {
          reliable: true,
          destination_identities: [], // Send to all participants
        }
      );

      log().info('Transcript sent:', {
        text: transcript.text,
        isFinal: transcript.isFinal,
        participantIdentity: transcript.participantIdentity,
        roomName: this.roomName,
      });
    } catch (error) {
      log().error('Failed to send transcript:', error);
      // Broadcast error status
      broadcastStatus(this.roomName, 'error', `Failed to send transcript: ${error}`);
    }
  }

  /**
   * Handle RPC-like method calls from frontend
   * This simulates the Python agent's RPC methods
   */
  async handleRPC(method: string, _params?: unknown): Promise<unknown> {
    switch (method) {
      case 'get_transcript_status':
        return this.getTranscriptStatus();
      
      case 'start_transcription':
        await this.start();
        return { success: true, message: 'Transcription started' };
      
      case 'stop_transcription':
        await this.stop();
        return { success: true, message: 'Transcription stopped' };
      
      default:
        throw new Error(`Unknown RPC method: ${method}`);
    }
  }

  /**
   * Get transcript status (equivalent to Python get_transcript_status RPC method)
   */
  private getTranscriptStatus(): { status: string; timestamp: number } {
    return {
      status: this.isActive ? 'active' : 'inactive',
      timestamp: Date.now(),
    };
  }
}

/**
 * Define the teleprompter agent for the LiveKit agents framework
 */
// Initialize logger
initializeLogger({ pretty: true, level: 'info' });

export default defineAgent({
  prewarm: async (_proc: JobProcess) => {
    // Pre-warm any resources if needed
    log().info('Prewarming TeleprompterAgent');
  },
  
  entry: async (ctx: JobContext) => {
    log().info('TeleprompterAgent entry point called');
    
    // Create the teleprompter agent instance
    const agent = new TeleprompterAgent(ctx);
    
    // Store agent in user data for access from other parts
    ctx.proc.userData.teleprompterAgent = agent;
    
    // Connect to the room
    await ctx.connect();
    
    // Set up data message handling for RPC-like calls
    ctx.room.on('dataReceived', async (data: Uint8Array, participant: unknown) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(data));
        
        if (message.type === 'rpc' && message.method) {
          const result = await agent.handleRPC(message.method, message.params);
          
          // Send response back
          const response = JSON.stringify({
            type: 'rpc_response',
            id: message.id,
            result,
          });
          
          await ctx.room.localParticipant?.publishData(
            new TextEncoder().encode(response),
            {
              reliable: true,
              destination_identities: [(participant as { identity?: string })?.identity || ''],
            }
          );
        }
      } catch (error) {
        log().error('Error handling data message:', error);
      }
    });
    
    // Auto-start transcription
    await agent.start();
    
    log().info('TeleprompterAgent is ready and transcription started');
  },
});