import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  BarChart3,
  ArrowDownUp,
  ChevronsUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

export interface ModelVariable {
  name: string;
  displayName: string;
  selected: boolean;
  type: 'target' | 'independent' | 'interaction' | 'weight' | 'none';
  category?: string;
  dataType?: 'number' | 'string' | 'boolean';
  minValue?: number;
  maxValue?: number;
  mean?: number;
  median?: number;
  nullCount?: number;
  description?: string;
}

export interface VariableSelectorProps {
  properties: Property[];
  variables: ModelVariable[];
  targetVariable: string | null;
  onVariablesChange: (variables: ModelVariable[]) => void;
  onTargetVariableChange: (variableName: string) => void;
  className?: string;
}

export function VariableSelector({ 
  properties, 
  variables, 
  targetVariable, 
  onVariablesChange, 
  onTargetVariableChange,
  className 
}: VariableSelectorProps) {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'category'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  
  // Calculate variable stats if not provided
  const variablesWithStats = variables.map(variable => {
    if (variable.mean !== undefined) return variable;
    
    // If stats aren't provided, calculate them
    const values: number[] = [];
    let nullCount = 0;
    
    properties.forEach(property => {
      // Handle nested paths
      const path = variable.name.split('.');
      let value: any = property;
      
      for (const part of path) {
        if (value === null || value === undefined) {
          value = null;
          break;
        }
        value = value[part];
      }
      
      if (value === null || value === undefined) {
        nullCount++;
      } else if (typeof value === 'number') {
        values.push(value);
      } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        values.push(parseFloat(value));
      }
    });
    
    // Calculate stats
    const numericValues = values.filter(v => !isNaN(v));
    const sortedValues = [...numericValues].sort((a, b) => a - b);
    
    const minValue = numericValues.length > 0 ? Math.min(...numericValues) : undefined;
    const maxValue = numericValues.length > 0 ? Math.max(...numericValues) : undefined;
    const mean = numericValues.length > 0 
      ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length 
      : undefined;
    
    const midIndex = Math.floor(sortedValues.length / 2);
    const median = sortedValues.length > 0
      ? sortedValues.length % 2 === 0
        ? (sortedValues[midIndex - 1] + sortedValues[midIndex]) / 2
        : sortedValues[midIndex]
      : undefined;
    
    return {
      ...variable,
      minValue,
      maxValue,
      mean,
      median,
      nullCount
    };
  });
  
  // Get unique categories
  const categories = [...new Set(variablesWithStats.map(v => v.category || 'Uncategorized'))];
  
  // Filter variables
  const filteredVariables = variablesWithStats.filter(variable => {
    // Filter by search text
    const matchesSearch = 
      searchText === '' || 
      variable.name.toLowerCase().includes(searchText.toLowerCase()) ||
      variable.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
      (variable.description && variable.description.toLowerCase().includes(searchText.toLowerCase()));
    
    // Filter by category
    const matchesCategory = 
      selectedCategory === null || 
      (variable.category || 'Uncategorized') === selectedCategory;
    
    // Filter by selection status
    const matchesSelection = 
      !showSelectedOnly || 
      variable.selected || 
      variable.type === 'target';
    
    return matchesSearch && matchesCategory && matchesSelection;
  });
  
  // Sort variables
  const sortedVariables = [...filteredVariables].sort((a, b) => {
    // Target variable always first
    if (a.name === targetVariable) return -1;
    if (b.name === targetVariable) return 1;
    
    // Selected variables before unselected
    if (a.selected && !b.selected) return -1;
    if (!a.selected && b.selected) return 1;
    
    // Then sort by the chosen field
    const aValue = sortBy === 'name' ? a.displayName || a.name : (a.category || 'Uncategorized');
    const bValue = sortBy === 'name' ? b.displayName || b.name : (b.category || 'Uncategorized');
    
    // Apply sort direction
    const comparison = aValue.localeCompare(bValue);
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  const toggleSort = (field: 'name' | 'category') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  const handleVariableTypeChange = (variableName: string, type: 'target' | 'independent' | 'weight' | 'none') => {
    // If setting as target, update target variable and clear previous target
    if (type === 'target') {
      onTargetVariableChange(variableName);
      
      const updatedVariables = variables.map(v => ({
        ...v,
        type: v.name === variableName 
          ? 'target' 
          : v.type === 'target' ? 'none' : v.type,
        selected: v.name === variableName || (v.selected && v.type !== 'target')
      }));
      
      onVariablesChange(updatedVariables);
    } else {
      // Otherwise just update this variable
      const updatedVariables = variables.map(v => 
        v.name === variableName
          ? { ...v, type, selected: type !== 'none' }
          : v
      );
      
      onVariablesChange(updatedVariables);
    }
  };
  
  const handleSelectChange = (variableName: string, selected: boolean) => {
    const updatedVariables = variables.map(v => 
      v.name === variableName
        ? { 
            ...v, 
            selected,
            // Update type if needed
            type: selected 
              ? (v.type === 'none' ? 'independent' : v.type)
              : (v.type !== 'target' ? 'none' : v.type)
          }
        : v
    );
    
    onVariablesChange(updatedVariables);
  };
  
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3 space-y-1.5">
        <CardTitle className="text-base font-semibold">Variables</CardTitle>
        <CardDescription>
          Select variables for your regression model
        </CardDescription>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search variables..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-selected" 
              checked={showSelectedOnly}
              onCheckedChange={setShowSelectedOnly}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="show-selected" className="text-sm">Show selected</Label>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5">
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "text-xs h-7 px-2.5",
              selectedCategory === null && "bg-muted"
            )}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          
          {categories.map(category => (
            <Button
              key={category}
              variant="outline"
              size="sm"
              className={cn(
                "text-xs h-7 px-2.5",
                selectedCategory === category && "bg-muted"
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <Table className="min-w-[500px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[30px]">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead className="w-[200px] cursor-pointer" onClick={() => toggleSort('name')}>
                  <div className="flex items-center">
                    Variable Name
                    <ChevronsUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('category')}>
                  <div className="flex items-center">
                    Category
                    <ChevronsUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Stats</TableHead>
                <TableHead className="w-[150px] text-center">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVariables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No variables found matching your search criteria
                  </TableCell>
                </TableRow>
              ) : (
                sortedVariables.map((variable) => (
                  <TableRow key={variable.name} className="group">
                    <TableCell>
                      <Checkbox
                        checked={variable.selected || variable.type === 'target'}
                        onCheckedChange={(checked) => 
                          variable.type !== 'target' && 
                          handleSelectChange(variable.name, !!checked)
                        }
                        disabled={variable.type === 'target'}
                      />
                    </TableCell>
                    <TableCell className="font-medium break-all">
                      <div className="flex flex-col">
                        <span>{variable.displayName || variable.name}</span>
                        {variable.displayName && variable.displayName !== variable.name && (
                          <span className="text-xs text-muted-foreground">{variable.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {variable.category || 'Uncategorized'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end text-xs space-y-0.5">
                        {variable.minValue !== undefined && variable.maxValue !== undefined && (
                          <span>Range: {formatValue(variable.minValue)} - {formatValue(variable.maxValue)}</span>
                        )}
                        {variable.mean !== undefined && (
                          <span>Mean: {formatValue(variable.mean)}</span>
                        )}
                        {variable.nullCount !== undefined && (
                          <span className={variable.nullCount > 0 ? "text-amber-500" : ""}>
                            Nulls: {variable.nullCount} ({Math.round(variable.nullCount / properties.length * 100)}%)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-1">
                        <Button
                          variant={variable.type === 'target' ? 'default' : 'outline'}
                          size="icon"
                          className="h-7 w-7"
                          title="Set as target variable"
                          onClick={() => handleVariableTypeChange(variable.name, 'target')}
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={variable.type === 'independent' ? 'default' : 'outline'}
                          size="icon"
                          className="h-7 w-7"
                          title="Use as independent variable"
                          onClick={() => handleVariableTypeChange(variable.name, 'independent')}
                          disabled={variable.type === 'target'}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={variable.type === 'weight' ? 'default' : 'outline'}
                          size="icon"
                          className="h-7 w-7"
                          title="Use as weight variable"
                          onClick={() => handleVariableTypeChange(variable.name, 'weight')}
                          disabled={variable.type === 'target'}
                        >
                          <ArrowDownUp className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      
      <div className="px-6 py-3 border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {variables.filter(v => v.selected || v.type === 'target').length} of {variables.length} variables selected
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline" className="px-1.5 py-0.5">
            {targetVariable ? `Target: ${variables.find(v => v.name === targetVariable)?.displayName || targetVariable}` : 'No target selected'}
          </Badge>
          <Badge variant="outline" className="px-1.5 py-0.5">
            {`Independent: ${variables.filter(v => v.type === 'independent').length}`}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function formatValue(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  } else if (Number.isInteger(value)) {
    return value.toString();
  } else {
    return value.toFixed(2);
  }
}