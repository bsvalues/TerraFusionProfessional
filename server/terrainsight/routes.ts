import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  isOpenAIConfigured,
  analyzeDataQuality,
  generateCodeFromLanguage,
  optimizeCode,
  debugCode,
  generateContextualPropertyPrediction,
  getETLAssistance,
  getETLOnboardingTips,
  generateConnectionTroubleshooting
} from "./services/openai";
import { db, checkConnection } from "./db";
import postgres from 'postgres';
import { incomeLeaseUpMonthListing } from "../shared/schema";
import { registerAgentRoutes } from "./agent-api";
import {
  testDatabaseConnection,
  executeQuery,
  getDatabaseMetadata
} from "./services/database";
import {
  getAvailableDatasets,
  loadGeoJSONData,
  getFeatureProperties,
  GIS_DATASETS
} from "./services/gis-data";
import {
  insertIncomeHotelMotelSchema,
  insertIncomeHotelMotelDetailSchema,
  insertIncomeLeaseUpSchema,
  insertIncomeLeaseUpMonthListingSchema,
  insertPropertySchema,
  type InsertProperty
} from "../shared/schema";
// Import audit service and logger for regulatory compliance
import { auditService } from './services/audit-service';
import { auditLogger, AuditAction, AuditEntityType } from '../shared/agent/AuditLogger';
// Import property history routes
import { registerPropertyHistoryRoutes } from './routes/property-history-routes';
import { registerPropertyHistorySupabaseRoutes } from './routes/property-history-routes-supabase';
// Import Supabase status routes
import supabaseStatusRoutes from './routes/supabase-status-routes';
import agentHealthRoutes from './routes/agent-routes';
// Import AI Assistant routes
import { registerAIAssistantRoutes } from './routes/ai-assistant-routes';

// Import Supabase client for initialization and testing
import { isSupabaseConfigured, initializeSupabaseSchema, testSupabaseConnection } from './services/supabase-client';

