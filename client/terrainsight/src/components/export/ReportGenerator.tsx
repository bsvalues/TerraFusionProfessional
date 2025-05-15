import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ReportBuilder, 
  ReportSection, 
  ReportTemplate,
  Report,
  ReportSectionType
} from '../../services/reporting/reportBuilderService';
import { Property } from '@shared/schema';

/**
 * Report Generator Component Props
 */
interface ReportGeneratorProps {
  propertyId?: number;
  properties?: Property[];
  className?: string;
}

/**
 * Report Generator Component
 * Provides UI for creating, customizing, and exporting property reports
 */
export const ReportGenerator = ({ propertyId, properties = [], className }: ReportGeneratorProps) => {
  const [reportTitle, setReportTitle] = useState('Property Report');
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    'property-summary': true,
    'valuation-details': true,
    'tax-breakdown': true,
    'comparison': false,
    'neighborhood-analysis': false,
    'market-trends': false,
    'property-history': false
  });
  const [activeTab, setActiveTab] = useState('sections');
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);
  
  // Available section types with display names
  const availableSections: Array<{ id: ReportSectionType; name: string; description: string }> = [
    { 
      id: 'property-summary', 
      name: 'Property Summary', 
      description: 'Basic property information including address, size, and features'
    },
    { 
      id: 'valuation-details', 
      name: 'Valuation Details', 
      description: 'Detailed property valuation information and assessment history'
    },
    { 
      id: 'tax-breakdown', 
      name: 'Tax Breakdown', 
      description: 'Property tax details showing tax rates, exemptions, and payment information'
    },
    { 
      id: 'comparison', 
      name: 'Property Comparison', 
      description: 'Comparative analysis with similar properties in the area'
    },
    { 
      id: 'neighborhood-analysis', 
      name: 'Neighborhood Analysis', 
      description: 'Demographic and market data for the surrounding neighborhood'
    },
    { 
      id: 'market-trends', 
      name: 'Market Trends', 
      description: 'Historical and projected trends for the local real estate market'
    },
    { 
      id: 'property-history', 
      name: 'Property History', 
      description: 'Timeline of ownership, improvements, and value changes'
    }
  ];
  
  // Templates that can be used to generate reports quickly
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'basic',
      name: 'Basic Property Report',
      description: 'Essential property information and valuation',
      sections: [
        {
          id: 'summary',
          title: 'Property Summary',
          type: 'property-summary',
          order: 0,
          content: {}
        },
        {
          id: 'valuation',
          title: 'Valuation Details',
          type: 'valuation-details',
          order: 1,
          content: {}
        }
      ]
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Property Report',
      description: 'Complete property analysis with all available sections',
      sections: availableSections.map((section, index) => ({
        id: section.id,
        title: section.name,
        type: section.id,
        order: index,
        content: {}
      }))
    },
    {
      id: 'tax',
      name: 'Tax Assessment Report',
      description: 'Focused on property taxes and valuation for tax purposes',
      sections: [
        {
          id: 'summary',
          title: 'Property Summary',
          type: 'property-summary',
          order: 0,
          content: {}
        },
        {
          id: 'tax',
          title: 'Tax Breakdown',
          type: 'tax-breakdown',
          order: 1,
          content: {}
        },
        {
          id: 'valuation',
          title: 'Valuation Details',
          type: 'valuation-details',
          order: 2,
          content: {}
        }
      ]
    }
  ];
  
  /**
   * Handles toggling a section on/off
   */
  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  /**
   * Loads a template for report generation
   */
  const handleLoadTemplate = (template: ReportTemplate) => {
    // Reset section selections
    const newSelections: Record<string, boolean> = {};
    
    // Mark all template sections as selected
    template.sections.forEach(section => {
      newSelections[section.type] = true;
    });
    
    // Mark any other sections as unselected
    availableSections.forEach(section => {
      if (newSelections[section.id] === undefined) {
        newSelections[section.id] = false;
      }
    });
    
    setSelectedSections(newSelections);
    setReportTitle(`${template.name}`);
  };
  
  /**
   * Generates a report based on current selections
   */
  const handleGenerateReport = () => {
    const reportBuilder = new ReportBuilder();
    const report = reportBuilder.createReport(reportTitle);
    
    // Add selected sections to the report
    Object.entries(selectedSections).forEach(([sectionType, isSelected], index) => {
      if (isSelected) {
        const sectionInfo = availableSections.find(s => s.id === sectionType);
        if (sectionInfo) {
          const section: ReportSection = {
            id: `section_${sectionType}`,
            title: sectionInfo.name,
            type: sectionType as ReportSectionType,
            order: index,
            content: { 
              propertyId,
              properties: properties || []
            }
          };
          reportBuilder.addSection(report, section);
        }
      }
    });
    
    setGeneratedReport(report);
    setActiveTab('preview');
  };
  
  /**
   * Exports the report (placeholder)
   */
  const handleExportReport = () => {
    // This would be implemented with actual export functionality
    alert('Report export feature not yet implemented');
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Property Report Generator</CardTitle>
        <CardDescription>
          Create customized property reports with the information you need
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sections">Report Sections</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sections" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title</Label>
              <Input 
                id="report-title" 
                value={reportTitle} 
                onChange={(e) => setReportTitle(e.target.value)} 
                placeholder="Enter report title"
              />
            </div>
            
            <div className="space-y-1">
              <Label>Select Report Sections</Label>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-4">
                  {availableSections.map((section) => (
                    <div key={section.id} className="flex items-start space-x-2">
                      <Checkbox 
                        id={section.id} 
                        checked={selectedSections[section.id]} 
                        onCheckedChange={() => handleSectionToggle(section.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={section.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {section.name}
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((template) => (
                <Card key={template.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">Includes:</div>
                      <ul className="list-disc pl-5">
                        {template.sections.map((section) => (
                          <li key={section.id}>{section.title}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            {generatedReport ? (
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium">{generatedReport.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Generated on {generatedReport.createdAt.toLocaleDateString()}
                  </p>
                  
                  <div className="mt-4 space-y-4">
                    {generatedReport.sections.map((section) => (
                      <div key={section.id} className="border-t pt-4">
                        <h4 className="font-medium">{section.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {/* Display section type for demo purposes */}
                          Section type: {section.type}
                        </p>
                        {/* This would display actual property data in the real implementation */}
                        <p className="mt-2 text-sm">
                          Content placeholder for {section.title} section.
                          {section.content.propertyId && 
                            ` Related to property ID: ${section.content.propertyId}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  No report generated yet. Select sections and click "Generate Report".
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setActiveTab(activeTab === 'sections' ? 'templates' : 'sections')}
        >
          {activeTab === 'preview' ? 'Back to Sections' : 
            activeTab === 'sections' ? 'View Templates' : 'View Sections'}
        </Button>
        {activeTab === 'preview' && generatedReport ? (
          <Button onClick={handleExportReport}>Export Report</Button>
        ) : (
          <Button onClick={handleGenerateReport}>Generate Report</Button>
        )}
      </CardFooter>
    </Card>
  );
};