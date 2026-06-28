let wmsData = null;
let ticketsData = null;

window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  document.getElementById('shift-info').textContent =
    `${now.toLocaleDateString()} — ${now.toLocaleTimeString()} | ${getShiftName(now.getHours())}`;
  loadWMS();
});

function getShiftName(h) {
  if (h >= 6 && h < 14) return 'Day Shift (6am–2pm)';
  if (h >= 14 && h < 22) return 'Afternoon Shift (2pm–10pm)';
  return 'Night Shift (10pm–6am)';
}

function loadWMS() {
  fetch('/api/wms/status').then(r => r.json()).then(data => {
    wmsData = data.data;
    const m = wmsData.metrics;
    document.getElementById('orders-pending').textContent = m.orders_pending;
    document.getElementById('orders-done').textContent = m.orders_completed_today;
    document.getElementById('pick-acc').textContent = m.pick_accuracy;

    // Orders table
    const tbody = document.getElementById('orders-table');
    tbody.innerHTML = wmsData.active_orders.map(o => `
      <tr>
        <td><strong>${o.order_id}</strong></td>
        <td>${o.customer}</td>
        <td>${o.status}</td>
        <td><span class="badge badge-${o.priority.toLowerCase()}">${o.priority}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:.5rem">
            <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${o.completion}%"></div></div>
            <span style="font-size:.8rem;width:30px">${o.completion}%</span>
          </div>
        </td>
      </tr>`).join('');

    // WMS Alerts
    const alertsEl = document.getElementById('wms-alerts');
    alertsEl.innerHTML = wmsData.alerts.map(a => `
      <div class="alert-item ${a.severity.toLowerCase()}">
        <div class="alert-icon">${a.severity === 'High' ? '🔴' : a.severity === 'Medium' ? '🟡' : '🟢'}</div>
        <div class="alert-text">${a.message}</div>
        <div class="alert-time">${a.time}</div>
      </div>`).join('');

    // Equipment
    const equip = document.getElementById('equip-table');
    equip.innerHTML = wmsData.equipment.map(e => `
      <tr>
        <td><strong>${e.id}</strong></td>
        <td>${e.type}</td>
        <td><span class="badge badge-${e.status === 'Running' || e.status === 'Available' ? 'low' : e.status === 'In Use' ? 'medium' : 'high'}">${e.status}</span></td>
        <td>${e.location}</td>
      </tr>`).join('');
  }).catch(err => console.error('WMS error:', err));
}

function loadTickets() {
  fetch('/api/tickets').then(r => r.json()).then(data => {
    ticketsData = data.data;
    const el = document.getElementById('tickets-list');
    if (!ticketsData.length) {
      el.innerHTML = '<p style="color:var(--green)">✅ No open IT tickets at this time.</p>';
      return;
    }
    el.innerHTML = ticketsData.map(t => `
      <div class="ticket-item">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="ticket-id">${t.id}</div>
            <div class="ticket-subject">${t.subject}</div>
            <div class="ticket-meta">Assigned: ${t.assigned_to} &nbsp;|&nbsp; Dept: ${t.department} &nbsp;|&nbsp; Updated: ${t.last_update}</div>
            <div class="ticket-meta" style="margin-top:.3rem;color:var(--dgray)">${t.description}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:.3rem;align-items:flex-end;margin-left:.5rem">
            <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
            <span class="badge badge-${t.status === 'Open' ? 'open' : 'progress'}">${t.status}</span>
          </div>
        </div>
      </div>`).join('');
  }).catch(err => console.error('Tickets error:', err));
}

function goToTickets() {
  goToSection('tickets');
  loadTickets();
}

function goToNotes() {
  goToSection('notes');
}

function goToSection(name) {
  ['wms', 'tickets', 'notes', 'summary'].forEach(s => {
    document.getElementById('section-' + s).style.display = s === name ? 'block' : 'none';
  });
  const steps = { wms: 1, tickets: 2, notes: 3, summary: 4 };
  const current = steps[name];
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('step' + i);
    el.className = 'step' + (i < current ? ' done' : i === current ? ' active' : '');
    if (i < 4) {
      const sep = document.querySelectorAll('.step-sep')[i - 1];
      if (sep) sep.className = 'step-sep' + (i < current ? ' done' : '');
    }
  }
}

async function generateSummary() {
  const supervisorName = document.getElementById('supervisor-name').value.trim();
  const shiftType = document.getElementById('shift-type').value;
  const notes = document.getElementById('shift-notes').value.trim();
  const openIssues = document.getElementById('open-issues').value.trim();
  const priority = document.getElementById('priority').value;

  if (!supervisorName) {
    alert('Please enter your name before generating the summary.');
    document.getElementById('supervisor-name').focus();
    return;
  }

  goToSection('summary');
  document.getElementById('loading-summary').style.display = 'block';
  document.getElementById('summary-content').style.display = 'none';

  try {
    // Generate AI summary
    const aiRes = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supervisorName, shiftType, notes,
        openIssues: openIssues ? [{ text: openIssues }] : [],
        wmsAlerts: wmsData ? wmsData.alerts : [],
        openTickets: ticketsData || []
      })
    });
    const aiData = await aiRes.json();
    const summary = aiData.summary;

    // Save handover record
    await fetch('/api/handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supervisorName, shiftType, notes,
        openIssues, priority, aiSummary: summary,
        wmsSnapshot: wmsData, ticketsSnapshot: ticketsData
      })
    });

    document.getElementById('ai-summary-text').textContent = summary;
    document.getElementById('loading-summary').style.display = 'none';
    document.getElementById('summary-content').style.display = 'block';
  } catch (err) {
    console.error(err);
    document.getElementById('loading-summary').innerHTML = '<p style="color:red">Error generating summary. Please try again.</p>';
  }
}
