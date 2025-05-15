import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Info, AlertTriangle } from 'lucide-react';
import { Property } from '../../shared/schema';
import { formatCurrency } from '@/lib/utils';
import { estimatePropertyTax, formatTaxSummary, parsePropertyValue } from '../../services/taxEstimatorService';
import TaxRatesPanel from './TaxRatesPanel';
import TaxExemptionsPanel from './TaxExemptionsPanel';
import PropertyTaxBreakdownChart from './PropertyTaxBreakdownChart';

export interface TaxEstimateOptions {
  includeCounty: boolean;
  includeCity: boolean;
  includeSchoolDistrict: boolean;
  includeFireDistrict: boolean;
  includeLibraryDistrict: boolean;
  includeHospitalDistrict: boolean;
  includePortDistrict: boolean;
  includeStateSchool: boolean;
  homesteadExemption: boolean;
  seniorExemption: boolean;
  disabilityExemption: boolean;
  veteranExemption: boolean;
  historicPropertyExemption: boolean;
  agriculturalExemption: boolean;
  exemptionAmount: number;
}

export interface TaxEstimateBreakdown {
  county: number;
  city: number;
  schoolDistrict: number;
  fireDistrict: number;
  libraryDistrict: number;
  hospitalDistrict: number;
  portDistrict: number;
  stateSchool: number;
  total: number;
  effectiveRate: number;
  exemptions: {
    total: number;
  };
}

interface PropertyTaxEstimatorProps {
  property: Property;
}

const PropertyTaxEstimator: React.FC<PropertyTaxEstimatorProps> = ({ property }) => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [useCustomValue, setUseCustomValue] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [taxEstimate, setTaxEstimate] = useState<TaxEstimateBreakdown | null>(null);
  const [options, setOptions] = useState<TaxEstimateOptions>({
    includeCounty: true,
    includeCity: true,
    includeSchoolDistrict: true,
    includeFireDistrict: true,
    includeLibraryDistrict: true,
    includeHospitalDistrict: true,
    includePortDistrict: true,
    includeStateSchool: true,
    homesteadExemption: false,
    seniorExemption: false,
    disabilityExemption: false,
    veteranExemption: false,
    historicPropertyExemption: false,
    agriculturalExemption: false,
    exemptionAmount: 0
  });

  // Update an option value
  const handleOptionChange = (key: keyof TaxEstimateOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Update a tax rate
  const handleRateChange = (key: string, value: number) => {
    // This would be handled by the TaxRatesPanel component
    console.log(`Rate changed: ${key} = ${value}`);
  };

  // Calculate the estimated tax
  const calculateTax = () => {
    // Clone property for calculations
    const propertyForCalculation = { ...property };
    
    // Use custom value if specified
    if (useCustomValue && customValue) {
      propertyForCalculation.value = `$${parseFloat(customValue).toLocaleString()}`;
    }
    
    // Calculate tax estimate
    const estimate = estimatePropertyTax(propertyForCalculation, options);
    setTaxEstimate(estimate);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-1">Property Tax Estimator</h3>
        <p className="text-sm text-muted-foreground">
          Estimate annual property taxes for {property.address} based on current rates and exemptions.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="rates">Tax Rates</TabsTrigger>
          <TabsTrigger value="exemptions">Exemptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator" className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="custom-value" 
                checked={useCustomValue}
                onCheckedChange={setUseCustomValue}
              />
              <Label htmlFor="custom-value">Custom Value</Label>
            </div>
            
            {useCustomValue && (
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter property value"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-2">Include Tax Districts</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="county" 
                    checked={options.includeCounty}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeCounty', checked === true)
                    }
                  />
                  <Label htmlFor="county">County</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="city" 
                    checked={options.includeCity}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeCity', checked === true)
                    }
                  />
                  <Label htmlFor="city">City</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="school" 
                    checked={options.includeSchoolDistrict}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeSchoolDistrict', checked === true)
                    }
                  />
                  <Label htmlFor="school">School District</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="fire" 
                    checked={options.includeFireDistrict}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeFireDistrict', checked === true)
                    }
                  />
                  <Label htmlFor="fire">Fire District</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="library" 
                    checked={options.includeLibraryDistrict}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeLibraryDistrict', checked === true)
                    }
                  />
                  <Label htmlFor="library">Library District</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hospital" 
                    checked={options.includeHospitalDistrict}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeHospitalDistrict', checked === true)
                    }
                  />
                  <Label htmlFor="hospital">Hospital District</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="port" 
                    checked={options.includePortDistrict}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includePortDistrict', checked === true)
                    }
                  />
                  <Label htmlFor="port">Port District</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="state-school" 
                    checked={options.includeStateSchool}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeStateSchool', checked === true)
                    }
                  />
                  <Label htmlFor="state-school">State School</Label>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Common Exemptions</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="homestead" 
                    checked={options.homesteadExemption}
                    onCheckedChange={(checked) => 
                      handleOptionChange('homesteadExemption', checked === true)
                    }
                  />
                  <Label htmlFor="homestead">Homestead</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="senior" 
                    checked={options.seniorExemption}
                    onCheckedChange={(checked) => 
                      handleOptionChange('seniorExemption', checked === true)
                    }
                  />
                  <Label htmlFor="senior">Senior</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="veteran" 
                    checked={options.veteranExemption}
                    onCheckedChange={(checked) => 
                      handleOptionChange('veteranExemption', checked === true)
                    }
                  />
                  <Label htmlFor="veteran">Veteran</Label>
                </div>
              </div>
            </div>
            
            <Button onClick={calculateTax} className="mt-2">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Property Tax
            </Button>
          </div>
          
          {taxEstimate && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Tax Estimate Summary</CardTitle>
                <CardDescription>
                  Annual property tax estimate for {
                    useCustomValue && customValue 
                      ? formatCurrency(parseFloat(customValue)) 
                      : property.value
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(taxEstimate.total)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Effective Rate: {taxEstimate.effectiveRate.toFixed(3)}%
                    </p>
                  </div>
                  
                  <Alert className="w-2/3 bg-muted">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {formatTaxSummary(taxEstimate)}
                    </AlertDescription>
                  </Alert>
                </div>
                
                <PropertyTaxBreakdownChart breakdown={taxEstimate} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="rates">
          <TaxRatesPanel 
            options={options} 
            onRateChange={handleRateChange}
            property={property}
          />
        </TabsContent>
        
        <TabsContent value="exemptions">
          <TaxExemptionsPanel 
            options={options}
            onOptionChange={handleOptionChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyTaxEstimator;