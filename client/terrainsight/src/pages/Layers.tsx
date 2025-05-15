import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Layers, 
  Map, 
  Filter, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Settings, 
  Info, 
  Download, 
  Upload, 
  Save,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Sample layer data
const sampleLayers = [
  {
    id: 1,
    name: "Parcels",
    type: "Vector",
    description: "Property parcel boundaries",
    visible: true,
    source: "County GIS",
    features: 42387,
    category: "Base"
  },
  {
    id: 2,
    name: "Zoning",
    type: "Vector",
    description: "City zoning districts",
    visible: true,
    source: "City Planning",
    features: 128,
    category: "Planning"
  },
  {
    id: 3,
    name: "Property Values",
    type: "Heatmap",
    description: "Property value heatmap",
    visible: false,
    source: "Tax Assessor",
    features: 42387,
    category: "Analysis"
  },
  {
    id: 4,
    name: "Flood Zones",
    type: "Vector",
    description: "FEMA flood zone designations",
    visible: false,
    source: "FEMA",
    features: 56,
    category: "Environmental"
  },
  {
    id: 5,
    name: "School Districts",
    type: "Vector",
    description: "School district boundaries",
    visible: true,
    source: "Department of Education",
    features: 8,
    category: "Administrative"
  },
  {
    id: 6,
    name: "Satellite Imagery",
    type: "Raster",
    description: "High-resolution satellite imagery",
    visible: false,
    source: "USGS",
    lastUpdated: "2023-09-15",
    category: "Imagery"
  }
];

// Sample layer group data
const layerGroups = [
  { id: 1, name: "Base", expanded: true },
  { id: 2, name: "Planning", expanded: false },
  { id: 3, name: "Analysis", expanded: true },
  { id: 4, name: "Environmental", expanded: false },
  { id: 5, name: "Administrative", expanded: false },
  { id: 6, name: "Imagery", expanded: false }
];

const LayersPage = () => {
  const [layers, setLayers] = useState(sampleLayers);
  const [groups, setGroups] = useState(layerGroups);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  
  const toggleLayerVisibility = (id: number) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ));
  };
  
  const toggleGroupExpanded = (id: number) => {
    setGroups(groups.map(group => 
      group.id === id ? { ...group, expanded: !group.expanded } : group
    ));
  };
  
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Map Layers</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage and configure geospatial data layers</p>
        </div>
        
        <div className="flex mt-4 sm:mt-0 space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            <span>Import</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            <span>Export</span>
          </Button>
          <Button size="sm" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            <span>Add Layer</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Layer List</CardTitle>
              <CardDescription>
                Toggle visibility and organize layers
              </CardDescription>
              <div className="mt-2 relative">
                <Input placeholder="Filter layers..." className="pl-8" />
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-2 py-2">
              <ScrollArea className="h-[500px]">
                <div className="px-2 space-y-4">
                  {groups.map(group => (
                    <div key={group.id} className="space-y-1">
                      <div 
                        className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded-md cursor-pointer"
                        onClick={() => toggleGroupExpanded(group.id)}
                      >
                        <div className="flex items-center">
                          <Layers className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-medium text-sm">{group.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {layers.filter(layer => layer.category === group.name).length}
                          </Badge>
                        </div>
                        <button className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                          {group.expanded ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </button>
                      </div>
                      
                      {group.expanded && (
                        <div className="ml-4 space-y-1 border-l pl-3 border-border">
                          {layers
                            .filter(layer => layer.category === group.name)
                            .map(layer => (
                              <div 
                                key={layer.id}
                                className={`flex items-center justify-between p-2 rounded-md ${activeLayer === layer.id ? 'bg-primary/5 border border-primary/20' : 'hover:bg-secondary/10'}`}
                                onClick={() => setActiveLayer(layer.id)}
                              >
                                <div className="flex items-center">
                                  <button 
                                    className="mr-2 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLayerVisibility(layer.id);
                                    }}
                                  >
                                    {layer.visible ? 
                                      <Eye className="h-4 w-4" /> : 
                                      <EyeOff className="h-4 w-4" />}
                                  </button>
                                  <span className="text-sm">{layer.name}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">{layer.type}</Badge>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {activeLayer ? layers.find(l => l.id === activeLayer)?.name : 'Map Preview'}
                  </CardTitle>
                  <CardDescription>
                    {activeLayer ? layers.find(l => l.id === activeLayer)?.description : 'Select a layer to view details and edit properties'}
                  </CardDescription>
                </div>
                {activeLayer && (
                  <div className="flex mt-2 sm:mt-0 space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Settings className="h-4 w-4 mr-1" />
                      <span>Style</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      <span>Metadata</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span>Remove</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeLayer ? (
                <Tabs defaultValue="properties">
                  <TabsList>
                    <TabsTrigger value="properties">Properties</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="properties" className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="layer-name">Layer Name</Label>
                          <Input 
                            id="layer-name" 
                            value={layers.find(l => l.id === activeLayer)?.name || ''} 
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="layer-description">Description</Label>
                          <Input 
                            id="layer-description" 
                            value={layers.find(l => l.id === activeLayer)?.description || ''} 
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="layer-source">Data Source</Label>
                          <Input 
                            id="layer-source" 
                            value={layers.find(l => l.id === activeLayer)?.source || ''} 
                            className="mt-1" 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="layer-category">Category</Label>
                          <select
                            id="layer-category"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                            value={layers.find(l => l.id === activeLayer)?.category || ''}
                          >
                            {groups.map(group => (
                              <option key={group.id} value={group.name}>{group.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="layer-type">Layer Type</Label>
                          <select
                            id="layer-type"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                            value={layers.find(l => l.id === activeLayer)?.type || ''}
                          >
                            <option value="Vector">Vector</option>
                            <option value="Raster">Raster</option>
                            <option value="Heatmap">Heatmap</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm font-medium">Layer Visibility</span>
                          <Switch 
                            checked={layers.find(l => l.id === activeLayer)?.visible || false}
                            onCheckedChange={() => toggleLayerVisibility(activeLayer)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline">Cancel</Button>
                      <Button>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="style" className="pt-4">
                    <div className="h-64 flex items-center justify-center bg-secondary/20 rounded-md">
                      <div className="text-center">
                        <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Layer styling options will appear here</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="data" className="pt-4">
                    <div className="h-64 flex items-center justify-center bg-secondary/20 rounded-md">
                      <div className="text-center">
                        <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Layer data attributes and feature information will appear here</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="aspect-[16/9] flex items-center justify-center bg-secondary/20 rounded-md">
                  <div className="text-center px-4">
                    <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Layer</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Select a layer from the list on the left to view and edit its properties, styling, and data attributes.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LayersPage;