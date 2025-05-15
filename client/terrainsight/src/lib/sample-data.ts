import { Property } from '@shared/schema';

// Sample properties for demo purposes
export const sampleProperties: Property[] = [
  {
    id: 1,
    parcelId: 'BP-12345',
    address: '123 Main St, Kennewick, WA 99336',
    owner: 'John Smith',
    value: '450000',
    propertyType: 'residential',
    yearBuilt: 1995,
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2400,
    lotSize: 9500,
    neighborhood: 'South Hills',
    lastSaleDate: '2020-05-15',
    salePrice: '425000',
    taxAssessment: '440000',
    estimatedValue: 450000,
    zoning: 'R-1',
    latitude: 46.2112,
    longitude: -119.1368,
    attributes: {
      constructionQuality: 'Good',
      condition: 'Well-maintained',
      roofType: 'Composite',
      extWalls: 'Vinyl siding',
      foundation: 'Concrete',
      fireplaces: 1
    }
  },
  {
    id: 2,
    parcelId: 'BP-23456',
    address: '456 Oak Ave, Richland, WA 99352',
    owner: 'Emily Johnson',
    value: '385000',
    propertyType: 'residential',
    yearBuilt: 1987,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1850,
    lotSize: 7200,
    neighborhood: 'North Richland',
    lastSaleDate: '2019-08-22',
    salePrice: '365000',
    taxAssessment: '375000',
    estimatedValue: 385000,
    zoning: 'R-1',
    latitude: 46.2821,
    longitude: -119.2916,
    attributes: {
      constructionQuality: 'Average',
      condition: 'Average',
      roofType: 'Asphalt shingle',
      extWalls: 'Brick',
      foundation: 'Concrete',
      fireplaces: 1
    }
  },
  {
    id: 3,
    parcelId: 'BP-34567',
    address: '789 Pine Ln, Kennewick, WA 99336',
    owner: 'Michael Williams',
    value: '520000',
    propertyType: 'residential',
    yearBuilt: 2005,
    bedrooms: 5,
    bathrooms: 3,
    squareFeet: 3200,
    lotSize: 12000,
    neighborhood: 'Canyon Lakes',
    lastSaleDate: '2018-11-08',
    salePrice: '485000',
    taxAssessment: '510000',
    estimatedValue: 520000,
    zoning: 'R-1',
    latitude: 46.2354,
    longitude: -119.2213,
    attributes: {
      constructionQuality: 'Very Good',
      condition: 'Excellent',
      roofType: 'Tile',
      extWalls: 'Stucco',
      foundation: 'Concrete',
      fireplaces: 2
    }
  },
  {
    id: 4,
    parcelId: 'BP-45678',
    address: '321 River Rd, Pasco, WA 99301',
    owner: 'Sarah Brown',
    value: '295000',
    propertyType: 'residential',
    yearBuilt: 1974,
    bedrooms: 3,
    bathrooms: 1.5,
    squareFeet: 1550,
    lotSize: 6800,
    neighborhood: 'East Pasco',
    lastSaleDate: '2021-02-25',
    salePrice: '285000',
    taxAssessment: '290000',
    estimatedValue: 295000,
    zoning: 'R-1',
    latitude: 46.2486,
    longitude: -119.0967,
    attributes: {
      constructionQuality: 'Average',
      condition: 'Fair',
      roofType: 'Asphalt shingle',
      extWalls: 'Wood siding',
      foundation: 'Concrete',
      fireplaces: 0
    }
  },
  {
    id: 5,
    parcelId: 'BP-56789',
    address: '555 Columbia Dr, Richland, WA 99352',
    owner: 'David Miller',
    value: '645000',
    propertyType: 'residential',
    yearBuilt: 2015,
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 3800,
    lotSize: 15000,
    neighborhood: 'Meadow Springs',
    lastSaleDate: '2020-09-15',
    salePrice: '620000',
    taxAssessment: '635000',
    estimatedValue: 645000,
    zoning: 'R-1',
    latitude: 46.2927,
    longitude: -119.3053,
    attributes: {
      constructionQuality: 'Excellent',
      condition: 'Excellent',
      roofType: 'Composite',
      extWalls: 'Stone and siding',
      foundation: 'Concrete',
      fireplaces: 2
    }
  },
  {
    id: 6,
    parcelId: 'BP-67890',
    address: '987 Vineyard Way, Benton City, WA 99320',
    owner: 'Jennifer Davis',
    value: '420000',
    propertyType: 'residential',
    yearBuilt: 2000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 2100,
    lotSize: 30000,
    neighborhood: 'Red Mountain',
    lastSaleDate: '2017-06-30',
    salePrice: '375000',
    taxAssessment: '410000',
    estimatedValue: 420000,
    zoning: 'RA-5',
    latitude: 46.2677,
    longitude: -119.4764,
    attributes: {
      constructionQuality: 'Good',
      condition: 'Good',
      roofType: 'Metal',
      extWalls: 'Wood siding',
      foundation: 'Concrete',
      fireplaces: 1
    }
  },
  {
    id: 7,
    parcelId: 'BP-78901',
    address: '125 Vista Blvd, Kennewick, WA 99336',
    owner: 'Robert Wilson',
    value: '370000',
    propertyType: 'residential',
    yearBuilt: 1990,
    bedrooms: 4,
    bathrooms: 2,
    squareFeet: 1950,
    lotSize: 8500,
    neighborhood: 'Vista',
    lastSaleDate: '2019-04-10',
    salePrice: '350000',
    taxAssessment: '365000',
    estimatedValue: 370000,
    zoning: 'R-1',
    latitude: 46.2185,
    longitude: -119.1655,
    attributes: {
      constructionQuality: 'Good',
      condition: 'Good',
      roofType: 'Asphalt shingle',
      extWalls: 'Vinyl siding',
      foundation: 'Concrete',
      fireplaces: 1
    }
  },
  {
    id: 8,
    parcelId: 'BP-89012',
    address: '444 Gage Blvd, Richland, WA 99352',
    owner: 'Lisa Thompson',
    value: '410000',
    propertyType: 'residential',
    yearBuilt: 1998,
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 2250,
    lotSize: 9000,
    neighborhood: 'Gage Boulevard',
    lastSaleDate: '2020-07-22',
    salePrice: '395000',
    taxAssessment: '405000',
    estimatedValue: 410000,
    zoning: 'R-1',
    latitude: 46.2731,
    longitude: -119.2792,
    attributes: {
      constructionQuality: 'Good',
      condition: 'Good',
      roofType: 'Composite',
      extWalls: 'Hardiplank',
      foundation: 'Concrete',
      fireplaces: 1
    }
  },
  {
    id: 9,
    parcelId: 'BP-90123',
    address: '765 Court St, Pasco, WA 99301',
    owner: 'James Anderson',
    value: '335000',
    propertyType: 'residential',
    yearBuilt: 1985,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    lotSize: 7500,
    neighborhood: 'Central Pasco',
    lastSaleDate: '2021-01-15',
    salePrice: '325000',
    taxAssessment: '330000',
    estimatedValue: 335000,
    zoning: 'R-1',
    latitude: 46.2345,
    longitude: -119.0895,
    attributes: {
      constructionQuality: 'Average',
      condition: 'Average',
      roofType: 'Asphalt shingle',
      extWalls: 'Brick',
      foundation: 'Concrete',
      fireplaces: 0
    }
  },
  {
    id: 10,
    parcelId: 'BP-12349',
    address: '220 Keene Rd, Richland, WA 99352',
    owner: 'Susan Jackson',
    value: '495000',
    propertyType: 'residential',
    yearBuilt: 2008,
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2800,
    lotSize: 10500,
    neighborhood: 'South Richland',
    lastSaleDate: '2020-11-05',
    salePrice: '480000',
    taxAssessment: '490000',
    estimatedValue: 495000,
    zoning: 'R-1',
    latitude: 46.2554,
    longitude: -119.2977,
    attributes: {
      constructionQuality: 'Very Good',
      condition: 'Very Good',
      roofType: 'Composite',
      extWalls: 'Stone and siding',
      foundation: 'Concrete',
      fireplaces: 1
    }
  }
];

// Parse functions for property data
export function parseNumericValue(value: string | null): number {
  if (!value) return 0;
  
  // Remove any non-numeric characters except decimal point
  const numericValue = value.replace(/[^0-9.]/g, '');
  return parseFloat(numericValue) || 0;
}

export function formatCurrency(value: number | string | null): string {
  if (value === null || value === undefined) return '$0';
  
  const numericValue = typeof value === 'string' ? parseNumericValue(value) : value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericValue);
}