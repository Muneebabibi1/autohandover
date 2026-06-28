# AutoHandover 🏭

**Smart AI-Powered Shift Handover System for Warehouse Management**

> IST 440W Capstone Project — Muneeba Khan — Penn State University — 2026

AutoHandover eliminates manual shift handovers by automatically combining Softeon WMS operational data, osTicket IT support tickets, and OpenAI GPT-3.5-turbo to generate structured, accurate handover reports in under 60 seconds.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher: https://nodejs.org
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/autohandover.git
cd autohandover

# 2. Install dependencies
npm install

# 3. Set up environment (optional — works without OpenAI key using mock AI)
cp .env.example .env
# Edit .env and add your OpenAI API key if you have one

# 4. Start the server
npm start

# 5. Open in browser
# http://localhost:3000
```

The app runs completely offline with mock data — no API keys required to test it.

---

## 📱 Application Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with role selection |
| Outgoing Supervisor | `/outgoing` | Log shift handover + generate AI summary |
| Incoming Supervisor | `/incoming` | View latest handover report |
| Handover History | `/history` | Full audit trail of all handovers |

---

## 🏗️ Architecture

```
autohandover/
├── server.js              # Express server + routing
├── routes/
│   ├── handover.js        # CRUD for handover records
│   ├── wms.js             # Softeon WMS data endpoint
│   ├── tickets.js         # osTicket integration endpoint
│   └── ai.js              # OpenAI GPT summarization
├── data/
│   ├── wms_mock.json      # Mock Softeon WMS data
│   ├── tickets_mock.json  # Mock osTicket data
│   └── handovers.json     # Persistent handover storage
└── public/
    ├── index.html         # Landing page
    ├── outgoing.html      # Outgoing supervisor form
    ├── incoming.html      # Incoming supervisor report
    ├── history.html       # Audit trail
    ├── css/style.css      # Styles (navy/amber theme)
    └── js/               # Frontend JavaScript
```

## 🤖 AI Summary

- **With OpenAI API key**: Calls GPT-3.5-turbo to generate intelligent, context-aware summaries
- **Without API key**: Uses a built-in smart template engine (works offline, no account needed)

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| AI | OpenAI GPT-3.5-turbo (optional) |
| WMS Data | Mock Softeon WMS JSON |
| IT Tickets | Mock osTicket REST data |
| Storage | JSON file (handovers.json) |
| Deployment | Render.com ready |

## 📦 Deploy to Render.com

1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variable: `OPENAI_API_KEY` (optional)

---

**Penn State University — IST 440W — Spring/Summer 2026**
