// AutoHandover v2.0 — Zero-dependency Node.js server
// IST 440W Capstone | Muneeba Khan | Penn State 2026
// ENHANCED: Live Dashboard Stats, History Search, Structured AI Summary
// Run: node server.js

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const https = require('https');
const { randomUUID } = require('crypto');

// Load .env file manually (no dotenv package needed)
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && !key.startsWith('#')) process.env[key.trim()] = rest.join('=').trim();
  });
} catch (_) {}

const PORT         = process.env.PORT || 3000;
const DATA_DIR     = path.join(__dirname, 'data');
const PUBLIC_DIR   = path.join(__dirname, 'public');
const HANDOVERS_F  = path.join(DATA_DIR, 'handovers.json');

// ── MIME types ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.ico':  'image/x-icon'
};

// ── Utilities ────────────────────────────────────────────────────────────────
function readJSON(file)      { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function writeJSON(file, d)  { fs.writeFileSync(file, JSON.stringify(d, null, 2)); }
function readBody(req) {
  return new Promise((res, rej) => {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => { try { res(JSON.parse(b || '{}')); } catch { res({}); } });
    req.on('error', rej);
  });
}
function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(body);
}
function file(res, filePath) {
  const ext = path.extname(filePath);
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(content);
  } catch { json(res, 404, { error: 'File not found' }); }
}

// ── OpenAI summarizer (HTTPS, no package) ────────────────────────────────────
function openAISummary(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }], max_tokens: 450, temperature: 0.4 });
    const req = https.request({ hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Length': Buffer.byteLength(body) }
    }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d).choices[0].message.content); } catch { reject(new Error('parse')); } }); });
    req.on('error', reject); req.write(body); req.end();
  });
}

// ── Smart offline summary (no API needed) ────────────────────────────────────
function offlineSummary(name, shift, notes, issues, alerts, tickets) {
  const ts = new Date().toLocaleString();
  const highA = (alerts  || []).filter(a => a.severity === 'High');
  const highT = (tickets || []).filter(t => t.priority === 'High');
  const risk  = highA.length > 0 ? 'HIGH' : (tickets && tickets.length > 2 ? 'MEDIUM' : 'LOW');
  return `AUTOHANDOVER SHIFT SUMMARY — Generated ${ts}
Outgoing Supervisor: ${name} | Shift: ${shift}

RISK LEVEL: ${risk}

SHIFT STATUS:
Shift completed with ${highA.length} high-priority WMS alert(s) and ${(tickets||[]).length} open IT ticket(s).${highA.length > 0 ? ' Immediate attention required before starting operations.' : ' Shift transition is stable.'}

⚠️ CRITICAL ACTION ITEMS (complete before starting operations):
1. ${highA.length > 0 ? highA[0].message : 'Review WMS dashboard for any new alerts'}
2. ${highT.length > 0 ? `Resolve HIGH ticket: [${highT[0].id}] ${highT[0].subject}` : 'Check open IT tickets and assign to technicians'}
3. ${notes ? `Supervisor Note: ${notes.substring(0, 80)}` : 'Brief your team before beginning shift operations'}

📦 WMS ALERTS:
${(alerts||[]).map(a => `• [${a.severity}] ${a.message}`).join('\n') || '• No active WMS alerts.'}

🎫 OPEN IT TICKETS:
${(tickets||[]).map(t => `• [${t.id}] ${t.subject} | Priority: ${t.priority} | ${t.status}`).join('\n') || '• No open tickets.'}

🔧 EQUIPMENT NOTES:
${issues || '• No equipment issues reported by outgoing supervisor.'}

✅ RECOMMENDED HANDOVER STEPS:
1. Review all HIGH priority items above with your shift team immediately
2. Confirm WMS login access is working for all incoming staff
3. Acknowledge this handover report to confirm receipt

— AutoHandover AI System v2.0 | IST 440W Capstone | Penn State 2026`;
}

// ── Page routes ───────────────────────────────────────────────────────────────
const PAGES = { '/': 'index.html', '/outgoing': 'outgoing.html', '/incoming': 'incoming.html', '/history': 'history.html' };

