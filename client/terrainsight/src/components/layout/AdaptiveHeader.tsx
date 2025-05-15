import React, { useState } from 'react';
import { Header } from '../Header';
import { useAppMode } from '../../contexts/AppModeContext';
import { AnimatedBadge } from '../ui/design-system';
import { Activity, Building, Info, Layers, Settings } from 'lucide-react';
import { Link } from 'wouter';

interface AdaptiveHeaderProps {
  taxYear: string;
  onTaxYearChange: (year: string) => void;
}

/**
 * AdaptiveHeader component that renders the appropriate header based on app mode
 * Shows the full header in standalone mode, and a minimal header in integrated mode
 */
export const AdaptiveHeader: React.FC<AdaptiveHeaderProps> = ({ 
  taxYear, 
  onTaxYearChange 
}) => {
  const { config, mode, isStandalone } = useAppMode();
  const [showIntegrationInfo, setShowIntegrationInfo] = useState(false);
  
  // In integrated mode with header hidden, just render nothing
  if (!isStandalone && !config.showHeader) {
    return null;
  }
  
  // In standalone mode, render the full header
  if (isStandalone) {
    return <Header taxYear={taxYear} onTaxYearChange={onTaxYearChange} />;
  }
  
  // In integrated mode with header visible, render a minimal header
  return (
    <header className="bg-white text-gray-900 border-b border-neutral-200 px-4 py-2 flex justify-between items-center h-14">
      <div className="flex items-center">
        <Link href="/dashboard">
          <div className="mr-6 flex items-center cursor-pointer">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 mr-2">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-gray-900">GeospatialAnalyzerBS</span>
          </div>
        </Link>
        
        <AnimatedBadge
          text="Integrated Mode"
          color="purple"
          className="ml-2"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Desktop Review Link */}
        <Link href="/desktop-review">
          <button className="text-gray-500 hover:text-primary rounded-full p-1.5 hover:bg-gray-100 transition-colors">
            <Building className="h-4 w-4" />
          </button>
        </Link>
        
        {/* Integration info button */}
        <button
          className="text-gray-500 hover:text-primary rounded-full p-1.5 hover:bg-gray-100 transition-colors relative"
          onClick={() => setShowIntegrationInfo(!showIntegrationInfo)}
          aria-label="Integration information"
        >
          <Info className="h-4 w-4" />
        </button>
        
        {/* Integration settings button */}
        <Link href="/settings">
          <button className="text-gray-500 hover:text-primary rounded-full p-1.5 hover:bg-gray-100 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </Link>
        
        {/* System activity indicator */}
        <div className="text-gray-500 hover:text-primary rounded-full p-1.5 hover:bg-gray-100 transition-colors">
          <Activity className="h-4 w-4" />
        </div>
      </div>
      
      {/* Integration info popover */}
      {showIntegrationInfo && (
        <div className="absolute right-4 top-14 mt-1 z-50 w-80 bg-white rounded-md shadow-lg border border-gray-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900">Integration Details</h3>
            <button 
              onClick={() => setShowIntegrationInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="text-xs space-y-2 text-gray-600">
            <p><span className="font-medium">Mode:</span> {mode}</p>
            <p><span className="font-medium">Parent System:</span> {config.parentSystem || 'Not specified'}</p>
            <p><span className="font-medium">Integration ID:</span> {config.integrationId || 'Not specified'}</p>
            <p><span className="font-medium">Theme:</span> {config.theme}</p>
            <div className="text-xs mt-2 p-2 bg-gray-50 rounded border border-gray-100">
              <p className="text-gray-500">This module is currently running in integrated mode within a parent application.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};