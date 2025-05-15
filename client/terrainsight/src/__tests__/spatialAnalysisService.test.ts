import {
  calculateDistance,
  isPointInPolygon,
  calculateSpatialWeights,
  findHotspots,
  performGWR,
  filterProperties,
  findNearestComparables,
  clusterProperties,
  calculateMoransI,
  KernelType
} from '../services/spatialAnalysisService';
import { Property } from '@shared/schema';

// Mock property data for testing
const mockProperties: Property[] = [
  {
    id: 1,
    parcelId: 'TEST001',
    address: '123 Test St',
    latitude: 46.2,
    longitude: -119.1,
    squareFeet: 2000,
    yearBuilt: 2000,
    value: '$300,000',
    propertyType: 'Residential',
    owner: 'Test Owner 1',
    salePrice: '$290,000',
    lastSaleDate: '2022-01-15',
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 8000,
    neighborhood: 'Test Neighborhood',
    zoning: 'R1',
    taxAssessment: '$280,000',
    landValue: '$100,000',
    attributes: null
  },
  {
    id: 2,
    parcelId: 'TEST002',
    address: '456 Test Ave',
    latitude: 46.21,
    longitude: -119.12,
    squareFeet: 2200,
    yearBuilt: 2005,
    value: '$350,000',
    propertyType: 'Residential',
    owner: 'Test Owner 2',
    salePrice: '$340,000',
    lastSaleDate: '2021-10-10',
    bedrooms: 3,
    bathrooms: 2.5,
    lotSize: 7500,
    neighborhood: 'Test Neighborhood',
    zoning: 'R1',
    taxAssessment: '$330,000',
    landValue: '$120,000',
    attributes: null
  },
  {
    id: 3,
    parcelId: 'TEST003',
    address: '789 Test Blvd',
    latitude: 46.19,
    longitude: -119.09,
    squareFeet: 1800,
    yearBuilt: 1990,
    value: '$250,000',
    propertyType: 'Residential',
    owner: 'Test Owner 3',
    salePrice: '$240,000',
    lastSaleDate: '2022-03-20',
    bedrooms: 3,
    bathrooms: 1.5,
    lotSize: 6500,
    neighborhood: 'Other Neighborhood',
    zoning: 'R1',
    taxAssessment: '$235,000',
    landValue: '$90,000',
    attributes: null
  },
  {
    id: 4,
    parcelId: 'TEST004',
    address: '111 Commercial Way',
    latitude: 46.22,
    longitude: -119.15,
    squareFeet: 5000,
    yearBuilt: 2010,
    value: '$750,000',
    propertyType: 'Commercial',
    owner: 'Test Owner 4',
    salePrice: '$700,000',
    lastSaleDate: '2021-05-05',
    bedrooms: null,
    bathrooms: null,
    lotSize: 15000,
    neighborhood: 'Business District',
    zoning: 'C1',
    taxAssessment: '$720,000',
    landValue: '$300,000',
    attributes: null
  },
  {
    id: 5,
    parcelId: 'TEST005',
    address: '222 Nearby Rd',
    latitude: 46.205,
    longitude: -119.11,
    squareFeet: 1950,
    yearBuilt: 2001,
    value: '$310,000',
    propertyType: 'Residential',
    owner: 'Test Owner 5',
    salePrice: '$300,000',
    lastSaleDate: '2022-02-10',
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 7800,
    neighborhood: 'Test Neighborhood',
    zoning: 'R1',
    taxAssessment: '$295,000',
    landValue: '$105,000',
    attributes: null
  }
];

describe('Spatial Analysis Service - Core Functions', () => {
  test('calculateDistance should compute haversine distance correctly', () => {
    // Test with known coordinates and expected distance
    const lat1 = 46.2;
    const lng1 = -119.1;
    const lat2 = 46.21;
    const lng2 = -119.12;
    
    // Distance should be around 1.5 km
    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(2);
    
    // Distance to self should be 0
    const selfDistance = calculateDistance(lat1, lng1, lat1, lng1);
    expect(selfDistance).toBe(0);
  });
  
  test('isPointInPolygon should determine if point is inside polygon', () => {
    // Define a square polygon
    const polygon = [
      { lat: 46.19, lng: -119.09 },
      { lat: 46.19, lng: -119.11 },
      { lat: 46.21, lng: -119.11 },
      { lat: 46.21, lng: -119.09 }
    ];
    
    // Test points inside and outside
    expect(isPointInPolygon(46.20, -119.10, polygon)).toBe(true);
    expect(isPointInPolygon(46.22, -119.12, polygon)).toBe(false);
  });
  
  test('calculateSpatialWeights should generate weight matrix using different kernels', () => {
    const points = [
      { lat: 46.2, lng: -119.1 },
      { lat: 46.21, lng: -119.12 },
      { lat: 46.19, lng: -119.09 }
    ];
    
    // Test gaussian kernel
    const gaussianWeights = calculateSpatialWeights(points, 'gaussian', 5);
    expect(gaussianWeights.length).toBe(points.length);
    expect(gaussianWeights[0][0]).toBe(1); // Self weight should be 1
    expect(gaussianWeights[0][1]).toBeGreaterThan(0); // Should have positive weight
    expect(gaussianWeights[0][1]).toBeLessThan(1); // But less than 1
    
    // Test bisquare kernel
    const bisquareWeights = calculateSpatialWeights(points, 'bisquare', 5);
    expect(bisquareWeights.length).toBe(points.length);
    
    // Test uniform kernel
    const uniformWeights = calculateSpatialWeights(points, 'uniform', 5);
    expect(uniformWeights.length).toBe(points.length);
    // Points close enough should have weight 1
    expect(uniformWeights.some(row => row.some(w => w === 1 && w !== row[row.indexOf(w)]))).toBe(true);
  });
});

