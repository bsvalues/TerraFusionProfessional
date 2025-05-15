import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KPIDashboard } from '../components/kpi/KPIDashboard';
import { ValuationMetricsCard } from '../components/kpi/ValuationMetricsCard';
import { MarketTrendCard } from '../components/kpi/MarketTrendCard';
import { RegionalPerformanceCard } from '../components/kpi/RegionalPerformanceCard';
import { ValueChangeCard } from '../components/kpi/ValueChangeCard';
import { Property } from '@shared/schema';

// Sample test data matching the service test data
const sampleProperties: Property[] = [
  {
    id: 1,
    parcelId: "PR00001",
    address: "123 Main St",
    owner: "John Doe",
    value: "250000",
    squareFeet: 1800,
    yearBuilt: 2005,
    neighborhood: "Downtown",
    propertyType: "residential",
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 5000,
    coordinates: [47.2, -122.3],
    valueHistory: {
      "2023": "250000",
      "2022": "240000",
      "2021": "230000",
      "2020": "220000"
    }
  },
  {
    id: 2,
    parcelId: "PR00002",
    address: "456 Oak Ave",
    owner: "Jane Smith",
    value: "320000",
    squareFeet: 2200,
    yearBuilt: 2010,
    neighborhood: "Downtown",
    propertyType: "residential",
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 6000,
    coordinates: [47.22, -122.32],
    valueHistory: {
      "2023": "320000",
      "2022": "300000",
      "2021": "285000",
      "2020": "270000"
    }
  },
  {
    id: 3,
    parcelId: "PR00003",
    address: "789 Pine Ln",
    owner: "Bob Johnson",
    value: "180000",
    squareFeet: 1200,
    yearBuilt: 1995,
    neighborhood: "Westside",
    propertyType: "residential",
    bedrooms: 2,
    bathrooms: 1,
    lotSize: 4000,
    coordinates: [47.25, -122.4],
    valueHistory: {
      "2023": "180000",
      "2022": "175000",
      "2021": "170000",
      "2020": "165000"
    }
  }
];

// Mock metrics for individual component tests
const mockValuationMetrics = {
  averageValue: 250000,
  medianValue: 225000,
  valueRange: [150000, 350000],
  totalProperties: 3,
  valueDistribution: { 
    "0-200k": 1, 
    "200k-300k": 1, 
    "300k-400k": 1, 
    "400k-500k": 0, 
    "500k+": 0 
  }
};

const mockMarketTrends = {
  trendData: [
    { period: "2020", value: 218333 },
    { period: "2021", value: 228333 },
    { period: "2022", value: 238333 },
    { period: "2023", value: 250000 }
  ],
  trendDirection: "up",
  percentageChange: 4.6
};

const mockRegionalPerformance = [
  { region: "Downtown", averageValue: 285000, propertyCount: 2 },
  { region: "Westside", averageValue: 180000, propertyCount: 1 }
];

const mockValueChanges = [
  { period: "2020", averageValue: 218333 },
  { period: "2021", averageValue: 228333 },
  { period: "2022", averageValue: 238333 },
  { period: "2023", averageValue: 250000 }
];

// Mock service functions
jest.mock('../services/kpi/kpiService', () => ({
  calculateValuationMetrics: jest.fn(() => mockValuationMetrics),
  calculateMarketTrends: jest.fn(() => mockMarketTrends),
  calculateRegionalPerformance: jest.fn(() => mockRegionalPerformance),
  calculateValueChanges: jest.fn(() => mockValueChanges)
}));

describe('KPI Dashboard Tests', () => {
  test('KPIDashboard renders all KPI cards', () => {
    render(<KPIDashboard properties={sampleProperties} />);
    
    expect(screen.getByTestId('valuation-metrics-card')).toBeInTheDocument();
    expect(screen.getByTestId('market-trend-card')).toBeInTheDocument();
    expect(screen.getByTestId('regional-performance-card')).toBeInTheDocument();
    expect(screen.getByTestId('value-change-card')).toBeInTheDocument();
  });
  
  test('ValuationMetricsCard displays correct metrics', () => {
    render(<ValuationMetricsCard metrics={mockValuationMetrics} />);
    
    expect(screen.getByText('$250,000')).toBeInTheDocument();
    expect(screen.getByText('$225,000')).toBeInTheDocument();
    expect(screen.getByText('Total Properties: 3')).toBeInTheDocument();
  });
  
  test('MarketTrendCard shows trend direction and percentage', () => {
    render(<MarketTrendCard trends={mockMarketTrends} />);
    
    expect(screen.getByText(/up/i)).toBeInTheDocument();
    expect(screen.getByText(/4.6%/i)).toBeInTheDocument();
  });
  
  test('RegionalPerformanceCard displays regions and their metrics', () => {
    render(<RegionalPerformanceCard performance={mockRegionalPerformance} />);
    
    expect(screen.getByText(/Downtown/i)).toBeInTheDocument();
    expect(screen.getByText(/Westside/i)).toBeInTheDocument();
    expect(screen.getByText('$285,000')).toBeInTheDocument();
    expect(screen.getByText('$180,000')).toBeInTheDocument();
  });
  
  test('ValueChangeCard displays historical value changes', () => {
    render(<ValueChangeCard changes={mockValueChanges} />);
    
    expect(screen.getByText(/2020/i)).toBeInTheDocument();
    expect(screen.getByText(/2023/i)).toBeInTheDocument();
    expect(screen.getByText('$218,333')).toBeInTheDocument();
    expect(screen.getByText('$250,000')).toBeInTheDocument();
  });
  
  test('KPI configuration panel toggles cards visibility', async () => {
    render(<KPIDashboard properties={sampleProperties} />);
    
    const configButton = screen.getByRole('button', { name: /configure/i });
    await userEvent.click(configButton);
    
    // Find the toggle for value change card
    const valueChangeToggle = screen.getByLabelText(/value change/i);
    await userEvent.click(valueChangeToggle);
    
    // Value change card should be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('value-change-card')).not.toBeInTheDocument();
    });
  });
  
  test('Dashboard shows loading state before data is ready', () => {
    // Override mock implementation to return undefined initially
    require('../services/kpi/kpiService').calculateValuationMetrics.mockImplementationOnce(() => undefined);
    
    render(<KPIDashboard properties={sampleProperties} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  test('Dashboard handles empty properties gracefully', () => {
    render(<KPIDashboard properties={[]} />);
    expect(screen.getByText(/no property data available/i)).toBeInTheDocument();
  });
  
  test('Dashboard applies time period filters', async () => {
    render(<KPIDashboard properties={sampleProperties} />);
    
    const periodSelect = screen.getByLabelText(/time period/i);
    await userEvent.selectOptions(periodSelect, 'quarterly');
    
    // Mock should have been called with 'quarterly'
    expect(require('../services/kpi/kpiService').calculateMarketTrends).toHaveBeenCalledWith(
      expect.anything(),
      'quarterly'
    );
  });
});