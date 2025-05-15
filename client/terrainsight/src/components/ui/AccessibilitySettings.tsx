import React from 'react';
import { useMapAccessibility } from '../../contexts/MapAccessibilityContext';
import { 
  Eye, 
  Keyboard, 
  Volume2, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  MousePointer2, 
  PanelRightClose 
} from 'lucide-react';

/**
 * AccessibilitySettings component provides UI for controlling accessibility features
 */
export function AccessibilitySettings() {
  const {
    highContrastMode,
    toggleHighContrastMode,
    keyboardNavigation,
    toggleKeyboardNavigation,
    screenReaderAnnouncements,
    toggleScreenReaderAnnouncements,
    fontSizeScale,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    reducedMotion,
    toggleReducedMotion
  } = useMapAccessibility();

  return (
    <div className="p-4 bg-white shadow-md rounded-lg border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <MousePointer2 className="h-5 w-5 mr-2 text-primary" />
        Accessibility Settings
      </h2>
      
      <div className="space-y-4">
        {/* High Contrast Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-2 text-gray-600" />
            <span>High Contrast Mode</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={highContrastMode}
              onChange={toggleHighContrastMode}
              aria-label="Toggle high contrast mode"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        {/* Keyboard Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Keyboard className="h-4 w-4 mr-2 text-gray-600" />
            <span>Enhanced Keyboard Navigation</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={keyboardNavigation}
              onChange={toggleKeyboardNavigation}
              aria-label="Toggle keyboard navigation"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        {/* Screen Reader Announcements */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Volume2 className="h-4 w-4 mr-2 text-gray-600" />
            <span>Screen Reader Announcements</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={screenReaderAnnouncements}
              onChange={toggleScreenReaderAnnouncements}
              aria-label="Toggle screen reader announcements"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <PanelRightClose className="h-4 w-4 mr-2 text-gray-600" />
            <span>Reduced Motion</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={reducedMotion}
              onChange={toggleReducedMotion}
              aria-label="Toggle reduced motion"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        {/* Font Size Controls */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Font Size: {Math.round(fontSizeScale * 100)}%</span>
            <button 
              onClick={resetFontSize}
              className="text-primary hover:text-primary/80 text-sm flex items-center"
              aria-label="Reset font size"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={decreaseFontSize}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              aria-label="Decrease font size"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <div className="flex-grow h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-primary rounded-full"
                style={{ width: `${((fontSizeScale - 0.8) / 0.7) * 100}%` }}
              ></div>
            </div>
            
            <button
              onClick={increaseFontSize}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              aria-label="Increase font size"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          These accessibility settings are saved to your browser and will be remembered the next time you visit.
        </div>
      </div>
    </div>
  );
}