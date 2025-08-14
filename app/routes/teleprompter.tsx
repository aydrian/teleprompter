import { ConnectionProvider } from '@/hooks/useConnection';
import { RoomComponent } from '@/components/Room';
import { Monitor } from 'lucide-react';
import type { Route } from './+types/teleprompter';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'LiveKit Teleprompter' },
    {
      name: 'description',
      content: 'Real-time speech transcription teleprompter powered by LiveKit',
    },
  ];
}

export default function TeleprompterPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Monitor className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Teleprompter</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Height */}
      <div className="h-[calc(100vh-4rem)]">
        <ConnectionProvider>
          <RoomComponent />
        </ConnectionProvider>
      </div>
    </div>
  );
}