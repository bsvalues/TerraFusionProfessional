/**
 * Tour Service
 * 
 * This service provides the configuration for the application guided tour
 * using Intro.js. It defines tour steps, manages tour state and provides
 * utility functions for tour management.
 */

export interface TourStep {
  element: string;
  title: string;
  intro: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  highlightClass?: string;
}

/**
 * Helper to get an element selector for a tour step
 * @param id - The data-tour attribute value
 * @returns A CSS selector string
 */
export const getTourSelector = (id: string): string => `[data-tour="${id}"]`;

/**
 * Main application tour steps
 */
export const mainTourSteps: TourStep[] = [
  {
    element: getTourSelector('help-button'),
    title: 'Welcome to TerraInsight',
    intro: 'This short tour will guide you through the main features of the application. You can restart the tour anytime by clicking this button.',
    position: 'bottom',
  },
  {
    element: '.bg-gradient-to-r',
    title: 'Application Header',
    intro: 'This header provides access to all main features and navigation options.',
    position: 'bottom',
  },
  {
    element: '#taxYear',
    title: 'Tax Year Selection',
    intro: 'Select the tax year to view and analyze property data for different periods.',
    position: 'bottom',
  },
  {
    element: '.dashboard-container',
    title: 'Dashboard Overview',
    intro: 'The main dashboard shows property analytics, valuation trends, and key performance indicators.',
    position: 'right',
  },
  {
    element: getTourSelector('property-map'),
    title: 'Interactive Property Map',
    intro: 'Explore properties geographically with our interactive map. Click on any property to view details.',
    position: 'left',
  },
  {
    element: getTourSelector('property-filters'),
    title: 'Property Filters',
    intro: 'Filter properties by various criteria including value range, neighborhoods, and property types.',
    position: 'right',
  },
  {
    element: getTourSelector('analysis-tools'),
    title: 'Analysis Tools',
    intro: 'Access powerful analysis tools including regression modeling, outlier detection, and trend analysis.',
    position: 'left',
  },
  {
    element: getTourSelector('export-reports'),
    title: 'Export & Reports',
    intro: 'Generate and export professional reports with a single click.',
    position: 'left',
  }
];

/**
 * Property comparison tour steps
 */
export const comparisonTourSteps: TourStep[] = [
  {
    element: getTourSelector('comparison-panel'),
    title: 'Property Comparison Tool',
    intro: 'Compare multiple properties side by side to identify similarities and differences.',
    position: 'right',
  },
  {
    element: getTourSelector('property-selector'),
    title: 'Property Selection',
    intro: 'Select properties to compare from the dropdown or map.',
    position: 'bottom',
  },
  {
    element: getTourSelector('comparison-attributes'),
    title: 'Comparison Attributes',
    intro: 'Choose which property attributes to include in your comparison.',
    position: 'right',
  },
  {
    element: getTourSelector('comparison-chart'),
    title: 'Visual Comparison Chart',
    intro: 'Visual representation of property attributes for quick insights and analysis.',
    position: 'top',
  },
  {
    element: getTourSelector('comparison-heatmap'),
    title: 'Comparison Heatmap',
    intro: 'View a color-coded heatmap to easily identify outliers and patterns across properties.',
    position: 'right',
  }
];

/**
 * Heatmap tour steps
 */
export const heatmapTourSteps: TourStep[] = [
  {
    element: getTourSelector('heatmap-visualization'),
    title: 'Heatmap Visualization',
    intro: 'The heatmap shows property density or values using color intensity.',
    position: 'right',
  },
  {
    element: getTourSelector('heatmap-controls'),
    title: 'Heatmap Controls',
    intro: 'Adjust the intensity, radius and opacity of the heatmap.',
    position: 'bottom',
  },
  {
    element: getTourSelector('heatmap-layers'),
    title: 'Heatmap Layers',
    intro: 'Switch between different data layers such as property value, age, or sales activity.',
    position: 'left',
  },
  {
    element: getTourSelector('heatmap-legend'),
    title: 'Heatmap Legend',
    intro: 'This legend explains what the different colors represent.',
    position: 'left',
  }
];

/**
 * Map tour steps
 */
export const mapTourSteps: TourStep[] = [
  {
    element: getTourSelector('map-container'),
    title: 'Interactive Property Map',
    intro: 'Explore properties geographically with our interactive map. Click on any property to view details.',
    position: 'right',
  },
  {
    element: getTourSelector('map-controls'),
    title: 'Map Controls',
    intro: 'Use these controls to zoom, pan, and reset the map view.',
    position: 'right',
  },
  {
    element: getTourSelector('map-layers'),
    title: 'Map Layers',
    intro: 'Toggle between different map layers such as street view, satellite imagery, or topographic data.',
    position: 'bottom',
  },
  {
    element: getTourSelector('property-clusters'),
    title: 'Property Clusters',
    intro: 'Properties are grouped into clusters for better visualization. Click on a cluster to zoom in.',
    position: 'right',
  },
  {
    element: getTourSelector('map-search'),
    title: 'Map Search',
    intro: 'Search for specific addresses or parcels to locate them on the map.',
    position: 'bottom',
  }
];

/**
 * Export tour steps
 */
export const exportTourSteps: TourStep[] = [
  {
    element: getTourSelector('export-panel'),
    title: 'Export & Reports',
    intro: 'Generate and export professional reports with a single click.',
    position: 'right',
  },
  {
    element: getTourSelector('export-format'),
    title: 'Export Format',
    intro: 'Choose the export format such as PDF, Excel, or CSV.',
    position: 'bottom',
  },
  {
    element: getTourSelector('report-template'),
    title: 'Report Templates',
    intro: 'Select from various report templates for different purposes.',
    position: 'right',
  },
  {
    element: getTourSelector('export-options'),
    title: 'Export Options',
    intro: 'Configure advanced options such as data fields, sorting, and filtering criteria.',
    position: 'top',
  },
  {
    element: getTourSelector('download-button'),
    title: 'Download Report',
    intro: 'Click here to generate and download your customized report.',
    position: 'bottom',
  }
];