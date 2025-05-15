import React, { useState } from 'react';
import { 
  HelpCircle, 
  Bell, 
  Map, 
  Database, 
  Calculator, 
  Building, 
  FileText,
  Accessibility,
  TrendingUp,
  Home,
  Code,
  Settings,
  Globe,
  Menu,
  X,
  ChevronDown,
  Brain,
  LineChart,
  BarChart3,
  Layers
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useMapAccessibility } from '@/contexts/MapAccessibilityContext';
import { useToast } from '@/hooks/use-toast';
import { TourButton } from './TourButton';
import { useTour } from '@/contexts/TourContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  taxYear: string;
  onTaxYearChange: (year: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ taxYear, onTaxYearChange }) => {
  const availableYears = ['2023', '2024', '2025'];
  const [currentLocation] = useLocation();
  const { 
    highContrastMode, 
    toggleHighContrastMode,
    keyboardNavigation,
    toggleKeyboardNavigation,
    screenReaderAnnouncements,
    toggleScreenReaderAnnouncements,
    reducedMotion,
    toggleReducedMotion,
    fontSizeScale,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize
  } = useMapAccessibility();
  const { toast } = useToast();
  
  // State for accessibility dialog
  const [isAccessibilityDialogOpen, setIsAccessibilityDialogOpen] = React.useState(false);
  
  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Set up the guided tour
  const { startTour, hasSeenTour } = useTour();
  
  const handleAccessibilityToggle = (setting: string) => {
    switch (setting) {
      case 'highContrast':
        toggleHighContrastMode();
        toast({
          title: `High contrast mode ${highContrastMode ? 'disabled' : 'enabled'}`,
          description: `Map display is now in ${highContrastMode ? 'standard' : 'high contrast'} mode`,
        });
        break;
      case 'keyboard':
        toggleKeyboardNavigation();
        toast({
          title: `Keyboard navigation ${keyboardNavigation ? 'disabled' : 'enabled'}`,
          description: `You can ${keyboardNavigation ? 'no longer' : 'now'} navigate the map using arrow keys`,
        });
        break;
      case 'screenReader':
        toggleScreenReaderAnnouncements();
        toast({
          title: `Screen reader support ${screenReaderAnnouncements ? 'disabled' : 'enabled'}`,
          description: `Screen reader annotations are now ${screenReaderAnnouncements ? 'disabled' : 'enabled'}`,
        });
        break;
      case 'reducedMotion':
        toggleReducedMotion();
        toast({
          title: `Reduced motion ${reducedMotion ? 'disabled' : 'enabled'}`,
          description: `Map animations are now ${reducedMotion ? 'enabled' : 'disabled'}`,
        });
        break;
    }
  };
  
  return (
    <header className="relative bg-white text-gray-900 border-b border-neutral-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <div className="flex items-center">
          <div className="terrainsight-logo h-10 flex items-center mr-3">
            <Globe className="h-7 w-7 text-primary mr-2" />
            <div className="flex flex-col">
              <h1 className="text-lg font-medium tracking-tight text-gray-900">
                <span className="prefix">Terra</span><span className="name">Insight</span>
              </h1>
              <span className="text-sm text-gray-600 font-light">Benton County Property Assessment</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Mobile menu toggle button */}
        <button
          className="md:hidden text-gray-700 hover:text-primary p-1.5 rounded-full hover:bg-gray-200/50 transition-all duration-200"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        
        {/* Desktop navigation - more minimal and organized */}
        <div className="hidden md:flex items-center space-x-2 text-gray-700">
          {/* Core functionality group */}
          <div className="flex items-center space-x-1 border-r border-neutral-200 pr-2">
            <Link href="/properties">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/properties" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <Building className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Properties</span>
              </div>
            </Link>
            <Link href="/analysis">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/analysis" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <Calculator className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Analysis</span>
              </div>
            </Link>
            <Link href="/reports">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/reports" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <FileText className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Reports</span>
              </div>
            </Link>
            <Link href="/property-value-trends">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/property-value-trends" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <TrendingUp className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Value Trends</span>
              </div>
            </Link>
          </div>
          
          {/* Geographic group */}
          <div className="flex items-center space-x-1 border-r border-neutral-200 pr-2">
            <Link href="/layers">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/layers" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <Map className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Map</span>
              </div>
            </Link>
            <Link href="/neighborhoods">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/neighborhoods" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <Home className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Areas</span>
              </div>
            </Link>
            <Link href="/neighborhood-data">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/neighborhood-data" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <BarChart3 className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Area Data</span>
              </div>
            </Link>
            <Link href="/gis-data">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/gis-data" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <Layers className="h-4 w-4 mr-1.5" />
                <span className="text-sm">GIS Data</span>
              </div>
            </Link>
            <Link href="/desktop-review">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/desktop-review" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <Building className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Desktop Review</span>
              </div>
            </Link>
          </div>
          
          {/* Data & Trends group */}
          <div className="flex items-center space-x-1">
            <Link href="/data">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/data" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <Database className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Data</span>
              </div>
            </Link>
            <Link href="/dynamic-data">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/dynamic-data" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <Database className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Dynamic Data</span>
              </div>
            </Link>
            <Link href="/trends">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/trends" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <TrendingUp className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Trends</span>
              </div>
            </Link>
            <Link href="/income-approach">
              <div className={cn(
                "flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 cursor-pointer",
                currentLocation === "/income-approach" ? "bg-primary/10 text-primary font-medium" : ""
              )}>
                <Calculator className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Income</span>
              </div>
            </Link>
          </div>
        </div>
        
        <div className="mr-4 border-r border-gray-200 pr-4 hidden sm:block">
          <label htmlFor="taxYear" className="block text-xs text-gray-600 mb-1">
            Tax Year
          </label>
          <select
            id="taxYear"
            className="bg-white border border-gray-200 rounded-md px-3 py-1 text-sm text-gray-800 focus:ring-2 focus:ring-primary/30 focus:outline-none shadow-sm"
            value={taxYear}
            onChange={(e) => onTaxYearChange(e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year} className="text-gray-800">
                {year}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Accessibility button */}
          <button
            className={`text-gray-700 hover:text-primary p-1.5 rounded-full hover:bg-gray-200/50 transition-all duration-200 ${
              highContrastMode || keyboardNavigation || screenReaderAnnouncements || reducedMotion 
                ? 'bg-primary/10 ring-2 ring-primary/30' 
                : ''
            }`}
            aria-label="Accessibility settings"
            onClick={() => setIsAccessibilityDialogOpen(true)}
            title="Accessibility settings"
          >
            <Accessibility className="h-5 w-5" />
          </button>
          
          {/* Tour Guide Button */}
          <TourButton 
            variant="ghost"
            size="icon"
            className="text-gray-700 hover:text-primary hover:bg-gray-200/50 transition-colors"
            showTooltip={true}
            tooltipContent={hasSeenTour ? 'Restart guided tour' : 'Start guided tour'}
          />
          
          <button
            className="text-gray-700 hover:text-primary p-1.5 rounded-full hover:bg-gray-200/50 transition-all duration-200 relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full shadow-sm"></span>
          </button>
          
          <div className="relative">
            <button
              className="flex items-center group"
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium border-2 border-primary/20 shadow-sm group-hover:border-primary transition-all duration-200">
                AS
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden md:inline">Admin</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white shadow-lg p-5 overflow-y-auto transform transition-transform duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full shadow-sm mr-2">
                  <Map className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-gray-900 module-lockup module-insight">
                  <span className="prefix">Terra</span><span className="name">Insight</span> Menu
                </h2>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-2 mb-6">
              <label htmlFor="mobileTaxYear" className="block text-xs text-gray-600 mb-1">
                Tax Year
              </label>
              <select
                id="mobileTaxYear"
                className="w-full bg-white border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-primary/30 focus:outline-none shadow-sm"
                value={taxYear}
                onChange={(e) => {
                  onTaxYearChange(e.target.value);
                  // Don't close menu on tax year change
                }}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year} className="text-gray-800">
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <nav className="space-y-1">
              <Link href="/layers">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/layers" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Map className="h-5 w-5 mr-3" />
                  <span className="font-medium">Layers</span>
                </div>
              </Link>
              
              <Link href="/data">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/data" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Database className="h-5 w-5 mr-3" />
                  <span className="font-medium">Data</span>
                </div>
              </Link>
              
              <Link href="/dynamic-data">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/dynamic-data" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Database className="h-5 w-5 mr-3" />
                  <span className="font-medium">Dynamic Data</span>
                </div>
              </Link>
              
              <Link href="/gis-data">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/gis-data" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Layers className="h-5 w-5 mr-3" />
                  <span className="font-medium">GIS Data</span>
                </div>
              </Link>
              
              <Link href="/analysis">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/analysis" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Calculator className="h-5 w-5 mr-3" />
                  <span className="font-medium">Analysis</span>
                </div>
              </Link>
              
              <Link href="/properties">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/properties" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Building className="h-5 w-5 mr-3" />
                  <span className="font-medium">Properties</span>
                </div>
              </Link>
              
              <Link href="/reports">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/reports" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FileText className="h-5 w-5 mr-3" />
                  <span className="font-medium">Reports</span>
                </div>
              </Link>
              
              <Link href="/trends">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/trends" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  <span className="font-medium">Trends</span>
                </div>
              </Link>
              
              <Link href="/property-value-trends">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/property-value-trends" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LineChart className="h-5 w-5 mr-3" />
                  <span className="font-medium">Property Value Trends</span>
                </div>
              </Link>
              
              <Link href="/neighborhoods">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/neighborhoods" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5 mr-3" />
                  <span className="font-medium">Neighborhoods</span>
                </div>
              </Link>
              
              <Link href="/neighborhood-data">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/neighborhood-data" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <BarChart3 className="h-5 w-5 mr-3" />
                  <span className="font-medium">Neighborhood Data</span>
                </div>
              </Link>
              
              <Link href="/desktop-review">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/desktop-review" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Building className="h-5 w-5 mr-3" />
                  <span className="font-medium">Desktop Review</span>
                </div>
              </Link>
              
              <Link href="/neighborhood-comparison">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/neighborhood-comparison" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Map className="h-5 w-5 mr-3" />
                  <span className="font-medium">Neighborhood Comparison</span>
                </div>
              </Link>
              
              <Link href="/project-tracker">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/project-tracker" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <TrendingUp className="h-5 w-5 mr-3" />
                  <span className="font-medium">Project Tracker</span>
                </div>
              </Link>
              
              <Link href="/scripting">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/scripting" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Code className="h-5 w-5 mr-3" />
                  <span className="font-medium">Scripting</span>
                </div>
              </Link>
              
              <Link href="/etl">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/etl" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  <span className="font-medium">ETL</span>
                </div>
              </Link>
              
              <Link href="/data-connectors">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/data-connectors" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Globe className="h-5 w-5 mr-3" />
                  <span className="font-medium">Connectors</span>
                </div>
              </Link>
              
              <Link href="/property-data-sources">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/property-data-sources" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Database className="h-5 w-5 mr-3" />
                  <span className="font-medium">Data Sources</span>
                </div>
              </Link>
              
              <Link href="/property-bulk-import">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/property-bulk-import" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FileText className="h-5 w-5 mr-3" />
                  <span className="font-medium">Bulk Property Import</span>
                </div>
              </Link>
              
              <Link href="/ftp-data-migration">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/ftp-data-migration" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Globe className="h-5 w-5 mr-3" />
                  <span className="font-medium">FTP Data Migration</span>
                </div>
              </Link>
              
              <Link href="/prediction">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/prediction" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Brain className="h-5 w-5 mr-3" />
                  <span className="font-medium">AI Prediction</span>
                </div>
              </Link>
              
              <Link href="/income-approach">
                <div 
                  className={cn(
                    "flex items-center rounded-md py-3 px-3 transition-colors",
                    currentLocation === "/income-approach" ? "bg-primary/10 text-primary" : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Calculator className="h-5 w-5 mr-3" />
                  <span className="font-medium">Income Approach</span>
                </div>
              </Link>
            </nav>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <button 
                className="w-full flex items-center justify-center px-4 py-3 bg-primary/10 hover:bg-primary/20 rounded-md text-primary font-medium transition-colors duration-200"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAccessibilityDialogOpen(true);
                }}
              >
                <Accessibility className="h-5 w-5 mr-2" />
                Accessibility Settings
              </button>
              
              <button 
                className="mt-3 w-full flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition-colors duration-200"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  startTour();
                }}
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                Start Guided Tour
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Accessibility Dialog */}
      {isAccessibilityDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm transition-all duration-300">
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-dialog-title"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Accessibility className="h-5 w-5 text-primary" />
                </div>
                <h2 id="accessibility-dialog-title" className="text-xl font-semibold text-gray-800">Accessibility</h2>
              </div>
              <button 
                onClick={() => setIsAccessibilityDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors duration-200"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                  <span className="inline-block p-1 bg-primary/10 rounded-md">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </span>
                  Display Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <label htmlFor="high-contrast" className="text-sm font-medium">High Contrast Mode</label>
                    <button 
                      id="high-contrast"
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${highContrastMode ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('highContrast')}
                      role="switch"
                      aria-checked={highContrastMode}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${highContrastMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <label htmlFor="reduced-motion" className="text-sm font-medium">Reduced Motion</label>
                    <button 
                      id="reduced-motion"
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${reducedMotion ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('reducedMotion')}
                      role="switch"
                      aria-checked={reducedMotion}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${reducedMotion ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="pt-2 bg-white p-3 rounded-lg shadow-sm">
                    <label className="text-sm font-medium">Font Size</label>
                    <div className="flex items-center space-x-3 mt-3">
                      <button
                        onClick={decreaseFontSize}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-3 rounded-lg transition-colors duration-200"
                        aria-label="Decrease font size"
                      >
                        A-
                      </button>
                      <div className="flex-grow text-center">
                        <div className="text-xl font-semibold text-primary">
                          {Math.round(fontSizeScale * 100)}%
                        </div>
                      </div>
                      <button
                        onClick={increaseFontSize}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-3 rounded-lg transition-colors duration-200"
                        aria-label="Increase font size"
                      >
                        A+
                      </button>
                      <button
                        onClick={resetFontSize}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs py-1.5 px-3 rounded-lg transition-colors duration-200"
                        aria-label="Reset font size"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                  <span className="inline-block p-1 bg-primary/10 rounded-md">
                    <Map className="h-4 w-4 text-primary" />
                  </span>
                  Navigation Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <label htmlFor="keyboard-nav" className="text-sm font-medium">Keyboard Navigation</label>
                    <button 
                      id="keyboard-nav"
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${keyboardNavigation ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('keyboard')}
                      role="switch"
                      aria-checked={keyboardNavigation}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${keyboardNavigation ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <label htmlFor="screen-reader" className="text-sm font-medium">Screen Reader Support</label>
                    <button 
                      id="screen-reader"
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${screenReaderAnnouncements ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('screenReader')}
                      role="switch"
                      aria-checked={screenReaderAnnouncements}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${screenReaderAnnouncements ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                  <span className="inline-block p-1 bg-primary/10 rounded-md">
                    <FileText className="h-4 w-4 text-primary" />
                  </span>
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">↑ ↓ ← →</span>
                    <span className="text-gray-700">Pan map</span>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">+</span>
                    <span className="text-gray-500 mx-1">or</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">-</span>
                    <span className="text-gray-700">Zoom in/out</span>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">Tab</span>
                    <span className="text-gray-700">Navigate through properties</span>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">Enter</span>
                    <span className="text-gray-700">Select focused property</span>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">Esc</span>
                    <span className="text-gray-700">Close popups or dialogs</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsAccessibilityDialogOpen(false)}
                className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 shadow-sm transition-colors duration-200 font-medium"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;