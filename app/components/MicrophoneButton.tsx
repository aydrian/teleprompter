import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface MicrophoneButtonProps {
  isEnabled: boolean;
  volumes?: number[];
  onClick: () => void;
  disabled?: boolean;
}

export function MicrophoneButton({ isEnabled, volumes = [], onClick, disabled }: MicrophoneButtonProps) {
  const averageVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
  
  return (
    <div className="relative flex items-center justify-center">
      {/* Volume visualization rings */}
      {isEnabled && volumes.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          {volumes.map((volume, index) => (
            <motion.div
              key={index}
              className="absolute rounded-full border border-primary/20"
              style={{
                width: 60 + (index * 12),
                height: 60 + (index * 12),
              }}
              animate={{
                scale: 1 + volume * 0.3,
                opacity: volume * 0.6 + 0.1,
              }}
              transition={{
                duration: 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Main microphone button */}
      <Button
        onClick={onClick}
        disabled={disabled}
        size="lg"
        className={`
          relative z-10 w-12 h-12 rounded-full p-0
          ${isEnabled 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-primary hover:bg-primary/90'
          }
        `}
      >
        <motion.div
          animate={{
            scale: isEnabled && averageVolume > 0.1 ? 1.1 : 1,
          }}
          transition={{
            duration: 0.1,
            ease: "easeOut",
          }}
        >
          {isEnabled ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </motion.div>
      </Button>
    </div>
  );
}