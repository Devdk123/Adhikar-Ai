<!-- Generated README — see frontend/README.md for frontend-specific docs -->

# Adhikaar (अधिकार)

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/LiveKit-Cloud-blue?style=for-the-badge&logo=livekit" alt="LiveKit">
  <img src="https://img.shields.io/badge/Groq-LLM-7B61FF?style=for-the-badge&logo=hardware" alt="Groq">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<p align="center">
  <strong>India's First AI Welfare Copilot</strong><br>
  Voice-first AI assistant that helps Indian citizens discover and apply for government welfare schemes in their native language.
</p>

<p align="center">
  <a href="https://github.com/your-username/adhikaar">Repository</a>
  ·
  <a href="#-deployment">Deployment</a>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎙️ **Voice-First AI** | Talk to the assistant in Hindi, English, or 10+ Indian languages |
| 🏛️ **4,600+ Schemes** | Access to government welfare schemes via myScheme.gov.in API |
| 🤖 **AI Form Filling** | Autonomous browser automation that fills government forms |
| 📄 **OCR Document Parsing** | Extract information from Aadhaar, PAN, and other documents |
| 🔊 **Real-Time Voice** | LiveKit-powered voice calls with human-like responses |
| 🌐 **Multi-Language** | Supports Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia |
| 👨‍👩‍👧‍👦 **Family Mode** | Apply for schemes for your entire family |
| 📊 **Application Tracker** | Dashboard to track all submitted applications |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              USERS                                   │
│                    (Web App, Voice Call)                            │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Next.js 16    │  │   LiveKit       │  │   Sarvam AI     │
│   Frontend      │  │   Cloud Hosted  │  │   STT/TTS       │
│   (Vercel)      │  │   Voice Agent   │  │   (Indian Lang) │
└────────┬────────┘  └────────┬────────┘  └─────────────────┘
         │                    │
         │            ┌───────┴───────┐
         │            │               │
         ▼            ▼               ▼
┌─────────────────────────────────────────────────────┐
│                    API Layer                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │
│  │  Groq   │  │ Gemini  │  │   myScheme.gov.in   │  │
│  │  LLM    │  │ Vision  │  │   (4600+ schemes)   │  │
│  └─────────┘  └─────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│              Automation Layer (Playwright)           │
│         AI-powered universal form filler            │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + shadcn/ui
- **Animations**: [Framer Motion](https://www.framer.com/) + GSAP
- **Voice UI**: [LiveKit](https://livekit.io/) + WebGL shaders
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/)

### Backend / Agent
- **Voice Agent**: [LiveKit Cloud Hosted Agents](https://cloud.livekit.io/) + Python
- **Voice AI**: [Google Gemini 2.0 Flash Realtime](https://ai.google.dev/)
- **Automation**: [Playwright](https://playwright.dev/)
- **Speech**: [Sarvam AI](https://sarvam.ai/) (Saarika STT, Bulbul TTS)

### External APIs
- **LLM**: [Groq](https://console.groq.com/) (Llama 3.3 70B)
- **Vision**: [Google Gemini](https://ai.google.dev/) (OCR)
- **Schemes**: [myScheme.gov.in](https://myscheme.gov.in/) API

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- [Groq API Key](https://console.groq.com/)
- [LiveKit Cloud](https://cloud.livekit.io/) account
- [Google AI API Key](https://aistudio.google.com/app/apikey)
- [Sarvam AI API Key](https://sarvam.ai/) (optional, for voice)
- [myScheme API Key](https://developers.myscheme.gov.in/) (optional)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/adhikaar.git
cd adhikaar

# 2. Setup Frontend
cd frontend
cp .env.example .env.local
# Edit .env.local with your API keys
npm install
npm run dev
```

### Voice Agent (Local Development)

```bash
cd agent
cp .env.example .env.local
# Edit .env.local with your API keys
pip install -e .
python -m agent.src.agent start
```

---

## 🌐 Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

**Vercel Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Automatic SSL

### Voice Agent (LiveKit Cloud Hosted Agents)

LiveKit Cloud handles agent hosting — no server management needed.

1. **Install LiveKit CLI**
   ```bash
   winget install LiveKit.LiveKitCLI
   ```

2. **Authenticate**
   ```bash
   lk cloud auth
   ```

3. **Create & Deploy Agent**
   ```bash
   cd agent
   lk agent create
   lk agent deploy
   ```

4. **Add Secrets**
   ```bash
   lk agent secrets set GOOGLE_API_KEY=your_gemini_api_key
   ```

**LiveKit Cloud Free Tier:**
- 3 concurrent rooms
- 15GB transfer/month
- Always-on agents
- No server management

---

## 🔑 Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key for text chat |
| `GEMINI_API_KEY` | Yes | Gemini API for OCR |
| `SARVAM_API_KEY` | Recommended | Indian language STT/TTS |
| `LIVEKIT_URL` | Yes | LiveKit Cloud instance URL |
| `LIVEKIT_API_KEY` | Yes | LiveKit API key |
| `LIVEKIT_API_SECRET` | Yes | LiveKit API secret |
| `MYSCHEME_API_KEY` | Optional | Government scheme API |

### Agent (LiveKit Cloud Dashboard)

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes | Gemini 2.0 Flash Realtime |

---

## 📁 Project Structure

```
adhikaar/
├── frontend/                    # Next.js 16 web application (Vercel)
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/         # React components
│   │   ├── lib/               # Utilities & integrations
│   │   └── data/              # Local scheme database
│   └── package.json
│
├── agent/                      # Python LiveKit voice agent (LiveKit Cloud)
│   ├── src/
│   │   ├── agent.py           # Main voice agent
│   │   └── data/              # Bundled scheme database
│   └── pyproject.toml
│
├── docker-compose.yml          # Local development
└── README.md                   # This file
```

---

## 📜 License

MIT License — feel free to use this project for your own purposes.

---

## 🙏 Acknowledgments

- **Groq** — Lightning-fast LLM inference
- **LiveKit** — Real-time voice infrastructure
- **Sarvam AI** — Indian language speech processing
- **myScheme.gov.in** — Government scheme data

---

<p align="center">
  Made with ❤️ for India
</p>
