import { Property } from '@/shared/schema';

/**
 * Interface representing a geographic coordinate
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Helper function to convert numeric strings to numbers when needed
function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
}

/**
 * Interface representing a cluster of properties
 */
export interface Cluster {
  id: number;
  propertyCount: number;
  properties?: number[]; // Property IDs
  centroid: Coordinate;
  averageValue: number;
  valueRange?: [number, number];
  dominantPropertyType?: string;
  dominantNeighborhood?: string;
  // Additional statistics
  minValue?: number;
  maxValue?: number;
  medianValue?: number;
  standardDeviation?: number;
}

/**
 * Options for spatial clustering
 */
export interface ClusteringOptions {
  numberOfClusters: number;
  attributes: string[];
  minClusterSize?: number;
  maxIterations?: number;
}

/**
 * Result of spatial clustering analysis
 */
export interface ClusteringResult {
  clusters: Cluster[];
  propertyClusterMap: Record<number, number>; // Map of propertyId -> clusterId
  metadata: {
    totalProperties: number;
    includedProperties: number;
    excludedProperties: number;
    iterations?: number;
    convergenceAchieved?: boolean;
  };
}

/**
 * Calculate the geographical distance between two coordinates using the Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coord1.latitude)) * Math.cos(toRad(coord2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Extract property value as a number
 */
function getPropertyValueAsNumber(property: Property): number {
  if (!property.value) return 0;
  
  // Handle string value (remove currency symbols, commas, etc.)
  if (typeof property.value === 'string') {
    return parseFloat(property.value.replace(/[^0-9.-]+/g, '')) || 0;
  }
  
  return toNumber(property.value);
}

/**
 * Get normalized value for a specific property attribute
 * @param property The property to extract value from
 * @param attribute The attribute name
 * @param min Minimum value in the dataset (for normalization)
 * @param max Maximum value in the dataset (for normalization)
 */
function getNormalizedAttributeValue(
  property: Property, 
  attribute: string, 
  min: number, 
  max: number
): number {
  if (attribute === 'location' && property.latitude && property.longitude) {
    // For location, we'll return a combined lat/lng value
    // This is just a placeholder - in real implementation we'd use proper 
    // geospatial distance measurements in the clustering algorithm
    return (toNumber(property.latitude) + toNumber(property.longitude)) / 2;
  }
  
  if (attribute === 'value') {
    const value = getPropertyValueAsNumber(property);
    // Normalize to 0-1 range
    return max > min ? (value - min) / (max - min) : 0;
  }
  
  if (attribute === 'squareFeet' && property.squareFeet) {
    const value = toNumber(property.squareFeet);
    return max > min ? (value - min) / (max - min) : 0;
  }
  
  if (attribute === 'yearBuilt' && property.yearBuilt) {
    const value = toNumber(property.yearBuilt);
    return max > min ? (value - min) / (max - min) : 0;
  }
  
  if (attribute === 'propertyType' && property.propertyType) {
    // For categorical values, we'd need a different approach
    // This is simplified for demonstration purposes
    const types = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];
    return types.indexOf(property.propertyType) / types.length;
  }
  
  return 0;
}

/**
 * Calculate attribute ranges for normalization
 * @param properties Array of properties
 * @param attributes Array of attribute names
 * @returns Record of attribute ranges
 */
function calculateAttributeRanges(
  properties: Property[], 
  attributes: string[]
): Record<string, { min: number, max: number }> {
  const ranges: Record<string, { min: number, max: number }> = {};
  
  attributes.forEach(attribute => {
    if (attribute === 'location') {
      // Skip location, handled separately
      return;
    }
    
    let min = Infinity;
    let max = -Infinity;
    
    properties.forEach(property => {
      let value: number | undefined;
      
      if (attribute === 'value') {
        value = getPropertyValueAsNumber(property);
      } else if (attribute === 'squareFeet') {
        value = toNumber(property.squareFeet);
      } else if (attribute === 'yearBuilt') {
        value = toNumber(property.yearBuilt);
      }
      
      if (value !== undefined) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });
    
    ranges[attribute] = { min, max };
  });
  
  return ranges;
}

/**
 * Perform K-means clustering on property data
 * @param properties Array of properties to cluster
 * @param options Clustering options
 * @returns Clustering result
 */
