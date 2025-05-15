import React, { useState, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Info, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Property } from '@/shared/types';

interface ScreenReaderMapInfoProps {
  properties?: Property[];
  visibleLayerNames?: string[];
}

const ScreenReaderMapInfo: React.FC<ScreenReaderMapInfoProps> = ({
  properties = [],
  visibleLayerNames = []
}) => {
  const map = useMap();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapStatus, setMapStatus] = useState("");
  const [propertiesText, setPropertiesText] = useState("");
  const [layersText, setLayersText] = useState("");

  // Update information when map moves or zooms
  useMapEvents({
    moveend: updateMapInfo,
    zoomend: updateMapInfo,
    resize: updateMapInfo
  });

  // Update the map status text
  function updateMapInfo() {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bounds = map.getBounds();
    
    // Map position information
    setMapStatus(`Map centered at latitude ${center.lat.toFixed(4)}, longitude ${center.lng.toFixed(4)}. 
      Zoom level ${zoom} of 18. 
      Viewing area from ${bounds.getSouth().toFixed(4)} to ${bounds.getNorth().toFixed(4)} latitude 
      and ${bounds.getWest().toFixed(4)} to ${bounds.getEast().toFixed(4)} longitude.`);
    
    // Properties in view information
    const visibleProperties = properties.filter(p => {
      if (!p.coordinates) return false;
      return bounds.contains(p.coordinates);
    });
    
    if (visibleProperties.length === 0) {
      setPropertiesText('No properties visible in the current map view.');
    } else {
      setPropertiesText(`${visibleProperties.length} ${visibleProperties.length === 1 ? 'property' : 'properties'} visible in the current map view. 
        ${visibleProperties.slice(0, 5).map(p => p.address).join(', ')}${visibleProperties.length > 5 ? ', and more.' : '.'}`);
    }
    
    // Layers information
    if (visibleLayerNames.length === 0) {
      setLayersText('No additional data layers are currently visible.');
    } else {
      setLayersText(`Visible data layers: ${visibleLayerNames.join(', ')}.`);
    }
  }

  // Update information when properties or layers change
  useEffect(() => {
    updateMapInfo();
  }, [properties, visibleLayerNames]);

  // Create an announcement when the information is updated for screen readers
  useEffect(() => {
    if (isExpanded) {
      const announcement = document.createElement('div');
      announcement.className = 'sr-only';
      announcement.setAttribute('aria-live', 'polite');
      announcement.innerHTML = `${mapStatus} ${propertiesText} ${layersText}`;
      
      document.body.appendChild(announcement);
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 5000);
    }
  }, [mapStatus, propertiesText, layersText, isExpanded]);

  // Toggle the expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Center on a particular property for keyboard/screen reader users
  const centerOnProperty = (property: Property) => {
    if (property.coordinates) {
      map.setView(property.coordinates, 16);
    }
  };

  return (
    <div className="absolute right-3 top-3 z-[1000] max-w-md">
      <div className="bg-white bg-opacity-90 rounded-lg shadow-md border border-gray-300 overflow-hidden">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-3 hover:bg-gray-100"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-controls="screen-reader-map-info"
        >
          <div className="flex items-center">
            <Info size={16} className="text-blue-600 mr-2" />
            <span className="font-medium text-sm">Map Information for Screen Readers</span>
          </div>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
        
        {isExpanded && (
          <div 
            id="screen-reader-map-info" 
            className="p-3 text-sm bg-white border-t border-gray-200"
            tabIndex={0} // Make sure this is focusable
          >
            <div className="mb-3">
              <h3 className="font-medium mb-1 text-gray-800">Map Status</h3>
              <p className="text-gray-600">{mapStatus}</p>
            </div>
            
            <div className="mb-3">
              <h3 className="font-medium mb-1 text-gray-800">Visible Properties</h3>
              <p className="text-gray-600 mb-2">{propertiesText}</p>
              
              {properties.length > 0 && (
                <div className="mt-2 space-y-1">
                  <h4 className="text-xs font-medium text-gray-700">Focus on Property:</h4>
                  {properties.slice(0, 5).map(property => (
                    <Button
                      key={property.id}
                      variant="outline"
                      size="sm"
                      className="mr-1 mb-1 text-xs"
                      onClick={() => centerOnProperty(property)}
                    >
                      <MapPin size={12} className="mr-1" />
                      {property.address.split(',')[0]}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mb-3">
              <h3 className="font-medium mb-1 text-gray-800">Data Layers</h3>
              <p className="text-gray-600">{layersText}</p>
            </div>
            
            <div className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-2">
              <h3 className="font-medium mb-1">Keyboard Navigation</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Arrow keys: Pan the map</li>
                <li>+ / -: Zoom in/out</li>
                <li>A key: Announce current position</li>
                <li>H key: Return to home view</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenReaderMapInfo;