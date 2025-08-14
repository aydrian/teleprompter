# 🎙️ LiveKit Teleprompter

A real-time, voice-synchronized teleprompter application built with React, LiveKit, and speech-to-text technology. The teleprompter automatically advances as you speak, providing a seamless presentation experience.

## ✨ Features

- 🎙️ **Real-time Speech Recognition**: Automatic speech-to-text transcription using Deepgram
- 📜 **Smart Text Synchronization**: Teleprompter advances based on your spoken words
- 🔄 **LiveKit WebRTC Integration**: Low-latency audio streaming and processing
- ✏️ **Script Editor**: Built-in editor for creating and modifying scripts
- 🎯 **Sentence-based Tracking**: Intelligent matching of speech to script sentences
- 🔇 **Noise Cancellation**: Krisp noise filter for cleaner audio input
- ⚡ **Real-time Processing**: Instant response to speech with RPC communication

## 🏗️ Architecture

The application consists of two main components:

### Web Application
- **Framework**: React Router v7 with server-side rendering
- **UI**: React with Tailwind CSS and Radix UI components
- **WebRTC**: LiveKit client for real-time communication
- **State Management**: React hooks and context providers

### Agent Service
- **Framework**: LiveKit Agents SDK
- **Speech-to-Text**: Deepgram STT with Silero VAD
- **Communication**: RPC over LiveKit data channels
- **Processing**: Real-time transcript generation and transmission

## 📋 Prerequisites

- Node.js 18+ and pnpm
- [LiveKit Cloud account](https://cloud.livekit.io) (free tier available)
- API Keys:
  - LiveKit API key and secret (from LiveKit Cloud dashboard)
  - Deepgram API key (for speech-to-text)

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/aydrian/teleprompter.git
cd teleprompter
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# LiveKit Cloud Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Deepgram Configuration
DEEPGRAM_API_KEY=your-deepgram-key

# Optional: OpenAI for alternative STT
OPENAI_API_KEY=your-openai-key
```

Get your LiveKit credentials from the [LiveKit Cloud dashboard](https://cloud.livekit.io) after creating a project.

## 💻 Development

### Starting the Web Application

```bash
pnpm run dev
```

The application will be available at `http://localhost:3000`

### Starting the Agent

In a separate terminal:
```bash
pnpm run agent:dev
```

The agent will connect to LiveKit Cloud and wait for job assignments.

## 📖 Usage

1. **Open the Application**: Navigate to `http://localhost:3000`

2. **Connect to Room**: Click "Start Conversation" to connect to the LiveKit room

3. **Edit Script**: 
   - Click the Edit button to modify the teleprompter script
   - Save your changes to update the display

4. **Start Speaking**: 
   - The teleprompter will automatically highlight and advance sentences as you speak them
   - The system matches your speech to the script with intelligent word matching

5. **Controls**:
   - **Reset**: Return to the beginning of the script
   - **Edit**: Toggle between edit and presentation modes

## ⚙️ Configuration

### LiveKit Settings

Configure LiveKit connection in `app/routes/api/livekit/config.ts`:
- Room settings
- Participant permissions
- Audio/video configuration

### Agent Settings

Modify agent behavior in `agents/teleprompter/agent.ts`:
- STT provider (Deepgram/OpenAI)
- VAD sensitivity
- Transcript processing logic

### UI Customization

Customize the teleprompter interface in `app/components/Teleprompter.tsx`:
- Font sizes and styles
- Highlight colors
- Animation speeds

## 📁 Project Structure

```
teleprompter/
├── agents/                 # LiveKit agent service
│   └── teleprompter/
│       └── agent.ts       # Main agent implementation
├── app/
│   ├── components/        # React components
│   │   ├── Room.tsx      # LiveKit room wrapper
│   │   ├── Playground.tsx # Main UI container
│   │   └── Teleprompter.tsx # Teleprompter component
│   ├── hooks/            # Custom React hooks
│   │   ├── useConnection.tsx # Room connection logic
│   │   └── useTranscriber.ts # RPC transcript handling
│   └── routes/           # React Router routes
│       ├── api/         # API endpoints
│       └── home.tsx     # Main application route
├── public/              # Static assets
├── package.json         # Project dependencies
├── vite.config.ts      # Vite configuration
└── LICENSE             # MIT license
```

## 🚢 Deployment

### Deploy the Web Application

The web application can be deployed to any Node.js hosting platform:

#### Option 1: Traditional Node.js Server

1. Build the application:
```bash
pnpm run build
```

2. Start the production server:
```bash
pnpm run start
```

#### Option 2: Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY build/ ./build/
COPY public/ ./public/
EXPOSE 3000
CMD ["npm", "run", "start"]
```

#### Option 3: Platform-as-a-Service (PaaS)

Deploy to platforms like:
- Vercel
- Netlify
- Railway
- Render
- Fly.io
- Heroku

### Deploy the Agent

The agent needs to be deployed as a separate service. Options include:
- Docker container
- Kubernetes deployment
- Cloud Run or similar serverless platforms
- VPS with process manager (PM2, systemd)

Example Dockerfile for agent:
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
COPY agents/ ./agents/
RUN npm ci --production
CMD ["node", "agents/teleprompter/agent.js", "start"]
```

## 🔧 Troubleshooting

### Agent Not Receiving Jobs
- Ensure LiveKit Cloud project is properly configured
- Check agent is registered: Look for "registered worker" in agent logs
- Verify environment variables are set correctly with LiveKit Cloud credentials
- Check LiveKit Cloud dashboard for active sessions and agent status

### No Speech Recognition
- Check microphone permissions in browser
- Verify Deepgram API key is valid
- Check agent logs for STT errors

### Teleprompter Not Advancing
- Ensure you're speaking clearly into the microphone
- Check browser console for RPC errors
- Verify agent is processing transcripts (check logs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [LiveKit](https://livekit.io) for the WebRTC infrastructure
- [Deepgram](https://deepgram.com) for speech-to-text capabilities
- [React Router](https://reactrouter.com) for the application framework
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Radix UI](https://radix-ui.com) for accessible UI components

## 📄 License

MIT License

Copyright (c) 2025 ItsAydrian, LLC.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.