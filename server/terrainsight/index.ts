/**
 * Main Express Server
 * 
 * This is the main entry point for the backend server,
 * which handles API routes and serves the frontend.
 */

import express, { Express } from 'express';
import { createServer } from 'http';
import path from 'path';
import { registerRoutes } from './routes';
import { registerAgentRoutes } from './agent-api';
import { setupVite, log } from './vite';
import { initializeAgentHealthRecoverySystem } from './agent-health-recovery-init.js';

// Create Express app
const app: Express = express();
const server = createServer(app);

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
registerAgentRoutes(app);

// Development environment setup with Vite
async function startServer() {
  try {
    // Register API routes
    await registerRoutes(app);
    
    // Setup Vite for development
    await setupVite(app, server);
    
    // Set port
    const PORT = parseInt(process.env.PORT || '5000');
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      log(`Server started on port ${PORT}`);
      
      // Initialize the automatic agent health recovery system
      const cleanupHealthRecovery = initializeAgentHealthRecoverySystem();
      
      // Cleanup on server shutdown
      process.on('SIGTERM', () => {
        log('Server shutting down, cleaning up agent health recovery system');
        cleanupHealthRecovery();
      });
      
      process.on('SIGINT', () => {
        log('Server interrupted, cleaning up agent health recovery system');
        cleanupHealthRecovery();
      });
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;