/**
 * Initialize Database Storage
 * 
 * This module initializes the database storage implementation
 * and sets it as the active storage mechanism for the application.
 */

import { db, checkConnection } from './db';
import { DatabaseStorage } from './DatabaseStorage';
import { users, properties } from '@shared/schema';

/**
 * Initialize the database schema and storage
 */
export async function initDatabaseStorage() {
  try {
    console.log('Initializing database storage...');
    
    // Check database connection
    const isConnected = await checkConnection();
    if (!isConnected) {
      console.error('Failed to connect to database');
      return false;
    }
    
    console.log('Database connection successful');
    
    // Create a new database storage instance
    const databaseStorage = new DatabaseStorage();
    
    // Verify basic database operations
    try {
      // Check if users table exists and is accessible
      await db.select().from(users).limit(1);
      console.log('Users table accessible');
      
      // Check if properties table exists and is accessible
      await db.select().from(properties).limit(1);
      console.log('Properties table accessible');
    } catch (error) {
      console.error('Error accessing database tables:', error);
      console.log('You may need to run `npm run db:push` to create the tables');
      return false;
    }
    
    console.log('Database storage initialized successfully');
    return databaseStorage;
  } catch (error) {
    console.error('Error initializing database storage:', error);
    return false;
  }
}

// Export the initialization function
export default initDatabaseStorage;