describe('Spatial Analysis Service - Hotspot Analysis', () => {
  test('findHotspots should identify clusters of high and low values', () => {
    // Add more properties to create hotspots
    const testProperties = [
      ...mockProperties,
      // Add high-value cluster
      {
        id: 6,
        parcelId: 'HIGH001',
        address: 'High Value 1',
        latitude: 46.3,
        longitude: -119.3,
        squareFeet: 3000,
        yearBuilt: 2015,
        value: '$900,000',
        propertyType: 'Residential',
        owner: 'High Value Owner 1',
        neighborhood: 'Luxury Area',
        attributes: null
      },
      {
        id: 7,
        parcelId: 'HIGH002',
        address: 'High Value 2',
        latitude: 46.305,
        longitude: -119.31,
        squareFeet: 3200,
        yearBuilt: 2016,
        value: '$950,000',
        propertyType: 'Residential',
        owner: 'High Value Owner 2',
        neighborhood: 'Luxury Area',
        attributes: null
      },
      {
        id: 8,
        parcelId: 'HIGH003',
        address: 'High Value 3',
        latitude: 46.31,
        longitude: -119.305,
        squareFeet: 3100,
        yearBuilt: 2017,
        value: '$925,000',
        propertyType: 'Residential',
        owner: 'High Value Owner 3',
        neighborhood: 'Luxury Area',
        attributes: null
      },
      // Add low-value cluster
      {
        id: 9,
        parcelId: 'LOW001',
        address: 'Low Value 1',
        latitude: 46.1,
        longitude: -119.0,
        squareFeet: 1200,
        yearBuilt: 1970,
        value: '$120,000',
        propertyType: 'Residential',
        owner: 'Low Value Owner 1',
        neighborhood: 'Budget Area',
        attributes: null
      },
      {
        id: 10,
        parcelId: 'LOW002',
        address: 'Low Value 2',
        latitude: 46.105,
        longitude: -119.01,
        squareFeet: 1100,
        yearBuilt: 1965,
        value: '$110,000',
        propertyType: 'Residential',
        owner: 'Low Value Owner 2',
        neighborhood: 'Budget Area',
        attributes: null
      },
      {
        id: 11,
        parcelId: 'LOW003',
        address: 'Low Value 3',
        latitude: 46.11,
        longitude: -119.005,
        squareFeet: 1150,
        yearBuilt: 1968,
        value: '$115,000',
        propertyType: 'Residential',
        owner: 'Low Value Owner 3',
        neighborhood: 'Budget Area',
        attributes: null
      },
    ] as Property[];
    
    const hotspots = findHotspots(testProperties, 'value', 0.1, 1); // Using higher p-value for test
    
    // There should be some hot and cold spots
    expect(hotspots.hot.length).toBeGreaterThan(0);
    expect(hotspots.cold.length).toBeGreaterThan(0);
    
    // High value properties should be in hot spots
    const highValueIds = [6, 7, 8];
    expect(hotspots.hot.some(p => highValueIds.includes(p.id))).toBe(true);
    
    // Low value properties should be in cold spots
    const lowValueIds = [9, 10, 11];
    expect(hotspots.cold.some(p => lowValueIds.includes(p.id))).toBe(true);
  });
  
  test('calculateMoransI should measure spatial autocorrelation', () => {
    // Create points with spatial pattern (clustered)
    const points = [
      { lat: 46.2, lng: -119.1 },
      { lat: 46.21, lng: -119.11 },
      { lat: 46.205, lng: -119.105 },
      { lat: 46.3, lng: -119.3 },
      { lat: 46.31, lng: -119.31 },
      { lat: 46.305, lng: -119.305 }
    ];
    
    // Values are clustered (similar values are near each other)
    const clusteredValues = [100, 110, 105, 500, 510, 505];
    const clusteredI = calculateMoransI(clusteredValues, points);
    
    // Should have positive Moran's I for clustered data
    expect(clusteredI).toBeGreaterThan(0);
    
    // Values are dispersed (dissimilar values are near each other)
    const dispersedValues = [100, 500, 100, 500, 100, 500];
    const dispersedI = calculateMoransI(dispersedValues, points);
    
    // Should have negative Moran's I for dispersed data
    expect(dispersedI).toBeLessThan(0);
  });
});

