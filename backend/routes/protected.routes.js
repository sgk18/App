const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

/**
 * ==========================================
 * PROTECTED ROUTES HUB
 * ==========================================
 * All routes mounted here will automatically 
 * require a valid JWT token. 
 */

// Apply the authentication middleware to everything in this router
router.use(verifyToken);

// 1. Teachers API ("/api/teachers")
router.use('/teachers', require('./teachers'));

// 2. Deadlines API ("/api/deadlines")
router.use('/deadlines', require('./deadlines'));

// 3. Calendar API ("/api/calendar")
// Handles Google Calendar fetching, selection, and events.
router.use('/calendar', require('./calendar.routes'));

module.exports = router;
