import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PropertyTaxEstimator from '../PropertyTaxEstimator';
import { Property } from '../../../shared/schema';
import * as taxEstimatorService from '../../../services/taxEstimatorService';

// Mock tax estimator service
jest.mock('../../../services/taxEstimatorService', () => ({
  estimatePropertyTax: jest.fn(),
  formatTaxSummary: jest.fn(),
  parsePropertyValue: jest.fn().mockImplementation(value => {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, ''));
  }),
}));

// Mock sub-components
jest.mock('../TaxRatesPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="tax-rates-panel">Tax Rates Panel</div>
}));

jest.mock('../TaxExemptionsPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="tax-exemptions-panel">Tax Exemptions Panel</div>
}));

jest.mock('../PropertyTaxBreakdownChart', () => ({
  __esModule: true,
  default: ({ breakdown }: { breakdown: any }) => (
    <div data-testid="tax-breakdown-chart">
      Tax Breakdown Chart
      <div data-testid="chart-total">{breakdown.total}</div>
    </div>
  )
}));

// Mock formatCurrency from utils
jest.mock('@/lib/utils', () => ({
  formatCurrency: jest.fn().mockImplementation(value => `$${value.toLocaleString()}`),
}));

describe('PropertyTaxEstimator Component', () => {
  // Mock property
  const mockProperty: Partial<Property> = {
    id: 1,
    address: '123 Test St',
    parcelId: 'TEST123',
    value: '$300,000',
    neighborhood: 'Kennewick',
    propertyType: 'Residential'
  };
  
  // Mock tax estimate
  const mockTaxEstimate = {
    county: 375,
    city: 735,
    schoolDistrict: 1290,
    fireDistrict: 450,
    libraryDistrict: 135,
    hospitalDistrict: 90,
    portDistrict: 105,
    stateSchool: 735,
    total: 3915,
    effectiveRate: 1.305,
    exemptions: { total: 0 }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (taxEstimatorService.estimatePropertyTax as jest.Mock).mockReturnValue(mockTaxEstimate);
    (taxEstimatorService.formatTaxSummary as jest.Mock).mockReturnValue('Formatted tax summary');
  });
  
  it('renders the property tax estimator', () => {
    render(<PropertyTaxEstimator property={mockProperty as Property} />);
    
    // Check for main components
    expect(screen.getByText('Property Tax Estimator')).toBeInTheDocument();
    expect(screen.getByText(/Estimate annual property taxes for/)).toBeInTheDocument();
    
    // Check for tabs
    expect(screen.getByRole('tab', { name: 'Calculator' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tax Rates' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Exemptions' })).toBeInTheDocument();
  });
  
  it('calls estimatePropertyTax when Calculate button is clicked', async () => {
    render(<PropertyTaxEstimator property={mockProperty as Property} />);
    
    const calculateButton = screen.getByRole('button', { name: 'Calculate Property Tax' });
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(taxEstimatorService.estimatePropertyTax).toHaveBeenCalled();
    });
    
    // Check that results are displayed
    expect(screen.getByText('Tax Estimate Summary')).toBeInTheDocument();
  });
  
  it('toggles tax district options', async () => {
    render(<PropertyTaxEstimator property={mockProperty as Property} />);
    
    // Toggle off city tax
    const cityCheckbox = screen.getByLabelText('City');
    fireEvent.click(cityCheckbox);
    
    // Calculate taxes
    const calculateButton = screen.getByRole('button', { name: 'Calculate Property Tax' });
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(taxEstimatorService.estimatePropertyTax).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ includeCity: false })
      );
    });
  });
  
  it('allows custom property value input', async () => {
    render(<PropertyTaxEstimator property={mockProperty as Property} />);
    
    // Enable custom value toggle
    const customValueToggle = screen.getByLabelText('Custom Value');
    fireEvent.click(customValueToggle);
    
    // Find input and change value
    const valueInput = screen.getByPlaceholderText('Enter property value');
    fireEvent.change(valueInput, { target: { value: '500000' } });
    
    // Calculate taxes
    const calculateButton = screen.getByRole('button', { name: 'Calculate Property Tax' });
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      // Check that estimatePropertyTax was called with a property that has the new value
      expect(taxEstimatorService.estimatePropertyTax).toHaveBeenCalledWith(
        expect.objectContaining({ value: '$500000' }),
        expect.anything()
      );
    });
  });
  
  it('toggles exemption options', async () => {
    render(<PropertyTaxEstimator property={mockProperty as Property} />);
    
    // Toggle on homestead exemption
    const homesteadCheckbox = screen.getByLabelText('Homestead');
    fireEvent.click(homesteadCheckbox);
    
    // Calculate taxes
    const calculateButton = screen.getByRole('button', { name: 'Calculate Property Tax' });
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(taxEstimatorService.estimatePropertyTax).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ homesteadExemption: true })
      );
    });
  });
  
  it('allows switching between tabs', async () => {
    render(<PropertyTaxEstimator property={mockProperty as Property} />);
    
    // Default tab should be calculator
    expect(screen.getByText('Include Tax Districts')).toBeInTheDocument();
    
    // Switch to rates tab
    const ratesTab = screen.getByRole('tab', { name: 'Tax Rates' });
    fireEvent.click(ratesTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('tax-rates-panel')).toBeInTheDocument();
    });
    
    // Switch to exemptions tab
    const exemptionsTab = screen.getByRole('tab', { name: 'Exemptions' });
    fireEvent.click(exemptionsTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('tax-exemptions-panel')).toBeInTheDocument();
    });
  });
});