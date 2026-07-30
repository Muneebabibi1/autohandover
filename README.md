# AutoHandover 🏭

**AI-Powered Shift Handover System for Warehouse Management**

> IST 440W Capstone Project — Muneeba Khan — Penn State University — 2026  
> GitHub: https://github.com/Muneebabibi1/autohandover

AutoHandover eliminates manual shift handovers by automatically combining WMS operational data, IT support tickets, and AI to generate structured, accurate handover reports in seconds.

---

## 🚀 Quick Start — Run in 3 Steps

### Prerequisites
- **Node.js v18 or higher** — Download from https://nodejs.org (choose the LTS version)
- That's it. No other installs needed.

### Steps

```bash
# Step 1 — Download this repository as a ZIP from GitHub
# Click the green "Code" button → Download ZIP → Extract to your Desktop

# Step 2 — Open Terminal / Command Prompt and navigate to the project folder
cd Desktop/autohandover-main

# Step 3 — Start the server
node server.js
```

### Step 4 — Open in browser
```
http://localhost:3000
```

> ✅ **No `npm install` needed.** AutoHandover uses zero external packages.  
> Everything runs on built-in Node.js modules only (http, fs, path, https, crypto).

---

## 📱 Application Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Live WMS stats, alerts, and equipment status |
| Log Handover | `/outgoing` | 4-step form: WMS review → IT tickets → notes → AI summary |
| Incoming View | `/incoming` | Incoming supervisor reads and acknowledges the handover |
| History | `/history` | Full searchable audit trail of all handovers |

---

## 🤖 AI Summary

- **With OpenAI API key**: Set `OPENAI_API_KEY` in a `.env` file to use GPT-3.5-turbo
- **Without API key** (default): Built-in offline fallback generates a structured report automatically — no internet or account needed

---

## 🏗️ Project Structure

```
autohandover/
├── server.js              # Main server — all routing, APIs, file handling
├── data/
│   ├── wms_mock.json      # Mock Softeon WMS data (orders, alerts, equipment)
│   ├── tickets_mock.json  # Mock IT ticket data
│   └── handovers.json     # Handover history (auto-created on first run)
└── public/
    ├── index.html         # Dashboard (home page)
    ├── outgoing.html      # Outgoing supervisor form
    ├── incoming.html      # Incoming supervisor report
    ├── history.html       # Handover history with search & filter
    ├── css/style.css      # Styles
    └── js/
        ├── outgoing.js    # Outgoing form logic + AI summary
        └── history.js     # History search & filter logic
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js (built-in modules only — no Express) |
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| AI | OpenAI GPT-3.5-turbo (optional) + offline fallback |
| WMS Data | Mock Softeon WMS JSON |
| IT Tickets | Mock IT ticket JSON |
| Storage | JSON file (handovers.json) |

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `node: command not found` | Install Node.js from https://nodejs.org |
| `EADDRINUSE: port 3000` | Another app is using port 3000. Close other terminals or restart. |
| `Cannot find module` | You are not in the right folder. Run `cd Desktop/autohandover-main` first. |
| Page loads but shows no data | Normal — mock data loads from JSON files. Refresh the page. |

---

**Penn State University — IST 440W — Summer 2026**
