/**
 * Routes Index
 * 
 * This file combines all API routes and exports them as a single router
 */

const express = require('express');
const propertyHistoryRoutes = require('./property-history-routes');
const auditRoutes = require('./audit-routes');
const databaseStatusRoutes = require('./database-status-routes');

const router = express.Router();

// Register all API routes
router.use('/property-history', propertyHistoryRoutes);
router.use('/audit', auditRoutes);
router.use('/database', databaseStatusRoutes);

module.exports = router;