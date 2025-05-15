/**
 * Data Processor for Benton County Property Data (Subset)
 * 
 * This script processes a subset of CSV files from the Benton County Assessor's Office
 * and formats the data for use in the GeoSpatial Analyzer application.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const dataDir = path.join(__dirname);
const comperFile = path.join(dataDir, 'comper_spatialest.csv');
const propertyValFile = path.join(dataDir, 'property_val.csv');
const rollValueHistoryFile = path.join(dataDir, 'roll_value_history.csv');
const salesChangeOwnerFile = path.join(dataDir, 'sales_chg_of_owner.csv');
const permitsFile = path.join(dataDir, 'permits.csv');
const addressFile = path.join(dataDir, 'address.csv');
const landDetailFile = path.join(dataDir, 'land_detail.csv');
const legalDescFile = path.join(dataDir, 'legal_desc.csv');

// Output files
const outputDir = path.join(__dirname, '..', 'shared', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const outputPropertiesFile = path.join(outputDir, 'properties.json');
const outputHistoricalDataFile = path.join(outputDir, 'historical.json');
const outputSalesDataFile = path.join(outputDir, 'sales.json');
const outputPermitsDataFile = path.join(outputDir, 'permits.json');

// Maximum number of records to process for each file
const MAX_RECORDS = 500;

/**
 * Reads and parses a limited number of lines from a CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Array} - Array of parsed objects
 */
