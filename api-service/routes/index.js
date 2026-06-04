const express = require('express');
const router = express.Router();

router.use('/stats', require('./stats'));
router.use('/alerts', require('./alerts'));
router.use('/reports', require('./reports'));

module.exports = router;