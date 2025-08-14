export async function loader() {
  return {
    livekitUrl: process.env.LIVEKIT_URL || 'ws://localhost:7880',
  };
}