describe('Spatial Analysis Service - Regression Analysis', () => {
  test('performGWR should calculate regression coefficients with geographic weighting', () => {
    // Create properties with spatial pattern
    const testProperties = mockProperties.slice(0, 5);
    // Add more properties with spatial distribution
    for (let i = 0; i < 30; i++) {
      // Random location in bounding box
      const lat = 46.1 + Math.random() * 0.3; // 46.1 to 46.4
      const lng = -119.2 + Math.random() * 0.3; // -119.2 to -118.9
      
      // Value depends on location plus random noise
      // Northern properties worth more
      const baseValue = 200000 + (lat - 46.1) * 1000000;
      const noise = (Math.random() - 0.5) * 50000;
      const valueStr = `$${Math.round(baseValue + noise).toLocaleString()}`;
      
      // Newer properties in north, older in south
      const yearBuilt = Math.round(1980 + (lat - 46.1) * 100);
      
      testProperties.push({
        id: 100 + i,
        parcelId: `GWR${i.toString().padStart(3, '0')}`,
        address: `${i} GWR Test St`,
        latitude: lat,
        longitude: lng,
        squareFeet: 1500 + Math.round(Math.random() * 1500),
        yearBuilt,
        value: valueStr,
        propertyType: 'Residential',
        owner: `GWR Owner ${i}`,
        salePrice: null,
        lastSaleDate: null,
        bedrooms: Math.round(2 + Math.random() * 2),
        bathrooms: Math.round((2 + Math.random() * 2) * 2) / 2, // 2, 2.5, 3, 3.5, 4
        lotSize: 5000 + Math.round(Math.random() * 5000),
        neighborhood: lat > 46.25 ? 'North Sector' : 'South Sector',
        zoning: 'R1',
        taxAssessment: null,
        landValue: null,
        attributes: null
      } as Property);
    }
    
    const result = performGWR(testProperties, ['squareFeet', 'yearBuilt', 'bedrooms'], 'value', 0.1);
    
    // Should have coefficient for each location
    expect(result.coefficients.length).toBe(testProperties.length);
    expect(result.localR2.length).toBe(testProperties.length);
    
    // Should have reasonable global R²
    expect(result.globalR2).toBeGreaterThan(0);
    expect(result.globalR2).toBeLessThanOrEqual(1);
    
    // Coefficients should vary by location
    const yearBuiltCoeffs = result.coefficients.map(c => c.yearBuilt);
    const squareFeetCoeffs = result.coefficients.map(c => c.squareFeet);
    
    // Calculate standard deviation of coefficients
    const mean = (arr: number[]) => arr.reduce((sum, val) => sum + val, 0) / arr.length;
    const stdDev = (arr: number[]) => {
      const m = mean(arr);
      const variance = arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
      return Math.sqrt(variance);
    };
    
    // Coefficients should vary spatially (have non-zero standard deviation)
    expect(stdDev(yearBuiltCoeffs)).toBeGreaterThan(0);
    expect(stdDev(squareFeetCoeffs)).toBeGreaterThan(0);
  });
});

describe('Spatial Analysis Service - Spatial Filtering', () => {
  test('filterProperties should filter by radius', () => {
    const center = { lat: 46.2, lng: -119.1 };
    const radius = 2; // 2km radius
    
    const filtered = filterProperties(mockProperties, {
      centerPoint: center,
      radius
    });
    
    // Should return some properties but not all
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(mockProperties.length);
    
    // All returned properties should be within radius
    filtered.forEach(property => {
      const distance = calculateDistance(
        property.latitude as number,
        property.longitude as number,
        center.lat,
        center.lng
      );
      expect(distance).toBeLessThanOrEqual(radius);
    });
  });
  
  test('filterProperties should filter by polygon', () => {
    const polygon = [
      { lat: 46.19, lng: -119.09 },
      { lat: 46.19, lng: -119.12 },
      { lat: 46.22, lng: -119.12 },
      { lat: 46.22, lng: -119.09 }
    ];
    
    const filtered = filterProperties(mockProperties, { polygon });
    
    // Should return some properties but not all
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(mockProperties.length);
    
    // All returned properties should be within polygon
    filtered.forEach(property => {
      expect(isPointInPolygon(
        property.latitude as number,
        property.longitude as number,
        polygon
      )).toBe(true);
    });
  });
  
  test('filterProperties should combine spatial and attribute filters', () => {
    const filtered = filterProperties(mockProperties, {
      centerPoint: { lat: 46.2, lng: -119.1 },
      radius: 5,
      minValue: 300000,
      propertyType: 'Residential'
    });
    
    // Should filter correctly
    expect(filtered.length).toBeGreaterThan(0);
    
    // All properties should match all criteria
    filtered.forEach(property => {
      // Should be within radius
      const distance = calculateDistance(
        property.latitude as number,
        property.longitude as number,
        46.2,
        -119.1
      );
      expect(distance).toBeLessThanOrEqual(5);
      
      // Should match property type
      expect(property.propertyType).toBe('Residential');
      
      // Should have value >= minValue
      const value = parseFloat(property.value!.replace(/[^0-9.-]+/g, ''));
      expect(value).toBeGreaterThanOrEqual(300000);
    });
  });
});

