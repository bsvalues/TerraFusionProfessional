import React, { useRef, useEffect, useCallback } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

// Polyfill for missing properties in Property if needed
type PropertyWithOptionalFields = Omit<Property, 'propertyType'> & {
  propertyType?: string | null;
};

export interface AccessiblePropertyMarkerProps {
  property: PropertyWithOptionalFields;
  coordinates: [number, number];
  isSelected: boolean;
  isHovered?: boolean;
  onClick: (property: PropertyWithOptionalFields) => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
  markerType?: 'default' | 'cluster' | 'heatmap';
  focusable?: boolean;
  markerRef?: React.RefObject<L.Marker>;
}

// Helper function to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex color
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.min(255, Math.max(0, r + percent));
  g = Math.min(255, Math.max(0, g + percent));
  b = Math.min(255, Math.max(0, b + percent));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Create a 3D marker icon
const create3DIcon = (propertyType: string, isSelected: boolean): L.DivIcon => {
  // Use high contrast colors with proper WCAG compliance
  const getColorByPropertyType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'residential':
        return '#2E8540'; // Green with good contrast
      case 'commercial':
        return '#0071BC'; // Blue with good contrast
      case 'industrial': 
        return '#D83933'; // Red with good contrast
      case 'agricultural':
        return '#FDB81E'; // Amber with good contrast
      default:
        return '#4773AA'; // Default blue with good contrast
    }
  };
  
  const baseColor = getColorByPropertyType(propertyType);
  const darkColor = adjustColor(baseColor, -30); // Darker shade for 3D effect
  const size = isSelected ? 30 : 26; // Larger when selected for better visibility
  
  return L.divIcon({
    className: 'accessible-property-marker-3d property-marker-enhanced map-3d-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
      ">
        <!-- Main marker -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, ${baseColor}, ${darkColor});
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        "
        role="img" 
        aria-label="${propertyType} property${isSelected ? ' (selected)' : ''}">
          ${isSelected ? '<span style="color: white; font-weight: bold; font-size: 16px; position: relative; z-index: 20;">✓</span>' : ''}
        </div>
        
        <!-- Shadow effect -->
        <div style="
          position: absolute;
          bottom: -4px;
          left: 2px;
          width: 90%;
          height: 10%;
          background: rgba(0,0,0,0.3);
          border-radius: 50%;
          filter: blur(2px);
          z-index: 5;
        "></div>
        
        <!-- Top highlight for 3D effect -->
        <div style="
          position: absolute;
          top: 4px;
          left: 4px;
          width: 35%;
          height: 35%;
          background: rgba(255,255,255,0.7);
          border-radius: 50%;
          z-index: 15;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -(size/2)]
  });
};

