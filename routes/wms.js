const express = require('express');
const router = express.Router();
const wmsData = require('../data/wms_mock.json');

router.get('/status', (req, res) => {
  res.json({ success: true, data: wmsData });
});

module.exports = router;