// ── Main request handler ──────────────────────────────────────────────────────
async function handler(req, res) {
  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') { json(res, 204, {}); return; }

  try {
    // Health
    if (pathname === '/api/health') { return json(res, 200, { status: 'ok', app: 'AutoHandover', version: '2.0.0', ts: new Date().toISOString() }); }

    // WMS
    if (pathname === '/api/wms/status') { return json(res, 200, { success: true, data: readJSON(path.join(DATA_DIR, 'wms_mock.json')) }); }

    // Dashboard stats (ENHANCEMENT v2.0)
    if (pathname === '/api/dashboard') {
      const hs   = readJSON(HANDOVERS_F) || [];
      const wms  = readJSON(path.join(DATA_DIR, 'wms_mock.json'));
      const tkts = readJSON(path.join(DATA_DIR, 'tickets_mock.json'));
      const open = (tkts.tickets||[]).filter(t => t.status !== 'Resolved');
      const highA = (wms.alerts||[]).filter(a => a.severity === 'High');
      return json(res, 200, {
        success: true,
        stats: {
          totalHandovers: hs.length,
          openTickets: open.length,
          highTickets: open.filter(t=>t.priority==='High').length,
          activeAlerts: (wms.alerts||[]).length,
          highAlerts: highA.length,
          lastHandover: hs.length ? hs[0].timestamp : null,
          systemStatus: highA.length > 0 ? 'ALERT' : 'NORMAL'
        }
      });
    }

    // Tickets
    if (pathname === '/api/tickets' && req.method === 'GET') {
      const raw  = readJSON(path.join(DATA_DIR, 'tickets_mock.json'));
      const open = raw.tickets.filter(t => t.status !== 'Resolved');
      return json(res, 200, { success: true, data: open, all: raw.tickets });
    }

    // Handovers — list
    if (pathname === '/api/handover' && req.method === 'GET') {
      return json(res, 200, { success: true, handovers: readJSON(HANDOVERS_F) || [] });
    }

    // Handovers — latest
    if (pathname === '/api/handover/latest' && req.method === 'GET') {
      const hs = readJSON(HANDOVERS_F) || [];
      if (!hs.length) return json(res, 200, { success: false, message: 'No handovers found' });
      return json(res, 200, { success: true, handover: hs[0] });
    }

    // Handovers — create
    if (pathname === '/api/handover' && req.method === 'POST') {
      const body = await readBody(req);
      const hs   = readJSON(HANDOVERS_F) || [];
      const h    = { id: randomUUID(), timestamp: new Date().toISOString(), ...body };
      hs.unshift(h);
      writeJSON(HANDOVERS_F, hs);
      return json(res, 200, { success: true, handover: h });
    }

    // Handovers — acknowledge
    const ackM = pathname.match(/^\/api\/handover\/([^/]+)\/acknowledge$/);
    if (ackM && req.method === 'POST') {
      const body = await readBody(req);
      const hs   = readJSON(HANDOVERS_F) || [];
      const idx  = hs.findIndex(h => h.id === ackM[1]);
      if (idx === -1) return json(res, 404, { success: false });
      hs[idx] = { ...hs[idx], acknowledged: true, acknowledgedBy: body.supervisorName, acknowledgedAt: new Date().toISOString() };
      writeJSON(HANDOVERS_F, hs);
      return json(res, 200, { success: true, handover: hs[idx] });
    }

    // AI summarize
    if (pathname === '/api/ai/summarize' && req.method === 'POST') {
      const { supervisorName, shiftType, notes, openIssues, wmsAlerts, openTickets } = await readBody(req);
      const key = process.env.OPENAI_API_KEY;
      let summary, source;
      if (key && key !== 'your_openai_api_key_here') {
        try {
          summary = await openAISummary(`You are AutoHandover AI for a warehouse management system. Generate a STRUCTURED shift handover report with clearly labeled sections.

Supervisor: ${supervisorName} | Shift: ${shiftType}
Supervisor Notes: ${notes}
Open Issues: ${openIssues}
WMS Alerts: ${JSON.stringify(wmsAlerts)}
Open IT Tickets: ${JSON.stringify(openTickets)}

Format your response EXACTLY like this:
RISK LEVEL: [HIGH / MEDIUM / LOW]

SHIFT STATUS:
[1-2 sentence overall summary]

⚠️ CRITICAL ACTION ITEMS (complete before starting operations):
1. [action]
2. [action]
3. [action]

📦 WMS ALERTS:
• [alert summary with severity]

🎫 OPEN IT TICKETS:
• [ticket ID + description + priority]

🔧 EQUIPMENT NOTES:
• [any equipment issues]

✅ RECOMMENDED HANDOVER STEPS:
1. [step]
2. [step]
3. [step]

Keep total response under 350 words. Be direct and actionable.`);
          source = 'openai';
        } catch { summary = offlineSummary(supervisorName, shiftType, notes, openIssues, wmsAlerts, openTickets); source = 'mock'; }
      } else {
        summary = offlineSummary(supervisorName, shiftType, notes, openIssues, wmsAlerts, openTickets);
        source = 'mock';
      }
      return json(res, 200, { success: true, summary, source });
    }

    // Page routes
    if (PAGES[pathname]) return file(res, path.join(PUBLIC_DIR, PAGES[pathname]));

    // Static assets
    const staticPath = path.join(PUBLIC_DIR, pathname);
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) return file(res, staticPath);

    json(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('Handler error:', err);
    json(res, 500, { error: 'Server error', message: err.message });
  }
}

http.createServer(handler).listen(PORT, () => {
  console.log(`\n🚀 AutoHandover → http://localhost:${PORT}`);
  console.log(`   Smart Shift Handover | IST 440W | Muneeba Khan | Penn State 2026\n`);
});
