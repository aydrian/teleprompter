// Test endpoint to manually trigger transcript broadcasts
import { broadcastTranscript } from '@/routes/api/transcripts.sse';
import type { TranscriptData } from '@/lib/types/transcript';

export async function action({ request }: { request: Request }) {
  try {
    const formData = await request.formData();
    const roomName = formData.get('roomName') as string;
    const text = formData.get('text') as string;
    const isFinal = formData.get('isFinal') === 'true';
    
    if (!roomName || !text) {
      return new Response(JSON.stringify({ error: 'Missing roomName or text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const transcript: TranscriptData = {
      text,
      isFinal,
      timestamp: Date.now(),
      participantIdentity: 'test-agent',
      confidence: 0.9,
    };

    broadcastTranscript(roomName, transcript);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Broadcast transcript to room ${roomName}`,
      transcript 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to broadcast transcript',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}