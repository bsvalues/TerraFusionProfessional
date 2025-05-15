import { Property } from '@shared/schema';
import { 
  generateValueForecast, 
  detectSeasonalPatterns,
  getForecastAccuracy,
  getNeighborhoodForecast,
  ForecastResult,
  SeasonalPattern
} from '../../services/timeseries/forecastService';

// Mock historical property data with value history
interface PropertyWithHistory extends Property {
  valueHistory: {
    [year: string]: string; // year -> value mapping
  };
}

const mockPropertiesWithHistory: PropertyWithHistory[] = [
  {
    id: 1,
    parcelId: "SAMPLE001",
    address: "123 Time Series St",
    propertyType: "Single Family",
    squareFeet: 2500,
    yearBuilt: 2000,
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 7500,
    value: "620000", // Current value (2023)
    neighborhood: "Downtown",
    latitude: 47.6062,
    longitude: -122.3321,
    valueHistory: {
      "2018": "480000",
      "2019": "510000",
      "2020": "525000",
      "2021": "560000",
      "2022": "590000",
      "2023": "620000"
    }
  },
  {
    id: 2,
    parcelId: "SAMPLE002",
    address: "456 Forecast Ave",
    propertyType: "Single Family",
    squareFeet: 1800,
    yearBuilt: 1995,
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 6000,
    value: "480000", // Current value (2023)
    neighborhood: "Downtown",
    latitude: 47.6082,
    longitude: -122.3351,
    valueHistory: {
      "2018": "370000",
      "2019": "390000",
      "2020": "410000",
      "2021": "435000",
      "2022": "455000",
      "2023": "480000"
    }
  },
  {
    id: 3,
    parcelId: "SAMPLE003",
    address: "789 Seasonal Rd",
    propertyType: "Condo",
    squareFeet: 1200,
    yearBuilt: 2010,
    bedrooms: 2,
    bathrooms: 2,
    lotSize: 0,
    value: "420000", // Current value (2023)
    neighborhood: "Uptown",
    latitude: 47.6152,
    longitude: -122.3251,
    valueHistory: {
      "2018": "320000",
      "2019": "345000",
      "2020": "350000",
      "2021": "375000",
      "2022": "395000",
      "2023": "420000"
    }
  },
  {
    id: 4,
    parcelId: "SAMPLE004",
    address: "101 Volatility Ln",
    propertyType: "Single Family",
    squareFeet: 3200,
    yearBuilt: 1960,
    bedrooms: 5,
    bathrooms: 3,
    lotSize: 12000,
    value: "820000", // Current value (2023)
    neighborhood: "Suburbs",
    latitude: 47.7062,
    longitude: -122.2321,
    valueHistory: {
      "2018": "650000",
      "2019": "690000",
      "2020": "670000", // Dip during recession
      "2021": "730000",
      "2022": "790000",
      "2023": "820000"
    }
  }
];

// Mock quarterly data to test seasonality
const quarterlyData = {
  propertyId: 5,
  values: [
    { quarter: "2021Q1", value: "510000" },
    { quarter: "2021Q2", value: "535000" },
    { quarter: "2021Q3", value: "545000" },
    { quarter: "2021Q4", value: "530000" },
    { quarter: "2022Q1", value: "540000" },
    { quarter: "2022Q2", value: "570000" },
    { quarter: "2022Q3", value: "580000" },
    { quarter: "2022Q4", value: "565000" },
    { quarter: "2023Q1", value: "575000" },
    { quarter: "2023Q2", value: "600000" },
    { quarter: "2023Q3", value: "615000" },
    { quarter: "2023Q4", value: "590000" }
  ]
};

