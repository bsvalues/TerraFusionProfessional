import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { formatCurrency, parseNumericValue } from '@/lib/utils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AlertCircle, Camera, Check, ClipboardList, Home, LayoutGrid, Save } from 'lucide-react';

interface PropertyInspectionFormProps {
  property: Property;
  onSubmit: (propertyId: number, updates: Partial<Property>) => void;
  onCancel: () => void;
  isStandalone: boolean;
}

/**
 * PropertyInspectionForm Component
 * 
 * A form for inspecting and updating property details during the review process.
 * Supports both standalone and integrated app modes through the isStandalone prop.
 */
const PropertyInspectionForm: React.FC<PropertyInspectionFormProps> = ({
  property,
  onSubmit,
  onCancel,
  isStandalone
}) => {
  // Form state
  const [formData, setFormData] = useState({
    propertyCondition: 'good',
    onSiteVerification: false,
    ownerContactMade: false,
    actualUse: property.propertyType || '',
    estimatedValue: property.estimatedValue || 0,
    squareFeet: property.squareFeet || 0,
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    yearBuilt: property.yearBuilt || 0,
    lotSize: property.lotSize || 0,
    notes: '',
    photos: [] as string[],
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    inspectionBy: 'John Doe'
  });

  // Discrepancies between recorded and observed data
  const [discrepancies, setDiscrepancies] = useState<string[]>([]);
  
  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check for discrepancies
    if (field === 'squareFeet' && value !== property.squareFeet) {
      if (!discrepancies.includes('squareFeet')) {
        setDiscrepancies([...discrepancies, 'squareFeet']);
      }
    } else if (field === 'bedrooms' && value !== property.bedrooms) {
      if (!discrepancies.includes('bedrooms')) {
        setDiscrepancies([...discrepancies, 'bedrooms']);
      }
    } else if (field === 'bathrooms' && value !== property.bathrooms) {
      if (!discrepancies.includes('bathrooms')) {
        setDiscrepancies([...discrepancies, 'bathrooms']);
      }
    } else if (field === 'yearBuilt' && value !== property.yearBuilt) {
      if (!discrepancies.includes('yearBuilt')) {
        setDiscrepancies([...discrepancies, 'yearBuilt']);
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for submission
    const updates: Partial<Property> = {
      propertyType: formData.actualUse,
      estimatedValue: formData.estimatedValue,
      squareFeet: formData.squareFeet,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      yearBuilt: formData.yearBuilt,
      lotSize: formData.lotSize,
      // We would update the attributes field with inspection results
      attributes: {
        ...(property.attributes as any || {}),
        lastInspection: {
          date: formData.inspectionDate,
          time: formData.inspectionTime,
          by: formData.inspectionBy,
          condition: formData.propertyCondition,
          onSiteVerification: formData.onSiteVerification,
          ownerContactMade: formData.ownerContactMade,
          notes: formData.notes,
          discrepancies: discrepancies
        }
      }
    };
    
    onSubmit(property.id, updates);
  };

  return (
    <Card className={cn(
      "h-full",
      isStandalone ? "bg-white" : "bg-gray-800 border-gray-700"
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Property Inspection: {property.address}</CardTitle>
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
              onClick={handleSubmit}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Inspection
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[calc(100vh-240px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Inspection Meta Information */}
            <div className={cn(
              "p-3 rounded-md",
              isStandalone ? "bg-slate-50" : "bg-gray-700"
            )}>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <ClipboardList className="h-4 w-4 mr-1.5" />
                Inspection Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="inspectionDate">Inspection Date</Label>
                  <Input
                    id="inspectionDate"
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => handleChange('inspectionDate', e.target.value)}
                    className={cn(
                      isStandalone ? "" : "bg-gray-800 border-gray-600"
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="inspectionTime">Inspection Time</Label>
                  <Input
                    id="inspectionTime"
                    type="time"
                    value={formData.inspectionTime}
                    onChange={(e) => handleChange('inspectionTime', e.target.value)}
                    className={cn(
                      isStandalone ? "" : "bg-gray-800 border-gray-600"
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="inspectionBy">Inspector</Label>
                  <Input
                    id="inspectionBy"
                    type="text"
                    value={formData.inspectionBy}
                    onChange={(e) => handleChange('inspectionBy', e.target.value)}
                    className={cn(
                      isStandalone ? "" : "bg-gray-800 border-gray-600"
                    )}
                  />
                </div>
              </div>
              
              <div className="flex space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="onSiteVerification" 
                    checked={formData.onSiteVerification}
                    onCheckedChange={(checked) => 
                      handleChange('onSiteVerification', Boolean(checked))
                    }
                  />
                  <label 
                    htmlFor="onSiteVerification" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    On-site Verification
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ownerContactMade" 
                    checked={formData.ownerContactMade}
                    onCheckedChange={(checked) => 
                      handleChange('ownerContactMade', Boolean(checked))
                    }
                  />
                  <label 
                    htmlFor="ownerContactMade" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Owner Contact Made
                  </label>
                </div>
              </div>
            </div>
            
            {/* Property Condition */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <Home className="h-4 w-4 mr-1.5" />
                Property Condition & Use
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyCondition">Property Condition</Label>
                  <Select 
                    value={formData.propertyCondition}
                    onValueChange={(value) => handleChange('propertyCondition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="dilapidated">Dilapidated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="actualUse">Actual Use</Label>
                  <Select 
                    value={formData.actualUse}
                    onValueChange={(value) => handleChange('actualUse', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select use" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="agricultural">Agricultural</SelectItem>
                      <SelectItem value="vacant">Vacant Land</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Property Characteristics
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="squareFeet">Square Footage</Label>
                  <Input
                    id="squareFeet"
                    type="number"
                    value={formData.squareFeet}
                    onChange={(e) => handleChange('squareFeet', parseInt(e.target.value))}
                    className={cn(
                      discrepancies.includes('squareFeet') ? "border-orange-400" : "",
                      isStandalone ? "" : "bg-gray-800 border-gray-600"
                    )}
                  />
                  {discrepancies.includes('squareFeet') && (
                    <div className="text-xs mt-1 text-orange-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Different from records ({property.squareFeet} sq ft)
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', parseInt(e.target.value))}
                    className={cn(
                      discrepancies.includes('bedrooms') ? "border-orange-400" : "",
                      isStandalone ? "" : "bg-gray-800 border-gray-600"
                    )}
                  />
                  {discrepancies.includes('bedrooms') && (
                    <div className="text-xs mt-1 text-orange-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Different from records ({property.bedrooms})
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange('bathrooms', parseFloat(e.target.value))}
                    className={cn(
                      discrepancies.includes('bathrooms') ? "border-orange-400" : "",
                      isStandalone ? "" : "bg-gray-800 border-gray-600"
                    )}
                  />
                  {discrepancies.includes('bathrooms') && (
                    <div className="text-xs mt-1 text-orange-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Different from records ({property.bathrooms})
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => handleChange('yearBuilt', parseInt(e.target.value))}
                    className={cn(
                      discrepancies.includes('yearBuilt') ? "border-orange-400" : "",
                      isStandalone ? "" : "bg-gray-800 border-gray-600"
                    )}
                  />
                  {discrepancies.includes('yearBuilt') && (
                    <div className="text-xs mt-1 text-orange-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Different from records ({property.yearBuilt})
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="lotSize">Lot Size (sq ft)</Label>
                  <Input
                    id="lotSize"
                    type="number"
                    value={formData.lotSize}
                    onChange={(e) => handleChange('lotSize', parseInt(e.target.value))}
                    className={cn(
                      isStandalone ? "" : "bg-gray-800 border-gray-600"
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="estimatedValue">Estimated Value</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => handleChange('estimatedValue', parseFloat(e.target.value))}
                    className={cn(
                      isStandalone ? "" : "bg-gray-800 border-gray-600"
                    )}
                  />
                </div>
              </div>
            </div>
            
            {/* Photo Documentation */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <Camera className="h-4 w-4 mr-1.5" />
                Photo Documentation
              </h3>
              
              <div className={cn(
                "border-2 border-dashed rounded-md py-8 flex flex-col items-center justify-center",
                isStandalone ? "border-gray-300 bg-gray-50" : "border-gray-700 bg-gray-900"
              )}>
                <Camera className={cn(
                  "h-8 w-8 mb-2",
                  isStandalone ? "text-gray-400" : "text-gray-500"
                )} />
                <p className="text-sm text-center mb-2">
                  Drag and drop photos here or click to browse
                </p>
                <Button variant="outline" size="sm">
                  Upload Photos
                </Button>
              </div>
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Inspector Notes</Label>
              <Textarea 
                id="notes"
                placeholder="Enter any additional observations or notes about the property..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className={cn(
                  "min-h-[120px]",
                  isStandalone ? "" : "bg-gray-800 border-gray-600"
                )}
              />
            </div>
            
            {/* Current Property Information */}
            <div className={cn(
              "p-4 rounded-md",
              isStandalone ? "bg-blue-50" : "bg-blue-900/20"
            )}>
              <h3 className={cn(
                "text-sm font-medium mb-3",
                isStandalone ? "text-blue-800" : "text-blue-300"
              )}>
                Current Property Records
              </h3>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className={cn(
                    "text-xs",
                    isStandalone ? "text-gray-500" : "text-gray-400"
                  )}>
                    Assessed Value
                  </span>
                  <p className="font-medium">{formatCurrency(property.value || 0)}</p>
                </div>
                
                <div>
                  <span className={cn(
                    "text-xs",
                    isStandalone ? "text-gray-500" : "text-gray-400"
                  )}>
                    Tax Assessment
                  </span>
                  <p className="font-medium">
                    {property.taxAssessment || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <span className={cn(
                    "text-xs",
                    isStandalone ? "text-gray-500" : "text-gray-400"
                  )}>
                    Last Sale Date
                  </span>
                  <p className="font-medium">
                    {property.lastSaleDate || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <span className={cn(
                    "text-xs",
                    isStandalone ? "text-gray-500" : "text-gray-400"
                  )}>
                    Last Sale Price
                  </span>
                  <p className="font-medium">
                    {property.salePrice ? formatCurrency(parseNumericValue(property.salePrice)) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className={cn(
        "border-t flex justify-between",
        isStandalone ? "border-gray-200" : "border-gray-700"
      )}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>
          <Check className="h-4 w-4 mr-1" />
          Save and Approve
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyInspectionForm;