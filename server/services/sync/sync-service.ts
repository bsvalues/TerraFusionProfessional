/**
 * TerraFusionPro Synchronization Service
 * Manages data synchronization between mobile devices and web platform
 */

import { Server as WebSocketServer } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';
import * as Y from 'yjs';
import { encoding } from 'lib0';
import * as syncedStore from '@syncedstore/core';

// Connection tracking
interface ClientConnection {
  id: string;
  deviceId: string;
  userId: number;
  lastActivity: Date;
  deviceType: 'mobile' | 'web' | 'unknown';
  isOnline: boolean;
}

// Sync state types
interface SyncState {
  lastSyncTimestamp: number;
  syncVersion: number;
  deviceId: string;
  userId: number;
  pendingChanges: Array<SyncChange>;
  conflictResolution: 'server-wins' | 'client-wins' | 'manual';
}

interface SyncChange {
  id: string;
  entityType: string;
  entityId: string | number;
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
  data: any;
  status: 'pending' | 'applied' | 'conflict' | 'error';
  conflictReason?: string;
}

export class SyncService {
  private wss: WebSocketServer;
  private connections: Map<string, ClientConnection>;
  private redisClient: any;
  private syncStates: Map<string, SyncState>;
  
  constructor(server: any) {
    // Initialize WebSocket server
    this.wss = new WebSocketServer({ 
      server,
      path: '/sync'
    });
    
    this.connections = new Map();
    this.syncStates = new Map();
    
    // Setup Redis client for sync state management
    this.initializeRedis();
    
    // Register WebSocket handlers
    this.registerHandlers();
    
    // Set up heartbeat interval
    setInterval(() => this.checkConnections(), 30000);
    
    console.log('Sync service initialized');
  }
  
