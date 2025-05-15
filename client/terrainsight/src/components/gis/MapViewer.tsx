import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Layers, Map as MapIcon, Info } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Workaround for Leaflet marker images with webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapViewerProps {
  className?: string;
}

export function MapViewer({ className }: MapViewerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [opacity, setOpacity] = useState<number>(0.7);
  const [layerGroup, setLayerGroup] = useState<L.LayerGroup | null>(null);
  const [basemapStyle, setBasemapStyle] = useState<string>('streets');
  
  // Query to fetch available datasets
  const { 
    data: datasetsData, 
    isLoading: isDatasetsLoading, 
    isError: isDatasetsError 
  } = useQuery({
    queryKey: ['/api/gis/datasets'],
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Query to fetch GeoJSON data for selected dataset
  const {
    data: geojsonData,
    isLoading: isGeojsonLoading,
    isError: isGeojsonError,
    refetch: refetchGeojson
  } = useQuery({
    queryKey: ['/api/gis/datasets', selectedDataset, 'geojson'],
    enabled: !!selectedDataset,
    queryFn: async () => {
      if (!selectedDataset) return null;
      const response = await fetch(`/api/gis/datasets/${selectedDataset}/geojson`);
      if (!response.ok) {
        throw new Error('Failed to fetch GeoJSON data');
      }
      return response.json();
    },
    refetchOnWindowFocus: false
  });
  
  // Initialize map on component mount
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize the map
      const map = L.map(mapContainerRef.current).setView([46.2360, -119.2059], 12);
      
      // Add default base layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Create a layer group for GeoJSON data
      const newLayerGroup = L.layerGroup().addTo(map);
      setLayerGroup(newLayerGroup);
      
      // Save map instance
      mapRef.current = map;
    }
    
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Update base map style when changed
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Remove existing tile layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer);
      }
    });
    
    // Add new tile layer based on selected style
    switch (basemapStyle) {
      case 'streets':
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);
        break;
        
      case 'satellite':
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }).addTo(mapRef.current);
        break;
        
      case 'topo':
        L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        }).addTo(mapRef.current);
        break;
        
      case 'light':
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(mapRef.current);
        break;
    }
  }, [basemapStyle]);
  
  // Update map when GeoJSON data changes
  useEffect(() => {
    if (!mapRef.current || !layerGroup || !geojsonData) return;
    
    // Clear existing layers
    layerGroup.clearLayers();
    
    // Add GeoJSON data to the map
    const geojsonLayer = L.geoJSON(geojsonData, {
      style: {
        fillColor: '#3b82f6',
        weight: 1,
        opacity: 1,
        color: '#1e40af',
        fillOpacity: opacity
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          const popupContent = Object.entries(feature.properties)
            .slice(0, 10) // Limit to first 10 properties
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join('<br />');
          
          layer.bindPopup(popupContent);
        }
      }
    }).addTo(layerGroup);
    
    // Fit map to bounds of the GeoJSON data
    const bounds = geojsonLayer.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds);
    }
  }, [geojsonData, opacity, layerGroup]);
  
  // Process datasets data
  const datasetsResponse = datasetsData as { availableDatasets: string[], downloadedDatasets: string[] };
  const datasets = datasetsResponse?.downloadedDatasets || [];
  
  // Handle dataset select change
  const handleDatasetChange = (datasetName: string) => {
    setSelectedDataset(datasetName);
  };
  
  // Handle opacity change
  const handleOpacityChange = (value: number[]) => {
    setOpacity(value[0]);
  };
  
  return (
    <Card className="shadow-lg border border-opacity-50 bg-background/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapIcon className="h-5 w-5" />
          GIS Map Viewer
        </CardTitle>
        <CardDescription>
          Visualize Benton County geospatial datasets
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dataset</label>
            <Select
              value={selectedDataset || ''}
              onValueChange={handleDatasetChange}
              disabled={datasets.length === 0 || isDatasetsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a dataset" />
              </SelectTrigger>
              <SelectContent>
                {datasets.map((dataset) => (
                  <SelectItem key={dataset} value={dataset}>
                    {dataset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {datasets.length === 0 && !isDatasetsLoading && (
              <p className="text-xs text-muted-foreground">
                No datasets available. Download datasets from the GIS Datasets tab.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Basemap Style</label>
            <Select value={basemapStyle} onValueChange={setBasemapStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select a basemap style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streets">Streets</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="topo">Topographic</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Layer Opacity ({Math.round(opacity * 100)}%)</label>
            <Slider
              value={[opacity]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={handleOpacityChange}
              disabled={!selectedDataset || isGeojsonLoading}
            />
          </div>
        </div>
        
        <div 
          ref={mapContainerRef} 
          className="w-full h-[500px] rounded-md overflow-hidden border border-border"
        />
        
        {isGeojsonLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-md">
            <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading dataset...</span>
            </div>
          </div>
        )}
        
        {isGeojsonError && (
          <div className="mt-4 p-4 rounded-md bg-destructive/10 text-destructive">
            <h3 className="font-semibold flex items-center gap-2">
              <Info className="h-4 w-4" />
              Error Loading Data
            </h3>
            <p className="text-sm mt-1">
              There was a problem loading the selected dataset. Make sure the dataset is downloaded
              and try again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}