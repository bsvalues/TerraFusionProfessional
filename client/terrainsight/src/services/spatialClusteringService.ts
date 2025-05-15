import { Property } from '../shared/schema';
import { kmeans } from 'ml-kmeans';
import { formatCurrency } from '../lib/utils';

export interface PropertyCluster {
  id: number;
  centroid: [number, number];
  properties: Property[];
  color: string;
  statistics: ClusterStatistics;
}

export interface ClusterStatistics {
  avgValue: number;
  medianValue: number;
  avgSquareFeet: number;
  avgYearBuilt: number;
  propertyCount: number;
  valueRange: [number, number];
  squareFeetRange: [number, number];
  yearBuiltRange: [number, number];
}

/**
 * Creates property clusters using k-means algorithm
 * @param properties Array of properties to cluster
 * @param numClusters Number of clusters to create
 * @returns Array of property clusters
 */
export function createPropertyClusters(
  properties: Property[],
  numClusters: number
): PropertyCluster[] {
  // If no properties or invalid cluster count, return empty array
  if (properties.length === 0 || numClusters <= 0) {
    return [];
  }
  
  // Filter properties with valid coordinates
  const validProperties = properties.filter(
    p => p.latitude !== undefined && p.longitude !== undefined
  );
  
  // If no valid properties, return empty array
  if (validProperties.length === 0) {
    return [];
  }
  
  // Adjust cluster count if needed
  const adjustedClusterCount = Math.min(numClusters, validProperties.length);
  
  // Prepare data for clustering
  const data = validProperties.map(p => [Number(p.latitude!), Number(p.longitude!)]);
  
  // Run k-means clustering
  const result = kmeans(data, adjustedClusterCount, {
    seed: 1,
    initialization: 'kmeans++',
    maxIterations: 100
  });
  
  // Generate colors for clusters
  const colors = generateClusterColors(adjustedClusterCount);
  
  // Create cluster objects
  const clusters: PropertyCluster[] = [];
  
  for (let i = 0; i < result.clusters.length; i++) {
    const clusterIndex = result.clusters[i];
    
    // Create cluster if it doesn't exist
    if (!clusters[clusterIndex]) {
      clusters[clusterIndex] = {
        id: clusterIndex,
        centroid: [result.centroids[clusterIndex][0], result.centroids[clusterIndex][1]],
        properties: [],
        color: colors[clusterIndex],
        statistics: {
          avgValue: 0,
          medianValue: 0,
          avgSquareFeet: 0,
          avgYearBuilt: 0,
          propertyCount: 0,
          valueRange: [0, 0],
          squareFeetRange: [0, 0],
          yearBuiltRange: [0, 0]
        }
      };
    }
    
    // Add property to cluster
    clusters[clusterIndex].properties.push(validProperties[i]);
  }
  
  // Calculate statistics for each cluster
  clusters.forEach(cluster => {
    cluster.statistics = calculateClusterStatistics(cluster);
  });
  
  return clusters;
}

/**
 * Calculates statistics for a property cluster
 * @param cluster The property cluster
 * @returns Statistics for the cluster
 */
export function calculateClusterStatistics(cluster: PropertyCluster): ClusterStatistics {
  const properties = cluster.properties;
  
  // Extract numeric values and filter out invalid values
  const values = properties
    .map(p => parseFloat(String(p.value || "0").replace(/[^0-9.]/g, "")))
    .filter(v => !isNaN(v) && v > 0);
  
  const squareFeet = properties
    .map(p => p.squareFeet || 0)
    .filter(v => v > 0);
  
  const yearBuilt = properties
    .map(p => p.yearBuilt || 0)
    .filter(v => v > 0);
  
  // Calculate average value
  const avgValue = values.length > 0
    ? values.reduce((sum, val) => sum + val, 0) / values.length
    : 0;
  
  // Calculate median value
  const sortedValues = [...values].sort((a, b) => a - b);
  const medianValue = sortedValues.length > 0
    ? sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)]
    : 0;
  
  // Calculate average square feet
  const avgSquareFeet = squareFeet.length > 0
    ? squareFeet.reduce((sum, val) => sum + val, 0) / squareFeet.length
    : 0;
  
  // Calculate average year built
  const avgYearBuilt = yearBuilt.length > 0
    ? yearBuilt.reduce((sum, val) => sum + val, 0) / yearBuilt.length
    : 0;
  
  // Calculate ranges
  const valueRange: [number, number] = values.length > 0
    ? [Math.min(...values), Math.max(...values)]
    : [0, 0];
  
  const squareFeetRange: [number, number] = squareFeet.length > 0
    ? [Math.min(...squareFeet), Math.max(...squareFeet)]
    : [0, 0];
  
  const yearBuiltRange: [number, number] = yearBuilt.length > 0
    ? [Math.min(...yearBuilt), Math.max(...yearBuilt)]
    : [0, 0];
  
  return {
    avgValue,
    medianValue,
    avgSquareFeet,
    avgYearBuilt,
    propertyCount: properties.length,
    valueRange,
    squareFeetRange,
    yearBuiltRange
  };
}

/**
 * Generates visually distinct colors for clusters
 * @param count Number of colors to generate
 * @returns Array of hex color codes
 */
export function generateClusterColors(count: number): string[] {
  const colors: string[] = [];
  
  // Predefined color palette for up to 10 clusters
  const palette = [
    '#3366CC', // Blue
    '#DC3912', // Red
    '#FF9900', // Orange
    '#109618', // Green
    '#990099', // Purple
    '#0099C6', // Teal
    '#DD4477', // Pink
    '#66AA00', // Lime
    '#B82E2E', // Dark Red
    '#316395'  // Dark Blue
  ];
  
  // Use predefined colors if count is within palette size
  if (count <= palette.length) {
    return palette.slice(0, count);
  }
  
  // Otherwise generate evenly distributed colors in HSL space
  for (let i = 0; i < count; i++) {
    const hue = Math.floor((i * 360) / count);
    const saturation = 75;
    const lightness = 50;
    
    // Convert HSL to hex
    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    colors.push(hexColor.toUpperCase());
  }
  
  return colors;
}

/**
 * Formats cluster statistics for display
 * @param stats Cluster statistics object
 * @returns Formatted statistics object with string values
 */
export function formatClusterStatistics(stats: ClusterStatistics): Record<string, string> {
  return {
    avgValue: formatCurrency(stats.avgValue),
    medianValue: formatCurrency(stats.medianValue),
    avgSquareFeet: Math.round(stats.avgSquareFeet).toLocaleString(),
    avgYearBuilt: Math.round(stats.avgYearBuilt).toString(),
    propertyCount: stats.propertyCount.toString(),
    valueRange: `${formatCurrency(stats.valueRange[0])} - ${formatCurrency(stats.valueRange[1])}`,
    squareFeetRange: `${Math.round(stats.squareFeetRange[0]).toLocaleString()} - ${Math.round(stats.squareFeetRange[1]).toLocaleString()}`,
    yearBuiltRange: `${Math.round(stats.yearBuiltRange[0])} - ${Math.round(stats.yearBuiltRange[1])}`
  };
}