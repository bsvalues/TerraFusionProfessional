import React, { useState } from 'react';
import { Property } from '../../shared/schema';
import { FindSimilarPropertiesButton } from './FindSimilarPropertiesButton';
import { PropertySelectionDisplay } from './PropertySelectionDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PropertyWeights, 
  DEFAULT_WEIGHTS, 
  normalizeWeights,
  VALUE_FOCUSED_WEIGHTS,
  PHYSICAL_FOCUSED_WEIGHTS,
  LOCATION_FOCUSED_WEIGHTS
} from './PropertyScoring';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart,
  Building,
  Calendar,
  Home,
  SquareDot,
  DollarSign,
  MapPin,
  Bath,
  Bed
} from 'lucide-react';

interface PropertyComparisonToolProps {
  properties: Property[];
  selectedPropertyId?: number | null;
  onSelectProperty: (property: Property) => void;
  onFindSimilarProperties: (property: Property, count: number) => void;
  className?: string;
}

export const PropertyComparisonTool: React.FC<PropertyComparisonToolProps> = ({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onFindSimilarProperties,
  className
}) => {
  // State for weight configuration
  const [weights, setWeights] = useState<PropertyWeights>({ ...DEFAULT_WEIGHTS });
  
  // State for the number of similar properties to find
  const [similarCount, setSimilarCount] = useState(5);
  
  // State for active weight preset
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  // Find the selected property
  const selectedProperty = selectedPropertyId 
    ? properties.find(p => p.id === selectedPropertyId) 
    : null;
  
  // Handle weight slider changes
  const handleWeightChange = (attribute: keyof PropertyWeights, value: number) => {
    const newWeights = { ...weights, [attribute]: value / 100 };
    setWeights(normalizeWeights(newWeights));
    setActivePreset(null);
  };
  
  // Apply weight preset
  const applyWeightPreset = (preset: PropertyWeights, presetName: string) => {
    setWeights({ ...preset });
    setActivePreset(presetName);
  };
  
  // Reset weights to default
  const resetWeights = () => {
    setWeights({ ...DEFAULT_WEIGHTS });
    setActivePreset('default');
  };
  
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Selected property card */}
      {selectedProperty ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Selected Property</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PropertySelectionDisplay property={selectedProperty} />
              
              <div className="mt-4">
                <FindSimilarPropertiesButton 
                  property={selectedProperty}
                  count={similarCount}
                  onFindSimilar={(property, count) => onFindSimilarProperties(property, count)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Weight configuration card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Comparison Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="weights" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="weights" className="flex-1">Weights</TabsTrigger>
                  <TabsTrigger value="presets" className="flex-1">Presets</TabsTrigger>
                </TabsList>
                
                <TabsContent value="weights" className="space-y-4">
                  {/* Weight sliders */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-[25px_1fr_50px] items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Slider 
                        value={[weights.value * 100]} 
                        min={0} 
                        max={100} 
                        step={5}
                        onValueChange={(value) => handleWeightChange('value', value[0])}
                      />
                      <span className="text-sm text-muted-foreground text-right">
                        {Math.round(weights.value * 100)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-[25px_1fr_50px] items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Slider 
                        value={[weights.yearBuilt * 100]} 
                        min={0} 
                        max={100} 
                        step={5}
                        onValueChange={(value) => handleWeightChange('yearBuilt', value[0])}
                      />
                      <span className="text-sm text-muted-foreground text-right">
                        {Math.round(weights.yearBuilt * 100)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-[25px_1fr_50px] items-center gap-2">
                      <SquareDot className="h-4 w-4 text-muted-foreground" />
                      <Slider 
                        value={[weights.squareFeet * 100]} 
                        min={0} 
                        max={100} 
                        step={5}
                        onValueChange={(value) => handleWeightChange('squareFeet', value[0])}
                      />
                      <span className="text-sm text-muted-foreground text-right">
                        {Math.round(weights.squareFeet * 100)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-[25px_1fr_50px] items-center gap-2">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <Slider 
                        value={[weights.bedrooms * 100]} 
                        min={0} 
                        max={100} 
                        step={5}
                        onValueChange={(value) => handleWeightChange('bedrooms', value[0])}
                      />
                      <span className="text-sm text-muted-foreground text-right">
                        {Math.round(weights.bedrooms * 100)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-[25px_1fr_50px] items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <Slider 
                        value={[weights.bathrooms * 100]} 
                        min={0} 
                        max={100} 
                        step={5}
                        onValueChange={(value) => handleWeightChange('bathrooms', value[0])}
                      />
                      <span className="text-sm text-muted-foreground text-right">
                        {Math.round(weights.bathrooms * 100)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-[25px_1fr_50px] items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <Slider 
                        value={[weights.propertyType * 100]} 
                        min={0} 
                        max={100} 
                        step={5}
                        onValueChange={(value) => handleWeightChange('propertyType', value[0])}
                      />
                      <span className="text-sm text-muted-foreground text-right">
                        {Math.round(weights.propertyType * 100)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-[25px_1fr_50px] items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Slider 
                        value={[weights.neighborhood * 100]} 
                        min={0} 
                        max={100} 
                        step={5}
                        onValueChange={(value) => handleWeightChange('neighborhood', value[0])}
                      />
                      <span className="text-sm text-muted-foreground text-right">
                        {Math.round(weights.neighborhood * 100)}%
                      </span>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetWeights} 
                        className="w-full"
                      >
                        Reset to Default
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="presets">
                  <div className="grid gap-2">
                    <Button 
                      variant={activePreset === 'default' ? 'default' : 'outline'} 
                      className="justify-start"
                      onClick={() => applyWeightPreset(DEFAULT_WEIGHTS, 'default')}
                    >
                      <BarChart className="mr-2 h-4 w-4" />
                      Balanced (Default)
                    </Button>
                    
                    <Button 
                      variant={activePreset === 'value' ? 'default' : 'outline'} 
                      className="justify-start"
                      onClick={() => applyWeightPreset(VALUE_FOCUSED_WEIGHTS, 'value')}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Value Focused
                    </Button>
                    
                    <Button 
                      variant={activePreset === 'physical' ? 'default' : 'outline'} 
                      className="justify-start"
                      onClick={() => applyWeightPreset(PHYSICAL_FOCUSED_WEIGHTS, 'physical')}
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Physical Characteristics
                    </Button>
                    
                    <Button 
                      variant={activePreset === 'location' ? 'default' : 'outline'} 
                      className="justify-start"
                      onClick={() => applyWeightPreset(LOCATION_FOCUSED_WEIGHTS, 'location')}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Location Focused
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium">Similar Properties Count</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Slider
                        value={[similarCount]}
                        min={3}
                        max={10}
                        step={1}
                        onValueChange={(value) => setSimilarCount(value[0])}
                      />
                      <span className="w-8 text-sm text-muted-foreground">{similarCount}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Property Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Select a property to start comparing. You can select properties from the map or search for properties using the search button.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};