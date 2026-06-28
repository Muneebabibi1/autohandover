const express = require('express');
const router = express.Router();
const ticketsData = require('../data/tickets_mock.json');

router.get('/', (req, res) => {
  const open = ticketsData.tickets.filter(t => t.status !== 'Resolved');
  res.json({ success: true, data: open, all: ticketsData.tickets });
});

module.exports = router;
