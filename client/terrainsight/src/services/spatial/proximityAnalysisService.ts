import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

/**
 * Point of Interest (POI) types
 */
export enum POIType {
  Park = 'park',
  School = 'school',
  Hospital = 'hospital',
  ShoppingCenter = 'shopping_center',
  PublicTransit = 'public_transit',
  Highway = 'highway',
  Restaurant = 'restaurant',
  Entertainment = 'entertainment',
  Church = 'church',
  Library = 'library'
}

/**
 * Represents a Point of Interest
 */
export interface POI {
  id: string;
  name: string;
  type: POIType;
  coordinates: [number, number]; // [latitude, longitude]
  distance?: number; // meters, calculated at runtime
  attributes?: Record<string, any>;
}

/**
 * Model defining how a POI type influences property values
 */
export interface POIInfluenceModel {
  poiType: POIType;
  maxDistance: number; // meters
  maxImpact: number; // percentage (can be negative for negative impacts)
  decayFunction: 'linear' | 'exponential' | 'logarithmic';
  decayRate: number;
}

/**
 * Represents the impact of POIs on a property's value
 */
export interface PropertyValueImpact {
  property: Property;
  totalImpactPercentage: number;
  totalImpactValue: number;
  impactBreakdown: Array<{
    poiType: POIType;
    poiName: string;
    distance: number;
    impactPercentage: number;
    impactValue: number;
  }>;
}

/**
 * Calculate the distance between two geographical coordinates in meters
 * Uses the Haversine formula for accurate Earth-surface distances
 */
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  // Ensure coordinates are in the same order (latitude, longitude)
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  
  // If coordinates are identical, return 0
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }
  
  // Earth's radius in meters
  const R = 6371000;
  
  // Convert to radians
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  
  // Haversine formula
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in meters
  const distance = R * c;
  
  return distance;
}

/**
 * Find POIs within a specified radius of a property
 */
