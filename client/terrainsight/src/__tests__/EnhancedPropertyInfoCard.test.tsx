import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EnhancedPropertyInfoCard from '@/components/property/EnhancedPropertyInfoCard';
import { Property } from '@shared/schema';

// Mock timer functions
jest.useFakeTimers();

// Sample property data for testing
const sampleProperty: Property = {
  id: 1,
  parcelId: 'TEST12345',
  address: '123 Test Street, Testville, WA 98765',
  owner: 'Test Owner',
  value: '$450,000',
  salePrice: '$425,000',
  squareFeet: 2200,
  yearBuilt: 2005,
  landValue: '$120,000',
  coordinates: [46.2800, -119.2680],
  latitude: 46.2800,
  longitude: -119.2680,
  neighborhood: 'Test Neighborhood',
  propertyType: 'Residential',
  bedrooms: 3,
  bathrooms: 2,
  lotSize: 8500,
  zoning: 'R1',
  lastSaleDate: '2020-05-15',
  taxAssessment: '$435,000',
  pricePerSqFt: '$204.55',
  attributes: {
    garage: 'Attached, 2-car',
    stories: 2,
    pool: false,
    heating: 'Forced air',
    cooling: 'Central AC',
    foundation: 'Concrete',
    roofType: 'Composite shingle',
    exteriorMaterial: 'Vinyl siding',
    yearRenovated: 2018,
    qualityGrade: 'Good',
    view: 'None',
    waterfront: false
  }
};

// Mock functions
const mockHandleClose = jest.fn();
const mockHandleAddToCompare = jest.fn();

describe('Enhanced Property Info Card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
  
  test('Should display property card with core information when property is provided', () => {
    render(
      <EnhancedPropertyInfoCard 
        property={sampleProperty}
        onClose={mockHandleClose}
        onAddToCompare={mockHandleAddToCompare}
      />
    );
    
    // Check for core property information
    expect(screen.getByText(sampleProperty.address)).toBeInTheDocument();
    expect(screen.getByText(sampleProperty.value as string)).toBeInTheDocument();
    expect(screen.getByText(`${sampleProperty.bedrooms} beds`)).toBeInTheDocument();
    expect(screen.getByText(`${sampleProperty.bathrooms} baths`)).toBeInTheDocument();
    expect(screen.getByText(`${sampleProperty.squareFeet} sq.ft.`)).toBeInTheDocument();
  });
  
  test('Should display "No property selected" message when no property is provided', () => {
    render(
      <EnhancedPropertyInfoCard 
        property={null}
        onClose={mockHandleClose}
        onAddToCompare={mockHandleAddToCompare}
      />
    );
    
    expect(screen.getByText('No property selected')).toBeInTheDocument();
  });
  
  test('Should expand/collapse additional information sections when clicked', () => {
    render(
      <EnhancedPropertyInfoCard 
        property={sampleProperty}
        onClose={mockHandleClose}
        onAddToCompare={mockHandleAddToCompare}
      />
    );
    
    // Check that details section exists but is initially collapsed
    const detailsButton = screen.getByText('Property Details');
    expect(detailsButton).toBeInTheDocument();
    
    // Expanded content should not be visible initially
    expect(screen.queryByText('Year Built:')).not.toBeVisible();
    
    // Click to expand
    fireEvent.click(detailsButton);
    
    // Now expanded content should be visible
    expect(screen.getByText('Year Built:')).toBeVisible();
    expect(screen.getByText(sampleProperty.yearBuilt as number)).toBeVisible();
    
    // Click again to collapse
    fireEvent.click(detailsButton);
    
    // Content should be hidden again
    expect(screen.queryByText('Year Built:')).not.toBeVisible();
  });
  
  test('Quick action buttons should call appropriate handlers', () => {
    render(
      <EnhancedPropertyInfoCard 
        property={sampleProperty}
        onClose={mockHandleClose}
        onAddToCompare={mockHandleAddToCompare}
      />
    );
    
    // Test close button
    const closeButton = screen.getByLabelText('Close property information');
    fireEvent.click(closeButton);
    expect(mockHandleClose).toHaveBeenCalled();
    
    // Test add to compare button
    const compareButton = screen.getByText('Add to Compare');
    fireEvent.click(compareButton);
    expect(mockHandleAddToCompare).toHaveBeenCalledWith(sampleProperty);
  });
  
  test('Should show visual indicators for property value assessment', () => {
    render(
      <EnhancedPropertyInfoCard 
        property={sampleProperty}
        onClose={mockHandleClose}
        onAddToCompare={mockHandleAddToCompare}
      />
    );
    
    // Check for value comparison indicator
    expect(screen.getByTestId('value-indicator')).toBeInTheDocument();
  });
  
  test('Card should show location information with map preview', () => {
    render(
      <EnhancedPropertyInfoCard 
        property={sampleProperty}
        onClose={mockHandleClose}
        onAddToCompare={mockHandleAddToCompare}
      />
    );
    
    // Check for location section
    const locationButton = screen.getByText('Location');
    expect(locationButton).toBeInTheDocument();
    
    // Expand location section
    fireEvent.click(locationButton);
    
    // Check for map preview container
    expect(screen.getByTestId('map-preview')).toBeInTheDocument();
  });
  
  test('Should display tax and assessment information when relevant section is expanded', () => {
    render(
      <EnhancedPropertyInfoCard 
        property={sampleProperty}
        onClose={mockHandleClose}
        onAddToCompare={mockHandleAddToCompare}
      />
    );
    
    // Find and click the tax/assessment section button
    const taxButton = screen.getByText('Tax & Assessment');
    fireEvent.click(taxButton);
    
    // Check that tax assessment information is now visible
    expect(screen.getByText('Tax Assessment:')).toBeVisible();
    expect(screen.getByText(sampleProperty.taxAssessment as string)).toBeVisible();
  });
  
  test('Should display tabs for different information categories', () => {
    render(
      <EnhancedPropertyInfoCard 
        property={sampleProperty}
        onClose={mockHandleClose}
        onAddToCompare={mockHandleAddToCompare}
      />
    );
    
    // Check for tab buttons
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });
  
  test('Should switch between tabs when clicked', () => {
    render(
      <EnhancedPropertyInfoCard 
        property={sampleProperty}
        onClose={mockHandleClose}
        onAddToCompare={mockHandleAddToCompare}
      />
    );
    
    // Overview should be visible by default
    expect(screen.getByTestId('overview-tab-content')).toBeVisible();
    
    // Click Details tab
    fireEvent.click(screen.getByText('Details'));
    
    // Details should now be visible, Overview hidden
    expect(screen.getByTestId('details-tab-content')).toBeVisible();
    expect(screen.queryByTestId('overview-tab-content')).not.toBeVisible();
    
    // Click History tab
    fireEvent.click(screen.getByText('History'));
    
    // History should now be visible, Details hidden
    expect(screen.getByTestId('history-tab-content')).toBeVisible();
    expect(screen.queryByTestId('details-tab-content')).not.toBeVisible();
  });
});