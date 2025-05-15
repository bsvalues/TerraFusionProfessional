/**
 * Utility functions for implementing retry logic with exponential backoff
 */

/**
 * Configuration options for the retry mechanism
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  
  /** Initial delay in milliseconds before the first retry */
  initialDelayMs: number;
  
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  
  /** Factor by which the delay increases after each retry (exponential backoff) */
  backoffFactor: number;
  
  /** Optional array of status codes that should trigger a retry */
  retryStatusCodes?: number[];
  
  /** Optional function to determine if an error should be retried */
  shouldRetry?: (error: any) => boolean;
}

/**
 * Default retry options with reasonable values
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000,    // 30 seconds
  backoffFactor: 2,     // Double the delay each time
  retryStatusCodes: [429, 500, 502, 503, 504] // Common retry status codes
};

/**
 * Executes an async function with retry capability using exponential backoff
 * 
 * @param asyncFn The asynchronous function to execute with retry logic
 * @param options Options for configuring the retry behavior
 * @returns The result of the async function if successful
 * @throws The last error encountered if all retries fail
 */
export async function withRetry<T>(
  asyncFn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  // Merge provided options with defaults
  const retryOptions: RetryOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options
  };
  
  let lastError: any;
  let delay = retryOptions.initialDelayMs;
  
  // Try the initial request, then retry up to maxRetries times
  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      // Attempt to execute the function
      return await asyncFn();
    } catch (error: any) {
      lastError = error;
      
      // Check if we've exhausted all retry attempts
      if (attempt >= retryOptions.maxRetries) {
        console.error(`All retry attempts failed. Last error:`, error);
        throw error;
      }
      
      // Determine if this error should trigger a retry
      const shouldRetryError = shouldRetryBasedOnError(error, retryOptions);
      
      if (!shouldRetryError) {
        console.log(`Error not eligible for retry:`, error);
        throw error;
      }
      
      // Calculate delay for next retry with exponential backoff
      console.log(`Retry attempt ${attempt + 1}/${retryOptions.maxRetries} after ${delay}ms delay`);
      
      // Wait for the calculated delay
      await sleep(delay);
      
      // Apply exponential backoff for next iteration
      delay = Math.min(delay * retryOptions.backoffFactor, retryOptions.maxDelayMs);
    }
  }
  
  // This should never be reached due to the throw in the loop,
  // but TypeScript requires a return statement
  throw lastError;
}

/**
 * Utility function to pause execution for a specified duration
 * 
 * @param ms Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determines if an error should trigger a retry based on options
 * 
 * @param error The error to evaluate
 * @param options Retry options with criteria
 * @returns True if the error should be retried
 */
function shouldRetryBasedOnError(error: any, options: RetryOptions): boolean {
  // If a custom shouldRetry function is provided, use that
  if (options.shouldRetry) {
    return options.shouldRetry(error);
  }
  
  // Check if the error has an HTTP status code that matches our retry codes
  if (options.retryStatusCodes && error.status) {
    return options.retryStatusCodes.includes(error.status);
  }
  
  // Special handling for OpenAI API errors
  if (error.error && error.error.type === 'insufficient_quota') {
    return true;
  }
  
  // By default, don't retry
  return false;
}

/**
 * Options specifically tailored for OpenAI API calls
 */
export const OPENAI_RETRY_OPTIONS: RetryOptions = {
  ...DEFAULT_RETRY_OPTIONS,
  // Function to determine if an OpenAI error should be retried
  shouldRetry: (error: any) => {
    // Rate limit or quota errors should be retried
    if (error.status === 429 || (error.error && error.error.type === 'insufficient_quota')) {
      return true;
    }
    
    // Temporary server errors should be retried
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    // Don't retry client errors (except 429)
    return false;
  }
};