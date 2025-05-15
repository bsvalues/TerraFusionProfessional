/**
 * Service for handling neighborhood demographic data and overlays
 */

export interface DemographicData {
  id: string;
  name: string;
  totalPopulation: number;
  medianIncome: number;
  medianHomeValue: number;
  percentOwnerOccupied: number;
  percentRenterOccupied: number;
  medianAge: number;
  percentBachelor: number;
  unemploymentRate: number;
  povertyRate: number;
  crimeIndex: number;
  schoolRating: number;
  boundaries: GeoJSON.Polygon;
}

export interface DemographicOverlayOptions {
  metric: string;
  opacity: number;
  colorScheme: string;
}

// Mock neighborhood demographic data
const neighborhoodDemographicData: DemographicData[] = [
  {
    id: "richland-south",
    name: "South Richland",
    totalPopulation: 12450,
    medianIncome: 98500,
    medianHomeValue: 425000,
    percentOwnerOccupied: 78.5,
    percentRenterOccupied: 21.5,
    medianAge: 42.3,
    percentBachelor: 45.8,
    unemploymentRate: 2.7,
    povertyRate: 5.2,
    crimeIndex: 14.2,
    schoolRating: 8.5,
    boundaries: {
      type: "Polygon",
      coordinates: [[
        [-119.3, 46.25],
        [-119.25, 46.25],
        [-119.25, 46.3],
        [-119.3, 46.3],
        [-119.3, 46.25]
      ]]
    }
  },
  {
    id: "kennewick-southridge",
    name: "Southridge",
    totalPopulation: 8750,
    medianIncome: 86200,
    medianHomeValue: 378000,
    percentOwnerOccupied: 72.1,
    percentRenterOccupied: 27.9,
    medianAge: 38.7,
    percentBachelor: 38.2,
    unemploymentRate: 3.2,
    povertyRate: 7.5,
    crimeIndex: 18.6,
    schoolRating: 7.8,
    boundaries: {
      type: "Polygon", 
      coordinates: [[
        [-119.17, 46.18],
        [-119.12, 46.18],
        [-119.12, 46.22],
        [-119.17, 46.22],
        [-119.17, 46.18]
      ]]
    }
  },
  {
    id: "pasco-west",
    name: "West Pasco",
    totalPopulation: 14250,
    medianIncome: 72500,
    medianHomeValue: 298000,
    percentOwnerOccupied: 68.4,
    percentRenterOccupied: 31.6,
    medianAge: 34.2,
    percentBachelor: 32.5,
    unemploymentRate: 4.8,
    povertyRate: 11.2,
    crimeIndex: 22.7,
    schoolRating: 6.5,
    boundaries: {
      type: "Polygon",
      coordinates: [[
        [-119.15, 46.22],
        [-119.08, 46.22],
        [-119.08, 46.28],
        [-119.15, 46.28],
        [-119.15, 46.22]
      ]]
    }
  },
  {
    id: "richland-horn-rapids",
    name: "Horn Rapids",
    totalPopulation: 5250,
    medianIncome: 112000,
    medianHomeValue: 485000,
    percentOwnerOccupied: 84.2,
    percentRenterOccupied: 15.8,
    medianAge: 45.1,
    percentBachelor: 52.3,
    unemploymentRate: 2.2,
    povertyRate: 3.8,
    crimeIndex: 12.5,
    schoolRating: 9.2,
    boundaries: {
      type: "Polygon",
      coordinates: [[
        [-119.32, 46.35],
        [-119.25, 46.35],
        [-119.25, 46.4],
        [-119.32, 46.4],
        [-119.32, 46.35]
      ]]
    }
  },
  {
    id: "prosser-wine-country",
    name: "Wine Country",
    totalPopulation: 3850,
    medianIncome: 75600,
    medianHomeValue: 325000,
    percentOwnerOccupied: 73.8,
    percentRenterOccupied: 26.2,
    medianAge: 41.7,
    percentBachelor: 35.4,
    unemploymentRate: 3.8,
    povertyRate: 8.5,
    crimeIndex: 16.8,
    schoolRating: 7.2,
    boundaries: {
      type: "Polygon",
      coordinates: [[
        [-119.78, 46.21],
        [-119.72, 46.21],
        [-119.72, 46.25],
        [-119.78, 46.25],
        [-119.78, 46.21]
      ]]
    }
  }
];

