import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

export type DrawingMode = 'none' | 'circle' | 'polygon' | 'rectangle';

interface DrawingControlProps {
  position: L.ControlPosition;
  onModeChange: (mode: DrawingMode) => void;
  onRadiusChange: (radius: number) => void;
  onCenterChange: (center: [number, number]) => void;
  onPolygonChange: (polygon: Array<[number, number]>) => void;
  onDrawingComplete: () => void;
}

export const DrawingControl: React.FC<DrawingControlProps> = ({
  position,
  onModeChange,
  onRadiusChange,
  onCenterChange,
  onPolygonChange,
  onDrawingComplete
}) => {
  const map = useMap();

  useEffect(() => {
    // Create a FeatureGroup to store editable layers
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialize the draw control
    const drawControl = new L.Control.Draw({
      position,
      edit: {
        featureGroup: drawnItems,
        edit: true,
        remove: false
      },
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Polygon cannot intersect itself!'
          },
          shapeOptions: {
            color: '#1E88E5'
          }
        },
        circle: {
          shapeOptions: {
            color: '#1E88E5'
          },
          showRadius: true,
          metric: true
        },
        rectangle: {
          shapeOptions: {
            color: '#1E88E5'
          }
        },
        polyline: false,
        marker: false,
        circlemarker: false
      }
    });

    map.addControl(drawControl);

    // Handle drawing started event
    map.on(L.Draw.Event.DRAWSTART, (e) => {
      // Clear previously drawn items
      drawnItems.clearLayers();
      
      // Determine the drawing mode
      const type = (e as any).layerType;
      if (type === 'circle') {
        onModeChange('circle');
      } else if (type === 'polygon') {
        onModeChange('polygon');
      } else if (type === 'rectangle') {
        onModeChange('rectangle');
      } else {
        onModeChange('none');
      }
    });

    // Handle drawing created event
    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
      // Extract shape data based on type
      const type = e.layerType;
      
      if (type === 'circle') {
        const center = (layer as L.Circle).getLatLng();
        const radius = (layer as L.Circle).getRadius() / 1000; // Convert to km
        
        onCenterChange([center.lat, center.lng]);
        onRadiusChange(radius);
      } else if (type === 'polygon' || type === 'rectangle') {
        const points = (layer as L.Polygon).getLatLngs()[0];
        const coordinates = (points as L.LatLng[]).map(point => [point.lat, point.lng] as [number, number]);
        
        onPolygonChange(coordinates);
      }
      
      onDrawingComplete();
    });

    // Handle edited event
    map.on(L.Draw.Event.EDITED, (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        if (layer instanceof L.Circle) {
          const center = layer.getLatLng();
          const radius = layer.getRadius() / 1000; // Convert to km
          
          onCenterChange([center.lat, center.lng]);
          onRadiusChange(radius);
        } else if (layer instanceof L.Polygon) {
          const points = layer.getLatLngs()[0];
          const coordinates = (points as L.LatLng[]).map(point => [point.lat, point.lng] as [number, number]);
          
          onPolygonChange(coordinates);
        }
      });
      
      onDrawingComplete();
    });

    // Handle deleted event
    map.on(L.Draw.Event.DELETED, () => {
      onModeChange('none');
      onPolygonChange([]);
      onCenterChange([0, 0]);
      onRadiusChange(0);
    });

    // Clean up on unmount
    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      map.off(L.Draw.Event.DRAWSTART);
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.EDITED);
      map.off(L.Draw.Event.DELETED);
    };
  }, [
    map, 
    position, 
    onModeChange, 
    onRadiusChange, 
    onCenterChange, 
    onPolygonChange, 
    onDrawingComplete
  ]);

  return null;
};

export default DrawingControl;