/**
 * Form Engine Type Definitions
 * 
 * This file defines the core types used throughout the form engine,
 * including form templates, fields, sections, and validations.
 */

/**
 * Form Template definition
 * Represents the structure and metadata of a form template
 */
export interface FormTemplate {
  code: string;         // Unique code for the form (e.g., "urar", "1073")
  name: string;         // Display name for the form
  version: string;      // Version identifier
  schema: {             // Schema defines the fields and validations
    fields: Record<string, FormField>;
    validations: FieldValidation[];
  };
  layout: {             // Layout defines the visual representation
    sections: FormSection[];
    pageLayout: any;    // Page size, orientation, etc.
  };
  metadata: {           // Additional metadata
    source?: string;    // Where the form came from (e.g., "total-xfr")
    sourceFile?: string; // Original file if converted
    originalMetadata?: any; // Original metadata if converted
    conversionDate?: string; // When the form was converted
    [key: string]: any; // Additional metadata properties
  };
}

/**
 * Form Field definition
 * Represents a field within a form
 */
export interface FormField {
  id: string;           // Unique identifier for the field
  label: string;        // Display label for the field
  type: string;         // Field type (text, number, select, etc.)
  required?: boolean;   // Whether the field is required
  readOnly?: boolean;   // Whether the field is read-only
  defaultValue?: any;   // Default value for the field
  options?: { value: string; label: string }[]; // Options for select/radio/checkbox
  position: {           // Position information
    pageIndex: number;  // Page number (0-indexed)
    x: number;          // X coordinate
    y: number;          // Y coordinate
    width: number;      // Width
    height: number;     // Height
  };
  styling?: {           // Visual styling
    fontFamily?: string;
    fontSize?: number;
    alignment?: 'left' | 'center' | 'right';
    [key: string]: any;
  };
  autoFill?: {          // Auto-fill configuration
    sources?: string[]; // Data sources to pull from
    mappings?: Record<string, string>; // Field mappings
    confidence?: number; // Confidence threshold
  };
  mlSuggestions?: {     // ML suggestion configuration
    enabled?: boolean;
    model?: string;     // Model to use
    threshold?: number; // Confidence threshold
  };
  [key: string]: any;   // Additional properties
}

/**
 * Form Section definition
 * Represents a logical grouping of fields
 */
export interface FormSection {
  id: string;           // Unique identifier for the section
  title: string;        // Display title for the section
  order: number;        // Order within the form (0-indexed)
  pageIndex: number;    // Page number (0-indexed)
  position: {           // Position information
    x: number;          // X coordinate (percentage)
    y: number;          // Y coordinate (percentage)
    width: number;      // Width (percentage)
    height: number;     // Height (percentage)
  };
  collapsed?: boolean;  // Whether the section is initially collapsed
  [key: string]: any;   // Additional properties
}

/**
 * Field Validation definition
 * Represents a validation rule for a field
 */
export interface FieldValidation {
  fieldId: string;      // ID of the field to validate
  type: string;         // Validation type (required, regex, min, max, etc.)
  message: string;      // Error message to display
  condition?: string;   // Conditional expression (when to apply validation)
  regex?: string;       // Regular expression for regex validation
  min?: number | string; // Minimum value for min validation
  max?: number | string; // Maximum value for max validation
  [key: string]: any;   // Additional properties
}

/**
 * Form Data structure
 * Represents user-entered form data
 */
export interface FormData {
  id?: string;          // Unique identifier for the form data
  templateId: string;   // ID of the form template
  data: Record<string, any>; // Actual form data (fieldId -> value)
  metadata?: {          // Additional metadata
    createdAt?: string; // Creation timestamp
    updatedAt?: string; // Last update timestamp
    createdBy?: string; // User who created the form
    updatedBy?: string; // User who last updated the form
    status?: string;    // Form status (draft, submitted, etc.)
    version?: number;   // Version number
    [key: string]: any; // Additional metadata properties
  };
}

/**
 * Form Renderer Props
 * Properties for the form renderer component
 */
export interface FormRendererProps {
  template: FormTemplate;
  data?: FormData;
  readOnly?: boolean;
  showValidation?: boolean;
  onDataChange?: (data: FormData) => void;
  onSubmit?: (data: FormData) => void;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  viewMode?: 'traditional' | 'enhanced';
  renderOptions?: {
    showFieldBorders?: boolean;
    highlightRequiredFields?: boolean;
    showAutoFillSources?: boolean;
    showMlSuggestions?: boolean;
    [key: string]: any;
  };
}

/**
 * Form Field Change Event
 * Represents a change to a form field
 */
export interface FieldChangeEvent {
  fieldId: string;      // ID of the changed field
  value: any;           // New value
  previousValue: any;   // Previous value
  timestamp: number;    // Timestamp of the change
  source?: 'user' | 'auto-fill' | 'ml-suggestion' | 'sync'; // Source of the change
}

/**
 * Field Suggestion
 * Represents a suggestion for a field value
 */
export interface FieldSuggestion {
  fieldId: string;      // ID of the field
  value: any;           // Suggested value
  confidence: number;   // Confidence level (0-1)
  source: string;       // Source of the suggestion
  explanation?: string; // Explanation for the suggestion
}

/**
 * Form Template Summary
 * Lightweight summary of a form template for listings
 */
export interface FormTemplateSummary {
  id: string;
  code: string;
  name: string;
  version: string;
  description?: string;
  formType?: string;    // E.g., "appraisal", "inspection", etc.
  pageCount?: number;   // Number of pages
  fieldCount?: number;  // Number of fields
  lastUpdated?: string; // Last update timestamp
}

/**
 * Form Conversion Result
 * Result of converting a form from one format to another
 */
export interface FormConversionResult {
  success: boolean;
  template?: FormTemplate;
  errors?: string[];
  warnings?: string[];
  stats?: {
    totalFields: number;
    convertedFields: number;
    missingFields: number;
    [key: string]: any;
  };
}
