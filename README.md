# ClayQuest - The Autonomous World Builder

ClayQuest is an autonomous AI-powered "Creative Content Studio" that bridges the gap between physical play and digital storytelling. Built for the 2026 AI Agent Hackathon, ClayQuest uses a persistent, self-improving "Creative Director" agent to observe physical clay sculptures via computer vision, research their cultural context autonomously, and produce a high-fidelity, narrated digital world in real-time.

Unlike traditional reactive apps, ClayQuest operates on an Observe-Think-Act loop. It doesn't just wait for prompts—it continuously monitors the user’s physical workspace, recognizes new artistic elements, and orchestrates a multi-tool production pipeline to evolve the narrative without human intervention.

## 🚀 The Core "Creative Director" Agent

- At the heart of ClayQuest is an autonomous agentic system powered by Anthropic Claude 3.5. This agent acts as a persistent entity with the following cognitive layers:

- 👀 Real-World Observation: Uses Computer Use to "see" clay sculptures, identifying character archetypes, colors, and spatial arrangements.

- 🔍 Autonomous Scouting: Queries Macroscope and Tonic Fabricate to ground the story in historical lore and verified cultural data.

- ✍️ Creative Orchestration: Manages a production crew of specialized sub-agents for scriptwriting, voice design, and environment art.

- 📈 Self-Improving Memory: Leverages Yutori to maintain a persistent "World Lore" database, ensuring the story improves and adapts as the child continues to sculpt.

## Quick Start

```bash
# Clone the repository
git clone git@github.com:oabolade/ClayQuest---The-Autonomous-World-Builder.git
cd ClayQuest---The-Autonomous-World-Builder

# Install dependencies and start development server
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
.
├── README.md           # This file
├── docs/
│   └── PRD-MVP.md      # Product Requirements Document
└── app/                # Next.js 15 application
    ├── src/
    │   ├── app/        # App Router pages
    │   ├── components/ # React components
    │   └── lib/        # Utilities and helpers
    └── public/         # Static assets
```

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **AI**: Claude API (Anthropic)
- **3D Rendering**: Three.js / React Three Fiber
- **Infrastructure**: AWS

## Team

- **oabolade** - Team Lead
- **RogerHao** - Frontend & UI Development
- (Add other team members)

## Documentation

- [Product Requirements Document](./docs/PRD-MVP.md)

## Development

```bash
# Run development server
cd app && npm run dev

# Build for production
cd app && npm run build

# Run linting
cd app && npm run lint
```

## Branch Strategy

- `main` - Production-ready code
- `<team-member-name>` - Individual development branches

---

*Built at Agentic Orchestration Hack - January 16, 2026*
