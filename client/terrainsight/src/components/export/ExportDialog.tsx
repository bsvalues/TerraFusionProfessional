import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportFormat, ExportTemplate } from '@/services/exportService';

interface ExportDialogProps {
  trigger?: React.ReactNode;
  onExport: (format: string, options: ExportOptions) => void;
  title?: string;
  description?: string;
  className?: string;
  /**
   * Whether to show template selection options
   */
  showTemplates?: boolean;
  /**
   * Additional options for customizing field selection
   */
  customizableFields?: string[];
}

export interface ExportOptions {
  fileName?: string;
  dateGenerated?: boolean;
  includeHeaders?: boolean;
  customFields?: string[];
  title?: string;
  description?: string;
  pageSize?: 'letter' | 'legal' | 'a4' | 'a3';
  orientation?: 'portrait' | 'landscape';
  includeImages?: boolean;
  templateName?: string;
  templateOptions?: Record<string, any>;
}

export const ExportDialog = ({
  trigger,
  onExport,
  title = 'Export Data',
  description = 'Choose export format and options',
  className,
  showTemplates = false,
  customizableFields = [],
}: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('format');
  const [exportFormat, setExportFormat] = useState<string>(ExportFormat.PDF);
  const [fileName, setFileName] = useState('spatialest-export');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [pageSize, setPageSize] = useState<'letter' | 'legal' | 'a4' | 'a3'>('letter');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [exportTitle, setExportTitle] = useState('Property Export');
  const [exportDescription, setExportDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(ExportTemplate.DEFAULT);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  
  const handleExport = () => {
    onExport(exportFormat, {
      fileName,
      dateGenerated: includeMetadata,
      includeHeaders,
      customFields: selectedFields,
      title: exportTitle,
      description: exportDescription,
      pageSize,
      orientation,
      includeImages,
      templateName: selectedTemplate,
    });
    setOpen(false);
  };
  
  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field) 
        : [...prev, field]
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Export</Button>}
      </DialogTrigger>
      <DialogContent className={`${className} max-w-3xl`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">Format & Options</TabsTrigger>
            {showTemplates && (
              <TabsTrigger value="templates">Templates</TabsTrigger>
            )}
            <TabsTrigger value="fields">Fields & Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="format" className="space-y-4 mt-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="export-format" className="text-right">
                Format
              </Label>
              <Select
                value={exportFormat}
                onValueChange={setExportFormat}
              >
                <SelectTrigger id="export-format" className="col-span-3">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ExportFormat.PDF}>PDF Document</SelectItem>
                  <SelectItem value={ExportFormat.CSV}>CSV Spreadsheet</SelectItem>
                  <SelectItem value={ExportFormat.EXCEL}>Excel Spreadsheet</SelectItem>
                  <SelectItem value={ExportFormat.JSON}>JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file-name" className="text-right">
                File Name
              </Label>
              <Input
                id="file-name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            {(exportFormat === ExportFormat.PDF) && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="page-size" className="text-right">
                    Page Size
                  </Label>
                  <Select
                    value={pageSize}
                    onValueChange={(value: 'letter' | 'legal' | 'a4' | 'a3') => setPageSize(value)}
                  >
                    <SelectTrigger id="page-size" className="col-span-3">
                      <SelectValue placeholder="Select page size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="a3">A3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="orientation" className="text-right">
                    Orientation
                  </Label>
                  <RadioGroup 
                    value={orientation} 
                    onValueChange={(value: 'portrait' | 'landscape') => setOrientation(value)}
                    className="col-span-3 flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="portrait" id="portrait" />
                      <Label htmlFor="portrait">Portrait</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="landscape" id="landscape" />
                      <Label htmlFor="landscape">Landscape</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3 flex items-center space-x-2">
                    <Checkbox 
                      id="include-images"
                      checked={includeImages}
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          setIncludeImages(checked);
                        }
                      }}
                    />
                    <Label htmlFor="include-images">Include images</Label>
                  </div>
                </div>
              </>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="include-metadata" 
                  checked={includeMetadata} 
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setIncludeMetadata(checked);
                    }
                  }}
                />
                <Label htmlFor="include-metadata">Include date and metadata</Label>
              </div>
            </div>
            
            {(exportFormat === ExportFormat.CSV || exportFormat === ExportFormat.EXCEL) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3 flex items-center space-x-2">
                  <Checkbox 
                    id="include-headers" 
                    checked={includeHeaders} 
                    onCheckedChange={(checked) => {
                      if (typeof checked === 'boolean') {
                        setIncludeHeaders(checked);
                      }
                    }}
                  />
                  <Label htmlFor="include-headers">Include column headers</Label>
                </div>
              </div>
            )}
          </TabsContent>
          
          {showTemplates && (
            <TabsContent value="templates" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-3">
                <Label className="text-sm font-medium">Export Template</Label>
                <RadioGroup 
                  value={selectedTemplate} 
                  onValueChange={setSelectedTemplate}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 border p-3 rounded-md">
                    <RadioGroupItem value={ExportTemplate.DEFAULT} id="default-template" className="mt-1" />
                    <div>
                      <Label htmlFor="default-template" className="font-medium">Standard Report</Label>
                      <p className="text-sm text-gray-500">Basic property information in a tabular format</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border p-3 rounded-md">
                    <RadioGroupItem value={ExportTemplate.RESIDENTIAL_DETAIL} id="residential-template" className="mt-1" />
                    <div>
                      <Label htmlFor="residential-template" className="font-medium">Residential Detail</Label>
                      <p className="text-sm text-gray-500">Comprehensive details about residential properties</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border p-3 rounded-md">
                    <RadioGroupItem value={ExportTemplate.COMMERCIAL_DETAIL} id="commercial-template" className="mt-1" />
                    <div>
                      <Label htmlFor="commercial-template" className="font-medium">Commercial Detail</Label>
                      <p className="text-sm text-gray-500">Commercial property details with business-focused metrics</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border p-3 rounded-md">
                    <RadioGroupItem value={ExportTemplate.COMPARATIVE_ANALYSIS} id="comparative-template" className="mt-1" />
                    <div>
                      <Label htmlFor="comparative-template" className="font-medium">Comparative Analysis</Label>
                      <p className="text-sm text-gray-500">Side-by-side comparison of selected properties</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border p-3 rounded-md">
                    <RadioGroupItem value={ExportTemplate.VALUATION_SUMMARY} id="valuation-template" className="mt-1" />
                    <div>
                      <Label htmlFor="valuation-template" className="font-medium">Valuation Summary</Label>
                      <p className="text-sm text-gray-500">Focused on property values with statistics and charts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 border p-3 rounded-md">
                    <RadioGroupItem value={ExportTemplate.NEIGHBORHOOD_REPORT} id="neighborhood-template" className="mt-1" />
                    <div>
                      <Label htmlFor="neighborhood-template" className="font-medium">Neighborhood Report</Label>
                      <p className="text-sm text-gray-500">Properties grouped by neighborhood with area statistics</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="fields" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Report Title</Label>
                <Input
                  value={exportTitle}
                  onChange={(e) => setExportTitle(e.target.value)}
                  placeholder="Enter report title"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Description</Label>
                <Input
                  value={exportDescription}
                  onChange={(e) => setExportDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>
            
            {customizableFields.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Select Fields to Include</Label>
                <div className="grid grid-cols-2 gap-2">
                  {customizableFields.map(field => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`field-${field}`}
                        checked={selectedFields.includes(field)}
                        onCheckedChange={() => handleFieldToggle(field)}
                      />
                      <Label htmlFor={`field-${field}`}>{field}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};