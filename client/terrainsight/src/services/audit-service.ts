/**
 * Audit Service (Client)
 * 
 * This service provides an interface for interacting with the audit API.
 */

const API_BASE_URL = '/api/audit';

/**
 * Audit record type definition
 */
export interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  new_state?: any;
  context?: any;
  success: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Get recent audit records
 * @param limit Maximum number of records to return
 * @returns Promise resolving to recent audit records
 */
export async function getRecentAuditTrail(limit: number = 50): Promise<AuditRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/recent/${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch recent audit trail');
    }
    
    const { records } = await response.json();
    return records || [];
  } catch (error) {
    console.error('Error fetching recent audit trail:', error);
    throw error;
  }
}

/**
 * Get audit records for a specific entity
 * @param entityType The type of entity
 * @param entityId The entity identifier
 * @param limit Maximum number of records to return
 * @returns Promise resolving to entity audit records
 */
export async function getEntityAuditTrail(
  entityType: string, 
  entityId: string, 
  limit: number = 100
): Promise<AuditRecord[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/${limit}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch entity audit trail');
    }
    
    const { records } = await response.json();
    return records || [];
  } catch (error) {
    console.error('Error fetching entity audit trail:', error);
    throw error;
  }
}

/**
 * Get audit records by actor
 * @param actor The actor identifier
 * @param limit Maximum number of records to return
 * @returns Promise resolving to actor audit records
 */
export async function getActorAuditTrail(actor: string, limit: number = 100): Promise<AuditRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/actor/${encodeURIComponent(actor)}/${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch actor audit trail');
    }
    
    const { records } = await response.json();
    return records || [];
  } catch (error) {
    console.error('Error fetching actor audit trail:', error);
    throw error;
  }
}

/**
 * Get audit records for a specific action
 * @param action The action identifier
 * @param limit Maximum number of records to return
 * @returns Promise resolving to action audit records
 */
export async function getActionAuditTrail(action: string, limit: number = 100): Promise<AuditRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/action/${encodeURIComponent(action)}/${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch action audit trail');
    }
    
    const { records } = await response.json();
    return records || [];
  } catch (error) {
    console.error('Error fetching action audit trail:', error);
    throw error;
  }
}

/**
 * Get error audit records
 * @param limit Maximum number of records to return
 * @returns Promise resolving to error audit records
 */
export async function getErrorAuditTrail(limit: number = 50): Promise<AuditRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/errors/${limit}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch error audit trail');
    }
    
    const { records } = await response.json();
    return records || [];
  } catch (error) {
    console.error('Error fetching error audit trail:', error);
    throw error;
  }
}