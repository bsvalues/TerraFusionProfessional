/**
 * Property History Service (Client)
 * 
 * This service provides an interface for interacting with the property history API.
 */

const API_BASE_URL = '/api/property-history';

/**
 * Property history record type definition
 */
export interface PropertyHistoryRecord {
  id: number;
  property_id: string;
  year: string;
  value: number;
  source?: string;
  notes?: string;
  confidence?: number;
  timestamp?: string;
  updated_by?: string;
  updated_at?: string;
}

/**
 * Get property history records for a specific property
 * @param propertyId The property identifier
 * @returns Promise resolving to property history records
 */
export async function getPropertyHistory(propertyId: string): Promise<PropertyHistoryRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/property/${encodeURIComponent(propertyId)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch property history');
    }
    
    const { records } = await response.json();
    return records || [];
  } catch (error) {
    console.error('Error fetching property history:', error);
    throw error;
  }
}

/**
 * Get property history records for multiple properties
 * @param propertyIds Array of property identifiers
 * @returns Promise resolving to map of property IDs to their history records
 */
export async function getBulkPropertyHistory(propertyIds: string[]): Promise<Record<string, PropertyHistoryRecord[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ propertyIds })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch bulk property history');
    }
    
    const { results } = await response.json();
    return results || {};
  } catch (error) {
    console.error('Error fetching bulk property history:', error);
    throw error;
  }
}

/**
 * Add a new property history record
 * @param record The property history record to add
 * @returns Promise resolving to the created record
 */
export async function addPropertyHistoryRecord(record: Omit<PropertyHistoryRecord, 'id'>): Promise<PropertyHistoryRecord> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add property history record');
    }
    
    const { record: createdRecord } = await response.json();
    return createdRecord;
  } catch (error) {
    console.error('Error adding property history record:', error);
    throw error;
  }
}

/**
 * Update an existing property history record
 * @param id Record ID
 * @param updates Fields to update
 * @returns Promise resolving to the updated record
 */
export async function updatePropertyHistoryRecord(
  id: number, 
  updates: Partial<Omit<PropertyHistoryRecord, 'id'>>
): Promise<PropertyHistoryRecord> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update property history record');
    }
    
    const { record: updatedRecord } = await response.json();
    return updatedRecord;
  } catch (error) {
    console.error('Error updating property history record:', error);
    throw error;
  }
}

/**
 * Delete a property history record
 * @param id Record ID
 * @returns Promise resolving to success indicator
 */
export async function deletePropertyHistoryRecord(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete property history record');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting property history record:', error);
    throw error;
  }
}

/**
 * Get recent property history records
 * @param limit Maximum number of records to return
 * @returns Promise resolving to recent history records
 */
export async function getRecentPropertyHistory(limit: number = 10): Promise<PropertyHistoryRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/recent/${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch recent property history');
    }
    
    const { records } = await response.json();
    return records || [];
  } catch (error) {
    console.error('Error fetching recent property history:', error);
    throw error;
  }
}

/**
 * Get property value trend analysis
 * @param propertyId The property identifier
 * @returns Promise resolving to trend analysis
 */
export async function getPropertyValueTrend(propertyId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/trend/${encodeURIComponent(propertyId)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch property value trend');
    }
    
    const { trend } = await response.json();
    return trend || null;
  } catch (error) {
    console.error('Error fetching property value trend:', error);
    throw error;
  }
}