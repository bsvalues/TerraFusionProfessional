import { contextualPredictionService, type ContextualPredictionRequest } from '../services/ml/contextualPredictionService';
import { advancedRegressionService } from '../services/ml/advancedRegressionService';

// Mock the dependencies
jest.mock('../services/ml/advancedRegressionService', () => ({
  advancedRegressionService: {
    predictWithConfidence: jest.fn().mockReturnValue({
      predictedValue: 500000,
      confidence: 0.8
    })
  }
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Contextual Prediction Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should generate a prediction with contextual insights', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        predictedValue: 525000,
        confidence: 0.85,
        adjustmentFactors: [
          { factor: 'Location Premium', impact: 5, description: 'Property is in a desirable neighborhood' },
          { factor: 'Recent Sales', impact: 3, description: 'Recent comparable sales trending upward' },
          { factor: 'Property Age', impact: -2, description: 'Property is older than comparable properties' }
        ],
        explanation: 'The valuation is based on recent sales with adjustments for location and condition',
        comparableProperties: [
          {
            property: { id: '2', address: '456 Oak Ave', value: '375000' },
            similarity: 0.92,
            adjustedValue: 390000,
            keyDifferences: []
          }
        ]
      })
    });

    // Test data
    const property = {
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
    };

    const comparableProperties = [
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
      }
    ];

    const context = 'This property was recently renovated with new kitchen and bathrooms. The neighborhood has seen increasing demand in the past year.';

    const request: ContextualPredictionRequest = {
      property,
      context,
      comparableProperties,
      includeExplanation: true,
      confidenceLevel: 95
    };

    // Call the service
    const result = await contextualPredictionService.predictPropertyValue(request);

    // Assert the ML service was called
    expect(advancedRegressionService.predictWithConfidence).toHaveBeenCalledWith(
      property,
      comparableProperties
    );

    // Assert the API was called
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ml/contextual-prediction',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      })
    );

    // Assert the result structure
    expect(result).toEqual(expect.objectContaining({
      predictedValue: expect.any(Number),
      aiPredictedValue: expect.any(Number),
      mlPredictedValue: expect.any(Number),
      confidenceInterval: expect.objectContaining({
        min: expect.any(Number),
        max: expect.any(Number),
        level: expect.any(Number)
      }),
      adjustmentFactors: expect.arrayContaining([
        expect.objectContaining({
          factor: expect.any(String),
          impact: expect.any(Number),
          description: expect.any(String)
        })
      ]),
      explanation: expect.any(String)
    }));
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

    // Test data
    const property = {
      id: '1',
      address: '123 Main St',
      value: '450000',
      squareFeet: 2500,
      yearBuilt: 1998
    };

    const request: ContextualPredictionRequest = {
      property,
      context: 'Simple test context',
      includeExplanation: true
    };

    // Call the service
    const result = await contextualPredictionService.predictPropertyValue(request);

    // Assert the result falls back to ML prediction with basic adjustments
    expect(result.mlPredictedValue).toBe(500000);
    expect(result.adjustmentFactors.length).toBeGreaterThan(0);
    expect(result.explanation).toContain('market adjustment factor');
  });
});