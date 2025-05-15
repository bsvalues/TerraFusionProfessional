/**
 * TransformationRuleManager.tsx
 * 
 * Component for managing ETL transformation rules
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  GitBranch, Edit, Trash2, Plus, ArrowUpDown, SortAsc, FileText, 
  MoreHorizontal, Play, Copy, Tag, Filter, Calendar, Text
} from 'lucide-react';
import { TransformationType } from '../../services/etl/ETLTypes';

const TransformationRuleManager: React.FC = () => {
  // State for transformation rules
  const [transformationRules, setTransformationRules] = useState([
    { 
      id: 1, 
      name: 'Extract Property Address', 
      type: TransformationType.SUBSTRING, 
      isActive: true,
      columns: ['rawAddress'],
      parameters: { 
        column: 'rawAddress',
        start: 0,
        end: 100,
        targetColumn: 'cleanAddress'
      },
      priority: 1,
      tags: ['address', 'cleaning']
    },
    { 
      id: 2, 
      name: 'Format Property Value', 
      type: TransformationType.PARSE_NUMBER, 
      isActive: true,
      columns: ['propertyValue'],
      parameters: { 
        column: 'propertyValue',
        decimalSeparator: '.',
        thousandsSeparator: ','
      },
      priority: 2,
      tags: ['numeric', 'cleaning']
    },
    { 
      id: 3, 
      name: 'Filter Active Properties', 
      type: TransformationType.FILTER, 
      isActive: true,
      columns: ['status'],
      parameters: { 
        conditions: [
          { column: 'status', operator: 'EQUALS', value: 'active' }
        ]
      },
      priority: 3,
      tags: ['filtering']
    },
    { 
      id: 4, 
      name: 'Calculate Square Foot Value', 
      type: TransformationType.CUSTOM_FUNCTION, 
      isActive: true,
      columns: ['propertyValue', 'squareFeet'],
      parameters: { 
        code: 'return data.map(item => ({...item, sqFtValue: item.propertyValue / item.squareFeet}));'
      },
      priority: 4,
      tags: ['calculation', 'advanced']
    },
  ]);

  // State for showing add/edit dialog
  const [showDialog, setShowDialog] = useState(false);
  const [currentRule, setCurrentRule] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<TransformationType | ''>('');
  const [activeTab, setActiveTab] = useState('all');

  // Function to get category for a transformation type
  const getTransformationCategory = (type: TransformationType) => {
    // Column operations
    if ([
      TransformationType.RENAME_COLUMN,
      TransformationType.DROP_COLUMN,
      TransformationType.REORDER_COLUMNS
    ].includes(type)) {
      return 'Column Operation';
    }
    
    // Data type operations
    if ([
      TransformationType.CAST_TYPE,
      TransformationType.PARSE_DATE,
      TransformationType.PARSE_NUMBER
    ].includes(type)) {
      return 'Data Type';
    }
    
    // Value operations
    if ([
      TransformationType.REPLACE_VALUE,
      TransformationType.FILL_NULL,
      TransformationType.MAP_VALUES
    ].includes(type)) {
      return 'Value Operation';
    }
    
    // String operations
    if ([
      TransformationType.TO_UPPERCASE,
      TransformationType.TO_LOWERCASE,
      TransformationType.TRIM,
      TransformationType.SUBSTRING,
      TransformationType.CONCAT,
      TransformationType.SPLIT
    ].includes(type)) {
      return 'String Operation';
    }
    
    // Numeric operations
    if ([
      TransformationType.ROUND,
      TransformationType.ADD,
      TransformationType.SUBTRACT,
      TransformationType.MULTIPLY,
      TransformationType.DIVIDE
    ].includes(type)) {
      return 'Numeric Operation';
    }
    
    // Row operations
    if ([
      TransformationType.FILTER,
      TransformationType.SORT,
      TransformationType.GROUP_BY,
      TransformationType.AGGREGATE,
      TransformationType.JOIN,
      TransformationType.UNION
    ].includes(type)) {
      return 'Row Operation';
    }
    
    // Data quality operations
    if ([
      TransformationType.REMOVE_DUPLICATES,
      TransformationType.VALIDATE
    ].includes(type)) {
      return 'Data Quality';
    }
    
    // Advanced operations
    if ([
      TransformationType.CUSTOM_FUNCTION,
      TransformationType.JAVASCRIPT,
      TransformationType.SQL,
      TransformationType.FORMULA
    ].includes(type)) {
      return 'Advanced';
    }
    
    return 'Other';
  };

  // Function to get icon for a transformation type
  const getTransformationIcon = (type: TransformationType) => {
    switch (type) {
      case TransformationType.RENAME_COLUMN:
      case TransformationType.DROP_COLUMN:
      case TransformationType.REORDER_COLUMNS:
        return <ArrowUpDown className="h-4 w-4" />;
      
      case TransformationType.CAST_TYPE:
      case TransformationType.PARSE_DATE:
      case TransformationType.PARSE_NUMBER:
        return <Calendar className="h-4 w-4" />;
      
      case TransformationType.REPLACE_VALUE:
      case TransformationType.FILL_NULL:
      case TransformationType.MAP_VALUES:
        return <Text className="h-4 w-4" />;
      
      case TransformationType.TO_UPPERCASE:
      case TransformationType.TO_LOWERCASE:
      case TransformationType.TRIM:
      case TransformationType.SUBSTRING:
      case TransformationType.CONCAT:
      case TransformationType.SPLIT:
        return <Text className="h-4 w-4" />;
      
      case TransformationType.FILTER:
      case TransformationType.SORT:
        return <Filter className="h-4 w-4" />;
      
      case TransformationType.GROUP_BY:
      case TransformationType.AGGREGATE:
      case TransformationType.JOIN:
      case TransformationType.UNION:
        return <SortAsc className="h-4 w-4" />;
      
      case TransformationType.REMOVE_DUPLICATES:
      case TransformationType.VALIDATE:
        return <FileText className="h-4 w-4" />;
      
      case TransformationType.CUSTOM_FUNCTION:
      case TransformationType.JAVASCRIPT:
      case TransformationType.SQL:
      case TransformationType.FORMULA:
        return <FileText className="h-4 w-4" />;
      
      default:
        return <GitBranch className="h-4 w-4" />;
    }
  };

  // Function to get description for transformation parameters
  const getParameterDescription = (rule: any) => {
    switch (rule.type) {
      case TransformationType.SUBSTRING:
        return `Extract from position ${rule.parameters.start} to ${rule.parameters.end}`;
      case TransformationType.PARSE_NUMBER:
        return `Format with ${rule.parameters.decimalSeparator} decimal separator`;
      case TransformationType.FILTER:
        if (rule.parameters.conditions && rule.parameters.conditions.length > 0) {
          const condition = rule.parameters.conditions[0];
          return `${condition.column} ${condition.operator} ${condition.value}`;
        }
        return 'Filter data';
      case TransformationType.CUSTOM_FUNCTION:
        return 'Apply custom JavaScript function';
      default:
        return `Transform ${rule.columns ? rule.columns.join(', ') : ''}`;
    }
  };

  // Function to handle adding a new rule
  const handleAddRule = () => {
    setCurrentRule(null);
    setSelectedType('');
    setShowDialog(true);
  };

  // Function to handle editing a rule
  const handleEditRule = (rule: any) => {
    setCurrentRule(rule);
    setSelectedType(rule.type);
    setShowDialog(true);
  };

  // Function to handle duplicating a rule
  const handleDuplicateRule = (rule: any) => {
    const newRule = {
      ...rule,
      id: Math.max(...transformationRules.map(r => r.id)) + 1,
      name: `${rule.name} (Copy)`
    };
    setTransformationRules([...transformationRules, newRule]);
  };

  // Function to handle deleting a rule
  const handleDeleteRule = (id: number) => {
    if (confirm('Are you sure you want to delete this transformation rule?')) {
      setTransformationRules(transformationRules.filter(rule => rule.id !== id));
    }
  };

  // Function to handle testing a rule
  const handleTestRule = (id: number) => {
    console.log(`Testing transformation rule ID: ${id}`);
    // In a real implementation, this would use the TransformationService
  };

  // Function to handle saving a rule
  const handleSaveRule = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real implementation, this would save the rule to the backend
    setShowDialog(false);
  };

  // Filter rules based on active tab
  const getFilteredRules = () => {
    if (activeTab === 'all') {
      return transformationRules;
    }
    
    return transformationRules.filter(rule => {
      const category = getTransformationCategory(rule.type);
      return category.toLowerCase().includes(activeTab.toLowerCase());
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Transformation Rules</h2>
          <p className="text-muted-foreground">
            Define and manage data transformation rules
          </p>
        </div>
        <Button onClick={handleAddRule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transformation Rule
        </Button>
      </div>

      {/* Transformation Rule Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Rules</TabsTrigger>
          <TabsTrigger value="column">Column Operations</TabsTrigger>
          <TabsTrigger value="data">Data Type Operations</TabsTrigger>
          <TabsTrigger value="value">Value Operations</TabsTrigger>
          <TabsTrigger value="row">Row Operations</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transformation Rule List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Transformation Rules</CardTitle>
          <CardDescription>
            Rules that can be applied to ETL data pipelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parameters</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredRules().map(rule => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {getTransformationIcon(rule.type)}
                      <span className="ml-2">{rule.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {rule.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {getParameterDescription(rule)}
                  </TableCell>
                  <TableCell>
                    {rule.priority}
                  </TableCell>
                  <TableCell>
                    {rule.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500 border-red-500">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {rule.tags && rule.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleTestRule(rule.id)}>
                        <Play className="h-4 w-4" />
                        <span className="sr-only">Test</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDuplicateRule(rule)}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Duplicate</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEditRule(rule)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteRule(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{currentRule ? 'Edit Transformation Rule' : 'Add New Transformation Rule'}</DialogTitle>
            <DialogDescription>
              Configure the transformation rule properties
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRule}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  defaultValue={currentRule?.name || ''}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as TransformationType)}
                >
                  <SelectTrigger id="type" className="col-span-3">
                    <SelectValue placeholder="Select a transformation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TransformationType.RENAME_COLUMN}>Rename Column</SelectItem>
                    <SelectItem value={TransformationType.DROP_COLUMN}>Drop Column</SelectItem>
                    <SelectItem value={TransformationType.FILTER}>Filter Data</SelectItem>
                    <SelectItem value={TransformationType.CAST_TYPE}>Cast Data Type</SelectItem>
                    <SelectItem value={TransformationType.PARSE_NUMBER}>Parse Number</SelectItem>
                    <SelectItem value={TransformationType.SUBSTRING}>Extract Substring</SelectItem>
                    <SelectItem value={TransformationType.CUSTOM_FUNCTION}>Custom Function</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  defaultValue={currentRule?.priority || '1'}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">
                  Tags
                </Label>
                <Input
                  id="tags"
                  defaultValue={currentRule?.tags?.join(', ') || ''}
                  placeholder="comma, separated, tags"
                  className="col-span-3"
                />
              </div>

              {/* Dynamic fields based on type */}
              {selectedType === TransformationType.SUBSTRING && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="column" className="text-right">
                      Source Column
                    </Label>
                    <Input
                      id="column"
                      defaultValue={currentRule?.parameters?.column || ''}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="targetColumn" className="text-right">
                      Target Column
                    </Label>
                    <Input
                      id="targetColumn"
                      defaultValue={currentRule?.parameters?.targetColumn || ''}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="start" className="text-right">
                      Start Position
                    </Label>
                    <Input
                      id="start"
                      type="number"
                      min="0"
                      defaultValue={currentRule?.parameters?.start || '0'}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="end" className="text-right">
                      End Position
                    </Label>
                    <Input
                      id="end"
                      type="number"
                      min="0"
                      defaultValue={currentRule?.parameters?.end || ''}
                      className="col-span-3"
                    />
                  </div>
                </>
              )}

              {selectedType === TransformationType.CUSTOM_FUNCTION && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    JavaScript Code
                  </Label>
                  <Textarea
                    id="code"
                    defaultValue={currentRule?.parameters?.code || '// Return transformed data\nreturn data;'}
                    className="col-span-3 min-h-[200px] font-mono"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Active
                </Label>
                <div className="flex items-center col-span-3">
                  <input
                    type="checkbox"
                    id="active"
                    defaultChecked={currentRule?.isActive ?? true}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-sm">Rule is active and available for ETL jobs</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Save Transformation Rule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransformationRuleManager;