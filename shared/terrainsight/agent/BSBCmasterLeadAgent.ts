/**
 * BSBCmaster Lead Agent
 * 
 * This agent serves as the component lead for the core BSBCmaster component
 * which handles core system architecture, authentication, user management,
 * and central data services.
 */

import { ComponentLeadAgent } from './ComponentLeadAgent';
import { 
  AgentContext, 
  AgentResponse, 
  ValidationResult
} from './types';
import { EventSeverity, eventLogger } from './EventLogger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Authentication statistics
 */
interface AuthStats {
  /** Total authentication requests */
  totalRequests: number;
  
  /** Successful authentication requests */
  successfulLogins: number;
  
  /** Failed authentication requests */
  failedLogins: number;
  
  /** Timestamp of the last login */
  lastLoginTime?: string;
}

/**
 * User statistics
 */
interface UserStats {
  /** Total number of users */
  totalUsers: number;
  
  /** Number of active users */
  activeUsers: number;
  
  /** Number of admin users */
  adminUsers: number;
  
  /** Number of users with role-based restrictions */
  restrictedUsers: number;
}

/**
 * Data service metrics
 */
interface DataServiceMetrics {
  /** Total queries processed */
  queriesProcessed: number;
  
  /** Average query response time in milliseconds */
  avgQueryResponseTimeMs: number;
  
  /** Number of cached queries */
  cachedQueries: number;
  
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
}

/**
 * BSBCmaster Lead Agent implementation
 */
export class BSBCmasterLeadAgent extends ComponentLeadAgent {
  /** Authentication statistics */
  private authStats: AuthStats = {
    totalRequests: 0,
    successfulLogins: 0,
    failedLogins: 0
  };
  
  /** User statistics */
  private userStats: UserStats = {
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    restrictedUsers: 0
  };
  
  /** Data service metrics */
  private dataServiceMetrics: DataServiceMetrics = {
    queriesProcessed: 0,
    avgQueryResponseTimeMs: 0,
    cachedQueries: 0,
    cacheHitRate: 0
  };
  
  /** Permission rules */
  private permissionRules: Array<{
    /** Rule ID */
    id: string;
    
    /** Rule name */
    name: string;
    
    /** Resource affected by this rule */
    resource: string;
    
    /** Actions governed by this rule */
    actions: string[];
    
    /** Roles that have this permission */
    roles: string[];
  }> = [];
  
  /**
   * Initialize a new BSBCmaster Lead Agent
   */
  constructor() {
    super('bsbcmaster', 'bsbcmaster-lead', 'BSBCmaster Lead');
    
    // Add component-specific capabilities
    this.capabilities.push(
      'authentication_management',
      'user_management',
      'permission_control',
      'data_foundation',
      'service_discovery',
      'workflow_orchestration',
      'system_health_monitoring'
    );
    
    // Initialize component specification
    this.specification = {
      id: this.componentId,
      version: this.version,
      description: 'Core system architecture component for authentication, user management, and central data services',
      capabilities: this.capabilities,
      apiEndpoints: [
        {
          path: '/api/auth/login',
          method: 'POST',
          description: 'Authenticate user and issue access token'
        },
        {
          path: '/api/auth/logout',
          method: 'POST',
          description: 'Invalidate user session'
        },
        {
          path: '/api/users',
          method: 'GET',
          description: 'List users (admin only)'
        },
        {
          path: '/api/users/:id',
          method: 'GET',
          description: 'Get user details'
        },
        {
          path: '/api/permissions',
          method: 'GET',
          description: 'List permission rules (admin only)'
        },
        {
          path: '/api/services',
          method: 'GET',
          description: 'List available services'
        }
      ],
      dependencies: []
    };
    
    // Initialize default permission rules
    this.permissionRules = [
      {
        id: 'rule_admin_all',
        name: 'Admin Full Access',
        resource: '*',
        actions: ['*'],
        roles: ['admin']
      },
      {
        id: 'rule_assessor_edit',
        name: 'Assessor Edit',
        resource: 'properties',
        actions: ['view', 'edit', 'assess'],
        roles: ['assessor']
      },
      {
        id: 'rule_viewer_view',
        name: 'Viewer Access',
        resource: 'properties',
        actions: ['view'],
        roles: ['viewer']
      }
    ];
  }
  
