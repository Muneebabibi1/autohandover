# AutoHandover v2.0 🏭

**AI-Powered Shift Handover System for Warehouse Management**

> **IST 440W Capstone Project — Final Submission**  
> Muneeba Khan | Penn State University | Summer 2026  
> GitHub: https://github.com/Muneebabibi1/autohandover

[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)](https://github.com/Muneebabibi1/autohandover)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)](https://nodejs.org)
[![IST 440W](https://img.shields.io/badge/Penn%20State-IST%20440W-1F3864)](https://ist.psu.edu)

AutoHandover eliminates informal verbal shift handovers in warehouse environments by combining live WMS data, IT support tickets, and AI to generate structured, risk-classified handover reports in seconds. Built with **zero npm dependencies** — runs entirely on Node.js built-in modules.


---

## ✨ v2.0 Enhancements

| # | Enhancement | Type | Description |
|---|-------------|------|-------------|
| 1 | **Structured AI Summary + RISK LEVEL** | 🟠 Modified | AI output reformatted into sections with HIGH/MEDIUM/LOW classification |
| 2 | **Real-Time History Search & Filter** | 🔴 New | Live supervisor-name search + shift type + status dropdowns on history page |
| 3 | **Live Dashboard Stats** | 🔴 New | Home page stat cards fetch live data via `/api/dashboard` (Promise.all) |

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

---

## 🧪 Testing

5 deliberate crash tests were performed — all passed:

| Test | Category | Result |
|------|----------|--------|
| Empty input form submission | Logical | ✅ PASS — client-side validation blocks submission |
| OpenAI API failure / no key | Logical | ✅ PASS — offline fallback generates structured report |
| XSS injection attempt | Security | ✅ PASS — `.textContent` prevents script execution |
| Invalid URL / directory traversal | Security | ✅ PASS — 404 returned, no file system leak |
| Missing handovers.json | Data | ✅ PASS — app auto-creates file on first POST |

---

**Penn State University — IST 440W — Summer 2026 — Final Submission**
