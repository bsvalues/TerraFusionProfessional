import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import USPAPExportPanel from '@/components/export/USPAPExportPanel';
import { ExportService, Property } from '@/services/exportService'; 
import { Button } from '@/components/ui/button';
import { Check, Download, FileText, Info } from 'lucide-react';
import { OneClickExport } from '@/components/export/OneClickExport';
import { useToast } from '@/hooks/use-toast';

/**
 * USPAP Export Page
 * Showcases the various export functionality with USPAP compliance
 */
const USPAPExportPage = () => {
  const { toast } = useToast();
  
  // Sample property data for demonstration
  const sampleProperties: Property[] = [
    {
      id: 1,
      address: '750 George Washington Way, Richland, WA 99352',
      price: 1250000,
      sqft: 5200,
      bedrooms: undefined,
      bathrooms: undefined,
      propertyType: 'Commercial',
      yearBuilt: 2005,
      zoning: 'C-3'
    },
    {
      id: 2,
      address: '425 Columbia Center Blvd, Kennewick, WA 99336',
      price: 1150000,
      sqft: 4800,
      bedrooms: undefined,
      bathrooms: undefined,
      propertyType: 'Retail',
      yearBuilt: 2007,
      zoning: 'C-2'
    },
    {
      id: 3,
      address: '1835 Leslie Rd, Richland, WA 99352',
      price: 1325000,
      sqft: 5500,
      bedrooms: undefined,
      bathrooms: undefined,
      propertyType: 'Retail',
      yearBuilt: 2001,
      zoning: 'C-1'
    }
  ];
  
  // Handle quick exports
  const handleQuickExport = async (format: string) => {
    try {
      toast({
        title: 'Preparing Export',
        description: `Generating ${format.toUpperCase()} export...`,
      });
      
      let result;
      
      switch (format) {
        case 'csv':
          result = await ExportService.exportPropertiesToCSV(sampleProperties);
          break;
        case 'json':
          result = await ExportService.exportPropertiesToJSON(sampleProperties);
          break;
        case 'excel':
          result = await ExportService.exportPropertiesToExcel(sampleProperties);
          break;
        case 'pdf':
          result = await ExportService.exportPropertiesToPDF(sampleProperties);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      if (result.success) {
        toast({
          title: 'Export Complete',
          description: `Successfully exported ${sampleProperties.length} properties to ${result.fileName}`,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An error occurred during export',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">USPAP-Compliant Export Tools</h1>
        <p className="text-muted-foreground">
          Generate standardized property reports compliant with Uniform Standards of Professional Appraisal Practice
        </p>
      </div>
      
      <Tabs defaultValue="uspap">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="uspap">USPAP Export</TabsTrigger>
          <TabsTrigger value="quick">Quick Export</TabsTrigger>
          <TabsTrigger value="about">About USPAP</TabsTrigger>
        </TabsList>
        
        <TabsContent value="uspap" className="py-4">
          <USPAPExportPanel />
        </TabsContent>
        
        <TabsContent value="quick" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Export Options</CardTitle>
              <CardDescription>
                Export property data in various formats with a single click
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto flex flex-col items-center justify-center p-6 space-y-2"
                  onClick={() => handleQuickExport('csv')}
                >
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="text-lg font-medium">CSV Export</span>
                  <span className="text-sm text-muted-foreground text-center">
                    Comma-separated values for spreadsheet applications
                  </span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto flex flex-col items-center justify-center p-6 space-y-2"
                  onClick={() => handleQuickExport('json')}
                >
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="text-lg font-medium">JSON Export</span>
                  <span className="text-sm text-muted-foreground text-center">
                    Structured data format for developers
                  </span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto flex flex-col items-center justify-center p-6 space-y-2"
                  onClick={() => handleQuickExport('excel')}
                >
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="text-lg font-medium">Excel Export</span>
                  <span className="text-sm text-muted-foreground text-center">
                    Native spreadsheet format with formatting
                  </span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto flex flex-col items-center justify-center p-6 space-y-2"
                  onClick={() => handleQuickExport('pdf')}
                >
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="text-lg font-medium">PDF Export</span>
                  <span className="text-sm text-muted-foreground text-center">
                    Portable document format for sharing
                  </span>
                </Button>
              </div>
              
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-3">Comprehensive Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center space-y-4">
                        <Download className="h-8 w-8 text-primary" />
                        <h4 className="text-xl font-medium">All Analysis Reports</h4>
                        <p className="text-center text-muted-foreground">
                          Export all property analysis reports in a single document
                        </p>
                        <OneClickExport 
                          text="One-Click Export" 
                          icon={<Check className="h-4 w-4 mr-2" />}
                          size="lg"
                          className="mt-2 w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center space-y-4">
                        <Download className="h-8 w-8 text-primary" />
                        <h4 className="text-xl font-medium">Property Portfolio</h4>
                        <p className="text-center text-muted-foreground">
                          Export comprehensive portfolio of selected properties
                        </p>
                        <Button size="lg" className="mt-2 w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Export Portfolio
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="about" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>About USPAP Standards</CardTitle>
              <CardDescription>
                Understanding the Uniform Standards of Professional Appraisal Practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <Info className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium">What is USPAP?</h3>
                  <p className="text-muted-foreground">
                    The Uniform Standards of Professional Appraisal Practice (USPAP) are the generally accepted standards for professional appraisal practice in North America. USPAP contains standards for all types of appraisal services, including real estate, personal property, business, and mass appraisal.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Check className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium">USPAP Compliance Benefits</h3>
                  <p className="text-muted-foreground">
                    Adhering to USPAP standards ensures that appraisals meet the minimum quality requirements accepted by the appraisal profession and various regulatory bodies. It helps maintain public trust in professional appraisal practice and provides consistency in the appraisal process.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Info className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium">Key USPAP Requirements</h3>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    <li>Clear identification of the client and intended users</li>
                    <li>Statement of the intended use of the appraisal</li>
                    <li>Definition of value and its source</li>
                    <li>Effective date of the appraisal</li>
                    <li>Scope of work used to develop the appraisal</li>
                    <li>All assumptions and limiting conditions</li>
                    <li>Information analyzed and reasoning that led to conclusions</li>
                    <li>Appraiser's certification and signature</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="italic text-sm">
                  "The GeospatialAnalyzerBS export module is designed to help generate reports that comply with USPAP standards, streamlining the reporting process for property assessors and appraisers. Our templates follow the structural requirements of USPAP while allowing customization for specific appraisal needs."
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default USPAPExportPage;