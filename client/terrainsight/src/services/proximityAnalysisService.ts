import { Property } from '@/shared/schema';
import { calculateDistance, Coordinate } from './spatialAnalysisService';

/**
 * Interface representing an amenity (point of interest)
 */
export interface Amenity {
  id: number | string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  description?: string;
}

/**
 * Options for generating isochrones (travel time/distance boundaries)
 */
export interface IsochroneOptions {
  latitude: number;
  longitude: number;
  travelTimes: number[]; // in minutes
  mode: 'walking' | 'driving' | 'cycling' | 'transit';
  resolution?: number; // number of points to generate for the polygon
}

/**
 * Interface representing an isochrone boundary
 */
export interface Isochrone {
  travelTime: number;
  mode: 'walking' | 'driving' | 'cycling' | 'transit';
  coordinates: Array<{ lat: number; lng: number }>;
}

/**
 * Impact of proximity to amenities by distance threshold
 */
export interface ProximityImpact {
  distanceThreshold: number; // km
  averageValue: number;
  propertyCount: number;
  valueImpact: number; // percentage impact on value
}

/**
 * Insight about proximity impact
 */
export interface ProximityInsight {
  description: string;
  impactValue: number;
  amenityType: string;
}

/**
 * Regression model for proximity impact
 */
export interface ProximityRegressionModel {
  r2: number; // R-squared value
  coefficients: {
    intercept: number;
    distance: number;
    [key: string]: number; // additional coefficients
  };
  variables?: string[];
  significance?: number;
  errorMargin?: number;
}

/**
 * Result of proximity impact analysis
 */
export interface ProximityAnalysisResult {
  amenityType: string;
  impactByDistance: ProximityImpact[];
  regressionModel?: ProximityRegressionModel;
  insights: ProximityInsight[];
  mostImpactfulAmenity: string;
  optimalDistance: number;
  excludedProperties: number;
}

/**
 * Calculate distance from a property to an amenity
 * @param property The property
 * @param amenity The amenity (point of interest)
 * @returns Distance in kilometers
 */
export function calculateDistanceToAmenity(
  property: Property,
  amenity: Amenity
): number {
  if (!property.latitude || !property.longitude) {
    throw new Error('Property does not have valid coordinates');
  }
  
  const propertyCoord: Coordinate = {
    latitude: property.latitude,
    longitude: property.longitude
  };
  
  const amenityCoord: Coordinate = {
    latitude: amenity.latitude,
    longitude: amenity.longitude
  };
  
  return calculateDistance(propertyCoord, amenityCoord);
}

/**
 * Generate isochrone boundaries (travel time/distance polygons)
 * @param options Options for generating isochrones
 * @returns Array of isochrone objects
 */
export function generateIsochrones(options: IsochroneOptions): Isochrone[] {
  const { latitude, longitude, travelTimes, mode, resolution = 32 } = options;
  
  // In a real implementation, this would call a routing/isochrone API
  // like Mapbox, Google Maps, or OpenRouteService
  
  // For this demo, we'll generate simplified circular isochrones
  // with some randomization to make them look more realistic
  
  const isochrones: Isochrone[] = [];
  
  // Approximate travel distances for different modes (km per minute)
  const speedFactors = {
    walking: 0.08, // ~5 km/h
    driving: 0.5,  // ~30 km/h in urban areas
    cycling: 0.25, // ~15 km/h
    transit: 0.4   // ~25 km/h including stops
  };
  
  // Generate isochrone for each travel time
  travelTimes.forEach(time => {
    // Calculate radius based on travel time and mode
    // This is a simplification; real isochrones would account for the road network
    const baseRadius = time * speedFactors[mode];
    
    // Generate points around the circle
    const points: Array<{ lat: number; lng: number }> = [];
    
    for (let i = 0; i < resolution; i++) {
      const angle = (i / resolution) * 2 * Math.PI;
      
      // Add some random variation to make it look more realistic
      const randomFactor = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
      const radius = baseRadius * randomFactor;
      
      // Convert polar to cartesian coordinates
      // Note: This is a simplification that doesn't account for Earth's curvature
      // For small distances it's a reasonable approximation
      const lat = latitude + (radius / 111) * Math.cos(angle);
      const lng = longitude + (radius / (111 * Math.cos(latitude * Math.PI / 180))) * Math.sin(angle);
      
      points.push({ lat, lng });
    }
    
    isochrones.push({
      travelTime: time,
      mode,
      coordinates: points
    });
  });
  
  return isochrones;
}

