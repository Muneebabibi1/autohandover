// ── Handover View JS (handover.html) ─────────────────────────────

const params = new URLSearchParams(window.location.search);
const handoverId = params.get('id');

let currentHandover = null;

async function loadHandover() {
  if (!handoverId) {
    document.getElementById('ho-summary').textContent = 'No handover ID provided.';
    return;
  }

  currentHandover = await fetch(`/api/handovers/${handoverId}`).then(r => r.json());
  const h = currentHandover;

  // Banner
  document.getElementById('ho-shift-label').textContent =
    `${h.shift.label}  |  ${h.shift.date}  |  ${h.shift.start} – ${h.shift.end}`;
  document.getElementById('ho-supervisor').textContent = h.shift.supervisor;

  // Summary
  document.getElementById('ho-summary').textContent = h.summary;

  // Mini KPIs
  document.getElementById('ho-orders').textContent =
    `${h.metrics.orders_completed} / ${h.metrics.orders_target}`;
  document.getElementById('ho-pick').textContent = h.metrics.pick_rate_actual + '%';
  document.getElementById('ho-open').textContent =
    h.priority_tasks.filter(t => t.sla_deadline).length;

  renderTaskList();
  updateAckStatus();
}

function renderTaskList() {
  const container = document.getElementById('task-list');
  container.innerHTML = '';

  currentHandover.priority_tasks.forEach(task => {
    const isIT = task.type === 'it';
    const acked = task.acknowledged;
    const ticketRaised = task.it_ticket_raised;

    const card = document.createElement('div');
    card.className = `task-card priority-${task.type} ${acked ? 'is-acknowledged' : ''}`;
    card.id = `task-${task.id}`;

    const metaParts = [
      `<span class="badge ${isIT ? 'badge-it' : 'badge-ops'}">${isIT ? '🔧 IT Issue' : '⚙️ Operations'}</span>`,
      task.zone ? `Zone: ${task.zone}` : '',
      task.age_minutes ? `Open for ${task.age_minutes} min` : '',
      task.sla_deadline ? `SLA: ${task.sla_deadline}` : '',
      acked ? `✅ Acknowledged by ${task.acknowledged_by} at ${new Date(task.acknowledged_at).toLocaleTimeString()}` : ''
    ].filter(Boolean);

    const actionsHTML = acked
      ? `<span class="badge badge-done">✅ Done</span>`
      : `
          ${isIT && !ticketRaised ? `<button class="btn btn-it" onclick="raiseITTicket('${task.id}')">🎫 Raise IT Ticket</button>` : ''}
          ${ticketRaised ? `<span class="ticket-badge">🎫 Ticket #${task.it_ticket_number}</span>` : ''}
          <button class="btn btn-ack" onclick="acknowledgeTask('${task.id}')">✅ Acknowledge</button>
        `;

    card.innerHTML = `
      <div style="font-size:1.4rem; margin-top:2px;">${isIT ? '🔧' : '⚙️'}</div>
      <div class="task-body">
        <div class="task-desc">${task.description}</div>
        <div class="task-meta">${metaParts.join(' &nbsp;|&nbsp; ')}</div>
        <div class="task-actions">${actionsHTML}</div>
      </div>
    `;

    container.appendChild(card);
  });
}

function updateAckStatus() {
  const allDone = currentHandover.priority_tasks.every(t => t.acknowledged);
  const badge = document.getElementById('ack-status-badge');
  const ackAllBtn = document.getElementById('ack-all-btn');
  const ackAllMsg = document.getElementById('ack-all-msg');

  if (allDone) {
    badge.innerHTML = '<span class="badge badge-done">✅ Fully Acknowledged</span>';
    ackAllBtn.classList.add('hidden');
    ackAllMsg.classList.remove('hidden');
  } else {
    const total = currentHandover.priority_tasks.length;
    const done = currentHandover.priority_tasks.filter(t => t.acknowledged).length;
    badge.innerHTML = `<span class="badge badge-pending">⏳ ${done}/${total} acknowledged</span>`;
  }
}

function getSupervisorName() {
  const name = document.getElementById('incoming-supervisor-name').value.trim();
  if (!name) {
    alert('Please enter your name before acknowledging.');
    document.getElementById('incoming-supervisor-name').focus();
    return null;
  }
  return name;
}

async function acknowledgeTask(taskId) {
  const name = getSupervisorName();
  if (!name) return;

  const res = await fetch('/api/acknowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handover_id: handoverId, task_id: taskId, supervisor_name: name })
  }).then(r => r.json());

  if (res.success) {
    // Update local copy
    const task = currentHandover.priority_tasks.find(t => t.id === taskId);
    if (task) {
      task.acknowledged = true;
      task.acknowledged_by = res.task.acknowledged_by;
      task.acknowledged_at = res.task.acknowledged_at;
    }
    currentHandover.fully_acknowledged = res.fully_acknowledged;
    renderTaskList();
    updateAckStatus();
  }
}

async function raiseITTicket(taskId) {
  const task = currentHandover.priority_tasks.find(t => t.id === taskId);
  if (!task) return;

  const btn = document.querySelector(`#task-${taskId} .btn-it`);
  if (btn) { btn.disabled = true; btn.textContent = 'Creating ticket…'; }

  const res = await fetch('/api/raise-it-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issue_id: taskId,
      description: task.description,
      zone: task.zone,
      handover_id: handoverId
    })
  }).then(r => r.json());

  if (res.success) {
    alert(`✅ ${res.message}`);
    // Update local copy
    task.it_ticket_raised = true;
    task.it_ticket_number = res.ticket_number;
    renderTaskList();
  } else {
    alert('❌ Failed to create ticket. Check the console.');
    if (btn) { btn.disabled = false; btn.textContent = '🎫 Raise IT Ticket'; }
  }
}

async function acknowledgeAll() {
  const name = getSupervisorName();
  if (!name) return;

  const unacked = currentHandover.priority_tasks.filter(t => !t.acknowledged);
  for (const task of unacked) {
    await fetch('/api/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handover_id: handoverId, task_id: task.id, supervisor_name: name })
    });
    task.acknowledged = true;
    task.acknowledged_by = name;
    task.acknowledged_at = new Date().toISOString();
  }
  currentHandover.fully_acknowledged = true;
  renderTaskList();
  updateAckStatus();
}

// Init
loadHandover();