export function findNearbyPOIs(
  property: Property,
  allPOIs: POI[],
  radius: number
): (POI & { distance: number })[] {
  // Check if property has coordinates
  if (!property.coordinates || !Array.isArray(property.coordinates) || property.coordinates.length !== 2) {
    return [];
  }
  
  // Calculate distance from property to each POI
  const poiWithDistances = allPOIs.map(poi => {
    if (!poi.coordinates || !Array.isArray(poi.coordinates) || poi.coordinates.length !== 2) {
      return { ...poi, distance: Infinity };
    }
    
    const distance = calculateDistance(property.coordinates!, poi.coordinates);
    return { ...poi, distance };
  });
  
  // Filter by radius and sort by distance
  return poiWithDistances
    .filter(poi => poi.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Calculate the influence of a POI on property value based on distance and influence model
 */
export function calculatePOIInfluence(
  poi: POI & { distance: number },
  model: POIInfluenceModel
): number {
  // If distance exceeds max influence distance, no impact
  if (poi.distance > model.maxDistance) {
    return 0;
  }
  
  // If distance is 0, maximum impact
  if (poi.distance === 0) {
    return model.maxImpact;
  }
  
  // Calculate normalized distance (0-1 range)
  const normalizedDistance = poi.distance / model.maxDistance;
  
  // Apply the appropriate decay function
  let influenceFactor: number;
  
  switch (model.decayFunction) {
    case 'linear':
      // Linear decay: influence = maxImpact * (1 - distance/maxDistance)
      influenceFactor = 1 - normalizedDistance;
      break;
      
    case 'exponential':
      // Exponential decay: influence = maxImpact * Math.exp(-decayRate * distance/maxDistance)
      influenceFactor = Math.exp(-model.decayRate * normalizedDistance);
      break;
      
    case 'logarithmic':
      // Logarithmic decay: influence = maxImpact * (1 - Math.log(1 + distance/maxDistance * decayRate))
      influenceFactor = Math.max(0, 1 - Math.log(1 + normalizedDistance * model.decayRate));
      break;
      
    default:
      influenceFactor = 1 - normalizedDistance; // Default to linear
  }
  
  // Apply influence factor to max impact
  return model.maxImpact * influenceFactor;
}

/**
 * Calculate the aggregate influence of multiple POIs on a property's value
 */
export function calculateAggregateInfluence(
  property: Property,
  nearbyPOIs: (POI & { distance: number })[],
  influenceModels: Record<POIType, POIInfluenceModel>
): PropertyValueImpact {
  // If no POIs, return zero impact
  if (nearbyPOIs.length === 0) {
    return {
      property,
      totalImpactPercentage: 0,
      totalImpactValue: 0,
      impactBreakdown: []
    };
  }
  
  // Calculate individual POI impacts
  const impactBreakdown = nearbyPOIs.map(poi => {
    const model = influenceModels[poi.type];
    if (!model) return null; // Skip if no model exists for this POI type
    
    const impactPercentage = calculatePOIInfluence(poi, model);
    
    // Convert property value to number for calculations
    let propertyValue = 0;
    if (property.value) {
      // Handle string or number property value formats
      propertyValue = typeof property.value === 'string'
        ? parseFloat(property.value.replace(/[^0-9.-]+/g, ''))
        : property.value;
    }
    
    const impactValue = propertyValue * (impactPercentage / 100);
    
    return {
      poiType: poi.type,
      poiName: poi.name,
      distance: poi.distance,
      impactPercentage,
      impactValue
    };
  }).filter(impact => impact !== null) as Array<{
    poiType: POIType;
    poiName: string;
    distance: number;
    impactPercentage: number;
    impactValue: number;
  }>;
  
  // Calculate total impact
  const totalImpactPercentage = impactBreakdown.reduce(
    (sum, impact) => sum + impact.impactPercentage, 
    0
  );
  
  const totalImpactValue = impactBreakdown.reduce(
    (sum, impact) => sum + impact.impactValue, 
    0
  );
  
  return {
    property,
    totalImpactPercentage,
    totalImpactValue,
    impactBreakdown
  };
}

/**
 * Sample POI data for development and testing
 */
const samplePOIs: POI[] = [
  {
    id: "p1",
    name: "Central Park",
    type: POIType.Park,
    coordinates: [47.6082, -122.3347],
    attributes: {
      size: "Large",
      amenities: ["Playground", "Walking Trails"]
    }
  },
  {
    id: "p2",
    name: "Washington Elementary",
    type: POIType.School,
    coordinates: [47.6042, -122.3301],
    attributes: {
      type: "Public",
      grades: "K-5",
      rating: 8.5
    }
  },
  {
    id: "p3",
    name: "Metro Station",
    type: POIType.PublicTransit,
    coordinates: [47.6082, -122.3301],
    attributes: {
      type: "Subway",
      lines: ["Red", "Blue"]
    }
  },
  {
    id: "p4",
    name: "Westlake Shopping Center",
    type: POIType.ShoppingCenter,
    coordinates: [47.6162, -122.3421],
    attributes: {
      size: "Large",
      stores: 120
    }
  },
  {
    id: "p5",
    name: "Community Hospital",
    type: POIType.Hospital,
    coordinates: [47.6120, -122.3280],
    attributes: {
      beds: 250,
      emergency: true
    }
  },
  {
    id: "p6",
    name: "I-5 Highway",
    type: POIType.Highway,
    coordinates: [47.6040, -122.3280],
    attributes: {
      lanes: 6,
      trafficVolume: "High"
    }
  },
  {
    id: "p7",
    name: "Downtown Library",
    type: POIType.Library,
    coordinates: [47.6070, -122.3380],
    attributes: {
      size: "Medium",
      collection: "Large"
    }
  },
  {
    id: "p8",
    name: "First Community Church",
    type: POIType.Church,
    coordinates: [47.6030, -122.3350],
    attributes: {
      denomination: "Non-denominational",
      size: "Medium"
    }
  },
  {
    id: "p9",
    name: "Bella Italiana Restaurant",
    type: POIType.Restaurant,
    coordinates: [47.6050, -122.3370],
    attributes: {
      cuisine: "Italian",
      priceRange: "$$"
    }
  },
  {
    id: "p10",
    name: "Cinema Complex",
    type: POIType.Entertainment,
    coordinates: [47.6090, -122.3420],
    attributes: {
      screens: 8,
      capacity: 1200
    }
  }
];

/**
 * Default influence models for different POI types
 */
const defaultInfluenceModels: Record<POIType, POIInfluenceModel> = {
  [POIType.Park]: {
    poiType: POIType.Park,
    maxDistance: 1000, // 1km
    maxImpact: 5, // 5% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.School]: {
    poiType: POIType.School,
    maxDistance: 1500, // 1.5km
    maxImpact: 7, // 7% positive impact
    decayFunction: 'exponential',
    decayRate: 1.5
  },
  [POIType.PublicTransit]: {
    poiType: POIType.PublicTransit,
    maxDistance: 800, // 800m
    maxImpact: 6, // 6% positive impact
    decayFunction: 'logarithmic',
    decayRate: 1.2
  },
  [POIType.ShoppingCenter]: {
    poiType: POIType.ShoppingCenter,
    maxDistance: 2000, // 2km
    maxImpact: 4, // 4% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Hospital]: {
    poiType: POIType.Hospital,
    maxDistance: 1800, // 1.8km
    maxImpact: 3, // 3% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Highway]: {
    poiType: POIType.Highway,
    maxDistance: 1000, // 1km
    maxImpact: -4, // 4% negative impact
    decayFunction: 'exponential',
    decayRate: 2
  },
  [POIType.Restaurant]: {
    poiType: POIType.Restaurant,
    maxDistance: 500, // 500m
    maxImpact: 2, // 2% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Entertainment]: {
    poiType: POIType.Entertainment,
    maxDistance: 1200, // 1.2km
    maxImpact: 3, // 3% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Church]: {
    poiType: POIType.Church,
    maxDistance: 1000, // 1km
    maxImpact: 2, // 2% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Library]: {
    poiType: POIType.Library,
    maxDistance: 1200, // 1.2km
    maxImpact: 3, // 3% positive impact
    decayFunction: 'linear',
    decayRate: 1
  }
};

/**
 * Proximity analysis service for calculating how nearby POIs impact property values
 */
export const proximityAnalysisService = {
  /**
   * Get all POIs near a property within specified radius
   */
  findNearbyPOIs(
    property: Property,
    radius: number = 1000, // Default 1km
    poiTypes?: POIType[] // Optional filter by POI types
  ): (POI & { distance: number })[] {
    // In a real implementation, this would fetch from an API or database
    let filteredPOIs = samplePOIs;
    
    // Filter by POI types if specified
    if (poiTypes && poiTypes.length > 0) {
      filteredPOIs = samplePOIs.filter(poi => poiTypes.includes(poi.type));
    }
    
    return findNearbyPOIs(property, filteredPOIs, radius);
  },
  
  /**
   * Calculate how nearby POIs affect a property's value
   */
  calculatePropertyValueImpact(
    property: Property,
    poiTypes?: POIType[],
    radius: number = 1000, // Default 1km
    customInfluenceModels?: Record<POIType, POIInfluenceModel>
  ): PropertyValueImpact {
    // Find nearby POIs
    const nearbyPOIs = this.findNearbyPOIs(property, radius, poiTypes);
    
    // Use custom influence models if provided, otherwise use defaults
    const influenceModels = customInfluenceModels || defaultInfluenceModels;
    
    // Calculate aggregate influence
    return calculateAggregateInfluence(property, nearbyPOIs, influenceModels);
  },
  
  /**
   * Get available POI categories
   */
  getPOICategories(): POIType[] {
    return Object.values(POIType);
  },
  
  /**
   * Get default influence models for POI types
   */
  getDefaultInfluenceModels(): Record<POIType, POIInfluenceModel> {
    return { ...defaultInfluenceModels };
  },
  
  /**
   * Create a human-readable description of POI influence
   */
  formatInfluenceDescription(impact: PropertyValueImpact): string {
    if (impact.impactBreakdown.length === 0) {
      return "No points of interest found nearby that affect property value.";
    }
    
    const formattedTotal = formatCurrency(impact.totalImpactValue);
    const percentageDirection = impact.totalImpactPercentage >= 0 ? 'increase' : 'decrease';
    
    let description = `Nearby points of interest ${percentageDirection} property value by approximately ${Math.abs(impact.totalImpactPercentage).toFixed(1)}% (${formattedTotal}).`;
    
    // Add top influences
    const topInfluences = [...impact.impactBreakdown]
      .sort((a, b) => Math.abs(b.impactPercentage) - Math.abs(a.impactPercentage))
      .slice(0, 3);
    
    if (topInfluences.length > 0) {
      description += ' Major factors include:';
      
      topInfluences.forEach(influence => {
        const direction = influence.impactPercentage >= 0 ? 'increases' : 'decreases';
        const formattedInfluence = formatCurrency(Math.abs(influence.impactValue));
        
        description += `\n- ${influence.poiName} (${influence.distance.toFixed(0)}m) ${direction} value by ${Math.abs(influence.impactPercentage).toFixed(1)}% (${formattedInfluence})`;
      });
    }
    
    return description;
  }
};