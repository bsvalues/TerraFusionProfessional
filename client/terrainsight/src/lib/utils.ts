import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as a currency string
 * 
 * @param value The number to format
 * @param currency The currency code (default: 'USD')
 * @param notation Notation to use (default: 'standard')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'USD',
  notation: 'standard' | 'compact' = 'standard'
): string {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a number as a percentage
 * 
 * @param value The number to format as a percentage (0.1 = 10% or 10 = 10% depending on rawPercent)
 * @param decimalPlaces Number of decimal places to show (default: 1)
 * @param rawPercent Whether the value is a raw percentage (true) or decimal (false) (default: false)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number | null | undefined,
  decimalPlaces: number = 1,
  rawPercent: boolean = false
): string {
  if (value === null || value === undefined) return '';
  
  // If value is provided as a raw percentage (e.g., 10 for 10%),
  // convert it to decimal for the formatter (e.g., 0.1)
  const normalizedValue = rawPercent ? value / 100 : value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(normalizedValue);
}

/**
 * Format a number as a percentage (alias of formatPercent)
 * @param value The number to format as a percentage (0.1 = 10%)
 * @param decimalPlaces Number of decimal places to show (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | null | undefined,
  decimalPlaces: number = 1
): string {
  return formatPercent(value, decimalPlaces);
}

/**
 * Format a number with commas and decimal places
 * @param value The number to format
 * @param decimalPlaces Number of decimal places to include (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | null | undefined,
  decimalPlaces: number = 0
): string {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
}

/**
 * Parse a string to a numeric value
 * @param value The string value to parse
 * @param defaultValue Value to return if parsing fails (default: 0)
 * @returns Parsed number or default value
 */
export function parseNumericValue(
  value: string | number | null | undefined,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined) return defaultValue;
  
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, commas, and other non-numeric characters except decimal point
  const cleanValue = value.toString().replace(/[^0-9.-]/g, '');
  
  // Convert to number
  const numValue = parseFloat(cleanValue);
  
  // Return default value if NaN
  return isNaN(numValue) ? defaultValue : numValue;
}

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param formatStr The date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  formatStr: string = 'MMM d, yyyy'
): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Calculate the haversine distance between two points on the Earth's surface
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in miles
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Convert latitude and longitude from degrees to radians
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Radius of the Earth in miles
  const R = 3958.8;
  
  // Calculate the distance
  return R * c;
}