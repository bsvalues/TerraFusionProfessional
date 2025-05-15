/**
 * Property History Routes
 * 
 * API routes for property history management
 */

import { Express, Request, Response } from 'express';
import { propertyHistoryService } from '../services/property-history-service';
import { HistoricalValue, PropertyHistoryRecord } from '../../shared/interfaces/PropertyHistory';
import { z } from 'zod';
import { auditSystemAction, AuditAction } from '../../shared/agent/AuditLogger';

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
 * Register property history routes
 */
export function registerPropertyHistoryRoutes(app: Express) {
  // Get property value trends for heat map visualization
  app.get('/api/property-trends', async (req: Request, res: Response) => {
    try {
      // Get year parameters from query, use defaults if not provided
      const analysisYear = req.query.analysisYear as string || '2023';
      const referenceYear = req.query.referenceYear as string || '2022';
      
      // Get trends for all properties
      const trends = await propertyHistoryService.getAllPropertyValueTrends(
        analysisYear,
        referenceYear
      );
      
      // Audit this access
      await auditSystemAction(
        'API',
        AuditAction.READ,
        { 
          endpoint: '/api/property-trends',
          analysisYear,
          referenceYear,
          trendCount: trends.length
        },
        { ip: req.ip }
      );
      
      res.json({
        success: true,
        trends,
        metadata: {
          analysisYear,
          referenceYear,
          count: trends.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  // Get property history
  app.get('/api/properties/:id/history', async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      
      const historyRecord = await propertyHistoryService.getPropertyHistory(propertyId);
      
      // Audit this access
      await auditSystemAction(
        'API',
        AuditAction.READ,
        { 
          endpoint: '/api/properties/:id/history',
          propertyId
        },
        { ip: req.ip }
      );
      
      res.json({
        success: true,
        history: historyRecord
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Get formatted property history for visualization
  app.get('/api/properties/:id/history/formatted', async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      
      const formattedHistory = await propertyHistoryService.getFormattedPropertyHistory(propertyId);
      
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
          endpoint: '/api/properties/:id/history/formatted',
          propertyId
        },
        { ip: req.ip }
      );
      
      res.json({
        success: true,
        history: formattedHistory
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Update a year's historical value
  app.post('/api/properties/:id/history/:year', async (req: Request, res: Response) => {
    try {
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
      const result = await propertyHistoryService.updatePropertyHistoricalValue(
        propertyId,
        year,
        valueToSave,
        author
      );
      
      res.json({
        success: true,
        message: 'Historical value updated',
        change: result
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Delete a year's historical value
  app.delete('/api/properties/:id/history/:year', async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      const year = req.params.year;
      
      // Get author (would come from authentication in a real system)
      const author = 'API User';
      
      // Delete the historical value
      const success = await propertyHistoryService.deletePropertyHistoricalValue(
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
        message: 'Historical value deleted'
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Import bulk history data
  app.post('/api/properties/:id/history/import', async (req: Request, res: Response) => {
    try {
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
      const success = await propertyHistoryService.importPropertyHistory(
        propertyId,
        historyToImport,
        author,
        overwrite
      );
      
      res.json({
        success,
        message: 'Historical values imported',
        recordCount: Object.keys(historyToImport).length,
        overwrite
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Calculate value trend between years
  app.get('/api/properties/:id/history/trend', async (req: Request, res: Response) => {
    try {
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
      const trend = await propertyHistoryService.calculatePropertyValueTrend(
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
          endpoint: '/api/properties/:id/history/trend',
          propertyId,
          startYear,
          endYear
        },
        { ip: req.ip }
      );
      
      res.json({
        success: true,
        trend
      });
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Fill missing years using interpolation
  app.post('/api/properties/:id/history/fill-gaps', async (req: Request, res: Response) => {
    try {
      const propertyId = req.params.id;
      
      // Get author (would come from authentication in a real system)
      const author = 'API User';
      
      // Fill missing years
      const result = await propertyHistoryService.fillMissingHistoricalYears(
        propertyId,
        author
      );
      
      res.json({
        success: result.success,
        message: result.success 
          ? `Filled ${result.yearsFilled} missing years` 
          : 'No missing years could be filled',
        yearsFilled: result.yearsFilled
      });
    } catch (error) {
      handleError(error, res);
    }
  });
}