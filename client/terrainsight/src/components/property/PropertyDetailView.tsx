import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { formatCurrency, formatDate, formatNumber } from '../../lib/utils';
import { 
  FileText, 
  Download, 
  ChevronDown, 
  Calendar, 
  DollarSign, 
  Home, 
  Map, 
  SquareUser, 
  Ruler, 
  Tag, 
  ClipboardList 
} from 'lucide-react';
import { ReportGenerator } from '../../services/reporting/reportGenerator';
import { ReportExporter } from '../../services/reporting/reportExporter';
import { screenReaderAnnouncer } from '../../services/accessibility/screenReaderService';

interface PropertyDetailViewProps {
  property: Property;
  onClose?: () => void;
}

/**
 * Component for displaying detailed property information and generating reports
 */
export function PropertyDetailView({ property, onClose }: PropertyDetailViewProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  
  // Function to handle report generation and download
  const handleGenerateReport = async (format: 'pdf' | 'csv' | 'excel' | 'json') => {
    try {
      setIsGeneratingReport(true);
      setExportMenuOpen(false);
      
      // Announce to screen readers
      screenReaderAnnouncer.announceReportGeneration(`${format.toUpperCase()} property report`);
      
      // Generate the report
      const reportGenerator = new ReportGenerator();
      const report = reportGenerator.generatePropertyReport(property);
      
      // Export the report
      const reportExporter = new ReportExporter();
      const exportedData = await reportExporter.exportAs(report, format);
      
      // Create a download link
      const url = typeof exportedData.data === 'string'
        ? `data:${exportedData.mimeType};charset=utf-8,${encodeURIComponent(exportedData.data)}`
        : URL.createObjectURL(exportedData.data as Blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = exportedData.filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      if (typeof exportedData.data !== 'string') {
        URL.revokeObjectURL(url);
      }
      document.body.removeChild(link);
      
      // Announce completion to screen readers
      screenReaderAnnouncer.announceReportComplete(`${format.toUpperCase()} property report`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Property header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{property.address}</h2>
          <p className="text-gray-500">Parcel ID: {property.parcelId}</p>
        </div>
        
        {/* Export button with dropdown */}
        <div className="relative mt-3 md:mt-0">
          <button 
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            disabled={isGeneratingReport}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Export property report"
          >
            {isGeneratingReport ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Export Report
                <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
          
          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <button
                  onClick={() => handleGenerateReport('pdf')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  role="menuitem"
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF Format
                </button>
                <button
                  onClick={() => handleGenerateReport('csv')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  role="menuitem"
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV Format
                </button>
                <button
                  onClick={() => handleGenerateReport('excel')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  role="menuitem"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel Format
                </button>
                <button
                  onClick={() => handleGenerateReport('json')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  role="menuitem"
                >
                  <Download className="mr-2 h-4 w-4" />
                  JSON Format
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Property details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div>
          {/* Valuation section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Valuation Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <dl className="grid grid-cols-1 gap-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Value</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {property.value ? formatCurrency(Number(property.value)) : 'Not Available'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Land Value</dt>
                  <dd className="mt-1 text-gray-900">
                    {property.landValue ? formatCurrency(Number(property.landValue)) : 'Not Available'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tax Assessment</dt>
                  <dd className="mt-1 text-gray-900">
                    {property.taxAssessment ? formatCurrency(Number(property.taxAssessment)) : 'Not Available'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Price per Sq. Ft.</dt>
                  <dd className="mt-1 text-gray-900">
                    {property.value && property.squareFeet
                      ? formatCurrency(Number(property.value) / property.squareFeet) + '/sq.ft.'
                      : 'Not Available'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Property Details section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
              <Home className="mr-2 h-5 w-5 text-primary" />
              Property Details
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                  <dd className="mt-1 text-gray-900">{property.propertyType || 'Not Specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Year Built</dt>
                  <dd className="mt-1 text-gray-900">{property.yearBuilt || 'Not Available'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Square Feet</dt>
                  <dd className="mt-1 text-gray-900">
                    {property.squareFeet ? formatNumber(property.squareFeet) : 'Not Available'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lot Size</dt>
                  <dd className="mt-1 text-gray-900">
                    {property.lotSize ? `${property.lotSize} acres` : 'Not Available'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bedrooms</dt>
                  <dd className="mt-1 text-gray-900">{property.bedrooms || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
                  <dd className="mt-1 text-gray-900">{property.bathrooms || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Zoning</dt>
                  <dd className="mt-1 text-gray-900">{property.zoning || 'Not Specified'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div>
          {/* Owner information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
              <SquareUser className="mr-2 h-5 w-5 text-primary" />
              Ownership Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <dl className="grid grid-cols-1 gap-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Owner</dt>
                  <dd className="mt-1 text-gray-900">{property.owner || 'Not Available'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Sale Date</dt>
                  <dd className="mt-1 text-gray-900">
                    {property.lastSaleDate ? formatDate(new Date(property.lastSaleDate)) : 'Not Available'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Sale Price</dt>
                  <dd className="mt-1 text-gray-900">
                    {property.salePrice ? formatCurrency(Number(property.salePrice)) : 'Not Available'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Location information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
              <Map className="mr-2 h-5 w-5 text-primary" />
              Location Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <dl className="grid grid-cols-1 gap-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Neighborhood</dt>
                  <dd className="mt-1 text-gray-900">{property.neighborhood || 'Not Specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Coordinates</dt>
                  <dd className="mt-1 text-gray-900">
                    {property.coordinates 
                      ? `${property.coordinates[0].toFixed(6)}, ${property.coordinates[1].toFixed(6)}`
                      : 'Not Available'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}