// Create a pulsing marker for selected property
const createPulsingIcon = (propertyType: string): L.DivIcon => {
  // Use high contrast colors with proper WCAG compliance
  const getColorByPropertyType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'residential':
        return '#2E8540'; // Green with good contrast
      case 'commercial':
        return '#0071BC'; // Blue with good contrast
      case 'industrial': 
        return '#D83933'; // Red with good contrast
      case 'agricultural':
        return '#FDB81E'; // Amber with good contrast
      default:
        return '#ec4899'; // Pink for selected (default)
    }
  };
  
  const color = getColorByPropertyType(propertyType);
  const size = 32; // Larger for selected properties
  
  return L.divIcon({
    className: 'accessible-property-marker-pulsing property-marker-enhanced',
    html: `
      <div class="pulsing-marker-container" style="position: relative;">
        <div style="
          background-color: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 0 15px rgba(0,0,0,0.4);
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        "
        role="img" 
        aria-label="${propertyType} property (selected)">
          <span style="color: white; font-weight: bold; font-size: 18px; position: relative; z-index: 20;">✓</span>
        </div>
        <div class="pulse-effect" style="
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.4;
          z-index: 1;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -(size/2)]
  });
};

// Helper function to create an accessible icon with proper contrast (original basic version)
const createAccessibleIcon = (propertyType: string, isSelected: boolean): L.DivIcon => {
  // Use high contrast colors with proper WCAG compliance
  const getColorByPropertyType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'residential':
        return '#2E8540'; // Green with good contrast
      case 'commercial':
        return '#0071BC'; // Blue with good contrast
      case 'industrial': 
        return '#D83933'; // Red with good contrast
      case 'agricultural':
        return '#FDB81E'; // Amber with good contrast
      default:
        return '#4773AA'; // Default blue with good contrast
    }
  };
  
  const color = getColorByPropertyType(propertyType);
  const selectedBorder = isSelected ? '3px solid #212121' : '2px solid white';
  const selectedSize = isSelected ? 26 : 22; // Larger when selected for better visibility
  
  return L.divIcon({
    className: 'accessible-property-marker',
    html: `
      <div 
        style="
          background-color: ${color}; 
          width: ${selectedSize}px; 
          height: ${selectedSize}px; 
          border-radius: 50%; 
          border: ${selectedBorder}; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        "
        role="img" 
        aria-label="${propertyType} property${isSelected ? ' (selected)' : ''}"
      >
        ${isSelected ? '<span style="color: white; font-weight: bold; font-size: 14px;">✓</span>' : ''}
      </div>
    `,
    iconSize: [selectedSize, selectedSize],
    iconAnchor: [selectedSize/2, selectedSize/2],
    popupAnchor: [0, -(selectedSize/2)]
  });
};

export const AccessiblePropertyMarker: React.FC<AccessiblePropertyMarkerProps> = ({
  property,
  coordinates,
  isSelected,
  isHovered,
  onClick,
  onMouseOver,
  onMouseOut,
  markerType = 'default',
  focusable = true,
  markerRef
}) => {
  const map = useMap();
  const localMarkerRef = useRef<L.Marker>(null);
  const actualMarkerRef = markerRef || localMarkerRef;
  const propertyType = property.propertyType || 'residential';
  
  // Make marker keyboard-focusable
  useEffect(() => {
    if (actualMarkerRef.current && focusable) {
      const marker = actualMarkerRef.current;
      
      // Add tabindex to make marker focusable
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.setAttribute('tabindex', '0');
        markerElement.setAttribute('role', 'button');
        markerElement.setAttribute('aria-label', 
          `${propertyType} property at ${property.address}. Value: ${formatCurrency(property.value || 0)}${isSelected ? '. Currently selected' : ''}`
        );
        
        // Create named handler functions for proper cleanup
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(property);
            marker.openPopup();
          }
        };
        
        const handleFocus = () => {
          markerElement.style.outline = '3px solid #4773AA';
          markerElement.style.outlineOffset = '2px';
        };
        
        const handleBlur = () => {
          markerElement.style.outline = 'none';
        };
        
        // Add keyboard event listener for Enter/Space to activate marker
        markerElement.addEventListener('keydown', handleKeyDown);
        
        // Add focus styles
        markerElement.addEventListener('focus', handleFocus);
        markerElement.addEventListener('blur', handleBlur);
        
        // Cleanup function to remove event listeners
        return () => {
          if (markerElement) {
            markerElement.removeEventListener('keydown', handleKeyDown);
            markerElement.removeEventListener('focus', handleFocus);
            markerElement.removeEventListener('blur', handleBlur);
          }
        };
      }
    }
  }, [property, isSelected, propertyType, onClick, focusable]);
  
  // If the marker is selected, ensure proper focus management
  useEffect(() => {
    if (isSelected && actualMarkerRef.current) {
      const markerElement = actualMarkerRef.current.getElement();
      if (markerElement) {
        markerElement.setAttribute('aria-expanded', 'true');
      }
    }
  }, [isSelected]);
  
  // Apply additional styling for hovered state
  useEffect(() => {
    if (!actualMarkerRef.current) return;
    
    const marker = actualMarkerRef.current;
    const markerElement = marker.getElement();
    if (!markerElement) return;
    
    const markerDiv = markerElement.querySelector('div');
    if (!markerDiv) return;
    
    // Apply appropriate styling based on hover state
    if (isHovered) {
      markerDiv.style.transform = 'scale(1.1)';
      markerDiv.style.transition = 'transform 0.2s ease-in-out';
    } else {
      markerDiv.style.transform = 'scale(1)';
    }
    
    // No need for explicit cleanup as React will handle this 
    // when the component unmounts or when dependencies change
  }, [isHovered, actualMarkerRef]);
  
  // Different marker styling based on marker type
  const getIcon = () => {
    // If selected, use the pulsing icon regardless of marker type
    if (isSelected) {
      return createPulsingIcon(propertyType);
    }
    
    switch (markerType) {
      case 'cluster':
        return createClusterIcon(propertyType, isSelected);
      case 'heatmap':
        return createHeatmapIcon(propertyType, isSelected);
      default:
        // Use enhanced 3D icons for default markers
        return create3DIcon(propertyType, isSelected);
    }
  };
  
  // Memoize event handlers to maintain consistent references
  const handleClick = useCallback(() => {
    onClick(property);
  }, [onClick, property]);
  
  const handleKeyPress = useCallback((e: L.LeafletKeyboardEvent) => {
    if (e.originalEvent.key === 'Enter') {
      onClick(property);
    }
  }, [onClick, property]);
  
  // Create stable handler references for mouseover/mouseout
  const handleMouseOver = useCallback(() => {
    if (onMouseOver) onMouseOver();
  }, [onMouseOver]);
  
  const handleMouseOut = useCallback(() => {
    if (onMouseOut) onMouseOut();
  }, [onMouseOut]);
  
  return (
    <Marker
      ref={actualMarkerRef}
      position={[Number(coordinates[0]), Number(coordinates[1])]}
      icon={getIcon()}
      eventHandlers={{
        click: handleClick,
        keypress: handleKeyPress,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
      }}
    >
      <Popup>
        <div 
          className="property-popup"
          role="dialog"
          aria-label={`Property information for ${property.address}`}
        >
          <h3 className="font-semibold text-lg" id="property-popup-title">{property.address}</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Parcel ID:</span> {property.parcelId}</p>
            <p><span className="font-medium">Value:</span> {formatCurrency(property.value || 0)}</p>
            <p><span className="font-medium">Size:</span> {property.squareFeet?.toLocaleString()} sq ft</p>
            {property.yearBuilt && (
              <p><span className="font-medium">Year Built:</span> {property.yearBuilt}</p>
            )}
            <p><span className="font-medium">Type:</span> {propertyType}</p>
          </div>
          
          {/* Accessible button for selecting the property for analysis */}
          <button
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={handleClick}
            aria-label={`Select ${property.address} for analysis`}
          >
            Select for Analysis
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

// Additional icon types for different map modes
const createClusterIcon = (propertyType: string, isSelected: boolean): L.DivIcon => {
  // Use high contrast colors with proper WCAG compliance
  const getColorByPropertyType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'residential':
        return '#2E8540'; // Green with good contrast
      case 'commercial':
        return '#0071BC'; // Blue with good contrast
      case 'industrial': 
        return '#D83933'; // Red with good contrast
      case 'agricultural':
        return '#FDB81E'; // Amber with good contrast
      default:
        return '#4773AA'; // Default blue with good contrast
    }
  };
  
  const color = getColorByPropertyType(propertyType);
  const selectedSize = isSelected ? 32 : 28; // Larger for cluster markers
  
  return L.divIcon({
    className: 'accessible-property-cluster-marker',
    html: `
      <div 
        style="
          background-color: ${color}; 
          width: ${selectedSize}px; 
          height: ${selectedSize}px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 13px;
        "
        role="img" 
        aria-label="${propertyType} property cluster${isSelected ? ' (selected)' : ''}"
      >
        C
      </div>
    `,
    iconSize: [selectedSize, selectedSize],
    iconAnchor: [selectedSize/2, selectedSize/2],
    popupAnchor: [0, -(selectedSize/2)]
  });
};

const createHeatmapIcon = (propertyType: string, isSelected: boolean): L.DivIcon => {
  // Heatmap markers are more transparent
  const getColorByPropertyType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'residential':
        return 'rgba(46, 133, 64, 0.7)'; // Green with transparency
      case 'commercial':
        return 'rgba(0, 113, 188, 0.7)'; // Blue with transparency
      case 'industrial': 
        return 'rgba(216, 57, 51, 0.7)'; // Red with transparency
      case 'agricultural':
        return 'rgba(253, 184, 30, 0.7)'; // Amber with transparency
      default:
        return 'rgba(71, 115, 170, 0.7)'; // Default blue with transparency
    }
  };
  
  const color = getColorByPropertyType(propertyType);
  const selectedSize = isSelected ? 24 : 20; // Smaller for heatmap markers
  
  return L.divIcon({
    className: 'accessible-property-heatmap-marker',
    html: `
      <div 
        style="
          background-color: ${color}; 
          width: ${selectedSize}px; 
          height: ${selectedSize}px; 
          border-radius: 50%; 
          box-shadow: 0 0 8px ${color.replace('0.7', '0.5')};
          display: flex;
          align-items: center;
          justify-content: center;
          filter: blur(1px);
        "
        role="img" 
        aria-label="${propertyType} property heatmap point${isSelected ? ' (selected)' : ''}"
      >
      </div>
    `,
    iconSize: [selectedSize, selectedSize],
    iconAnchor: [selectedSize/2, selectedSize/2],
    popupAnchor: [0, -(selectedSize/2)]
  });
};