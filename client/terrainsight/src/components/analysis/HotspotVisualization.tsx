import React, { useState, useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '@shared/schema';
import { HotspotAnalysis, HotspotResult } from '../../services/hotspotAnalysisService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Confidence level type
type ConfidenceLevel = '0.90' | '0.95' | '0.99';

// Interface for component props
interface HotspotVisualizationProps {
  properties: Property[];
}

// Map marker icons
const createHotspotIcon = (color: string) => {
  return L.divIcon({
    className: 'hotspot-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 0 0 2px white;
      ">
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

/**
 * Component for visualizing property hotspots based on Getis-Ord Gi* statistic
 */
export const HotspotVisualization: React.FC<HotspotVisualizationProps> = ({ properties }) => {
  // Get map instance from react-leaflet
  const map = useMap();
  
  // State for confidence level filter
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>('0.90');
  
  // State for the markers layer
  const [markersLayer, setMarkersLayer] = useState<L.LayerGroup | null>(null);
  
  // Calculate hotspots using the HotspotAnalysis service
  const hotspotResults = useMemo(() => {
    if (properties.length < 2) return [];
    
    const analysis = new HotspotAnalysis(properties);
    return analysis.identifyHotspots();
  }, [properties]);
  
  // Filter results by confidence level
  const filteredResults = useMemo(() => {
    if (!hotspotResults.length) return [];
    
    const confidenceValue = parseFloat(confidenceLevel);
    
    return hotspotResults.filter(result => {
      if (result.type === 'not-significant') return false;
      return parseFloat(result.confidence) >= confidenceValue;
    });
  }, [hotspotResults, confidenceLevel]);
  
  // Count of hot and cold spots
  const hotspotCounts = useMemo(() => {
    const hot = filteredResults.filter(r => r.type === 'hot').length;
    const cold = filteredResults.filter(r => r.type === 'cold').length;
    return { hot, cold };
  }, [filteredResults]);
  
  // Update markers on the map
  useEffect(() => {
    if (!map) return;
    
    // Remove existing markers
    if (markersLayer) {
      markersLayer.clearLayers();
    } else {
      // Create a new layer group for markers
      const newLayer = L.layerGroup().addTo(map);
      setMarkersLayer(newLayer);
    }
    
    // Skip if no results
    if (filteredResults.length === 0) return;
    
    // Add markers for hotspots
    filteredResults.forEach(result => {
      const property = properties.find(p => p.id === result.propertyId);
      if (!property || !property.latitude || !property.longitude) return;
      
      // Determine marker color based on type and confidence
      let markerColor = '#808080'; // default gray
      
      if (result.type === 'hot') {
        // Red for hotspots with varying opacity by confidence
        if (result.confidence === '0.99') markerColor = '#ff0000'; // bright red
        else if (result.confidence === '0.95') markerColor = '#ff3333'; // lighter red
        else markerColor = '#ff6666'; // lightest red
      } else if (result.type === 'cold') {
        // Blue for coldspots with varying opacity by confidence
        if (result.confidence === '0.99') markerColor = '#0000ff'; // bright blue
        else if (result.confidence === '0.95') markerColor = '#3333ff'; // lighter blue
        else markerColor = '#6666ff'; // lightest blue
      }
      
      // Create marker
      const marker = L.marker([Number(property.latitude), Number(property.longitude)], {
        icon: createHotspotIcon(markerColor)
      });
      
      // Add popup with property info
      marker.bindPopup(`
        <div>
          <strong>${property.address}</strong><br/>
          Value: ${property.value}<br/>
          ${result.type === 'hot' ? 'Hotspot' : 'Coldspot'} (${parseInt(result.confidence) * 100}% confidence)<br/>
          Z-score: ${result.zScore.toFixed(2)}
        </div>
      `);
      
      // Add to layer group
      markersLayer?.addLayer(marker);
    });
    
  }, [map, properties, filteredResults, markersLayer]);
  
  // Handle confidence level change
  const handleConfidenceLevelChange = (value: string) => {
    setConfidenceLevel(value as ConfidenceLevel);
  };
  
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (hotspotResults.length === 0) return null;
    
    const total = hotspotResults.length;
    const significant = hotspotResults.filter(r => r.type !== 'not-significant').length;
    const hotspots = hotspotResults.filter(r => r.type === 'hot').length;
    const coldspots = hotspotResults.filter(r => r.type === 'cold').length;
    
    return {
      total,
      significant,
      hotspots,
      coldspots,
      significantPercent: Math.round((significant / total) * 100),
      hotspotsPercent: Math.round((hotspots / total) * 100),
      coldspotsPercent: Math.round((coldspots / total) * 100)
    };
  }, [hotspotResults]);
  
  // Render component
  return (
    <Card className="w-80 shadow-md absolute bottom-4 right-4 z-[1000] bg-white bg-opacity-90">
      <CardHeader>
        <CardTitle>Hotspot Analysis</CardTitle>
        <CardDescription>
          Statistical analysis of property value clusters
        </CardDescription>
      </CardHeader>
      <CardContent>
        {properties.length < 2 ? (
          <div>Need at least 2 properties for hotspot analysis.</div>
        ) : hotspotResults.length === 0 ? (
          <div>Analyzing property clusters...</div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confidence-select">Confidence Level</Label>
                <Select
                  value={confidenceLevel}
                  onValueChange={handleConfidenceLevelChange}
                >
                  <SelectTrigger id="confidence-select" aria-label="Confidence Level">
                    <SelectValue placeholder="Select confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.90">90% Confidence</SelectItem>
                    <SelectItem value="0.95">95% Confidence</SelectItem>
                    <SelectItem value="0.99">99% Confidence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Showing:</span>
                  <span className="font-medium">{filteredResults.length} significant clusters</span>
                </div>
                <div className="flex justify-between">
                  <span>Hot spots:</span>
                  <Badge variant="destructive">{hotspotCounts.hot}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cold spots:</span>
                  <Badge variant="info">{hotspotCounts.cold}</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Legend</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <span>99% Hot Spot</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span>99% Cold Spot</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span>95% Hot Spot</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    <span>95% Cold Spot</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-300"></div>
                    <span>90% Hot Spot</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                    <span>90% Cold Spot</span>
                  </div>
                </div>
              </div>
              
              {summaryStats && (
                <div className="text-xs text-gray-600 mt-2">
                  <p>Analysis of {summaryStats.total} properties found:</p>
                  <p>• {summaryStats.significant} statistically significant clusters ({summaryStats.significantPercent}%)</p>
                  <p>• {summaryStats.hotspots} high-value hotspots ({summaryStats.hotspotsPercent}%)</p>
                  <p>• {summaryStats.coldspots} low-value coldspots ({summaryStats.coldspotsPercent}%)</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};