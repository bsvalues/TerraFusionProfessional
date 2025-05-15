import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '@/components/Dashboard';

// Mock the routing
jest.mock('wouter', () => ({
  useLocation: () => ['/dashboard', jest.fn()],
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to} data-testid="wouter-link">
      {children}
    </a>
  ),
}));

// Mock panel components 
jest.mock('@/components/panels/OverviewPanel', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="overview-panel">Overview Panel</div>,
  };
});

jest.mock('@/components/panels/MapPanel', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="map-panel">Map Panel</div>,
  };
});

jest.mock('@/components/panels/ScriptPanel', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="script-panel">Script Panel</div>,
  };
});

jest.mock('@/components/panels/DataPanel', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="data-panel">Data Panel</div>,
  };
});

jest.mock('@/components/panels/RegressionPanel', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="regression-panel">Regression Panel</div>,
  };
});

jest.mock('@/components/panels/SettingsPanel', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="settings-panel">Settings Panel</div>,
  };
});

// Mock components used by Dashboard
jest.mock('@/components/Header', () => ({
  __esModule: true,
  default: ({ taxYear, onTaxYearChange }: { taxYear: string; onTaxYearChange: (year: string) => void }) => (
    <div data-testid="header">
      <span>Tax Year: {taxYear}</span>
      <button onClick={() => onTaxYearChange('2023')}>Change Year</button>
    </div>
  ),
}));

jest.mock('@/components/TabNavigation', () => ({
  __esModule: true,
  default: ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => (
    <div data-testid="tab-navigation">
      <span>Active Tab: {activeTab}</span>
      <button onClick={() => onTabChange('map')}>Map Tab</button>
      <button onClick={() => onTabChange('data')}>Data Tab</button>
    </div>
  ),
}));

describe('Dashboard', () => {
  test('renders header with tax year', () => {
    render(<Dashboard />);
    
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent(/Tax Year:/);
  });

  test('renders tab navigation', () => {
    render(<Dashboard />);
    
    const tabNavigation = screen.getByTestId('tab-navigation');
    expect(tabNavigation).toBeInTheDocument();
    expect(tabNavigation).toHaveTextContent(/Active Tab:/);
  });

  test('updates active tab when tab is changed', () => {
    render(<Dashboard />);
    
    // Default tab should be overview
    const tabNavigation = screen.getByTestId('tab-navigation');
    expect(tabNavigation).toHaveTextContent(/Active Tab: overview/);
    
    // Click on Map tab
    const mapTabButton = screen.getByText('Map Tab');
    fireEvent.click(mapTabButton);
    
    expect(tabNavigation).toHaveTextContent(/Active Tab: map/);
  });

  test('updates tax year when changed in header', () => {
    render(<Dashboard />);
    
    // Default year
    const header = screen.getByTestId('header');
    expect(header).toHaveTextContent(/Tax Year: 2024/);
    
    // Change year
    const changeYearButton = screen.getByText('Change Year');
    fireEvent.click(changeYearButton);
    
    expect(header).toHaveTextContent(/Tax Year: 2023/);
  });

  test('renders the active panel based on selected tab', () => {
    render(<Dashboard />);
    
    // Default tab should show overview panel
    let overviewPanel = screen.getByTestId('overview-panel');
    expect(overviewPanel).toBeInTheDocument();
    
    // Change to map tab
    const mapTabButton = screen.getByText('Map Tab');
    fireEvent.click(mapTabButton);
    
    // Now map panel should be shown
    const mapPanel = screen.getByTestId('map-panel');
    expect(mapPanel).toBeInTheDocument();
    
    // And overview panel should not be visible
    overviewPanel = screen.queryByTestId('overview-panel');
    expect(overviewPanel).not.toBeInTheDocument();
  });
});