/**
 * Quantify the impact of proximity to amenities on property values
 * @param params Analysis parameters
 * @returns Analysis results
 */
export function quantifyProximityImpact(params: {
  amenityType: string;
  distanceThresholds: number[];
  properties: Property[];
  amenities: Amenity[];
}): ProximityAnalysisResult {
  const { amenityType, distanceThresholds, properties, amenities } = params;
  
  // Filter amenities by type if specified
  const relevantAmenities = amenityType === 'All' 
    ? amenities 
    : amenities.filter(a => a.type === amenityType);
  
  // Filter properties with valid coordinates and values
  const validProperties = properties.filter(
    p => p.latitude && p.longitude && p.value
  );
  
  // For each property, find the distance to the nearest relevant amenity
  const propertyDistances: Array<{
    property: Property;
    nearestAmenity: Amenity;
    distance: number;
    value: number;
  }> = [];
  
  validProperties.forEach(property => {
    if (!property.latitude || !property.longitude) return;
    
    let nearestAmenity: Amenity | null = null;
    let minDistance = Infinity;
    
    // Find the nearest amenity
    relevantAmenities.forEach(amenity => {
      try {
        const distance = calculateDistanceToAmenity(property, amenity);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestAmenity = amenity;
        }
      } catch (error) {
        // Skip properties with invalid coordinates
        console.error('Error calculating distance:', error);
      }
    });
    
    if (nearestAmenity && minDistance < Infinity) {
      propertyDistances.push({
        property,
        nearestAmenity,
        distance: minDistance,
        value: parseFloat(property.value?.toString().replace(/[^0-9.-]+/g, '') || '0')
      });
    }
  });
  
  // Calculate impact by distance threshold
  const impactByDistance: ProximityImpact[] = [];
  
  // Calculate overall average value for baseline comparison
  const allValues = propertyDistances.map(pd => pd.value);
  const overallAverage = allValues.length > 0
    ? allValues.reduce((sum, val) => sum + val, 0) / allValues.length
    : 0;
  
  // Calculate impact for each distance threshold
  distanceThresholds.sort((a, b) => a - b).forEach(threshold => {
    // Properties within this threshold
    const propertiesWithin = propertyDistances.filter(
      pd => pd.distance <= threshold
    );
    
    // Skip if no properties within this threshold
    if (propertiesWithin.length === 0) {
      impactByDistance.push({
        distanceThreshold: threshold,
        averageValue: 0,
        propertyCount: 0,
        valueImpact: 0
      });
      return;
    }
    
    // Calculate average value within threshold
    const valuesWithin = propertiesWithin.map(pd => pd.value);
    const averageValue = valuesWithin.reduce((sum, val) => sum + val, 0) / valuesWithin.length;
    
    // Calculate impact as percentage difference from overall average
    const valueImpact = overallAverage > 0
      ? (averageValue - overallAverage) / overallAverage
      : 0;
    
    impactByDistance.push({
      distanceThreshold: threshold,
      averageValue,
      propertyCount: propertiesWithin.length,
      valueImpact
    });
  });
  
  // Perform simple linear regression to model the relationship
  // between distance and property value
  const regressionData = propertyDistances.map(pd => ({
    x: pd.distance, // distance to nearest amenity
    y: pd.value     // property value
  }));
  
  const regressionModel = performLinearRegression(regressionData);
  
  // Generate insights
  const insights: ProximityInsight[] = [];
  
  // Add insight about the most significant threshold
  const mostSignificantImpact = [...impactByDistance]
    .sort((a, b) => Math.abs(b.valueImpact) - Math.abs(a.valueImpact))[0];
  
  if (mostSignificantImpact && mostSignificantImpact.valueImpact !== 0) {
    const impactDirection = mostSignificantImpact.valueImpact > 0 ? 'premium' : 'discount';
    const impactPercentage = Math.abs(mostSignificantImpact.valueImpact * 100).toFixed(0);
    
    insights.push({
      description: `Properties within ${mostSignificantImpact.distanceThreshold}km of ${amenityType === 'All' ? 'amenities' : amenityType} show a ${impactPercentage}% value ${impactDirection}`,
      impactValue: mostSignificantImpact.valueImpact,
      amenityType
    });
  }
  
  // Add insight about the regression model
  if (regressionModel && Math.abs(regressionModel.coefficients.distance) > 0) {
    const impactDirection = regressionModel.coefficients.distance < 0 ? 'decreases' : 'increases';
    
    insights.push({
      description: `Property value ${impactDirection} by approximately $${Math.abs(regressionModel.coefficients.distance).toFixed(0)} per kilometer from ${amenityType === 'All' ? 'amenities' : amenityType}`,
      impactValue: regressionModel.coefficients.distance,
      amenityType
    });
  }
  
  // Determine optimal distance
  let optimalDistance = 0;
  
  if (impactByDistance.length > 0) {
    // For positive impacts (amenities that increase value), closer is better
    // For negative impacts (amenities that decrease value), further is better
    if (impactByDistance[0].valueImpact > 0) {
      // Positive impact - find closest threshold with significant impact
      optimalDistance = impactByDistance[0].distanceThreshold;
    } else {
      // Negative impact - find threshold where negative impact diminishes
      for (let i = 1; i < impactByDistance.length; i++) {
        if (impactByDistance[i].valueImpact > impactByDistance[i-1].valueImpact) {
          optimalDistance = impactByDistance[i].distanceThreshold;
          break;
        }
      }
      
      // If no optimal found, use the furthest threshold
      if (optimalDistance === 0 && impactByDistance.length > 0) {
        optimalDistance = impactByDistance[impactByDistance.length - 1].distanceThreshold;
      }
    }
  }
  
  // Determine most impactful amenity type if analyzing all types
  let mostImpactfulAmenity = amenityType;
  
  if (amenityType === 'All' && relevantAmenities.length > 0) {
    // Group properties by nearest amenity type
    const impactByType = new Map<string, number>();
    
    propertyDistances.forEach(pd => {
      const type = pd.nearestAmenity.type;
      const impact = impactByType.get(type) || 0;
      
      // Closer properties have more impact - use inverse of distance
      impactByType.set(type, impact + (1 / (pd.distance + 0.1)));
    });
    
    // Find type with highest impact score
    let maxImpact = 0;
    impactByType.forEach((impact, type) => {
      if (impact > maxImpact) {
        maxImpact = impact;
        mostImpactfulAmenity = type;
      }
    });
    
    // Add insight about most impactful amenity type
    insights.push({
      description: `${mostImpactfulAmenity} has the strongest influence on property values among all amenity types`,
      impactValue: maxImpact,
      amenityType: mostImpactfulAmenity
    });
  }
  
  return {
    amenityType,
    impactByDistance,
    regressionModel,
    insights,
    mostImpactfulAmenity,
    optimalDistance,
    excludedProperties: properties.length - validProperties.length
  };
}

/**
 * Perform simple linear regression
 * @param data Array of {x, y} points
 * @returns Regression model with coefficients and R-squared
 */
function performLinearRegression(data: Array<{x: number, y: number}>): ProximityRegressionModel | undefined {
  if (data.length < 2) return undefined;
  
  // Calculate means
  let sumX = 0;
  let sumY = 0;
  
  data.forEach(point => {
    sumX += point.x;
    sumY += point.y;
  });
  
  const meanX = sumX / data.length;
  const meanY = sumY / data.length;
  
  // Calculate coefficients
  let numerator = 0;
  let denominator = 0;
  
  data.forEach(point => {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += (point.x - meanX) * (point.x - meanX);
  });
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;
  
  // Calculate R-squared
  let totalSS = 0;
  let residualSS = 0;
  
  data.forEach(point => {
    const predicted = intercept + slope * point.x;
    totalSS += Math.pow(point.y - meanY, 2);
    residualSS += Math.pow(point.y - predicted, 2);
  });
  
  const rSquared = totalSS !== 0 ? 1 - (residualSS / totalSS) : 0;
  
  return {
    r2: rSquared,
    coefficients: {
      intercept,
      distance: slope
    }
  };
}