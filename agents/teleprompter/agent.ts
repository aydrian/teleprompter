// TeleprompterAgent - Voice-synchronized teleprompter agent using LiveKit agents framework
import 'dotenv/config';
import {
  type JobContext,
  type JobProcess,
  defineAgent,
  log,
  initializeLogger,
  cli,
  WorkerOptions,
  voice,
} from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as silero from '@livekit/agents-plugin-silero';
import { fileURLToPath } from 'node:url';


/**
 * Define the teleprompter agent using the LiveKit agents framework
 */

// Initialize logger
initializeLogger({ pretty: true, level: 'info' });

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    // Pre-warm VAD (Voice Activity Detection) - this is critical for proper initialization
    log().info('🔥 Prewarming TeleprompterAgent');
    log().info('🔧 Loading Silero VAD...');
    proc.userData.vad = await silero.VAD.load({
      minSpeechDuration: 300,   // 300ms minimum speech
      minSilenceDuration: 500,  // 500ms silence to end
      activationThreshold: 0.6, // Sensitivity threshold
    });
    log().info('✅ VAD loaded and ready');
    log().info('🔧 Agent ready to accept jobs (default: room jobs)');
  },
  
  entry: async (ctx: JobContext) => {
    log().info('🚀 TeleprompterAgent entry point called', {
      roomName: ctx.room.name,
      participants: ctx.room.numParticipants,
    });
    
    // Get the pre-loaded VAD from prewarm
    const vad = ctx.proc.userData.vad! as silero.VAD;
    
    // Create AgentSession with OpenAI STT and pre-loaded Silero VAD (like Python example)
    log().info('🎤 Creating AgentSession with OpenAI STT and pre-loaded Silero VAD...');
    const session = new voice.AgentSession({
      vad,
      stt: new deepgram.STT()
    });

    // Listen for user input transcriptions (like Python @session.on("user_input_transcribed"))
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, async (event: voice.UserInputTranscribedEvent) => {
      log().info('🗣️ User input transcribed:', {
        transcript: event.transcript,
        isFinal: event.isFinal,
        speakerId: event.speakerId,
      });
      
      // Only process final transcripts
      if (event.isFinal && event.transcript.trim().length > 0) {
        log().info('✅ Processing final transcript:', event.transcript);
        await sendTranscriptToFrontend(ctx, event.transcript);
      }
    });

    // Listen for other session events
    session.on(voice.AgentSessionEventTypes.AgentStateChanged, (event: voice.AgentStateChangedEvent) => {
      log().info('🤖 Agent state changed:', {
        from: event.oldState,
        to: event.newState,
      });
    });

    session.on(voice.AgentSessionEventTypes.UserStateChanged, (event: voice.UserStateChangedEvent) => {
      log().info('👤 User state changed:', {
        from: event.oldState,
        to: event.newState,
      });
    });

    session.on(voice.AgentSessionEventTypes.Error, (event: voice.ErrorEvent) => {
      log().error('💥 Session error:', event.error);
    });

    // Start the agent session - this will automatically handle audio processing
    log().info('🎧 Starting AgentSession...');
    await session.start({
      agent: new voice.Agent({
        instructions: "You are a teleprompter assistant that transcribes user speech. Focus on accurate real-time transcription.",
      }),
      room: ctx.room,
    });
    
    // Connect to the room AFTER starting the session (like basic agent example)
    log().info('🔌 Connecting agent to room...');
    await ctx.connect();
    log().info('✅ Agent connected to room successfully');
    
    log().info('🎯 TeleprompterAgent is ready and listening for speech');
  },
});

/**
 * Send transcript to frontend participants via RPC
 */
async function sendTranscriptToFrontend(ctx: JobContext, transcript: string): Promise<void> {
  try {
    log().info('📤 Sending transcript to frontend participants...');
    
    const payload = JSON.stringify({ 
      transcript: transcript,
      timestamp: Date.now() 
    });

    // Send RPC call to all remote participants
    let sentCount = 0;
    for (const participant of ctx.room.remoteParticipants.values()) {
      try {
        log().info(`📞 Sending RPC to participant: ${participant.identity}`);
        
        await ctx.room.localParticipant?.performRpc({
          destinationIdentity: participant.identity,
          method: 'receive_transcript',
          payload: payload,
          responseTimeout: 3000,
        });
        
        sentCount++;
        log().info(`✅ Successfully sent transcript via RPC to ${participant.identity}`);
      } catch (error) {
        log().warn(`❌ Failed to send RPC to ${participant.identity}:`, error);
      }
    }

    log().info(`📊 Transcript sent to ${sentCount}/${ctx.room.remoteParticipants.size} participants`);
  } catch (error) {
    log().error('💥 Failed to send transcript to frontend:', error);
  }
}

// CLI runner for standalone execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
}