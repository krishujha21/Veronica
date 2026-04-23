const router = require('express').Router();

/**
 * GET /api/weather
 * Returns mock weather data for Chennai
 */
router.get('/', (req, res) => {
  res.json({
    city: 'Chennai',
    temp: 32,
    feels_like: 36,
    condition: 'Partly Cloudy',
    humidity: 78,
    icon: 'partly_cloudy',
    forecast: [
      { day: 'Mon', high: 33, low: 26, condition: 'Sunny' },
      { day: 'Tue', high: 31, low: 25, condition: 'Rain' },
      { day: 'Wed', high: 30, low: 24, condition: 'Cloudy' }
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