  /**
   * Process BSBCmaster-specific actions
   * 
   * @param action The action to handle
   * @param data The action data
   * @returns Response for the action
   */
  protected async handleComponentSpecificAction(
    action: string,
    data: any
  ): Promise<AgentResponse> {
    switch (action) {
      case 'get_auth_stats':
        return {
          success: true,
          result: {
            authStats: this.authStats
          }
        };
        
      case 'update_auth_stats':
        if (data.type === 'success') {
          this.authStats.totalRequests++;
          this.authStats.successfulLogins++;
          this.authStats.lastLoginTime = new Date().toISOString();
        } else if (data.type === 'failure') {
          this.authStats.totalRequests++;
          this.authStats.failedLogins++;
        }
        
        return {
          success: true,
          result: {
            message: 'Authentication statistics updated',
            authStats: this.authStats
          }
        };
        
      case 'get_user_stats':
        return {
          success: true,
          result: {
            userStats: this.userStats
          }
        };
        
      case 'update_user_stats':
        if (data.totalUsers !== undefined) {
          this.userStats.totalUsers = data.totalUsers;
        }
        
        if (data.activeUsers !== undefined) {
          this.userStats.activeUsers = data.activeUsers;
        }
        
        if (data.adminUsers !== undefined) {
          this.userStats.adminUsers = data.adminUsers;
        }
        
        if (data.restrictedUsers !== undefined) {
          this.userStats.restrictedUsers = data.restrictedUsers;
        }
        
        return {
          success: true,
          result: {
            message: 'User statistics updated',
            userStats: this.userStats
          }
        };
        
      case 'get_data_service_metrics':
        return {
          success: true,
          result: {
            dataServiceMetrics: this.dataServiceMetrics
          }
        };
        
      case 'update_data_service_metrics':
        if (data.queriesProcessed !== undefined) {
          this.dataServiceMetrics.queriesProcessed = data.queriesProcessed;
        }
        
        if (data.avgQueryResponseTimeMs !== undefined) {
          this.dataServiceMetrics.avgQueryResponseTimeMs = data.avgQueryResponseTimeMs;
        }
        
        if (data.cachedQueries !== undefined) {
          this.dataServiceMetrics.cachedQueries = data.cachedQueries;
        }
        
        if (data.cacheHitRate !== undefined) {
          this.dataServiceMetrics.cacheHitRate = data.cacheHitRate;
        }
        
        return {
          success: true,
          result: {
            message: 'Data service metrics updated',
            dataServiceMetrics: this.dataServiceMetrics
          }
        };
        
      case 'get_permission_rules':
        return {
          success: true,
          result: {
            permissionRules: this.permissionRules
          }
        };
        
      case 'add_permission_rule':
        if (!data.name || !data.resource || !Array.isArray(data.actions) || !Array.isArray(data.roles)) {
          return {
            success: false,
            error: 'Name, resource, actions array, and roles array are required'
          };
        }
        
        const newRule = {
          id: data.id || `rule_${uuidv4()}`,
          name: data.name,
          resource: data.resource,
          actions: data.actions,
          roles: data.roles
        };
        
        this.permissionRules.push(newRule);
        
        return {
          success: true,
          result: {
            message: 'Permission rule added successfully',
            rule: newRule
          }
        };
        
      case 'update_permission_rule':
        if (!data.id) {
          return {
            success: false,
            error: 'Rule ID is required'
          };
        }
        
        const ruleIndex = this.permissionRules.findIndex(r => r.id === data.id);
        
        if (ruleIndex === -1) {
          return {
            success: false,
            error: `Permission rule with ID '${data.id}' not found`
          };
        }
        
        // Update rule fields
        if (data.name) {
          this.permissionRules[ruleIndex].name = data.name;
        }
        
        if (data.resource) {
          this.permissionRules[ruleIndex].resource = data.resource;
        }
        
        if (Array.isArray(data.actions)) {
          this.permissionRules[ruleIndex].actions = data.actions;
        }
        
        if (Array.isArray(data.roles)) {
          this.permissionRules[ruleIndex].roles = data.roles;
        }
        
        return {
          success: true,
          result: {
            message: 'Permission rule updated successfully',
            rule: this.permissionRules[ruleIndex]
          }
        };
        
      case 'delete_permission_rule':
        if (!data.id) {
          return {
            success: false,
            error: 'Rule ID is required'
          };
        }
        
        const deleteRuleIndex = this.permissionRules.findIndex(r => r.id === data.id);
        
        if (deleteRuleIndex === -1) {
          return {
            success: false,
            error: `Permission rule with ID '${data.id}' not found`
          };
        }
        
        const deletedRule = this.permissionRules[deleteRuleIndex];
        this.permissionRules.splice(deleteRuleIndex, 1);
        
        return {
          success: true,
          result: {
            message: 'Permission rule deleted successfully',
            rule: deletedRule
          }
        };
        
      case 'validate_auth_system':
        const authValidation = await this.validateAuthSystem();
        
        return {
          success: true,
          result: authValidation
        };
        
      default:
        return {
          success: false,
          error: `Unsupported action: ${action}`
        };
    }
  }
  
