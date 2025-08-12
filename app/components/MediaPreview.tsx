import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  AlertCircle,
  CheckCircle2,
  Activity,
  Monitor
} from 'lucide-react';

interface MediaPreviewProps {
  isConnected: boolean;
  onPermissionGranted?: (hasAudio: boolean, hasVideo: boolean) => void;
  onPermissionDenied?: (error: string) => void;
  className?: string;
}

interface MediaDevices {
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
}

interface AudioLevel {
  level: number;
  isSpeaking: boolean;
}

export function MediaPreview({ 
  isConnected, 
  onPermissionGranted,
  onPermissionDenied,
  className 
}: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<MediaDevices>({ audioDevices: [], videoDevices: [] });
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<AudioLevel>({ level: 0, isSpeaking: false });
  const [volume, setVolume] = useState(50);

  // Get available media devices
  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setDevices({ audioDevices, videoDevices });
      
      if (!selectedAudioDevice && audioDevices.length > 0) {
        setSelectedAudioDevice(audioDevices[0].deviceId);
      }
      
      if (!selectedVideoDevice && videoDevices.length > 0) {
        setSelectedVideoDevice(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  };

  // Setup audio level monitoring
  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      const analyser = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const monitor = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const level = (average / 255) * 100;
          const isSpeaking = level > 5; // Threshold for speech detection
          
          setAudioLevel({ level, isSpeaking });
        }
        animationFrameRef.current = requestAnimationFrame(monitor);
      };
      
      monitor();
    } catch (error) {
      console.error('Failed to setup audio analysis:', error);
    }
  };

  // Start media stream
  const startStream = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setIsLoading(true);
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        audio: isAudioEnabled ? (selectedAudioDevice ? { deviceId: selectedAudioDevice } : true) : false,
        video: isVideoEnabled ? (selectedVideoDevice ? { deviceId: selectedVideoDevice } : true) : false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      const videoTracks = newStream.getVideoTracks();
      const audioTracks = newStream.getAudioTracks();

      setHasVideo(videoTracks.length > 0);
      setHasAudio(audioTracks.length > 0);

      if (videoRef.current && videoTracks.length > 0) {
        videoRef.current.srcObject = newStream;
      }

      if (audioTracks.length > 0) {
        setupAudioAnalysis(newStream);
      }

      onPermissionGranted?.(audioTracks.length > 0, videoTracks.length > 0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to access media: ${errorMessage}`);
      onPermissionDenied?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop media stream
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setHasVideo(false);
    setHasAudio(false);
    setAudioLevel({ level: 0, isSpeaking: false });
  };

  // Toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    } else {
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    } else {
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Initialize devices on mount
  useEffect(() => {
    getDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
      stopStream();
    };
  }, []);

  // Restart stream when device selection changes
  useEffect(() => {
    if (stream && (selectedAudioDevice || selectedVideoDevice)) {
      startStream();
    }
  }, [selectedAudioDevice, selectedVideoDevice]);

  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Activity className="h-3 w-3 animate-spin" />
          Starting...
        </Badge>
      );
    }

    if (error) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    }

    if (stream) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <Monitor className="h-3 w-3" />
        Ready
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Media Preview</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {hasVideo && stream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <CameraOff className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isVideoEnabled ? 'No video' : 'Video disabled'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Audio Level Indicator */}
        {hasAudio && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Mic className="h-3 w-3" />
                Audio Level
              </span>
              {audioLevel.isSpeaking && (
                <Badge variant="default" className="text-xs">Speaking</Badge>
              )}
            </div>
            <Progress value={audioLevel.level} className="h-2" />
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={stream ? stopStream : startStream}
            disabled={isLoading}
            className="flex-1"
            variant={stream ? "destructive" : "default"}
          >
            {isLoading ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : stream ? (
              'Stop Preview'
            ) : (
              'Start Preview'
            )}
          </Button>

          <Toggle
            pressed={isVideoEnabled}
            onPressedChange={toggleVideo}
            disabled={!stream}
            aria-label="Toggle video"
          >
            {isVideoEnabled ? (
              <Camera className="h-4 w-4" />
            ) : (
              <CameraOff className="h-4 w-4" />
            )}
          </Toggle>

          <Toggle
            pressed={isAudioEnabled}
            onPressedChange={toggleAudio}
            disabled={!stream}
            aria-label="Toggle audio"
          >
            {isAudioEnabled ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Toggle>
        </div>

        {/* Device Selection */}
        {devices.audioDevices.length > 1 || devices.videoDevices.length > 1 ? (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Settings className="h-3 w-3" />
                Device Selection
              </div>

              {devices.audioDevices.length > 1 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Microphone</label>
                  <select
                    value={selectedAudioDevice}
                    onChange={(e) => setSelectedAudioDevice(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-input bg-background"
                  >
                    {devices.audioDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {devices.videoDevices.length > 1 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Camera</label>
                  <select
                    value={selectedVideoDevice}
                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-input bg-background"
                  >
                    {devices.videoDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        {!isConnected && stream && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Media preview is active. Connect to a room to start sharing.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}