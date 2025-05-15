/**
 * API Client with standardized error handling
 */

// Standard API error structure
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: string;
  
  constructor(
    message: string, 
    status: number, 
    code?: string, 
    details?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiRequestOptions extends RequestInit {
  timeout?: number;
}

interface ApiClientOptions {
  baseUrl?: string;
  defaultHeaders?: HeadersInit;
  defaultTimeout?: number;
}

/**
 * Handle API response and parse accordingly
 */
const handleResponse = async (response: Response): Promise<any> => {
  // Get content type to determine how to parse
  const contentType = response.headers.get('content-type');
  
  // Parse response data based on content type
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType && contentType.includes('text/')) {
    data = await response.text();
  } else {
    // For binary data or other formats, return the response directly
    return response;
  }
  
  // Check if this is an error response
  if (!response.ok) {
    // Extract error details from response if available
    const errorMessage = 
      data?.error?.message || 
      data?.message || 
      data?.error || 
      `API Error: ${response.statusText || 'Unknown Error'}`;
    
    const errorCode = data?.error?.code || data?.code;
    const errorDetails = data?.error?.details || data?.details;
    
    throw new ApiError(
      errorMessage,
      response.status,
      errorCode,
      errorDetails
    );
  }
  
  return data;
};

/**
 * Create a request with timeout
 */
const createRequestWithTimeout = (
  url: string, 
  options: ApiRequestOptions = {},
  defaultTimeout = 30000
): Promise<Response> => {
  const { timeout = defaultTimeout, ...fetchOptions } = options;
  
  // Create an abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  })
    .then(response => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch(error => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError(
          'Request timed out',
          408,
          'REQUEST_TIMEOUT'
        );
      }
      throw error;
    });
};

/**
 * Create an API client with standard error handling and request formatting
 */
export const createApiClient = (options: ApiClientOptions = {}) => {
  const { 
    baseUrl = '', 
    defaultHeaders = {}, 
    defaultTimeout = 30000
  } = options;
  
  // Ensure content-type is set for all JSON requests
  const headers = {
    'Content-Type': 'application/json',
    ...defaultHeaders,
  };
  
  /**
   * Make a GET request
   */
  const get = async <T>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    const url = `${baseUrl}${endpoint}`;
    const response = await createRequestWithTimeout(
      url, 
      {
        method: 'GET',
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: 'same-origin',
        ...options,
      },
      defaultTimeout
    );
    
    return handleResponse(response);
  };
  
  /**
   * Make a POST request
   */
  const post = async <T>(
    endpoint: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    const url = `${baseUrl}${endpoint}`;
    const response = await createRequestWithTimeout(
      url, 
      {
        method: 'POST',
        headers: {
          ...headers,
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'same-origin',
        ...options,
      },
      defaultTimeout
    );
    
    return handleResponse(response);
  };
  
  /**
   * Make a PUT request
   */
  const put = async <T>(
    endpoint: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    const url = `${baseUrl}${endpoint}`;
    const response = await createRequestWithTimeout(
      url, 
      {
        method: 'PUT',
        headers: {
          ...headers,
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'same-origin',
        ...options,
      },
      defaultTimeout
    );
    
    return handleResponse(response);
  };
  
  /**
   * Make a PATCH request
   */
  const patch = async <T>(
    endpoint: string, 
    data?: any, 
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    const url = `${baseUrl}${endpoint}`;
    const response = await createRequestWithTimeout(
      url, 
      {
        method: 'PATCH',
        headers: {
          ...headers,
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'same-origin',
        ...options,
      },
      defaultTimeout
    );
    
    return handleResponse(response);
  };
  
  /**
   * Make a DELETE request
   */
  const remove = async <T>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    const url = `${baseUrl}${endpoint}`;
    const response = await createRequestWithTimeout(
      url, 
      {
        method: 'DELETE',
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: 'same-origin',
        ...options,
      },
      defaultTimeout
    );
    
    return handleResponse(response);
  };
  
  /**
   * Upload a file
   */
  const upload = async <T>(
    endpoint: string,
    formData: FormData,
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    const url = `${baseUrl}${endpoint}`;
    
    // For file uploads, don't set Content-Type as the browser will set it with boundary
    const { headers: customHeaders, ...restOptions } = options;
    
    const response = await createRequestWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          ...customHeaders,
        },
        body: formData,
        credentials: 'same-origin',
        ...restOptions,
      },
      defaultTimeout
    );
    
    return handleResponse(response);
  };
  
  return {
    get,
    post,
    put,
    patch,
    delete: remove,
    upload,
  };
};

// Create and export default API client for application use
export const api = createApiClient();

export default api;