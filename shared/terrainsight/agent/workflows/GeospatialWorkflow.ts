/**
 * Geospatial Integration Workflow
 * 
 * This file defines workflows for geospatial data processing and analysis,
 * implementing the Geospatial Integration MCP as defined in the strategic guide.
 */

import { AgentWorkflow } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Geospatial Data Processing Workflow
 * 
 * This workflow orchestrates the processing of geospatial data including
 * importing, validating, and transforming vector and raster datasets.
 */
export const geospatialDataProcessingWorkflow: AgentWorkflow = {
  id: 'geospatial-data-processing-workflow',
  name: 'Geospatial Data Processing Workflow',
  description: 'Process and prepare geospatial datasets for the assessment system',
  version: '1.0',
  isEnabled: true,
  category: 'geospatial',
  tags: ['gis', 'data-processing', 'import'],
  parameters: {
    transformCoordinates: true,
    validateTopology: true,
    generateMetadata: true,
    cacheProcessedData: true
  },
  steps: [
    // Step 1: Validate Geospatial Data Source
    {
      id: 'validate-geospatial-source',
      name: 'Validate Geospatial Source',
      description: 'Validate the source geospatial data format and structure',
      agentId: 'data-validation-agent',
      inputMapping: {
        'source': 'input.source',
        'sourceType': 'input.sourceType',
        'validateSchema': true,
        'checkCoordinateSystem': true
      },
      outputMapping: {
        'output.validatedSource': 'validatedSource',
        'output.sourceMetadata': 'metadata',
        'output.validationIssues': 'issues',
        'output.isValid': 'isValid'
      },
      continueOnError: false
    },
    
    // Step 2: Transform Coordinate System (if needed)
    {
      id: 'transform-coordinates',
      name: 'Transform Coordinate System',
      description: 'Transform coordinates to the target projection system',
      agentId: 'workflow-agent',
      condition: 'parameters.transformCoordinates === true && output.sourceMetadata.requiresTransformation === true',
      inputMapping: {
        'source': 'output.validatedSource',
        'sourceCRS': 'output.sourceMetadata.coordinateSystem',
        'targetCRS': 'input.targetCRS || "EPSG:4326"',
        'transformationMethod': 'input.transformationMethod || "standard"'
      },
      outputMapping: {
        'output.transformedSource': 'transformedData',
        'output.transformationDetails': 'transformationDetails'
      },
      continueOnError: false
    },
    
    // Step 3: Process Vector Data
    {
      id: 'process-vector-data',
      name: 'Process Vector Data',
      description: 'Process vector data including topology validation and simplification',
      agentId: 'workflow-agent',
      condition: 'output.sourceMetadata.dataType === "vector"',
      inputMapping: {
        'vectorData': 'output.transformedSource || output.validatedSource',
        'validateTopology': 'parameters.validateTopology',
        'simplifyGeometry': 'input.simplifyGeometry || false',
        'toleranceLevel': 'input.toleranceLevel || 0.0001'
      },
      outputMapping: {
        'output.processedVectorData': 'processedData',
        'output.topologyIssues': 'topologyIssues',
        'output.geometryStatistics': 'statistics'
      },
      continueOnError: true
    },
    
    // Step 4: Process Raster Data
    {
      id: 'process-raster-data',
      name: 'Process Raster Data',
      description: 'Process raster data including resampling and enhancement',
      agentId: 'workflow-agent',
      condition: 'output.sourceMetadata.dataType === "raster"',
      inputMapping: {
        'rasterData': 'output.transformedSource || output.validatedSource',
        'resampleMethod': 'input.resampleMethod || "bilinear"',
        'targetResolution': 'input.targetResolution',
        'enhanceContrast': 'input.enhanceContrast || false'
      },
      outputMapping: {
        'output.processedRasterData': 'processedData',
        'output.rasterStatistics': 'statistics'
      },
      continueOnError: true
    },
    
    // Step 5: Generate Metadata
    {
      id: 'generate-metadata',
      name: 'Generate Metadata',
      description: 'Generate comprehensive metadata for the processed datasets',
      agentId: 'workflow-agent',
      condition: 'parameters.generateMetadata === true',
      inputMapping: {
        'originalMetadata': 'output.sourceMetadata',
        'processedData': 'output.processedVectorData || output.processedRasterData',
        'processingDetails': 'output.transformationDetails',
        'statisticalSummary': 'output.geometryStatistics || output.rasterStatistics',
        'metadataFormat': 'input.metadataFormat || "ISO19115"'
      },
      outputMapping: {
        'output.metadata': 'metadata',
        'output.metadataFormat': 'format',
        'output.metadataTimestamp': 'timestamp'
      },
      continueOnError: false
    },
    
    // Step 6: Cache Processed Data
    {
      id: 'cache-processed-data',
      name: 'Cache Processed Data',
      description: 'Cache the processed data for efficient access',
      agentId: 'workflow-agent',
      condition: 'parameters.cacheProcessedData === true',
      inputMapping: {
        'data': 'output.processedVectorData || output.processedRasterData',
        'metadata': 'output.metadata',
        'cacheMode': 'input.cacheMode || "persistent"',
        'compressionLevel': 'input.compressionLevel || "medium"'
      },
      outputMapping: {
        'output.cachedDataId': 'cacheId',
        'output.cacheLocation': 'location',
        'output.cacheTimestamp': 'timestamp'
      },
      continueOnError: true
    }
  ]
};

/**
 * Spatial Analysis Workflow
 * 
 * This workflow orchestrates spatial analysis operations for assessment purposes,
 * including proximity analysis, zoning, and neighborhood analysis.
 */
