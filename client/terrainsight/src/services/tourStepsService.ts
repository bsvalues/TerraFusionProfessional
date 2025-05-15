import { TourStep } from '@/hooks/use-guided-tour';

/**
 * Service that defines tour steps for different parts of the application
 */
export class TourStepsService {
  /**
   * Tour steps for the main application overview
   */
  static getOverviewTourSteps(): TourStep[] {
    return [
      {
        element: '[data-tour="welcome-message"]',
        intro: 'Welcome to TerraInsight, your advanced property valuation and analysis platform for Benton County, Washington.',
        title: '👋 Welcome',
        position: 'bottom'
      },
      {
        element: '[data-tour="app-navigation"]',
        intro: 'Navigate between different sections of the application using these tabs.',
        title: 'Navigation',
        position: 'bottom'
      },
      {
        element: '[data-tour="quick-stats"]',
        intro: 'View important property statistics and key performance indicators at a glance.',
        title: 'Quick Statistics',
        position: 'bottom'
      },
      {
        element: '[data-tour="detailed-stats"]',
        intro: 'These cards provide more detailed information about property statistics, value distribution, and recent activity.',
        title: 'Detailed Statistics',
        position: 'top'
      },
      {
        element: '[data-tour="alerts-panel"]',
        intro: 'Important notifications and updates about the property data will appear here.',
        title: 'Alerts',
        position: 'top'
      },
      {
        element: '[data-tour="feature-cards"]',
        intro: 'Access the core features of the application, including the interactive map, spatial analysis, and property comparison tools.',
        title: 'Core Features',
        position: 'bottom'
      },
      {
        element: '[data-tour="map-feature"]',
        intro: 'Click here to access the interactive map where you can visualize property data geographically.',
        title: 'Map View',
        position: 'right'
      },
      {
        element: '[data-tour="advanced-features"]',
        intro: 'Advanced tools for regression modeling, custom scripts, and comprehensive reporting.',
        title: 'Advanced Tools',
        position: 'top'
      }
    ];
  }

  /**
   * Tour steps for the map panel
   */
  static getMapTourSteps(): TourStep[] {
    return [
      {
        element: '[data-tour="map-container"]',
        intro: 'This interactive map displays properties across Benton County with various visualization options.',
        title: 'Interactive Map',
        position: 'top'
      },
      {
        element: '[data-tour="map-layers"]',
        intro: 'Toggle different map layers to view various data overlays like property values, zoning, or demographic information.',
        title: 'Map Layers',
        position: 'left'
      },
      {
        element: '[data-tour="heat-map-controls"]',
        intro: 'Adjust heat map settings to visualize property data intensity across different regions.',
        title: 'Heat Map',
        position: 'left'
      },
      {
        element: '[data-tour="filter-controls"]',
        intro: 'Filter properties by various criteria such as value range, property type, or year built.',
        title: 'Property Filters',
        position: 'right'
      },
      {
        element: '[data-tour="property-search"]',
        intro: 'Search for specific properties by address, owner name, or parcel ID.',
        title: 'Property Search',
        position: 'bottom'
      }
    ];
  }

  /**
   * Tour steps for the analysis section
   */
  static getAnalysisTourSteps(): TourStep[] {
    return [
      {
        element: '[data-tour="analysis-header"]',
        intro: 'The Spatial Analysis section provides advanced tools to analyze property data and identify patterns.',
        title: 'Spatial Analysis',
        position: 'bottom'
      },
      {
        element: '[data-tour="cluster-analysis"]',
        intro: 'Run clustering algorithms to identify similar property groups based on location and attributes.',
        title: 'Cluster Analysis',
        position: 'right'
      },
      {
        element: '[data-tour="proximity-tools"]',
        intro: 'Analyze properties based on their proximity to important locations like schools, parks, or commercial areas.',
        title: 'Proximity Analysis',
        position: 'left'
      },
      {
        element: '[data-tour="hotspot-detection"]',
        intro: 'Identify areas with unusually high or low property values compared to surrounding neighborhoods.',
        title: 'Hotspot Detection',
        position: 'top'
      }
    ];
  }

  /**
   * Tour steps for the regression modeling section
   */
  static getRegressionTourSteps(): TourStep[] {
    return [
      {
        element: '[data-tour="regression-header"]',
        intro: 'The Regression Modeling section allows you to build predictive models for property valuation.',
        title: 'Regression Models',
        position: 'bottom'
      },
      {
        element: '[data-tour="model-variables"]',
        intro: 'Select variables to include in your regression model based on their significance.',
        title: 'Model Variables',
        position: 'right'
      },
      {
        element: '[data-tour="model-results"]',
        intro: 'View detailed statistics about your model\'s performance and accuracy.',
        title: 'Model Results',
        position: 'top'
      },
      {
        element: '[data-tour="model-visualization"]',
        intro: 'Visualize the relationship between different variables in your model.',
        title: 'Visualizations',
        position: 'left'
      }
    ];
  }

  /**
   * Tour steps for the comparison tools
   */
  static getComparisonTourSteps(): TourStep[] {
    return [
      {
        element: '[data-tour="comparison-header"]',
        intro: 'The Property Comparison section lets you compare multiple properties side by side.',
        title: 'Property Comparison',
        position: 'bottom'
      },
      {
        element: '[data-tour="property-selector"]',
        intro: 'Select properties to include in your comparison analysis.',
        title: 'Property Selection',
        position: 'right'
      },
      {
        element: '[data-tour="comparison-chart"]',
        intro: 'View visual comparisons of key property metrics.',
        title: 'Comparison Charts',
        position: 'top'
      },
      {
        element: '[data-tour="export-comparison"]',
        intro: 'Export your comparison results to PDF or Excel format.',
        title: 'Export Results',
        position: 'left'
      }
    ];
  }

  /**
   * Tour steps for the reporting section
   */
  static getReportingTourSteps(): TourStep[] {
    return [
      {
        element: '[data-tour="reporting-header"]',
        intro: 'The Reporting section allows you to generate customized reports for various purposes.',
        title: 'Custom Reports',
        position: 'bottom'
      },
      {
        element: '[data-tour="report-templates"]',
        intro: 'Choose from different report templates designed for specific use cases.',
        title: 'Report Templates',
        position: 'right'
      },
      {
        element: '[data-tour="report-customization"]',
        intro: 'Customize your reports by selecting sections, charts, and data to include.',
        title: 'Customization Options',
        position: 'top'
      },
      {
        element: '[data-tour="schedule-reports"]',
        intro: 'Schedule reports to be generated and sent automatically on a recurring basis.',
        title: 'Scheduled Reports',
        position: 'left'
      }
    ];
  }
}

export default TourStepsService;