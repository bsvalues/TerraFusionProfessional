import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapKeyboardHandlerProps {
  enabled?: boolean;
  panDistance?: number;
  announceChanges?: boolean;
  skipNavigation?: boolean;
}

/**
 * Component to handle keyboard navigation for the map, making it accessible.
 * Adds keyboard controls for panning, zooming, and other map interactions.
 */
export const MapKeyboardHandler: React.FC<MapKeyboardHandlerProps> = ({
  enabled = true,
  panDistance = 50,
  announceChanges = true,
  skipNavigation = true
}) => {
  const map = useMap();
  const announcementRef = useRef<HTMLDivElement | null>(null);
  
  // Add skip-to-content link
  useEffect(() => {
    if (!skipNavigation) return;
    
    // Create skip link if it doesn't exist
    const existingSkipLink = document.getElementById('map-skip-nav');
    if (!existingSkipLink) {
      const skipLink = document.createElement('a');
      skipLink.id = 'map-skip-nav';
      skipLink.href = '#';
      skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:z-[2000] focus:top-4 focus:left-4 focus:p-4 focus:bg-white focus:text-blue-700 focus:shadow-lg focus:rounded-md';
      skipLink.textContent = 'Skip map navigation';
      
      const mapContainer = map.getContainer();
      if (mapContainer.parentElement) {
        mapContainer.parentElement.insertBefore(skipLink, mapContainer);
      }
      
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Find the next focusable element after the map
        const mapElement = map.getContainer();
        const allFocusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        let found = false;
        let targetElement: Element | null = null;
        
        for (let i = 0; i < allFocusableElements.length; i++) {
          if (found) {
            targetElement = allFocusableElements[i];
            break;
          }
          
          if (allFocusableElements[i].contains(mapElement)) {
            found = true;
          }
        }
        
        // Focus the next element or a fallback
        if (targetElement && targetElement instanceof HTMLElement) {
          targetElement.focus();
        } else {
          // If no next element, find a good fallback
          const mainContent = document.querySelector('main') || document.querySelector('#root');
          if (mainContent instanceof HTMLElement) {
            mainContent.setAttribute('tabindex', '-1');
            mainContent.focus();
            mainContent.removeAttribute('tabindex');
          }
        }
      });
    }
    
    return () => {
      const skipLink = document.getElementById('map-skip-nav');
      if (skipLink) {
        skipLink.remove();
      }
    };
  }, [map, skipNavigation]);
  
  // Create a screen reader announcement element
  useEffect(() => {
    if (!announceChanges) return;
    
    // Create live region if it doesn't exist
    let liveRegion = document.getElementById('map-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'map-announcements';
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }
    
    announcementRef.current = liveRegion as HTMLDivElement;
    
    return () => {
      if (liveRegion) {
        liveRegion.remove();
      }
    };
  }, [announceChanges]);
  
  // Announce map changes to screen readers
  const announceToScreenReader = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };
  
  // Set up keyboard event listeners
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation when map is focused or document is active
      const mapElement = map.getContainer();
      const activeElement = document.activeElement;
      
      // Check if we're focused on the map or an element inside it
      const isMapFocused = mapElement === activeElement || mapElement.contains(activeElement);
      
      // Also allow keyboard navigation when focused on the document body
      const isBodyFocused = activeElement === document.body;
      
      if (!isMapFocused && !isBodyFocused) {
        return;
      }
      
      switch (e.code) {
        case 'ArrowUp':
          e.preventDefault();
          map.panBy([0, -panDistance]);
          if (announceChanges) announceToScreenReader('Map panned up');
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          map.panBy([0, panDistance]);
          if (announceChanges) announceToScreenReader('Map panned down');
          break;
          
        case 'ArrowLeft':
          e.preventDefault();
          map.panBy([-panDistance, 0]);
          if (announceChanges) announceToScreenReader('Map panned left');
          break;
          
        case 'ArrowRight':
          e.preventDefault();
          map.panBy([panDistance, 0]);
          if (announceChanges) announceToScreenReader('Map panned right');
          break;
          
        case 'Equal':
        case 'NumpadAdd':
          if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            map.zoomIn();
            if (announceChanges) announceToScreenReader(`Map zoomed in to level ${map.getZoom()}`);
          }
          break;
          
        case 'Minus':
        case 'NumpadSubtract':
          if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            map.zoomOut();
            if (announceChanges) announceToScreenReader(`Map zoomed out to level ${map.getZoom()}`);
          }
          break;
          
        case 'Home':
          e.preventDefault();
          // Reset to initial view
          map.setView([46.2, -119.15], 12); // Default Benton County center
          if (announceChanges) announceToScreenReader('Map view reset to default');
          break;
          
        case 'KeyF':
          if (e.ctrlKey || e.metaKey) {
            // Don't override browser's find functionality
            return;
          }
          
          if (document.activeElement === document.body) {
            e.preventDefault();
            // Focus the first marker if any
            const firstMarker = mapElement.querySelector('.leaflet-marker-icon');
            if (firstMarker instanceof HTMLElement) {
              firstMarker.focus();
              if (announceChanges) announceToScreenReader('Focused on first map marker');
            }
          }
          break;
          
        case 'KeyM':
          if (document.activeElement === document.body) {
            e.preventDefault();
            // Focus the map element itself
            mapElement.focus();
            if (announceChanges) announceToScreenReader('Map focused');
          }
          break;
          
        default:
          break;
      }
    };
    
    // Add keyboard event handlers
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, map, panDistance, announceChanges]);
  
  return null; // This is a utility component, no visible UI
};