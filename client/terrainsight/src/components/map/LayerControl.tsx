import React, { useState, useEffect } from 'react';
import { 
  Layers, Search, Globe, MapPin, Map, Eye, EyeOff,
  Droplets, Building, FileText, School, Trees, Image 
} from 'lucide-react';
import { basemapSources, overlayLayerSources } from './layerSources';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LayerItem {
  id: string;
  name: string;
  checked: boolean;
}

interface LayerOptions {
  opacity: number;
  labels: boolean;
}

interface LayerControlProps {
  baseLayers: LayerItem[];
  viewableLayers: LayerItem[];
  layerOptions: LayerOptions;
  onUpdateLayerOption: (option: 'opacity' | 'labels', value: number | boolean) => void;
  onBaseLayerChange?: (layerId: string, checked: boolean) => void;
  onViewableLayerChange?: (layerId: string, checked: boolean) => void;
}

const LayerControl: React.FC<LayerControlProps> = ({
  baseLayers,
  viewableLayers,
  layerOptions,
  onUpdateLayerOption,
  onBaseLayerChange,
  onViewableLayerChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [baseLayersOpen, setBaseLayersOpen] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState<{[key: string]: boolean}>({
    "Base Maps": true,
    "Property Data": true,
    "Environmental": false,
    "Imagery": false
  });
  
  // Group layers by category
  const layerCategories = {
    "Property Data": ['parcels', 'zoning'],
    "Environmental": ['floodZones', 'wetlands'],
    "Imagery": ['aerials2021'],
    "Administrative": ['schools']
  };
  
  // Get layers for a specific category
  const getLayersForCategory = (category: string) => {
    const categoryLayerIds = layerCategories[category as keyof typeof layerCategories] || [];
    return viewableLayers.filter(layer => categoryLayerIds.includes(layer.id));
  };
  
  // Filter layers based on search term
  const filteredBaseLayers = baseLayers.filter(layer => 
    layer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredViewableLayers = viewableLayers.filter(layer => 
    layer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle base layer change (radio button behavior - only one can be active)
  const handleBaseLayerChange = (layerId: string, checked: boolean) => {
    if (onBaseLayerChange) {
      onBaseLayerChange(layerId, checked);
    }
  };
  
  // Handle viewable layer change
  const handleViewableLayerChange = (layerId: string, checked: boolean) => {
    if (onViewableLayerChange) {
      onViewableLayerChange(layerId, checked);
    }
  };
  
  // Toggle all layers in a category
  const toggleCategoryLayers = (category: string, checked: boolean) => {
    const categoryLayerIds = layerCategories[category as keyof typeof layerCategories] || [];
    categoryLayerIds.forEach(layerId => {
      if (onViewableLayerChange) {
        onViewableLayerChange(layerId, checked);
      }
    });
  };
  
  // Get icon for a specific layer
  const getLayerIcon = (layerId: string) => {
    switch (layerId) {
      // Base maps
      case 'osm':
        return <Map size={16} className="text-green-400" />;
      case 'satellite':
        return <Globe size={16} className="text-blue-400" />;
      case 'topo':
        return <Layers size={16} className="text-purple-400" />;
      case 'light':
        return <Map size={16} className="text-gray-400" />;
      
      // Property data
      case 'parcels':
        return <MapPin size={16} className="text-blue-500" />;
      case 'zoning':
        return <Building size={16} className="text-orange-500" />;
      
      // Environmental
      case 'floodZones':
        return <Droplets size={16} className="text-blue-400" />;
      case 'wetlands':
        return <Trees size={16} className="text-green-500" />;
      
      // Administrative  
      case 'schools':
        return <School size={16} className="text-yellow-500" />;
      
      // Imagery
      case 'aerials2021':
        return <Image size={16} className="text-indigo-400" />;
        
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Property Data":
        return <Building size={18} className="text-blue-500 mr-2" />;
      case "Environmental":
        return <Trees size={18} className="text-green-500 mr-2" />;
      case "Imagery":
        return <Image size={18} className="text-indigo-400 mr-2" />;
      case "Administrative":
        return <School size={18} className="text-yellow-500 mr-2" />;
      default:
        return <Layers size={18} className="text-gray-400 mr-2" />;
    }
  };
  
  return (
    <div className="w-72 bg-gray-800 border-r border-gray-700 p-4 flex flex-col overflow-auto">
      <h2 className="font-bold text-lg mb-4 flex items-center">
        <Layers size={18} className="mr-2 text-blue-500" />
        GIS Layers
      </h2>
      
      {/* Search Input */}
      <div className="relative mb-4">
        <input 
          type="text" 
          placeholder="Search layers..." 
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search size={16} className="text-gray-400 absolute left-2.5 top-2.5" />
      </div>
      
      {searchTerm ? (
        // Show flat list of search results if searching
        <div className="mb-4">
          {/* Base Layers Section */}
          {filteredBaseLayers.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-blue-400 mt-2 mb-2">Base Maps</h3>
              <div className="space-y-2 mb-4 pl-1">
                {filteredBaseLayers.map((layer) => (
                  <div key={layer.id} className="flex items-center p-2 rounded hover:bg-gray-700">
                    <input 
                      type="radio" 
                      id={`layer-${layer.id}`} 
                      name="baseLayer"
                      className="mr-2" 
                      checked={layer.checked}
                      onChange={(e) => handleBaseLayerChange(layer.id, e.target.checked)}
                    />
                    <div className="mr-2">
                      {getLayerIcon(layer.id)}
                    </div>
                    <label htmlFor={`layer-${layer.id}`} className="cursor-pointer flex-1 text-sm">
                      {layer.name}
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Viewable Layers Section */}
          {filteredViewableLayers.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-blue-400 mt-4 mb-2">GIS Layers</h3>
              <div className="space-y-2 mb-4 pl-1">
                {filteredViewableLayers.map((layer) => (
                  <div key={layer.id} className="flex items-center p-2 rounded hover:bg-gray-700">
                    <input 
                      type="checkbox" 
                      id={`viewlayer-${layer.id}`} 
                      className="mr-2" 
                      checked={layer.checked}
                      onChange={(e) => handleViewableLayerChange(layer.id, e.target.checked)}
                    />
                    <div className="mr-2">
                      {getLayerIcon(layer.id)}
                    </div>
                    <label htmlFor={`viewlayer-${layer.id}`} className="cursor-pointer flex-1 text-sm">
                      {layer.name}
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        // Show organized categories when not searching
        <div className="space-y-4 overflow-auto mb-4">
          {/* Base Maps Collapsible */}
          <Collapsible 
            open={categoryOpen["Base Maps"]} 
            onOpenChange={() => setCategoryOpen({...categoryOpen, "Base Maps": !categoryOpen["Base Maps"]})}
            className="border border-gray-700 rounded-md overflow-hidden"
          >
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full p-3 text-sm font-medium bg-gray-750 hover:bg-gray-700">
                <div className="flex items-center">
                  <Globe size={18} className="text-blue-400 mr-2" />
                  <span>Base Maps</span>
                </div>
                <span className="text-xs text-gray-400">{baseLayers.find(l => l.checked)?.name}</span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-gray-800 p-2 space-y-1">
              {baseLayers.map((layer) => (
                <div key={layer.id} className="flex items-center p-2 rounded hover:bg-gray-700">
                  <input 
                    type="radio" 
                    id={`layer-${layer.id}`} 
                    name="baseLayer"
                    className="mr-2" 
                    checked={layer.checked}
                    onChange={(e) => handleBaseLayerChange(layer.id, e.target.checked)}
                  />
                  <div className="mr-2">
                    {getLayerIcon(layer.id)}
                  </div>
                  <label htmlFor={`layer-${layer.id}`} className="cursor-pointer flex-1 text-sm">
                    {layer.name}
                  </label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
          
          {/* Property Data Layers */}
          {Object.keys(layerCategories).map(category => {
            const categoryLayers = getLayersForCategory(category);
            if (categoryLayers.length === 0) return null;
            
            const allChecked = categoryLayers.every(layer => layer.checked);
            const someChecked = categoryLayers.some(layer => layer.checked);
            
            return (
              <Collapsible 
                key={category}
                open={categoryOpen[category]} 
                onOpenChange={() => setCategoryOpen({...categoryOpen, [category]: !categoryOpen[category]})}
                className="border border-gray-700 rounded-md overflow-hidden"
              >
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full p-3 text-sm font-medium bg-gray-750 hover:bg-gray-700">
                    <div className="flex items-center">
                      {getCategoryIcon(category)}
                      <span>{category}</span>
                    </div>
                    <div>
                      {allChecked ? 
                        <Eye size={16} className="text-blue-400" /> : 
                        someChecked ? 
                          <Eye size={16} className="text-gray-400" /> : 
                          <EyeOff size={16} className="text-gray-500" />
                      }
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-gray-800 p-2 space-y-1">
                  <div className="flex justify-between items-center p-1 mb-1 pb-2 border-b border-gray-700">
                    <span className="text-xs text-gray-400">Toggle all layers</span>
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => toggleCategoryLayers(category, true)}
                      >
                        <Eye size={12} className="mr-1" /> Show
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => toggleCategoryLayers(category, false)}
                      >
                        <EyeOff size={12} className="mr-1" /> Hide
                      </Button>
                    </div>
                  </div>
                  
                  {categoryLayers.map((layer) => (
                    <div key={layer.id} className="flex items-center p-2 rounded hover:bg-gray-700">
                      <input 
                        type="checkbox" 
                        id={`viewlayer-${layer.id}`} 
                        className="mr-2" 
                        checked={layer.checked}
                        onChange={(e) => handleViewableLayerChange(layer.id, e.target.checked)}
                      />
                      <div className="mr-2">
                        {getLayerIcon(layer.id)}
                      </div>
                      <label htmlFor={`viewlayer-${layer.id}`} className="cursor-pointer flex-1 text-sm">
                        {layer.name}
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
      
      {/* Layer Options */}
      <div className="bg-gray-750 rounded p-3 mt-auto border border-gray-700">
        <h3 className="text-sm font-medium mb-2">Layer Display Options</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Opacity</span>
              <span className="text-xs text-gray-400">{layerOptions.opacity}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={layerOptions.opacity} 
              onChange={(e) => onUpdateLayerOption('opacity', parseInt(e.target.value))}
              className="w-full" 
            />
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm block">Show Labels</span>
              <span className="text-xs text-gray-400 block">Display road names and places</span>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={layerOptions.labels}
                  onChange={(e) => onUpdateLayerOption('labels', e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerControl;
