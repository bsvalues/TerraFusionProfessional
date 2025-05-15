/**
 * CostApproachPanel.tsx
 * 
 * UI component for displaying and editing cost approach valuations
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Calculator, 
  Building, 
  Home, 
  Plus, 
  Trash, 
  Info, 
  AlertTriangle, 
  BarChart, 
  DollarSign
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Property } from '@shared/schema';
import { 
  CostApproachProperty, 
  CostApproachResult, 
  ConstructionQuality,
  BuildingComponent, 
  costApproachService 
} from '../../services/cost/CostApproachService';

interface CostApproachPanelProps {
  property?: Property;
  onAnalysisComplete?: (result: CostApproachResult) => void;
  className?: string;
}

export function CostApproachPanel({ 
  property, 
  onAnalysisComplete,
  className 
}: CostApproachPanelProps) {
  // State for cost approach property details
  const [costProperty, setCostProperty] = useState<CostApproachProperty | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponent, setNewComponent] = useState<BuildingComponent>({
    type: '',
    value: 0,
    effectiveAge: 0,
    totalEconomicLife: 50
  });
  const [result, setResult] = useState<CostApproachResult | null>(null);
  
  // Initialize from property if available
  useEffect(() => {
    if (property) {
      // Convert Property to CostApproachProperty
      setCostProperty({
        id: property.id?.toString() || '',
        parcelId: property.parcelId || '',
        address: property.address || '',
        propertyType: property.propertyType || 'Residential',
        squareFeet: property.squareFeet || 0,
        yearBuilt: property.yearBuilt || 0,
        landValue: property.landValue ? parseFloat(property.landValue.replace(/[^0-9.-]+/g, '')) : 0,
        constructionQuality: ConstructionQuality.AVERAGE,
        buildingComponents: [],
        externalObsolescence: 0,
        functionalObsolescence: 0,
        constructionDate: property.yearBuilt ? new Date(property.yearBuilt, 0, 1) : new Date(),
        neighborhood: property.neighborhood || '',
        marketCondition: 'Stable'
      });
    }
  }, [property]);
  
  // Add new building component
  const handleAddComponent = () => {
    if (!costProperty || !newComponent.type || newComponent.value <= 0) return;
    
    setCostProperty({
      ...costProperty,
      buildingComponents: [
        ...costProperty.buildingComponents,
        { ...newComponent }
      ]
    });
    
    // Reset component form
    setNewComponent({
      type: '',
      value: 0,
      effectiveAge: 0,
      totalEconomicLife: 50
    });
    
    setShowAddComponent(false);
  };
  
  // Delete a building component
  const handleDeleteComponent = (index: number) => {
    if (!costProperty) return;
    
    const updatedComponents = [...costProperty.buildingComponents];
    updatedComponents.splice(index, 1);
    
    setCostProperty({
      ...costProperty,
      buildingComponents: updatedComponents
    });
  };
  
  // Update property field
  const handleUpdateProperty = <K extends keyof CostApproachProperty>(
    field: K, 
    value: CostApproachProperty[K]
  ) => {
    if (!costProperty) return;
    
    setCostProperty({
      ...costProperty,
      [field]: value
    });
  };
  
  // Run the cost approach analysis
  const runAnalysis = () => {
    if (!costProperty) return;
    
    // Perform cost approach valuation
    const analysisResult = costApproachService.analyzeProperty(costProperty);
    
    // Update state
    setResult(analysisResult);
    
    // Call callback if provided
    if (onAnalysisComplete) {
      onAnalysisComplete(analysisResult);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Component options
  const componentTypes = [
    'Foundation', 
    'Framing', 
    'Roofing', 
    'Exterior Walls', 
    'Windows & Doors',
    'HVAC', 
    'Electrical', 
    'Plumbing', 
    'Interior Finishes', 
    'Flooring',
    'Kitchen', 
    'Bathrooms', 
    'Insulation', 
    'Garage', 
    'Other'
  ];
  
  if (!costProperty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Cost Approach Analysis</CardTitle>
          <CardDescription>
            Select a property to perform cost approach valuation
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5 text-primary" />
          Cost Approach Analysis
        </CardTitle>
        <CardDescription>
          Estimate property value based on replacement cost and depreciation
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid grid-cols-3 mx-6">
          <TabsTrigger value="components">Building Components</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="components" className="p-6 pt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Building Components</h3>
              <Button 
                size="sm" 
                onClick={() => setShowAddComponent(true)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Component
              </Button>
            </div>
            
            {costProperty.buildingComponents.length === 0 ? (
              <div className="p-8 text-center border rounded-md bg-muted/50">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Components Added Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Add building components to calculate replacement cost
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Effective Age</TableHead>
                    <TableHead className="text-right">Economic Life</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costProperty.buildingComponents.map((component, index) => (
                    <TableRow key={`${component.type}-${index}`}>
                      <TableCell>{component.type}</TableCell>
                      <TableCell className="text-right">{formatCurrency(component.value)}</TableCell>
                      <TableCell className="text-right">{component.effectiveAge} years</TableCell>
                      <TableCell className="text-right">{component.totalEconomicLife} years</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteComponent(index)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {showAddComponent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Building Component</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="component-type">Component Type</Label>
                      <Select
                        value={newComponent.type}
                        onValueChange={(value) => setNewComponent({...newComponent, type: value})}
                      >
                        <SelectTrigger id="component-type">
                          <SelectValue placeholder="Select component type" />
                        </SelectTrigger>
                        <SelectContent>
                          {componentTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="component-value">Value</Label>
                      <Input
                        id="component-value"
                        type="number"
                        min="0"
                        value={newComponent.value || ''}
                        onChange={(e) => setNewComponent({
                          ...newComponent, 
                          value: e.target.value ? parseFloat(e.target.value) : 0
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="effective-age">Effective Age (years)</Label>
                      <Input
                        id="effective-age"
                        type="number"
                        min="0"
                        value={newComponent.effectiveAge || ''}
                        onChange={(e) => setNewComponent({
                          ...newComponent, 
                          effectiveAge: e.target.value ? parseInt(e.target.value) : 0
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="economic-life">Economic Life (years)</Label>
                      <Input
                        id="economic-life"
                        type="number"
                        min="1"
                        value={newComponent.totalEconomicLife || ''}
                        onChange={(e) => setNewComponent({
                          ...newComponent, 
                          totalEconomicLife: e.target.value ? parseInt(e.target.value) : 1
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setShowAddComponent(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddComponent}>
                    Add Component
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="adjustments" className="p-6 pt-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="land-value">Land Value</Label>
                  <Input
                    id="land-value"
                    type="number"
                    min="0"
                    value={costProperty.landValue || ''}
                    onChange={(e) => handleUpdateProperty(
                      'landValue', 
                      e.target.value ? parseFloat(e.target.value) : 0
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="construction-quality">Construction Quality</Label>
                  <Select
                    value={costProperty.constructionQuality}
                    onValueChange={(value) => handleUpdateProperty(
                      'constructionQuality',
                      value as ConstructionQuality
                    )}
                  >
                    <SelectTrigger id="construction-quality">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ConstructionQuality.POOR}>Poor</SelectItem>
                      <SelectItem value={ConstructionQuality.FAIR}>Fair</SelectItem>
                      <SelectItem value={ConstructionQuality.AVERAGE}>Average</SelectItem>
                      <SelectItem value={ConstructionQuality.GOOD}>Good</SelectItem>
                      <SelectItem value={ConstructionQuality.EXCELLENT}>Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Obsolescence & Depreciation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="functional-obsolescence">
                    Functional Obsolescence (%)
                  </Label>
                  <Input
                    id="functional-obsolescence"
                    type="number"
                    min="0"
                    max="100"
                    value={costProperty.functionalObsolescence || ''}
                    onChange={(e) => handleUpdateProperty(
                      'functionalObsolescence',
                      e.target.value ? parseFloat(e.target.value) : 0
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Reduction in value due to outdated features, poor layout, etc.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="external-obsolescence">
                    External Obsolescence (%)
                  </Label>
                  <Input
                    id="external-obsolescence"
                    type="number"
                    min="0"
                    max="100"
                    value={costProperty.externalObsolescence || ''}
                    onChange={(e) => handleUpdateProperty(
                      'externalObsolescence',
                      e.target.value ? parseFloat(e.target.value) : 0
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Reduction in value due to external factors (location, market, etc.)
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Market Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="market-condition">Market Condition</Label>
                  <Select
                    value={costProperty.marketCondition}
                    onValueChange={(value) => handleUpdateProperty('marketCondition', value)}
                  >
                    <SelectTrigger id="market-condition">
                      <SelectValue placeholder="Select market condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Declining">Declining</SelectItem>
                      <SelectItem value="Stable">Stable</SelectItem>
                      <SelectItem value="Improving">Improving</SelectItem>
                      <SelectItem value="Strong">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="p-6 pt-4">
          <div className="space-y-6">
            {!result ? (
              <div className="space-y-4">
                <div className="p-8 text-center border rounded-md bg-muted/50">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Analysis Results Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run the analysis to see the cost approach valuation results
                  </p>
                  <Button onClick={runAnalysis}>Run Cost Analysis</Button>
                </div>
                
                {costProperty.buildingComponents.length === 0 && (
                  <div className="flex p-4 border-l-4 border-amber-500 bg-amber-50 rounded">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                    <div className="text-sm text-amber-700">
                      Add building components in the Components tab to get accurate results.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <DollarSign className="h-8 w-8 text-primary mb-2" />
                        <div className="text-2xl font-bold">
                          {formatCurrency(result.totalValueEstimate)}
                        </div>
                        <div className="text-sm text-muted-foreground text-center mt-2">
                          Total Value Estimate
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <Building className="h-8 w-8 text-primary mb-2" />
                        <div className="text-2xl font-bold">
                          {formatCurrency(result.depreciatedBuildingValue)}
                        </div>
                        <div className="text-sm text-muted-foreground text-center mt-2">
                          Depreciated Building Value
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <Home className="h-8 w-8 text-primary mb-2" />
                        <div className="text-2xl font-bold">
                          {formatCurrency(result.landValue)}
                        </div>
                        <div className="text-sm text-muted-foreground text-center mt-2">
                          Land Value
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Replacement Cost (RCN)</span>
                          <span>{formatCurrency(result.replacementCost)}</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Physical Depreciation</span>
                          <span>
                            -{formatCurrency(result.depreciation.depreciationBreakdown.physical)}
                          </span>
                        </div>
                        <Progress 
                          value={(result.depreciation.depreciationBreakdown.physical / result.replacementCost) * 100} 
                          className="h-2 bg-muted" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Functional Obsolescence</span>
                          <span>
                            -{formatCurrency(result.depreciation.depreciationBreakdown.functional)}
                          </span>
                        </div>
                        <Progress 
                          value={(result.depreciation.depreciationBreakdown.functional / result.replacementCost) * 100} 
                          className="h-2 bg-muted" 
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>External Obsolescence</span>
                          <span>
                            -{formatCurrency(result.depreciation.depreciationBreakdown.external)}
                          </span>
                        </div>
                        <Progress 
                          value={(result.depreciation.depreciationBreakdown.external / result.replacementCost) * 100} 
                          className="h-2 bg-muted" 
                        />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="flex justify-between mb-1 font-medium">
                          <span>Depreciated Building Value</span>
                          <span>{formatCurrency(result.depreciatedBuildingValue)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Land Value</span>
                          <span>{formatCurrency(result.landValue)}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <div className="flex justify-between mb-1 font-medium">
                          <span>Total Property Value</span>
                          <span>{formatCurrency(result.totalValueEstimate)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1 text-sm text-muted-foreground">
                          <span>Cost Per Square Foot</span>
                          <span>
                            {formatCurrency(result.costPerSquareFoot)}/sq.ft.
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button onClick={runAnalysis}>
                    <BarChart className="h-4 w-4 mr-2" />
                    Update Analysis
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}