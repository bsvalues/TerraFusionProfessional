/**
 * Integration API
 * 
 * This module provides the interface for integrating the GeospatialAnalyzerBS
 * with parent systems. It handles communication, data synchronization,
 * and UI coordination with the parent application.
 */

import { AppModeConfig, setAppMode } from '../config/appMode';

// Define the shape of messages from the parent system
export interface ParentMessage {
  type: string;
  payload?: any;
}

// Event handlers for integration events
export interface IntegrationEventHandlers {
  onParentMessage: (message: ParentMessage) => void;
  onModuleReady: () => void;
  onModuleError: (error: Error) => void;
}

// Default event handlers that log to console
const defaultEventHandlers: IntegrationEventHandlers = {
  onParentMessage: (message) => {
    console.log('Message from parent:', message);
  },
  onModuleReady: () => {
    console.log('Module ready');
  },
  onModuleError: (error) => {
    console.error('Module error:', error);
  }
};

// Keep track of current event handlers
let eventHandlers: IntegrationEventHandlers = { ...defaultEventHandlers };

/**
 * Initialize integration with parent system
 * @param config Configuration for integrated mode
 * @param handlers Custom event handlers
 */
export function initIntegration(
  config: Partial<AppModeConfig> = {},
  handlers: Partial<IntegrationEventHandlers> = {}
): void {
  // Set application to integrated mode with the provided config
  setAppMode('integrated', config);
  
  // Update event handlers
  eventHandlers = {
    ...defaultEventHandlers,
    ...handlers
  };
  
  // Add event listener for messages from parent
  window.addEventListener('message', handleParentMessage);
  
  // Notify parent that the module is ready
  setTimeout(sendReadyToParent, 500);
}

/**
 * Handle messages from parent system
 */
function handleParentMessage(event: MessageEvent): void {
  // Ensure the message is for us and has the expected structure
  if (
    event.data &&
    typeof event.data === 'object' &&
    'type' in event.data
  ) {
    try {
      const message = event.data as ParentMessage;
      
      // Special case for configuration updates
      if (message.type === 'SET_CONFIG' && message.payload) {
        setAppMode('integrated', message.payload);
      }
      
      // Forward to event handler
      eventHandlers.onParentMessage(message);
    } catch (error) {
      console.error('Error handling parent message:', error);
      if (error instanceof Error) {
        eventHandlers.onModuleError(error);
      }
    }
  }
}

/**
 * Send a message to the parent system
 */
export function sendToParent(type: string, payload?: any): void {
  const parent = getParentWindow();
  if (parent) {
    parent.postMessage({ type, payload }, '*');
  }
}

/**
 * Notify parent that the module is ready
 */
function sendReadyToParent(): void {
  sendToParent('MODULE_READY');
  eventHandlers.onModuleReady();
}

/**
 * Get a reference to the parent window if in integrated mode
 */
export function getParentWindow(): Window | null {
  // If we're in an iframe, return the parent window
  if (window.parent !== window) {
    return window.parent;
  }
  
  // If we're in a popup, try to get the opener
  if (window.opener) {
    return window.opener;
  }
  
  // No parent found
  return null;
}

/**
 * Clean up integration (remove event listeners)
 */
export function cleanupIntegration(): void {
  window.removeEventListener('message', handleParentMessage);
}

/**
 * Expose the API for parent applications to use
 */
export function exposeIntegrationAPI(): void {
  // Define the shape of the global API
  interface Window {
    GeospatialAnalyzerBS: {
      setConfiguration: (config: Partial<AppModeConfig>) => void;
      navigate: (route: string) => void;
      getState: () => { config: AppModeConfig; currentRoute: string };
    };
  }
  
  // Attach the API to the window object
  (window as any).GeospatialAnalyzerBS = {
    // Update module configuration
    setConfiguration: (config: Partial<AppModeConfig>) => {
      setAppMode('integrated', config);
    },
    
    // Navigate to a route within the module
    navigate: (route: string) => {
      // Remove leading slash if present
      const normalizedRoute = route.startsWith('/') ? route.substring(1) : route;
      window.location.hash = normalizedRoute;
      
      // Notify parent of navigation
      sendToParent('NAVIGATION', { route: normalizedRoute });
    },
    
    // Get current module state
    getState: () => {
      return {
        config: setAppMode('integrated'),
        currentRoute: window.location.hash.substring(1) || '/'
      };
    }
  };
}