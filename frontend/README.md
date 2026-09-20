# Adhikaar Frontend

The Next.js 16 web application for India's AI Welfare Copilot.

## Tech Stack

- **Framework**: Next.js 16 (React 19, App Router)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Animations**: Framer Motion + GSAP
- **Voice**: LiveKit React Components
- **AI**: Vercel AI SDK + Groq + Gemini

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your API keys
# Required: GROQ_API_KEY, GEMINI_API_KEY, LIVEKIT_* variables

# Run development server
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Deploy on Vercel

```bash
npm i -g vercel
vercel --prod
```

See root `README.md` for full deployment guide.

## Features

- Voice-first chat interface with multi-language support
- Government scheme discovery (4,600+ schemes)
- AI-powered form filling automation
- OCR document parsing
- Application tracking dashboard
