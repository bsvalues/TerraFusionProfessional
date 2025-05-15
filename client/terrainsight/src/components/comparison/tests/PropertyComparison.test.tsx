import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyComparisonContext } from '../PropertyComparisonContext';
import { PropertyComparison } from '../PropertyComparison';
import { Property } from '@/shared/schema';

// Mock the property comparison context
const mockContextValue = {
  properties: [] as Property[],
  isLoading: false,
  error: null,
  selectedPropertyId: null,
  selectedProperty: null,
  setSelectedProperty: jest.fn(),
  similarProperties: [] as Property[],
  findSimilarProperties: jest.fn(),
  weights: {
    squareFeet: 1,
    yearBuilt: 1,
    bedrooms: 1,
    bathrooms: 1,
    lotSize: 1,
    neighborhood: 1
  },
  setWeights: jest.fn()
};

// Mock child components
jest.mock('../PropertyComparisonTool', () => {
  return {
    __esModule: true,
    default: jest.fn(({ properties, selectedPropertyId, onSelectProperty, onFindSimilarProperties }) => (
      <div data-testid="mocked-comparison-tool">
        <p>Properties count: {properties.length}</p>
        <p>Selected: {selectedPropertyId || 'none'}</p>
        <button onClick={() => onSelectProperty({ id: 1 } as Property)}>Select Property</button>
        <button onClick={() => onFindSimilarProperties({ id: 1 } as Property, 3)}>Find Similar</button>
      </div>
    ))
  };
});

jest.mock('../ValuationTrendChart', () => {
  return {
    __esModule: true,
    default: jest.fn(({ property }) => (
      <div data-testid="mocked-trend-chart">
        {property ? `Chart for ${property.id}` : 'No property selected'}
      </div>
    ))
  };
});

jest.mock('@/components/ui/button', () => ({
  Button: jest.fn(({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ))
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: jest.fn(({ children, defaultValue }) => (
    <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>
  )),
  TabsList: jest.fn(({ children }) => (
    <div data-testid="tabs-list">{children}</div>
  )),
  TabsTrigger: jest.fn(({ children, value }) => (
    <button data-testid={`tab-${value}`}>{children}</button>
  )),
  TabsContent: jest.fn(({ children, value }) => (
    <div data-testid={`content-${value}`}>{children}</div>
  ))
}));

describe('PropertyComparison Component', () => {
  const renderComponent = (contextOverrides = {}) => {
    const mockContextWithOverrides = {
      ...mockContextValue,
      ...contextOverrides
    };
    
    return render(
      <PropertyComparisonContext.Provider value={mockContextWithOverrides}>
        <PropertyComparison className="test-class" />
      </PropertyComparisonContext.Provider>
    );
  };
  
  test('renders property comparison component with correct properties', () => {
    renderComponent();
    
    // Check that the component renders with the correct class
    const container = screen.getByText(/property comparison/i).closest('div');
    expect(container).toHaveClass('test-class');
    
    // Check for tabs and content sections
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    expect(screen.getByTestId('tab-comparison')).toBeInTheDocument();
    expect(screen.getByTestId('tab-trends')).toBeInTheDocument();
    expect(screen.getByTestId('content-comparison')).toBeInTheDocument();
    expect(screen.getByTestId('content-trends')).toBeInTheDocument();
  });
  
  test('correctly displays property comparison tool', () => {
    const mockProperties = [
      { id: 1, parcelId: 'P1', address: '123 Main St', squareFeet: 2000 },
      { id: 2, parcelId: 'P2', address: '456 Oak Ave', squareFeet: 2500 }
    ] as Property[];
    
    renderComponent({ properties: mockProperties });
    
    // Check that the comparison tool is rendered with properties
    expect(screen.getByTestId('mocked-comparison-tool')).toBeInTheDocument();
    expect(screen.getByText('Properties count: 2')).toBeInTheDocument();
  });
  
  test('handles property selection', () => {
    renderComponent();
    
    // Click the select property button
    fireEvent.click(screen.getByText('Select Property'));
    
    // Check that the setSelectedProperty function was called
    expect(mockContextValue.setSelectedProperty).toHaveBeenCalledWith({ id: 1 });
  });
  
  test('handles find similar properties', () => {
    renderComponent();
    
    // Click the find similar button
    fireEvent.click(screen.getByText('Find Similar'));
    
    // Check that the findSimilarProperties function was called
    expect(mockContextValue.findSimilarProperties).toHaveBeenCalledWith({ id: 1 }, 3);
  });
  
  test('displays valuation trend chart when property is selected', () => {
    const selectedProperty = {
      id: 1,
      parcelId: 'P1',
      address: '123 Main St',
      squareFeet: 2000
    } as Property;
    
    renderComponent({ 
      selectedPropertyId: 1, 
      selectedProperty
    });
    
    // Verify that the trend chart is rendered with the selected property
    const trendContent = screen.getByTestId('content-trends');
    expect(trendContent).toContainElement(screen.getByTestId('mocked-trend-chart'));
    expect(screen.getByText('Chart for 1')).toBeInTheDocument();
  });
  
  test('shows message when no property is selected for trends', () => {
    renderComponent();
    
    // Verify that a message is shown when no property is selected
    const trendContent = screen.getByTestId('content-trends');
    expect(trendContent).toContainElement(screen.getByText('No property selected'));
  });
});