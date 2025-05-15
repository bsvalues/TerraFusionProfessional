import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimeSeriesChart } from '../components/timeseries/TimeSeriesChart';
import { PropertyValueTrend } from '../components/timeseries/PropertyValueTrend';
import { ForecastingPanel } from '../components/timeseries/ForecastingPanel';
import { TimeSeriesAnalysisPanel } from '../components/panels/TimeSeriesAnalysisPanel';
import { Property } from '../../shared/schema';
import { TimeSeriesDataPoint, ForecastResult } from '../services/timeseries/timeSeriesAnalysisService';

// Sample data for tests
const sampleTimeSeries: TimeSeriesDataPoint[] = [
  { date: new Date('2018-01-01'), value: 280000, interpolated: false },
  { date: new Date('2019-01-01'), value: 295000, interpolated: false },
  { date: new Date('2020-01-01'), value: 310000, interpolated: false },
  { date: new Date('2021-01-01'), value: 330000, interpolated: false },
  { date: new Date('2022-01-01'), value: 350000, interpolated: false }
];

const sampleForecast: ForecastResult = {
  predictions: [
    { date: new Date('2023-01-01'), value: 370000, lowerBound: 360000, upperBound: 380000 },
    { date: new Date('2024-01-01'), value: 390000, lowerBound: 375000, upperBound: 405000 },
    { date: new Date('2025-01-01'), value: 411000, lowerBound: 390000, upperBound: 432000 }
  ],
  model: 'linear',
  confidence: 0.85
};

const sampleProperty: Property = {
  id: 1,
  parcelId: 'TS001',
  address: '123 Time Series St',
  propertyType: 'Residential',
  yearBuilt: 2000,
  squareFeet: 2000,
  bedrooms: 3,
  bathrooms: 2,
  lotSize: 0.25,
  value: '350000',
  coordinates: [47.6062, -122.3321]
};

// Mock chart libraries
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart">Line Chart</div>
}));

describe('Time Series Components', () => {
  // TimeSeriesChart tests
  describe('TimeSeriesChart Component', () => {
    test('should render time series chart with data points', () => {
      render(<TimeSeriesChart 
        data={sampleTimeSeries} 
        forecastData={[]} 
        title="Property Value History" 
      />);
      
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
      expect(screen.getByText('Property Value History')).toBeInTheDocument();
    });
    
    test('should render no data message when empty', () => {
      render(<TimeSeriesChart 
        data={[]} 
        forecastData={[]} 
        title="Empty Chart" 
      />);
      
      expect(screen.getByText(/no historical data available/i)).toBeInTheDocument();
    });
    
    test('should display forecast data when provided', () => {
      render(<TimeSeriesChart 
        data={sampleTimeSeries} 
        forecastData={sampleForecast.predictions} 
        title="With Forecast" 
        showForecast={true}
      />);
      
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
      expect(screen.getByText('With Forecast')).toBeInTheDocument();
    });
  });
  
  // PropertyValueTrend tests
  describe('PropertyValueTrend Component', () => {
    test('should display property trend information', () => {
      render(<PropertyValueTrend 
        property={sampleProperty}
        timeSeries={sampleTimeSeries}
        trendInfo={{
          direction: 'up',
          growthRate: 0.0574,
          averageAnnualChange: 17500,
          totalChange: 70000,
          startValue: 280000,
          endValue: 350000
        }}
      />);
      
      expect(screen.getByText(/123 Time Series St/i)).toBeInTheDocument();
      expect(screen.getByText(/upward trend/i)).toBeInTheDocument();
      expect(screen.getByText(/5.7%/i)).toBeInTheDocument();
    });
    
    test('should handle properties with no trend data', () => {
      render(<PropertyValueTrend 
        property={sampleProperty}
        timeSeries={[]}
        trendInfo={null}
      />);
      
      expect(screen.getByText(/insufficient historical data/i)).toBeInTheDocument();
    });
  });
  
  // ForecastingPanel tests
  describe('ForecastingPanel Component', () => {
    test('should render forecasting configuration controls', () => {
      render(<ForecastingPanel 
        property={sampleProperty}
        timeSeries={sampleTimeSeries}
        onGenerateForecast={jest.fn()}
      />);
      
      expect(screen.getByText(/forecast period/i)).toBeInTheDocument();
      expect(screen.getByText(/forecasting model/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate forecast/i })).toBeInTheDocument();
    });
    
    test('should call onGenerateForecast when button clicked', async () => {
      const mockGenerateForecast = jest.fn();
      render(<ForecastingPanel 
        property={sampleProperty}
        timeSeries={sampleTimeSeries}
        onGenerateForecast={mockGenerateForecast}
      />);
      
      fireEvent.click(screen.getByRole('button', { name: /generate forecast/i }));
      
      await waitFor(() => {
        expect(mockGenerateForecast).toHaveBeenCalled();
      });
    });
    
    test('should display forecast results when available', () => {
      render(<ForecastingPanel 
        property={sampleProperty}
        timeSeries={sampleTimeSeries}
        onGenerateForecast={jest.fn()}
        forecastResult={sampleForecast}
      />);
      
      expect(screen.getByText(/forecast results/i)).toBeInTheDocument();
      expect(screen.getByText(/confidence: 85%/i)).toBeInTheDocument();
    });
    
    test('should disable forecast button with insufficient data', () => {
      render(<ForecastingPanel 
        property={sampleProperty}
        timeSeries={[{ date: new Date('2022-01-01'), value: 350000, interpolated: false }]}
        onGenerateForecast={jest.fn()}
      />);
      
      const button = screen.getByRole('button', { name: /generate forecast/i });
      expect(button).toBeDisabled();
      expect(screen.getByText(/need at least 3 years/i)).toBeInTheDocument();
    });
  });
  
  // TimeSeriesAnalysisPanel integration tests
  describe('TimeSeriesAnalysisPanel Integration', () => {
    test('should display property selection interface', () => {
      render(<TimeSeriesAnalysisPanel properties={[sampleProperty]} />);
      
      expect(screen.getByText(/select property/i)).toBeInTheDocument();
    });
    
    test('should show no properties message when empty', () => {
      render(<TimeSeriesAnalysisPanel properties={[]} />);
      
      expect(screen.getByText(/no properties available/i)).toBeInTheDocument();
    });
  });
});