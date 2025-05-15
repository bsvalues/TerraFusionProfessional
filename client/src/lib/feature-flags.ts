/**
 * Feature flags service for TerraFusionPro
 * Enables A/B testing and feature toggling
 */

// Feature flag keys
export enum FeatureFlag {
  NEW_COMPS_UI = 'new_comps_ui',
  ENHANCED_MAP_INTERACTIONS = 'enhanced_map_interactions',
  ADVANCED_FILTERING = 'advanced_filtering',
  REAL_TIME_UPDATES = 'real_time_updates',
  NEW_VALUATION_WORKFLOW = 'new_valuation_workflow'
}

// User segmentation groups
export enum UserSegment {
  CONTROL = 'control',
  TREATMENT_A = 'treatment_a',
  TREATMENT_B = 'treatment_b',
  ALL_USERS = 'all_users',
  INTERNAL_USERS = 'internal_users',
  BETA_TESTERS = 'beta_testers'
}

// Flag configuration type
export interface FeatureFlagConfig {
  key: FeatureFlag;
  enabled: boolean;
  segments: UserSegment[];
  rolloutPercentage?: number;
  metadata?: Record<string, any>;
}

// Mock remote configuration, in production this would be fetched from a service like LaunchDarkly
const FLAGS_CONFIG: FeatureFlagConfig[] = [
  {
    key: FeatureFlag.NEW_COMPS_UI,
    enabled: true,
    segments: [UserSegment.TREATMENT_A],
    rolloutPercentage: 50
  },
  {
    key: FeatureFlag.ENHANCED_MAP_INTERACTIONS,
    enabled: true,
    segments: [UserSegment.BETA_TESTERS],
    rolloutPercentage: 100
  },
  {
    key: FeatureFlag.ADVANCED_FILTERING,
    enabled: false,
    segments: [UserSegment.INTERNAL_USERS]
  },
  {
    key: FeatureFlag.REAL_TIME_UPDATES,
    enabled: true,
    segments: [UserSegment.TREATMENT_B],
    rolloutPercentage: 50
  },
  {
    key: FeatureFlag.NEW_VALUATION_WORKFLOW,
    enabled: false,
    segments: []
  }
];

// Hash function for consistent user assignment
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export class FeatureFlagService {
  private flags: Map<FeatureFlag, FeatureFlagConfig>;
  private userId: string;
  private userSegments: UserSegment[];

  constructor(userId: string, userSegments: UserSegment[] = []) {
    this.flags = new Map();
    this.userId = userId;
    this.userSegments = userSegments;
    
    // Load initial configuration
    this.loadFlags();
  }
  
  // Initialize flags
  private loadFlags(): void {
    FLAGS_CONFIG.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
  }
  
  // Check if a flag is enabled for the current user
  public isEnabled(flagKey: FeatureFlag): boolean {
    const flag = this.flags.get(flagKey);
    
    // Flag doesn't exist or is explicitly disabled
    if (!flag || !flag.enabled) {
      return false;
    }
    
    // Check if user is in an enabled segment
    const userInSegment = flag.segments.some(segment => 
      this.userSegments.includes(segment)
    );
    
    if (flag.segments.includes(UserSegment.ALL_USERS)) {
      return true;
    }
    
    // If segments defined but user not in any, flag is disabled
    if (flag.segments.length > 0 && !userInSegment) {
      return false;
    }
    
    // Check percentage rollout if defined
    if (flag.rolloutPercentage !== undefined) {
      const hash = hashString(this.userId + flagKey);
      const userPercentile = hash % 100;
      return userPercentile < flag.rolloutPercentage;
    }
    
    return true;
  }
  
  // Get variant for an A/B test (A, B, or default)
  public getVariant(flagKey: FeatureFlag): string {
    if (!this.isEnabled(flagKey)) {
      return 'default';
    }
    
    // Determine variant based on user ID hash
    const hash = hashString(this.userId + flagKey);
    return hash % 2 === 0 ? 'A' : 'B';
  }
  
  // Get metadata for a flag
  public getMetadata(flagKey: FeatureFlag): Record<string, any> | undefined {
    const flag = this.flags.get(flagKey);
    return flag?.metadata;
  }
  
  // Manually override a flag (development/testing only)
  public override(flagKey: FeatureFlag, enabled: boolean): void {
    const flag = this.flags.get(flagKey);
    if (flag) {
      this.flags.set(flagKey, { ...flag, enabled });
    }
  }
}

// Create and export default instance
let featureFlagService: FeatureFlagService;

// Initialize service
export function initializeFeatureFlagService(userId: string, userSegments: UserSegment[] = []): FeatureFlagService {
  featureFlagService = new FeatureFlagService(userId, userSegments);
  return featureFlagService;
}

// Get service instance
export function getFeatureFlagService(): FeatureFlagService {
  if (!featureFlagService) {
    throw new Error('Feature Flag Service not initialized. Call initializeFeatureFlagService first.');
  }
  return featureFlagService;
}
