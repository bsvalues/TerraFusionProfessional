/**
 * Utility functions for formatting various data types
 */

/**
 * Format a number as currency
 * 
 * @param value - The number to format as currency
 * @param decimals - Number of decimal places to show (default: 2)
 * @param currencySymbol - Currency symbol to use (default: $)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  decimals = 2,
  currencySymbol = '$'
): string {
  if (value === null || value === undefined) return 'N/A';
  
  return `${currencySymbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}

/**
 * Format a number as a percentage
 * 
 * @param value - The decimal value to format as percentage (e.g., 0.05 for 5%)
 * @param decimals - Number of decimal places to show (default: 1)
 * @returns Formatted percentage string with % symbol
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined) return 'N/A';
  
  const percentage = value * 100;
  const prefix = percentage > 0 ? '+' : '';
  
  return `${prefix}${percentage.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`;
}

/**
 * Format a date in a standard format
 * 
 * @param date - Date object or ISO string
 * @param format - Format to use (default: 'long')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: 'short' | 'long' = 'long'
): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US');
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a number with commas and optional decimals
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places to show (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined) return 'N/A';
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format a file size in bytes to a human-readable format
 * 
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted file size with appropriate unit
 */
export function formatFileSize(
  bytes: number | null | undefined,
  decimals = 2
): string {
  if (bytes === null || bytes === undefined) return 'N/A';
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Truncate a string if it exceeds a maximum length
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - String to append after truncation (default: '...')
 * @returns Truncated string if needed, otherwise original string
 */
export function truncateString(
  str: string | null | undefined,
  maxLength: number,
  suffix = '...'
): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return `${str.substring(0, maxLength)}${suffix}`;
}