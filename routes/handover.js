const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '../data/handovers.json');

function readHandovers() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeHandovers(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Save a new handover
router.post('/', (req, res) => {
  const handovers = readHandovers();
  const newHandover = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...req.body
  };
  handovers.unshift(newHandover);
  writeHandovers(handovers);
  res.json({ success: true, handover: newHandover });
});

// Get latest handover
router.get('/latest', (req, res) => {
  const handovers = readHandovers();
  if (handovers.length === 0) {
    return res.json({ success: false, message: 'No handovers found' });
  }
  res.json({ success: true, handover: handovers[0] });
});

// Get all handovers
router.get('/', (req, res) => {
  const handovers = readHandovers();
  res.json({ success: true, handovers });
});

// Acknowledge handover
router.post('/:id/acknowledge', (req, res) => {
  const handovers = readHandovers();
  const idx = handovers.findIndex(h => h.id === req.params.id);
  if (idx === -1) return res.json({ success: false, message: 'Not found' });
  handovers[idx].acknowledged = true;
  handovers[idx].acknowledgedBy = req.body.supervisorName;
  handovers[idx].acknowledgedAt = new Date().toISOString();
  writeHandovers(handovers);
  res.json({ success: true, handover: handovers[idx] });
});

module.exports = router;
