/**
 * API service configuration and utilities
 */

interface ApiServiceConfig {
  baseUrl: string;
  useParentProxy: boolean;
  headers?: Record<string, string>;
}

let apiConfig: ApiServiceConfig = {
  baseUrl: '', // Relative URLs by default
  useParentProxy: false,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Configure the API service
 */
export function configureApiService(config: Partial<ApiServiceConfig>): void {
  apiConfig = {
    ...apiConfig,
    ...config,
  };
}

/**
 * Get the current API configuration
 */
export function getApiConfig(): ApiServiceConfig {
  return { ...apiConfig };
}

/**
 * Create the full URL for an API endpoint
 */
export function createApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http')) {
    // Absolute URL provided
    return endpoint;
  }
  
  const baseUrl = apiConfig.baseUrl || '';
  const urlPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If using parent proxy, format URL differently
  if (apiConfig.useParentProxy) {
    // The parent window expects a specific format
    return `/proxy${urlPath}`;
  }
  
  return `${baseUrl}${urlPath}`;
}

/**
 * Make an API request with the configured settings
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = createApiUrl(endpoint);
  
  const headers = {
    ...apiConfig.headers,
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // For non-JSON responses
    return await response.text() as unknown as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}