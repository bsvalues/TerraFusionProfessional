import React, { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { 
  ZoomIn, 
  ZoomOut, 
  Home, 
  Maximize, 
  Settings, 
  Navigation, 
  ArrowUp, 
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MoveHorizontal,
  Move,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccessibleMapControlsProps {
  defaultCenter: [number, number];
  defaultZoom: number;
  onResetView?: () => void;
  className?: string;
  enableKeyboardShortcuts?: boolean;
  enablePanControls?: boolean;
  ariaLabels?: {
    zoomIn?: string;
    zoomOut?: string;
    resetView?: string;
    openSettings?: string;
    panUp?: string;
    panDown?: string;
    panLeft?: string;
    panRight?: string;
  };
}

export const AccessibleMapControls: React.FC<AccessibleMapControlsProps> = ({
  defaultCenter,
  defaultZoom,
  onResetView,
  className,
  enableKeyboardShortcuts = true,
  enablePanControls = true,
  ariaLabels = {
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetView: 'Reset view',
    openSettings: 'Open map settings',
    panUp: 'Pan up',
    panDown: 'Pan down',
    panLeft: 'Pan left',
    panRight: 'Pan right',
  }
}) => {
  const map = useMap();
  const [zoomLevel, setZoomLevel] = useState(map.getZoom());
  const [currentCenter, setCurrentCenter] = useState(map.getCenter());
  const mapContainerRef = useRef<HTMLElement | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);
  
  // Set map container ref to the parent of our component
  useEffect(() => {
    mapContainerRef.current = map.getContainer();
  }, [map]);
  
  // Announce map state changes to screen readers
  const announceToScreenReader = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };
  
  // Update state when map zoom changes
  useEffect(() => {
    const handleZoomEnd = () => {
      const newZoom = map.getZoom();
      setZoomLevel(newZoom);
      announceToScreenReader(`Map zoomed to level ${newZoom}`);
    };
    
    const handleMoveEnd = () => {
      const center = map.getCenter();
      setCurrentCenter(center);
      announceToScreenReader(`Map moved to latitude ${center.lat.toFixed(4)}, longitude ${center.lng.toFixed(4)}`);
    };
    
    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);
    
    return () => {
      map.off('zoomend', handleZoomEnd);
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);
  
  // Keyboard shortcuts for map navigation
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;
    
    const handleKeydown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when map container is focused
      const activeElement = document.activeElement;
      if (!mapContainerRef.current?.contains(activeElement) && activeElement !== document.body) {
        return;
      }
      
      switch (e.key) {
        case '+':
          e.preventDefault();
          map.zoomIn();
          break;
        case '-':
          e.preventDefault();
          map.zoomOut();
          break;
        case 'Home':
          e.preventDefault();
          handleResetView();
          break;
        case 'ArrowUp':
          e.preventDefault();
          map.panBy([0, -50]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          map.panBy([0, 50]);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          map.panBy([-50, 0]);
          break;
        case 'ArrowRight':
          e.preventDefault();
          map.panBy([50, 0]);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      window.addEventListener('keydown', handleKeydown);
    };
  }, [enableKeyboardShortcuts, map]);
  
  // Zoom controls
  const handleZoomIn = () => {
    map.zoomIn();
  };
  
  const handleZoomOut = () => {
    map.zoomOut();
  };
  
  // Pan controls
  const handlePanUp = () => {
    map.panBy([0, -100]);
  };
  
  const handlePanDown = () => {
    map.panBy([0, 100]);
  };
  
  const handlePanLeft = () => {
    map.panBy([-100, 0]);
  };
  
  const handlePanRight = () => {
    map.panBy([100, 0]);
  };
  
  // View controls
  const handleResetView = () => {
    if (onResetView) {
      onResetView();
    } else {
      map.setView(defaultCenter, defaultZoom);
    }
    announceToScreenReader('Map view reset to default position');
  };
  

  
  const controlButton = "flex items-center justify-center h-10 w-10 bg-white rounded-md shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors";
  
  return (
    <>
      {/* Accessible screen reader announcements (hidden visually) */}
      <div 
        ref={announcementRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      
      {/* Zoom controls */}
      <div className={cn("flex flex-col space-y-2 absolute top-2 left-2 z-[1000]", className)}>
        <button
          className={controlButton}
          onClick={handleZoomIn}
          aria-label={ariaLabels.zoomIn}
          title={ariaLabels.zoomIn}
          role="button"
        >
          <ZoomIn className="h-6 w-6" />
        </button>
        
        <button
          className={controlButton}
          onClick={handleZoomOut}
          aria-label={ariaLabels.zoomOut}
          title={ariaLabels.zoomOut}
          role="button"
        >
          <ZoomOut className="h-6 w-6" />
        </button>
        
        <button
          className={controlButton}
          onClick={handleResetView}
          aria-label={ariaLabels.resetView}
          title={ariaLabels.resetView}
          role="button"
        >
          <Home className="h-6 w-6" />
        </button>
      </div>
      
      {/* Pan controls (direction pad) */}
      {enablePanControls && (
        <div className="absolute bottom-10 right-2 z-[1000] bg-white rounded-md shadow-md p-1">
          <div className="grid grid-cols-3 gap-1">
            {/* Empty cell */}
            <div className="h-10 w-10"></div>
            
            {/* Up */}
            <button
              className={controlButton}
              onClick={handlePanUp}
              aria-label={ariaLabels.panUp}
              title={ariaLabels.panUp}
              role="button"
            >
              <ArrowUp className="h-6 w-6" />
            </button>
            
            {/* Empty cell */}
            <div className="h-10 w-10"></div>
            
            {/* Left */}
            <button
              className={controlButton}
              onClick={handlePanLeft}
              aria-label={ariaLabels.panLeft}
              title={ariaLabels.panLeft}
              role="button"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            
            {/* Center/Reset */}
            <button
              className={controlButton}
              onClick={handleResetView}
              aria-label="Center map"
              title="Center map"
              role="button"
            >
              <Move className="h-6 w-6" />
            </button>
            
            {/* Right */}
            <button
              className={controlButton}
              onClick={handlePanRight}
              aria-label={ariaLabels.panRight}
              title={ariaLabels.panRight}
              role="button"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
            
            {/* Empty cell */}
            <div className="h-10 w-10"></div>
            
            {/* Down */}
            <button
              className={controlButton}
              onClick={handlePanDown}
              aria-label={ariaLabels.panDown}
              title={ariaLabels.panDown}
              role="button"
            >
              <ArrowDown className="h-6 w-6" />
            </button>
            
            {/* Empty cell */}
            <div className="h-10 w-10"></div>
          </div>
        </div>
      )}
      
      {/* Keyboard shortcuts info (hidden until toggled) */}
      {enableKeyboardShortcuts && (
        <div 
          className="absolute bottom-2 left-2 z-[1000] bg-white rounded-md shadow-md p-2 text-xs"
          aria-label="Keyboard shortcuts information"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">Keyboard Shortcuts</span>
          </div>
          <ul className="space-y-1 text-sm">
            <li><kbd>+</kbd> Zoom in</li>
            <li><kbd>-</kbd> Zoom out</li>
            <li><kbd>↑</kbd> Pan up</li>
            <li><kbd>↓</kbd> Pan down</li>
            <li><kbd>←</kbd> Pan left</li>
            <li><kbd>→</kbd> Pan right</li>
            <li><kbd>Home</kbd> Reset view</li>
          </ul>
        </div>
      )}
    </>
  );
};