import React from 'react';
import { Button } from '@/components/ui/button';
import { ExportDialog } from './ExportDialog';
import { ExportService, ExportFormat, ExportTemplate } from '@/services/exportService';
import { Property } from '@/shared/schema';
import { FileDownIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  /**
   * Properties to export
   */
  properties: Property[];
  
  /**
   * Optional button text
   */
  text?: string;
  
  /**
   * Whether to include templates in export options
   */
  showTemplates?: boolean;
  
  /**
   * Additional fields that can be selected by the user
   */
  customizableFields?: string[];
  
  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  
  /**
   * Optional CSS class for styling
   */
  className?: string;
}

/**
 * Export button component with dialog for export options
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
  properties,
  text = 'Export',
  showTemplates = true,
  customizableFields = ['bedrooms', 'bathrooms', 'yearBuilt', 'squareFeet', 'lotSize', 'neighborhood', 'zoning'],
  variant = 'outline',
  className,
}) => {
  const { toast } = useToast();
  
  const handleExport = (format: string, options: any) => {
    if (!properties || properties.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no properties available to export.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (options.templateName && options.templateName !== ExportTemplate.DEFAULT) {
        // Use template-based export
        ExportService.exportWithTemplate(
          properties,
          options.templateName,
          format as ExportFormat,
          {
            fileName: options.fileName,
            title: options.title,
            description: options.description,
            dateGenerated: options.dateGenerated,
            includeHeaders: options.includeHeaders,
            customFields: options.customFields,
            pageSize: options.pageSize,
            orientation: options.orientation,
            includeImages: options.includeImages,
          }
        );
      } else {
        // Use format-based export
        switch (format) {
          case ExportFormat.CSV:
            ExportService.exportPropertiesToCSV(properties, {
              fileName: options.fileName,
              title: options.title,
              description: options.description,
              dateGenerated: options.dateGenerated,
              includeHeaders: options.includeHeaders,
              customFields: options.customFields,
            });
            break;
            
          case ExportFormat.JSON:
            ExportService.exportPropertiesToJSON(properties, {
              fileName: options.fileName,
              title: options.title,
              description: options.description,
              dateGenerated: options.dateGenerated,
              customFields: options.customFields,
            });
            break;
            
          case ExportFormat.EXCEL:
            ExportService.exportPropertiesToExcel(properties, {
              fileName: options.fileName,
              title: options.title,
              description: options.description,
              dateGenerated: options.dateGenerated,
              includeHeaders: options.includeHeaders,
              customFields: options.customFields,
            });
            break;
            
          case ExportFormat.PDF:
          default:
            ExportService.exportPropertiesToPDF(properties, {
              fileName: options.fileName,
              title: options.title,
              description: options.description,
              dateGenerated: options.dateGenerated,
              pageSize: options.pageSize,
              orientation: options.orientation,
              includeImages: options.includeImages,
            });
        }
      }
      
      toast({
        title: 'Export successful',
        description: `Successfully exported ${properties.length} properties.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the data. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <ExportDialog
      title="Export Properties"
      description="Choose format and options for your property export"
      onExport={handleExport}
      showTemplates={showTemplates}
      customizableFields={customizableFields}
      trigger={
        <Button variant={variant} className={className}>
          <FileDownIcon className="mr-2 h-4 w-4" />
          {text}
        </Button>
      }
    />
  );
};

export default ExportButton;