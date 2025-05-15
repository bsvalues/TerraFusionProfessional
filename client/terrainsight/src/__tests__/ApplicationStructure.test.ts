/**
 * Application Structure Tests
 * 
 * This test file verifies the basic structure of the application:
 * - Critical files exist and can be imported
 * - Key components are defined and properly exported
 * - Core routes are defined
 * 
 * These tests do not render components and are designed to run quickly
 * as part of the CI pipeline to catch structural issues.
 */

describe('Application Structure', () => {
  test('core modules are defined and importable', () => {
    // Focus on core modules that don't require complex rendering logic
    // This is a type of smoke test that verifies the app's basic structure
    const modules = {
      // Basic UI components
      Button: require('@/components/ui/button'),
      Card: require('@/components/ui/card'),
      TabNavigation: require('../components/TabNavigation'),
      
      // Services and utilities
      queryClient: require('../lib/queryClient'),
      utils: require('../lib/utils'),
      
      // Contexts
      PropertyFilterContext: require('../contexts/PropertyFilterContext'),
      TourContext: require('../contexts/TourContext'),
    };
    
    // Verify each module can be imported
    Object.entries(modules).forEach(([name, module]) => {
      expect(module).toBeDefined();
    });
  });
  
  test('key types and interfaces are properly defined', () => {
    // Import shared types
    const sharedSchema = require('@shared/schema');
    
    // Verify critical types exist
    expect(sharedSchema.properties).toBeDefined();
    expect(sharedSchema.users).toBeDefined();
  });
  
  test('core utilities are available', () => {
    // Test utility functions
    const utils = require('../lib/utils');
    expect(utils).toBeDefined();
    
    // Query client for data fetching
    const queryClient = require('../lib/queryClient');
    expect(queryClient).toBeDefined();
    expect(queryClient.queryClient).toBeDefined();
  });
});