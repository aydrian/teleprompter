import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  TestTube, 
  ArrowRight, 
  Mic, 
  Video, 
  Settings,
  Globe,
  Zap,
  Shield
} from "lucide-react";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "LiveKit Teleprompter" },
    { name: "description", content: "Real-time speech transcription teleprompter powered by LiveKit" }
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Monitor className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold">LiveKit Teleprompter</h1>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional real-time speech transcription for presentations, speeches, and live events. 
              Powered by LiveKit's real-time infrastructure and Deepgram's advanced AI.
            </p>
            
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                Real-time
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                Multi-participant
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Privacy-focused
              </Badge>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/teleprompter">
                <Monitor className="h-5 w-5" />
                Launch Teleprompter
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/transcript-test">
                <TestTube className="h-5 w-5" />
                Test Features
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Advanced Speech Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Powered by Deepgram's state-of-the-art AI for accurate real-time transcription 
                with interim results and confidence scoring.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                LiveKit Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Built on LiveKit's robust real-time infrastructure for seamless multi-participant 
                sessions with low latency.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Customizable Interface
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Adjust font size, scroll speed, colors, and display preferences to match 
                your presentation needs and accessibility requirements.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Fullscreen Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Distraction-free fullscreen teleprompter with intuitive controls for 
                professional presentations and live events.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Real-time Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Multiple participants can join the same session to view transcripts 
                in real-time, perfect for team presentations.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your audio and transcripts are processed securely with no permanent storage. 
                Sessions are ephemeral and privacy-focused.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold">Connect to Room</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a room name and participant identity
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold">Grant Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Allow microphone access for speech recognition
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold">Start Agent</h3>
                <p className="text-sm text-muted-foreground">
                  Launch the teleprompter agent for transcription
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold">4</span>
                </div>
                <h3 className="font-semibold">Start Speaking</h3>
                <p className="text-sm text-muted-foreground">
                  Watch your speech appear in real-time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center py-8 mt-16 border-t">
          <p className="text-muted-foreground">
            Built with React Router v7, LiveKit, and Deepgram • Open Source
          </p>
        </footer>
      </div>
    </div>
  );
}
