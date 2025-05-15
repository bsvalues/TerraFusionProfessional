import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { SunMoon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighContrastModeToggleProps {
  className?: string;
}

/**
 * Component to add high contrast mode toggle for map accessibility
 * Applies high contrast styles to the map container and its elements
 */
export const HighContrastModeToggle: React.FC<HighContrastModeToggleProps> = ({
  className
}) => {
  const map = useMap();
  const [highContrastMode, setHighContrastMode] = useState(false);
  
  // Add high contrast mode styles
  useEffect(() => {
    const mapContainer = map.getContainer();
    
    if (highContrastMode) {
      // Apply high contrast styles to the map
      mapContainer.classList.add('high-contrast-map');
      
      // Add CSS styles to head if not already present
      const styleId = 'high-contrast-map-styles';
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.innerHTML = `
          .high-contrast-map {
            filter: contrast(1.4);
          }
          
          .high-contrast-map .leaflet-tile {
            filter: saturate(0.7) contrast(1.2);
          }
          
          .high-contrast-map .leaflet-marker-icon {
            box-shadow: 0 0 0 3px #fff, 0 0 0 5px #000 !important;
          }
          
          .high-contrast-map .accessible-property-marker div {
            border: 3px solid #000 !important;
          }
          
          .high-contrast-map .leaflet-popup-content-wrapper {
            background: #fff !important;
            color: #000 !important;
            border: 3px solid #000 !important;
          }
          
          .high-contrast-map .leaflet-popup-tip {
            background: #000 !important;
          }
          
          .high-contrast-map .leaflet-control-zoom a,
          .high-contrast-map .leaflet-control-layers-toggle,
          .high-contrast-map .leaflet-control-attribution {
            background: #fff !important;
            color: #000 !important;
            border: 2px solid #000 !important;
          }
          
          .high-contrast-map .property-popup h3 {
            color: #000 !important;
            border-bottom: 2px solid #000 !important;
          }
          
          .high-contrast-map .property-popup p {
            color: #000 !important;
          }
          
          .high-contrast-map .property-popup button {
            background: #000 !important;
            color: #fff !important;
            border: 2px solid #fff !important;
            font-weight: bold !important;
          }
        `;
        document.head.appendChild(styleElement);
      }
    } else {
      // Remove high contrast styles
      mapContainer.classList.remove('high-contrast-map');
    }
    
    return () => {
      mapContainer.classList.remove('high-contrast-map');
    };
  }, [highContrastMode, map]);
  
  // Toggle high contrast mode
  const toggleHighContrastMode = () => {
    setHighContrastMode(prev => !prev);
    
    // Announce to screen readers
    const announceEl = document.getElementById('map-announcements');
    if (announceEl) {
      announceEl.textContent = highContrastMode ? 
        'High contrast mode turned off' : 
        'High contrast mode turned on';
    }
  };
  
  return (
    <button 
      onClick={toggleHighContrastMode}
      className={cn(
        "flex items-center justify-center h-10 w-10 bg-white rounded-md shadow-md hover:bg-gray-100",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors",
        highContrastMode && "bg-black text-white hover:bg-gray-800",
        className
      )}
      aria-label={highContrastMode ? "Disable high contrast mode" : "Enable high contrast mode"}
      aria-pressed={highContrastMode}
      title={highContrastMode ? "Disable high contrast mode" : "Enable high contrast mode"}
    >
      <SunMoon className="h-6 w-6" />
    </button>
  );
};