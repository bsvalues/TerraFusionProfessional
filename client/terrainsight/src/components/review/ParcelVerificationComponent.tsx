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
import { AlertCircle, Check, GanttChartSquare, X, Save, MapPin, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, parseNumericValue } from '@/lib/utils';

interface ParcelVerificationComponentProps {
  property: Property;
  onVerify: (verified: boolean) => void;
  onCancel: () => void;
  isStandalone: boolean;
}

/**
 * ParcelVerificationComponent
 * 
 * A component for verifying property parcel information during the desktop review process.
 * Supports both standalone and integrated app modes through the isStandalone prop.
 */
const ParcelVerificationComponent: React.FC<ParcelVerificationComponentProps> = ({
  property,
  onVerify,
  onCancel,
  isStandalone
}) => {
  // Form state
  const [verificationChecks, setVerificationChecks] = useState({
    boundariesCorrect: true,
    addressCorrect: true,
    zoningCorrect: true,
    lotSizeCorrect: true,
    parcelIdCorrect: true,
    ownerInfoCorrect: true
  });
  
  const [notes, setNotes] = useState('');
  const [discrepancies, setDiscrepancies] = useState<string[]>([]);
  
  // Toggle verification check
  const toggleCheck = (checkName: keyof typeof verificationChecks) => {
    setVerificationChecks(prev => {
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
  
  // Handle verification submission
  const handleVerify = () => {
    // Check if all verifications pass
    const allChecksPass = Object.values(verificationChecks).every(value => value === true);
    onVerify(allChecksPass);
  };
  
  // Format discrepancy label for display
  const formatDiscrepancyLabel = (key: string): string => {
    switch(key) {
      case 'boundariesCorrect': return 'Parcel Boundaries';
      case 'addressCorrect': return 'Property Address';
      case 'zoningCorrect': return 'Zoning Designation';
      case 'lotSizeCorrect': return 'Lot Size';
      case 'parcelIdCorrect': return 'Parcel ID';
      case 'ownerInfoCorrect': return 'Owner Information';
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
            <CardTitle>Parcel Verification: {property.address}</CardTitle>
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
              onClick={handleVerify}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Verification
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: Map and parcel details */}
          <div className="space-y-6">
            {/* Map with parcel boundaries */}
            <div className={cn(
              "border rounded-md overflow-hidden",
              isStandalone ? "border-gray-200" : "border-gray-700"
            )}>
              <div className="flex items-center justify-between p-2 bg-primary/10">
                <div className="flex items-center">
                  <Map className="h-4 w-4 mr-1.5 text-primary" />
                  <span className="text-sm font-medium">Parcel Boundaries</span>
                </div>
                <Badge variant="outline" className="text-xs">GIS Data</Badge>
              </div>
              
              {/* Mock map display - in a real app we'd use a mapping library */}
              <div className="bg-gray-100 dark:bg-gray-700 h-[300px] w-full flex items-center justify-center relative">
                {/* This would be a real map in production */}
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Interactive parcel map would be displayed here</p>
                  <p className="text-xs mt-1">Showing boundaries for parcel {property.parcelId}</p>
                </div>
                
                {/* Mock overlay showing parcel boundaries */}
                <div className="absolute inset-0 pointer-events-none">
                  <svg width="100%" height="100%" viewBox="0 0 400 300" className="opacity-60">
                    <polygon 
                      points="100,50 300,100 250,220 80,180" 
                      fill="rgba(59, 130, 246, 0.2)" 
                      stroke="#3b82f6" 
                      strokeWidth="2" 
                    />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Verification Checklist */}
            <div className={cn(
              "p-4 rounded-md border",
              isStandalone ? "border-gray-200" : "border-gray-700"
            )}>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <GanttChartSquare className="h-4 w-4 mr-1.5 text-primary" />
                Verification Checklist
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="boundariesCorrect" 
                    checked={verificationChecks.boundariesCorrect}
                    onCheckedChange={() => toggleCheck('boundariesCorrect')}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="boundariesCorrect"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Parcel boundaries are accurate
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Verify that GIS parcel boundaries match legal description
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="addressCorrect" 
                    checked={verificationChecks.addressCorrect}
                    onCheckedChange={() => toggleCheck('addressCorrect')}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="addressCorrect"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Property address is correct
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Confirm address matches county records and is properly formatted
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="zoningCorrect" 
                    checked={verificationChecks.zoningCorrect}
                    onCheckedChange={() => toggleCheck('zoningCorrect')}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="zoningCorrect"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Zoning designation is correct
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Verify zoning matches current municipal zoning maps
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="lotSizeCorrect" 
                    checked={verificationChecks.lotSizeCorrect}
                    onCheckedChange={() => toggleCheck('lotSizeCorrect')}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="lotSizeCorrect"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Lot size is accurate
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Confirm recorded lot size matches GIS calculations
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="parcelIdCorrect" 
                    checked={verificationChecks.parcelIdCorrect}
                    onCheckedChange={() => toggleCheck('parcelIdCorrect')}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="parcelIdCorrect"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Parcel ID is consistent
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Verify parcel/APN identifier matches across all systems
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="ownerInfoCorrect" 
                    checked={verificationChecks.ownerInfoCorrect}
                    onCheckedChange={() => toggleCheck('ownerInfoCorrect')}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="ownerInfoCorrect"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Owner information is current
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Confirm ownership information is up-to-date with deed records
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Verification Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Verification Notes</Label>
              <Textarea 
                id="notes"
                placeholder="Enter any issues or discrepancies found during verification..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn(
                  "min-h-[120px]",
                  isStandalone ? "" : "bg-gray-800 border-gray-600"
                )}
              />
            </div>
          </div>
          
          {/* Right column: Property details and discrepancies */}
          <div className="space-y-6">
            {/* Property Details */}
            <div className={cn(
              "p-4 rounded-md border",
              isStandalone ? "border-gray-200 bg-gray-50" : "border-gray-700 bg-gray-900"
            )}>
              <h3 className="text-sm font-medium mb-3">Property Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Parcel ID</span>
                    <p className="font-medium">{property.parcelId}</p>
                  </div>
                  
                  <div>
                    <span className="text-xs text-muted-foreground">Owner</span>
                    <p className="font-medium">{property.owner || 'Not available'}</p>
                  </div>
                  
                  <div>
                    <span className="text-xs text-muted-foreground">Address</span>
                    <p className="font-medium">{property.address}</p>
                  </div>
                  
                  <div>
                    <span className="text-xs text-muted-foreground">Zoning</span>
                    <p className="font-medium">{property.zoning || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <span className="text-xs text-muted-foreground">Lot Size</span>
                    <p className="font-medium">
                      {property.lotSize 
                        ? `${property.lotSize.toLocaleString()} sq ft`
                        : 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-xs text-muted-foreground">Neighborhood</span>
                    <p className="font-medium">{property.neighborhood || 'Not assigned'}</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-muted-foreground">Property Description</span>
                  <p className="text-sm mt-1">
                    {property.propertyType || 'Residential'} property located in {property.neighborhood || 'Benton County'}.
                    Built in {property.yearBuilt || 'N/A'}.
                    {property.bedrooms && property.bathrooms ? 
                      ` ${property.bedrooms} bed / ${property.bathrooms} bath.` : ''}
                    Last sold {property.lastSaleDate || 'N/A'} for {property.salePrice || 'N/A'}.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Aerial Imagery */}
            <div className={cn(
              "border rounded-md overflow-hidden",
              isStandalone ? "border-gray-200" : "border-gray-700"
            )}>
              <div className="flex items-center justify-between p-2 bg-primary/10">
                <div className="flex items-center">
                  <Map className="h-4 w-4 mr-1.5 text-primary" />
                  <span className="text-sm font-medium">Aerial Imagery</span>
                </div>
                <Badge variant="outline" className="text-xs">Satellite</Badge>
              </div>
              
              {/* Mock aerial image */}
              <div className="h-[200px] w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p>Aerial imagery would be displayed here</p>
                </div>
              </div>
            </div>
            
            {/* Discrepancies Found */}
            {discrepancies.length > 0 && (
              <div className={cn(
                "p-4 rounded-md",
                isStandalone ? "bg-amber-50 border border-amber-200" : "bg-amber-900/20 border border-amber-800"
              )}>
                <h3 className={cn(
                  "text-sm font-medium mb-3 flex items-center",
                  isStandalone ? "text-amber-800" : "text-amber-400"
                )}>
                  <AlertCircle className="h-4 w-4 mr-1.5" />
                  Discrepancies Found
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
                    These discrepancies should be resolved before approving the parcel verification.
                  </p>
                </div>
              </div>
            )}
            
            {/* Verification Status */}
            <div className={cn(
              "p-4 rounded-md border",
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
                Verification Status
              </h3>
              
              <p className="text-sm">
                {discrepancies.length === 0
                  ? "All parcel information has been verified and is correct."
                  : `There are ${discrepancies.length} discrepancies that need to be resolved.`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className={cn(
        "border-t flex justify-between",
        isStandalone ? "border-gray-200" : "border-gray-700"
      )}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        
        {discrepancies.length === 0 ? (
          <Button variant="default" onClick={() => onVerify(true)}>
            <Check className="h-4 w-4 mr-1" />
            Verify and Approve
          </Button>
        ) : (
          <Button variant="destructive" onClick={() => onVerify(false)}>
            <X className="h-4 w-4 mr-1" />
            Mark as Rejected
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ParcelVerificationComponent;