/**
 * Available demographic metrics for visualization
 */
export const demographicMetrics = [
  { id: "medianIncome", label: "Median Income", format: "currency" },
  { id: "medianHomeValue", label: "Median Home Value", format: "currency" },
  { id: "percentOwnerOccupied", label: "Owner Occupied (%)", format: "percent" },
  { id: "percentRenterOccupied", label: "Renter Occupied (%)", format: "percent" },
  { id: "medianAge", label: "Median Age", format: "number" },
  { id: "percentBachelor", label: "Bachelor's Degree+ (%)", format: "percent" },
  { id: "unemploymentRate", label: "Unemployment Rate", format: "percent" },
  { id: "povertyRate", label: "Poverty Rate", format: "percent" },
  { id: "crimeIndex", label: "Crime Index", format: "number" },
  { id: "schoolRating", label: "School Rating (1-10)", format: "number" }
];

/**
 * Available color schemes for the demographic overlays
 */
export const colorSchemes = [
  { id: "blues", label: "Blues" },
  { id: "reds", label: "Reds" },
  { id: "greens", label: "Greens" },
  { id: "purples", label: "Purples" },
  { id: "oranges", label: "Oranges" },
  { id: "spectral", label: "Spectral" },
  { id: "viridis", label: "Viridis" }
];

/**
 * Generate color for a value based on its range and selected color scheme
 * @param value Current value
 * @param min Minimum value in range
 * @param max Maximum value in range
 * @param colorScheme Color scheme to use
 * @returns Hex color code
 */
export function generateColor(value: number, min: number, max: number, colorScheme: string): string {
  // Normalize the value between 0 and 1
  const normalizedValue = (value - min) / (max - min);
  
  // Define color stops for each color scheme
  const colorStops: Record<string, string[]> = {
    blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
    oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
    spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
    viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825']
  };
  
  // Get the color stops for the selected scheme
  const stops = colorStops[colorScheme] || colorStops.blues;
  
  // Calculate the index in the color stops array
  const index = Math.min(Math.floor(normalizedValue * stops.length), stops.length - 1);
  
  return stops[index];
}

/**
 * Get all available demographic data
 * @returns Array of demographic data for all neighborhoods
 */
export function getDemographicData(): DemographicData[] {
  return neighborhoodDemographicData;
}

/**
 * Get demographic data for a specific neighborhood
 * @param neighborhoodId ID of the neighborhood
 * @returns Demographic data for the specified neighborhood or undefined if not found
 */
export function getNeighborhoodDemographics(neighborhoodId: string): DemographicData | undefined {
  return neighborhoodDemographicData.find(n => n.id === neighborhoodId);
}

/**
 * Get GeoJSON feature collection for all neighborhoods with a specified metric
 * @param metricId ID of the metric to visualize
 * @param colorScheme Color scheme to use
 * @returns GeoJSON feature collection with styled properties
 */
export function getDemographicGeoJSON(metricId: string, colorScheme: string = 'blues'): GeoJSON.FeatureCollection {
  // Extract all values for the selected metric to determine the range
  const allValues = neighborhoodDemographicData.map(n => 
    n[metricId as keyof DemographicData] as number
  );
  
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  // Create GeoJSON features for each neighborhood
  const features: GeoJSON.Feature[] = neighborhoodDemographicData.map(neighborhood => {
    const value = neighborhood[metricId as keyof DemographicData] as number;
    const color = generateColor(value, minValue, maxValue, colorScheme);
    
    return {
      type: 'Feature',
      geometry: neighborhood.boundaries,
      properties: {
        id: neighborhood.id,
        name: neighborhood.name,
        value,
        color,
        metric: metricId
      }
    };
  });
  
  return {
    type: 'FeatureCollection',
    features
  };
}