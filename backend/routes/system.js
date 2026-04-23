const router = require('express').Router();

/**
 * GET /api/system
 * Returns mock system stats — CPU usage randomizes ±5% for realism
 */
router.get('/', (req, res) => {
  const baseCpu = 34;
  const variance = Math.floor((Math.random() - 0.5) * 10); // ±5
  const cpuUsage = Math.min(100, Math.max(0, baseCpu + variance));

  res.json({
    cpu: {
      usage: cpuUsage,
      cores: 8,
      model: 'Apple M2'
    },
    ram: {
      used: parseFloat((6.2 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      total: 16,
      unit: 'GB'
    },
    battery: {
      percent: 78,
      charging: false
    },
    uptime: '2h 34m',
    os: 'macOS Sequoia',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