function readCsvFileSubset(filePath) {
  try {
    // Read the first line (header) of the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    const header = lines[0];
    
    // Take only a subset of lines
    const subsetLines = [header, ...lines.slice(1, MAX_RECORDS + 1)];
    const subsetContent = subsetLines.join('\n');
    
    return parse(subsetContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

/**
 * Writes data to a JSON file
 * @param {string} filePath - Path to the output file
 * @param {Object} data - Data to write
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Data written to ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

/**
 * Processes property data and creates a combined dataset
 */
function processPropertyData() {
  // Read all CSV files
  console.log('Reading CSV files...');
  const comperData = readCsvFileSubset(comperFile);
  const propertyValData = readCsvFileSubset(propertyValFile);
  const addressData = readCsvFileSubset(addressFile);
  const landDetailData = readCsvFileSubset(landDetailFile);
  const legalDescData = readCsvFileSubset(legalDescFile);
  
  console.log(`Loaded ${comperData.length} comper records`);
  console.log(`Loaded ${propertyValData.length} property value records`);
  
  // Create a map of properties by property ID
  const propertyMap = new Map();
  
  // Process property value data
  propertyValData.forEach(record => {
    const propId = record.prop_id?.trim();
    if (!propId) return;
    
    propertyMap.set(propId, {
      id: propId,
      parcelId: record.geo_id?.trim() || propId,
      address: "",
      owner: null,
      value: record.appraised_val || null,
      estimatedValue: record.appraised_val || null,
      salePrice: null,
      squareFeet: 0,
      yearBuilt: null,
      bedrooms: null,
      bathrooms: null,
      propertyType: record.property_use_desc?.trim() || null,
      zoning: null,
      latitude: null,
      longitude: null,
      lastSaleDate: null,
      taxAssessment: record.assessed_val || null,
      lotSize: parseFloat(record.legal_acreage || 0) * 43560, // Convert acres to sq ft
      lastVisitDate: null,
      qualityScore: null,
      neighborhood: record.hood_cd?.trim() || null,
      schoolDistrict: null,
      floodZone: null,
      landValue: null,
      zillowId: null,
      legalDescription: record.legal_desc?.trim() || null
    });
  });
  
  // Enhance with comper data
  comperData.forEach(record => {
    const propId = record.prop_id?.trim();
    if (!propId || !propertyMap.has(propId)) return;
    
    const property = propertyMap.get(propId);
    
    // Update property with comper data
    property.address = record.situs_display?.trim() || property.address;
    property.squareFeet = parseInt(record.TotalArea || property.squareFeet, 10);
    property.yearBuilt = record.YearBuilt ? parseInt(record.YearBuilt, 10) : property.yearBuilt;
    property.bedrooms = null; // Not provided in sample data
    property.bathrooms = record.Bathrooms ? parseFloat(record.Bathrooms) : property.bathrooms;
    property.propertyType = record.property_use_desc?.trim() || property.propertyType;
    property.zoning = null; // Not directly provided
    
    // Extract lat/long from coordinates if present
    if (record.GeoX && record.GeoY) {
      property.latitude = record.GeoY;
      property.longitude = record.GeoX;
    }
    
    // Calculate quality score (1-100) based on available data
    if (record.class_cd && record.Condition) {
      const classScore = parseInt(record.class_cd, 10) || 5;
      const conditionMap = { 
        "Excellent": 90, 
        "Good": 75, 
        "Fair": 60, 
        "Poor": 40, 
        "Very Poor": 20 
      };
      const conditionScore = conditionMap[record.Condition] || 50;
      property.qualityScore = Math.min(100, Math.round((classScore * 0.3) + (conditionScore * 0.7)));
    } else {
      // Generate a reasonable quality score based on year built and value
      const ageScore = property.yearBuilt ? Math.max(0, 100 - (new Date().getFullYear() - property.yearBuilt) / 1.5) : 50;
      const valueScore = property.value ? Math.min(100, parseInt(property.value, 10) / 5000) : 50;
      property.qualityScore = Math.round((ageScore * 0.6) + (valueScore * 0.4));
    }
    
    // Add other useful fields
    property.neighborhood = record.neighborhood?.trim() || property.neighborhood;
    property.schoolDistrict = null; // Not provided
    property.floodZone = false; // Default
  });
  
  // Enhance with address data
  addressData.forEach(record => {
    const acctId = record.acct_id?.trim();
    // For demo purposes, we'll attach addresses to some properties
    for (const [propId, property] of propertyMap.entries()) {
      // Simple match by property ID suffix
      if (propId.endsWith(acctId)) {
        const city = record.addr_city?.trim() || '';
        const state = record.addr_state?.trim() || '';
        const zip = record.zip?.trim() || '';
        
        // Only update if the property doesn't already have a good address
        if (!property.address || property.address.includes("UNDETERMINED")) {
          const addr = [
            record.addr_line1?.trim() || '',
            city,
            state,
            zip
          ].filter(Boolean).join(', ');
          
          if (addr) {
            property.address = addr;
          }
        }
        break;
      }
    }
  });
  
  // Process legal descriptions to enhance properties
  legalDescData.forEach(record => {
    const propId = record.prop_id?.trim();
    if (!propId || !propertyMap.has(propId)) return;
    
    const property = propertyMap.get(propId);
    property.legalDescription = record.legal_desc?.trim() || property.legalDescription;
  });
  
  // Process land details to enhance properties
  landDetailData.forEach(record => {
    const propId = record.prop_id?.trim();
    if (!propId || !propertyMap.has(propId)) return;
    
    const property = propertyMap.get(propId);
    
    // Update lot size if not already set
    if (!property.lotSize && record.size_acres) {
      property.lotSize = parseFloat(record.size_acres) * 43560; // Convert acres to sq ft
    }
    
    // Use land_type_cd to enhance property type info
    if (record.land_type_cd?.trim() === '9') {
      property.propertyType = 'Residential'; // Rural homesite typically means residential
    }
  });
  
  // Add random coordinates for properties missing them
  // For demo purposes in Benton County, WA area
  const centerLat = 46.2805;
  const centerLon = -119.2813;
  propertyMap.forEach(property => {
    if (!property.latitude || !property.longitude) {
      // Generate random coordinates within Benton County area
      const offsetLat = (Math.random() - 0.5) * 0.1;
      const offsetLon = (Math.random() - 0.5) * 0.2;
      property.latitude = (centerLat + offsetLat).toFixed(6);
      property.longitude = (centerLon + offsetLon).toFixed(6);
    }
  });
  
  // Convert map to array of properties
  const properties = Array.from(propertyMap.values());
  
  // Write to JSON file
  writeJsonFile(outputPropertiesFile, properties);
  console.log(`Processed ${properties.length} properties`);
  
  return properties;
}

/**
 * Process historical property value data
 */
function processHistoricalData(properties) {
  const rollValueHistoryData = readCsvFileSubset(rollValueHistoryFile);
  console.log(`Loaded ${rollValueHistoryData.length} historical records`);
  
  const historicalMap = new Map();
  
  // Group by property ID
  rollValueHistoryData.forEach(record => {
    const propId = record.prop_id?.trim();
    if (!propId) return;
    
    if (!historicalMap.has(propId)) {
      historicalMap.set(propId, []);
    }
    
    // Add year and value data
    const yearValue = {
      year: record.prop_val_yr,
      value: parseInt(record.appraised_val || 0, 10)
    };
    
    historicalMap.get(propId).push(yearValue);
  });
  
  // Sort each property's history by year
  historicalMap.forEach((history, propId) => {
    historicalMap.set(propId, history.sort((a, b) => parseInt(a.year, 10) - parseInt(b.year, 10)));
  });
  
  // Create a simplified historical data structure for the app
  const historicalData = Array.from(historicalMap.entries()).map(([propId, history]) => ({
    propertyId: propId,
    valueHistory: history
  }));
  
  writeJsonFile(outputHistoricalDataFile, historicalData);
  console.log(`Processed historical data for ${historicalData.length} properties`);
  
  return historicalData;
}

/**
 * Process sales data
 */
function processSalesData(properties) {
  const salesData = readCsvFileSubset(salesChangeOwnerFile);
  console.log(`Loaded ${salesData.length} sales records`);
  
  const salesMap = new Map();
  
  // Group by property ID
  salesData.forEach(record => {
    const propId = record.prop_id?.trim();
    if (!propId) return;
    
    if (!salesMap.has(propId)) {
      salesMap.set(propId, []);
    }
    
    // Parse date
    let saleDate = null;
    try {
      if (record.sl_dt) {
        saleDate = new Date(record.sl_dt);
      }
    } catch (e) {
      console.warn(`Could not parse date: ${record.sl_dt}`);
    }
    
    // Add sales record
    const sale = {
      date: saleDate ? saleDate.toISOString().split('T')[0] : null,
      price: parseInt(record.sl_price || 0, 10),
      deedType: record.deed_type_cd?.trim() || null,
      buyer: record.grantee?.trim() || null,
      exciseNumber: record.excise_number?.trim() || null
    };
    
    // Only add if it has a price
    if (sale.price > 0) {
      salesMap.get(propId).push(sale);
    }
  });
  
  // Sort each property's sales by date (newest first)
  salesMap.forEach((sales, propId) => {
    salesMap.set(propId, sales.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    }));
  });
  
  // Create a simplified sales data structure for the app
  const formattedSalesData = Array.from(salesMap.entries()).map(([propId, sales]) => ({
    propertyId: propId,
    sales: sales
  }));
  
  writeJsonFile(outputSalesDataFile, formattedSalesData);
  console.log(`Processed sales data for ${formattedSalesData.length} properties`);
  
  // Update properties with latest sale data
  properties.forEach(property => {
    const propertyId = property.id.toString();
    if (salesMap.has(propertyId)) {
      const sales = salesMap.get(propertyId);
      if (sales.length > 0) {
        const latestSale = sales[0];
        property.lastSaleDate = latestSale.date;
        property.salePrice = latestSale.price.toString();
      }
    }
  });
  
  // Update the properties file with the enhanced data
  writeJsonFile(outputPropertiesFile, properties);
  
  return formattedSalesData;
}

/**
 * Process building permits data
 */
function processPermitsData() {
  const permitsData = readCsvFileSubset(permitsFile);
  console.log(`Loaded ${permitsData.length} permit records`);
  
  const permitsMap = new Map();
  
  // Group by property ID
  permitsData.forEach(record => {
    const propId = record.prop_id?.trim();
    if (!propId) return;
    
    if (!permitsMap.has(propId)) {
      permitsMap.set(propId, []);
    }
    
    // Parse date
    let issueDate = null;
    try {
      if (record.bldg_permit_issue_dt) {
        issueDate = new Date(record.bldg_permit_issue_dt);
      }
    } catch (e) {
      console.warn(`Could not parse date: ${record.bldg_permit_issue_dt}`);
    }
    
    // Add permit record
    const permit = {
      permitId: record.bldg_permit_id?.trim() || null,
      permitNumber: record.bldg_permit_num?.trim() || null,
      type: record.bldg_permit_type_cd?.trim() || null,
      description: record.bld_permit_desc?.trim() || null,
      issueDate: issueDate ? issueDate.toISOString().split('T')[0] : null,
      value: parseInt(record.bldg_permit_val || 0, 10),
      status: record.bldg_permit_status?.trim() || 'Active',
      comments: record.bldg_permit_cmnt?.trim() || null
    };
    
    permitsMap.get(propId).push(permit);
  });
  
  // Sort each property's permits by date (newest first)
  permitsMap.forEach((permits, propId) => {
    permitsMap.set(propId, permits.sort((a, b) => {
      if (!a.issueDate) return 1;
      if (!b.issueDate) return -1;
      return new Date(b.issueDate) - new Date(a.issueDate);
    }));
  });
  
  // Create a simplified permits data structure for the app
  const formattedPermitsData = Array.from(permitsMap.entries()).map(([propId, permits]) => ({
    propertyId: propId,
    permits: permits
  }));
  
  writeJsonFile(outputPermitsDataFile, formattedPermitsData);
  console.log(`Processed permits data for ${formattedPermitsData.length} properties`);
  
  return formattedPermitsData;
}

/**
 * Main function to process all data
 */
function processAllData() {
  console.log('Starting data processing...');
  
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Process all data types
    const properties = processPropertyData();
    processHistoricalData(properties);
    processSalesData(properties);
    processPermitsData();
    
    console.log('Data processing complete!');
  } catch (error) {
    console.error('Error processing data:', error);
  }
}

// Run the data processing when this script is executed directly
processAllData();