// Import GIS_DATASETS enum defined at the top and propertyGisMapperService
import { propertyGisMapperService } from './services/property-gis-mapper';
import path from 'path';
import fs from 'fs';

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve shared data files 
  app.get('/shared/data/:filename', (req, res) => {
    const filename = req.params.filename;
    // Use relative paths from current working directory instead of __dirname
    const filePath = path.join(process.cwd(), 'shared/data', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: `File ${filename} not found` });
    }
  });
  // API route for accessing whitelisted environment variables
  app.get('/api/config', (req, res) => {
    // Only expose whitelisted environment variables
    const clientConfig = {
      // API keys
      hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
      hasOpenAIKey: isOpenAIConfigured()
    };
    
    res.json(clientConfig);
  });
  
  // Advanced Database Routes
  
  // Test database connection
  app.post('/api/database/test', testDatabaseConnection);
  
  // Execute database query
  app.post('/api/database/query', executeQuery);
  
  // Get database metadata
  app.post('/api/database/metadata', getDatabaseMetadata);
  
  // Get database status (local and Supabase)
  app.get('/api/database/status', async (req, res) => {
    try {
      // Check local PostgreSQL status
      const localStatus: {
        isConnected: boolean;
        tables: {
          property_history_records: boolean;
          audit_records: boolean;
        };
        error: string | null;
        sqlScript?: string | null;
      } = {
        isConnected: false,
        tables: {
          property_history_records: false,
          audit_records: false
        },
        error: null,
        sqlScript: null
      };
      
      try {
        // Check local connection using the raw query client
        const isConnected = await checkConnection();
        localStatus.isConnected = isConnected;
        
        if (isConnected) {
          try {
            // We need to use the raw query client to check table existence
            const rawClient = postgres(process.env.DATABASE_URL!, {
              max: 1
            });
            
            // Check table existence
            const localTablesResult = await rawClient`
              SELECT tablename FROM pg_tables WHERE schemaname = 'public'
            `;
            const localTables = localTablesResult.map(row => row.tablename);
            
            localStatus.tables.property_history_records = localTables.includes('property_history_records');
            localStatus.tables.audit_records = localTables.includes('audit_records');
            
            // Close the connection
            await rawClient.end();
          } catch (innerError: any) {
            localStatus.error = `Connected but failed to check tables: ${innerError.message}`;
            console.error('Error checking table existence:', innerError);
          }
        }
      } catch (error: any) {
        localStatus.error = error.message;
        console.error('Error checking local database status:', error);
      }
      
      // Check Supabase status
      const supabaseStatus: {
        isConnected: boolean;
        tables: {
          property_history_records: boolean;
          audit_records: boolean;
        };
        error: string | null;
        sqlScript: string | null;
      } = {
        isConnected: false,
        tables: {
          property_history_records: false,
          audit_records: false
        },
        error: null,
        sqlScript: null
      };
      
      if (isSupabaseConfigured()) {
        try {
          const supabaseResult = await testSupabaseConnection();
          
          if (supabaseResult.success) {
            supabaseStatus.isConnected = true;
            
            // We would need to check tables here, but for now we'll rely on the 
            // error from testSupabaseConnection which checks for the property_history_records table
            supabaseStatus.tables.property_history_records = true;
            supabaseStatus.tables.audit_records = true; // Assuming audit_records exists if property_history_records does
          } else if (supabaseResult.error) {
            const error = supabaseResult.error;
            supabaseStatus.error = error.message || 'Unknown Supabase error';
            
            // If the error says the table doesn't exist, show the SQL script
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
              // Import the SQL generator
              const { generateTableCreationSQL } = await import('./utils/sql-generator');
              supabaseStatus.sqlScript = generateTableCreationSQL('property_history_records');
            }
          }
        } catch (error: any) {
          supabaseStatus.error = error.message;
          console.error('Error checking Supabase status:', error);
        }
      } else {
        supabaseStatus.error = 'Supabase configuration missing or invalid';
      }
      
      res.json({
        local: localStatus,
        supabase: supabaseStatus
      });
    } catch (error: any) {
      console.error('Error in database status endpoint:', error);
      res.status(500).json({ error: 'Failed to retrieve database status' });
    }
  });
  
  // Legacy routes - redirect to new API endpoints
  
  // SQL Server connection test (legacy route)
  app.post('/api/sqlserver/test', async (req, res) => {
    try {
      const { connection } = req.body;
      
      if (!connection) {
        return res.status(400).json({ error: 'Missing connection configuration' });
      }
      
      // Convert legacy format to new format
      const config = {
        type: 'sqlserver',
        server: connection.server,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        useWindowsAuth: connection.useWindowsAuth || false,
        trustServerCertificate: connection.trustServerCertificate || false,
        encrypt: connection.encrypt !== false
      };
      
      // Call the new database test service
      req.body = { config };
      return testDatabaseConnection(req, res);
    } catch (error: any) {
      handleError(error, res);
    }
  });
  
  // SQL Server query execution (legacy route)
  app.post('/api/sqlserver/query', async (req, res) => {
    try {
      const { connection, sql, params } = req.body;
      
      if (!connection || !sql) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Convert legacy format to new format
      const config = {
        type: 'sqlserver',
        server: connection.server,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        useWindowsAuth: connection.useWindowsAuth || false,
        trustServerCertificate: connection.trustServerCertificate || false,
        encrypt: connection.encrypt !== false
      };
      
      // Call the new database query service
      req.body = { config, query: sql, parameters: params };
      return executeQuery(req, res);
    } catch (error: any) {
      handleError(error, res);
    }
  });
  
  // ODBC connection test (legacy route)
  app.post('/api/odbc/test', async (req, res) => {
    try {
      const { connection } = req.body;
      
      if (!connection) {
        return res.status(400).json({ error: 'Missing connection configuration' });
      }
      
      // Convert legacy format to new format
      const config = {
        type: 'odbc',
        connectionString: connection.connectionString,
        server: connection.server,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        useWindowsAuth: connection.useWindowsAuth || false,
        useConnectionString: !!connection.connectionString
      };
      
      // Call the new database test service
      req.body = { config };
      return testDatabaseConnection(req, res);
    } catch (error: any) {
      handleError(error, res);
    }
  });
  
  // ODBC query execution (legacy route)
  app.post('/api/odbc/query', async (req, res) => {
    try {
      const { connection, sql, params } = req.body;
      
      if (!connection || !sql) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Convert legacy format to new format
      const config = {
        type: 'odbc',
        connectionString: connection.connectionString,
        server: connection.server,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        useWindowsAuth: connection.useWindowsAuth || false,
        useConnectionString: !!connection.connectionString
      };
      
      // Call the new database query service
      req.body = { config, query: sql, parameters: params };
      return executeQuery(req, res);
    } catch (error: any) {
      handleError(error, res);
    }
  });
  
  // API route to proxy Google Maps Extractor API requests
  app.post('/api/maps/query-locate', async (req, res) => {
    try {
      const { query, country, language } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Missing required parameter: query' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      // Build query string
      const params = new URLSearchParams();
      params.append('query', query);
      params.append('country', country || 'us');
      params.append('language', language || 'en');
      
      const url = `https://google-maps-extractor2.p.rapidapi.com/query_locate?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'google-maps-extractor2.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching from Google Maps API:', error);
      res.status(500).json({ error: 'Failed to fetch location data from Google Maps' });
    }
  });
  
  // API route to proxy Zillow API property details
  app.post('/api/zillow/property-data', async (req, res) => {
    try {
      const { zpid, data: dataType } = req.body;
      
      if (!zpid) {
        return res.status(400).json({ error: 'Missing required parameter: zpid' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      // Use the Realty in US API for property details
      const url = `https://realty-in-us.p.rapidapi.com/properties/v3/detail?zpid=${zpid}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching from Zillow API:', error);
      res.status(500).json({ error: 'Failed to fetch property data from Zillow' });
    }
  });
  
  // API route to proxy Zillow property search
  app.post('/api/zillow/search', async (req, res) => {
    try {
      const { location, price_min, price_max, beds_min, baths_min, home_types, searchType, page } = req.body;
      
      if (!location) {
        return res.status(400).json({ error: 'Missing required parameter: location' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      // Build query string
      const params = new URLSearchParams();
      params.append('location', location);
      if (searchType) params.append('searchType', searchType || 'forsale');
      if (page) params.append('page', page.toString());
      if (price_min) params.append('price_min', price_min.toString());
      if (price_max) params.append('price_max', price_max.toString());
      if (beds_min) params.append('beds_min', beds_min.toString());
      if (baths_min) params.append('baths_min', baths_min.toString());
      if (home_types) params.append('home_type', home_types);
      
      const url = `https://realty-in-us.p.rapidapi.com/properties/v2/list-for-sale?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error searching properties from Zillow API:', error);
      res.status(500).json({ error: 'Failed to search properties from Zillow' });
    }
  });
  
  // API route to get similar homes
  app.post('/api/zillow/similar-homes', async (req, res) => {
    try {
      const { property_id } = req.body;
      
      if (!property_id) {
        return res.status(400).json({ error: 'Missing required parameter: property_id' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      const url = `https://realty-in-us.p.rapidapi.com/properties/v2/list-similar-homes?property_id=${property_id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching similar homes from Zillow API:', error);
      res.status(500).json({ error: 'Failed to fetch similar homes' });
    }
  });
  
  // API route to get similar rental homes
  app.post('/api/zillow/similar-rentals', async (req, res) => {
    try {
      const { postal_code, property_id } = req.body;
      
      if (!postal_code || !property_id) {
        return res.status(400).json({ error: 'Missing required parameters: postal_code and property_id' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      const url = `https://realty-in-us.p.rapidapi.com/properties/v2/list-similar-rental-homes?postal_code=${postal_code}&property_id=${property_id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching similar rental homes from Zillow API:', error);
      res.status(500).json({ error: 'Failed to fetch similar rental homes' });
    }
  });
  
  // API route to check mortgage rates
  app.post('/api/zillow/mortgage-rates', async (req, res) => {
    try {
      const { 
        creditScore, 
        points, 
        loanPurpose, 
        loanTypes, 
        loanPercent, 
        propertyPrice, 
        zip 
      } = req.body;
      
      if (!creditScore || !propertyPrice || !zip) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      // Build query string
      const params = new URLSearchParams();
      params.append('creditScore', creditScore);
      params.append('points', points || 'all');
      params.append('loanPurpose', loanPurpose || 'purchase');
      params.append('loanTypes', loanTypes || 'ALL');
      params.append('loanPercent', loanPercent || '80');
      params.append('propertyPrice', propertyPrice);
      params.append('zip', zip);
      
      const url = `https://realty-in-us.p.rapidapi.com/mortgage/check-rates?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching mortgage rates from Zillow API:', error);
      res.status(500).json({ error: 'Failed to fetch mortgage rates' });
    }
  });
  
  // GIS Data API Routes
  
  // Map from legacy /api/geojson/benton-county-* routes to new dataset names
  const legacyGeoJSONMapping: Record<string, string> = {
    'benton-county-boundary': 'county-boundary',
    'benton-county-parcels': 'parcels',
    'benton-county-neighborhoods': 'neighborhood-areas',
    'benton-county-zoning': 'zoning',
    'benton-county-school-districts': 'school-district',
    'benton-county-flood-zones': 'flood-zones'
  };
  
  // Legacy route support - /api/geojson/benton-county-* routes
  app.get('/api/geojson/:legacyDatasetName', async (req, res) => {
    try {
      const { legacyDatasetName } = req.params;
      console.log(`Legacy GeoJSON request for ${legacyDatasetName}`);
      
      // Map the legacy dataset name to the new format
      const datasetName = legacyGeoJSONMapping[legacyDatasetName] || legacyDatasetName;
      
      // Check if the mapped dataset name is valid
      if (!Object.keys(GIS_DATASETS).includes(datasetName)) {
        console.warn(`Invalid legacy dataset mapping: ${legacyDatasetName} -> ${datasetName}`);
        return res.status(400).json({ 
          error: `Invalid dataset specified: ${legacyDatasetName}`,
          availableDatasets: Object.keys(legacyGeoJSONMapping)
        });
      }
      
      // Load GeoJSON data using the shared function
      try {
        const geojsonData = await loadGeoJSONData(datasetName);
        console.log(`Successfully loaded legacy GeoJSON data for ${legacyDatasetName} with ${geojsonData.features?.length || 0} features`);
        res.json(geojsonData);
      } catch (err) {
        console.error(`Error loading legacy GeoJSON data:`, err);
        res.status(500).json({ 
          error: `Failed to load GeoJSON data for dataset: ${legacyDatasetName}`,
          message: err instanceof Error ? err.message : String(err)
        });
      }
    } catch (error) {
      console.error('Error handling legacy GeoJSON request:', error);
      res.status(500).json({ error: 'Failed to get GeoJSON data' });
    }
  });
  
  // List all available GIS datasets
  app.get('/api/gis/datasets', async (req, res) => {
    try {
      const availableDatasets = await getAvailableDatasets();
      res.json({
        availableDatasets: Object.keys(GIS_DATASETS),
      });
    } catch (error) {
      console.error('Error listing GIS datasets:', error);
      res.status(500).json({ error: 'Failed to list GIS datasets' });
    }
  });
  
  // Download a specific GIS dataset
  app.post('/api/gis/datasets/download', async (req, res) => {
    try {
      const { dataset } = req.body;
      
      if (!dataset || !Object.keys(GIS_DATASETS).includes(dataset)) {
        return res.status(400).json({ 
          error: 'Invalid dataset specified',
          availableDatasets: Object.keys(GIS_DATASETS)
        });
      }
      
      // Since we already have the GeoJSON files locally, we just check if the file exists
      const fileName = GIS_DATASETS[dataset as keyof typeof GIS_DATASETS];
      const filePath = path.join(process.cwd(), 'gis_data', fileName);
      
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        res.json({ 
          success: true, 
          message: `Dataset ${dataset} is available`,
          fileName,
          path: filePath 
        });
      } catch (err) {
        res.status(404).json({ 
          success: false, 
          error: `Dataset ${dataset} not found at ${filePath}` 
        });
      }
    } catch (error) {
      console.error('Error verifying GIS dataset:', error);
      res.status(500).json({ error: 'Failed to verify GIS dataset' });
    }
  });
  
  // Get GeoJSON data for a specific dataset
  app.get('/api/gis/datasets/:datasetName/geojson', async (req, res) => {
    try {
      const { datasetName } = req.params;
      
      // Check if the dataset name is valid
      if (!datasetName || !Object.keys(GIS_DATASETS).includes(datasetName)) {
        return res.status(400).json({ 
          error: 'Invalid dataset specified',
          availableDatasets: Object.keys(GIS_DATASETS)
        });
      }
      
      // Load GeoJSON data directly using imported function
      try {
        const geojsonData = await loadGeoJSONData(datasetName);
        res.json(geojsonData);
      } catch (err) {
        console.error(`Error loading GeoJSON data:`, err);
        res.status(500).json({ 
          error: `Failed to load GeoJSON data for dataset: ${datasetName}`,
          message: err instanceof Error ? err.message : String(err)
        });
      }
    } catch (error) {
      console.error('Error getting GeoJSON data:', error);
      res.status(500).json({ error: 'Failed to get GeoJSON data' });
    }
  });
  
  // Get metadata for a specific dataset
  app.get('/api/gis/datasets/:datasetName/metadata', async (req, res) => {
    try {
      const { datasetName } = req.params;
      
      if (!datasetName || !Object.keys(GIS_DATASETS).includes(datasetName)) {
        return res.status(400).json({ 
          error: 'Invalid dataset specified',
          availableDatasets: Object.keys(GIS_DATASETS)
        });
      }
      
      try {
        // Load the GeoJSON to extract metadata
        const geojson = await loadGeoJSONData(datasetName);
        
        // Extract basic metadata
        const featureCount = geojson.features?.length || 0;
        const firstFeature = geojson.features?.[0] || {};
        const propertyFields = firstFeature.properties ? Object.keys(firstFeature.properties) : [];
        
        // Build and return metadata
        const metadata = {
          datasetName,
          featureCount,
          geometryType: firstFeature.geometry?.type || 'Unknown',
          propertyFields,
          fileName: GIS_DATASETS[datasetName as keyof typeof GIS_DATASETS]
        };
        
        res.json(metadata);
      } catch (err) {
        console.error(`Error loading GeoJSON metadata:`, err);
        res.status(500).json({ 
          error: `Failed to load metadata for dataset: ${datasetName}`,
          message: err instanceof Error ? err.message : String(err)
        });
      }
    } catch (error) {
      console.error('Error getting dataset metadata:', error);
      res.status(500).json({ error: 'Failed to get dataset metadata' });
    }
  });
  // Sample property data (simulating database)
  const properties = [
    {
      id: '1',
      parcelId: 'P123456',
      address: '123 Main St, Richland, WA',
      owner: 'John Doe',
      value: '450000',
      squareFeet: 2500,
      yearBuilt: 1998,
      landValue: '120000',
      coordinates: [46.2804, -119.2752],
      neighborhood: 'North Richland',
      bedrooms: 3,
      bathrooms: 2.5,
      lotSize: 8500
    },
    {
      id: '2',
      parcelId: 'P789012',
      address: '456 Oak Ave, Kennewick, WA',
      owner: 'Jane Smith',
      value: '375000',
      squareFeet: 2100,
      yearBuilt: 2004,
      landValue: '95000',
      coordinates: [46.2087, -119.1361],
      neighborhood: 'South Kennewick',
      bedrooms: 3,
      bathrooms: 2,
      lotSize: 7200
    },
    {
      id: '3',
      parcelId: 'P345678',
      address: '789 Pine Ln, Pasco, WA',
      owner: 'Robert Johnson',
      value: '525000',
      squareFeet: 3200,
      yearBuilt: 2012,
      landValue: '150000',
      coordinates: [46.2395, -119.1005],
      neighborhood: 'East Pasco',
      bedrooms: 4,
      bathrooms: 3,
      lotSize: 9800
    },
    {
      id: '4',
      parcelId: 'P901234',
      address: '321 Cedar Dr, Richland, WA',
      owner: 'Mary Williams',
      value: '625000',
      squareFeet: 3800,
      yearBuilt: 2015,
      landValue: '180000',
      coordinates: [46.2933, -119.2871],
      neighborhood: 'North Richland',
      bedrooms: 4,
      bathrooms: 3.5,
      lotSize: 12000
    },
    {
      id: '5',
      parcelId: 'P567890',
      address: '987 Maple St, Kennewick, WA',
      owner: 'David Brown',
      value: '395000',
      squareFeet: 2300,
      yearBuilt: 2001,
      landValue: '110000',
      coordinates: [46.2118, -119.1667],
      neighborhood: 'Central Kennewick',
      bedrooms: 3,
      bathrooms: 2,
      lotSize: 8100
    },
    {
      id: '6',
      parcelId: 'P246810',
      address: '654 Birch Rd, Richland, WA',
      owner: 'Sarah Miller',
      value: '480000',
      squareFeet: 2800,
      yearBuilt: 2008,
      landValue: '135000',
      coordinates: [46.2766, -119.2834],
      neighborhood: 'West Richland',
      bedrooms: 4,
      bathrooms: 2.5,
      lotSize: 9000
    },
    {
      id: '7',
      parcelId: 'P135790',
      address: '852 Elm St, Kennewick, WA',
      owner: 'Michael Wilson',
      value: '350000',
      squareFeet: 1950,
      yearBuilt: 1995,
      landValue: '90000',
      coordinates: [46.2055, -119.1532],
      neighborhood: 'South Kennewick',
      bedrooms: 3,
      bathrooms: 1.5,
      lotSize: 7000
    },
    {
      id: '8',
      parcelId: 'P802468',
      address: '159 Spruce Ave, Pasco, WA',
      owner: 'Lisa Anderson',
      value: '420000',
      squareFeet: 2400,
      yearBuilt: 2005,
      landValue: '115000',
      coordinates: [46.2412, -119.0903],
      neighborhood: 'West Pasco',
      bedrooms: 3,
      bathrooms: 2,
      lotSize: 8200
    }
  ];

  // API routes for property data
  
  // Get property trends data with historical values
  app.get('/api/properties/trends', async (req, res) => {
    try {
      const properties = await storage.getProperties();
      
      // Generate sample historical values for demo purposes
      // In a real implementation, this would come from the database
      const years = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
      
      const propertiesWithHistoricalValues = properties.map(property => {
        const baseValue = property.estimatedValue 
          ? Number(property.estimatedValue) 
          : property.value 
            ? parseFloat(property.value) 
            : 250000;
        
        const historicalValues: Record<string, number> = {};
        
        // Generate historical values with realistic growth patterns
        years.forEach((year, index) => {
          // Base growth factor - earlier years have lower values
          const yearFactor = 1 - ((years.length - 1 - index) * 0.05);
          // Add some randomness to simulate market fluctuations
          const randomFactor = 0.95 + (Math.random() * 0.1);
          historicalValues[year] = Math.round(baseValue * yearFactor * randomFactor);
        });
        
        return {
          ...property,
          historicalValues
        };
      });
      
      res.json({
        properties: propertiesWithHistoricalValues,
        years
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Neighborhood endpoints
  // Get all available neighborhoods
  app.get('/api/neighborhoods', async (_req, res) => {
    try {
      const neighborhoods = await storage.getAvailableNeighborhoods();
      res.json(neighborhoods);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Get timelines for all neighborhoods
  app.get('/api/neighborhoods/timelines', async (req, res) => {
    try {
      const years = req.query.years ? parseInt(req.query.years as string) : 10;
      const timelines = await storage.getNeighborhoodTimelines(years);
      res.json(timelines);
    } catch (error) {
      handleError(error, res);
    }
  });
  
  // Get timeline for a specific neighborhood
  app.get('/api/neighborhoods/:id/timeline', async (req, res) => {
    try {
      const { id } = req.params;
      const years = req.query.years ? parseInt(req.query.years as string) : 10;
      
      const timeline = await storage.getNeighborhoodTimeline(id, years);
      
      if (!timeline) {
        return res.status(404).json({ error: 'Neighborhood not found' });
      }
      
      res.json(timeline);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Get all properties
  app.get('/api/properties', async (req, res) => {
    try {
      // Get filter parameters from query string
      const minYearBuilt = req.query.minYearBuilt ? parseInt(req.query.minYearBuilt as string) : undefined;
      const maxYearBuilt = req.query.maxYearBuilt ? parseInt(req.query.maxYearBuilt as string) : undefined;
      const minValue = req.query.minValue ? parseInt(req.query.minValue as string) : undefined;
      const maxValue = req.query.maxValue ? parseInt(req.query.maxValue as string) : undefined;
      const minSquareFeet = req.query.minSquareFeet ? parseInt(req.query.minSquareFeet as string) : undefined;
      const maxSquareFeet = req.query.maxSquareFeet ? parseInt(req.query.maxSquareFeet as string) : undefined;
      const propertyType = req.query.propertyType as string | undefined;
      const neighborhood = req.query.neighborhood as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      // Get filtered properties from storage
      const properties = await storage.getPropertiesByFilter({
        minYearBuilt,
        maxYearBuilt,
        minValue,
        maxValue,
        minSquareFeet,
        maxSquareFeet,
        propertyType,
        neighborhood,
        sortBy,
        sortOrder,
        limit,
        offset
      });
      
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ error: 'Failed to fetch properties' });
    }
  });
  
  // Get a single property by ID
  app.get('/api/properties/:id', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: 'Invalid property ID' });
      }
      
      const property = await storage.getPropertyById(propertyId);
      
      if (property) {
        res.json(property);
      } else {
        res.status(404).json({ error: 'Property not found' });
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      res.status(500).json({ error: 'Failed to fetch property' });
    }
  });
  
  // Search properties by text
  app.get('/api/properties/search', async (req, res) => {
    try {
      const searchText = req.query.q as string || '';
      
      if (!searchText) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const properties = await storage.searchProperties(searchText);
      res.json(properties);
    } catch (error) {
      console.error('Error searching properties:', error);
      res.status(500).json({ error: 'Failed to search properties' });
    }
  });
  
  // Bulk import properties
  app.post('/api/properties/bulk-import', async (req, res) => {
    try {
      const propertiesSchema = z.array(z.object({
        parcelId: z.string(),
        address: z.string(),
        squareFeet: z.number(),
        // Optional fields
        owner: z.string().nullable().optional(),
        value: z.union([z.string(), z.null()]).optional(),
        salePrice: z.union([z.string(), z.null()]).optional(),
        yearBuilt: z.number().nullable().optional(),
        landValue: z.union([z.string(), z.null()]).optional(),
        coordinates: z.array(z.number()).nullable().optional(),
        latitude: z.union([z.number(), z.string().transform(val => parseFloat(val))]).nullable().optional(),
        longitude: z.union([z.number(), z.string().transform(val => parseFloat(val))]).nullable().optional(),
        neighborhood: z.string().nullable().optional(),
        propertyType: z.string().nullable().optional(),
        bedrooms: z.number().nullable().optional(),
        bathrooms: z.number().nullable().optional(),
        lotSize: z.number().nullable().optional(),
        zoning: z.string().nullable().optional(),
        lastSaleDate: z.string().nullable().optional(),
        taxAssessment: z.union([z.string(), z.null()]).optional(),
        pricePerSqFt: z.union([z.string(), z.null()]).optional(),
        attributes: z.record(z.any()).nullable().optional(),
        sourceId: z.union([z.string(), z.number()]).nullable().optional(),
        zillowId: z.string().nullable().optional()
      }));
      
      const validationResult = propertiesSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid property data format', 
          details: validationResult.error.format()
        });
      }
      
      const result = await storage.bulkImportProperties(validationResult.data);
      res.json(result);
    } catch (error) {
      console.error('Error bulk importing properties:', error);
      res.status(500).json({ error: 'Failed to bulk import properties' });
    }
  });
  
  // Find similar properties
  app.get('/api/properties/similar/:id', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: 'Invalid property ID' });
      }
      
      // Get the reference property
      const referenceProperty = await storage.getPropertyById(propertyId);
      
      if (!referenceProperty) {
        return res.status(404).json({ error: 'Reference property not found' });
      }
      
      // Get all properties
      const allProperties = await storage.getProperties();
      
      // Calculate similarity scores
      const similarProperties = allProperties
        .filter(p => p.id !== propertyId) // Exclude the reference property
        .map(property => {
          // Calculate similarity based on weighted factors
          let similarityScore = 0;
          
          // Factor: Square footage (30% weight)
          const sqftDiff = Math.abs(property.squareFeet - referenceProperty.squareFeet);
          const sqftSimilarity = Math.max(0, 1 - (sqftDiff / 2000)); // Normalize to 0-1
          similarityScore += sqftSimilarity * 0.3;
          
          // Factor: Year built (20% weight)
          if (property.yearBuilt && referenceProperty.yearBuilt) {
            const yearDiff = Math.abs(property.yearBuilt - referenceProperty.yearBuilt);
            const yearSimilarity = Math.max(0, 1 - (yearDiff / 50)); // Normalize to 0-1
            similarityScore += yearSimilarity * 0.2;
          }
          
          // Factor: Neighborhood (30% weight)
          if (property.neighborhood && referenceProperty.neighborhood) {
            const neighborhoodSimilarity = property.neighborhood === referenceProperty.neighborhood ? 1 : 0;
            similarityScore += neighborhoodSimilarity * 0.3;
          }
          
          // Factor: Property type (10% weight)
          if (property.propertyType && referenceProperty.propertyType) {
            const propertyTypeSimilarity = property.propertyType === referenceProperty.propertyType ? 1 : 0;
            similarityScore += propertyTypeSimilarity * 0.1;
          }
          
          // Factor: Value (10% weight)
          if (property.value && referenceProperty.value) {
            const propertyValue = parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
            const referenceValue = parseFloat(referenceProperty.value.replace(/[^0-9.-]+/g, ''));
            const valueDiff = Math.abs(propertyValue - referenceValue);
            const valueSimilarity = Math.max(0, 1 - (valueDiff / 500000)); // Normalize to 0-1
            similarityScore += valueSimilarity * 0.1;
          }
          
          return { ...property, similarityScore };
        })
        .sort((a, b) => b.similarityScore - a.similarityScore) // Sort by similarity (descending)
        .slice(0, limit); // Limit the number of results
      
      res.json(similarProperties.map(({ similarityScore, ...property }) => property));
    } catch (error) {
      console.error('Error finding similar properties:', error);
      res.status(500).json({ error: 'Failed to find similar properties' });
    }
  });
  
  // Find properties within a geographic region
  app.get('/api/properties/region', async (req, res) => {
    try {
      const south = parseFloat(req.query.south as string);
      const west = parseFloat(req.query.west as string);
      const north = parseFloat(req.query.north as string);
      const east = parseFloat(req.query.east as string);
      
      if (isNaN(south) || isNaN(west) || isNaN(north) || isNaN(east)) {
        return res.status(400).json({ error: 'Invalid bounds parameters' });
      }
      
      const properties = await storage.getPropertiesInRegion([south, west, north, east]);
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties in region:', error);
      res.status(500).json({ error: 'Failed to fetch properties in region' });
    }
  });
  
  // Import properties from CSV
  app.post('/api/properties/import', async (req, res) => {
    try {
      const { properties } = req.body;
      
      if (!Array.isArray(properties) || properties.length === 0) {
        return res.status(400).json({ 
          success: false, 
          imported: 0, 
          errors: [{ message: 'No valid properties provided' }] 
        });
      }
      
      // Track successes and errors
      const results = {
        success: true,
        imported: 0,
        errors: [] as any[]
      };
      
      // Process each property
      for (const propertyData of properties) {
        try {
          // Validate required fields
          if (!propertyData.parcelId || !propertyData.address) {
            results.errors.push({
              property: propertyData,
              message: 'Missing required fields: parcelId and address'
            });
            continue;
          }
          
          // Create the property
          await storage.createProperty(propertyData);
          results.imported++;
        } catch (error: any) {
          console.error('Error importing property:', error);
          results.errors.push({
            property: propertyData,
            message: error.message || 'Failed to import property'
          });
        }
      }
      
      // If we have any errors, mark the overall operation as partially successful
      if (results.errors.length > 0) {
        results.success = results.imported > 0;
      }
      
      res.json(results);
    } catch (error: any) {
      console.error('Error importing properties:', error);
      res.status(500).json({ 
        success: false, 
        imported: 0, 
        errors: [{ message: error.message || 'Failed to import properties' }] 
      });
    }
  });

  // API route for project overview data
  app.get('/api/project', (req, res) => {
    res.json({
      id: 'p1',
      name: 'Benton County Assessment 2024',
      year: '2024',
      metrics: {
        activeLayers: 8,
        savedLocations: 14,
        activeScripts: 6,
        sqlQueries: 8,
        modelR2: 0.892,
        prdValue: 1.02
      },
      records: {
        properties: 1250,
        sales: 523,
        models: 8,
        analyses: 438
      }
    });
  });

  // API routes for map layers
  app.get('/api/layers', (req, res) => {
    res.json({
      baseLayers: [
        { id: 'imagery', name: 'Imagery', type: 'base', checked: true },
        { id: 'street', name: 'Street Map', type: 'base', checked: true },
        { id: 'topo', name: 'Topo', type: 'base', checked: false },
        { id: 'flood', name: 'FEMA Flood', type: 'base', checked: false },
        { id: 'usgs', name: 'USGS Imagery', type: 'base', checked: false }
      ],
      viewableLayers: [
        { id: 'parcels', name: 'Parcels', type: 'viewable', checked: true },
        { id: 'shortplats', name: 'Short Plats', type: 'viewable', checked: false },
        { id: 'longplats', name: 'Long Plats', type: 'viewable', checked: false },
        { id: 'flood', name: 'Flood Zones', type: 'viewable', checked: false },
        { id: 'welllogs', name: 'Well Logs', type: 'viewable', checked: false },
        { id: 'zoning', name: 'Zoning', type: 'viewable', checked: false }
      ]
    });
  });

  // API routes for script data
  app.get('/api/scripts', (req, res) => {
    res.json({
      scriptGroups: [
        { id: 'data-review', name: 'Data Review', active: false },
        { id: 'sales-review', name: 'Sales Review', active: false },
        { id: 'modeling-prep', name: 'Modeling Prep', active: true },
        { id: 'regression-analysis', name: 'Regression Analysis', active: false },
        { id: 'comparable-analysis', name: 'Comparable Analysis', active: false }
      ],
      scriptSteps: [
        { id: 'compute-bppsf', name: 'Compute BPPSF', status: 'complete', type: 'compute' },
        { id: 'compute-useablesale', name: 'Compute UseableSale', status: 'complete', type: 'compute' },
        { id: 'compute-sizerange', name: 'Compute SIZERANGE', status: 'active', type: 'compute' },
        { id: 'compute-outliertag', name: 'Compute OutlierTag', status: 'pending', type: 'compute' },
        { id: 'group-by-neighborhood', name: 'Group By Neighborhood', status: 'pending', type: 'group' }
      ],
      sqlQueries: [
        { id: 'prop-data', name: 'Prop Data SQL' },
        { id: 'property', name: 'Property' },
        { id: 'permits', name: 'Permits' },
        { id: 'land', name: 'Land' }
      ]
    });
  });

  // API routes for regression models
  app.get('/api/regression/models', (req, res) => {
    res.json([
      { id: 1, name: 'Residential Model A', r2: 0.892, variables: 8, cov: 10.4, samples: 423, lastRun: '2024-03-30', type: 'multiple_regression' },
      { id: 2, name: 'Commercial Properties', r2: 0.815, variables: 6, cov: 12.7, samples: 156, lastRun: '2024-03-29', type: 'multiple_regression' },
      { id: 3, name: 'Agricultural Land', r2: 0.774, variables: 5, cov: 14.2, samples: 98, lastRun: '2024-03-27', type: 'spatial_regression' },
      { id: 4, name: 'Time Series Value Model', r2: 0.865, variables: 4, cov: 9.8, samples: 312, lastRun: '2024-03-25', type: 'time_series' },
      { id: 5, name: 'Neighborhood Factor Analysis', r2: 0.825, variables: 7, cov: 11.3, samples: 278, lastRun: '2024-03-22', type: 'geospatial' }
    ]);
  });
  
  // Get model variables by model ID
  app.get('/api/regression/models/:id/variables', (req, res) => {
    const modelId = parseInt(req.params.id);
    
    const variablesByModel = {
      1: [
        { name: 'squareFeet', coefficient: 105.82, tValue: 9.7, pValue: 0.00001, correlation: 0.84, included: true },
        { name: 'yearBuilt', coefficient: 524.34, tValue: 6.4, pValue: 0.00012, correlation: 0.72, included: true },
        { name: 'bathrooms', coefficient: 12500.00, tValue: 5.2, pValue: 0.00034, correlation: 0.68, included: true },
        { name: 'bedrooms', coefficient: 8750.00, tValue: 3.8, pValue: 0.00291, correlation: 0.64, included: true },
        { name: 'lotSize', coefficient: 2.15, tValue: 4.1, pValue: 0.00125, correlation: 0.59, included: true },
        { name: 'garageSpaces', coefficient: 9800.00, tValue: 3.2, pValue: 0.00427, correlation: 0.46, included: true },
        { name: 'hasBasement', coefficient: 15200.00, tValue: 2.9, pValue: 0.00621, correlation: 0.42, included: true },
        { name: 'hasPool', coefficient: 18500.00, tValue: 2.1, pValue: 0.03781, correlation: 0.35, included: false },
        { name: 'distanceToSchool', coefficient: -1250.00, tValue: -1.8, pValue: 0.07253, correlation: -0.32, included: false },
        { name: 'yearRenovated', coefficient: 210.45, tValue: 1.7, pValue: 0.09124, correlation: 0.28, included: false }
      ],
      2: [
        { name: 'buildingSize', coefficient: 87.45, tValue: 9.1, pValue: 0.00002, correlation: 0.82, included: true },
        { name: 'yearBuilt', coefficient: 850.23, tValue: 6.8, pValue: 0.00008, correlation: 0.74, included: true },
        { name: 'parkingSpaces', coefficient: 3500.00, tValue: 5.6, pValue: 0.00021, correlation: 0.69, included: true },
        { name: 'lotSize', coefficient: 1.85, tValue: 4.5, pValue: 0.00087, correlation: 0.63, included: true },
        { name: 'trafficCount', coefficient: 25.40, tValue: 3.7, pValue: 0.00243, correlation: 0.56, included: true },
        { name: 'distanceToCBD', coefficient: -4500.00, tValue: -3.2, pValue: 0.00389, correlation: -0.48, included: true },
        { name: 'cornerLocation', coefficient: 75000.00, tValue: 2.1, pValue: 0.03815, correlation: 0.36, included: false },
        { name: 'zoning', coefficient: 28000.00, tValue: 1.8, pValue: 0.07581, correlation: 0.33, included: false }
      ],
      3: [
        { name: 'acreage', coefficient: 2450.00, tValue: 8.7, pValue: 0.00003, correlation: 0.81, included: true },
        { name: 'soilQuality', coefficient: 18500.00, tValue: 6.9, pValue: 0.00007, correlation: 0.75, included: true },
        { name: 'irrigationAccess', coefficient: 35000.00, tValue: 5.8, pValue: 0.00018, correlation: 0.72, included: true },
        { name: 'roadFrontage', coefficient: 125.00, tValue: 4.2, pValue: 0.00098, correlation: 0.62, included: true },
        { name: 'distanceToMarket', coefficient: -85.00, tValue: -3.5, pValue: 0.00354, correlation: -0.49, included: true },
        { name: 'floodZone', coefficient: -12500.00, tValue: -2.2, pValue: 0.03124, correlation: -0.38, included: false },
        { name: 'landUseRestriction', coefficient: -8900.00, tValue: -1.9, pValue: 0.06213, correlation: -0.31, included: false }
      ],
      4: [
        { name: 'monthsSinceSale', coefficient: 950.00, tValue: 8.5, pValue: 0.00002, correlation: 0.83, included: true },
        { name: 'interestRate', coefficient: -22500.00, tValue: -6.3, pValue: 0.00014, correlation: -0.76, included: true },
        { name: 'unemploymentRate', coefficient: -8500.00, tValue: -4.8, pValue: 0.00057, correlation: -0.65, included: true },
        { name: 'medianIncomeChange', coefficient: 12500.00, tValue: 4.2, pValue: 0.00112, correlation: 0.58, included: true },
        { name: 'housingStarts', coefficient: 850.00, tValue: 2.3, pValue: 0.02687, correlation: 0.41, included: false },
        { name: 'inflationRate', coefficient: -5500.00, tValue: -1.9, pValue: 0.06124, correlation: -0.35, included: false }
      ],
      5: [
        { name: 'neighborhoodIndex', coefficient: 24500.00, tValue: 7.8, pValue: 0.00004, correlation: 0.77, included: true },
        { name: 'schoolScore', coefficient: 18500.00, tValue: 6.5, pValue: 0.00010, correlation: 0.73, included: true },
        { name: 'distanceToAmenities', coefficient: -2800.00, tValue: -5.7, pValue: 0.00023, correlation: -0.68, included: true },
        { name: 'walkabilityScore', coefficient: 6500.00, tValue: 5.3, pValue: 0.00031, correlation: 0.65, included: true },
        { name: 'transitAccess', coefficient: 4200.00, tValue: 4.1, pValue: 0.00120, correlation: 0.57, included: true },
        { name: 'crimeRate', coefficient: -15000.00, tValue: -3.8, pValue: 0.00234, correlation: -0.54, included: true },
        { name: 'parkProximity', coefficient: 8200.00, tValue: 2.1, pValue: 0.03567, correlation: 0.38, included: true },
        { name: 'noiseLevel', coefficient: -3500.00, tValue: -1.8, pValue: 0.07342, correlation: -0.29, included: false }
      ]
    };
    
    // Return the variables for the requested model, or an empty array if model not found
    res.json(variablesByModel[modelId as keyof typeof variablesByModel] || []);
  });
  
  // Get model predictions
  app.get('/api/regression/models/:id/predictions', (req, res) => {
    const modelId = parseInt(req.params.id);
    
    // Generate realistic prediction data with actual vs predicted values
    const predictions = Array.from({ length: 40 }, (_, i) => {
      const actualValue = 200000 + Math.random() * 400000;
      const error = (Math.random() * 0.2 - 0.1) * actualValue; // ±10% error
      const predictedValue = actualValue + error;
      return {
        id: i + 1,
        actualValue: Math.round(actualValue),
        predictedValue: Math.round(predictedValue),
        absoluteError: Math.round(Math.abs(error)),
        percentError: Math.round(Math.abs(error / actualValue * 100) * 10) / 10,
        parcelId: `P${100000 + i}`,
        address: `${1000 + i} Sample St, Benton County, WA`
      };
    });
    
    res.json(predictions);
  });
  
  // Get model diagnostics
  app.get('/api/regression/models/:id/diagnostics', (req, res) => {
    const modelId = parseInt(req.params.id);
    
    // Generate histogram data for residuals
    const residualBins = [
      { bin: '-30% to -25%', count: Math.floor(Math.random() * 5) },
      { bin: '-25% to -20%', count: Math.floor(Math.random() * 8) },
      { bin: '-20% to -15%', count: Math.floor(Math.random() * 12) },
      { bin: '-15% to -10%', count: Math.floor(Math.random() * 18) },
      { bin: '-10% to -5%', count: Math.floor(Math.random() * 25) + 10 },
      { bin: '-5% to 0%', count: Math.floor(Math.random() * 30) + 25 },
      { bin: '0% to 5%', count: Math.floor(Math.random() * 30) + 25 },
      { bin: '5% to 10%', count: Math.floor(Math.random() * 25) + 10 },
      { bin: '10% to 15%', count: Math.floor(Math.random() * 18) },
      { bin: '15% to 20%', count: Math.floor(Math.random() * 12) },
      { bin: '20% to 25%', count: Math.floor(Math.random() * 8) },
      { bin: '25% to 30%', count: Math.floor(Math.random() * 5) }
    ];
    
    // Generate scatter plot data (predicted vs actual)
    const scatterData = Array.from({ length: 50 }, () => {
      const actual = 200000 + Math.random() * 400000;
      const error = (Math.random() * 0.2 - 0.1) * actual; // ±10% error
      return {
        actual: Math.round(actual),
        predicted: Math.round(actual + error)
      };
    });
    
    // Model metrics
    const metrics = {
      r2: 0.75 + Math.random() * 0.15,
      adjustedR2: 0.73 + Math.random() * 0.15,
      standardError: 25000 + Math.random() * 15000,
      observations: 180 + Math.floor(Math.random() * 70),
      fStatistic: 45 + Math.random() * 25,
      pValue: 0.00001 + Math.random() * 0.0001,
      akaike: 2500 + Math.random() * 500,
      cov: 8 + Math.random() * 7,
      prd: 0.95 + Math.random() * 0.1
    };
    
    res.json({
      residualHistogram: residualBins,
      scatterPlot: scatterData,
      metrics: metrics
    });
  });
  
  // API routes for property valuations with historical data for visualization
  app.get('/api/valuations', (req, res) => {
    // Filter parameters
    const neighborhood = req.query.neighborhood as string;
    const yearBuilt = req.query.yearBuilt as string;
    
    const valuationData = [
      {
        id: '1',
        parcelId: 'P123456',
        address: '123 Main St, Richland, WA',
        neighborhood: 'Central Richland',
        yearBuilt: 1998,
        squareFeet: 2500,
        valuationHistory: [
          { year: 2020, assessed: 380000, market: 390000, landValue: 100000, improvementValue: 280000 },
          { year: 2021, assessed: 405000, market: 415000, landValue: 105000, improvementValue: 300000 },
          { year: 2022, assessed: 430000, market: 445000, landValue: 112000, improvementValue: 318000 },
          { year: 2023, assessed: 442000, market: 465000, landValue: 118000, improvementValue: 324000 },
          { year: 2024, assessed: 450000, market: 480000, landValue: 120000, improvementValue: 330000 }
        ],
        salesHistory: [
          { date: '2015-06-12', price: 320000 },
          { date: '2009-03-28', price: 255000 }
        ]
      },
      {
        id: '2',
        parcelId: 'P789012',
        address: '456 Oak Ave, Kennewick, WA',
        neighborhood: 'South Kennewick',
        yearBuilt: 2004,
        squareFeet: 2100,
        valuationHistory: [
          { year: 2020, assessed: 325000, market: 335000, landValue: 85000, improvementValue: 240000 },
          { year: 2021, assessed: 340000, market: 355000, landValue: 88000, improvementValue: 252000 },
          { year: 2022, assessed: 360000, market: 370000, landValue: 92000, improvementValue: 268000 },
          { year: 2023, assessed: 368000, market: 380000, landValue: 94000, improvementValue: 274000 },
          { year: 2024, assessed: 375000, market: 390000, landValue: 95000, improvementValue: 280000 }
        ],
        salesHistory: [
          { date: '2018-09-05', price: 310000 },
          { date: '2004-11-15', price: 210000 }
        ]
      },
      {
        id: '3',
        parcelId: 'P345678',
        address: '789 Pine Ln, Pasco, WA',
        neighborhood: 'East Pasco',
        yearBuilt: 2012,
        squareFeet: 3200,
        valuationHistory: [
          { year: 2020, assessed: 480000, market: 490000, landValue: 130000, improvementValue: 350000 },
          { year: 2021, assessed: 495000, market: 505000, landValue: 135000, improvementValue: 360000 },
          { year: 2022, assessed: 510000, market: 520000, landValue: 142000, improvementValue: 368000 },
          { year: 2023, assessed: 518000, market: 535000, landValue: 148000, improvementValue: 370000 },
          { year: 2024, assessed: 525000, market: 545000, landValue: 150000, improvementValue: 375000 }
        ],
        salesHistory: [
          { date: '2016-05-18', price: 455000 }
        ]
      },
      {
        id: '4',
        parcelId: 'P901234',
        address: '321 Cedar Dr, Richland, WA',
        neighborhood: 'North Richland',
        yearBuilt: 2015,
        squareFeet: 3800,
        valuationHistory: [
          { year: 2020, assessed: 575000, market: 590000, landValue: 160000, improvementValue: 415000 },
          { year: 2021, assessed: 595000, market: 610000, landValue: 165000, improvementValue: 430000 },
          { year: 2022, assessed: 610000, market: 625000, landValue: 172000, improvementValue: 438000 },
          { year: 2023, assessed: 618000, market: 650000, landValue: 178000, improvementValue: 440000 },
          { year: 2024, assessed: 625000, market: 665000, landValue: 180000, improvementValue: 445000 }
        ],
        salesHistory: [
          { date: '2019-08-22', price: 580000 },
          { date: '2015-02-10', price: 510000 }
        ]
      },
      {
        id: '5',
        parcelId: 'P567890',
        address: '987 Maple St, Kennewick, WA',
        neighborhood: 'West Kennewick',
        yearBuilt: 2001,
        squareFeet: 2300,
        valuationHistory: [
          { year: 2020, assessed: 345000, market: 355000, landValue: 95000, improvementValue: 250000 },
          { year: 2021, assessed: 360000, market: 370000, landValue: 100000, improvementValue: 260000 },
          { year: 2022, assessed: 375000, market: 385000, landValue: 105000, improvementValue: 270000 },
          { year: 2023, assessed: 385000, market: 395000, landValue: 108000, improvementValue: 277000 },
          { year: 2024, assessed: 395000, market: 408000, landValue: 110000, improvementValue: 285000 }
        ],
        salesHistory: [
          { date: '2017-07-03', price: 330000 },
          { date: '2008-04-19', price: 260000 }
        ]
      },
      {
        id: '6',
        parcelId: 'P112233',
        address: '555 Birch Blvd, Richland, WA',
        neighborhood: 'Central Richland',
        yearBuilt: 1995,
        squareFeet: 2800,
        valuationHistory: [
          { year: 2020, assessed: 405000, market: 415000, landValue: 110000, improvementValue: 295000 },
          { year: 2021, assessed: 420000, market: 435000, landValue: 115000, improvementValue: 305000 },
          { year: 2022, assessed: 440000, market: 455000, landValue: 120000, improvementValue: 320000 },
          { year: 2023, assessed: 465000, market: 480000, landValue: 125000, improvementValue: 340000 },
          { year: 2024, assessed: 485000, market: 500000, landValue: 130000, improvementValue: 355000 }
        ],
        salesHistory: [
          { date: '2014-09-10', price: 350000 },
          { date: '2005-05-22', price: 268000 }
        ]
      },
      {
        id: '7',
        parcelId: 'P445566',
        address: '222 Elm Way, Pasco, WA',
        neighborhood: 'West Pasco',
        yearBuilt: 2008,
        squareFeet: 2400,
        valuationHistory: [
          { year: 2020, assessed: 365000, market: 375000, landValue: 100000, improvementValue: 265000 },
          { year: 2021, assessed: 380000, market: 395000, landValue: 105000, improvementValue: 275000 },
          { year: 2022, assessed: 395000, market: 410000, landValue: 110000, improvementValue: 285000 },
          { year: 2023, assessed: 420000, market: 435000, landValue: 115000, improvementValue: 305000 },
          { year: 2024, assessed: 440000, market: 455000, landValue: 120000, improvementValue: 320000 }
        ],
        salesHistory: [
          { date: '2015-11-20', price: 340000 }
        ]
      }
    ];
    
    // Filter by neighborhood if specified
    let filteredData = valuationData;
    if (neighborhood) {
      filteredData = filteredData.filter(item => 
        item.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())
      );
    }
    
    // Filter by year built if specified
    if (yearBuilt) {
      const yearBuiltNum = parseInt(yearBuilt);
      if (!isNaN(yearBuiltNum)) {
        filteredData = filteredData.filter(item => item.yearBuilt >= yearBuiltNum);
      }
    }
    
    res.json(filteredData);
  });
  
  // Income approach functionality was removed

  // OpenAI powered natural language scripting routes
  
  // Generate JavaScript code from natural language
  app.post('/api/ai/generate-code', async (req, res) => {
    try {
      const { naturalLanguage, context } = req.body;
      
      if (!naturalLanguage) {
        return res.status(400).json({ error: 'Missing required parameter: naturalLanguage' });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' });
      }
      
      const result = await generateCodeFromLanguage(naturalLanguage, context);
      res.json(result);
    } catch (error) {
      console.error('Error generating code from natural language:', error);
      res.status(500).json({ error: 'Failed to generate code from natural language' });
    }
  });
  
  // Optimize JavaScript code
  // Income Approach API Endpoints
  // Hotel/Motel API endpoints
  app.get('/api/income-hotel-motels', async (req, res) => {
    try {
      const incomeHotelMotels = await storage.getIncomeHotelMotels();
      res.json(incomeHotelMotels);
    } catch (error) {
      console.error('Error getting hotel/motel data:', error);
      res.status(500).json({ error: 'Failed to get hotel/motel data' });
    }
  });

  app.get('/api/income-hotel-motel/:incomeYear/:supNum/:incomeId', async (req, res) => {
    try {
      const { incomeYear, supNum, incomeId } = req.params;
      const hotelMotel = await storage.getIncomeHotelMotelById(
        Number(incomeYear),
        Number(supNum),
        Number(incomeId)
      );

      if (!hotelMotel) {
        return res.status(404).json({ error: 'Hotel/motel data not found' });
      }

      res.json(hotelMotel);
    } catch (error) {
      console.error('Error getting hotel/motel data by ID:', error);
      res.status(500).json({ error: 'Failed to get hotel/motel data by ID' });
    }
  });

  app.post('/api/income-hotel-motel', async (req, res) => {
    try {
      const hotelMotelData = req.body;
      const result = await storage.createIncomeHotelMotel(hotelMotelData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating hotel/motel data:', error);
      res.status(500).json({ error: 'Failed to create hotel/motel data' });
    }
  });

  app.put('/api/income-hotel-motel/:incomeYear/:supNum/:incomeId', async (req, res) => {
    try {
      const { incomeYear, supNum, incomeId } = req.params;
      const hotelMotelData = req.body;
      
      const updatedHotelMotel = await storage.updateIncomeHotelMotel(
        Number(incomeYear),
        Number(supNum),
        Number(incomeId),
        hotelMotelData
      );

      if (!updatedHotelMotel) {
        return res.status(404).json({ error: 'Hotel/motel data not found' });
      }

      res.json(updatedHotelMotel);
    } catch (error) {
      console.error('Error updating hotel/motel data:', error);
      res.status(500).json({ error: 'Failed to update hotel/motel data' });
    }
  });

  app.delete('/api/income-hotel-motel/:incomeYear/:supNum/:incomeId', async (req, res) => {
    try {
      const { incomeYear, supNum, incomeId } = req.params;
      
      const success = await storage.deleteIncomeHotelMotel(
        Number(incomeYear),
        Number(supNum),
        Number(incomeId)
      );

      if (!success) {
        return res.status(404).json({ error: 'Hotel/motel data not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting hotel/motel data:', error);
      res.status(500).json({ error: 'Failed to delete hotel/motel data' });
    }
  });

  // Hotel/Motel Detail API endpoints
  app.get('/api/income-hotel-motel-details/:incomeYear/:supNum/:incomeId', async (req, res) => {
    try {
      const { incomeYear, supNum, incomeId } = req.params;
      const details = await storage.getIncomeHotelMotelDetails(
        Number(incomeYear),
        Number(supNum),
        Number(incomeId)
      );

      res.json(details);
    } catch (error) {
      console.error('Error getting hotel/motel details:', error);
      res.status(500).json({ error: 'Failed to get hotel/motel details' });
    }
  });

  app.get('/api/income-hotel-motel-detail/:incomeYear/:supNum/:incomeId/:valueType', async (req, res) => {
    try {
      const { incomeYear, supNum, incomeId, valueType } = req.params;
      const detail = await storage.getIncomeHotelMotelDetailByType(
        Number(incomeYear),
        Number(supNum),
        Number(incomeId),
        valueType
      );

      if (!detail) {
        return res.status(404).json({ error: 'Hotel/motel detail not found' });
      }

      res.json(detail);
    } catch (error) {
      console.error('Error getting hotel/motel detail by type:', error);
      res.status(500).json({ error: 'Failed to get hotel/motel detail by type' });
    }
  });

  app.post('/api/income-hotel-motel-detail', async (req, res) => {
    try {
      const detailData = req.body;
      const result = await storage.createIncomeHotelMotelDetail(detailData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating hotel/motel detail:', error);
      res.status(500).json({ error: 'Failed to create hotel/motel detail' });
    }
  });

  app.put('/api/income-hotel-motel-detail/:incomeYear/:supNum/:incomeId/:valueType', async (req, res) => {
    try {
      const { incomeYear, supNum, incomeId, valueType } = req.params;
      const detailData = req.body;
      
      const updatedDetail = await storage.updateIncomeHotelMotelDetail(
        Number(incomeYear),
        Number(supNum),
        Number(incomeId),
        valueType,
        detailData
      );

      if (!updatedDetail) {
        return res.status(404).json({ error: 'Hotel/motel detail not found' });
      }

      res.json(updatedDetail);
    } catch (error) {
      console.error('Error updating hotel/motel detail:', error);
      res.status(500).json({ error: 'Failed to update hotel/motel detail' });
    }
  });

  app.delete('/api/income-hotel-motel-detail/:incomeYear/:supNum/:incomeId/:valueType', async (req, res) => {
    try {
      const { incomeYear, supNum, incomeId, valueType } = req.params;
      
      const success = await storage.deleteIncomeHotelMotelDetail(
        Number(incomeYear),
        Number(supNum),
        Number(incomeId),
        valueType
      );

      if (!success) {
        return res.status(404).json({ error: 'Hotel/motel detail not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting hotel/motel detail:', error);
      res.status(500).json({ error: 'Failed to delete hotel/motel detail' });
    }
  });

  // Lease Up API endpoints
  app.get('/api/income-lease-ups', async (req, res) => {
    try {
      const leaseUps = await storage.getIncomeLeaseUps();
      res.json(leaseUps);
    } catch (error) {
      console.error('Error getting lease ups:', error);
      res.status(500).json({ error: 'Failed to get lease ups' });
    }
  });

  app.get('/api/income-lease-up/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const leaseUp = await storage.getIncomeLeaseUpById(Number(id));

      if (!leaseUp) {
        return res.status(404).json({ error: 'Lease up not found' });
      }

      res.json(leaseUp);
    } catch (error) {
      console.error('Error getting lease up by ID:', error);
      res.status(500).json({ error: 'Failed to get lease up by ID' });
    }
  });

  app.post('/api/income-lease-up', async (req, res) => {
    try {
      const leaseUpData = req.body;
      const result = await storage.createIncomeLeaseUp(leaseUpData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating lease up:', error);
      res.status(500).json({ error: 'Failed to create lease up' });
    }
  });

  app.put('/api/income-lease-up/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const leaseUpData = req.body;
      
      const updatedLeaseUp = await storage.updateIncomeLeaseUp(Number(id), leaseUpData);

      if (!updatedLeaseUp) {
        return res.status(404).json({ error: 'Lease up not found' });
      }

      res.json(updatedLeaseUp);
    } catch (error) {
      console.error('Error updating lease up:', error);
      res.status(500).json({ error: 'Failed to update lease up' });
    }
  });

  app.delete('/api/income-lease-up/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteIncomeLeaseUp(Number(id));

      if (!success) {
        return res.status(404).json({ error: 'Lease up not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting lease up:', error);
      res.status(500).json({ error: 'Failed to delete lease up' });
    }
  });

  // Lease Up Month Listing API endpoints
  app.get('/api/income-lease-up/:leaseUpId/month-listings', async (req, res) => {
    try {
      const { leaseUpId } = req.params;
      const monthListings = await storage.getIncomeLeaseUpMonthListings(Number(leaseUpId));
      res.json(monthListings);
    } catch (error) {
      console.error('Error getting lease up month listings:', error);
      res.status(500).json({ error: 'Failed to get lease up month listings' });
    }
  });

  app.get('/api/income-lease-up-month-listing/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const monthListing = await storage.getIncomeLeaseUpMonthListingById(Number(id));

      if (!monthListing) {
        return res.status(404).json({ error: 'Lease up month listing not found' });
      }

      res.json(monthListing);
    } catch (error) {
      console.error('Error getting lease up month listing by ID:', error);
      res.status(500).json({ error: 'Failed to get lease up month listing by ID' });
    }
  });

  app.post('/api/income-lease-up-month-listing', async (req, res) => {
    try {
      const monthListingData = req.body;
      const result = await storage.createIncomeLeaseUpMonthListing(monthListingData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating lease up month listing:', error);
      res.status(500).json({ error: 'Failed to create lease up month listing' });
    }
  });

  app.put('/api/income-lease-up-month-listing/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const monthListingData = req.body;
      
      const updatedMonthListing = await storage.updateIncomeLeaseUpMonthListing(Number(id), monthListingData);

      if (!updatedMonthListing) {
        return res.status(404).json({ error: 'Lease up month listing not found' });
      }

      res.json(updatedMonthListing);
    } catch (error) {
      console.error('Error updating lease up month listing:', error);
      res.status(500).json({ error: 'Failed to update lease up month listing' });
    }
  });

  app.delete('/api/income-lease-up-month-listing/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteIncomeLeaseUpMonthListing(Number(id));

      if (!success) {
        return res.status(404).json({ error: 'Lease up month listing not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting lease up month listing:', error);
      res.status(500).json({ error: 'Failed to delete lease up month listing' });
    }
  });

  app.post('/api/ai/optimize-code', async (req, res) => {
    try {
      const { code, instructions } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Missing required parameter: code' });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' });
      }
      
      const result = await optimizeCode(code, instructions);
      res.json(result);
    } catch (error) {
      console.error('Error optimizing code:', error);
      res.status(500).json({ error: 'Failed to optimize code' });
    }
  });
  
  // Debug JavaScript code
  app.post('/api/ai/debug-code', async (req, res) => {
    try {
      const { code, errorMessage } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Missing required parameter: code' });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' });
      }
      
      const result = await debugCode(code, errorMessage);
      res.json(result);
    } catch (error) {
      console.error('Error debugging code:', error);
      res.status(500).json({ error: 'Failed to debug code' });
    }
  });
  
  // ML-powered contextual property prediction
  app.post('/api/ml/contextual-prediction', async (req, res) => {
    try {
      const { property, context, mlPrediction, comparableProperties, includeExplanation } = req.body;
      
      if (!property || !context || !mlPrediction) {
        return res.status(400).json({ 
          error: 'Missing required parameters: property, context, and mlPrediction are required' 
        });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ 
          error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' 
        });
      }
      
      const result = await generateContextualPropertyPrediction(
        property, 
        context, 
        parseFloat(mlPrediction), 
        comparableProperties || []
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error generating contextual property prediction:', error);
      res.status(500).json({ error: 'Failed to generate contextual property prediction' });
    }
  });

  // AI-powered ETL Assistant endpoints
  
  // Get ETL assistance based on user interaction context
  app.post('/api/etl/assistant', async (req, res) => {
    try {
      const { context, dataSources, userExperience, previousInteractions } = req.body;
      
      if (!context || !context.page) {
        return res.status(400).json({ 
          error: 'Missing required parameter: context.page' 
        });
      }
      
      // We don't need to check if OpenAI is configured anymore as our implementation now handles this gracefully
      // with fallback responses in the getETLAssistance function
      
      try {
        const result = await getETLAssistance(
          context,
          dataSources || [],
          userExperience || 'beginner',
          previousInteractions || []
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error in ETL assistant:', error);
        
        // Return a user-friendly fallback response instead of an error
        res.json({
          message: "AI assistance is currently running in offline mode. Basic guidance is still available.",
          tips: [
            "You can continue using the ETL features with standard functionality.",
            "The system uses predefined guidance when AI assistance is unavailable.",
            "Try selecting specific data sources to get contextual tips about them."
          ],
          suggestedActions: [
            { 
              label: "Continue",
              description: "Proceed with basic assistance",
              action: "continue"
            },
            {
              label: "Learn ETL Basics",
              description: "Read documentation on ETL concepts",
              action: "learn_etl"
            }
          ],
          isFallbackMode: true
        });
      }
    } catch (error) {
      console.error('Error generating ETL assistance:', error);
      res.status(500).json({ 
        error: 'Failed to generate ETL assistance',
        message: "ETL Assistant is experiencing technical difficulties. Basic functionality is still available."
      });
    }
  });
  
  // Get ETL onboarding tips for specific features
  app.post('/api/etl/onboarding-tips', async (req, res) => {
    try {
      const { feature, userExperience } = req.body;
      
      if (!feature) {
        return res.status(400).json({ 
          error: 'Missing required parameter: feature' 
        });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ 
          error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' 
        });
      }
      
      const validFeatures = ['data_sources', 'transformation_rules', 'jobs', 'optimization', 'general'];
      
      if (!validFeatures.includes(feature)) {
        return res.status(400).json({
          error: `Invalid feature. Must be one of: ${validFeatures.join(', ')}`
        });
      }
      
      const result = await getETLOnboardingTips(
        feature as any,
        userExperience || 'beginner'
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error generating ETL onboarding tips:', error);
      res.status(500).json({ error: 'Failed to generate ETL onboarding tips' });
    }
  });
  
  // Generate connection troubleshooting suggestions
  app.post('/api/etl/connection-troubleshooting', async (req, res) => {
    try {
      const { dataSource, errorMessage } = req.body;
      
      if (!dataSource || !errorMessage) {
        return res.status(400).json({ 
          error: 'Missing required parameters: dataSource and errorMessage' 
        });
      }
      
      if (!isOpenAIConfigured()) {
        return res.status(500).json({ 
          error: 'OpenAI API is not configured. Please set the OPENAI_API_KEY environment variable.' 
        });
      }
      
      const result = await generateConnectionTroubleshooting(
        dataSource,
        errorMessage
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error generating connection troubleshooting suggestions:', error);
      res.status(500).json({ error: 'Failed to generate connection troubleshooting suggestions' });
    }
  });

  // ETL Data Sources endpoints
  app.get('/api/etl/data-sources', async (req, res) => {
    try {
      const dataSources = await storage.getEtlDataSources();
      res.json(dataSources);
    } catch (error: any) {
      console.error('Error fetching ETL data sources:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL data sources' });
    }
  });

  app.get('/api/etl/data-sources/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getEtlDataSourceById(id);
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      res.json(dataSource);
    } catch (error: any) {
      console.error('Error fetching ETL data source:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL data source' });
    }
  });

  app.post('/api/etl/data-sources', async (req, res) => {
    try {
      const dataSource = req.body;
      const newDataSource = await storage.createEtlDataSource(dataSource);
      res.status(201).json(newDataSource);
    } catch (error: any) {
      console.error('Error creating ETL data source:', error);
      res.status(500).json({ error: error.message || 'Failed to create ETL data source' });
    }
  });

  app.put('/api/etl/data-sources/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = req.body;
      const updatedDataSource = await storage.updateEtlDataSource(id, dataSource);
      
      if (!updatedDataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      res.json(updatedDataSource);
    } catch (error: any) {
      console.error('Error updating ETL data source:', error);
      res.status(500).json({ error: error.message || 'Failed to update ETL data source' });
    }
  });

  app.delete('/api/etl/data-sources/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const success = await storage.deleteEtlDataSource(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting ETL data source:', error);
      res.status(500).json({ error: error.message || 'Failed to delete ETL data source' });
    }
  });
  
  // Connection testing endpoint for ETL data sources
  app.post('/api/etl/data-sources/:id/test', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getEtlDataSourceById(id);
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      // Test the connection based on the data source type
      let testResult: {
        success: boolean;
        message: string;
        latencyMs?: number;
        metadata?: any;
      };
      
      const startTime = Date.now();
      
      // In a real application, we would attempt an actual connection
      // to the data source. For this demo, we'll simulate connections.
      switch (dataSource.type) {
        case 'database':
          // Simulate database connection test
          if (dataSource.connectionDetails && 
              dataSource.connectionDetails.host && 
              dataSource.connectionDetails.database) {
            testResult = {
              success: true,
              message: `Successfully connected to database '${dataSource.connectionDetails.database}' on host '${dataSource.connectionDetails.host}'`,
              latencyMs: Date.now() - startTime,
              metadata: {
                version: '14.5',
                tables: ['properties', 'users', 'transactions'],
                connection: 'active'
              }
            };
          } else {
            testResult = {
              success: false,
              message: 'Invalid database connection details',
              latencyMs: Date.now() - startTime
            };
          }
          break;
          
        case 'api':
          // Simulate API connection test
          if (dataSource.connectionDetails && 
              dataSource.connectionDetails.url) {
            testResult = {
              success: true,
              message: `Successfully connected to API at '${dataSource.connectionDetails.url}'`,
              latencyMs: Date.now() - startTime,
              metadata: {
                endpoints: ['/data', '/properties', '/users'],
                version: 'v2.1',
                supportedFormats: ['json', 'xml']
              }
            };
          } else {
            testResult = {
              success: false,
              message: 'Invalid API connection details',
              latencyMs: Date.now() - startTime
            };
          }
          break;
          
        case 'file':
          // Simulate file connection test
          if (dataSource.connectionDetails && 
              dataSource.connectionDetails.path) {
            testResult = {
              success: true,
              message: `Successfully accessed file at '${dataSource.connectionDetails.path}'`,
              latencyMs: Date.now() - startTime,
              metadata: {
                size: '1.2MB',
                format: dataSource.connectionDetails.format || 'csv',
                lastModified: new Date().toISOString()
              }
            };
          } else {
            testResult = {
              success: false,
              message: 'Invalid file path or format',
              latencyMs: Date.now() - startTime
            };
          }
          break;
          
        case 'memory':
          // Simulate in-memory data source test
          testResult = {
            success: true,
            message: 'Successfully connected to in-memory data source',
            latencyMs: Date.now() - startTime,
            metadata: {
              records: 1000,
              inUse: true
            }
          };
          break;
          
        default:
          testResult = {
            success: false,
            message: `Unsupported data source type: ${dataSource.type}`,
            latencyMs: Date.now() - startTime
          };
      }
      
      // Update the data source connection status
      await storage.updateEtlDataSource(id, {
        isConnected: testResult.success,
        lastConnected: testResult.success ? new Date() : undefined
      });
      
      res.json(testResult);
    } catch (error: any) {
      console.error('Error testing ETL data source connection:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to test data source connection',
        error: error.message
      });
    }
  });
  
  // Schema detection endpoint for ETL data sources
  app.get('/api/etl/data-sources/:id/schema', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getEtlDataSourceById(id);
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      // In a real application, we would connect to the data source
      // and introspect its schema. For this demo, we'll simulate schema detection.
      let schemaResult: {
        tables?: string[];
        fields?: { name: string; type: string; nullable: boolean }[];
        error?: string;
      };
      
      switch (dataSource.type) {
        case 'database':
          schemaResult = {
            tables: ['properties', 'users', 'transactions', 'neighborhoods', 'analytics'],
            fields: [
              { name: 'id', type: 'integer', nullable: false },
              { name: 'parcel_id', type: 'string', nullable: false },
              { name: 'address', type: 'string', nullable: false },
              { name: 'value', type: 'decimal', nullable: true },
              { name: 'square_feet', type: 'integer', nullable: true },
              { name: 'year_built', type: 'integer', nullable: true },
              { name: 'last_updated', type: 'timestamp', nullable: false }
            ]
          };
          break;
          
        case 'api':
          schemaResult = {
            fields: [
              { name: 'id', type: 'string', nullable: false },
              { name: 'property_id', type: 'string', nullable: false },
              { name: 'location', type: 'object', nullable: false },
              { name: 'attributes', type: 'object', nullable: true },
              { name: 'created_at', type: 'string', nullable: false },
              { name: 'updated_at', type: 'string', nullable: false }
            ]
          };
          break;
          
        case 'file':
          const format = dataSource.connectionDetails?.format || 'csv';
          if (format === 'csv' || format === 'excel') {
            schemaResult = {
              fields: [
                { name: 'ID', type: 'string', nullable: false },
                { name: 'Address', type: 'string', nullable: false },
                { name: 'City', type: 'string', nullable: false },
                { name: 'State', type: 'string', nullable: false },
                { name: 'ZIP', type: 'string', nullable: false },
                { name: 'Value', type: 'number', nullable: true },
                { name: 'YearBuilt', type: 'number', nullable: true },
                { name: 'LastSale', type: 'date', nullable: true }
              ]
            };
          } else if (format === 'json') {
            schemaResult = {
              fields: [
                { name: 'id', type: 'string', nullable: false },
                { name: 'address', type: 'object', nullable: false },
                { name: 'valuation', type: 'object', nullable: true },
                { name: 'details', type: 'object', nullable: true },
                { name: 'history', type: 'array', nullable: true }
              ]
            };
          } else {
            schemaResult = {
              error: `Schema detection not supported for format: ${format}`
            };
          }
          break;
          
        case 'memory':
          schemaResult = {
            fields: [
              { name: 'id', type: 'number', nullable: false },
              { name: 'name', type: 'string', nullable: false },
              { name: 'properties', type: 'array', nullable: true },
              { name: 'created', type: 'date', nullable: false }
            ]
          };
          break;
          
        default:
          schemaResult = {
            error: `Schema detection not supported for type: ${dataSource.type}`
          };
      }
      
      res.json(schemaResult);
    } catch (error: any) {
      console.error('Error detecting ETL data source schema:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to detect data source schema'
      });
    }
  });
  
  // Data preview endpoint for ETL data sources
  app.get('/api/etl/data-sources/:id/preview', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getEtlDataSourceById(id);
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      // This would normally connect to the actual data source and pull a sample
      // For demo purposes, we're generating sample data based on the data source type
      
      let previewData: {
        columns: string[];
        rows: any[][];
        totalRows: number;
      };
      
      // Generate different sample data based on the type of data source
      switch (dataSource.type) {
        case 'postgres':
        case 'mysql':
          previewData = {
            columns: ['id', 'property_id', 'address', 'value', 'last_updated'],
            rows: [
              [1, 1001, '123 Main St', 349000, '2023-01-15'],
              [2, 1002, '456 Oak Ave', 425000, '2023-01-16'],
              [3, 1003, '789 Pine Rd', 512000, '2023-01-17'],
              [4, 1004, '321 Cedar Ln', 275000, '2023-01-18'],
              [5, 1005, '654 Maple Dr', 590000, '2023-01-19'],
            ],
            totalRows: 5000 // In a real implementation, this would be the actual count
          };
          break;
          
        case 'api':
          previewData = {
            columns: ['id', 'parcel_id', 'location', 'assessed_value', 'tax_year', 'land_size'],
            rows: [
              ['A1', 'P-10023', { lat: 46.23, lng: -119.51 }, 280000, 2023, 0.25],
              ['A2', 'P-10024', { lat: 46.24, lng: -119.52 }, 320000, 2023, 0.33],
              ['A3', 'P-10025', { lat: 46.25, lng: -119.53 }, 295000, 2023, 0.28],
              ['A4', 'P-10026', { lat: 46.26, lng: -119.54 }, 410000, 2023, 0.5],
            ],
            totalRows: 2500
          };
          break;
          
        case 'csv':
        case 'excel':
          previewData = {
            columns: ['PropertyID', 'Address', 'City', 'State', 'ZIP', 'Value', 'YearBuilt', 'SquareFeet'],
            rows: [
              ['BC12345', '789 Washington Blvd', 'Richland', 'WA', '99352', 450000, 1985, 2400],
              ['BC12346', '456 Jefferson St', 'Kennewick', 'WA', '99336', 380000, 1992, 1950],
              ['BC12347', '123 Lincoln Ave', 'Pasco', 'WA', '99301', 325000, 2005, 1800],
              ['BC12348', '321 Roosevelt Dr', 'Richland', 'WA', '99352', 520000, 2010, 2800],
              ['BC12349', '654 Adams Ct', 'Kennewick', 'WA', '99336', 410000, 1998, 2100],
              ['BC12350', '987 Monroe Way', 'Pasco', 'WA', '99301', 295000, 1978, 1650],
            ],
            totalRows: 3200
          };
          break;
          
        default:
          previewData = {
            columns: ['Column1', 'Column2', 'Column3'],
            rows: [
              ['No preview available for this data source type.', '', ''],
            ],
            totalRows: 0
          };
      }
      
      res.json(previewData);
    } catch (error: any) {
      console.error('Error generating data preview:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to generate data preview',
        columns: ['Error'],
        rows: [['An error occurred while previewing data']],
        totalRows: 1
      });
    }
  });
  
  // Transformation endpoint for applying transformations to data
  app.post('/api/etl/transform', async (req, res) => {
    try {
      const { data, transformationRuleIds, options } = req.body;
      
      if (!data || !data.columns || !data.rows || !transformationRuleIds) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required parameters: data (columns, rows) and transformationRuleIds',
          logs: ['Validation error: Missing required parameters']
        });
      }
      
      // Get the transformation rules
      const transformationRules = [];
      for (const ruleId of transformationRuleIds) {
        const id = parseInt(ruleId);
        if (isNaN(id)) {
          return res.status(400).json({ 
            success: false,
            error: 'Invalid transformation rule ID',
            logs: [`Validation error: Invalid transformation rule ID: ${ruleId}`]
          });
        }
        
        const rule = await storage.getEtlTransformationRuleById(id);
        if (!rule) {
          return res.status(400).json({ 
            success: false,
            error: `Transformation rule not found: ${id}`,
            logs: [`Error: Transformation rule not found: ${id}`]
          });
        }
        
        transformationRules.push(rule);
      }
      
      // Start transformation context
      const context = {
        sourceColumns: [...data.columns],
        sourceRows: data.rows.map(row => [...row]), // Deep copy
        transformedColumns: [...data.columns],
        transformedRows: data.rows.map(row => [...row]), // Deep copy
        logs: ['Starting transformations'],
        metrics: {
          startTime: Date.now(),
          totalRowsProcessed: data.rows.length,
          successfulTransformations: 0,
          failedTransformations: 0
        }
      };
      
      // Apply each transformation rule
      for (const rule of transformationRules) {
        try {
          if (!rule.isActive) {
            context.logs.push(`Skipping inactive transformation rule: ${rule.name}`);
            continue;
          }
          
          context.logs.push(`Applying transformation rule: ${rule.name}`);
          
          // Execute the transformation code safely using the transformation utilities
          // In a real implementation, we'd have a more robust way to execute transformation code
          // For demo purposes, we'll apply built-in transformations based on rule name
          
          if (rule.name.includes('Fill Missing')) {
            // Apply fill missing values transformation
            const targetFieldMatch = rule.name.match(/Fill Missing Values \((.+)\)/);
            const targetField = targetFieldMatch ? targetFieldMatch[1] : '';
            const targetFieldIndex = context.transformedColumns.indexOf(targetField);
            
            if (targetFieldIndex === -1) {
              context.logs.push(`Warning: Target field "${targetField}" not found, skipping transformation`);
              continue;
            }
            
            let filledCount = 0;
            context.transformedRows.forEach(row => {
              if (row[targetFieldIndex] === null || row[targetFieldIndex] === undefined || row[targetFieldIndex] === '') {
                const defaultValue = rule.transformationCode.includes('defaultValue') ? 
                  JSON.parse(rule.transformationCode).defaultValue : 
                  'N/A';
                
                row[targetFieldIndex] = defaultValue;
                filledCount++;
              }
            });
            
            context.logs.push(`Filled ${filledCount} missing values in field "${targetField}"`);
            context.metrics.successfulTransformations++;
          }
          else if (rule.name.includes('Format Date')) {
            // Apply date formatting transformation
            const fieldMatch = rule.name.match(/Format Date \((.+)\)/);
            const field = fieldMatch ? fieldMatch[1] : '';
            const fieldIndex = context.transformedColumns.indexOf(field);
            
            if (fieldIndex === -1) {
              context.logs.push(`Warning: Field "${field}" not found, skipping transformation`);
              continue;
            }
            
            let formattedCount = 0;
            context.transformedRows.forEach(row => {
              try {
                const dateValue = row[fieldIndex];
                if (dateValue) {
                  const date = new Date(dateValue);
                  if (!isNaN(date.getTime())) {
                    // Format date as ISO string or a specific format based on transformation code
                    row[fieldIndex] = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    formattedCount++;
                  }
                }
              } catch (e) {
                // Log the error but continue processing
                context.logs.push(`Error formatting date: ${e}`);
              }
            });
            
            context.logs.push(`Formatted ${formattedCount} dates in field "${field}"`);
            context.metrics.successfulTransformations++;
          }
          else if (rule.name.includes('Number Format')) {
            // Apply number formatting transformation
            const fieldMatch = rule.name.match(/Number Format \((.+)\)/);
            const field = fieldMatch ? fieldMatch[1] : '';
            const fieldIndex = context.transformedColumns.indexOf(field);
            
            if (fieldIndex === -1) {
              context.logs.push(`Warning: Field "${field}" not found, skipping transformation`);
              continue;
            }
            
            let formattedCount = 0;
            context.transformedRows.forEach(row => {
              try {
                const value = row[fieldIndex];
                if (value !== null && value !== undefined && value !== '') {
                  const num = Number(value);
                  if (!isNaN(num)) {
                    // Format number with 2 decimal places or based on transformation code
                    row[fieldIndex] = num.toFixed(2);
                    formattedCount++;
                  }
                }
              } catch (e) {
                context.logs.push(`Error formatting number: ${e}`);
              }
            });
            
            context.logs.push(`Formatted ${formattedCount} numbers in field "${field}"`);
            context.metrics.successfulTransformations++;
          }
          else if (rule.name.includes('Text Case')) {
            // Apply text case transformation
            const fieldMatch = rule.name.match(/Text Case \((.+)\)/);
            const field = fieldMatch ? fieldMatch[1] : '';
            const fieldIndex = context.transformedColumns.indexOf(field);
            
            if (fieldIndex === -1) {
              context.logs.push(`Warning: Field "${field}" not found, skipping transformation`);
              continue;
            }
            
            const caseType = rule.transformationCode.includes('caseType') ? 
              JSON.parse(rule.transformationCode).caseType : 
              'upper';
              
            let transformedCount = 0;
            context.transformedRows.forEach(row => {
              try {
                const value = row[fieldIndex];
                if (typeof value === 'string') {
                  switch (caseType) {
                    case 'upper':
                      row[fieldIndex] = value.toUpperCase();
                      break;
                    case 'lower':
                      row[fieldIndex] = value.toLowerCase();
                      break;
                    case 'title':
                      row[fieldIndex] = value
                        .toLowerCase()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                      break;
                    default:
                      // No change
                      break;
                  }
                  transformedCount++;
                }
              } catch (e) {
                context.logs.push(`Error transforming text case: ${e}`);
              }
            });
            
            context.logs.push(`Transformed case for ${transformedCount} values in field "${field}"`);
            context.metrics.successfulTransformations++;
          }
          else {
            // For complex or custom transformations, we'd evaluate the code safely
            // For demo purposes, we'll just log a message
            context.logs.push(`Custom transformation "${rule.name}" applied (simulated)`);
            context.metrics.successfulTransformations++;
          }
        } catch (ruleError) {
          context.logs.push(`Error applying transformation rule "${rule.name}": ${ruleError}`);
          context.metrics.failedTransformations++;
        }
      }
      
      // Complete the transformation context
      context.metrics.endTime = Date.now();
      context.metrics.processingTimeMs = context.metrics.endTime - context.metrics.startTime;
      
      // Return the transformation result
      res.json({
        success: context.metrics.failedTransformations === 0,
        data: {
          columns: context.transformedColumns,
          rows: context.transformedRows,
          totalRows: context.transformedRows.length
        },
        metrics: {
          processingTimeMs: context.metrics.processingTimeMs,
          successRate: context.metrics.totalRowsProcessed > 0 ? 
            (context.metrics.successfulTransformations / transformationRules.length) * 100 : 
            100,
          errorRate: context.metrics.totalRowsProcessed > 0 ? 
            (context.metrics.failedTransformations / transformationRules.length) * 100 : 
            0
        },
        logs: context.logs
      });
    } catch (error: any) {
      console.error('Error transforming data:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to transform data',
        logs: ['Error transforming data', error.message || 'Unknown error']
      });
    }
  });
  
  // Test transformation rule endpoint
  app.post('/api/etl/transformation-rules/test', async (req, res) => {
    try {
      const { rule, sampleData } = req.body;
      
      if (!rule || !rule.dataType || !rule.transformationCode || !sampleData || !Array.isArray(sampleData)) {
        return res.status(400).json({ 
          success: false,
          results: [],
          errors: ['Missing required parameters: rule (dataType, transformationCode) and sampleData']
        });
      }
      
      // Process the sample data with the transformation rule
      const results = [];
      const errors = [];
      
      try {
        // Apply the transformation to each sample
        sampleData.forEach((sample, index) => {
          try {
            // For demo purposes, we'll apply simple transformations based on data type
            let result;
            
            switch (rule.dataType) {
              case 'text':
                if (rule.transformationCode.includes('toUpperCase')) {
                  result = String(sample).toUpperCase();
                } else if (rule.transformationCode.includes('toLowerCase')) {
                  result = String(sample).toLowerCase();
                } else if (rule.transformationCode.includes('trim')) {
                  result = String(sample).trim();
                } else {
                  result = sample; // No transformation
                }
                break;
                
              case 'number':
                const num = Number(sample);
                if (isNaN(num)) {
                  throw new Error('Invalid number format');
                }
                
                if (rule.transformationCode.includes('toFixed')) {
                  const precision = 2; // Default
                  result = num.toFixed(precision);
                } else if (rule.transformationCode.includes('round')) {
                  result = Math.round(num);
                } else if (rule.transformationCode.includes('floor')) {
                  result = Math.floor(num);
                } else if (rule.transformationCode.includes('ceil')) {
                  result = Math.ceil(num);
                } else {
                  result = num; // No transformation
                }
                break;
                
              case 'date':
                const date = new Date(sample);
                if (isNaN(date.getTime())) {
                  throw new Error('Invalid date format');
                }
                
                if (rule.transformationCode.includes('toISOString')) {
                  result = date.toISOString();
                } else if (rule.transformationCode.includes('toLocaleDateString')) {
                  result = date.toLocaleDateString();
                } else {
                  result = date.toISOString(); // Default transformation
                }
                break;
                
              default:
                result = sample; // No transformation for unknown data types
            }
            
            results.push(result);
          } catch (sampleError) {
            errors.push(`Error processing sample at index ${index}: ${sampleError}`);
            results.push(null); // Add null for failed transformations
          }
        });
      } catch (transformError) {
        errors.push(`Error applying transformation: ${transformError}`);
      }
      
      res.json({
        success: errors.length === 0,
        results,
        errors
      });
    } catch (error: any) {
      console.error('Error testing transformation rule:', error);
      res.status(500).json({ 
        success: false,
        results: [],
        errors: [error.message || 'Failed to test transformation rule']
      });
    }
  });
  
  // Transformation rule suggestion endpoint based on data quality issues
  app.post('/api/etl/suggest-transformations', async (req, res) => {
    try {
      const { issues, sampleData } = req.body;
      
      if (!issues || !Array.isArray(issues) || !sampleData || !sampleData.columns || !sampleData.rows) {
        return res.status(400).json({ 
          success: false,
          suggestions: []
        });
      }
      
      // Generate transformation suggestions based on data quality issues
      const suggestions = [];
      
      issues.forEach(issue => {
        const field = issue.field;
        const issueLower = issue.issue.toLowerCase();
        
        // Check for common issues and suggest appropriate transformations
        if (issueLower.includes('missing') || issueLower.includes('null') || issueLower.includes('empty')) {
          suggestions.push({
            name: `Fill Missing Values (${field})`,
            description: `Fill missing values in ${field} with default or calculated values`,
            dataType: 'text',
            transformationCode: JSON.stringify({
              operation: 'fill_missing_values',
              defaultValue: 'N/A'
            }),
            targetIssue: {
              field,
              issue: issue.issue
            }
          });
        }
        else if (issueLower.includes('date') && 
                (issueLower.includes('format') || issueLower.includes('invalid') || issueLower.includes('inconsistent'))) {
          suggestions.push({
            name: `Format Date (${field})`,
            description: `Standardize date format in ${field} to ISO format (YYYY-MM-DD)`,
            dataType: 'date',
            transformationCode: JSON.stringify({
              operation: 'format_date',
              format: 'YYYY-MM-DD'
            }),
            targetIssue: {
              field,
              issue: issue.issue
            }
          });
        }
        else if ((issueLower.includes('number') || issueLower.includes('decimal') || issueLower.includes('numeric')) && 
                (issueLower.includes('format') || issueLower.includes('precision') || issueLower.includes('round'))) {
          suggestions.push({
            name: `Number Format (${field})`,
            description: `Format numeric values in ${field} with consistent precision (2 decimal places)`,
            dataType: 'number',
            transformationCode: JSON.stringify({
              operation: 'number_format',
              precision: 2
            }),
            targetIssue: {
              field,
              issue: issue.issue
            }
          });
        }
        else if (issueLower.includes('case') || 
                (issueLower.includes('text') && issueLower.includes('consistent'))) {
          suggestions.push({
            name: `Text Case (${field})`,
            description: `Standardize text case in ${field} to title case for consistency`,
            dataType: 'text',
            transformationCode: JSON.stringify({
              operation: 'text_case',
              caseType: 'title'
            }),
            targetIssue: {
              field,
              issue: issue.issue
            }
          });
        }
        else if (issueLower.includes('duplicate')) {
          suggestions.push({
            name: `Remove Duplicates`,
            description: `Remove duplicate records based on key fields including ${field}`,
            dataType: 'special',
            transformationCode: JSON.stringify({
              operation: 'remove_duplicates',
              keyFields: [field]
            }),
            targetIssue: {
              field,
              issue: issue.issue
            }
          });
        }
      });
      
      res.json({
        success: true,
        suggestions
      });
    } catch (error: any) {
      console.error('Error suggesting transformations:', error);
      res.status(500).json({ 
        success: false,
        suggestions: [],
        error: error.message || 'Failed to generate transformation suggestions'
      });
    }
  });
  
  // Data quality analysis endpoint for ETL data sources
  app.get('/api/etl/data-sources/:id/quality', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getEtlDataSourceById(id);
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      
      // This would normally connect to the actual data source and analyze its data quality
      // For demo purposes, we're generating quality analysis results based on the data source type
      
      // Define the quality analysis interface
      interface DataQualityItem {
        field: string;
        issue: string;
        severity: 'low' | 'medium' | 'high';
        recommendation: string;
      }
      
      interface DataQualityAnalysis {
        totalIssues: number;
        completeness: number;
        accuracy: number;
        consistency: number;
        issues: DataQualityItem[];
        summary: string;
        aiRecommendations?: string[];
      }
      
      let qualityAnalysis: DataQualityAnalysis;
      
      // Generate different quality analysis based on the type of data source
      switch (dataSource.type) {
        case 'postgres':
        case 'mysql':
          qualityAnalysis = {
            totalIssues: 3,
            completeness: 94,
            accuracy: 88,
            consistency: 92,
            issues: [
              {
                field: 'address',
                issue: 'Found 128 records with incomplete or malformed address data',
                severity: 'medium',
                recommendation: 'Apply address standardization transformation to normalize address formats'
              },
              {
                field: 'last_updated',
                issue: 'Found 56 records with future dates',
                severity: 'high',
                recommendation: 'Add date validation rule to prevent invalid dates'
              },
              {
                field: 'value',
                issue: 'Found 212 records with outlier values (>3 std. dev. from mean)',
                severity: 'low',
                recommendation: 'Review outlier detection parameters and add validation rule'
              }
            ],
            summary: 'Database quality analysis detected several issues with data consistency and completeness. Address formatting issues and date validation errors should be addressed before using this data source in production.'
          };
          break;
          
        case 'api':
          qualityAnalysis = {
            totalIssues: 2,
            completeness: 96,
            accuracy: 91,
            consistency: 89,
            issues: [
              {
                field: 'location',
                issue: 'Found 45 records with coordinates outside the expected region bounds',
                severity: 'medium',
                recommendation: 'Add geospatial validation rule to flag coordinates outside the county boundary'
              },
              {
                field: 'assessed_value',
                issue: 'Found inconsistent value formats and potential currency conversion issues',
                severity: 'high',
                recommendation: 'Implement currency standardization in the transformation pipeline'
              }
            ],
            summary: 'API data source has good completeness but shows some inconsistency in location data and value formatting. Adding proper validation rules would significantly improve data quality.'
          };
          break;
          
        case 'csv':
        case 'excel':
          qualityAnalysis = {
            totalIssues: 4,
            completeness: 87,
            accuracy: 82,
            consistency: 78,
            issues: [
              {
                field: 'PropertyID',
                issue: 'Found 18 duplicate PropertyID values',
                severity: 'high',
                recommendation: 'Add deduplication step in the transformation pipeline'
              },
              {
                field: 'ZIP',
                issue: 'Found 124 records with invalid or incomplete ZIP codes',
                severity: 'medium',
                recommendation: 'Implement ZIP code validation and standardization'
              },
              {
                field: 'YearBuilt',
                issue: 'Found 56 records with YearBuilt in the future',
                severity: 'medium',
                recommendation: 'Add date validation to prevent future years'
              },
              {
                field: 'Value',
                issue: 'Found 211 null or zero values',
                severity: 'high',
                recommendation: 'Add data completeness check and implement fallback value estimation'
              }
            ],
            summary: 'The CSV data source has significant data quality issues including duplicate IDs, invalid ZIP codes, and missing values. Implementing the recommended transformations would improve data quality by approximately 15%.'
          };
          break;
          
        default:
          qualityAnalysis = {
            totalIssues: 0,
            completeness: 0,
            accuracy: 0,
            consistency: 0,
            issues: [],
            summary: 'Unable to analyze data quality for this source type. Please connect to the data source and try again.'
          };
      }
      
      // If OpenAI is configured, enhance analysis with AI insights
      if (isOpenAIConfigured()) {
        try {
          // Create a sample of data for analysis
          const dataSample = {
            columns: ['id', 'address', 'value', 'yearBuilt', 'parcelId'],
            rows: [
              [1, '123 Main St', 450000, 2008, 'P123456'],
              [2, '456 Oak Ave', 375000, 2004, 'P789012'],
              [3, '789 Pine Ln', 525000, 2012, 'P345678'],
              [4, '321 Cedar Dr', 625000, 2015, 'P901234'],
              [5, '987 Maple St', 395000, 2001, 'P567890']
            ]
          };
          
          // Call OpenAI for enhanced analysis
          const aiAnalysis = await analyzeDataQuality(
            dataSource.name,
            dataSource.type,
            dataSample,
            qualityAnalysis.issues
          );
          
          // Add AI-powered insights to the response
          qualityAnalysis.summary = aiAnalysis.enhancedSummary;
          qualityAnalysis.aiRecommendations = aiAnalysis.additionalRecommendations;
        } catch (aiError) {
          console.error('Error getting AI-powered data quality insights:', aiError);
          // Continue with basic analysis if AI enhancement fails
        }
      }
      
      res.json(qualityAnalysis);
    } catch (error: any) {
      console.error('Error analyzing data quality:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to analyze data quality',
        totalIssues: 0,
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        issues: [],
        summary: 'An error occurred while analyzing data quality'
      });
    }
  });

  // API endpoint for direct data quality analysis
  app.post('/api/etl/analyze-data-quality', async (req, res) => {
    try {
      // Extract the sample data from the request body
      const { name, type, columns, rows } = req.body;
      
      if (!name || !type || !columns || !rows) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, type, columns, rows',
          totalIssues: 0,
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          issues: [],
          summary: 'Invalid request parameters'
        });
      }
      
      // Simple validation of the data
      if (!Array.isArray(columns) || !Array.isArray(rows)) {
        return res.status(400).json({ 
          error: 'Columns and rows must be arrays',
          totalIssues: 0,
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          issues: [],
          summary: 'Invalid data format'
        });
      }
      
      // Perform basic data quality analysis
      const qualityIssues = [];
      let completeness = 100;
      let accuracy = 100;
      let consistency = 100;
      
      // Check for basic data quality issues
      const rowCount = rows.length;
      if (rowCount > 0) {
        // Column completeness
        let missingValueCount = 0;
        let totalFields = 0;
        let numericIssues = 0;
        let dateIssues = 0;
        let duplicateValues: { [key: string]: number } = {};
        
        rows.forEach(row => {
          if (row.length !== columns.length) {
            qualityIssues.push({
              field: 'all',
              issue: 'Row length does not match column count',
              severity: 'high',
              recommendation: 'Ensure all rows have the same number of fields as columns'
            });
            consistency -= 10;
          }
          
          // Track primary key values for duplicate detection
          if (columns.includes('id') || columns.includes('ID') || columns.includes('Id')) {
            const idIndex = columns.findIndex(col => col.toLowerCase() === 'id');
            if (idIndex >= 0 && row[idIndex]) {
              const idValue = String(row[idIndex]);
              duplicateValues[idValue] = (duplicateValues[idValue] || 0) + 1;
            }
          }
          
          row.forEach((value: any, index: number) => {
            totalFields++;
            const columnName = columns[index] || `column${index}`;
            
            // Check for missing values
            if (value === null || value === undefined || value === '') {
              missingValueCount++;
              qualityIssues.push({
                field: columnName,
                issue: `Found missing value in ${columnName}`,
                severity: 'medium',
                recommendation: `Add data validation for ${columnName} to ensure completeness`
              });
            } 
            // Check for numeric column issues
            else if (columnName.toLowerCase().includes('value') || 
                    columnName.toLowerCase().includes('price') || 
                    columnName.toLowerCase().includes('area') || 
                    columnName.toLowerCase().includes('feet')) {
              
              const numVal = Number(value);
              if (isNaN(numVal)) {
                numericIssues++;
                qualityIssues.push({
                  field: columnName,
                  issue: `Non-numeric value found in numeric column ${columnName}`,
                  severity: 'high',
                  recommendation: `Add numeric validation for ${columnName}`
                });
                accuracy -= 5;
              } else if (numVal < 0) {
                numericIssues++;
                qualityIssues.push({
                  field: columnName,
                  issue: `Negative value found in ${columnName}: ${value}`,
                  severity: 'medium',
                  recommendation: `Add range validation for ${columnName} to ensure positive values`
                });
                accuracy -= 3;
              }
            }
            // Check for date column issues
            else if (columnName.toLowerCase().includes('date') || 
                    columnName.toLowerCase().includes('year') || 
                    columnName.toLowerCase().includes('time')) {
              
              if (columnName.toLowerCase().includes('year')) {
                const yearVal = Number(value);
                const currentYear = new Date().getFullYear();
                
                if (!isNaN(yearVal) && yearVal > currentYear) {
                  dateIssues++;
                  qualityIssues.push({
                    field: columnName,
                    issue: `Future year found in ${columnName}: ${value}`,
                    severity: 'medium',
                    recommendation: `Add date validation for ${columnName} to prevent future dates`
                  });
                  accuracy -= 2;
                }
              }
              // Add more date validation if needed
            }
          });
        });
        
        // Check for duplicate IDs
        const duplicateIDs = Object.entries(duplicateValues)
          .filter(([_, count]) => count > 1)
          .map(([id]) => id);
          
        if (duplicateIDs.length > 0) {
          qualityIssues.push({
            field: 'id',
            issue: `Found ${duplicateIDs.length} duplicate ID values`,
            severity: 'high',
            recommendation: 'Add uniqueness constraint on ID fields and implement deduplication logic'
          });
          consistency -= 15;
        }
        
        // Calculate final metrics
        if (totalFields > 0) {
          const missingPercentage = (missingValueCount / totalFields) * 100;
          completeness = Math.max(0, 100 - missingPercentage);
          
          // Adjust accuracy based on issues found
          if (numericIssues > 0 || dateIssues > 0) {
            accuracy = Math.max(50, accuracy - (numericIssues + dateIssues) * 3);
          }
          
          if (missingPercentage > 5) {
            qualityIssues.push({
              field: 'multiple',
              issue: `Found ${missingValueCount} missing values (${missingPercentage.toFixed(1)}%)`,
              severity: missingPercentage > 20 ? 'high' : missingPercentage > 10 ? 'medium' : 'low',
              recommendation: 'Add data validation rules to ensure data completeness'
            });
          }
        }
      } else {
        completeness = 0;
        accuracy = 0;
        consistency = 0;
        qualityIssues.push({
          field: 'all',
          issue: 'No data rows provided',
          severity: 'high',
          recommendation: 'Provide sample data rows for analysis'
        });
      }
      
      // Initial quality analysis result
      const qualityAnalysis: {
        totalIssues: number;
        completeness: number;
        accuracy: number;
        consistency: number;
        issues: Array<{
          field: string;
          issue: string;
          severity: 'low' | 'medium' | 'high';
          recommendation: string;
        }>;
        summary: string;
        aiRecommendations?: string[];
      } = {
        totalIssues: qualityIssues.length,
        completeness: Math.round(completeness),
        accuracy: Math.round(accuracy),
        consistency: Math.round(consistency),
        issues: qualityIssues,
        summary: 'Initial data quality analysis completed. Further analysis may be needed for production use.',
        aiRecommendations: []
      };
      
      // If OpenAI is configured, enhance analysis with AI insights
      if (isOpenAIConfigured()) {
        try {
          // Format data for OpenAI
          const dataSample = {
            columns,
            rows: rows.slice(0, 5) // Only use first 5 rows to limit token usage
          };
          
          // Call OpenAI for enhanced analysis
          const aiAnalysis = await analyzeDataQuality(
            name,
            type,
            dataSample,
            qualityIssues
          );
          
          // Add AI-powered insights to the response
          qualityAnalysis.summary = aiAnalysis.enhancedSummary;
          qualityAnalysis.aiRecommendations = aiAnalysis.additionalRecommendations;
        } catch (aiError) {
          console.error('Error getting AI-powered data quality insights:', aiError);
          // Continue with basic analysis if AI enhancement fails
        }
      }
      
      res.json(qualityAnalysis);
    } catch (error: any) {
      console.error('Error analyzing data quality:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to analyze data quality',
        totalIssues: 0,
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        issues: [],
        summary: 'An error occurred while analyzing data quality'
      });
    }
  });

  // Endpoint for suggesting transformation rules based on data quality issues
  app.post('/api/etl/suggest-transformation-rules', async (req, res) => {
    try {
      const { issues } = req.body;
      
      if (!issues || !Array.isArray(issues)) {
        return res.status(400).json({ 
          error: 'Missing or invalid issues array',
          suggestions: []
        });
      }
      
      // Create transformation rule suggestions based on detected issues
      const suggestedRules = [];
      
      // Track which types of issues we've already created rules for to avoid duplicates
      const handledIssueTypes = new Set();
      
      issues.forEach(issue => {
        const field = issue.field;
        const issueText = issue.issue;
        const severity = issue.severity;
        
        // Skip if the field is "all" or "multiple" which are generic fields
        if (field === 'all' || field === 'multiple') {
          return;
        }
        
        // Generate rule suggestions based on issue type
        if (issueText.includes('missing value') && !handledIssueTypes.has('missing_value_' + field)) {
          handledIssueTypes.add('missing_value_' + field);
          suggestedRules.push({
            name: `Fill Missing ${field} Values`,
            description: `Handles missing values in ${field} column`,
            sourceField: field,
            targetField: field,
            transformationType: 'fillMissingValues',
            transformationConfig: {
              strategy: 'defaultValue',
              defaultValue: field.toLowerCase().includes('date') ? 'CURRENT_DATE' : 
                           field.toLowerCase().includes('year') ? new Date().getFullYear() : 
                           field.toLowerCase().includes('value') || field.toLowerCase().includes('price') ? 0 : 'N/A'
            },
            isEnabled: true
          });
        }
        
        if ((issueText.includes('Non-numeric') || issueText.includes('not a number')) && !handledIssueTypes.has('numeric_validation_' + field)) {
          handledIssueTypes.add('numeric_validation_' + field);
          suggestedRules.push({
            name: `Validate ${field} as Numeric`,
            description: `Ensures ${field} column contains valid numeric values`,
            sourceField: field,
            targetField: field,
            transformationType: 'validation',
            transformationConfig: {
              validationType: 'numeric',
              action: 'convert',
              fallbackValue: 0
            },
            isEnabled: true
          });
        }
        
        if (issueText.includes('Negative value') && !handledIssueTypes.has('negative_value_' + field)) {
          handledIssueTypes.add('negative_value_' + field);
          suggestedRules.push({
            name: `Ensure Positive ${field}`,
            description: `Converts negative values in ${field} column to positive`,
            sourceField: field,
            targetField: field,
            transformationType: 'numberTransform',
            transformationConfig: {
              operation: 'abs'
            },
            isEnabled: true
          });
        }
        
        if (issueText.includes('duplicate') && !handledIssueTypes.has('duplicate_' + field)) {
          handledIssueTypes.add('duplicate_' + field);
          suggestedRules.push({
            name: `Handle Duplicate ${field}`,
            description: `Adds unique suffix to duplicate ${field} values`,
            sourceField: field,
            targetField: field,
            transformationType: 'deduplicate',
            transformationConfig: {
              strategy: 'addSuffix',
              suffixPattern: '_${index}'
            },
            isEnabled: true
          });
        }
        
        if ((issueText.includes('Future') || issueText.includes('invalid date')) && !handledIssueTypes.has('date_validation_' + field)) {
          handledIssueTypes.add('date_validation_' + field);
          suggestedRules.push({
            name: `Validate ${field} Dates`,
            description: `Ensures ${field} has valid dates (not in future)`,
            sourceField: field,
            targetField: field,
            transformationType: 'dateValidation',
            transformationConfig: {
              maxDate: 'CURRENT_DATE',
              invalidAction: 'setToMax'
            },
            isEnabled: true
          });
        }
      });
      
      // If OpenAI is configured, get AI suggestions for more advanced transformations
      if (isOpenAIConfigured() && issues.length > 0) {
        try {
          // This would be a call to OpenAI for advanced suggestions
          // For now we'll just add some static advanced rules since we have rate limits
          const advancedRules = [
            {
              name: 'Address Standardization',
              description: 'Standardizes address formatting for consistency',
              sourceField: 'address',
              targetField: 'address',
              transformationType: 'addressStandardization',
              transformationConfig: {
                format: 'USPS',
                includeZipCode: true
              },
              isEnabled: false
            },
            {
              name: 'Data Quality Score',
              description: 'Calculates and adds a data quality score column',
              sourceField: '*',
              targetField: 'qualityScore',
              transformationType: 'qualityScore',
              transformationConfig: {
                factors: ['completeness', 'validity'],
                weights: { completeness: 0.7, validity: 0.3 }
              },
              isEnabled: false
            }
          ];
          
          // Only add these if the appropriate fields exist
          if (issues.some(issue => issue.field === 'address')) {
            suggestedRules.push(advancedRules[0]);
          }
          
          // Always suggest the data quality score calculation
          suggestedRules.push(advancedRules[1]);
        } catch (aiError) {
          console.error('Error getting AI-powered transformation suggestions:', aiError);
          // Continue with basic suggestions if AI enhancement fails
        }
      }
      
      res.json({
        count: suggestedRules.length,
        suggestions: suggestedRules
      });
    } catch (error: any) {
      console.error('Error suggesting transformation rules:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to suggest transformation rules',
        suggestions: []
      });
    }
  });

  // ETL Transformation Rules endpoints
  app.get('/api/etl/transformation-rules', async (req, res) => {
    try {
      const rules = await storage.getEtlTransformationRules();
      res.json(rules);
    } catch (error: any) {
      console.error('Error fetching ETL transformation rules:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL transformation rules' });
    }
  });

  app.get('/api/etl/transformation-rules/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid transformation rule ID' });
      }
      
      const rule = await storage.getEtlTransformationRuleById(id);
      if (!rule) {
        return res.status(404).json({ error: 'Transformation rule not found' });
      }
      
      res.json(rule);
    } catch (error: any) {
      console.error('Error fetching ETL transformation rule:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL transformation rule' });
    }
  });

  app.post('/api/etl/transformation-rules', async (req, res) => {
    try {
      const rule = req.body;
      const newRule = await storage.createEtlTransformationRule(rule);
      res.status(201).json(newRule);
    } catch (error: any) {
      console.error('Error creating ETL transformation rule:', error);
      res.status(500).json({ error: error.message || 'Failed to create ETL transformation rule' });
    }
  });

  app.put('/api/etl/transformation-rules/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid transformation rule ID' });
      }
      
      const rule = req.body;
      const updatedRule = await storage.updateEtlTransformationRule(id, rule);
      
      if (!updatedRule) {
        return res.status(404).json({ error: 'Transformation rule not found' });
      }
      
      res.json(updatedRule);
    } catch (error: any) {
      console.error('Error updating ETL transformation rule:', error);
      res.status(500).json({ error: error.message || 'Failed to update ETL transformation rule' });
    }
  });

  app.delete('/api/etl/transformation-rules/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid transformation rule ID' });
      }
      
      const success = await storage.deleteEtlTransformationRule(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Transformation rule not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting ETL transformation rule:', error);
      res.status(500).json({ error: error.message || 'Failed to delete ETL transformation rule' });
    }
  });

  // ETL Jobs endpoints
  app.get('/api/etl/jobs', async (req, res) => {
    try {
      const jobs = await storage.getEtlJobs();
      res.json(jobs);
    } catch (error: any) {
      console.error('Error fetching ETL jobs:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL jobs' });
    }
  });

  app.get('/api/etl/jobs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }
      
      const job = await storage.getEtlJobById(id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json(job);
    } catch (error: any) {
      console.error('Error fetching ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch ETL job' });
    }
  });

  app.post('/api/etl/jobs', async (req, res) => {
    try {
      const job = req.body;
      const newJob = await storage.createEtlJob(job);
      res.status(201).json(newJob);
    } catch (error: any) {
      console.error('Error creating ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to create ETL job' });
    }
  });

  app.put('/api/etl/jobs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }
      
      const job = req.body;
      const updatedJob = await storage.updateEtlJob(id, job);
      
      if (!updatedJob) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json(updatedJob);
    } catch (error: any) {
      console.error('Error updating ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to update ETL job' });
    }
  });

  app.delete('/api/etl/jobs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }
      
      const success = await storage.deleteEtlJob(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to delete ETL job' });
    }
  });

  // ETL Transformation Rule Execution endpoint
  app.post('/api/etl/execute-transformation-rules', async (req, res) => {
    try {
      const { data, rules } = req.body;
      
      if (!data || !Array.isArray(data.rows) || !Array.isArray(data.columns)) {
        return res.status(400).json({ 
          error: 'Invalid data format. Expected {columns: string[], rows: any[][]}' 
        });
      }
      
      if (!rules || !Array.isArray(rules)) {
        return res.status(400).json({ 
          error: 'Invalid rules format. Expected an array of transformation rules' 
        });
      }

      // Create a copy of the data to avoid modifying the original
      const transformedData = {
        name: data.name || 'Transformed Data',
        type: data.type || 'csv',
        columns: [...data.columns],
        rows: data.rows.map(row => [...row])
      };
      
      // Apply each transformation rule in sequence
      const executionLog = [];
      const transformationStats = {
        totalTransformations: 0,
        byRule: {}
      };
      
      for (const rule of rules) {
        if (!rule.isEnabled) {
          executionLog.push({
            rule: rule.name,
            status: 'skipped',
            message: 'Rule is disabled'
          });
          continue;
        }
        
        try {
          // Initialize stats for this rule
          transformationStats.byRule[rule.name] = {
            cellsTransformed: 0,
            fieldsAffected: []
          };
          
          // Get column indexes
          const sourceColumnIndex = rule.sourceField === '*' 
            ? -1
            : transformedData.columns.indexOf(rule.sourceField);
            
          const targetColumnIndex = transformedData.columns.indexOf(rule.targetField);
          
          // Add target column if it doesn't exist (for new columns)
          if (targetColumnIndex === -1 && rule.targetField !== rule.sourceField) {
            transformedData.columns.push(rule.targetField);
            // Add empty values for the new column in all rows
            transformedData.rows.forEach(row => row.push(null));
          }
          
          // Re-fetch the target index in case we just added it
          const newTargetIndex = transformedData.columns.indexOf(rule.targetField);
          
          // Apply the transformation based on the rule type
          switch (rule.transformationType) {
            case 'fillMissingValues': {
              const defaultValue = rule.transformationConfig.defaultValue;
              const transformedCount = applyFillMissingValues(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                defaultValue
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            case 'validation': {
              const { validationType, action, fallbackValue } = rule.transformationConfig;
              const transformedCount = applyValidation(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                validationType, 
                action, 
                fallbackValue
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            case 'numberTransform': {
              const { operation } = rule.transformationConfig;
              const transformedCount = applyNumberTransform(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                operation
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            case 'deduplicate': {
              const { strategy, suffixPattern } = rule.transformationConfig;
              const transformedCount = applyDeduplication(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                strategy, 
                suffixPattern
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            case 'dateValidation': {
              const { maxDate, invalidAction } = rule.transformationConfig;
              const transformedCount = applyDateValidation(
                transformedData.rows, 
                sourceColumnIndex, 
                newTargetIndex, 
                maxDate, 
                invalidAction
              );
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }

            case 'qualityScore': {
              // Add a quality score column if it does not exist
              if (newTargetIndex === -1) {
                transformedData.columns.push(rule.targetField);
                // Add empty values for the new column in all rows
                transformedData.rows.forEach(row => row.push(null));
              }
              
              const qualityScoreIndex = transformedData.columns.indexOf(rule.targetField);
              const { factors, weights } = rule.transformationConfig;
              
              // Calculate quality score for each row
              let transformedCount = 0;
              transformedData.rows.forEach((row, rowIndex) => {
                let score = 100; // Start with perfect score
                
                // Check for completeness
                if (factors.includes('completeness')) {
                  const completenessWeight = weights.completeness || 0.5;
                  let missingCount = 0;
                  row.forEach(cell => {
                    if (cell === null || cell === undefined || cell === '') {
                      missingCount++;
                    }
                  });
                  
                  const completeness = 1 - (missingCount / row.length);
                  score -= (1 - completeness) * 100 * completenessWeight;
                }
                
                // Check for validity
                if (factors.includes('validity')) {
                  const validityWeight = weights.validity || 0.5;
                  let invalidCount = 0;
                  
                  transformedData.columns.forEach((column, colIndex) => {
                    const value = row[colIndex];
                    if (value !== null && value !== undefined && value !== '') {
                      // Check numeric fields
                      if (column.toLowerCase().includes('value') || 
                          column.toLowerCase().includes('price') || 
                          column.toLowerCase().includes('cost') || 
                          column.toLowerCase().includes('fee')) {
                        if (isNaN(Number(value)) || Number(value) < 0) {
                          invalidCount++;
                        }
                      }
                      
                      // Check date/year fields
                      if (column.toLowerCase().includes('date') || 
                          column.toLowerCase().includes('year')) {
                        const currentYear = new Date().getFullYear();
                        if (isNaN(Number(value)) || Number(value) > currentYear) {
                          invalidCount++;
                        }
                      }
                    }
                  });
                  
                  const validity = 1 - (invalidCount / row.length);
                  score -= (1 - validity) * 100 * validityWeight;
                }
                
                // Ensure score is between 0 and 100
                score = Math.max(0, Math.min(100, Math.round(score)));
                
                // Update the quality score
                row[qualityScoreIndex] = score;
                transformedCount++;
              });
              
              transformationStats.byRule[rule.name].cellsTransformed = transformedCount;
              transformationStats.totalTransformations += transformedCount;
              break;
            }
            
            default:
              executionLog.push({
                rule: rule.name,
                status: 'skipped',
                message: `Unsupported transformation type: ${rule.transformationType}`
              });
              continue;
          }
          
          // Add to execution log
          executionLog.push({
            rule: rule.name,
            status: 'success',
            message: `Applied ${rule.transformationType} transformation successfully`,
            transformedCount: transformationStats.byRule[rule.name].cellsTransformed
          });
          
          // Add to affected fields
          if (!transformationStats.byRule[rule.name].fieldsAffected.includes(rule.targetField)) {
            transformationStats.byRule[rule.name].fieldsAffected.push(rule.targetField);
          }
          
        } catch (ruleError) {
          console.error(`Error applying rule ${rule.name}:`, ruleError);
          executionLog.push({
            rule: rule.name,
            status: 'error',
            message: ruleError.message || `Error applying ${rule.name}`
          });
        }
      }
      
      // Return the transformed data with execution log
      res.json({
        transformedData,
        executionLog,
        transformationStats
      });
    } catch (error: any) {
      console.error('Error executing transformation rules:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to execute transformation rules' 
      });
    }
  });

  // Helper functions for transformations
  function applyFillMissingValues(rows: any[][], sourceIndex: number, targetIndex: number, defaultValue: any): number {
    let transformedCount = 0;
    
    rows.forEach(row => {
      const sourceValue = row[sourceIndex];
      if (sourceValue === null || sourceValue === undefined || sourceValue === '') {
        row[targetIndex] = defaultValue === 'CURRENT_DATE' ? new Date().toISOString().split('T')[0] : defaultValue;
        transformedCount++;
      } else if (sourceIndex !== targetIndex) {
        // Only copy if source and target are different
        row[targetIndex] = sourceValue;
      }
    });
    
    return transformedCount;
  }
  
  function applyValidation(
    rows: any[][], 
    sourceIndex: number, 
    targetIndex: number, 
    validationType: string, 
    action: string, 
    fallbackValue: any
  ): number {
    let transformedCount = 0;
    
    rows.forEach(row => {
      const sourceValue = row[sourceIndex];
      let targetValue = sourceValue;
      
      if (validationType === 'numeric') {
        if (sourceValue === null || sourceValue === undefined || sourceValue === '' || isNaN(Number(sourceValue))) {
          if (action === 'convert') {
            targetValue = fallbackValue;
            transformedCount++;
          }
        } else {
          targetValue = Number(sourceValue);
        }
      }
      
      row[targetIndex] = targetValue;
    });
    
    return transformedCount;
  }
  
  function applyNumberTransform(
    rows: any[][], 
    sourceIndex: number, 
    targetIndex: number, 
    operation: string
  ): number {
    let transformedCount = 0;
    
    rows.forEach(row => {
      const sourceValue = row[sourceIndex];
      let targetValue = sourceValue;
      
      if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
        const numValue = Number(sourceValue);
        
        if (!isNaN(numValue)) {
          if (operation === 'abs') {
            targetValue = Math.abs(numValue);
            if (numValue !== targetValue) {
              transformedCount++;
            }
          }
        }
      }
      
      row[targetIndex] = targetValue;
    });
    
    return transformedCount;
  }
  
  function applyDeduplication(
    rows: any[][], 
    sourceIndex: number, 
    targetIndex: number, 
    strategy: string, 
    suffixPattern: string
  ): number {
    let transformedCount = 0;
    const valueOccurrences: Record<string, number> = {};
    
    // First pass: count occurrences
    rows.forEach(row => {
      const sourceValue = String(row[sourceIndex]);
      valueOccurrences[sourceValue] = (valueOccurrences[sourceValue] || 0) + 1;
    });
    
    // Second pass: apply deduplication
    const processedValues: Record<string, number> = {};
    
    rows.forEach(row => {
      const sourceValue = String(row[sourceIndex]);
      let targetValue = sourceValue;
      
      if (valueOccurrences[sourceValue] > 1) {
        // Track how many times we've seen this value
        processedValues[sourceValue] = (processedValues[sourceValue] || 0) + 1;
        
        if (processedValues[sourceValue] > 1) { // First occurrence keeps original value
          if (strategy === 'addSuffix') {
            const suffix = suffixPattern.replace('${index}', processedValues[sourceValue].toString());
            targetValue = sourceValue + suffix;
            transformedCount++;
          }
        }
      }
      
      row[targetIndex] = targetValue;
    });
    
    return transformedCount;
  }
  
  function applyDateValidation(
    rows: any[][], 
    sourceIndex: number, 
    targetIndex: number, 
    maxDate: string, 
    invalidAction: string
  ): number {
    let transformedCount = 0;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    rows.forEach(row => {
      const sourceValue = row[sourceIndex];
      let targetValue = sourceValue;
      
      // Handle year values (e.g., 2050) or date values
      if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
        const numValue = Number(sourceValue);
        
        if (!isNaN(numValue)) {
          // Check if it's a year and it's in the future
          if (numValue > 1000 && numValue <= 9999 && numValue > currentYear) {
            if (invalidAction === 'setToMax') {
              targetValue = currentYear;
              transformedCount++;
            }
          }
        }
      }
      
      row[targetIndex] = targetValue;
    });
    
    return transformedCount;
  }

  // ETL Job Execution endpoint
  app.post('/api/etl/jobs/:id/execute', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }
      
      const job = await storage.getEtlJobById(id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      // Update job status to running
      await storage.updateEtlJob(id, { status: 'running' });
      
      // Execute the job (placeholder for actual execution logic)
      // In a real implementation, this would dispatch a background task or worker
      
      // For demo purposes, update job to success after a delay
      setTimeout(async () => {
        try {
          await storage.updateEtlJob(id, { 
            status: 'success',
            lastRunAt: new Date()
          });
        } catch (error) {
          console.error('Error updating job status:', error);
        }
      }, 5000);
      
      res.json({ message: 'Job execution started', jobId: id });
    } catch (error: any) {
      console.error('Error executing ETL job:', error);
      res.status(500).json({ error: error.message || 'Failed to execute ETL job' });
    }
  });

  // Income Hotel/Motel routes
  app.get('/api/income-hotel-motels', async (req, res) => {
    try {
      const hotelMotels = await storage.getAllIncomeHotelMotels();
      res.json(hotelMotels);
    } catch (error) {
      console.error('Error fetching hotel/motel data:', error);
      res.status(500).json({ error: 'Failed to fetch hotel/motel data' });
    }
  });

  app.get('/api/income-hotel-motel/:incomeYear/:supNum/:incomeId', async (req, res) => {
    const { incomeYear, supNum, incomeId } = req.params;
    try {
      const hotelMotel = await storage.getIncomeHotelMotel(incomeYear, parseInt(supNum), parseInt(incomeId));
      if (!hotelMotel) {
        return res.status(404).json({ error: 'Hotel/Motel data not found' });
      }
      res.json(hotelMotel);
    } catch (error) {
      console.error('Error fetching specific hotel/motel data:', error);
      res.status(500).json({ error: 'Failed to fetch specific hotel/motel data' });
    }
  });

  app.post('/api/income-hotel-motel', async (req, res) => {
    try {
      // Parse the input data using the insert schema
      const parsedData = insertIncomeHotelMotelSchema.parse(req.body);
      const newHotelMotel = await storage.insertIncomeHotelMotel(parsedData);
      res.status(201).json(newHotelMotel);
    } catch (error) {
      console.error('Error creating hotel/motel data:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data format', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create hotel/motel data' });
      }
    }
  });

  app.delete('/api/income-hotel-motel/:incomeYear/:supNum/:incomeId', async (req, res) => {
    const { incomeYear, supNum, incomeId } = req.params;
    try {
      await storage.deleteIncomeHotelMotel(incomeYear, parseInt(supNum), parseInt(incomeId));
      res.status(200).json({ message: 'Hotel/Motel data deleted successfully' });
    } catch (error) {
      console.error('Error deleting hotel/motel data:', error);
      res.status(500).json({ error: 'Failed to delete hotel/motel data' });
    }
  });

  // Income Hotel/Motel Detail routes
  app.get('/api/income-hotel-motel-details', async (req, res) => {
    try {
      const hotelMotelDetails = await storage.getAllIncomeHotelMotelDetails();
      res.json(hotelMotelDetails);
    } catch (error) {
      console.error('Error fetching hotel/motel detail data:', error);
      res.status(500).json({ error: 'Failed to fetch hotel/motel detail data' });
    }
  });

  app.get('/api/income-hotel-motel-detail/:incomeYear/:supNum/:incomeId/:valueType', async (req, res) => {
    const { incomeYear, supNum, incomeId, valueType } = req.params;
    try {
      const hotelMotelDetail = await storage.getIncomeHotelMotelDetail(
        incomeYear,
        parseInt(supNum),
        parseInt(incomeId),
        valueType
      );
      if (!hotelMotelDetail) {
        return res.status(404).json({ error: 'Hotel/Motel detail data not found' });
      }
      res.json(hotelMotelDetail);
    } catch (error) {
      console.error('Error fetching specific hotel/motel detail data:', error);
      res.status(500).json({ error: 'Failed to fetch specific hotel/motel detail data' });
    }
  });

  app.post('/api/income-hotel-motel-detail', async (req, res) => {
    try {
      // Parse the input data using the insert schema
      const parsedData = insertIncomeHotelMotelDetailSchema.parse(req.body);
      const newHotelMotelDetail = await storage.insertIncomeHotelMotelDetail(parsedData);
      res.status(201).json(newHotelMotelDetail);
    } catch (error) {
      console.error('Error creating hotel/motel detail data:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data format', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create hotel/motel detail data' });
      }
    }
  });

  app.delete('/api/income-hotel-motel-detail/:incomeYear/:supNum/:incomeId/:valueType', async (req, res) => {
    const { incomeYear, supNum, incomeId, valueType } = req.params;
    try {
      await storage.deleteIncomeHotelMotelDetail(
        incomeYear,
        parseInt(supNum),
        parseInt(incomeId),
        valueType
      );
      res.status(200).json({ message: 'Hotel/Motel detail data deleted successfully' });
    } catch (error) {
      console.error('Error deleting hotel/motel detail data:', error);
      res.status(500).json({ error: 'Failed to delete hotel/motel detail data' });
    }
  });

  // Additional income lease up month listings endpoint
  app.get('/api/income-lease-up-month-listings', async (req, res) => {
    try {
      const allListings = await db.select().from(incomeLeaseUpMonthListing);
      res.json(allListings);
    } catch (error) {
      console.error('Error fetching all income lease up month listings:', error);
      res.status(500).json({ error: 'Failed to fetch income lease up month listings' });
    }
  });
  
  // Fix for income hotel motel details endpoint returning HTML
  app.get('/api/income-hotel-motel/:incomeYear/:supNum/:incomeId/details', async (req, res) => {
    try {
      const { incomeYear, supNum, incomeId } = req.params;
      const details = await storage.getIncomeHotelMotelDetails(
        parseInt(incomeYear), 
        parseInt(supNum), 
        parseInt(incomeId)
      );
      res.json(details);
    } catch (error) {
      console.error('Error fetching hotel/motel details:', error);
      res.status(500).json({ error: 'Failed to fetch hotel/motel details' });
    }
  });

  // Register Agent API Routes
  registerAgentRoutes(app);
  console.log('Agent API routes registered');
  
  // Register Property History Routes
  registerPropertyHistoryRoutes(app);
  console.log('Property History routes registered');
  
  // Register Supabase property history routes if Supabase is configured
  if (isSupabaseConfigured()) {
    registerPropertyHistorySupabaseRoutes(app);
    console.log('Supabase Property History routes registered');
    
    // Register Supabase status and verification routes
    app.use('/api/supabase', supabaseStatusRoutes);
    
    // Register AI Assistant routes
    registerAIAssistantRoutes(app);
    console.log('AI Assistant routes registered');
    console.log('Supabase Status routes registered');
    
    // Initialize Supabase schema
    try {
      await initializeSupabaseSchema();
      console.log('Supabase schema initialized');
    } catch (error) {
      console.error('Error initializing Supabase schema:', error);
    }
    
    // Test Supabase connection
    const connectionResult = await testSupabaseConnection();
    if (connectionResult.error) {
      console.log('Supabase connection test failed:', connectionResult.error);
    } else {
      console.log('Supabase connection successful');
    }
  } else {
    console.log('Supabase integration not available - skipping route registration');
  }

  // Add a Supabase status endpoint
  app.get('/api/supabase/status', async (req, res) => {
    const configured = isSupabaseConfigured();
    const connectionResult = configured ? await testSupabaseConnection() : { success: false };
    const connected = connectionResult.success;
    
    res.json({
      success: true,
      configured,
      connected,
      error: connectionResult.error ? connectionResult.error.message : null,
      message: configured 
        ? (connected ? 'Supabase integration is active and connected' : 'Supabase is configured but not connected')
        : 'Supabase integration is not configured'
    });
  });

  const httpServer = createServer(app);

  // Helper function to validate an object against a schema
  function validateSchema(data: any, schema: z.ZodType<any>) {
    try {
      schema.parse(data);
      return true;
    } catch (error) {
      const zodError = error as z.ZodError;
      const errorMessages = zodError.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
  }
  
  // Helper function to handle API errors
  function handleError(error: unknown, res: Response) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }

  // FTP connection endpoint
  app.post('/api/etl/ftp/connect', async (req, res) => {
    try {
      const { host, port, username, password, secure, path } = req.body;
      
      // In a real implementation, we would connect to the FTP server
      // and list files in the specified directory
      
      // For now, we'll return mock data for the UI to display
      const mockFiles = [
        'benton_county_properties_2024.csv',
        'historical_values_2020_2023.json',
        'commercial_properties_2024.xml',
        'residential_zones.csv',
        'property_tax_assessments.csv',
        'valuation_history.json'
      ];
      
      // Simulate a short delay to mimic network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return res.status(200).json({ 
        success: true, 
        message: `Connected to ${host}:${port} successfully`, 
        files: mockFiles
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // FTP data import for properties
  app.post('/api/etl/import/properties', async (req, res) => {
    try {
      const { data, source, fileType, host, port, username, password, secure, path, file, useFieldMapping } = req.body;
      
      // Handle FTP direct import case
      if (host && file) {
        console.log(`Processing FTP import from ${host}:${port || 21}, file: ${file}`);
        
        // In a real implementation, we would:
        // 1. Connect to the FTP server
        // 2. Download the specified file
        // 3. Parse it based on its type
        // 4. Import the data
        
        // For this demo, we'll simulate a successful import with mock data
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return res.status(200).json({
          success: true,
          rowsImported: 245,
          importTimeMs: 4780,
          missingValues: 12,
          completeness: 98,
          accuracy: 96,
          consistency: 89
        });
      }
      
      // Handle regular data import case
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty data array' });
      }
      
      // Log import details
      console.log(`Processing import from ${source} with ${data.length} records (${fileType})`);
      
      // Track success and error counts
      let successCount = 0;
      let errorCount = 0;
      const errors: {record: any, error: string}[] = [];
      
      // Process each property
      for (const item of data) {
        try {
          // Map incoming data to property schema
          const property = mapToPropertySchema(item, fileType);
          
          // Validate the mapped data
          validateSchema(property, insertPropertySchema);
          
          // Insert the property
          await storage.createProperty(property);
          successCount++;
        } catch (err) {
          errorCount++;
          errors.push({
            record: item,
            error: (err as Error).message
          });
          
          // Don't fail the entire batch for individual record errors
          console.error(`Error processing record:`, err);
        }
      }
      
      // Return summary
      res.json({
        totalRecords: data.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Limit error details to first 10
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  // Helper function to map incoming data to property schema based on file type
  function mapToPropertySchema(item: any, fileType: string): InsertProperty {
    // Check if source is from ArcGIS
    const isArcGisSource = fileType === 'json' && (item.rawAttributes || (
      (item.Parcel_ID || item.CENTROID_X || item.CENTROID_Y || item.owner_name || 
      item.situs_address || item.appraised_val || item.neighborhood_name || 
      item.primary_use || item.geo_id) ? true : false
    ));
    
    // If this is ArcGIS data, use the PropertyGISMapperService for proper field mapping
    if (isArcGisSource) {
      // Create a feature object that the GIS mapper can process
      const feature = {
        properties: item.rawAttributes || item,
        geometry: item.coordinates ? {
          type: 'Point',
          coordinates: item.coordinates
        } : null
      };
      
      // Use the specialized GIS mapper service
      const mappedProperty = propertyGisMapperService.mapGisFeatureToProperty(feature);
      
      if (!mappedProperty) {
        throw new Error('Failed to map ArcGIS feature to property');
      }
      
      // Ensure required fields for InsertProperty
      const insertProperty: InsertProperty = {
        parcelId: mappedProperty.parcelId || '',
        address: mappedProperty.address || '',
        squareFeet: mappedProperty.squareFeet || 0,
        value: mappedProperty.value || null,
        owner: mappedProperty.owner || null,
        estimatedValue: null,
        salePrice: mappedProperty.salePrice || null,
        yearBuilt: mappedProperty.yearBuilt || null,
        landValue: mappedProperty.landValue || null,
        coordinates: mappedProperty.coordinates || null,
        latitude: mappedProperty.latitude || null,
        longitude: mappedProperty.longitude || null,
        neighborhood: mappedProperty.neighborhood || null,
        propertyType: mappedProperty.propertyType || null,
        zoning: mappedProperty.zoning || null,
        lotSize: mappedProperty.lotSize || null,
        bedrooms: mappedProperty.bedrooms || null,
        bathrooms: mappedProperty.bathrooms || null,
        attributes: mappedProperty.attributes || null
      };
      
      return insertProperty;
    }
    
    // Default mapping strategy for non-ArcGIS data
    const property: InsertProperty = {
      parcelId: '',
      address: '',
      squareFeet: 0
    };
    
    // Apply different mapping strategies based on file type and data structure
    if (fileType === 'csv') {
      // Attempt to intelligently map fields based on common column names
      property.parcelId = item['parcel_id'] || item['parcelId'] || item['ParcelID'] || item['PARCEL_ID'] || '';
      property.address = item['address'] || item['Address'] || item['PROPERTY_ADDRESS'] || item['property_address'] || '';
      
      // Handle numeric fields - parse safely with defaults
      property.squareFeet = parseFloat(item['square_feet'] || item['squareFeet'] || item['SquareFeet'] || item['SQUARE_FEET'] || '0') || 0;
      property.value = item['value'] || item['assessed_value'] || item['ASSESSED_VALUE'] || null;
      property.owner = item['owner'] || item['OWNER_NAME'] || item['owner_name'] || null;
      property.salePrice = item['sale_price'] || item['salePrice'] || item['SALE_PRICE'] || null;
      
      // Optional fields
      if (item['year_built'] || item['yearBuilt'] || item['YEAR_BUILT']) {
        property.yearBuilt = parseInt(item['year_built'] || item['yearBuilt'] || item['YEAR_BUILT']) || null;
      }
      
      if (item['property_type'] || item['propertyType'] || item['PROPERTY_TYPE']) {
        property.propertyType = item['property_type'] || item['propertyType'] || item['PROPERTY_TYPE'];
      }
      
      if (item['zoning'] || item['ZONING']) {
        property.zoning = item['zoning'] || item['ZONING'];
      }
      
      if ((item['latitude'] || item['LAT']) && (item['longitude'] || item['LONG'] || item['LNG'])) {
        const lat = parseFloat(item['latitude'] || item['LAT']) || null;
        const lng = parseFloat(item['longitude'] || item['LONG'] || item['LNG']) || null;
        property.latitude = lat !== null ? String(lat) : null;
        property.longitude = lng !== null ? String(lng) : null;
      }
      
      // Handle various lot size names
      if (item['lot_size'] || item['lotSize'] || item['LOT_SIZE']) {
        property.lotSize = parseFloat(item['lot_size'] || item['lotSize'] || item['LOT_SIZE']) || null;
      }
      
      // Handle bedroom/bathroom counts
      if (item['bedrooms'] || item['BEDROOMS'] || item['bed_count']) {
        property.bedrooms = parseInt(item['bedrooms'] || item['BEDROOMS'] || item['bed_count']) || null;
      }
      
      if (item['bathrooms'] || item['BATHROOMS'] || item['bath_count']) {
        property.bathrooms = parseFloat(item['bathrooms'] || item['BATHROOMS'] || item['bath_count']) || null;
      }
    } 
    else if (fileType === 'json') {
      // For JSON, we assume the structure is more standardized
      // but still handle common variations
      property.parcelId = item.parcelId || item.parcel_id || item.id || '';
      property.address = item.address || item.propertyAddress || '';
      property.squareFeet = parseFloat(item.squareFeet || item.square_feet || '0') || 0;
      property.value = item.value || item.assessedValue || null;
      property.owner = item.owner || item.ownerName || null;
      property.salePrice = item.salePrice || item.sale_price || null;
      
      // Optional fields
      if (item.yearBuilt || item.year_built) {
        property.yearBuilt = parseInt(item.yearBuilt || item.year_built) || null;
      }
      
      if (item.propertyType || item.property_type) {
        property.propertyType = item.propertyType || item.property_type;
      }
      
      if (item.zoning) {
        property.zoning = item.zoning;
      }
      
      if ((item.latitude || item.lat) && (item.longitude || item.lng)) {
        const lat = parseFloat(item.latitude || item.lat) || null;
        const lng = parseFloat(item.longitude || item.lng) || null;
        property.latitude = lat !== null ? String(lat) : null;
        property.longitude = lng !== null ? String(lng) : null;
      }
      
      // Handle lot size
      if (item.lotSize || item.lot_size) {
        property.lotSize = parseFloat(item.lotSize || item.lot_size) || null;
      }
      
      // Handle bedroom/bathroom counts
      if (item.bedrooms || item.bedroomCount) {
        property.bedrooms = parseInt(item.bedrooms || item.bedroomCount) || null;
      }
      
      if (item.bathrooms || item.bathroomCount) {
        property.bathrooms = parseFloat(item.bathrooms || item.bathroomCount) || null;
      }
    }
    
    // Require these fields to be valid
    if (!property.parcelId) {
      throw new Error('Missing required field: parcelId');
    }
    
    if (!property.address) {
      throw new Error('Missing required field: address');
    }
    
    return property;
  }

  // Route for SQL Server query execution
  app.post('/api/sqlserver/query', async (req, res) => {
    try {
      const { config, query, parameters } = req.body;

      if (!config || !query) {
        return res.status(400).json({ error: 'Missing required parameters: config and query' });
      }

      // Validate SQL Server connection config
      if (!config.server || !config.database) {
        return res.status(400).json({ error: 'Invalid SQL Server connection configuration' });
      }

      // Import the mssql package dynamically to avoid browser compatibility issues
      const mssql = await import('mssql');

      // Create a connection configuration
      const sqlConfig = {
        user: config.username,
        password: config.password,
        server: config.server,
        database: config.database,
        port: config.port || 1433,
        options: {
          encrypt: config.encrypt ?? true,
          trustServerCertificate: config.trustServerCertificate ?? false,
          connectionTimeout: 30000,
          requestTimeout: 30000
        }
      };

      // Connect to the database
      const pool = await new mssql.ConnectionPool(sqlConfig).connect();
      
      // Create the request
      const request = pool.request();
      
      // Add parameters if they exist
      if (parameters && typeof parameters === 'object') {
        Object.entries(parameters).forEach(([key, value]) => {
          request.input(key, value);
        });
      }

      // Execute the query
      const result = await request.query(query);
      
      // Close the connection
      await pool.close();
      
      // Return the result
      res.json({
        recordset: result.recordset,
        recordsets: result.recordsets,
        rowsAffected: result.rowsAffected,
        output: result.output
      });
    } catch (error) {
      console.error('SQL Server query error:', error);
      handleError(error, res);
    }
  });

  // Route for ODBC query execution
  app.post('/api/odbc/query', async (req, res) => {
    try {
      const { config, query, parameters } = req.body;

      if (!config || !query) {
        return res.status(400).json({ error: 'Missing required parameters: config and query' });
      }

      // Validate ODBC connection config
      if (!config.connectionString) {
        return res.status(400).json({ error: 'Invalid ODBC connection configuration: connectionString is required' });
      }

      // Import the mssql package dynamically to avoid browser compatibility issues
      // We'll use mssql for ODBC connections too, as it supports ODBC through connection strings
      const mssql = await import('mssql');

      // Create a connection configuration using ODBC driver
      const sqlConfig: any = {
        server: 'localhost', // Required by mssql, but will be overridden by connection string
        database: 'master',  // Required by mssql, but will be overridden by connection string
        options: {
          encrypt: false,
          trustServerCertificate: true,
          connectionString: config.connectionString,
          trustedConnection: true
        }
      };

      // Add username and password if provided (for connection methods that need them separately)
      if (config.username) sqlConfig.user = config.username;
      if (config.password) sqlConfig.password = config.password;

      // Connect to the database
      const pool = await new mssql.ConnectionPool(sqlConfig).connect();
      
      // Create the request
      const request = pool.request();
      
      // Add parameters if they exist
      if (parameters && Array.isArray(parameters)) {
        // For positional parameters (common in ODBC)
        parameters.forEach((value, index) => {
          request.input(`param${index}`, value);
        });
      } else if (parameters && typeof parameters === 'object') {
        // For named parameters
        Object.entries(parameters).forEach(([key, value]) => {
          request.input(key, value);
        });
      }

      // Execute the query
      const result = await request.query(query);
      
      // Close the connection
      await pool.close();
      
      // Return the result
      res.json({
        recordset: result.recordset,
        recordsets: result.recordsets,
        rowsAffected: result.rowsAffected,
        output: result.output
      });
    } catch (error) {
      console.error('ODBC query error:', error);
      handleError(error, res);
    }
  });

  // Additional routes can be added below
  
  // Audit Logging System routes
  
  // Search audit records with pagination
  app.get('/api/audit/records', async (req, res) => {
    try {
      const {
        startTime,
        endTime,
        actor,
        action,
        entityType,
        entityId,
        success,
        searchTerm,
        page = 1,
        pageSize = 50,
        sortField = 'timestamp',
        sortDirection = 'desc'
      } = req.query;
      
      // Convert query parameters to the correct types
      const params: any = {
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
        sortField: sortField as string,
        sortDirection: sortDirection as 'asc' | 'desc',
        searchTerm: searchTerm as string
      };
      
      // Add conditional parameters
      if (startTime) params.startTime = new Date(startTime as string);
      if (endTime) params.endTime = new Date(endTime as string);
      if (actor) params.actor = actor as string;
      if (action) {
        // Handle multiple actions as a comma-separated string
        const actionValue = action as string;
        params.action = actionValue.includes(',') 
          ? actionValue.split(',').map(a => a.trim())
          : actionValue;
      }
      if (entityType) {
        // Handle multiple entity types as a comma-separated string
        const entityTypeValue = entityType as string;
        params.entityType = entityTypeValue.includes(',')
          ? entityTypeValue.split(',').map(e => e.trim())
          : entityTypeValue;
      }
      if (entityId) params.entityId = entityId as string;
      if (success !== undefined) params.success = success === 'true';
      
      const result = await auditService.searchAuditRecords(params);
      res.json(result);
    } catch (error) {
      console.error('Error searching audit records:', error);
      res.status(500).json({ 
        error: 'Failed to search audit records', 
        message: error instanceof Error ? error.message : String(error)  
      });
    }
  });

  // Get audit record by ID
  app.get('/api/audit/records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const record = await auditService.getAuditRecord(id);
      
      if (!record) {
        return res.status(404).json({ error: `Audit record with ID ${id} not found` });
      }
      
      res.json(record);
    } catch (error) {
      console.error(`Error getting audit record ${req.params.id}:`, error);
      res.status(500).json({ 
        error: 'Failed to get audit record', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Get entity history
  app.get('/api/audit/entity/:entityType/:entityId', async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      
      // Validate entity type
      if (!Object.values(AuditEntityType).includes(entityType as AuditEntityType)) {
        return res.status(400).json({ 
          error: 'Invalid entity type', 
          validEntityTypes: Object.values(AuditEntityType)
        });
      }
      
      const history = await auditService.getEntityHistory(
        entityType as AuditEntityType,
        entityId,
        limit
      );
      
      res.json(history);
    } catch (error) {
      console.error(`Error getting entity history:`, error);
      res.status(500).json({ 
        error: 'Failed to get entity history', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Archive old audit records (admin only)
  app.post('/api/audit/archive', async (req, res) => {
    try {
      // This would typically have some authentication/authorization check
      // before allowing the archiving operation
      const { olderThanDays = 90, batchSize = 1000 } = req.body;
      
      const count = await auditService.archiveOldRecords(olderThanDays, batchSize);
      
      res.json({ 
        success: true, 
        message: `Archived ${count} audit records older than ${olderThanDays} days`,
        count
      });
    } catch (error) {
      console.error('Error archiving audit records:', error);
      res.status(500).json({ 
        error: 'Failed to archive audit records', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Purge expired audit records (admin only)
  app.post('/api/audit/purge', async (req, res) => {
    try {
      // This would typically have some authentication/authorization check
      // before allowing the purging operation
      const { batchSize = 1000 } = req.body;
      
      const count = await auditService.purgeExpiredRecords(batchSize);
      
      res.json({ 
        success: true, 
        message: `Purged ${count} expired audit records`,
        count
      });
    } catch (error) {
      console.error('Error purging audit records:', error);
      res.status(500).json({ 
        error: 'Failed to purge audit records', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Create a test audit record (for development/testing)
  app.post('/api/audit/test', async (req, res) => {
    try {
      const { actor, action, entityType, entityId, success, context } = req.body;
      
      // Generate a test audit record with request body data or defaults
      const testRecord = await auditLogger.log({
        actor: actor || 'TestUser',
        action: action ? (AuditAction[action as keyof typeof AuditAction] || AuditAction.READ) : AuditAction.READ,
        entityType: entityType ? (AuditEntityType[entityType as keyof typeof AuditEntityType] || AuditEntityType.SYSTEM) : AuditEntityType.SYSTEM,
        entityId: entityId || 'TestEntity',
        success: success !== undefined ? success : true,
        context: {
          source: 'API Test',
          timestamp: new Date().toISOString(),
          ...(context || {})
        }
      });
      
      res.json({ 
        success: true, 
        message: 'Test audit record created',
        record: testRecord
      });
    } catch (error) {
      console.error('Error creating test audit record:', error);
      res.status(500).json({ 
        error: 'Failed to create test audit record', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  return httpServer;
}
