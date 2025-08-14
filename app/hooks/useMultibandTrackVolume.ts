import { useEffect, useState } from 'react';
import { Track } from 'livekit-client';

export function useMultibandTrackVolume(track: Track | undefined, bands: number = 5) {
  const [volumes, setVolumes] = useState<number[]>(new Array(bands).fill(0));

  useEffect(() => {
    if (!track || track.kind !== Track.Kind.Audio) {
      setVolumes(new Array(bands).fill(0));
      return;
    }

    let analyser: AnalyserNode;
    let dataArray: Uint8Array;
    let animationFrame: number;

    const setupAnalyser = async () => {
      try {
        // Get the MediaStreamTrack
        const mediaStreamTrack = track.mediaStreamTrack;
        if (!mediaStreamTrack) return;

        // Create audio context and analyser
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
        analyser = audioContext.createAnalyser();
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        source.connect(analyser);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
          
          // Calculate volume for each band
          const bandsArray: number[] = [];
          const bandSize = Math.floor(bufferLength / bands);
          
          for (let i = 0; i < bands; i++) {
            let sum = 0;
            const start = i * bandSize;
            const end = start + bandSize;
            
            for (let j = start; j < end; j++) {
              sum += dataArray[j];
            }
            
            const average = sum / bandSize;
            bandsArray.push(average / 255); // Normalize to 0-1
          }
          
          setVolumes(bandsArray);
          animationFrame = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (error) {
        console.warn('Failed to setup audio analyser:', error);
        setVolumes(new Array(bands).fill(0));
      }
    };

    setupAnalyser();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      setVolumes(new Array(bands).fill(0));
    };
  }, [track, bands]);

  return volumes;
}