  /**
   * Validate the authentication system
   * 
   * @returns Validation results
   */
  private async validateAuthSystem(): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    
    // Check for permission rules without actions
    const rulesWithoutActions = this.permissionRules.filter(r => r.actions.length === 0);
    
    for (const rule of rulesWithoutActions) {
      issues.push({
        field: `permission_rule.${rule.id}.actions`,
        issue: `Permission rule '${rule.name}' has no actions defined`,
        severity: 'medium',
        recommendation: 'Define at least one action for this permission rule'
      });
    }
    
    // Check for permission rules without roles
    const rulesWithoutRoles = this.permissionRules.filter(r => r.roles.length === 0);
    
    for (const rule of rulesWithoutRoles) {
      issues.push({
        field: `permission_rule.${rule.id}.roles`,
        issue: `Permission rule '${rule.name}' has no roles assigned`,
        severity: 'high',
        recommendation: 'Assign at least one role to this permission rule'
      });
    }
    
    // Check for high failed login rate
    if (this.authStats.totalRequests > 0) {
      const failureRate = this.authStats.failedLogins / this.authStats.totalRequests;
      
      if (failureRate > 0.3) {
        issues.push({
          field: 'authentication',
          issue: `High authentication failure rate: ${(failureRate * 100).toFixed(1)}%`,
          severity: 'high',
          recommendation: 'Investigate potential security issues or user interface problems'
        });
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Check component health
   * 
   * @returns Health check result
   */
  protected async checkComponentHealth(): Promise<{ 
    healthy: boolean; 
    criticalIssue?: string 
  }> {
    // Check for critical issues that would make the component unhealthy
    
    // High failure rate in authentication
    if (this.authStats.totalRequests > 100) {
      const failureRate = this.authStats.failedLogins / this.authStats.totalRequests;
      
      if (failureRate > 0.5) {
        return { 
          healthy: false,
          criticalIssue: `Critical authentication failure rate: ${(failureRate * 100).toFixed(1)}%`
        };
      }
    }
    
    // Data service response time too high
    if (this.dataServiceMetrics.avgQueryResponseTimeMs > 5000) {
      return {
        healthy: false,
        criticalIssue: `Data service response time critical: ${this.dataServiceMetrics.avgQueryResponseTimeMs.toFixed(1)}ms`
      };
    }
    
    // No issues found
    return { healthy: true };
  }
}