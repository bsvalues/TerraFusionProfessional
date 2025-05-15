import React, { createContext, useContext, useState, useEffect } from 'react';

// App mode configuration type
interface AppModeConfig {
  integratedMode: boolean;
  supportPackageVersion?: string;
  standalone: {
    features: {
      dataImport: boolean;
      mapLayers: boolean;
      spatialAnalysis: boolean;
      reporting: boolean;
      valuation: boolean;
    };
  };
}

// Context interface
interface AppModeContextProps {
  isStandalone: boolean;
  config: AppModeConfig;
  toggleMode: () => void;
}

// Default configuration
const defaultConfig: AppModeConfig = {
  integratedMode: false,
  supportPackageVersion: '1.2.3',
  standalone: {
    features: {
      dataImport: true,
      mapLayers: true,
      spatialAnalysis: true,
      reporting: true,
      valuation: true,
    }
  }
};

// Create context with default values
const AppModeContext = createContext<AppModeContextProps>({
  isStandalone: true,
  config: defaultConfig,
  toggleMode: () => {},
});

// Hook for using the app mode context
export const useAppMode = () => useContext(AppModeContext);

// Provider component
export const AppModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStandalone, setIsStandalone] = useState<boolean>(true);
  const [config, setConfig] = useState<AppModeConfig>(defaultConfig);

  // Function to toggle between standalone and integrated modes
  const toggleMode = () => {
    setIsStandalone(prev => !prev);
    // In a real application, this would likely involve setting config values from an API
  };

  // Fetch configuration on initial load
  useEffect(() => {
    // In a real app, this would fetch from an API endpoint
    const loadConfig = async () => {
      try {
        // Simulating API call
        // const response = await fetch('/api/app-configuration');
        // const data = await response.json();
        // setConfig(data);
        
        // For now, just use the default config
        setConfig(defaultConfig);
      } catch (error) {
        console.error('Failed to load app configuration:', error);
        // Fallback to default config
        setConfig(defaultConfig);
      }
    };

    loadConfig();
  }, []);

  return (
    <AppModeContext.Provider value={{ isStandalone, config, toggleMode }}>
      {children}
    </AppModeContext.Provider>
  );
};