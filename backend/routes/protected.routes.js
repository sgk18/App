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

// 3. Google API Protected Endpoints
// We can move the `/auth/google/events` route here for cleaner structure
router.use('/google', require('./google.protected.routes'));

module.exports = router;
