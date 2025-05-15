import { Property, InsertProperty } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

/**
 * Service for importing data from various sources into the application
 */

/**
 * Parse a CSV string into an array of objects
 * @param csvText The CSV text content
 * @param hasHeaderRow Whether the CSV has a header row
 * @returns An array of objects with keys from the header row and values from each data row
 */
export function parseCSV(csvText: string, hasHeaderRow: boolean = true): Record<string, string>[] {
  // Split by newlines and filter out empty rows
  const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== '');
  
  if (rows.length === 0) {
    return [];
  }
  
  // Convert first row to headers or use default column indexes
  const headers = hasHeaderRow
    ? parseCSVRow(rows[0])
    : Array.from({ length: parseCSVRow(rows[0]).length }, (_, i) => `column${i}`);
  
  // Start from index 0 or 1 depending on whether we have a header row
  const startRowIndex = hasHeaderRow ? 1 : 0;
  
  // Parse each data row
  return rows.slice(startRowIndex).map(row => {
    const values = parseCSVRow(row);
    return headers.reduce((obj, header, index) => {
      obj[header] = index < values.length ? values[index] : '';
      return obj;
    }, {} as Record<string, string>);
  });
}

/**
 * Parse a single CSV row into an array of values, handling quotes and commas
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Handle escaped quotes (double quotes)
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}

/**
 * Convert parsed CSV data to property objects
 * @param csvData Array of objects from parsed CSV
 * @param mapping Mapping from CSV column names to property field names
 * @returns Array of property objects ready for insertion
 */
export function convertCSVToProperties(
  csvData: Record<string, string>[],
  mapping: Record<string, keyof InsertProperty>
): Partial<InsertProperty>[] {
  return csvData.map(row => {
    const property: Partial<InsertProperty> = {};
    
    // Apply mapping to convert CSV fields to property fields
    Object.entries(mapping).forEach(([csvField, propField]) => {
      if (row[csvField] !== undefined) {
        // Convert values based on field type
        const value = row[csvField];
        
        // Type conversions based on the expected property field type
        switch (propField) {
          case 'squareFeet':
          case 'yearBuilt':
          case 'bedrooms':
          case 'bathrooms':
          case 'lotSize':
            // Convert to integer or undefined if empty
            property[propField] = value.trim() ? parseInt(value, 10) : undefined;
            break;
          case 'latitude':
          case 'longitude':
            // Store as string for numeric type in database
            property[propField] = value.trim() ? value : undefined;
            break;
          case 'coordinates':
            // Handle special case for coordinates if provided as separate lat/lng
            if (row['latitude'] && row['longitude']) {
              property.coordinates = { lat: row['latitude'], lng: row['longitude'] };
            }
            break;
          case 'value':
          case 'salePrice':
          case 'landValue':
          case 'taxAssessment':
          case 'pricePerSqFt':
            // These are text fields in the schema
            property[propField] = value;
            break;
          default:
            // All other fields are strings
            property[propField] = value;
        }
      }
    });
    
    return property;
  });
}

/**
 * Import properties from CSV data
 * @param properties Array of property objects to import
 * @returns Response from the API
 */
export async function importProperties(properties: Partial<InsertProperty>[]): Promise<{ success: boolean, imported: number, errors: any[] }> {
  try {
    const result = await apiRequest<{ success: boolean, imported: number, errors: any[] }>('POST', '/api/properties/import', { properties });
    return result;
  } catch (error) {
    console.error('Error importing properties:', error);
    throw error;
  }
}

/**
 * Default field mapping for common CSV column names to property fields
 */
export const defaultPropertyFieldMapping: Record<string, keyof InsertProperty> = {
  'parcel_id': 'parcelId',
  'parcel id': 'parcelId', 
  'parcelid': 'parcelId',
  'address': 'address',
  'owner': 'owner',
  'value': 'value',
  'sale_price': 'salePrice',
  'sale price': 'salePrice',
  'saleprice': 'salePrice',
  'square_feet': 'squareFeet',
  'square feet': 'squareFeet',
  'squarefeet': 'squareFeet',
  'sqft': 'squareFeet',
  'year_built': 'yearBuilt',
  'year built': 'yearBuilt',
  'yearbuilt': 'yearBuilt',
  'land_value': 'landValue',
  'land value': 'landValue',
  'landvalue': 'landValue',
  'latitude': 'latitude',
  'lat': 'latitude',
  'longitude': 'longitude',
  'lng': 'longitude',
  'long': 'longitude',
  'neighborhood': 'neighborhood',
  'property_type': 'propertyType',
  'property type': 'propertyType',
  'propertytype': 'propertyType',
  'bedrooms': 'bedrooms',
  'beds': 'bedrooms',
  'bathrooms': 'bathrooms',
  'baths': 'bathrooms',
  'lot_size': 'lotSize',
  'lot size': 'lotSize',
  'lotsize': 'lotSize',
  'zoning': 'zoning',
  'last_sale_date': 'lastSaleDate',
  'last sale date': 'lastSaleDate',
  'lastsaledate': 'lastSaleDate',
  'tax_assessment': 'taxAssessment',
  'tax assessment': 'taxAssessment',
  'taxassessment': 'taxAssessment',
  'price_per_sqft': 'pricePerSqFt',
  'price per sqft': 'pricePerSqFt',
  'pricepersqft': 'pricePerSqFt',
};