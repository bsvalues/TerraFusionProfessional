import React from 'react';
import { useMap } from 'react-leaflet';
import { MapAccessibilityProvider, useMapAccessibility } from '@/contexts/MapAccessibilityContext';
import { AccessibleMapControls } from './AccessibleMapControls';
import { MapKeyboardHandler } from './MapKeyboardHandler';
import { HighContrastModeToggle } from './HighContrastModeToggle';
import { AccessibilitySettingsPanel } from './AccessibilitySettingsPanel';

interface AccessibleMapComponentsProps {
  defaultCenter: [number, number];
  defaultZoom: number;
  enablePanControls?: boolean;
  enableKeyboardHandler?: boolean;
  enableHighContrastToggle?: boolean;
  enableAccessibilitySettings?: boolean;
}

/**
 * Internal component that uses the map accessibility context
 */
const AccessibleMapComponentsInner: React.FC<AccessibleMapComponentsProps> = ({
  defaultCenter,
  defaultZoom,
  enablePanControls = true,
  enableKeyboardHandler = true,
  enableHighContrastToggle = true,
  enableAccessibilitySettings = true
}) => {
  const map = useMap();
  const {
    keyboardNavigation,
    screenReaderAnnouncements,
    reducedMotion
  } = useMapAccessibility();
  
  // Config for the map instance based on accessibility settings
  React.useEffect(() => {
    if (!map) return;
    
    if (reducedMotion) {
      // Disable animations
      map.options.zoomAnimation = false;
      map.options.fadeAnimation = false;
      map.options.markerZoomAnimation = false;
    } else {
      // Re-enable animations
      map.options.zoomAnimation = true;
      map.options.fadeAnimation = true;
      map.options.markerZoomAnimation = true;
    }
  }, [map, reducedMotion]);
  
  return (
    <>
      {/* Core accessibility controls */}
      <AccessibleMapControls 
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        enablePanControls={enablePanControls}
      />
      
      {/* Keyboard navigation handler */}
      {enableKeyboardHandler && keyboardNavigation && (
        <MapKeyboardHandler 
          enabled={keyboardNavigation}
          announceChanges={screenReaderAnnouncements}
        />
      )}
      
      {/* High contrast mode toggle - positioned at top-right */}
      {enableHighContrastToggle && (
        <HighContrastModeToggle 
          className="absolute top-2 right-2 z-[1000]"
        />
      )}
      
      {/* Accessibility settings panel - positioned at top-right, below high contrast toggle */}
      {enableAccessibilitySettings && (
        <AccessibilitySettingsPanel 
          className="absolute top-14 right-2 z-[1000]"
        />
      )}
    </>
  );
};

/**
 * Wrapper component that provides the accessibility context
 */
export const AccessibleMapComponents: React.FC<AccessibleMapComponentsProps> = (props) => {
  return (
    <MapAccessibilityProvider>
      <AccessibleMapComponentsInner {...props} />
    </MapAccessibilityProvider>
  );
};