describe('Time Series Forecasting', () => {
  test('should accurately predict known historical trends', () => {
    // Use backtesting - train on earlier data, predict known later data
    const property = mockPropertiesWithHistory[0];
    
    // Create training dataset excluding the last year
    const trainingHistory = { ...property.valueHistory };
    delete trainingHistory["2023"];
    
    const propertyForTraining = {
      ...property,
      value: trainingHistory["2022"],
      valueHistory: trainingHistory
    };
    
    // Generate forecast using data through 2022
    const forecast = generateValueForecast(propertyForTraining, 1); // Forecast 1 year ahead
    
    // Check the accuracy of the forecast vs actual 2023 value
    const actualValue2023 = parseFloat(property.valueHistory["2023"]);
    const forecastValue2023 = forecast.forecastedValues[0].value;
    
    // Calculate error percentage
    const errorPercentage = Math.abs((forecastValue2023 - actualValue2023) / actualValue2023) * 100;
    
    // Prediction should be within 10% of actual value
    expect(errorPercentage).toBeLessThan(10);
  });

  test('should produce wider confidence intervals for longer forecasts', () => {
    const property = mockPropertiesWithHistory[1];
    
    // Generate 1-year and 5-year forecasts
    const forecast1Year = generateValueForecast(property, 1);
    const forecast5Year = generateValueForecast(property, 5);
    
    // Get confidence intervals
    const interval1Year = [
      forecast1Year.forecastedValues[0].lowerBound,
      forecast1Year.forecastedValues[0].upperBound
    ];
    
    const interval5Year = [
      forecast5Year.forecastedValues[4].lowerBound,
      forecast5Year.forecastedValues[4].upperBound
    ];
    
    // Calculate interval widths
    const width1Year = interval1Year[1] - interval1Year[0];
    const width5Year = interval5Year[1] - interval5Year[0];
    
    // 5-year forecast should have wider confidence interval
    expect(width5Year).toBeGreaterThan(width1Year);
  });

  test('should detect seasonal patterns in historical data', () => {
    // Use quarterly data to detect seasonality
    const patterns = detectSeasonalPatterns(quarterlyData.values);
    
    // Should detect seasonality
    expect(patterns.hasSeasonal).toBe(true);
    
    // Q2 and Q3
    expect(patterns.peakQuarters).toContain("Q2");
    expect(patterns.peakQuarters).toContain("Q3");
    
    // Q4 and Q1
    expect(patterns.troughQuarters).toContain("Q4");
    expect(patterns.troughQuarters).toContain("Q1");
  });

  test('should adjust forecast based on market segment', () => {
    // Compare forecasts for different neighborhoods
    const downtownProperty = mockPropertiesWithHistory.find(p => p.neighborhood === "Downtown");
    const suburbsProperty = mockPropertiesWithHistory.find(p => p.neighborhood === "Suburbs");
    
    if (!downtownProperty || !suburbsProperty) {
      throw new Error("Test data missing properties from required neighborhoods");
    }
    
    // Generate forecasts
    const downtownForecast = generateValueForecast(downtownProperty, 3);
    const suburbsForecast = generateValueForecast(suburbsProperty, 3);
    
    // Get neighborhood-specific forecasts
    const downtownNeighborhoodForecast = getNeighborhoodForecast("Downtown", mockPropertiesWithHistory, 3);
    const suburbsNeighborhoodForecast = getNeighborhoodForecast("Suburbs", mockPropertiesWithHistory, 3);
    
    // Forecasts should be different
    const downtown3YearGrowth = (downtownForecast.forecastedValues[2].value / parseFloat(downtownProperty.value)) - 1;
    const suburbs3YearGrowth = (suburbsForecast.forecastedValues[2].value / parseFloat(suburbsProperty.value)) - 1;
    
    // Test that growth rates are not identical
    expect(downtown3YearGrowth).not.toBeCloseTo(suburbs3YearGrowth, 2);
    
    // Also test that neighborhood forecasts match their specific growth patterns
    expect(downtownNeighborhoodForecast.avgAnnualGrowthRate).toBeCloseTo(
      downtown3YearGrowth / 3, 
      2
    );
    
    expect(suburbsNeighborhoodForecast.avgAnnualGrowthRate).toBeCloseTo(
      suburbs3YearGrowth / 3, 
      2
    );
  });

  test('should calculate forecast accuracy metrics', () => {
    // Test the forecast accuracy calculation
    const property = mockPropertiesWithHistory[2];
    const forecastAccuracy = getForecastAccuracy(mockPropertiesWithHistory);
    
    // Should return MAPE (Mean Absolute Percentage Error)
    expect(forecastAccuracy).toHaveProperty('mape');
    expect(forecastAccuracy.mape).toBeGreaterThan(0);
    expect(forecastAccuracy.mape).toBeLessThan(15); // MAPE should be reasonable
    
    // Should return forecast reliability score
    expect(forecastAccuracy).toHaveProperty('reliabilityScore');
    expect(forecastAccuracy.reliabilityScore).toBeGreaterThan(0);
    expect(forecastAccuracy.reliabilityScore).toBeLessThanOrEqual(1);
  });
});