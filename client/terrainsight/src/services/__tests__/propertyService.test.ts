import { propertyService, PropertyFilterParams } from '../propertyService';

// Mock the queryClient module
const apiRequest = jest.fn();

// Mock the queryClient module
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn()
}));

describe('PropertyService', () => {
  beforeEach(() => {
    // Reset mock between tests
    jest.clearAllMocks();
  });

  describe('getProperties', () => {
    test('returns properties from API', async () => {
      // Mock API response
      const mockProperties = [
        { id: '1', parcelId: 'P123', address: '123 Main St', squareFeet: 2000 },
        { id: '2', parcelId: 'P456', address: '456 Oak Ave', squareFeet: 2500 }
      ];
      
      (apiRequest as jest.Mock).mockResolvedValue(mockProperties);
      
      // Call the service method
      const result = await propertyService.getProperties();
      
      // Verify the results
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/properties');
      expect(result).toEqual(mockProperties);
    });
    
    test('throws error when API fails', async () => {
      // Mock API error
      const mockError = new Error('API error');
      (apiRequest as jest.Mock).mockRejectedValue(mockError);
      
      // Call the service method and expect it to throw
      await expect(propertyService.getProperties()).rejects.toThrow('API error');
      
      // Verify the API was called
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/properties');
    });
  });
  
  describe('getPropertyById', () => {
    test('returns a single property by ID', async () => {
      // Mock API response
      const mockProperty = { id: '1', parcelId: 'P123', address: '123 Main St', squareFeet: 2000 };
      (apiRequest as jest.Mock).mockResolvedValue(mockProperty);
      
      // Call the service method
      const result = await propertyService.getPropertyById('1');
      
      // Verify the results
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/properties/1');
      expect(result).toEqual(mockProperty);
    });
  });
  
  describe('getFilteredProperties', () => {
    test('returns filtered properties with query parameters', async () => {
      // Mock API response
      const mockFilteredProperties = [
        { id: '2', parcelId: 'P456', address: '456 Oak Ave', squareFeet: 2500, yearBuilt: 2010 }
      ];
      
      (apiRequest as jest.Mock).mockResolvedValue(mockFilteredProperties);
      
      // Create filter parameters
      const filters: PropertyFilterParams = {
        minYearBuilt: 2000,
        maxSquareFeet: 3000,
        sortBy: 'value',
        sortOrder: 'desc'
      };
      
      // Call the service method
      const result = await propertyService.getFilteredProperties(filters);
      
      // Verify the results
      expect(apiRequest).toHaveBeenCalledWith(
        'GET', 
        expect.stringContaining('/api/properties?')
      );
      
      // Verify query parameters
      const apiCall = (apiRequest as jest.Mock).mock.calls[0][1];
      expect(apiCall).toContain('minYearBuilt=2000');
      expect(apiCall).toContain('maxSquareFeet=3000');
      expect(apiCall).toContain('sortBy=value');
      expect(apiCall).toContain('sortOrder=desc');
      
      expect(result).toEqual(mockFilteredProperties);
    });
    
    test('handles empty filter parameters', async () => {
      // Mock API response
      const mockProperties = [
        { id: '1', parcelId: 'P123', address: '123 Main St', squareFeet: 2000 },
        { id: '2', parcelId: 'P456', address: '456 Oak Ave', squareFeet: 2500 }
      ];
      
      (apiRequest as jest.Mock).mockResolvedValue(mockProperties);
      
      // Call the service method with empty filters
      const result = await propertyService.getFilteredProperties({});
      
      // Verify the results
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/properties');
      expect(result).toEqual(mockProperties);
    });
  });
  
  describe('searchProperties', () => {
    test('returns properties matching search text', async () => {
      // Mock API response
      const mockSearchResults = [
        { id: '1', parcelId: 'P123', address: '123 Main St', squareFeet: 2000 }
      ];
      
      (apiRequest as jest.Mock).mockResolvedValue(mockSearchResults);
      
      // Call the service method
      const result = await propertyService.searchProperties('Main');
      
      // Verify the results
      expect(apiRequest).toHaveBeenCalledWith('GET', '/api/properties/search?q=Main');
      expect(result).toEqual(mockSearchResults);
    });
  });
  
  describe('findSimilarProperties', () => {
    test('returns similar properties to reference property', async () => {
      // Mock API response
      const mockSimilarProperties = [
        { id: '2', parcelId: 'P456', address: '456 Oak Ave', squareFeet: 2500 },
        { id: '3', parcelId: 'P789', address: '789 Pine St', squareFeet: 2200 }
      ];
      
      (apiRequest as jest.Mock).mockResolvedValue(mockSimilarProperties);
      
      // Call the service method
      const result = await propertyService.findSimilarProperties('1', 3);
      
      // Verify the results
      expect(apiRequest).toHaveBeenCalledWith(
        'GET', 
        '/api/properties/similar?referenceId=1&limit=3'
      );
      expect(result).toEqual(mockSimilarProperties);
    });
    
    test('uses default limit when not specified', async () => {
      // Mock API response
      const mockSimilarProperties = [
        { id: '2', parcelId: 'P456', address: '456 Oak Ave', squareFeet: 2500 }
      ];
      
      (apiRequest as jest.Mock).mockResolvedValue(mockSimilarProperties);
      
      // Call the service method without specifying limit
      await propertyService.findSimilarProperties('1');
      
      // Verify the default limit was used
      expect(apiRequest).toHaveBeenCalledWith(
        'GET', 
        '/api/properties/similar?referenceId=1&limit=5'
      );
    });
  });
  
  describe('getPropertiesInRegion', () => {
    test('returns properties within geographical bounds', async () => {
      // Mock API response
      const mockRegionProperties = [
        { id: '1', parcelId: 'P123', address: '123 Main St', squareFeet: 2000, coordinates: [46.2, -119.1] }
      ];
      
      (apiRequest as jest.Mock).mockResolvedValue(mockRegionProperties);
      
      // Call the service method with bounds
      const bounds: [number, number, number, number] = [46.1, -119.2, 46.3, -119.0]; // [south, west, north, east]
      const result = await propertyService.getPropertiesInRegion(bounds);
      
      // Verify the results
      expect(apiRequest).toHaveBeenCalledWith(
        'GET', 
        '/api/properties/region?south=46.1&west=-119.2&north=46.3&east=-119'
      );
      expect(result).toEqual(mockRegionProperties);
    });
  });
});