  private async initializeRedis() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redisClient.connect();
      console.log('Redis client connected for sync service');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }
  
  private registerHandlers() {
    this.wss.on('connection', (ws, req) => {
      // Generate unique connection ID
      const connectionId = uuidv4();
      
      // Extract user information from request
      // In production, this would include authentication
      const queryParams = new URLSearchParams(req.url?.split('?')[1] || '');
      const deviceId = queryParams.get('deviceId') || uuidv4();
      const userId = parseInt(queryParams.get('userId') || '0', 10);
      const deviceType = (queryParams.get('deviceType') || 'unknown') as 'mobile' | 'web' | 'unknown';
      
      if (!userId) {
        ws.close(4000, 'User ID is required');
        return;
      }
      
      // Register connection
      this.connections.set(connectionId, {
        id: connectionId,
        deviceId,
        userId,
        lastActivity: new Date(),
        deviceType,
        isOnline: true
      });
      
      console.log(`New ${deviceType} connection: ${connectionId} for user ${userId}`);
      
      // Initialize sync state if needed
      this.initSyncState(userId, deviceId);
      
      // Handle incoming messages
      ws.on('message', async (message) => {
        try {
          const connection = this.connections.get(connectionId);
          if (!connection) return;
          
          // Update activity timestamp
          connection.lastActivity = new Date();
          
          // Parse message
          const data = JSON.parse(message.toString());
          
          // Process message based on type
          switch (data.type) {
            case 'sync_request':
              await this.handleSyncRequest(ws, connectionId, data);
              break;
            case 'sync_update':
              await this.handleSyncUpdate(ws, connectionId, data);
              break;
            case 'conflict_resolution':
              await this.handleConflictResolution(ws, connectionId, data);
              break;
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
            default:
              console.warn(`Unknown message type: ${data.type}`);
          }
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Failed to process message',
            timestamp: Date.now()
          }));
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        console.log(`Connection closed: ${connectionId}`);
        const connection = this.connections.get(connectionId);
        if (connection) {
          connection.isOnline = false;
        }
        
        // Clean up after a delay (to allow for reconnection)
        setTimeout(() => {
          if (this.connections.has(connectionId) && !this.connections.get(connectionId)!.isOnline) {
            this.connections.delete(connectionId);
          }
        }, 60000);
      });
      
      // Send initial sync state
      this.sendSyncState(ws, userId, deviceId);
    });
  }
  
  private async initSyncState(userId: number, deviceId: string): Promise<void> {
    const key = `${userId}:${deviceId}`;
    
    // Check if sync state exists in Redis
    const existingState = await this.redisClient.get(`syncstate:${key}`);
    
    if (existingState) {
      // Load from Redis
      this.syncStates.set(key, JSON.parse(existingState));
    } else {
      // Create new sync state
      const newState: SyncState = {
        lastSyncTimestamp: Date.now(),
        syncVersion: 1,
        deviceId,
        userId,
        pendingChanges: [],
        conflictResolution: 'server-wins'
      };
      
      this.syncStates.set(key, newState);
      
      // Save to Redis
      await this.redisClient.set(`syncstate:${key}`, JSON.stringify(newState));
    }
  }
  
  private async sendSyncState(ws: any, userId: number, deviceId: string): Promise<void> {
    const key = `${userId}:${deviceId}`;
    const syncState = this.syncStates.get(key);
    
    if (!syncState) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Sync state not found',
        timestamp: Date.now()
      }));
      return;
    }
    
    ws.send(JSON.stringify({
      type: 'sync_state',
      timestamp: Date.now(),
      data: {
        lastSync: syncState.lastSyncTimestamp,
        version: syncState.syncVersion,
        pendingChanges: syncState.pendingChanges.length
      }
    }));
  }
  
  private async handleSyncRequest(ws: any, connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    const { userId, deviceId } = connection;
    const key = `${userId}:${deviceId}`;
    
    // Get device's last sync timestamp
    const deviceLastSync = data.lastSyncTimestamp || 0;
    
    try {
      // Fetch changes since last sync
      const changes = await this.getChangesSinceTimestamp(userId, deviceLastSync);
      
      // Send changes to client
      ws.send(JSON.stringify({
        type: 'sync_changes',
        timestamp: Date.now(),
        data: {
          changes,
          syncVersion: this.syncStates.get(key)?.syncVersion || 1
        }
      }));
      
    } catch (error) {
      console.error('Error handling sync request:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process sync request',
        timestamp: Date.now()
      }));
    }
  }
  
  private async handleSyncUpdate(ws: any, connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    const { userId, deviceId } = connection;
    const key = `${userId}:${deviceId}`;
    
    try {
      // Process incoming changes
      const { changes } = data;
      const syncState = this.syncStates.get(key);
      
      if (!syncState) {
        throw new Error('Sync state not found');
      }
      
      // Apply changes and detect conflicts
      const results = await this.processChanges(userId, changes, syncState);
      
      // Update sync state
      syncState.lastSyncTimestamp = Date.now();
      syncState.syncVersion += 1;
      
      // Save updated sync state
      await this.redisClient.set(`syncstate:${key}`, JSON.stringify(syncState));
      
      // Send results to client
      ws.send(JSON.stringify({
        type: 'sync_update_response',
        timestamp: Date.now(),
        data: {
          results,
          syncVersion: syncState.syncVersion
        }
      }));
      
    } catch (error) {
      console.error('Error handling sync update:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process sync update',
        timestamp: Date.now()
      }));
    }
  }
  
  private async handleConflictResolution(ws: any, connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    const { userId, deviceId } = connection;
    const key = `${userId}:${deviceId}`;
    
    try {
      // Process conflict resolution decisions
      const { resolutions } = data;
      const syncState = this.syncStates.get(key);
      
      if (!syncState) {
        throw new Error('Sync state not found');
      }
      
      // Apply resolutions
      const results = await this.applyResolutions(userId, resolutions, syncState);
      
      // Update sync state
      syncState.lastSyncTimestamp = Date.now();
      syncState.syncVersion += 1;
      
      // Save updated sync state
      await this.redisClient.set(`syncstate:${key}`, JSON.stringify(syncState));
      
      // Send results to client
      ws.send(JSON.stringify({
        type: 'conflict_resolution_response',
        timestamp: Date.now(),
        data: {
          results,
          syncVersion: syncState.syncVersion
        }
      }));
      
    } catch (error) {
      console.error('Error handling conflict resolution:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process conflict resolution',
        timestamp: Date.now()
      }));
    }
  }
  
  private async getChangesSinceTimestamp(userId: number, timestamp: number): Promise<any[]> {
    // In a real implementation, this would query the database for changes
    // For this implementation, we're mocking the response
    return [
      {
        id: uuidv4(),
        entityType: 'property',
        entityId: 1,
        operation: 'update',
        timestamp: Date.now() - 60000,
        data: { address: '123 Updated St', city: 'New City' }
      },
      {
        id: uuidv4(),
        entityType: 'report',
        entityId: 2,
        operation: 'create',
        timestamp: Date.now() - 30000,
        data: { title: 'New Report', date: new Date().toISOString() }
      }
    ];
  }
  
  private async processChanges(userId: number, changes: any[], syncState: SyncState): Promise<any[]> {
    // In a real implementation, this would apply changes to the database
    // and detect conflicts with server-side changes
    
    const results = [];
    
    for (const change of changes) {
      // Check for conflicts
      const conflictDetected = Math.random() > 0.8; // Simulate occasional conflicts
      
      if (conflictDetected) {
        results.push({
          id: change.id,
          status: 'conflict',
          conflictReason: 'Entity was modified on server',
          serverData: {
            // Simulated server data that conflicts
            timestamp: Date.now() - 10000,
            data: { ...change.data, serverModified: true }
          }
        });
      } else {
        results.push({
          id: change.id,
          status: 'applied',
          timestamp: Date.now()
        });
      }
    }
    
    return results;
  }
  
  private async applyResolutions(userId: number, resolutions: any[], syncState: SyncState): Promise<any[]> {
    // In a real implementation, this would apply conflict resolutions to the database
    
    const results = [];
    
    for (const resolution of resolutions) {
      results.push({
        id: resolution.id,
        status: 'applied',
        timestamp: Date.now()
      });
    }
    
    return results;
  }
  
  private checkConnections(): void {
    const now = new Date();
    
    this.connections.forEach((connection, id) => {
      if (connection.isOnline) {
        // Check if connection has been inactive for more than 2 minutes
        const inactiveTime = now.getTime() - connection.lastActivity.getTime();
        if (inactiveTime > 120000) {
          console.log(`Connection ${id} timed out due to inactivity`);
          connection.isOnline = false;
          
          // Clean up
          this.connections.delete(id);
        }
      }
    });
  }
  
  public getConnectionCount(): number {
    let count = 0;
    this.connections.forEach(connection => {
      if (connection.isOnline) {
        count++;
      }
    });
    return count;
  }
  
  public getActiveUserCount(): number {
    const activeUsers = new Set();
    this.connections.forEach(connection => {
      if (connection.isOnline) {
        activeUsers.add(connection.userId);
      }
    });
    return activeUsers.size;
  }
}

export default SyncService;
