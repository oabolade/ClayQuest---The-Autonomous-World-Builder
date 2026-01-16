# ClayQuest - The Autonomous World Builder

Transform your clay creations into magical audio picture books with AI.

## Features

- **Camera Capture**: Take photos of clay creations directly in the browser
- **AI Story Generation**: Claude Sonnet 4 analyzes the image and creates a 4-page children's story
- **AI Image Generation**: Google Imagen 4.0 creates beautiful illustrations for each page
- **Voice Narration**: ElevenLabs generates warm, storytelling voices (with Web Speech API fallback)
- **Picture Book Viewer**: Swipe through pages with auto-playing narration

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS |
| Story Generation | Claude Sonnet 4 (Anthropic) |
| Image Generation | Imagen 4.0 (Google) |
| Voice Narration | ElevenLabs / Web Speech API |

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Required keys:
- `ANTHROPIC_API_KEY` - Get from [Anthropic Console](https://console.anthropic.com/)
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/)
- `ELEVENLABS_API_KEY` - Get from [ElevenLabs](https://elevenlabs.io/) (optional)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Voice Options

Configure `ELEVENLABS_VOICE_ID` in `.env.local`:

| Voice | ID | Description |
|-------|-----|-------------|
| George (default) | `JBFqnCBsd6RMkjVDRZzb` | Warm, captivating storyteller |
| Alice | `Xb7hH8MSUJpSbSDYk0k2` | Clear, engaging educator |
| Jessica | `cgSgspJ2msm6clMCkdW9` | Playful, bright, warm |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | Mature, reassuring, confident |
| Father Christmas | `1wg2wOjdEWKA7yQD8Kca` | Festive storyteller |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   # Story generation API
│   │   └── tts/route.ts        # Text-to-speech API
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ClayQuestApp.tsx        # Main app with state management
│   ├── WelcomeScreen.tsx       # Landing page
│   ├── CaptureScreen.tsx       # Camera capture
│   ├── LoadingScreen.tsx       # Generation progress
│   └── PictureBookViewer.tsx   # Story viewer with audio
├── lib/
│   └── ai.ts                   # AI service integrations
└── types/
    └── index.ts                # TypeScript types
```

## User Flow

1. **Welcome** - Click "Start Adventure"
2. **Capture** - Take a photo of your clay creation
3. **Generate** - AI creates story, images, and audio (~30-60s)
4. **Enjoy** - Read/listen to your personalized picture book

---

*Built at Agentic Orchestration Hack - January 16, 2026*
