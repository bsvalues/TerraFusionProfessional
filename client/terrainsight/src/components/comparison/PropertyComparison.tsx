import React, { useState } from 'react';
import { usePropertyComparison, MAX_COMPARISON_PROPERTIES } from './PropertyComparisonContext';
import { Property } from '@/shared/schema';
import { formatCurrency } from '@/lib/utils';
import { saveAs } from 'file-saver';
import { 
  X, Download, Plus, ArrowDownUp, Home, Calendar, Ruler, Square, 
  DollarSign, Map, BarChart3, BarChart2, LineChart, Share2, Calculator, FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PropertySearchDialog } from './PropertySearchDialog';
import { EnhancedPropertyComparison } from './EnhancedPropertyComparison';
import { OneClickPropertyComparison } from './OneClickPropertyComparison';
import { OneClickPropertyReport } from '../export/OneClickPropertyReport';

/**
 * Component to display a comparison of multiple properties
 */
interface PropertyComparisonProps {
  properties?: Property[];
}

export function PropertyComparison({ properties: propProperties }: PropertyComparisonProps) {
  const { 
    comparisonProperties, 
    removeFromComparison, 
    clearComparison,
    addToComparison,
    properties: contextProperties,
    isLoading
  } = usePropertyComparison();
  
  // Use properties from props if provided, otherwise from context
  const properties = propProperties || contextProperties;
  
  const [sortField, setSortField] = useState<string>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showEnhancedComparison, setShowEnhancedComparison] = useState(false);
  const [selectedPropertyForAnalysis, setSelectedPropertyForAnalysis] = useState<Property | null>(null);
  
  // If no properties are loaded or selected, display a message to add properties
  if (comparisonProperties.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Property Comparison</CardTitle>
          <CardDescription>
            Select properties to compare their attributes side-by-side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <Home className="h-16 w-16 text-gray-400" />
            <h3 className="text-lg font-semibold">No properties selected</h3>
            <p className="text-sm text-center text-gray-500 max-w-md">
              Add up to {MAX_COMPARISON_PROPERTIES} properties to compare them side-by-side. 
              Select properties from the map or search for specific addresses.
            </p>
            <Button 
              onClick={() => setShowSearchDialog(true)}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Properties
            </Button>
            
            {showSearchDialog && (
              <PropertySearchDialog
                onClose={() => setShowSearchDialog(false)}
                onSelectProperty={(property) => {
                  addToComparison(property);
                  setShowSearchDialog(false);
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Sort the properties based on the current sort settings
  const sortedProperties = [...comparisonProperties].sort((a, b) => {
    // Handle different property field types
    let aValue: any = a[sortField as keyof Property];
    let bValue: any = b[sortField as keyof Property];
    
    // Handle nested paths or computed fields
    if (sortField === 'pricePerSqFt') {
      const aPrice = a.value ? parseFloat(a.value.replace(/[^0-9.-]+/g, '')) : 0;
      const bPrice = b.value ? parseFloat(b.value.replace(/[^0-9.-]+/g, '')) : 0;
      aValue = a.squareFeet ? aPrice / a.squareFeet : 0;
      bValue = b.squareFeet ? bPrice / b.squareFeet : 0;
    }
    
    // Convert string currency values to numbers for sorting
    if (typeof aValue === 'string' && aValue.includes('$')) {
      aValue = parseFloat(aValue.replace(/[^0-9.-]+/g, ''));
    }
    if (typeof bValue === 'string' && bValue.includes('$')) {
      bValue = parseFloat(bValue.replace(/[^0-9.-]+/g, ''));
    }
    
    // Handle null values - push them to the end
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    // Basic comparison
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  /**
   * Generate and download property comparison as CSV
   */
  const exportAsCSV = () => {
    // Define the fields to export
    const fields = [
      'address', 'value', 'squareFeet', 'yearBuilt', 'bedrooms', 
      'bathrooms', 'lotSize', 'neighborhood', 'propertyType', 'zoning'
    ];
    
    // Generate header row
    const header = fields.map(field => {
      // Convert field names to more user-friendly format
      return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
    }).join(',');
    
    // Generate data rows
    const rows = comparisonProperties.map(property => {
      return fields.map(field => {
        const value = property[field as keyof Property];
        // Handle null/undefined values and quote strings that might contain commas
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        return value;
      }).join(',');
    }).join('\n');
    
    // Combine and encode as blob
    const csv = header + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    
    // Download the file
    saveAs(blob, `property-comparison-${new Date().toISOString().slice(0, 10)}.csv`);
  };
  
  // Handle sort changes
  const toggleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for a new field
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Property Comparison</CardTitle>
            <CardDescription>
              Compare properties side-by-side to analyze their attributes
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Property to Comparison</DialogTitle>
                  <DialogDescription>
                    Search for a property by address, parcel ID, or owner name.
                  </DialogDescription>
                </DialogHeader>
                <PropertySearchDialog 
                  onClose={() => {}} 
                  onSelectProperty={(property) => addToComparison(property)} 
                />
              </DialogContent>
            </Dialog>
            
            <Tooltip
              content="Export comparison as CSV"
            >
              <Button variant="outline" size="sm" onClick={exportAsCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </Tooltip>
            
            <Tooltip
              content="Remove all properties from comparison"
            >
              <Button variant="outline" size="sm" onClick={clearComparison}>
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </Tooltip>
          </div>
        </div>
        
        {comparisonProperties.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <Select 
              value={sortField}
              onValueChange={(value) => {
                setSortField(value);
                setSortDirection('desc');
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Property Value</SelectItem>
                <SelectItem value="squareFeet">Square Feet</SelectItem>
                <SelectItem value="yearBuilt">Year Built</SelectItem>
                <SelectItem value="bedrooms">Bedrooms</SelectItem>
                <SelectItem value="bathrooms">Bathrooms</SelectItem>
                <SelectItem value="lotSize">Lot Size</SelectItem>
                <SelectItem value="pricePerSqFt">Price per Sq Ft</SelectItem>
                <SelectItem value="neighborhood">Neighborhood</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1"
            >
              <ArrowDownUp className="h-4 w-4" />
              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Property</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('value')}>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Value
                    {sortField === 'value' && (
                      <ArrowDownUp className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('squareFeet')}>
                  <div className="flex items-center gap-1">
                    <Square className="h-4 w-4" />
                    Square Feet
                    {sortField === 'squareFeet' && (
                      <ArrowDownUp className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('pricePerSqFt')}>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Price/SqFt
                    {sortField === 'pricePerSqFt' && (
                      <ArrowDownUp className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('yearBuilt')}>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Year Built
                    {sortField === 'yearBuilt' && (
                      <ArrowDownUp className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('bedrooms')}>
                  Beds
                  {sortField === 'bedrooms' && (
                    <ArrowDownUp className="h-3 w-3 ml-1" />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('bathrooms')}>
                  Baths
                  {sortField === 'bathrooms' && (
                    <ArrowDownUp className="h-3 w-3 ml-1" />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('lotSize')}>
                  <div className="flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    Lot Size
                    {sortField === 'lotSize' && (
                      <ArrowDownUp className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('neighborhood')}>
                  <div className="flex items-center gap-1">
                    <Map className="h-4 w-4" />
                    Neighborhood
                    {sortField === 'neighborhood' && (
                      <ArrowDownUp className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProperties.map(property => {
                // Calculate price per square foot
                const value = property.value ? parseFloat(property.value.replace(/[^0-9.-]+/g, '')) : 0;
                const pricePerSqFt = property.squareFeet ? value / property.squareFeet : 0;
                
                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{property.address}</span>
                        <span className="text-xs text-gray-500">ID: {property.parcelId}</span>
                        {property.propertyType && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {property.propertyType}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{property.value ? formatCurrency(parseFloat(property.value)) : 'N/A'}</TableCell>
                    <TableCell>{property.squareFeet?.toLocaleString()}</TableCell>
                    <TableCell>
                      {pricePerSqFt > 0 ? formatCurrency(pricePerSqFt) : 'N/A'}
                    </TableCell>
                    <TableCell>{property.yearBuilt || 'N/A'}</TableCell>
                    <TableCell>{property.bedrooms || 'N/A'}</TableCell>
                    <TableCell>{property.bathrooms || 'N/A'}</TableCell>
                    <TableCell>
                      {property.lotSize ? property.lotSize.toLocaleString() + ' sq ft' : 'N/A'}
                    </TableCell>
                    <TableCell>{property.neighborhood || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip content="Quick compare with similar properties">
                          <div>
                            <OneClickPropertyComparison 
                              property={property} 
                              buttonVariant="ghost"
                              buttonSize="icon"
                              buttonText=""
                              showIcon={true}
                            />
                          </div>
                        </Tooltip>
                        
                        <Tooltip content="Analyze this property">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedPropertyForAnalysis(property);
                              setShowEnhancedComparison(true);
                            }}
                          >
                            <BarChart2 className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip content="Generate property report">
                          <div>
                            <OneClickPropertyReport 
                              property={property}
                              variant="ghost"
                              buttonText=""
                              className="h-8 w-8 p-0"
                            />
                          </div>
                        </Tooltip>

                        <Tooltip content="Remove from comparison">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeFromComparison(property.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {comparisonProperties.length < MAX_COMPARISON_PROPERTIES && (
          <div className="mt-4 flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowSearchDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Property ({comparisonProperties.length}/{MAX_COMPARISON_PROPERTIES})
            </Button>
            
            {comparisonProperties.length > 0 && (
              <Button
                variant="default"
                onClick={() => {
                  // Use the first property as the base for comparison
                  setSelectedPropertyForAnalysis(comparisonProperties[0]);
                  setShowEnhancedComparison(true);
                }}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Enhanced Analysis
              </Button>
            )}
            
            {showSearchDialog && (
              <PropertySearchDialog
                onClose={() => setShowSearchDialog(false)}
                onSelectProperty={(property) => {
                  addToComparison(property);
                  setShowSearchDialog(false);
                }}
              />
            )}
          </div>
        )}
        
        {/* Enhanced Property Comparison Dialog */}
        {showEnhancedComparison && selectedPropertyForAnalysis && (
          <EnhancedPropertyComparison
            baseProperty={selectedPropertyForAnalysis}
            allProperties={properties || []}
            isOpen={showEnhancedComparison}
            onClose={() => setShowEnhancedComparison(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}