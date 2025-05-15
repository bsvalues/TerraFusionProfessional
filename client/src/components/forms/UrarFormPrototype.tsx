import React, { useState, useEffect } from 'react';
import { useFormSync } from '../../hooks/useFormSync';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import { useAutoFill } from '../../hooks/useAutoFill';
import { MapComponent } from '../maps/MapComponent';
import { SketchThumbnail } from '../sketching/SketchThumbnail';
import { FormField } from './FormField';
import { FormSection } from './FormSection';
import { AdjustmentGrid } from './AdjustmentGrid';
import { CollaborationIndicator } from '../collaboration/CollaborationIndicator';
import { SyncStatus } from '../sync/SyncStatus';
import { FormHeader } from './FormHeader';
import { FormSidebar } from './FormSidebar';
import { FormFooter } from './FormFooter';
import { UrarFormData, UrarFormSection } from '../../types/forms';
import { useMLSuggestions } from '../../hooks/useMLSuggestions';
import './UrarFormPrototype.css';

interface UrarFormPrototypeProps {
  formId: string;
  initialData?: UrarFormData;
  readOnly?: boolean;
}

/**
 * Prototype component for the enhanced URAR form
 * This implements the core functionality described in our wireframe specifications
 */
export const UrarFormPrototype: React.FC<UrarFormPrototypeProps> = ({
  formId,
  initialData,
  readOnly = false,
}) => {
  // Form state management with CRDT sync
  const { formData, updateField, syncStatus, collaborators } = useFormSync<UrarFormData>(formId, initialData);
  
  // Form validation
  const { validationErrors, validateField, formIsValid, validationStatus } = useFieldValidation(formData);
  
  // Auto-fill capabilities
  const { autoFillField, autoFillSources, autoFillStatus } = useAutoFill(formData);
  
  // ML-based field suggestions
  const { suggestions, applySuggestion, suggestionConfidence } = useMLSuggestions(formData);
  
  // View mode state (Traditional vs Enhanced)
  const [viewMode, setViewMode] = useState<'traditional' | 'enhanced'>('traditional');
  
  // Active section tracking
  const [activeSection, setActiveSection] = useState<UrarFormSection>('subjectProperty');
  
  // Form sections configuration - this would normally come from a form definition service
  const formSections = [
    { id: 'subjectProperty', label: 'Subject Property', order: 1 },
    { id: 'contractInfo', label: 'Contract Information', order: 2 },
    { id: 'neighborhoodData', label: 'Neighborhood', order: 3 },
    { id: 'siteData', label: 'Site', order: 4 },
    { id: 'improvementsData', label: 'Improvements', order: 5 },
    { id: 'comparableData', label: 'Comparable Properties', order: 6 },
    { id: 'reconciliation', label: 'Reconciliation', order: 7 },
    { id: 'additionalComments', label: 'Additional Comments', order: 8 },
    { id: 'costApproach', label: 'Cost Approach', order: 9 },
    { id: 'incomeApproach', label: 'Income Approach', order: 10 },
    { id: 'certification', label: 'Certification & Signature', order: 11 }
  ];

  // Handle field change
  const handleFieldChange = (fieldId: string, value: any) => {
    updateField(fieldId, value);
    validateField(fieldId, value);
  };

  // Apply auto-fill to a section
  const handleSectionAutoFill = (sectionId: UrarFormSection) => {
    // This would connect to various data sources like MLS, public records, etc.
    autoFillField(sectionId);
  };

  // Toggle between traditional and enhanced views
  const toggleViewMode = () => {
    setViewMode(viewMode === 'traditional' ? 'enhanced' : 'traditional');
  };

  return (
    <div className={`urar-form-container ${viewMode}`}>
      <FormHeader
        formType="URAR - Uniform Residential Appraisal Report"
        viewMode={viewMode}
        onViewModeToggle={toggleViewMode}
      >
        <SyncStatus status={syncStatus} />
        <CollaborationIndicator collaborators={collaborators} />
      </FormHeader>

      <div className="form-content">
        <FormSidebar
          sections={formSections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          validationStatus={validationStatus}
          completionStatus={formSections.map(s => ({
            sectionId: s.id,
            completionPercentage: calculateCompletionPercentage(formData, s.id)
          }))}
        />

        <div className="form-main">
          {/* Subject Property Section Example */}
          {activeSection === 'subjectProperty' && (
            <FormSection
              title="Subject Property"
              onAutoFill={() => handleSectionAutoFill('subjectProperty')}
              validationErrors={getValidationErrorsForSection(validationErrors, 'subjectProperty')}
            >
              <div className="form-row">
                <FormField
                  id="subject.propertyAddress"
                  label="Property Address"
                  value={formData?.subject?.propertyAddress || ''}
                  onChange={(value) => handleFieldChange('subject.propertyAddress', value)}
                  suggestion={suggestions['subject.propertyAddress']}
                  onApplySuggestion={() => applySuggestion('subject.propertyAddress')}
                  suggestionConfidence={suggestionConfidence['subject.propertyAddress']}
                  validationError={validationErrors['subject.propertyAddress']}
                  autoFillSource={autoFillSources['subject.propertyAddress']}
                  readOnly={readOnly}
                />
              </div>
              
              <div className="form-row">
                <FormField
                  id="subject.city"
                  label="City"
                  value={formData?.subject?.city || ''}
                  onChange={(value) => handleFieldChange('subject.city', value)}
                  suggestion={suggestions['subject.city']}
                  validationError={validationErrors['subject.city']}
                  autoFillSource={autoFillSources['subject.city']}
                  readOnly={readOnly}
                />
                
                <FormField
                  id="subject.state"
                  label="State"
                  value={formData?.subject?.state || ''}
                  onChange={(value) => handleFieldChange('subject.state', value)}
                  suggestion={suggestions['subject.state']}
                  validationError={validationErrors['subject.state']}
                  autoFillSource={autoFillSources['subject.state']}
                  readOnly={readOnly}
                />
                
                <FormField
                  id="subject.zipCode"
                  label="Zip Code"
                  value={formData?.subject?.zipCode || ''}
                  onChange={(value) => handleFieldChange('subject.zipCode', value)}
                  suggestion={suggestions['subject.zipCode']}
                  validationError={validationErrors['subject.zipCode']}
                  autoFillSource={autoFillSources['subject.zipCode']}
                  readOnly={readOnly}
                />
              </div>
              
              {/* Map integration example */}
              {viewMode === 'enhanced' && (
                <div className="map-container">
                  <MapComponent 
                    latitude={formData?.subject?.latitude}
                    longitude={formData?.subject?.longitude}
                    onLocationChange={(lat, lng) => {
                      handleFieldChange('subject.latitude', lat);
                      handleFieldChange('subject.longitude', lng);
                    }}
                    readOnly={readOnly}
                  />
                </div>
              )}
              
              <div className="form-row">
                <FormField
                  id="subject.legalDescription"
                  label="Legal Description"
                  value={formData?.subject?.legalDescription || ''}
                  onChange={(value) => handleFieldChange('subject.legalDescription', value)}
                  multiline
                  suggestion={suggestions['subject.legalDescription']}
                  validationError={validationErrors['subject.legalDescription']}
                  autoFillSource={autoFillSources['subject.legalDescription']}
                  readOnly={readOnly}
                />
              </div>
              
              <div className="form-row">
                <FormField
                  id="subject.assessorsParcelNumber"
                  label="Assessor's Parcel #"
                  value={formData?.subject?.assessorsParcelNumber || ''}
                  onChange={(value) => handleFieldChange('subject.assessorsParcelNumber', value)}
                  suggestion={suggestions['subject.assessorsParcelNumber']}
                  validationError={validationErrors['subject.assessorsParcelNumber']}
                  autoFillSource={autoFillSources['subject.assessorsParcelNumber']}
                  readOnly={readOnly}
                />
                
                <FormField
                  id="subject.taxYear"
                  label="Tax Year"
                  value={formData?.subject?.taxYear || ''}
                  onChange={(value) => handleFieldChange('subject.taxYear', value)}
                  suggestion={suggestions['subject.taxYear']}
                  validationError={validationErrors['subject.taxYear']}
                  autoFillSource={autoFillSources['subject.taxYear']}
                  readOnly={readOnly}
                />
                
                <FormField
                  id="subject.rEARTaxes"
                  label="R.E. Taxes $"
                  value={formData?.subject?.rEARTaxes || ''}
                  onChange={(value) => handleFieldChange('subject.rEARTaxes', value)}
                  suggestion={suggestions['subject.rEARTaxes']}
                  validationError={validationErrors['subject.rEARTaxes']}
                  autoFillSource={autoFillSources['subject.rEARTaxes']}
                  readOnly={readOnly}
                />
              </div>
              
              {/* Sketch integration example */}
              {viewMode === 'enhanced' && (
                <div className="sketch-container">
                  <SketchThumbnail
                    sketchId={formData?.sketches?.primarySketchId}
                    onEdit={() => {/* Open sketch editor */}}
                    dimensions={{
                      gla: formData?.improvements?.gla,
                      totalArea: formData?.improvements?.totalArea
                    }}
                    readOnly={readOnly}
                  />
                </div>
              )}
            </FormSection>
          )}
          
          {/* Comparable Sales Section Example */}
          {activeSection === 'comparableData' && (
            <FormSection
              title="Comparable Properties"
              onAutoFill={() => handleSectionAutoFill('comparableData')}
              validationErrors={getValidationErrorsForSection(validationErrors, 'comparableData')}
            >
              {/* Enhanced Adjustment Grid with ML features */}
              <AdjustmentGrid
                subjectProperty={formData?.subject}
                comparableProperties={formData?.comparables}
                adjustments={formData?.adjustments}
                onAdjustmentChange={(compId, field, value) => {
                  // Update adjustment values
                  handleFieldChange(`adjustments.${compId}.${field}`, value);
                }}
                onComparableChange={(compId, field, value) => {
                  // Update comparable properties data
                  handleFieldChange(`comparables.${compId}.${field}`, value);
                }}
                showAdjustmentRationale={viewMode === 'enhanced'}
                mlSuggestions={viewMode === 'enhanced' ? suggestions : undefined}
                onApplySuggestion={applySuggestion}
                validationErrors={validationErrors}
                readOnly={readOnly}
              />
              
              {/* Map with comps in enhanced mode */}
              {viewMode === 'enhanced' && (
                <div className="comps-map-container">
                  <MapComponent 
                    latitude={formData?.subject?.latitude}
                    longitude={formData?.subject?.longitude}
                    comparables={formData?.comparables?.map(comp => ({
                      id: comp.id,
                      latitude: comp.latitude,
                      longitude: comp.longitude,
                      salePrice: comp.salePrice,
                      address: comp.address
                    }))}
                    onLocationChange={() => {/* Not editable in this context */}}
                    readOnly={true}
                  />
                </div>
              )}
            </FormSection>
          )}
          
          {/* Other form sections would follow the same pattern */}
        </div>
      </div>
      
      <FormFooter
        formIsValid={formIsValid}
        lastUpdated={formData?.metadata?.lastUpdated}
        updatedBy={formData?.metadata?.updatedBy}
        complianceStatus={validationStatus.complianceStatus}
      />
    </div>
  );
};

// Helper function to calculate completion percentage
const calculateCompletionPercentage = (formData: any, sectionId: string): number => {
  // This would analyze the form data and calculate completion percentage
  // based on required fields for the given section
  return 75; // Example value
};

// Helper function to get validation errors for a specific section
const getValidationErrorsForSection = (allErrors: Record<string, string>, sectionId: string) => {
  return Object.entries(allErrors)
    .filter(([key]) => key.startsWith(sectionId))
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as Record<string, string>);
};