describe('Spatial Analysis Service - Comparables and Clustering', () => {
  test('findNearestComparables should find similar properties', () => {
    const referenceProperty = mockProperties[0];
    const comparables = findNearestComparables(referenceProperty, mockProperties, 3);
    
    // Should return requested number of comparables
    expect(comparables.length).toBe(3);
    
    // Should not include the reference property
    expect(comparables.find(p => p.id === referenceProperty.id)).toBeUndefined();
    
    // First comparable should be most similar
    const firstComparable = comparables[0];
    expect(firstComparable.propertyType).toBe(referenceProperty.propertyType);
    
    // Similarity should be based partly on distance
    const distToFirst = calculateDistance(
      referenceProperty.latitude as number,
      referenceProperty.longitude as number,
      firstComparable.latitude as number,
      firstComparable.longitude as number
    );
    
    // Distance to first comparable should be reasonable
    expect(distToFirst).toBeLessThan(10);
  });
  
  test('clusterProperties should create logical clusters', () => {
    // Create more properties for better clustering
    const testProperties = [
      ...mockProperties,
      // North cluster (expensive)
      {
        id: 101,
        parcelId: 'N001',
        address: 'North 1',
        latitude: 46.3,
        longitude: -119.1,
        squareFeet: 2500,
        yearBuilt: 2015,
        value: '$500,000',
        propertyType: 'Residential',
        owner: 'North Owner 1',
        neighborhood: 'North Sector',
        attributes: null
      },
      {
        id: 102,
        parcelId: 'N002',
        address: 'North 2',
        latitude: 46.31,
        longitude: -119.11,
        squareFeet: 2600,
        yearBuilt: 2016,
        value: '$520,000',
        propertyType: 'Residential',
        owner: 'North Owner 2',
        neighborhood: 'North Sector',
        attributes: null
      },
      // South cluster (cheaper)
      {
        id: 103,
        parcelId: 'S001',
        address: 'South 1',
        latitude: 46.1,
        longitude: -119.1,
        squareFeet: 1500,
        yearBuilt: 1985,
        value: '$200,000',
        propertyType: 'Residential',
        owner: 'South Owner 1',
        neighborhood: 'South Sector',
        attributes: null
      },
      {
        id: 104,
        parcelId: 'S002',
        address: 'South 2',
        latitude: 46.11,
        longitude: -119.11,
        squareFeet: 1600,
        yearBuilt: 1988,
        value: '$210,000',
        propertyType: 'Residential',
        owner: 'South Owner 2',
        neighborhood: 'South Sector',
        attributes: null
      },
    ] as Property[];
    
    const result = clusterProperties(testProperties, ['value'], 3, 0.5);
    
    // Should create the requested number of clusters
    expect(new Set(result.clusters).size).toBeLessThanOrEqual(3);
    
    // Should have cluster centers
    expect(result.clusterCenters.length).toBe(3);
    
    // Should have stats for each cluster
    expect(result.clusterStats.length).toBe(3);
    
    // The expensive cluster should have higher mean value
    const expensiveClusterIndex = result.clusterStats.findIndex(
      stats => stats.meanValue === Math.max(...result.clusterStats.map(s => s.meanValue))
    );
    
    // The north properties should tend to be in the expensive cluster
    const northPropertyIndices = testProperties
      .map((p, i) => p.id >= 101 && p.id <= 102 ? i : -1)
      .filter(i => i >= 0);
    
    // At least one north property should be in expensive cluster
    const northPropertiesInExpensiveCluster = northPropertyIndices.filter(
      i => result.clusters[i] === expensiveClusterIndex
    );
    expect(northPropertiesInExpensiveCluster.length).toBeGreaterThan(0);
  });
});