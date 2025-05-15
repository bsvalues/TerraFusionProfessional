import React, { useState } from 'react';
import { 
  ExportFormat, 
  ExportTemplate,
  USPAPExportOptions,
  USPAPComplianceConfig
} from '@/services/exportService';
import { USPAPExportService, DEFAULT_USPAP_CONFIG } from '@/services/USPAPExportService';
import { useToast } from '@/hooks/use-toast';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File, 
  FileCode
} from 'lucide-react';

const USPAPExportPanel: React.FC = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.PDF);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate>(ExportTemplate.FULL_NARRATIVE_APPRAISAL);
  
  // USPAP compliance settings
  const [complianceConfig, setComplianceConfig] = useState<USPAPComplianceConfig>({
    ...DEFAULT_USPAP_CONFIG
  });

  // Additional export options
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeMaps, setIncludeMaps] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [watermark, setWatermark] = useState('');
  
  // Toggle a compliance setting
  const toggleComplianceSetting = (setting: keyof USPAPComplianceConfig) => {
    setComplianceConfig(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  // Get icon based on export format
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case ExportFormat.PDF:
        return <File className="h-4 w-4" />;
      case ExportFormat.EXCEL:
        return <FileSpreadsheet className="h-4 w-4" />;
      case ExportFormat.CSV:
        return <FileText className="h-4 w-4" />;
      case ExportFormat.JSON:
        return <File className="h-4 w-4" />;
      case ExportFormat.HTML:
        return <FileCode className="h-4 w-4" />;
      case ExportFormat.WORD:
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  // Handle export action
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Show loading toast
      toast({
        title: "Preparing USPAP Export",
        description: `Creating ${selectedFormat} export with the ${selectedTemplate} template...`,
      });
      
      // Prepare export options
      const exportOptions: USPAPExportOptions = {
        format: selectedFormat,
        template: selectedTemplate,
        compliance: complianceConfig,
        includePhotos,
        includeMaps,
        includeCharts,
        watermark: watermark || undefined
      };
      
      // Get a sample report for demonstration
      const sampleReport = USPAPExportService.getSampleUSPAPReport();
      
      // Perform the export
      const result = await USPAPExportService.exportReport(
        sampleReport,
        selectedFormat,
        exportOptions
      );
      
      if (result.success) {
        toast({
          title: "Export Complete",
          description: `Successfully exported report to ${result.fileName}${result.error ? ' (Note: ' + result.error + ')' : ''}`,
        });
      } else {
        throw new Error(result.error || "Unknown export error");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to generate export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle template export
  const handleTemplateExport = async () => {
    try {
      setIsExporting(true);
      
      // Show loading toast
      toast({
        title: "Preparing Template Export",
        description: `Creating ${selectedFormat} export with the ${selectedTemplate} template...`,
      });
      
      // Prepare export options
      const exportOptions: USPAPExportOptions = {
        format: selectedFormat,
        template: selectedTemplate,
        compliance: complianceConfig,
        includePhotos,
        includeMaps,
        includeCharts,
        watermark: watermark || undefined
      };
      
      // Sample data to pass to the template
      const sampleData = {
        address: "Sample Property, Benton County, WA",
        propertyType: "Commercial"
      };
      
      // Perform the export
      const result = await USPAPExportService.exportWithTemplate(
        sampleData,
        selectedTemplate,
        selectedFormat,
        exportOptions
      );
      
      if (result.success) {
        toast({
          title: "Template Export Complete",
          description: `Successfully exported template to ${result.fileName}${result.error ? ' (Note: ' + result.error + ')' : ''}`,
        });
      } else {
        throw new Error(result.error || "Unknown export error");
      }
    } catch (error) {
      console.error("Template export failed:", error);
      toast({
        title: "Template Export Failed",
        description: error instanceof Error ? error.message : "Failed to generate template export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>USPAP-Compliant Export</CardTitle>
        <CardDescription>
          Generate standardized appraisal reports following USPAP guidelines
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select 
            value={selectedFormat} 
            onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ExportFormat.PDF}>
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span>PDF Document</span>
                </div>
              </SelectItem>
              <SelectItem value={ExportFormat.WORD}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Word Document (DOCX)</span>
                </div>
              </SelectItem>
              <SelectItem value={ExportFormat.HTML}>
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  <span>HTML Document</span>
                </div>
              </SelectItem>
              <SelectItem value={ExportFormat.TEXT}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Plain Text</span>
                </div>
              </SelectItem>
              <SelectItem value={ExportFormat.EXCEL}>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel Spreadsheet (XLSX)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Report Template</Label>
          <Select 
            value={selectedTemplate} 
            onValueChange={(value) => setSelectedTemplate(value as ExportTemplate)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ExportTemplate.FULL_NARRATIVE_APPRAISAL}>Full Narrative Appraisal</SelectItem>
              <SelectItem value={ExportTemplate.RESTRICTED_APPRAISAL}>Restricted Appraisal</SelectItem>
              <SelectItem value={ExportTemplate.SUMMARY_APPRAISAL}>Summary Appraisal</SelectItem>
              <SelectItem value={ExportTemplate.INCOME_APPROACH_ANALYSIS}>Income Approach Analysis</SelectItem>
              <SelectItem value={ExportTemplate.SALES_COMPARISON_ANALYSIS}>Sales Comparison Analysis</SelectItem>
              <SelectItem value={ExportTemplate.COST_APPROACH_ANALYSIS}>Cost Approach Analysis</SelectItem>
              <SelectItem value={ExportTemplate.RESIDENTIAL_VALUATION}>Residential Valuation</SelectItem>
              <SelectItem value={ExportTemplate.COMMERCIAL_VALUATION}>Commercial Valuation</SelectItem>
              <SelectItem value={ExportTemplate.INDUSTRIAL_VALUATION}>Industrial Valuation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* USPAP Compliance Settings */}
        <div className="space-y-3">
          <Label>USPAP Compliance Settings</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="letterOfTransmittal" 
                checked={complianceConfig.includeLetterOfTransmittal}
                onCheckedChange={() => toggleComplianceSetting('includeLetterOfTransmittal')}
              />
              <Label htmlFor="letterOfTransmittal">Include Letter of Transmittal</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="certification" 
                checked={complianceConfig.includeCertification}
                onCheckedChange={() => toggleComplianceSetting('includeCertification')}
              />
              <Label htmlFor="certification">Include Certification</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="assumptions" 
                checked={complianceConfig.includeAssumptionsAndLimitingConditions}
                onCheckedChange={() => toggleComplianceSetting('includeAssumptionsAndLimitingConditions')}
              />
              <Label htmlFor="assumptions">Include Assumptions & Limiting Conditions</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="qualifications" 
                checked={complianceConfig.includeAppraiserQualifications}
                onCheckedChange={() => toggleComplianceSetting('includeAppraiserQualifications')}
              />
              <Label htmlFor="qualifications">Include Appraiser Qualifications</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="confidentiality" 
                checked={complianceConfig.includeConfidentialityStatement}
                onCheckedChange={() => toggleComplianceSetting('includeConfidentialityStatement')}
              />
              <Label htmlFor="confidentiality">Include Confidentiality Statement</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="nonDiscrimination" 
                checked={complianceConfig.includeNonDiscriminationStatement}
                onCheckedChange={() => toggleComplianceSetting('includeNonDiscriminationStatement')}
              />
              <Label htmlFor="nonDiscrimination">Include Non-Discrimination Statement</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="scopeOfWork" 
                checked={complianceConfig.includeScopeOfWork}
                onCheckedChange={() => toggleComplianceSetting('includeScopeOfWork')}
              />
              <Label htmlFor="scopeOfWork">Include Scope of Work</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="signatureRequired" 
                checked={complianceConfig.signatureRequired}
                onCheckedChange={() => toggleComplianceSetting('signatureRequired')}
              />
              <Label htmlFor="signatureRequired">Include Signature Block</Label>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Additional Options */}
        <div className="space-y-3">
          <Label>Additional Options</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includePhotos" 
                checked={includePhotos}
                onCheckedChange={() => setIncludePhotos(!includePhotos)}
              />
              <Label htmlFor="includePhotos">Include Photos</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeMaps" 
                checked={includeMaps}
                onCheckedChange={() => setIncludeMaps(!includeMaps)}
              />
              <Label htmlFor="includeMaps">Include Maps</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeCharts" 
                checked={includeCharts}
                onCheckedChange={() => setIncludeCharts(!includeCharts)}
              />
              <Label htmlFor="includeCharts">Include Charts & Graphs</Label>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full sm:w-auto"
        >
          {isExporting ? (
            <>
              <span className="animate-spin mr-2">◌</span>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              <span>Export Sample Report</span>
            </>
          )}
        </Button>
        
        <Button 
          onClick={handleTemplateExport} 
          disabled={isExporting}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {isExporting ? (
            <span>Please wait...</span>
          ) : (
            <>
              {getFormatIcon(selectedFormat)}
              <span className="ml-2">Export Using Template</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default USPAPExportPanel;