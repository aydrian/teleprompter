// TeleprompterAgent - Port of Python cartesia-ink.py example to TypeScript
import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  log,
  type stt,
} from '@livekit/agents-monorepo/agents/src';
import * as deepgram from '@livekit/agents-monorepo/plugins/deepgram/src';
import { DataPacket_Kind, type ParticipantIdentity } from '@livekit/rtc-node';

import type { TranscriptData } from "@/lib/types/transcript";
import { broadcastTranscript, broadcastStatus } from "@/routes/api/transcripts.sse";

/**
 * TeleprompterAgent - Captures speech and sends transcripts to frontend
 * Based on the Python cartesia-ink.py example
 */
export class TeleprompterAgent {
  private stt: deepgram.STT;
  private ctx: JobContext;
  private isActive: boolean = false;
  private roomName: string;

  constructor(ctx: JobContext, roomName?: string) {
    this.ctx = ctx;
    this.roomName = roomName || ctx.room.name || 'default';
    this.stt = new deepgram.STT({
      apiKey: process.env.DEEPGRAM_API_KEY,
      language: 'en-US',
      interimResults: true,
      punctuate: true,
      smartFormat: true,
      model: 'nova-2-general',
    });
  }

  /**
   * Start the teleprompter agent
   */
  async start(): Promise<void> {
    if (this.isActive) {
      log.warn('TeleprompterAgent is already active');
      return;
    }

    this.isActive = true;
    log.info('Starting TeleprompterAgent');

    // Set up STT event handlers
    this.stt.on('speech_event', this.onSpeechEvent.bind(this));

    // Subscribe to all audio tracks in the room
    for (const participant of this.ctx.room.remoteParticipants.values()) {
      for (const track of participant.trackPublications.values()) {
        if (track.track && track.track.kind === 'audio') {
          await track.track.setEnabled(true);
        }
      }
    }

    // Start STT processing
    await this.stt.start();
    
    // Broadcast status to WebSocket clients
    broadcastStatus(this.roomName, 'connected', 'Teleprompter agent started');
    
    log.info('TeleprompterAgent started successfully');
  }

  /**
   * Stop the teleprompter agent
   */
  async stop(): Promise<void> {
    if (!this.isActive) {
      log.warn('TeleprompterAgent is not active');
      return;
    }

    this.isActive = false;
    log.info('Stopping TeleprompterAgent');

    await this.stt.stop();
    
    // Broadcast status to WebSocket clients
    broadcastStatus(this.roomName, 'disconnected', 'Teleprompter agent stopped');
    
    log.info('TeleprompterAgent stopped');
  }

  /**
   * Get the current status of the agent
   */
  getStatus(): { active: boolean; connected: boolean } {
    return {
      active: this.isActive,
      connected: this.ctx.room.state === 'connected',
    };
  }

  /**
   * Handle speech events from STT
   */
  private async onSpeechEvent(event: stt.SpeechEvent): Promise<void> {
    if (!this.isActive) return;

    const transcript: TranscriptData = {
      text: event.alternatives[0]?.text || '',
      isFinal: event.type === 'final_transcript',
      timestamp: Date.now(),
      participantIdentity: this.ctx.room.localParticipant.identity,
    };

    // Only process non-empty transcripts
    if (transcript.text.trim().length > 0) {
      await this.sendTranscript(transcript);
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
      await this.ctx.room.localParticipant.publishData(
        new TextEncoder().encode(data),
        {
          kind: DataPacket_Kind.RELIABLE,
          destinationIdentities: [], // Send to all participants
        }
      );

      log.info('Transcript sent:', {
        text: transcript.text,
        isFinal: transcript.isFinal,
        participantIdentity: transcript.participantIdentity,
        roomName: this.roomName,
      });
    } catch (error) {
      log.error('Failed to send transcript:', error);
      // Broadcast error status
      broadcastStatus(this.roomName, 'error', `Failed to send transcript: ${error}`);
    }
  }

  /**
   * Handle RPC-like method calls from frontend
   * This simulates the Python agent's RPC methods
   */
  async handleRPC(method: string, params?: any): Promise<any> {
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
export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    // Pre-warm any resources if needed
    log.info('Prewarming TeleprompterAgent');
  },
  
  entry: async (ctx: JobContext) => {
    log.info('TeleprompterAgent entry point called');
    
    // Create the teleprompter agent instance
    const agent = new TeleprompterAgent(ctx);
    
    // Store agent in user data for access from other parts
    ctx.proc.userData.teleprompterAgent = agent;
    
    // Connect to the room
    await ctx.connect();
    
    // Set up data message handling for RPC-like calls
    ctx.room.on('data_received', async (data, participant) => {
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
          
          await ctx.room.localParticipant.publishData(
            new TextEncoder().encode(response),
            {
              kind: DataPacket_Kind.RELIABLE,
              destinationIdentities: [participant?.identity as ParticipantIdentity],
            }
          );
        }
      } catch (error) {
        log.error('Error handling data message:', error);
      }
    });
    
    // Auto-start transcription
    await agent.start();
    
    log.info('TeleprompterAgent is ready and transcription started');
  },
});