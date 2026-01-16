# Hackathon Sponsors Analysis

## Overview by Category

This document categorizes all hackathon sponsors by their product domain and capabilities to help you decide which products to integrate at each stage of your ClayQuest project.

---

## 1. AI Models & Core Intelligence

### Anthropic - Claude API
**Category:** Large Language Model / Core AI Brain

| Aspect | Details |
|--------|---------|
| **What it does** | Claude is a frontier AI model with strong vision, reasoning, and generation capabilities |
| **Key APIs** | Messages API (text + vision), Tool Use, Computer Use |
| **Best for ClayQuest** | ★★★★★ CORE - Image analysis, story generation, prompt orchestration |
| **Integration Point** | Central brain - analyzes clay photos, generates stories, creates prompts for other APIs |

**Why use it:**
- Vision capability to understand clay creations from photos
- Strong creative writing for children's stories
- Can output structured JSON (image prompts, narration scripts)
- Tool use for orchestrating multiple API calls

---

## 2. Content Generation

### Freepik - AI Image Generation API
**Category:** Image Generation / Visual Content

| Aspect | Details |
|--------|---------|
| **What it does** | Text-to-image generation with multiple style engines |
| **Key APIs** | Mystic API (text-to-image), multiple engines (Illusio, Sharpy, Sparkle) |
| **Engines** | Illusio (illustrations), Sharpy (realistic), Sparkle (balanced) |
| **Pricing** | Free: 20 images/day, Premium+: 1000/month, Pro: 5000/month |
| **Best for ClayQuest** | ★★★★★ CORE - Generate illustrated storybook pages |

**Why use it:**
- **Illusio engine** perfect for children's book illustration style
- Fast generation suitable for hackathon demo
- Free tier sufficient for MVP (20 images/day)
- Supports style consistency across multiple generations

**Integration Point:** Generate 3-5 illustrated scenes per story based on Claude's prompts

**API Example:**
```bash
POST /v1/ai/image
{
  "prompt": "A friendly purple clay dragon in a magical forest, children's book illustration style",
  "engine": "illusio"
}
```