export function performSpatialClustering(
  properties: Property[],
  options: ClusteringOptions
): ClusteringResult {
  // Filter out properties without coordinates if location is an attribute
  const validProperties = options.attributes.includes('location')
    ? properties.filter(p => p.latitude !== undefined && p.longitude !== undefined)
    : properties;
  
  // Handle edge case: if validProperties is empty, return empty result
  if (validProperties.length === 0) {
    return {
      clusters: [],
      propertyClusterMap: {},
      metadata: {
        totalProperties: properties.length,
        includedProperties: 0,
        excludedProperties: properties.length
      }
    };
  }
  
  // Handle edge case: if number of clusters > number of properties, adjust
  const k = Math.min(options.numberOfClusters, validProperties.length);
  
  // Calculate attribute ranges for normalization
  const attributeRanges = calculateAttributeRanges(validProperties, options.attributes);
  
  // Initialize k random centroids from the properties
  const initialIndices = Array.from({ length: validProperties.length }, (_, i) => i);
  const centroidIndices: number[] = [];
  
  // Select k distinct random properties as initial centroids
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * initialIndices.length);
    centroidIndices.push(initialIndices[randomIndex]);
    initialIndices.splice(randomIndex, 1);
  }
  
  // Initialize centroids with attribute values
  const centroids: Array<Record<string, number>> = centroidIndices.map(index => {
    const property = validProperties[index];
    const centroid: Record<string, number> = {};
    
    options.attributes.forEach(attribute => {
      const range = attributeRanges[attribute];
      if (range) {
        centroid[attribute] = getNormalizedAttributeValue(property, attribute, range.min, range.max);
      }
      
      // Special handling for location
      if (attribute === 'location' && property.latitude && property.longitude) {
        centroid['latitude'] = toNumber(property.latitude);
        centroid['longitude'] = toNumber(property.longitude);
      }
    });
    
    return centroid;
  });
  
  // Initialize cluster assignments
  let clusterAssignments = new Array(validProperties.length).fill(-1);
  let iterations = 0;
  let changed = true;
  const maxIterations = options.maxIterations || 100;
  
  // Main K-means loop
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // Assign each property to nearest centroid
    validProperties.forEach((property, propertyIndex) => {
      let minDistance = Infinity;
      let nearestCentroidIndex = -1;
      
      centroids.forEach((centroid, centroidIndex) => {
        let distance = 0;
        
        // Calculate distance across all attributes
        options.attributes.forEach(attribute => {
          if (attribute === 'location') {
            // Special handling for location using Haversine distance
            if (property.latitude && property.longitude && 
                'latitude' in centroid && 'longitude' in centroid) {
              const coord1 = { 
                latitude: toNumber(property.latitude), 
                longitude: toNumber(property.longitude) 
              };
              const coord2 = { 
                latitude: centroid['latitude'], 
                longitude: centroid['longitude']
              };
              
              // Weight location more heavily than other attributes
              distance += calculateDistance(coord1, coord2) * 10;
            }
          } else {
            // For other attributes, use normalized Euclidean distance
            const range = attributeRanges[attribute];
            if (range) {
              const propertyValue = getNormalizedAttributeValue(
                property, attribute, range.min, range.max
              );
              const centroidValue = attribute in centroid ? centroid[attribute] : 0;
              
              distance += Math.pow(propertyValue - centroidValue, 2);
            }
          }
        });
        
        // Find the nearest centroid
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroidIndex = centroidIndex;
        }
      });
      
      // Update cluster assignment if changed
      if (clusterAssignments[propertyIndex] !== nearestCentroidIndex) {
        clusterAssignments[propertyIndex] = nearestCentroidIndex;
        changed = true;
      }
    });
    
    // Recalculate centroids based on new assignments
    const newCentroids: Array<Record<string, number>> = [];
    
    for (let i = 0; i < k; i++) {
      const clusterMembers = validProperties.filter((_, index) => 
        clusterAssignments[index] === i
      );
      
      // Skip empty clusters
      if (clusterMembers.length === 0) {
        newCentroids.push({...centroids[i]});
        continue;
      }
      
      const newCentroid: Record<string, number> = {};
      
      // For each attribute, calculate the average
      options.attributes.forEach(attribute => {
        if (attribute === 'location') {
          // For location, average the coordinates
          let sumLat = 0;
          let sumLng = 0;
          let count = 0;
          
          clusterMembers.forEach(property => {
            if (property.latitude && property.longitude) {
              sumLat += toNumber(property.latitude);
              sumLng += toNumber(property.longitude);
              count++;
            }
          });
          
          if (count > 0) {
            newCentroid['latitude'] = sumLat / count;
            newCentroid['longitude'] = sumLng / count;
          } else {
            // Fallback if no valid coordinates
            newCentroid['latitude'] = 'latitude' in centroids[i] ? centroids[i]['latitude'] : 0;
            newCentroid['longitude'] = 'longitude' in centroids[i] ? centroids[i]['longitude'] : 0;
          }
        } else {
          // For other attributes, calculate the average normalized value
          const range = attributeRanges[attribute];
          if (range) {
            let sum = 0;
            let count = 0;
            
            clusterMembers.forEach(property => {
              const value = getNormalizedAttributeValue(
                property, attribute, range.min, range.max
              );
              if (value !== undefined) {
                sum += value;
                count++;
              }
            });
            
            if (count > 0) {
              newCentroid[attribute] = sum / count;
            } else {
              newCentroid[attribute] = attribute in centroids[i] ? centroids[i][attribute] : 0;
            }
          }
        }
      });
      
      newCentroids.push(newCentroid);
    }
    
    // Update centroids
    centroids.splice(0, centroids.length, ...newCentroids);
  }
  
  // Prepare result object
  const clusterData: Cluster[] = [];
  const propertyClusterMap: Record<number, number> = {};
  
  // Calculate cluster statistics
  for (let i = 0; i < k; i++) {
    const clusterMembers = validProperties.filter((_, index) => 
      clusterAssignments[index] === i
    );
    
    // Skip empty clusters
    if (clusterMembers.length === 0) continue;
    
    // Calculate value statistics
    const values = clusterMembers.map(p => getPropertyValueAsNumber(p))
      .filter(v => !isNaN(v) && v > 0);
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = values.length > 0 ? sum / values.length : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    
    // Calculate dominant property type
    const typeCount: Record<string, number> = {};
    clusterMembers.forEach(p => {
      if (p.propertyType) {
        typeCount[p.propertyType] = (typeCount[p.propertyType] || 0) + 1;
      }
    });
    
    let dominantType = '';
    let maxTypeCount = 0;
    Object.entries(typeCount).forEach(([type, count]) => {
      if (count > maxTypeCount) {
        maxTypeCount = count;
        dominantType = type;
      }
    });
    
    // Calculate dominant neighborhood
    const neighborhoodCount: Record<string, number> = {};
    clusterMembers.forEach(p => {
      if (p.neighborhood) {
        neighborhoodCount[p.neighborhood] = (neighborhoodCount[p.neighborhood] || 0) + 1;
      }
    });
    
    let dominantNeighborhood = '';
    let maxNeighborhoodCount = 0;
    Object.entries(neighborhoodCount).forEach(([neighborhood, count]) => {
      if (count > maxNeighborhoodCount) {
        maxNeighborhoodCount = count;
        dominantNeighborhood = neighborhood;
      }
    });
    
    // Create cluster object
    const cluster: Cluster = {
      id: i + 1,
      propertyCount: clusterMembers.length,
      properties: clusterMembers.map(p => p.id as number),
      centroid: {
        latitude: 'latitude' in centroids[i] ? centroids[i]['latitude'] : 0,
        longitude: 'longitude' in centroids[i] ? centroids[i]['longitude'] : 0
      },
      averageValue: average,
      valueRange: [min, max],
      dominantPropertyType: dominantType,
      dominantNeighborhood: dominantNeighborhood,
      minValue: min,
      maxValue: max,
      // Additional calculations could go here (median, stddev, etc.)
    };
    
    clusterData.push(cluster);
    
    // Map properties to their clusters
    clusterMembers.forEach(p => {
      propertyClusterMap[p.id as number] = i + 1;
    });
  }
  
  return {
    clusters: clusterData,
    propertyClusterMap,
    metadata: {
      totalProperties: properties.length,
      includedProperties: validProperties.length,
      excludedProperties: properties.length - validProperties.length,
      iterations,
      convergenceAchieved: !changed
    }
  };
}