export const spatialAnalysisWorkflow: AgentWorkflow = {
  id: 'spatial-analysis-workflow',
  name: 'Spatial Analysis Workflow',
  description: 'Perform spatial analysis for property assessment',
  version: '1.0',
  isEnabled: true,
  category: 'geospatial',
  tags: ['gis', 'analysis', 'assessment'],
  parameters: {
    includeProximityAnalysis: true,
    includeZoneAnalysis: true,
    includeNeighborhoodAnalysis: true,
    maximumAnalysisDistance: 5000, // meters
    cacheResults: true
  },
  steps: [
    // Step 1: Prepare Property Location
    {
      id: 'prepare-property-location',
      name: 'Prepare Property Location',
      description: 'Prepare and validate the property location data',
      agentId: 'data-validation-agent',
      inputMapping: {
        'property': 'input.property',
        'requireGeometry': true,
        'validateCoordinates': true,
        'geocodeIfMissing': 'input.geocodeIfMissing || false'
      },
      outputMapping: {
        'output.propertyGeometry': 'geometry',
        'output.propertyLocation': 'location',
        'output.geocodingUsed': 'geocoded',
        'output.validationIssues': 'issues'
      },
      continueOnError: false
    },
    
    // Step 2: Proximity Analysis
    {
      id: 'run-proximity-analysis',
      name: 'Run Proximity Analysis',
      description: 'Analyze proximity to features that affect property value',
      agentId: 'workflow-agent',
      condition: 'parameters.includeProximityAnalysis === true',
      inputMapping: {
        'propertyGeometry': 'output.propertyGeometry',
        'featureLayers': 'input.featureLayers || ["schools", "parks", "commercial", "highways"]',
        'maximumDistance': 'parameters.maximumAnalysisDistance',
        'calculateRouteDistance': 'input.calculateRouteDistance || false'
      },
      outputMapping: {
        'output.proximityResults': 'results',
        'output.nearestFeatures': 'nearestFeatures',
        'output.distanceMetrics': 'metrics'
      },
      continueOnError: true
    },
    
    // Step 3: Zone Determination
    {
      id: 'determine-zones',
      name: 'Determine Zones',
      description: 'Determine which zones and districts the property falls within',
      agentId: 'workflow-agent',
      condition: 'parameters.includeZoneAnalysis === true',
      inputMapping: {
        'propertyGeometry': 'output.propertyGeometry',
        'zoneLayers': 'input.zoneLayers || ["zoning", "school_districts", "tax_districts", "flood_zones"]',
        'performIntersection': true,
        'calculateOverlap': 'input.calculateOverlap || false'
      },
      outputMapping: {
        'output.zoneResults': 'results',
        'output.propertyZones': 'zones',
        'output.zoneStatistics': 'statistics'
      },
      continueOnError: true
    },
    
    // Step 4: Neighborhood Analysis
    {
      id: 'analyze-neighborhood',
      name: 'Analyze Neighborhood',
      description: 'Analyze the characteristics of the property\'s neighborhood',
      agentId: 'workflow-agent',
      condition: 'parameters.includeNeighborhoodAnalysis === true',
      inputMapping: {
        'propertyGeometry': 'output.propertyGeometry',
        'neighborhoodRadius': 'input.neighborhoodRadius || 1000',
        'demographicData': 'input.demographicData || "latest"',
        'includeSimilarProperties': 'input.includeSimilarProperties || true',
        'maxSimilarProperties': 'input.maxSimilarProperties || 10'
      },
      outputMapping: {
        'output.neighborhoodProfile': 'profile',
        'output.neighborhoodStatistics': 'statistics',
        'output.similarProperties': 'similarProperties'
      },
      continueOnError: true
    },
    
    // Step 5: Compile Analysis Results
    {
      id: 'compile-analysis-results',
      name: 'Compile Analysis Results',
      description: 'Compile all spatial analysis results into a single report',
      agentId: 'workflow-agent',
      inputMapping: {
        'property': 'input.property',
        'propertyGeometry': 'output.propertyGeometry',
        'proximityResults': 'output.proximityResults',
        'zoneResults': 'output.zoneResults',
        'neighborhoodProfile': 'output.neighborhoodProfile',
        'includeVisualization': 'input.includeVisualization || true'
      },
      outputMapping: {
        'output.spatialAnalysis': 'analysis',
        'output.spatialFactors': 'factors',
        'output.spatialVisualization': 'visualization',
        'output.analysisTimestamp': 'timestamp'
      },
      continueOnError: false
    },
    
    // Step 6: Cache Analysis Results
    {
      id: 'cache-analysis-results',
      name: 'Cache Analysis Results',
      description: 'Cache the spatial analysis results for future reference',
      agentId: 'workflow-agent',
      condition: 'parameters.cacheResults === true',
      inputMapping: {
        'analysisResults': 'output.spatialAnalysis',
        'property': 'input.property',
        'cacheMode': 'input.cacheMode || "persistent"',
        'expirationTime': 'input.cacheExpiration || 604800' // 1 week in seconds
      },
      outputMapping: {
        'output.cachedAnalysisId': 'cacheId',
        'output.cacheLocation': 'location',
        'output.cacheExpiration': 'expiration'
      },
      continueOnError: true
    }
  ]
};

/**
 * Register geospatial workflows
 * 
 * @param registerWorkflow Function to register workflows with the MCP
 */
export function registerGeospatialWorkflows(registerWorkflow: (workflow: AgentWorkflow) => void): void {
  registerWorkflow(geospatialDataProcessingWorkflow);
  registerWorkflow(spatialAnalysisWorkflow);
}