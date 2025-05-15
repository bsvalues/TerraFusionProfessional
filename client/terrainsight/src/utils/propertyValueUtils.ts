/**
 * Utilities for handling property value formatting and type conversion
 * These utilities ensure consistency in how property values are displayed and processed
 */

/**
 * Format a property value for display
 * Handles different value types consistently
 * 
 * @param value The property value (can be string, number, or undefined/null)
 * @param isCurrency Whether to format as currency
 * @param defaultValue Value to display if the input is undefined/null
 * @returns Formatted string value
 */
export function formatPropertyValue(
  value: string | number | null | undefined,
  isCurrency = false,
  defaultValue = 'N/A'
): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  // Convert to number if it's a string that looks like a number
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Check if conversion resulted in a valid number
  if (!isNaN(numValue)) {
    if (isCurrency) {
      return `$${numValue.toLocaleString()}`;
    }
    return numValue.toLocaleString();
  }

  // If it's a string that's not a number, just return it
  return typeof value === 'string' ? value : defaultValue;
}

/**
 * Parse a property value to a number if possible
 * 
 * @param value Property value (string or number)
 * @param defaultValue Default value if parsing fails
 * @returns Number value or default
 */
export function parsePropertyValue(
  value: string | number | null | undefined,
  defaultValue = 0
): number {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely access coordinates as a number tuple
 * 
 * @param coordinates Property coordinates in various possible formats
 * @param defaultCoords Default coordinates to use if input is invalid
 * @returns Coordinates as [number, number] tuple
 */
export function ensureCoordinates(
  coordinates: any,
  defaultCoords: [number, number] = [0, 0]
): [number, number] {
  // Handle undefined or null
  if (!coordinates) {
    return defaultCoords;
  }

  // Handle array-like objects
  if (Array.isArray(coordinates)) {
    // Ensure we have at least 2 entries and they're numbers
    if (coordinates.length >= 2) {
      const lat = parseFloat(coordinates[0]?.toString() || '0');
      const lng = parseFloat(coordinates[1]?.toString() || '0');
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    return defaultCoords;
  }

  // Handle object with lat/lng properties
  if (typeof coordinates === 'object') {
    const lat = parseFloat((coordinates as any).latitude?.toString() || '0');
    const lng = parseFloat((coordinates as any).longitude?.toString() || '0');
    
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  return defaultCoords;
}

/**
 * Calculate the percentage difference between two values
 * 
 * @param value1 First value
 * @param value2 Second value
 * @returns Percentage difference (positive if value1 > value2)
 */
export function calculatePercentageDifference(
  value1: string | number | null | undefined,
  value2: string | number | null | undefined
): number {
  const num1 = parsePropertyValue(value1);
  const num2 = parsePropertyValue(value2);
  
  if (num2 === 0) return 0; // Avoid division by zero
  
  return ((num1 - num2) / Math.abs(num2)) * 100;
}