/**
 * Get optimal number of clusters using the Elbow Method
 * @param properties Properties to analyze
 * @param options Clustering options
 * @param maxClusters Maximum number of clusters to try
 * @returns Optimal number of clusters
 */
export function getOptimalClusterCount(
  properties: Property[],
  options: Omit<ClusteringOptions, 'numberOfClusters'>,
  maxClusters: number = 10
): number {
  const validProperties = properties.filter(
    p => p.latitude !== undefined && p.longitude !== undefined
  );
  
  // Handle edge cases
  if (validProperties.length <= 2) return 1;
  if (validProperties.length <= 4) return 2;
  
  // Calculate inertia (sum of squared distances) for different k values
  const inertiaValues: number[] = [];
  
  for (let k = 1; k <= Math.min(maxClusters, validProperties.length / 2); k++) {
    const result = performSpatialClustering(validProperties, {
      ...options,
      numberOfClusters: k
    });
    
    // Calculate total inertia
    let totalInertia = 0;
    
    result.clusters.forEach(cluster => {
      const clusterPropertyIds = cluster.properties || [];
      const clusterProperties = validProperties.filter(
        p => clusterPropertyIds.includes(p.id as number)
      );
      
      clusterProperties.forEach(property => {
        if (property.latitude && property.longitude) {
          const distance = calculateDistance(
            {
              latitude: toNumber(property.latitude),
              longitude: toNumber(property.longitude)
            },
            cluster.centroid
          );
          totalInertia += distance * distance;
        }
      });
    });
    
    inertiaValues.push(totalInertia);
  }
  
  // Find elbow point
  let maxCurvature = 0;
  let optimalK = 2; // Default
  
  for (let i = 1; i < inertiaValues.length - 1; i++) {
    const prevK = i;
    const currK = i + 1;
    const nextK = i + 2;
    
    const prevInertia = inertiaValues[i - 1];
    const currInertia = inertiaValues[i];
    const nextInertia = inertiaValues[i + 1];
    
    // Calculate approximate curvature
    const angle1 = Math.atan2(prevInertia - currInertia, prevK - currK);
    const angle2 = Math.atan2(currInertia - nextInertia, currK - nextK);
    const curvature = Math.abs(angle1 - angle2);
    
    if (curvature > maxCurvature) {
      maxCurvature = curvature;
      optimalK = currK;
    }
  }
  
  return optimalK;
}

