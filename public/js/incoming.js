window.addEventListener('DOMContentLoaded', loadReport);
let currentHandoverId = null;

async function loadReport() {
  try {
    const [handoverRes, wmsRes, ticketRes] = await Promise.all([
      fetch('/api/handover/latest').then(r => r.json()),
      fetch('/api/wms/status').then(r => r.json()),
      fetch('/api/tickets').then(r => r.json())
    ]);

    document.getElementById('loading-report').style.display = 'none';

    if (!handoverRes.success) {
      document.getElementById('no-handover').style.display = 'block';
      return;
    }

    document.getElementById('report-content').style.display = 'block';
    const h = handoverRes.handover;
    currentHandoverId = h.id;

    // Meta banner
    document.getElementById('out-supervisor').textContent = h.supervisorName || '—';
    document.getElementById('out-shift').textContent = h.shiftType || '—';
    document.getElementById('out-time').textContent = new Date(h.timestamp).toLocaleString();

    const pEl = document.getElementById('out-priority');
    pEl.textContent = h.priority || 'Normal';
    pEl.style.color = h.priority === 'Critical' ? '#DC2626' : h.priority === 'Elevated' ? '#F59E0B' : '#16A34A';

    // AI Summary
    document.getElementById('ai-summary-text').textContent = h.aiSummary || 'No AI summary available.';

    // Acknowledgment
    if (h.acknowledged) {
      document.getElementById('ack-section').innerHTML =
        `<span class="badge badge-resolved" style="font-size:.9rem;padding:.4rem 1rem">✅ Acknowledged by ${h.acknowledgedBy}</span>`;
    }

    // WMS
    const wms = wmsRes.data;
    document.getElementById('inc-pending').textContent = wms.metrics.orders_pending;
    document.getElementById('inc-acc').textContent = wms.metrics.pick_accuracy;

    document.getElementById('inc-wms-alerts').innerHTML = wms.alerts.map(a => `
      <div class="alert-item ${a.severity.toLowerCase()}">
        <div class="alert-icon">${a.severity === 'High' ? '🔴' : a.severity === 'Medium' ? '🟡' : '🟢'}</div>
        <div class="alert-text">${a.message}</div>
        <div class="alert-time">${a.time}</div>
      </div>`).join('');

    // Orders
    document.getElementById('inc-orders').innerHTML = wms.active_orders.map(o => `
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

    // Tickets
    const tickets = ticketRes.data;
    document.getElementById('inc-tickets').innerHTML = tickets.length === 0
      ? '<p style="color:var(--green)">✅ No open IT tickets.</p>'
      : tickets.map(t => `
        <div class="ticket-item">
          <div class="ticket-id">${t.id}</div>
          <div class="ticket-subject">${t.subject}</div>
          <div style="display:flex;gap:.4rem;margin:.3rem 0">
            <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
            <span class="badge badge-${t.status === 'Open' ? 'open' : 'progress'}">${t.status}</span>
          </div>
          <div class="ticket-meta">Assigned: ${t.assigned_to}</div>
        </div>`).join('');

  } catch (err) {
    console.error(err);
    document.getElementById('loading-report').innerHTML = '<p style="color:red;padding:2rem">Error loading report. Is the server running?</p>';
  }
}

async function acknowledge() {
  const name = prompt('Enter your name to acknowledge this handover:');
  if (!name) return;
  try {
    await fetch(`/api/handover/${currentHandoverId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supervisorName: name })
    });
    document.getElementById('ack-section').innerHTML =
      `<span class="badge badge-resolved" style="font-size:.9rem;padding:.4rem 1rem">✅ Acknowledged by ${name}</span>`;
    alert(`Handover acknowledged by ${name}. This has been recorded in the audit trail.`);
  } catch (err) {
    alert('Error acknowledging handover. Please try again.');
  }
}
