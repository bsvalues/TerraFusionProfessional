import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PropertySelectionProvider, usePropertySelection } from '../PropertySelectionContext';
import { Property } from '@/shared/types';

// Mock properties for tests
const mockProperties: Property[] = [
  {
    id: 'prop1',
    parcelId: '12345',
    address: '123 Test Street',
    squareFeet: 2000,
    coordinates: [46.23, -119.15],
  },
  {
    id: 'prop2',
    parcelId: '67890',
    address: '456 Sample Avenue',
    squareFeet: 2500,
    coordinates: [46.24, -119.16],
  },
];

// Test component that uses the context
const TestConsumer = () => {
  const { 
    selectedProperty, 
    selectProperty, 
    clearSelection,
    hoveredProperty,
    setHoveredProperty
  } = usePropertySelection();
  
  return (
    <div>
      <div data-testid="selected-property">
        {selectedProperty ? selectedProperty.address : 'None'}
      </div>
      <div data-testid="hovered-property">
        {hoveredProperty ? hoveredProperty.address : 'None'}
      </div>
      <button 
        data-testid="select-button" 
        onClick={() => selectProperty(mockProperties[0])}
      >
        Select Property 1
      </button>
      <button 
        data-testid="select-button-2" 
        onClick={() => selectProperty(mockProperties[1])}
      >
        Select Property 2
      </button>
      <button 
        data-testid="hover-button" 
        onClick={() => setHoveredProperty(mockProperties[0])}
      >
        Hover Property 1
      </button>
      <button 
        data-testid="clear-button" 
        onClick={() => clearSelection()}
      >
        Clear Selection
      </button>
      <button 
        data-testid="clear-hover-button" 
        onClick={() => setHoveredProperty(null)}
      >
        Clear Hover
      </button>
    </div>
  );
};

describe('PropertySelectionContext', () => {
  test('provides default values', () => {
    render(
      <PropertySelectionProvider>
        <TestConsumer />
      </PropertySelectionProvider>
    );
    
    expect(screen.getByTestId('selected-property')).toHaveTextContent('None');
    expect(screen.getByTestId('hovered-property')).toHaveTextContent('None');
  });
  
  test('allows selecting a property', () => {
    render(
      <PropertySelectionProvider>
        <TestConsumer />
      </PropertySelectionProvider>
    );
    
    fireEvent.click(screen.getByTestId('select-button'));
    expect(screen.getByTestId('selected-property')).toHaveTextContent('123 Test Street');
  });
  
  test('allows hovering over a property', () => {
    render(
      <PropertySelectionProvider>
        <TestConsumer />
      </PropertySelectionProvider>
    );
    
    fireEvent.click(screen.getByTestId('hover-button'));
    expect(screen.getByTestId('hovered-property')).toHaveTextContent('123 Test Street');
  });
  
  test('allows clearing selection', () => {
    render(
      <PropertySelectionProvider>
        <TestConsumer />
      </PropertySelectionProvider>
    );
    
    fireEvent.click(screen.getByTestId('select-button'));
    expect(screen.getByTestId('selected-property')).toHaveTextContent('123 Test Street');
    
    fireEvent.click(screen.getByTestId('clear-button'));
    expect(screen.getByTestId('selected-property')).toHaveTextContent('None');
  });
  
  test('allows clearing hover state', () => {
    render(
      <PropertySelectionProvider>
        <TestConsumer />
      </PropertySelectionProvider>
    );
    
    fireEvent.click(screen.getByTestId('hover-button'));
    expect(screen.getByTestId('hovered-property')).toHaveTextContent('123 Test Street');
    
    fireEvent.click(screen.getByTestId('clear-hover-button'));
    expect(screen.getByTestId('hovered-property')).toHaveTextContent('None');
  });
  
  test('updates selection when new property is selected', () => {
    render(
      <PropertySelectionProvider>
        <TestConsumer />
      </PropertySelectionProvider>
    );
    
    fireEvent.click(screen.getByTestId('select-button'));
    expect(screen.getByTestId('selected-property')).toHaveTextContent('123 Test Street');
    
    fireEvent.click(screen.getByTestId('select-button-2'));
    expect(screen.getByTestId('selected-property')).toHaveTextContent('456 Sample Avenue');
  });
});