// ── Dashboard JS (index.html) ──────────────────────────────────

// Update clock
function updateClock() {
  const el = document.getElementById('current-time');
  if (el) el.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Load shift data on page load
async function loadShiftData() {
  const data = await fetch('/api/current-shift').then(r => r.json());
  const { shift, metrics, exceptions, equipment_alerts } = data;

  // Shift banner
  document.getElementById('shift-label').textContent =
    `${shift.label}  |  ${shift.date}  |  ${shift.start} – ${shift.end}`;
  document.getElementById('shift-supervisor').textContent = shift.supervisor;

  // KPI cards
  document.getElementById('kpi-orders').textContent = metrics.orders_completed;
  document.getElementById('kpi-orders-sub').textContent =
    `Target: ${metrics.orders_target} (${Math.round(metrics.orders_completed / metrics.orders_target * 100)}%)`;
  document.getElementById('kpi-pick').textContent = metrics.pick_rate_actual + '%';
  document.getElementById('kpi-pick-sub').textContent = `Target: ${metrics.pick_rate_target}%`;
  document.getElementById('kpi-open').textContent = data.open_orders.length;

  const itCount = exceptions.filter(e => e.type === 'it').length;
  document.getElementById('kpi-it').textContent = itCount;

  // Exceptions table
  const tbody = document.getElementById('exceptions-body');
  tbody.innerHTML = exceptions.map(e => `
    <tr>
      <td>${e.id}</td>
      <td>${e.description}</td>
      <td>${e.zone}</td>
      <td>${e.started || '—'}</td>
      <td><span class="badge ${e.type === 'it' ? 'badge-it' : 'badge-ops'}">
        ${e.type === 'it' ? '🔧 IT' : '⚙️ Operations'}
      </span></td>
    </tr>
  `).join('');

  // Equipment alerts
  const eqList = document.getElementById('equipment-list');
  eqList.innerHTML = equipment_alerts.map(eq => `
    <li>
      <span class="badge ${eq.type === 'it' ? 'badge-it' : 'badge-ops'}">
        ${eq.type === 'it' ? '🔧 IT' : '⚙️ Ops'}
      </span>
      <strong>${eq.equipment}</strong> — ${eq.alert}
    </li>
  `).join('');
}

// Load past handovers
async function loadHandoverHistory() {
  const handovers = await fetch('/api/handovers').then(r => r.json());
  const list = document.getElementById('handover-history');

  if (!handovers.length) {
    list.innerHTML = '<li>No handovers yet – click "End Shift" to generate one.</li>';
    return;
  }

  list.innerHTML = handovers.map(h => {
    const date = new Date(h.created_at).toLocaleString();
    const ackStatus = h.fully_acknowledged
      ? '<span class="badge badge-done">✅ Acknowledged</span>'
      : '<span class="badge badge-pending">⏳ Pending</span>';
    return `<li>
      ${ackStatus}
      <a href="/handover.html?id=${h.id}">${h.shift.label} — ${date}</a>
    </li>`;
  }).join('');
}

// End shift — generate handover
async function endShift() {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-spinner').classList.remove('hidden');
  document.getElementById('modal-done').classList.add('hidden');

  const result = await fetch('/api/end-shift', { method: 'POST' }).then(r => r.json());

  document.getElementById('modal-spinner').classList.add('hidden');
  document.getElementById('modal-done').classList.remove('hidden');
  document.getElementById('modal-summary-text').textContent = result.handover.summary;
  document.getElementById('modal-open-btn').href = `/handover.html?id=${result.handover.id}`;

  loadHandoverHistory();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// Init
loadShiftData();
loadHandoverHistory();
