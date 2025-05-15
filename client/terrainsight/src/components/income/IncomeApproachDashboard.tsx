/**
 * IncomeApproachDashboard.tsx
 * 
 * Dashboard component for income approach to property valuation
 * Displays property groups, comparison tools, and valuation metrics
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Building, 
  DollarSign, 
  FileText, 
  Home, 
  PlusCircle, 
  RefreshCw, 
  Settings, 
  Trash2 
} from 'lucide-react';

import { 
  IncomeProperty, 
  IncomeApproachGroup, 
  IncomePropertyType, 
  IncomeValuationMethod, 
  IncomeApproachSummary 
} from '../../services/income/IncomeApproachTypes';
import { incomeApproachService } from '../../services/income/IncomeApproachService';

export const IncomeApproachDashboard: React.FC = () => {
  // State for properties, groups, and UI
  const [properties, setProperties] = useState<IncomeProperty[]>([]);
  const [groups, setGroups] = useState<IncomeApproachGroup[]>([]);
  const [activeTab, setActiveTab] = useState('properties');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [propertySummary, setPropertySummary] = useState<IncomeApproachSummary | null>(null);
  const [compareResults, setCompareResults] = useState<any[]>([]);
  
  // Dialog states
  const [newPropertyDialogOpen, setNewPropertyDialogOpen] = useState(false);
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  
  // Form states for new property
  const [newProperty, setNewProperty] = useState<Partial<IncomeProperty>>({
    propertyName: '',
    address: '',
    propertyType: IncomePropertyType.RESIDENTIAL_MULTIFAMILY,
    totalSqFt: 0,
    unitCount: 0,
    rentalUnits: [],
    incomeStreams: [],
    expenses: [],
    valuationMethod: IncomeValuationMethod.DIRECT_CAPITALIZATION,
    capRate: 0.08,
    vacancyRate: 0.05
  });
  
  // Form state for new group
  const [newGroup, setNewGroup] = useState<Partial<IncomeApproachGroup>>({
    groupName: '',
    description: '',
    propertyType: IncomePropertyType.RESIDENTIAL_MULTIFAMILY,
    properties: []
  });
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Load properties and groups
  const loadData = () => {
    try {
      const allProperties = incomeApproachService.getAllProperties();
      const allGroups = incomeApproachService.getAllGroups();
      
      setProperties(allProperties);
      setGroups(allGroups);
      
      // Reset selected items if they no longer exist
      if (selectedPropertyId && !allProperties.some(p => p.propertyId === selectedPropertyId)) {
        setSelectedPropertyId(null);
        setPropertySummary(null);
      }
      
      if (selectedGroupId && !allGroups.some(g => g.groupId === selectedGroupId)) {
        setSelectedGroupId(null);
        setCompareResults([]);
      }
      
      toast({
        title: "Data loaded",
        description: `Loaded ${allProperties.length} properties and ${allGroups.length} groups.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  // Select a property and calculate its summary
  const handleSelectProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    
    try {
      const property = incomeApproachService.getPropertyById(propertyId);
      
      if (property) {
        const summary = incomeApproachService.calculateIncomeSummary(property);
        setPropertySummary(summary);
      } else {
        setPropertySummary(null);
      }
    } catch (error) {
      toast({
        title: "Error calculating property summary",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setPropertySummary(null);
    }
  };
  
  // Select a group and run comparative analysis
  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    
    try {
      const results = incomeApproachService.calculateComparativePerformance(groupId);
      setCompareResults(results);
    } catch (error) {
      toast({
        title: "Error calculating group comparison",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setCompareResults([]);
    }
  };
  
  // Create a new property
  const handleCreateProperty = () => {
    try {
      if (!newProperty.propertyName || !newProperty.address) {
        toast({
          title: "Validation error",
          description: "Property name and address are required",
          variant: "destructive",
        });
        return;
      }
      
      // Create a minimal viable property for now
      const property: IncomeProperty = {
        propertyId: crypto.randomUUID(),
        propertyName: newProperty.propertyName || '',
        address: newProperty.address || '',
        propertyType: newProperty.propertyType || IncomePropertyType.RESIDENTIAL_MULTIFAMILY,
        totalSqFt: newProperty.totalSqFt || 0,
        unitCount: newProperty.unitCount || 0,
        rentalUnits: newProperty.rentalUnits || [],
        incomeStreams: newProperty.incomeStreams || [],
        expenses: newProperty.expenses || [],
        valuationMethod: newProperty.valuationMethod || IncomeValuationMethod.DIRECT_CAPITALIZATION,
        capRate: newProperty.capRate || 0.08,
        vacancyRate: newProperty.vacancyRate || 0.05,
        valuationDate: new Date()
      };
      
      const savedProperty = incomeApproachService.saveProperty(property);
      
      // Reset form and reload data
      setNewProperty({
        propertyName: '',
        address: '',
        propertyType: IncomePropertyType.RESIDENTIAL_MULTIFAMILY,
        totalSqFt: 0,
        unitCount: 0,
        rentalUnits: [],
        incomeStreams: [],
        expenses: [],
        valuationMethod: IncomeValuationMethod.DIRECT_CAPITALIZATION,
        capRate: 0.08,
        vacancyRate: 0.05
      });
      setNewPropertyDialogOpen(false);
      loadData();
      
      // Select the new property
      setSelectedPropertyId(savedProperty.propertyId);
      handleSelectProperty(savedProperty.propertyId);
      
      toast({
        title: "Property created",
        description: `Successfully created property "${savedProperty.propertyName}"`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error creating property",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  // Create a new group
  const handleCreateGroup = () => {
    try {
      if (!newGroup.groupName) {
        toast({
          title: "Validation error",
          description: "Group name is required",
          variant: "destructive",
        });
        return;
      }
      
      // Create a minimal viable group for now
      const group: IncomeApproachGroup = {
        groupId: crypto.randomUUID(),
        groupName: newGroup.groupName || '',
        description: newGroup.description || '',
        propertyType: newGroup.propertyType || IncomePropertyType.RESIDENTIAL_MULTIFAMILY,
        properties: newGroup.properties || [],
        creationDate: new Date(),
        lastUpdated: new Date()
      };
      
      const savedGroup = incomeApproachService.saveGroup(group);
      
      // Reset form and reload data
      setNewGroup({
        groupName: '',
        description: '',
        propertyType: IncomePropertyType.RESIDENTIAL_MULTIFAMILY,
        properties: []
      });
      setNewGroupDialogOpen(false);
      loadData();
      
      // Select the new group
      setSelectedGroupId(savedGroup.groupId);
      handleSelectGroup(savedGroup.groupId);
      
      toast({
        title: "Group created",
        description: `Successfully created group "${savedGroup.groupName}"`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error creating group",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  // Delete a property
  const handleDeleteProperty = (propertyId: string) => {
    try {
      const result = incomeApproachService.deleteProperty(propertyId);
      
      if (result) {
        if (selectedPropertyId === propertyId) {
          setSelectedPropertyId(null);
          setPropertySummary(null);
        }
        
        loadData();
        
        toast({
          title: "Property deleted",
          description: "Property was successfully deleted",
          variant: "default",
        });
      } else {
        toast({
          title: "Error deleting property",
          description: "Property could not be deleted",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error deleting property",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  // Delete a group
  const handleDeleteGroup = (groupId: string) => {
    try {
      const result = incomeApproachService.deleteGroup(groupId);
      
      if (result) {
        if (selectedGroupId === groupId) {
          setSelectedGroupId(null);
          setCompareResults([]);
        }
        
        loadData();
        
        toast({
          title: "Group deleted",
          description: "Group was successfully deleted",
          variant: "default",
        });
      } else {
        toast({
          title: "Error deleting group",
          description: "Group could not be deleted",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error deleting group",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  // Add a property to a group
  const handleAddPropertyToGroup = (groupId: string, propertyId: string) => {
    try {
      const result = incomeApproachService.addPropertyToGroup(groupId, propertyId);
      
      if (result) {
        loadData();
        
        // If the current group is being updated, refresh its comparison
        if (selectedGroupId === groupId) {
          handleSelectGroup(groupId);
        }
        
        toast({
          title: "Property added to group",
          description: "Property was successfully added to the group",
          variant: "default",
        });
      } else {
        toast({
          title: "Error adding property to group",
          description: "Property could not be added to the group",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error adding property to group",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage values
  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Income Approach Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="properties">
            <Building className="mr-2 h-4 w-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Home className="mr-2 h-4 w-4" />
            Comparison Groups
          </TabsTrigger>
        </TabsList>
        
        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Income Properties</h2>
            <Dialog open={newPropertyDialogOpen} onOpenChange={setNewPropertyDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Property
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Income Property</DialogTitle>
                  <DialogDescription>
                    Create a new property for income approach valuation
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="propertyName">Property Name</Label>
                    <Input
                      id="propertyName"
                      value={newProperty.propertyName || ''}
                      onChange={(e) => setNewProperty({...newProperty, propertyName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newProperty.address || ''}
                      onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="propertyType">Property Type</Label>
                      <Select 
                        value={newProperty.propertyType} 
                        onValueChange={(value) => setNewProperty({...newProperty, propertyType: value as IncomePropertyType})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={IncomePropertyType.RESIDENTIAL_MULTIFAMILY}>Residential Multifamily</SelectItem>
                          <SelectItem value={IncomePropertyType.COMMERCIAL_RETAIL}>Commercial Retail</SelectItem>
                          <SelectItem value={IncomePropertyType.COMMERCIAL_OFFICE}>Commercial Office</SelectItem>
                          <SelectItem value={IncomePropertyType.COMMERCIAL_INDUSTRIAL}>Commercial Industrial</SelectItem>
                          <SelectItem value={IncomePropertyType.COMMERCIAL_MIXED_USE}>Commercial Mixed Use</SelectItem>
                          <SelectItem value={IncomePropertyType.SPECIAL_PURPOSE}>Special Purpose</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="totalSqFt">Total Square Feet</Label>
                      <Input
                        id="totalSqFt"
                        type="number"
                        value={newProperty.totalSqFt || ''}
                        onChange={(e) => setNewProperty({...newProperty, totalSqFt: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="unitCount">Number of Units</Label>
                      <Input
                        id="unitCount"
                        type="number"
                        value={newProperty.unitCount || ''}
                        onChange={(e) => setNewProperty({...newProperty, unitCount: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="capRate">Cap Rate (%)</Label>
                      <Input
                        id="capRate"
                        type="number"
                        step="0.01"
                        value={(newProperty.capRate || 0) * 100}
                        onChange={(e) => setNewProperty({...newProperty, capRate: parseFloat(e.target.value) / 100 || 0})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="vacancyRate">Vacancy Rate (%)</Label>
                      <Input
                        id="vacancyRate"
                        type="number"
                        step="0.01"
                        value={(newProperty.vacancyRate || 0) * 100}
                        onChange={(e) => setNewProperty({...newProperty, vacancyRate: parseFloat(e.target.value) / 100 || 0})}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="valuationMethod">Valuation Method</Label>
                      <Select 
                        value={newProperty.valuationMethod} 
                        onValueChange={(value) => setNewProperty({...newProperty, valuationMethod: value as IncomeValuationMethod})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select valuation method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={IncomeValuationMethod.DIRECT_CAPITALIZATION}>Direct Capitalization</SelectItem>
                          <SelectItem value={IncomeValuationMethod.GROSS_RENT_MULTIPLIER}>Gross Rent Multiplier</SelectItem>
                          <SelectItem value={IncomeValuationMethod.DISCOUNTED_CASH_FLOW}>Discounted Cash Flow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewPropertyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProperty}>
                    Create Property
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Properties List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Properties</CardTitle>
                <CardDescription>
                  {properties.length} income properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {properties.map((property) => (
                    <div 
                      key={property.propertyId}
                      className={`p-2 border rounded cursor-pointer flex justify-between ${
                        selectedPropertyId === property.propertyId ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => handleSelectProperty(property.propertyId)}
                    >
                      <div>
                        <div className="font-medium">{property.propertyName}</div>
                        <div className="text-sm text-muted-foreground">{property.address}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {property.unitCount} units | {property.totalSqFt.toLocaleString()} sqft
                        </div>
                      </div>
                      <div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProperty(property.propertyId);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {properties.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No properties found. Create a new property to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Property Details */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>
                  {selectedPropertyId 
                    ? `Property valuation details for ${properties.find(p => p.propertyId === selectedPropertyId)?.propertyName}`
                    : 'Select a property to view details'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPropertyId && propertySummary ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Income Summary</h3>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Potential Gross Income</TableCell>
                              <TableCell className="text-right">{formatCurrency(propertySummary.potentialGrossIncome)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Vacancy Loss</TableCell>
                              <TableCell className="text-right text-destructive">({formatCurrency(propertySummary.vacancyLoss)})</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Effective Gross Income</TableCell>
                              <TableCell className="text-right">{formatCurrency(propertySummary.effectiveGrossIncome)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Operating Expenses</TableCell>
                              <TableCell className="text-right text-destructive">({formatCurrency(propertySummary.totalOperatingExpenses)})</TableCell>
                            </TableRow>
                            <TableRow className="font-bold">
                              <TableCell>Net Operating Income</TableCell>
                              <TableCell className="text-right">{formatCurrency(propertySummary.netOperatingIncome)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Valuation</h3>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">Cap Rate</TableCell>
                              <TableCell className="text-right">{formatPercent(propertySummary.capRate)}</TableCell>
                            </TableRow>
                            <TableRow className="font-bold">
                              <TableCell>Estimated Value</TableCell>
                              <TableCell className="text-right">{formatCurrency(propertySummary.estimatedValue)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Value per Sq Ft</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(propertySummary.valuePerSqFt)}/sqft
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Value per Unit</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(propertySummary.valuePerUnit)}/unit
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Expense Ratio</TableCell>
                              <TableCell className="text-right">
                                {formatPercent(propertySummary.expenseRatio)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Actions</h3>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Details
                        </Button>
                        <Select>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Add to Group..." />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((group) => (
                              <SelectItem 
                                key={group.groupId}
                                value={group.groupId}
                                onClick={() => handleAddPropertyToGroup(group.groupId, selectedPropertyId)}
                              >
                                {group.groupName}
                              </SelectItem>
                            ))}
                            {groups.length === 0 && (
                              <SelectItem value="none" disabled>
                                No groups available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    Select a property to view details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Comparison Groups</h2>
            <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Comparison Group</DialogTitle>
                  <DialogDescription>
                    Create a new group for comparing properties
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={newGroup.groupName || ''}
                      onChange={(e) => setNewGroup({...newGroup, groupName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newGroup.description || ''}
                      onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="groupPropertyType">Property Type</Label>
                    <Select 
                      value={newGroup.propertyType} 
                      onValueChange={(value) => setNewGroup({...newGroup, propertyType: value as IncomePropertyType})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={IncomePropertyType.RESIDENTIAL_MULTIFAMILY}>Residential Multifamily</SelectItem>
                        <SelectItem value={IncomePropertyType.COMMERCIAL_RETAIL}>Commercial Retail</SelectItem>
                        <SelectItem value={IncomePropertyType.COMMERCIAL_OFFICE}>Commercial Office</SelectItem>
                        <SelectItem value={IncomePropertyType.COMMERCIAL_INDUSTRIAL}>Commercial Industrial</SelectItem>
                        <SelectItem value={IncomePropertyType.COMMERCIAL_MIXED_USE}>Commercial Mixed Use</SelectItem>
                        <SelectItem value={IncomePropertyType.SPECIAL_PURPOSE}>Special Purpose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewGroupDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup}>
                    Create Group
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Groups List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Property Groups</CardTitle>
                <CardDescription>
                  {groups.length} comparison groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div 
                      key={group.groupId}
                      className={`p-2 border rounded cursor-pointer flex justify-between ${
                        selectedGroupId === group.groupId ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => handleSelectGroup(group.groupId)}
                    >
                      <div>
                        <div className="font-medium">{group.groupName}</div>
                        <div className="text-sm text-muted-foreground">{group.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {group.properties.length} properties
                        </div>
                      </div>
                      <div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.groupId);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No groups found. Create a new group to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Group Comparison */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Comparative Analysis</CardTitle>
                <CardDescription>
                  {selectedGroupId 
                    ? `Comparison for ${groups.find(g => g.groupId === selectedGroupId)?.groupName}`
                    : 'Select a group to view comparison'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedGroupId && compareResults.length > 0 ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead className="text-right">NOI</TableHead>
                          <TableHead className="text-right">Cap Rate</TableHead>
                          <TableHead className="text-right">Value/SqFt</TableHead>
                          <TableHead className="text-right">Value/Unit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compareResults.map((result) => (
                          <TableRow key={result.propertyId}>
                            <TableCell className="font-medium">{result.propertyName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(result.netOperatingIncome)}</TableCell>
                            <TableCell className="text-right">{formatPercent(result.capRate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(result.valuePerSqFt)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(result.valuePerUnit)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Performance Rankings</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead className="text-right">NOI Rank</TableHead>
                            <TableHead className="text-right">Cap Rate Rank</TableHead>
                            <TableHead className="text-right">Expense Ratio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {compareResults.map((result) => (
                            <TableRow key={result.propertyId}>
                              <TableCell className="font-medium">{result.propertyName}</TableCell>
                              <TableCell className="text-right">
                                {result.rankings.noiRank}/100
                              </TableCell>
                              <TableCell className="text-right">
                                {result.rankings.capRateRank}/100
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPercent(result.expenseRatio)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Actions</h3>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report
                        </Button>
                        <Button variant="outline" size="sm">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Value Analysis
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    {selectedGroupId && compareResults.length === 0 
                      ? "This group has no properties. Add properties to the group to see comparisons."
                      : "Select a group to view comparison analysis"
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};