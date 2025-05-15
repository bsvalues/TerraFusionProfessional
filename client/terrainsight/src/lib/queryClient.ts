import { QueryClient } from '@tanstack/react-query';
import { ApiError, api } from './api';
import { useNotifications } from '@/contexts/NotificationContext';

// Default stale time for queries (5 minutes)
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

// Configure defaultOptions for the QueryClient
const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: import.meta.env.PROD, // Only in production
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        
        // Retry once for other errors
        return failureCount < 1;
      },
    },
  },
};

// Create the QueryClient
export const queryClient = new QueryClient(queryClientConfig);

/**
 * Helper function to wrap API requests for mutations
 * This adds error handling and notifications
 */
export const apiRequest = async <T>({
  queryFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
}: {
  queryFn: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}): Promise<T> => {
  try {
    const result = await queryFn();
    
    // Call success handler if provided
    if (onSuccess) {
      onSuccess(result);
    }
    
    // Show success toast if message provided
    if (successMessage) {
      const { useNotifications } = require('@/contexts/NotificationContext');
      const { addNotification } = useNotifications();
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: successMessage,
        duration: 5000, // Auto-close after 5 seconds
      });
    }
    
    return result;
  } catch (error) {
    // Call error handler if provided
    if (onError && error instanceof Error) {
      onError(error);
    }
    
    // Show error notification
    const { useNotifications } = require('@/contexts/NotificationContext');
    const { addNotification } = useNotifications();
    
    const message = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    addNotification({
      type: 'error',
      title: 'Error',
      message: errorMessage || message,
      duration: 8000, // Keep error visible longer
    });
    
    // Re-throw the error for the caller to handle
    throw error;
  }
};

// Default fetch function to use with tanstack query
export const defaultQueryFn = async ({ queryKey }: { queryKey: string[] }): Promise<unknown> => {
  const [endpoint, ...params] = queryKey;
  
  // Add query params if provided
  const queryParams = params.length > 0 ? `?${new URLSearchParams(params as any)}` : '';
  
  return api.get(`${endpoint}${queryParams}`);
};

// Export the QueryClient for use in the application
export default queryClient;