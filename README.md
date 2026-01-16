# ClayQuest - The Autonomous World Builder

An AI-powered agent that autonomously generates imaginative 3D landscapes from natural language descriptions.

## Project Overview

ClayQuest enables users to describe their dream worlds in plain text and watch as AI agents collaboratively build them in real-time. The system uses a multi-agent architecture to interpret descriptions, generate landscapes, and render 3D visualizations.

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