Sources: [Freepik AI Image Generation API](https://www.freepik.com/api/image-generation), [Mystic API Docs](https://docs.freepik.com/api-reference/mystic/post-mystic)

---

### ElevenLabs - Voice Synthesis API
**Category:** Voice Generation / Audio Content

| Aspect | Details |
|--------|---------|
| **What it does** | Most realistic AI text-to-speech with emotional awareness |
| **Key APIs** | Text-to-Speech, Speech-to-Speech, Voice Design |
| **Models** | Eleven v3 (expressive), Flash v2.5 (75ms latency), Multilingual v2 |
| **Voices** | 5000+ voices, 70+ languages, custom voice cloning |
| **Best for ClayQuest** | ★★★★★ CORE - Generate story narration audio |

**Why use it:**
- Emotionally rich narration perfect for children's stories
- Can add excitement, wonder, different character voices
- Supports SSML for fine control (pauses, emphasis)
- Fast streaming for real-time playback

**Integration Point:** Generate audio narration for each story page

**API Example:**
```bash
POST /v1/text-to-speech/{voice_id}
{
  "text": "Once upon a time, in a magical kingdom of clay...",
  "model_id": "eleven_multilingual_v2"
}
```

Sources: [ElevenLabs API](https://elevenlabs.io/developers), [Text to Speech Docs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech)

---

## 3. Agent Infrastructure & Orchestration

### Retool - Agent Orchestration Platform
**Category:** Agent Orchestration / Internal Tools / Dashboards

| Aspect | Details |
|--------|---------|
| **What it does** | Build AI agents with visual tools, connect to any data source, real-time monitoring |
| **Key Features** | Agent builder, workflow automation, real-time dashboards, any LLM support |
| **Best for ClayQuest** | ★★★☆☆ OPTIONAL - Admin dashboard, story history |

**Why use it:**
- Real-time agent monitoring (watch your story generation)
- Build parent/admin dashboard to view all generated stories
- Workflow automation for multi-step generation pipeline

**Integration Point:** Post-MVP - Create a "Story Dashboard" for parents to see their child's story history

Sources: [Retool Agents](https://retool.com/agents), [Retool AI](https://retool.com/ai)

---

### Anyscale - Ray Distributed Computing
**Category:** AI Compute Infrastructure / Scaling

| Aspect | Details |
|--------|---------|
| **What it does** | Distribute AI workloads across clusters, scale training and inference |
| **Key Tech** | Ray (open source), used by OpenAI for ChatGPT training |
| **Best for ClayQuest** | ★☆☆☆☆ LOW PRIORITY - Not needed for MVP |

**Why skip for MVP:**
- Designed for large-scale distributed computing
- Overkill for a hackathon prototype
- More relevant for production scaling later

Sources: [Ray by Anyscale](https://www.ray.io/), [Anyscale Platform](https://www.anyscale.com/)

---

## 4. Agent Workflow & Web Automation

### Cline - AI Coding Assistant
**Category:** Developer Tools / AI Coding Agent

| Aspect | Details |
|--------|---------|
| **What it does** | Autonomous coding agent in VS Code/JetBrains IDEs |
| **Key Features** | Plan/Act modes, file editing, terminal commands, browser use, MCP support |
| **Users** | 4M+ developers |
| **Best for ClayQuest** | ★★★★☆ DEV TOOL - Help you build faster during hackathon |

**Why use it:**
- Speed up your development during the hackathon
- Can help write React components, API integrations
- Understands entire codebases for complex changes

**Integration Point:** Use during development, not in the product itself

**Get Credits:** https://docs.google.com/forms/d/e/1FAIpQLSeUkqveLePmtYL-UDYRUJJ3aIG83oJ06lE-5z7mH7GTD3QoHg/viewform

Sources: [Cline](https://cline.bot/), [Cline GitHub](https://github.com/cline/cline)

---

### TinyFish - Web Automation for AI Agents
**Category:** Web Scraping / Browser Automation

| Aspect | Details |
|--------|---------|
| **What it does** | Give AI agents "eyes on the web" - automate web interactions |
| **Key Tech** | AgentQL (natural language queries for web elements) |
| **Accuracy** | 95% first-try accuracy |
| **Clients** | Google, DoorDash, Fortune 500 companies |
| **Best for ClayQuest** | ★★☆☆☆ OPTIONAL - Research for story enrichment |

**Why consider it:**
- Original PRD mentioned using web agents to find "real-world facts" about clay creations
- Could search for cultural legends, animal facts to enrich stories
- Example: Child makes a dragon → TinyFish searches for dragon legends

**Integration Point:** Post-MVP - Enrich stories with real-world facts and cultural references

Sources: [TinyFish](https://www.tinyfish.ai/), [AgentQL GitHub](https://github.com/tinyfish-io/agentql)

---

### Yutori - Persistent AI Agents with Memory
**Category:** Agent Memory / Personal AI Assistants

| Aspect | Details |
|--------|---------|
| **What it does** | Autonomous AI "Scouts" that monitor and remember across sessions |
| **Key Tech** | DBOS for durable execution, persistent memory |
| **Founders** | Ex-Meta FAIR researchers (Devi Parikh, Dhruv Batra) |
| **Best for ClayQuest** | ★★★☆☆ POST-MVP - Remember story "lore" across sessions |

**Why consider it:**
- Original PRD mentioned "remembering the lore of this specific child's world"
- Stories could continue where they left off tomorrow
- Build persistent character relationships

**Integration Point:** Post-MVP - Story continuity feature ("Continue your adventure with Purple Dragon!")

Sources: [Yutori](https://www.thehomebase.ai/companies/yutori), [Yutori on DBOS](https://www.dbos.dev/case-studies/yutori-large-scale-durable-agentic-ai)

---

## 5. Identity & Security

### Auth0 (Okta) - Identity & Authentication
**Category:** User Authentication / Identity Management

| Aspect | Details |
|--------|---------|
| **What it does** | Authentication-as-a-service, social logins, passwordless auth |
| **New in 2026** | Auth for GenAI - secure identity for AI agents |
| **Key Features** | Universal Login, Token Vault for AI agents, OAuth 2.0 |
| **Best for ClayQuest** | ★★☆☆☆ POST-MVP - User accounts, parental controls |

**Why consider it:**
- Save stories to user accounts
- Parental controls for children's content
- "Auth for GenAI" feature specifically for AI agent apps

**Integration Point:** Post-MVP - User login, story library, parental dashboard

Sources: [Auth0 GenAI Features](https://www.okta.com/newsroom/press-releases/auth0-platform-innovation/), [Auth0 Platform](https://www.okta.com/products/customer-identity/)

---

## 6. Testing, Observability & Data

### Macroscope - AI Code Review & Observability
**Category:** Code Review / Engineering Intelligence

| Aspect | Details |
|--------|---------|
| **What it does** | AI-powered code review, commit summaries, project understanding |
| **Best for ClayQuest** | ★☆☆☆☆ LOW PRIORITY - More for engineering teams |

**Integration Point:** Not relevant for MVP - useful for larger engineering teams

Sources: [Macroscope](https://macroscope.com)

---

### Tonic AI - Synthetic Test Data
**Category:** Test Data Generation / Data Privacy

| Aspect | Details |
|--------|---------|
| **What it does** | Generate synthetic test data, de-identify sensitive data |
| **Products** | Structural (databases), Fabricate (generate from scratch), Textual (unstructured) |
| **New in 2026** | Guided Redaction, auto-applying generators |
| **Best for ClayQuest** | ★☆☆☆☆ LOW PRIORITY - Not needed for MVP |

**Why skip for MVP:**
- Designed for enterprise data testing
- More relevant for apps handling sensitive user data at scale

Sources: [Tonic.ai](https://www.tonic.ai/), [Tonic Fabricate](https://www.tonic.ai/products/fabricate)

---

### Modulate - Voice Intelligence & Moderation
**Category:** Voice Moderation / Safety

| Aspect | Details |
|--------|---------|
| **What it does** | AI-powered voice chat moderation, toxicity detection |
| **Products** | ToxMod (moderation), VoiceVault (anti-fraud) |
| **Scale** | 200M+ hours analyzed, 80M+ events flagged |
| **Clients** | Activision, Riot Games, Rockstar, Rec Room |
| **Best for ClayQuest** | ★★☆☆☆ OPTIONAL - Moderate child voice input |

**Why consider it:**
- Children are recording voice descriptions
- Could detect inappropriate content before processing
- Safety compliance for children's apps

**Integration Point:** Post-MVP - Safety filter for recorded voice descriptions

Sources: [Modulate AI](https://www.modulate.ai/), [ToxMod](https://www.modulate.ai/products/toxmod)

---

### Senso - Knowledge Intelligence
**Category:** Knowledge Management / GEO (Generative Engine Optimization)

| Aspect | Details |
|--------|---------|
| **What it does** | Transform enterprise knowledge for AI consumption, optimize for AI answers |
| **Focus** | Financial services, healthcare, regulated industries |
| **Best for ClayQuest** | ★☆☆☆☆ LOW PRIORITY - Not relevant for consumer app |

**Why skip:**
- Designed for enterprise knowledge bases
- GEO focus not relevant for creative app

Sources: [Senso AI](https://www.senso.ai/)

---

## 7. Cloud Infrastructure

### AWS (Amazon Web Services)
**Category:** Cloud Infrastructure / Hosting

| Aspect | Details |
|--------|---------|
| **What it does** | Full cloud infrastructure - compute, storage, CDN, etc. |
| **Best for ClayQuest** | ★★★☆☆ OPTIONAL - Hosting, asset storage |

**Integration Point:** Host backend API, store generated images/audio

---

## Summary: MVP Integration Priorities

### MUST HAVE (Core MVP)

| Priority | Sponsor | Purpose | Integration |
|----------|---------|---------|-------------|
| ⭐⭐⭐⭐⭐ | **Anthropic (Claude)** | Core AI brain | Analyze photos, generate stories, create prompts |
| ⭐⭐⭐⭐⭐ | **Freepik** | Image generation | Generate illustrated story pages |
| ⭐⭐⭐⭐⭐ | **ElevenLabs** | Voice synthesis | Generate audio narration |

### DEVELOPMENT TOOLS

| Priority | Sponsor | Purpose | Integration |
|----------|---------|---------|-------------|
| ⭐⭐⭐⭐ | **Cline** | Coding assistant | Speed up hackathon development |

### NICE TO HAVE (Post-MVP)

| Priority | Sponsor | Purpose | Integration |
|----------|---------|---------|-------------|
| ⭐⭐⭐ | **Yutori** | Memory persistence | Story continuity across sessions |
| ⭐⭐⭐ | **Retool** | Dashboard | Parent/admin story viewer |
| ⭐⭐ | **TinyFish** | Web research | Enrich stories with real-world facts |
| ⭐⭐ | **Auth0** | Authentication | User accounts, parental controls |
| ⭐⭐ | **Modulate** | Voice moderation | Safety filter for child voice input |
| ⭐⭐ | **AWS** | Infrastructure | Production hosting |

### LOW PRIORITY (Skip for Hackathon)

| Sponsor | Reason |
|---------|--------|
| Anyscale | Overkill for MVP scale |
| Tonic AI | Enterprise data focus |
| Macroscope | Engineering team tool |
| Senso | Enterprise knowledge focus |

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                               │
│              Camera Photo + Voice Recording                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CLAUDE API (Anthropic)                      │
│                         ⭐ CORE ⭐                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Analyze clay photo (vision)                          │   │
│  │ 2. Process voice transcription                          │   │
│  │ 3. Generate children's story (3-5 pages)                │   │
│  │ 4. Output: image prompts + narration text               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    FREEPIK API          │     │    ELEVENLABS API       │
│      ⭐ CORE ⭐          │     │      ⭐ CORE ⭐          │
│                         │     │                         │
│  For each page:         │     │  For each page:         │
│  - Image prompt →       │     │  - Narration text →     │
│  - Illustrated scene    │     │  - Audio file           │
│  - Illusio engine       │     │  - Child-friendly voice │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PICTURE BOOK OUTPUT                        │
│           Images + Audio + Text → Interactive Viewer            │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Credits & Access

| Sponsor | How to Get Credits |
|---------|-------------------|
| **Claude API** | Fill out form by EOD Thursday (check Discord) |
| **Cline** | https://docs.google.com/forms/d/e/1FAIpQLSeUkqveLePmtYL-UDYRUJJ3aIG83oJ06lE-5z7mH7GTD3QoHg/viewform |
| **ElevenLabs** | Join Discord → #coupon-codes → Start Redemption |
| **Freepik** | Check Discord for sponsor channel |

---

*Document created: January 16, 2026*
*For: Agentic Orchestration Hack*