/**
 * Generate a color for each cluster for visualization
 * @param numClusters Number of clusters
 * @returns Array of hex color codes
 */
export function generateClusterColors(numClusters: number): string[] {
  const colors: string[] = [];
  
  // Use a predefined set of colors for small number of clusters
  const presetColors = [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
    '#bcbd22', // olive
    '#17becf'  // teal
  ];
  
  if (numClusters <= presetColors.length) {
    return presetColors.slice(0, numClusters);
  }
  
  // Generate additional colors if needed
  for (let i = 0; i < numClusters; i++) {
    if (i < presetColors.length) {
      colors.push(presetColors[i]);
    } else {
      // Generate a color based on HSL to ensure good distribution
      const hue = (i * 137.5) % 360; // Golden angle approximation
      const saturation = 75;
      const lightness = 50;
      
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
  }
  
  return colors;
}

/**
 * Analyze spatial patterns in property values
 * @param properties Property array
 * @returns Spatial pattern analysis results
 */
export function analyzeSpatialPatterns(
  properties: Property[]
): {
  hotspots: Coordinate[];
  coldspots: Coordinate[];
  randomnessIndex: number;
  clusteringIndex: number;
} {
  // This is a simplified implementation of spatial pattern analysis
  // A real implementation would use methods like Moran's I, Getis-Ord Gi*, etc.
  
  // Filter properties with valid coordinates and values
  const validProperties = properties.filter(
    p => p.latitude && p.longitude && p.value
  );
  
  if (validProperties.length === 0) {
    return {
      hotspots: [],
      coldspots: [],
      randomnessIndex: 0,
      clusteringIndex: 0
    };
  }
  
  // Calculate the average value
  const values = validProperties.map(p => getPropertyValueAsNumber(p));
  const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Identify hotspots (high value concentrations) and coldspots (low value concentrations)
  const hotspots: Coordinate[] = [];
  const coldspots: Coordinate[] = [];
  
  // Very simplified approach - in reality would use proper spatial statistics
  validProperties.forEach(property => {
    if (!property.latitude || !property.longitude) return;
    
    // Find neighboring properties (within 1km radius)
    const neighbors = validProperties.filter(p => {
      if (p.id === property.id || !p.latitude || !p.longitude) return false;
      
      const distance = calculateDistance(
        { latitude: toNumber(property.latitude), longitude: toNumber(property.longitude) },
        { latitude: toNumber(p.latitude), longitude: toNumber(p.longitude) }
      );
      
      return distance < 1.0; // 1km radius
    });
    
    if (neighbors.length < 3) return; // Need enough neighbors for analysis
    
    // Calculate average value of neighbors
    const neighborValues = neighbors.map(p => getPropertyValueAsNumber(p));
    const neighborAverage = neighborValues.reduce((sum, val) => sum + val, 0) / neighbors.length;
    
    // Determine if this is a hotspot or coldspot
    const propertyValue = getPropertyValueAsNumber(property);
    
    if (propertyValue > averageValue * 1.25 && neighborAverage > averageValue * 1.15) {
      // High value property surrounded by high value properties = hotspot
      hotspots.push({
        latitude: toNumber(property.latitude),
        longitude: toNumber(property.longitude)
      });
    } else if (propertyValue < averageValue * 0.75 && neighborAverage < averageValue * 0.85) {
      // Low value property surrounded by low value properties = coldspot
      coldspots.push({
        latitude: toNumber(property.latitude),
        longitude: toNumber(property.longitude)
      });
    }
  });
  
  // Calculate simplified indices
  // In a real implementation, use established spatial statistics methods
  const clusteringIndex = (hotspots.length + coldspots.length) / validProperties.length;
  const randomnessIndex = 1 - clusteringIndex;
  
  return {
    hotspots,
    coldspots,
    randomnessIndex,
    clusteringIndex
  };
}