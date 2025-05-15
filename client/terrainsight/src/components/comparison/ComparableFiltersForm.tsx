import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { ComparableFilters } from '../../services/comparison/comparablesService';
import { SimilarityWeights } from '../../services/comparison/similarityService';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Home, 
  Ruler, 
  Calendar, 
  DollarSign,
  RefreshCw,
  Sliders,
  Search,
  SquareStack
} from 'lucide-react';

interface ComparableFiltersFormProps {
  baseProperty: Property;
  onApplyFilters: (filters: ComparableFilters) => void;
  className?: string;
}

/**
 * Form component for filtering comparable properties
 */
export const ComparableFiltersForm: React.FC<ComparableFiltersFormProps> = ({
  baseProperty,
  onApplyFilters,
  className = ''
}) => {
  // State for filter values
  const [maxDistance, setMaxDistance] = useState<number>(5);
  const [sameNeighborhood, setSameNeighborhood] = useState<boolean>(true);
  const [propertyType, setPropertyType] = useState<string>(baseProperty.propertyType || '');
  
  const [bedroomsMin, setBedroomsMin] = useState<string>('');
  const [bedroomsMax, setBedroomsMax] = useState<string>('');
  const [bathroomsMin, setBathroomsMin] = useState<string>('');
  const [bathroomsMax, setBathroomsMax] = useState<string>('');
  
  const [squareFeetMin, setSquareFeetMin] = useState<string>('');
  const [squareFeetMax, setSquareFeetMax] = useState<string>('');
  
  const [yearBuiltMin, setYearBuiltMin] = useState<string>('');
  const [yearBuiltMax, setYearBuiltMax] = useState<string>('');
  
  const [valueMin, setValueMin] = useState<string>('');
  const [valueMax, setValueMax] = useState<string>('');
  
  // Similarity weight sliders
  const [weights, setWeights] = useState<SimilarityWeights>({
    location: 0.4,
    features: 0.25,
    size: 0.25,
    age: 0.1
  });
  
  // Handle weight change
  const handleWeightChange = (key: keyof SimilarityWeights, value: number[]) => {
    setWeights(prev => ({
      ...prev,
      [key]: value[0]
    }));
  };
  
  // Reset filters to default values
  const handleReset = () => {
    setMaxDistance(5);
    setSameNeighborhood(true);
    setPropertyType(baseProperty.propertyType || '');
    
    setBedroomsMin('');
    setBedroomsMax('');
    setBathroomsMin('');
    setBathroomsMax('');
    
    setSquareFeetMin('');
    setSquareFeetMax('');
    
    setYearBuiltMin('');
    setYearBuiltMax('');
    
    setValueMin('');
    setValueMax('');
    
    setWeights({
      location: 0.4,
      features: 0.25,
      size: 0.25,
      age: 0.1
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build filters object
    const filters: ComparableFilters = {
      maxDistance,
      sameNeighborhood,
      propertyType: propertyType || undefined,
      weights
    };
    
    // Add range filters if values are provided
    if (bedroomsMin || bedroomsMax) {
      filters.bedrooms = {};
      if (bedroomsMin) filters.bedrooms.min = parseInt(bedroomsMin);
      if (bedroomsMax) filters.bedrooms.max = parseInt(bedroomsMax);
    }
    
    if (bathroomsMin || bathroomsMax) {
      filters.bathrooms = {};
      if (bathroomsMin) filters.bathrooms.min = parseInt(bathroomsMin);
      if (bathroomsMax) filters.bathrooms.max = parseInt(bathroomsMax);
    }
    
    if (squareFeetMin || squareFeetMax) {
      filters.squareFeet = {};
      if (squareFeetMin) filters.squareFeet.min = parseInt(squareFeetMin);
      if (squareFeetMax) filters.squareFeet.max = parseInt(squareFeetMax);
    }
    
    if (yearBuiltMin || yearBuiltMax) {
      filters.yearBuilt = {};
      if (yearBuiltMin) filters.yearBuilt.min = parseInt(yearBuiltMin);
      if (yearBuiltMax) filters.yearBuilt.max = parseInt(yearBuiltMax);
    }
    
    if (valueMin || valueMax) {
      filters.value = {};
      if (valueMin) filters.value.min = parseInt(valueMin);
      if (valueMax) filters.value.max = parseInt(valueMax);
    }
    
    onApplyFilters(filters);
  };
  
  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center">
          <Sliders className="h-5 w-5 mr-2" />
          Comparable Filters
        </h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          className="flex items-center"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
      
      <Accordion type="single" collapsible defaultValue="location" className="w-full">
        {/* Location Filters */}
        <AccordionItem value="location">
          <AccordionTrigger className="hover:no-underline py-2">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <span>Location</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1">
              <div className="space-y-2">
                <Label className="text-sm">Maximum Distance (km)</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[maxDistance]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={(val) => setMaxDistance(val[0])}
                    className="flex-1"
                  />
                  <span className="min-w-[40px] text-right text-sm text-gray-500">{maxDistance}km</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="same-neighborhood" 
                  checked={sameNeighborhood}
                  onCheckedChange={(checked) => setSameNeighborhood(checked as boolean)}
                />
                <Label 
                  htmlFor="same-neighborhood"
                  className="text-sm font-normal cursor-pointer"
                >
                  Same neighborhood only
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Property Characteristics */}
        <AccordionItem value="features">
          <AccordionTrigger className="hover:no-underline py-2">
            <div className="flex items-center">
              <Home className="h-4 w-4 mr-2 text-primary" />
              <span>Property Features</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1">
              <div className="space-y-2">
                <Label className="text-sm">Property Type</Label>
                <Input 
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  placeholder="Any property type"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Bedrooms (min)</Label>
                  <Input 
                    type="number"
                    value={bedroomsMin}
                    onChange={(e) => setBedroomsMin(e.target.value)}
                    placeholder="Min"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Bedrooms (max)</Label>
                  <Input 
                    type="number"
                    value={bedroomsMax}
                    onChange={(e) => setBedroomsMax(e.target.value)}
                    placeholder="Max"
                    min={0}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Bathrooms (min)</Label>
                  <Input 
                    type="number"
                    value={bathroomsMin}
                    onChange={(e) => setBathroomsMin(e.target.value)}
                    placeholder="Min"
                    min={0}
                    step="0.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Bathrooms (max)</Label>
                  <Input 
                    type="number"
                    value={bathroomsMax}
                    onChange={(e) => setBathroomsMax(e.target.value)}
                    placeholder="Max"
                    min={0}
                    step="0.5"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Size Filters */}
        <AccordionItem value="size">
          <AccordionTrigger className="hover:no-underline py-2">
            <div className="flex items-center">
              <SquareStack className="h-4 w-4 mr-2 text-primary" />
              <span>Size</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Square Feet (min)</Label>
                  <Input 
                    type="number"
                    value={squareFeetMin}
                    onChange={(e) => setSquareFeetMin(e.target.value)}
                    placeholder="Min"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Square Feet (max)</Label>
                  <Input 
                    type="number"
                    value={squareFeetMax}
                    onChange={(e) => setSquareFeetMax(e.target.value)}
                    placeholder="Max"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Year Built Filters */}
        <AccordionItem value="year">
          <AccordionTrigger className="hover:no-underline py-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <span>Year Built</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Year (min)</Label>
                  <Input 
                    type="number"
                    value={yearBuiltMin}
                    onChange={(e) => setYearBuiltMin(e.target.value)}
                    placeholder="Min"
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Year (max)</Label>
                  <Input 
                    type="number"
                    value={yearBuiltMax}
                    onChange={(e) => setYearBuiltMax(e.target.value)}
                    placeholder="Max"
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Value Filters */}
        <AccordionItem value="value">
          <AccordionTrigger className="hover:no-underline py-2">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              <span>Value</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Value (min)</Label>
                  <Input 
                    type="number"
                    value={valueMin}
                    onChange={(e) => setValueMin(e.target.value)}
                    placeholder="Min"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Value (max)</Label>
                  <Input 
                    type="number"
                    value={valueMax}
                    onChange={(e) => setValueMax(e.target.value)}
                    placeholder="Max"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Similarity Weights */}
        <AccordionItem value="weights">
          <AccordionTrigger className="hover:no-underline py-2">
            <div className="flex items-center">
              <Sliders className="h-4 w-4 mr-2 text-primary" />
              <span>Similarity Weights</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Location</Label>
                  <span className="text-xs text-gray-500">{(weights.location * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[weights.location]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(val) => handleWeightChange('location', val)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Features</Label>
                  <span className="text-xs text-gray-500">{(weights.features * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[weights.features]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(val) => handleWeightChange('features', val)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Size</Label>
                  <span className="text-xs text-gray-500">{(weights.size * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[weights.size]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(val) => handleWeightChange('size', val)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Age</Label>
                  <span className="text-xs text-gray-500">{(weights.age * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[weights.age]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={(val) => handleWeightChange('age', val)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Button type="submit" className="w-full">
        <Search className="h-4 w-4 mr-2" />
        Apply Filters
      </Button>
    </form>
  );
};