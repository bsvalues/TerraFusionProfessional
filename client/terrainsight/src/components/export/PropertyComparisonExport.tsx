import { useState } from 'react';
import { Property } from '@shared/schema';
import { formatCurrency } from '../../lib/utils';
import { ExportButton } from './ExportButton';
import { ExportDialog, ExportOptions } from './ExportDialog';
import { saveAs } from 'file-saver';

interface PropertyComparisonExportProps {
  properties: Property[];
  className?: string;
}

export const PropertyComparisonExport = ({ properties, className }: PropertyComparisonExportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  
  /**
   * Generates CSV content for property data
   */
  const generateCSV = (props: Property[]): string => {
    if (!props.length) return '';
    
    // Headers
    const headers = [
      'Property ID',
      'Address',
      'Value',
      'Square Feet',
      'Year Built',
      'Property Type',
      'Neighborhood',
      'Land Value',
      'Building Value'
    ].join(',');
    
    // Rows
    const rows = props.map(property => [
      property.id,
      `"${property.address}"`,
      property.value || '',
      property.squareFeet,
      property.yearBuilt || '',
      property.propertyType || '',
      property.neighborhood || '',
      property.landValue || '',
      property.attributes?.buildingValue || ''
    ].join(','));
    
    return [headers, ...rows].join('\n');
  };
  
  /**
   * Handles export based on format and options
   */
  const handleExport = async (format: string, options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      if (format === 'csv') {
        const csvContent = generateCSV(properties);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `${options.fileName || 'property-comparison'}.csv`);
      } else if (format === 'pdf') {
        // PDF generation would be implemented with a PDF library
        alert('PDF generation would be implemented with a PDF library');
      } else if (format === 'png') {
        // Image generation would be implemented
        alert('Image export would be implemented with HTML-to-image conversion');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  /**
   * Trigger for the export dialog
   */
  const exportTrigger = (
    <ExportButton
      onExportPDF={() => {
        alert('This would open the export dialog with PDF pre-selected');
      }}
      onExportCSV={() => {
        handleExport('csv', { fileName: 'property-comparison' });
      }}
      isExporting={isExporting}
    />
  );
  
  return (
    <div className={className}>
      <ExportDialog
        trigger={exportTrigger}
        onExport={handleExport}
        title="Export Property Comparison"
        description="Export your property comparison as a document or spreadsheet"
      />
    </div>
  );
};