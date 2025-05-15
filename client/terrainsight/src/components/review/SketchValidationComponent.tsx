import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  Check, 
  FileText, 
  Layers, 
  Ruler, 
  X, 
  Save, 
  PenTool, 
  ScanLine, 
  Maximize, 
  Minimize, 
  PlusCircle, 
  RotateCcw, 
  RotateCw, 
  MousePointer
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, parseNumericValue } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SketchValidationComponentProps {
  property: Property;
  onValidate: (valid: boolean) => void;
  onCancel: () => void;
  isStandalone: boolean;
}

/**
 * SketchValidationComponent
 * 
 * A component for validating property sketches and floor plans during the desktop review process.
 * Supports both standalone and integrated app modes through the isStandalone prop.
 */
const SketchValidationComponent: React.FC<SketchValidationComponentProps> = ({
  property,
  onValidate,
  onCancel,
  isStandalone
}) => {
  // Form state
  const [validationChecks, setValidationChecks] = useState({
    dimensionsAccurate: true,
    squareFootageCorrect: true,
    roomCountCorrect: true,
    floorPlanAccurate: true,
    featuresCorrect: true,
    detachedStructuresIncluded: true
  });
  
  const [notes, setNotes] = useState('');
  const [discrepancies, setDiscrepancies] = useState<string[]>([]);
  const [sketchMode, setSketchMode] = useState<'view' | 'edit'>('view');
  
  // Toggle validation check
  const toggleCheck = (checkName: keyof typeof validationChecks) => {
    setValidationChecks(prev => {
      const newValue = !prev[checkName];
      
      // Update discrepancies list
      if (!newValue) {
        if (!discrepancies.includes(checkName)) {
          setDiscrepancies([...discrepancies, checkName]);
        }
      } else {
        setDiscrepancies(discrepancies.filter(d => d !== checkName));
      }
      
      return { ...prev, [checkName]: newValue };
    });
  };
  
  // Handle validation submission
  const handleValidate = () => {
    // Check if all validations pass
    const allChecksPass = Object.values(validationChecks).every(value => value === true);
    onValidate(allChecksPass);
  };
  
  // Format discrepancy label for display
  const formatDiscrepancyLabel = (key: string): string => {
    switch(key) {
      case 'dimensionsAccurate': return 'Building Dimensions';
      case 'squareFootageCorrect': return 'Square Footage Calculation';
      case 'roomCountCorrect': return 'Room Count';
      case 'floorPlanAccurate': return 'Floor Plan Layout';
      case 'featuresCorrect': return 'Property Features';
      case 'detachedStructuresIncluded': return 'Detached Structures';
      default: return key;
    }
  };

  return (
    <Card className={cn(
      "h-full",
      isStandalone ? "bg-white" : "bg-gray-800 border-gray-700"
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Sketch Validation: {property.address}</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              Parcel ID: {property.parcelId} • {property.propertyType || 'Property'}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleValidate}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Validation
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column: Sketch view (larger) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sketch viewer/editor */}
            <div className={cn(
              "border rounded-md overflow-hidden",
              isStandalone ? "border-gray-200" : "border-gray-700"
            )}>
              {/* Toolbar */}
              <div className="flex items-center justify-between p-2 bg-primary/10">
                <div className="flex items-center">
                  <Layers className="h-4 w-4 mr-1.5 text-primary" />
                  <span className="text-sm font-medium">Property Sketch</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={() => setSketchMode(sketchMode === 'view' ? 'edit' : 'view')}
                  >
                    {sketchMode === 'view' ? (
                      <PenTool className="h-4 w-4 text-primary" />
                    ) : (
                      <MousePointer className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Maximize className="h-4 w-4" />
                  </Button>
                  
                  <Badge variant="outline" className="text-xs">
                    {sketchMode === 'view' ? 'View Mode' : 'Edit Mode'}
                  </Badge>
                </div>
              </div>
              
              {/* Drawing tools (only shown in edit mode) */}
              {sketchMode === 'edit' && (
                <div className={cn(
                  "p-2 border-b flex items-center space-x-1",
                  isStandalone ? "border-gray-200 bg-gray-50" : "border-gray-700 bg-gray-900"
                )}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <Ruler className="h-3 w-3 mr-1" />
                    Measure
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Add Room
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <RotateCw className="h-3 w-3 mr-1" />
                    Rotate
                  </Button>
                  
                  <Separator orientation="vertical" className="h-5 mx-1" />
                  
                  <select 
                    className={cn(
                      "text-xs h-7 px-2 rounded border",
                      isStandalone ? "border-gray-200" : "border-gray-700 bg-gray-800"
                    )}
                  >
                    <option value="wall">Wall</option>
                    <option value="door">Door</option>
                    <option value="window">Window</option>
                    <option value="stair">Staircase</option>
                    <option value="fixture">Fixture</option>
                  </select>
                </div>
              )}
              
              {/* Mock sketch display - in a real app we'd use a canvas or SVG editor */}
              <div className="bg-white dark:bg-gray-900 h-[400px] w-full relative overflow-hidden">
                {/* This would be a real interactive sketch in production */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 800 600"
                  className="absolute inset-0"
                >
                  {/* Simple house floor plan */}
                  <g stroke="#333" strokeWidth="2" fill="none">
                    {/* Outer walls */}
                    <rect x="100" y="100" width="600" height="400" />
                    
                    {/* Interior walls */}
                    <line x1="400" y1="100" x2="400" y2="500" />
                    <line x1="100" y1="300" x2="400" y2="300" />
                    <line x1="400" y1="200" x2="700" y2="200" />
                    <line x1="550" y1="200" x2="550" y2="500" />
                    
                    {/* Doors */}
                    <path d="M390,300 A50,50 0 0,1 390,350" fill="none" />
                    <line x1="400" y1="170" x2="450" y2="170" />
                    <line x1="525" y1="200" x2="525" y2="250" />
                    
                    {/* Windows */}
                    <line x1="200" y1="100" x2="300" y2="100" strokeWidth="6" stroke="#99ccff" />
                    <line x1="450" y1="100" x2="550" y2="100" strokeWidth="6" stroke="#99ccff" />
                    <line x1="100" y1="400" x2="100" y2="450" strokeWidth="6" stroke="#99ccff" />
                    <line x1="700" y1="300" x2="700" y2="400" strokeWidth="6" stroke="#99ccff" />
                    
                    {/* Room labels */}
                    <text x="200" y="200" fill="#666" className="text-sm">Living Room</text>
                    <text x="200" y="400" fill="#666" className="text-sm">Bedroom</text>
                    <text x="500" y="150" fill="#666" className="text-sm">Kitchen</text>
                    <text x="450" y="350" fill="#666" className="text-sm">Bathroom</text>
                    <text x="600" y="350" fill="#666" className="text-sm">Bedroom</text>
                    
                    {/* Dimensions */}
                    <text x="350" y="90" fill="#0066cc" className="text-xs font-mono">20'</text>
                    <text x="710" y="300" fill="#0066cc" className="text-xs font-mono">15'</text>
                    <text x="200" y="510" fill="#0066cc" className="text-xs font-mono">30'</text>
                    <text x="90" y="200" fill="#0066cc" className="text-xs font-mono">13'</text>
                  </g>
                </svg>
                
                {/* Overlay text for mock sketch */}
                <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded shadow text-xs">
                  <div className="font-mono">Total Area: 2,400 sq ft</div>
                  <div className="font-mono">Scale: 1" = 10'</div>
                </div>
              </div>
            </div>
            
            {/* Validation Checklist */}
            <div className={cn(
              "p-4 rounded-md border",
              isStandalone ? "border-gray-200" : "border-gray-700"
            )}>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-1.5 text-primary" />
                Sketch Validation Checklist
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="dimensionsAccurate" 
                    checked={validationChecks.dimensionsAccurate}
                    onCheckedChange={() => toggleCheck('dimensionsAccurate')}
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor="dimensionsAccurate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Building dimensions are accurate
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Verify measurements match property records
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="squareFootageCorrect" 
                    checked={validationChecks.squareFootageCorrect}
                    onCheckedChange={() => toggleCheck('squareFootageCorrect')}
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor="squareFootageCorrect"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Square footage calculation correct
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Ensure area calculation matches sketch dimensions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="roomCountCorrect" 
                    checked={validationChecks.roomCountCorrect}
                    onCheckedChange={() => toggleCheck('roomCountCorrect')}
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor="roomCountCorrect"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Room count is correct
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Verify bedroom, bathroom, and other room counts
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="floorPlanAccurate" 
                    checked={validationChecks.floorPlanAccurate}
                    onCheckedChange={() => toggleCheck('floorPlanAccurate')}
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor="floorPlanAccurate"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Floor plan layout is accurate
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Confirm room arrangement and building layout
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="featuresCorrect" 
                    checked={validationChecks.featuresCorrect}
                    onCheckedChange={() => toggleCheck('featuresCorrect')}
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor="featuresCorrect"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Property features correctly shown
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Check for fireplaces, built-ins, special features
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="detachedStructuresIncluded" 
                    checked={validationChecks.detachedStructuresIncluded}
                    onCheckedChange={() => toggleCheck('detachedStructuresIncluded')}
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor="detachedStructuresIncluded"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Detached structures included
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Verify garages, sheds, and other structures
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Property details and validation info */}
          <div className="lg:col-span-2 space-y-6">
            <ScrollArea className="h-[calc(100vh-240px)]">
              {/* Property Physical Characteristics */}
              <div className={cn(
                "p-4 rounded-md border",
                isStandalone ? "border-gray-200 bg-gray-50" : "border-gray-700 bg-gray-900"
              )}>
                <h3 className="text-sm font-medium mb-3">Physical Characteristics</h3>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>
                      <span className="text-xs text-muted-foreground">Square Feet</span>
                      <p className="font-medium">{property.squareFeet?.toLocaleString() || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground">Lot Size</span>
                      <p className="font-medium">
                        {property.lotSize 
                          ? `${property.lotSize.toLocaleString()} sq ft`
                          : 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground">Year Built</span>
                      <p className="font-medium">{property.yearBuilt || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground">Property Type</span>
                      <p className="font-medium">{property.propertyType || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground">Bedrooms</span>
                      <p className="font-medium">{property.bedrooms || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-muted-foreground">Bathrooms</span>
                      <p className="font-medium">{property.bathrooms || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Related Images */}
              <div className={cn(
                "p-4 rounded-md border mt-4",
                isStandalone ? "border-gray-200" : "border-gray-700"
              )}>
                <h3 className="text-sm font-medium mb-3">Related Imagery</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className={cn(
                    "aspect-video rounded bg-gray-100 flex items-center justify-center",
                    isStandalone ? "bg-gray-100" : "bg-gray-800"
                  )}>
                    <ScanLine className="h-6 w-6 text-gray-400" />
                  </div>
                  
                  <div className={cn(
                    "aspect-video rounded bg-gray-100 flex items-center justify-center",
                    isStandalone ? "bg-gray-100" : "bg-gray-800"
                  )}>
                    <ScanLine className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  Property photos would be displayed here
                </div>
              </div>
              
              {/* Discrepancies Found */}
              {discrepancies.length > 0 && (
                <div className={cn(
                  "p-4 rounded-md mt-4",
                  isStandalone ? "bg-amber-50 border border-amber-200" : "bg-amber-900/20 border border-amber-800"
                )}>
                  <h3 className={cn(
                    "text-sm font-medium mb-3 flex items-center",
                    isStandalone ? "text-amber-800" : "text-amber-400"
                  )}>
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    Sketch Discrepancies Found
                  </h3>
                  
                  <ul className="space-y-2">
                    {discrepancies.map((discrepancy) => (
                      <li key={discrepancy} className="text-sm flex items-start">
                        <X className={cn(
                          "h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0",
                          isStandalone ? "text-red-500" : "text-red-400"
                        )} />
                        <span>
                          {formatDiscrepancyLabel(discrepancy)} issue detected
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                    <p className={cn(
                      "text-sm",
                      isStandalone ? "text-amber-800" : "text-amber-400"
                    )}>
                      These sketch discrepancies should be corrected before approval.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Validation Notes */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="notes">Validation Notes</Label>
                <Textarea 
                  id="notes"
                  placeholder="Enter any issues or discrepancies found during sketch validation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={cn(
                    "min-h-[120px]",
                    isStandalone ? "" : "bg-gray-800 border-gray-600"
                  )}
                />
              </div>
              
              {/* Validation Status */}
              <div className={cn(
                "p-4 rounded-md border mt-4",
                discrepancies.length === 0
                  ? (isStandalone ? "bg-green-50 border-green-200" : "bg-green-900/20 border-green-800")
                  : (isStandalone ? "bg-red-50 border-red-200" : "bg-red-900/20 border-red-800")
              )}>
                <h3 className={cn(
                  "text-sm font-medium mb-1",
                  discrepancies.length === 0
                    ? (isStandalone ? "text-green-800" : "text-green-400")
                    : (isStandalone ? "text-red-800" : "text-red-400")
                )}>
                  Validation Status
                </h3>
                
                <p className="text-sm">
                  {discrepancies.length === 0
                    ? "All sketch elements have been validated and are correct."
                    : `There are ${discrepancies.length} sketch discrepancies that need to be resolved.`}
                </p>
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className={cn(
        "border-t flex justify-between",
        isStandalone ? "border-gray-200" : "border-gray-700"
      )}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        
        {discrepancies.length === 0 ? (
          <Button variant="default" onClick={() => onValidate(true)}>
            <Check className="h-4 w-4 mr-1" />
            Validate and Approve
          </Button>
        ) : (
          <Button variant="destructive" onClick={() => onValidate(false)}>
            <X className="h-4 w-4 mr-1" />
            Mark as Rejected
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default SketchValidationComponent;