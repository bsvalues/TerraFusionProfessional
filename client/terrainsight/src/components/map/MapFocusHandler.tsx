import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface MapFocusHandlerProps {
  onEscape?: () => void;
}

const MapFocusHandler: React.FC<MapFocusHandlerProps> = ({ onEscape }) => {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Get the map container
    const mapContainer = map.getContainer();
    if (!mapContainer) return;

    // Create a trap container for focus management
    const trapContainer = document.createElement('div');
    trapContainer.tabIndex = -1; // Make focusable but not in tab order
    trapContainer.className = 'sr-only leaflet-focus-trap';
    trapContainer.setAttribute('aria-hidden', 'true');
    
    // Instructions for screen reader users
    trapContainer.innerHTML = `
      <div role="status">
        Map navigation mode. Use arrow keys to pan, plus and minus to zoom.
        Press Tab to access map controls, or Escape to exit map focus.
      </div>
    `;
    
    mapContainer.appendChild(trapContainer);
    containerRef.current = trapContainer;

    // Allow map to receive keyboard focus
    mapContainer.tabIndex = 0;
    mapContainer.setAttribute('role', 'application');
    mapContainer.setAttribute('aria-label', 'Interactive map');
    
    // Add keyboard instructions
    const keyboardInstructions = document.createElement('span');
    keyboardInstructions.className = 'sr-only';
    keyboardInstructions.innerHTML = 'Use arrow keys to pan and +/- to zoom';
    mapContainer.appendChild(keyboardInstructions);

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Map container or controls are focused
      if (document.activeElement === mapContainer || 
          mapContainer.contains(document.activeElement)) {
        
        const panAmount = 100; // pixels
        
        switch (e.key) {
          case 'Escape':
            // Exit map focus
            if (onEscape) {
              onEscape();
              e.preventDefault();
            }
            break;
          
          // Handle arrow keys for panning
          case 'ArrowUp':
            map.panBy([0, -panAmount]);
            e.preventDefault();
            break;
          case 'ArrowDown':
            map.panBy([0, panAmount]);
            e.preventDefault();
            break;
          case 'ArrowLeft':
            map.panBy([-panAmount, 0]);
            e.preventDefault();
            break;
          case 'ArrowRight':
            map.panBy([panAmount, 0]);
            e.preventDefault();
            break;
            
          // Announcement for screen readers
          case 'a':
            // Announce current position
            const center = map.getCenter();
            const zoom = map.getZoom();
            
            // Create an announcement element
            const announcement = document.createElement('div');
            announcement.className = 'sr-only';
            announcement.setAttribute('aria-live', 'assertive');
            announcement.innerHTML = `Current map center: Latitude ${center.lat.toFixed(4)}, 
              Longitude ${center.lng.toFixed(4)}. Zoom level: ${zoom}.`;
            
            // Add to the DOM temporarily
            document.body.appendChild(announcement);
            
            // Remove after announcement
            setTimeout(() => {
              document.body.removeChild(announcement);
            }, 5000);
            
            e.preventDefault();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Function to handle when map receives focus
    const handleMapFocus = () => {
      // Create an announcement when map receives focus
      const focusAnnouncement = document.createElement('div');
      focusAnnouncement.className = 'sr-only';
      focusAnnouncement.setAttribute('aria-live', 'assertive');
      focusAnnouncement.innerHTML = 'Map focused. Use arrow keys to pan, plus and minus to zoom, or press A for the current position.';
      
      document.body.appendChild(focusAnnouncement);
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(focusAnnouncement);
      }, 3000);
    };

    mapContainer.addEventListener('focus', handleMapFocus);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      mapContainer.removeEventListener('focus', handleMapFocus);
      
      if (containerRef.current && mapContainer.contains(containerRef.current)) {
        mapContainer.removeChild(containerRef.current);
      }
      
      // Remove keyboard instructions
      if (keyboardInstructions && mapContainer.contains(keyboardInstructions)) {
        mapContainer.removeChild(keyboardInstructions);
      }
    };
  }, [map, onEscape]);

  return null; // This component doesn't render anything visible
};

export default MapFocusHandler;