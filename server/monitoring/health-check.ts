/**
 * TerraFusion Health Check and Monitoring System
 * Provides endpoints and utilities for monitoring system health
 */

import os from 'os';
import { pool } from '../db';
import type { Express, Request, Response } from 'express';

// System metrics collection
const collectSystemMetrics = () => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
    },
    cpu: {
      loadAvg: os.loadavg(),
      cores: os.cpus().length
    },
    network: {
      interfaces: Object.keys(os.networkInterfaces()).length
    },
    process: {
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    }
  };

  return metrics;
};

// Database health check
const checkDatabaseHealth = async () => {
  const startTime = Date.now();
  try {
    // Simple query to check connection
    const result = await pool.query('SELECT NOW()');
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: result.rows[0].now
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      responseTime: `${Date.now() - startTime}ms`,
      error: error.message
    };
  }
};

// WebSocket server health check
const checkWebSocketHealth = (wss: any) => {
  if (!wss) {
    return {
      status: 'unknown',
      error: 'WebSocket server not available'
    };
  }

  return {
    status: 'healthy',
    connections: wss.clients ? wss.clients.size : 0,
    listening: !!wss.address
  };
};

// Overall system health check
const getSystemHealth = async (wss: any) => {
  const dbHealth = await checkDatabaseHealth();
  const wsHealth = checkWebSocketHealth(wss);
  const systemMetrics = collectSystemMetrics();

  // Determine overall status
  const isHealthy = dbHealth.status === 'healthy' && wsHealth.status === 'healthy';

  return {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    components: {
      database: dbHealth,
      webSocketServer: wsHealth
    },
    metrics: systemMetrics
  };
};

// Register health check endpoints with Express
const registerHealthRoutes = (app: Express, wss: any) => {
  // Basic health endpoint for load balancers
  app.get('/health', async (req: Request, res: Response) => {
    try {
      const dbCheck = await checkDatabaseHealth();
      res.status(dbCheck.status === 'healthy' ? 200 : 503)
        .json({ status: dbCheck.status === 'healthy' ? 'ok' : 'error' });
    } catch (error: any) {
      res.status(500).json({ status: 'error', error: error.message });
    }
  });

  // Detailed health endpoint for monitoring systems
  app.get('/health/details', async (req: Request, res: Response) => {
    try {
      const health = await getSystemHealth(wss);
      res.status(health.status === 'healthy' ? 200 : 207)
        .json(health);
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error', 
        error: error.message,
        timestamp: new Date().toISOString() 
      });
    }
  });

  // Metrics endpoint for monitoring systems
  app.get('/metrics', (req: Request, res: Response) => {
    try {
      const metrics = collectSystemMetrics();
      res.status(200).json(metrics);
    } catch (error: any) {
      res.status(500).json({ 
        status: 'error', 
        error: error.message 
      });
    }
  });

  console.log('Health check routes registered');
};

export {
  registerHealthRoutes,
  getSystemHealth,
  checkDatabaseHealth,
  checkWebSocketHealth,
  collectSystemMetrics
};