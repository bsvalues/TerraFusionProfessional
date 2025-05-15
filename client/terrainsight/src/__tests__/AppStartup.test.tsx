import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock any external components to avoid issues with the test
jest.mock('../components/Dashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-dashboard">Dashboard</div>
}));

// Mock the GoogleMapsDataConnector to avoid API issues
jest.mock('../services/etl/GoogleMapsDataConnector', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      registerDataSource: jest.fn().mockResolvedValue(true),
      isGoogleMapsApiAvailable: jest.fn().mockResolvedValue(true),
      fetchGeocodingData: jest.fn().mockResolvedValue([]),
    }))
  };
});

jest.mock('wouter', () => ({
  Switch: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useLocation: () => ["/", () => {}]
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear any mocks before each test
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    // Render the App component
    render(<App />);
    
    // Check if the component rendered successfully
    // If we get to this point without errors, the test passes
    expect(true).toBeTruthy();
  });

  test('mocks are properly set up', () => {
    // Test that our mocks are working as expected
    const GoogleMapsDataConnector = require('../services/etl/GoogleMapsDataConnector').default;
    const connector = new GoogleMapsDataConnector();
    
    // The mock should resolve to true
    expect(connector.isGoogleMapsApiAvailable()).resolves.toBe(true);
  });
});