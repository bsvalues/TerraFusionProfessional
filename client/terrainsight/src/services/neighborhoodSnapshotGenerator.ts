import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Property } from '@shared/schema';
import { 
  NeighborhoodTimeline, 
  MarketTrendMetric, 
  neighborhoodComparisonReportService
} from './neighborhoodComparisonReportService';

export interface SnapshotOptions {
  neighborhoods: NeighborhoodTimeline[];
  selectedNeighborhoods: string[];
  properties: Property[];
  selectedYear: string;
  includeHeatmap?: boolean;
  includeTimeline?: boolean;
  includeProfile?: boolean;
  includeTrends?: boolean;
  includeScorecard?: boolean;
}

export interface SnapshotSection {
  id: string;
  title: string;
  description: string;
}

/**
 * Service for generating comprehensive neighborhood comparison snapshots
 */
export const neighborhoodSnapshotGenerator = {
  /**
   * Available sections that can be included in the snapshot
   */
  availableSections: [
    { id: 'summary', title: 'Summary', description: 'Overall comparison summary' },
    { id: 'valueComparison', title: 'Value Comparison', description: 'Property value analysis' },
    { id: 'growthTrends', title: 'Growth Trends', description: 'Historical growth patterns' },
    { id: 'marketActivity', title: 'Market Activity', description: 'Transaction volume and days on market' },
    { id: 'propertyTypes', title: 'Property Types', description: 'Distribution of property types' },
    { id: 'scorecard', title: 'Performance Scorecard', description: 'Key metrics scorecard' }
  ],

  /**
   * Generate a comprehensive snapshot of neighborhood comparison
   */
  async generateSnapshot(
    containerRef: React.RefObject<HTMLDivElement>,
    options: SnapshotOptions
  ): Promise<void> {
    if (!containerRef.current) {
      throw new Error('Container reference not found');
    }

    try {
      // Show loading state (could be implemented by the component)
      
      // Capture the entire comparison view as an image
      const canvas = await html2canvas(containerRef.current, {
        scale: 2, // Higher resolution
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      
      // Create PDF with the captured image
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      // Calculate aspect ratio
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add title
      pdf.setFontSize(24);
      pdf.setTextColor(44, 62, 80);
      pdf.text('Neighborhood Comparison Snapshot', 40, 40);
      
      // Add date
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 60);
      
      // Add neighborhood names
      pdf.setFontSize(16);
      pdf.setTextColor(52, 73, 94);
      const neighborhoodNames = options.neighborhoods
        .filter(n => options.selectedNeighborhoods.includes(n.id))
        .map(n => n.name)
        .join(' vs. ');
      pdf.text(`Comparison: ${neighborhoodNames}`, 40, 80);
      
      // Add the image
      pdf.addImage(
        canvas.toDataURL('image/png'), 
        'PNG', 
        0, 
        100, 
        imgWidth, 
        imgHeight
      );
      
      // Save the PDF
      pdf.save(`neighborhood-snapshot-${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Also generate a thumbnail image for preview
      const thumbnailDataUrl = canvas.toDataURL('image/png');
      
      // In a real application, you might want to store this URL,
      // either in a database or localStorage for the user to access later
      localStorage.setItem('latestNeighborhoodSnapshot', thumbnailDataUrl);
      
      // Optionally, also generate CSV data for the comparison
      await neighborhoodComparisonReportService.generateAndDownloadReport({
        neighborhoods: options.neighborhoods,
        selectedNeighborhoods: options.selectedNeighborhoods,
        properties: options.properties,
        selectedYear: options.selectedYear,
        metric: 'value' as MarketTrendMetric,
        format: 'csv',
        includeProperties: true
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error generating snapshot:', error);
      return Promise.reject(error);
    }
  },
  
  /**
   * Generate an image-only snapshot (no PDF)
   */
  async captureAsImage(
    containerRef: React.RefObject<HTMLDivElement>
  ): Promise<string | null> {
    if (!containerRef.current) {
      return null;
    }
    
    try {
      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      
      // Convert to PNG image as data URL
      const imageDataUrl = canvas.toDataURL('image/png');
      
      // Save image
      const blob = await (await fetch(imageDataUrl)).blob();
      saveAs(blob, `neighborhood-snapshot-${new Date().toISOString().split('T')[0]}.png`);
      
      return imageDataUrl;
    } catch (error) {
      console.error('Error capturing snapshot as image:', error);
      return null;
    }
  }
};