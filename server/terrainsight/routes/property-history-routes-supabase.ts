/**
 * Property History Routes with Supabase Integration
 * 
 * API routes for property history management using Supabase
 */

import { Express, Request, Response } from 'express';
import { propertyHistorySupabaseService } from '../services/property-history-supabase-service';
import { HistoricalValue, PropertyHistoryRecord } from '../../shared/interfaces/PropertyHistory';
import { z } from 'zod';
import { auditSystemAction, AuditAction } from '../../shared/agent/AuditLogger';
import { isSupabaseConfigured, testSupabaseConnection, initializeSupabaseSchema, supabase } from '../services/supabase-client';

/**
 * Handle errors in API routes
 */
function handleError(error: unknown, res: Response) {
  console.error('API error:', error);
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors
    });
  }
  
  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'An unknown error occurred'
  });
}

/**
 * Register property history routes with Supabase integration
 */
export function registerPropertyHistorySupabaseRoutes(app: Express) {
  // Get property history
  app.get('/api/v2/properties/:id/history', async (req: Request, res: Response) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Supabase integration is not available'
        });
      }
      
      const propertyId = req.params.id;
      
      const historyRecord = await propertyHistorySupabaseService.getPropertyHistory(propertyId);
      
      // Audit this access
      await auditSystemAction(
        'API',
        AuditAction.READ,
        { 
          endpoint: '/api/v2/properties/:id/history',
          propertyId
        },
        { ip: req.ip }
      );
      
      res.json({
        success: true,
        history: historyRecord,
        source: 'supabase'
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Get formatted property history for visualization
  app.get('/api/v2/properties/:id/history/formatted', async (req: Request, res: Response) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Supabase integration is not available'
        });
      }
      
      const propertyId = req.params.id;
      
      const formattedHistory = await propertyHistorySupabaseService.getFormattedPropertyHistory(propertyId);
      
      if (!formattedHistory) {
        return res.status(404).json({
          success: false,
          message: 'No historical data available for this property'
        });
      }
      
      // Audit this access
      await auditSystemAction(
        'API',
        AuditAction.READ,
        { 
          endpoint: '/api/v2/properties/:id/history/formatted',
          propertyId
        },
        { ip: req.ip }
      );
      
      res.json({
        success: true,
        history: formattedHistory,
        source: 'supabase'
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Update a year's historical value
  app.post('/api/v2/properties/:id/history/:year', async (req: Request, res: Response) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Supabase integration is not available'
        });
      }
      
      const propertyId = req.params.id;
      const year = req.params.year;
      
      // Define schema for historical value
      const historicalValueSchema = z.object({
        value: z.number().positive(),
        source: z.string().optional(),
        notes: z.string().optional(),
        confidence: z.number().min(0).max(100).optional()
      });
      
      // Validate request body
      const validatedValue = historicalValueSchema.parse(req.body);
      
      // Set timestamp to current time
      const valueToSave: HistoricalValue = {
        ...validatedValue,
        timestamp: new Date().toISOString()
      };
      
      // Get author (would come from authentication in a real system)
      const author = 'API User';
      
      // Update the historical value
      const result = await propertyHistorySupabaseService.updatePropertyHistoricalValue(
        propertyId,
        year,
        valueToSave,
        author
      );
      
      res.json({
        success: true,
        message: 'Historical value updated',
        change: result,
        source: 'supabase'
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Delete a year's historical value
  app.delete('/api/v2/properties/:id/history/:year', async (req: Request, res: Response) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Supabase integration is not available'
        });
      }
      
      const propertyId = req.params.id;
      const year = req.params.year;
      
      // Get author (would come from authentication in a real system)
      const author = 'API User';
      
      // Delete the historical value
      const success = await propertyHistorySupabaseService.deletePropertyHistoricalValue(
        propertyId,
        year,
        author
      );
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Historical value not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Historical value deleted',
        source: 'supabase'
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Import bulk history data
  app.post('/api/v2/properties/:id/history/import', async (req: Request, res: Response) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Supabase integration is not available'
        });
      }
      
      const propertyId = req.params.id;
      
      // Check for override flag
      const overwrite = req.query.overwrite === 'true';
      
      // Define schema for request body
      const importSchema = z.object({
        history: z.record(
          z.string().regex(/^\d{4}$/), // Year as key in format YYYY
          z.object({
            value: z.number().positive(),
            source: z.string().optional(),
            notes: z.string().optional(),
            confidence: z.number().min(0).max(100).optional()
          })
        )
      });
      
      // Validate request body
      const validatedData = importSchema.parse(req.body);
      
      // Set timestamps for all records
      const historyToImport: PropertyHistoryRecord = {};
      const timestamp = new Date().toISOString();
      
      for (const [year, value] of Object.entries(validatedData.history)) {
        historyToImport[year] = {
          ...value,
          timestamp
        };
      }
      
      // Get author (would come from authentication in a real system)
      const author = 'API User';
      
      // Import the history
      const success = await propertyHistorySupabaseService.importPropertyHistory(
        propertyId,
        historyToImport,
        author,
        overwrite
      );
      
      res.json({
        success,
        message: 'Historical values imported',
        recordCount: Object.keys(historyToImport).length,
        overwrite,
        source: 'supabase'
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Calculate value trend between years
  app.get('/api/v2/properties/:id/history/trend', async (req: Request, res: Response) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Supabase integration is not available'
        });
      }
      
      const propertyId = req.params.id;
      
      // Get start and end years from query params
      const startYear = req.query.startYear as string;
      const endYear = req.query.endYear as string;
      
      // Validate years
      if (!startYear || !endYear || !/^\d{4}$/.test(startYear) || !/^\d{4}$/.test(endYear)) {
        return res.status(400).json({
          success: false,
          message: 'Valid start and end years are required (format: YYYY)'
        });
      }
      
      // Calculate trend
      const trend = await propertyHistorySupabaseService.calculatePropertyValueTrend(
        propertyId,
        startYear,
        endYear
      );
      
      if (!trend) {
        return res.status(404).json({
          success: false,
          message: 'Insufficient historical data to calculate trend'
        });
      }
      
      // Audit this access
      await auditSystemAction(
        'API',
        AuditAction.READ,
        { 
          endpoint: '/api/v2/properties/:id/history/trend',
          propertyId,
          startYear,
          endYear
        },
        { ip: req.ip }
      );
      
      res.json({
        success: true,
        trend,
        source: 'supabase'
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Fill missing years using interpolation
  app.post('/api/v2/properties/:id/history/fill-gaps', async (req: Request, res: Response) => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Supabase integration is not available'
        });
      }
      
      const propertyId = req.params.id;
      
      // Get author (would come from authentication in a real system)
      const author = 'API User';
      
      // Fill missing years
      const result = await propertyHistorySupabaseService.fillMissingHistoricalYears(
        propertyId,
        author
      );
      
      res.json({
        success: result.success,
        message: result.success 
          ? `Filled ${result.yearsFilled} missing years` 
          : 'No missing years could be filled',
        yearsFilled: result.yearsFilled,
        source: 'supabase'
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Test endpoint for validating Supabase integration
  app.post('/api/v2/supabase/test', async (req: Request, res: Response) => {
    try {
      // Check if Supabase client is configured 
      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          message: 'Supabase integration is not available - missing environment variables',
          environment: {
            url: process.env.SUPABASE_URL ? 'set' : 'missing',
            key: process.env.SUPABASE_KEY ? 'set' : 'missing'
          }
        });
      }
      
      // Test the connection
      const connectionTest = await testSupabaseConnection();
      
      if (!connectionTest) {
        return res.status(503).json({
          success: false,
          message: 'Supabase connection test failed',
          environment: {
            url: process.env.SUPABASE_URL ? 'set' : 'missing',
            key: process.env.SUPABASE_KEY ? 'set' : 'missing'
          }
        });
      }
      
      // Create a test property history record
      const propertyId = 'test-' + Date.now();
      const currentYear = new Date().getFullYear().toString();
      
      try {
        // Try to insert a test record
        const result = await propertyHistorySupabaseService.updatePropertyHistoricalValue(
          propertyId,
          currentYear,
          {
            value: 100000,
            source: 'test',
            notes: 'Test record created via API test endpoint',
            confidence: 100,
            timestamp: new Date().toISOString()
          },
          'API Test'
        );
        
        // Try to retrieve the record
        const history = await propertyHistorySupabaseService.getPropertyHistory(propertyId);
        
        // Audit this test operation
        await auditSystemAction(
          'API',
          AuditAction.CREATE,
          { 
            endpoint: '/api/v2/supabase/test',
            propertyId,
            year: currentYear,
            result: 'success'
          }
        );
        
        return res.json({
          success: true,
          message: 'Supabase integration test passed successfully',
          testRecord: {
            propertyId,
            year: currentYear,
            writeResult: result,
            readResult: history
          }
        });
      } catch (testError) {
        // Audit this test failure
        await auditSystemAction(
          'API',
          AuditAction.CREATE,
          { 
            endpoint: '/api/v2/supabase/test',
            propertyId,
            year: currentYear,
            result: 'error',
            error: testError instanceof Error ? testError.message : String(testError)
          }
        );
        
        return res.status(500).json({
          success: false,
          message: 'Supabase integration test failed during data operations',
          error: testError instanceof Error ? testError.message : String(testError)
        });
      }
    } catch (error) {
      handleError(error, res);
    }
  });

  // Health check endpoint for Supabase integration
  app.get('/api/v2/supabase/status', async (req: Request, res: Response) => {
    try {
      // Check if Supabase client is configured 
      const isConfigured = isSupabaseConfigured();
      
      if (!isConfigured) {
        return res.json({ 
          success: true,
          status: 'not_configured',
          message: 'Supabase environment variables are not configured',
          details: {
            url: process.env.SUPABASE_URL ? 'set' : 'missing',
            key: process.env.SUPABASE_KEY ? 'set' : 'missing'
          }
        });
      }
      
      // Test the connection
      const isConnected = await testSupabaseConnection();
      
      // Try to create the database schema if connected
      let schemaInitialized = false;
      if (isConnected) {
        try {
          await initializeSupabaseSchema();
          schemaInitialized = true;
        } catch (err) {
          console.error('Schema initialization error:', err);
        }
      }
      
      // Check for the property_history_records table directly
      let tableExists = false;
      let tableData: any[] = [];
      let tableError: string | null = null;
      
      if (isConnected) {
        try {
          // Try to check if the property_history_records table exists
          // by directly querying it
          const result = await supabase!
            .from('property_history_records')
            .select('property_id')
            .limit(5);
          
          tableExists = !result.error && !!result.data;
          
          if (tableExists && result.data) {
            tableData = result.data;
          } else if (result.error) {
            tableError = result.error.message || result.error.code || 'Unknown error';
            console.error('Table access error:', result.error);
          }
        } catch (err) {
          console.error('Table check error:', err);
          tableError = err instanceof Error ? err.message : String(err);
        }
      }
      
      // Log the status check result
      await auditSystemAction(
        'API',
        AuditAction.READ,
        { 
          endpoint: '/api/v2/supabase/status',
          status: isConnected ? 'connected' : 'disconnected',
          tableExists
        }
      );
      
      // Generate SQL script for table creation if needed
      let createTableSQL = '';
      
      // Always provide the SQL script, regardless of connection status
      // This ensures it's available even when the connection isn't working
      createTableSQL = `
CREATE TABLE IF NOT EXISTS property_history_records (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  year TEXT NOT NULL,
  value NUMERIC NOT NULL,
  source TEXT,
  notes TEXT,
  confidence INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id, year)
);

-- Insert initialization record
INSERT INTO property_history_records (property_id, year, value, source, notes, confidence, updated_by)
VALUES ('init', '2000', 0, 'initialization', 'Table creation placeholder record', 100, 'system')
ON CONFLICT (property_id, year) DO NOTHING;

-- Add an index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_history_property_id ON property_history_records(property_id);
`;

      res.json({ 
        success: true,
        status: isConnected ? 'connected' : 'disconnected',
        message: isConnected 
          ? tableExists 
            ? 'Supabase integration is connected and operational'
            : 'Supabase integration is connected but the property_history_records table is missing'
          : 'Supabase integration is configured but not connected',
        schema: {
          initialized: schemaInitialized,
          property_history_table: tableExists ? 'exists' : 'missing'
        },
        diagnostics: {
          tablesAccess: tableExists,
          tableSample: tableData,
          lastError: tableError
        },
        environment: {
          url: process.env.SUPABASE_URL ? 'set' : 'missing',
          key: process.env.SUPABASE_KEY ? 'set' : 'missing'
        },
        manual_setup: {
          required: true,
          sql_script: createTableSQL,
          instructions: 'Execute this SQL in the Supabase SQL Editor to create the necessary tables'
        }
      });
    } catch (error) {
      handleError(error, res);
    }
  });
}