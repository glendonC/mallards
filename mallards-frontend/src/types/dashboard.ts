// Cultural Event Analytics
export interface TimelineDataPoint {
  timestamp: string;
  value: number;
  forecast?: number;
  upper?: number;
  lower?: number;
  eventValue: number;
  normalValue: number;
  difference: number;
}

// Parent Interface for Cultural Event Analytics
export interface CulturalEventAnalyticsData {
  timelineData: TimelineDataPoint[];
  insights: EventInsight[];
  summary: {
    totalEvents: number;
    averageImpact: number;
    significantPatterns: string[];
    aiAdaptation: number;
    forecastConfidence?: number;
  };
}

export interface CulturalEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'religious' | 'family' | 'community';
  status: 'active' | 'upcoming' | 'past';
  impact: number;
}

export interface AlignmentScore {
  current: number;          // Current alignment score (0-100)
  previous: number;         // Previous period's score
  trend: number;           // Percentage change
  history: {
    timestamp: string;
    score: number;
    factors: {
      religious: number;
      familial: number;
      community: number;
    };
  }[];
  culturalEvents: CulturalEvent[];
  insights: {
    mostImpacted: string;
    eventTrend: number;
    normalPeriodComparison: number;
    thresholds: {
      religious: number;
      familial: number;
      community: number;
    };
  };
}

export interface CulturalFactor {
  name: string;
  score: number;
  color: string;
}

// Active Cultural Periods
export interface CulturalPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'religious' | 'family' | 'community';
  impact: {
    level: 'high' | 'medium' | 'low';
    expectedChange: number;
    affectedMetrics: string[];
  };
  description: string;
  patternChanges: {
    metric: string;
    change: number;
    direction: 'increase' | 'decrease';
  }[];
  regionalImpact?: {
    region: string;
    expectedChange: number;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
  aiGenerated?: boolean;
}

export interface CulturalPeriodsData {
  active: CulturalPeriod[];
  upcoming: CulturalPeriod[];
  recentlyEnded: CulturalPeriod[];
  historical: {  // ✅ Add this to match `PeriodData`
    spending: number[];
    approvals: number[];
    dates: string[];
  };
  impactMetrics: {
    totalEvents: number;
    highImpact: number;
    averageChange: number;
  };
}


export interface CulturalDecisionMetric {
  culturalGroup: string;
  decisions: {
    approved: number;
    rejected: number;
    total: number;
  };
  trends: {
    approvalRate: number;
    changeFromBaseline: number;
  };
  details: {
    practice: string;
    impact: number;
    significance: 'high' | 'medium' | 'low';
  }[];
}

export interface DecisionImpactData {
  overall: {
    totalDecisions: number;
    approvalRate: number;
    culturallyInfluenced: number;
  };
  byGroup: CulturalDecisionMetric[];
  timeRange: string;
}

export interface RegionData {
  id: string;
  name: string;
  code: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  metrics: {
    approvalRate: number;
    culturalImpact: number;
    totalDecisions: number;
    transactionVolume: number;
  };
  culturalFactors: {
    name: string;
    influence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
}

// Community Impact
export interface CommunityImpactData {
  regions: RegionData[];
  summary: {
    totalRegions: number;
    highestImpact: string;
    lowestImpact: string;
    averageApprovalRate: number;
  };
  filters: {
    countries: string[];
    culturalFactors: string[];
  };
}

// Cultural Event Insights
export interface EventInsight {
  id: string;
  eventName: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    averageIncrease: number;
    peakDifference: number;
    duration: number;
    patternConfidence?: number;
    adaptationProgress?: number;
    // Add these focus-specific metrics
    volumeChange?: number;      // For pattern focus
    approvalChange?: number;    // For decision focus
    biasReduction?: number;     // For bias focus
  };
  patterns: Array<{
    phase: string;
    change: number;
    trend: string;
  }>;
  predictions?: Array<{
    date: string;
    value: number;
    trend: 'up' | 'down';
  }>;
  recommendations: string[];
}

export interface CulturalDecisionData {
  timelineData: {
    date: string;
    culturalPeriod: boolean;
    approvals: number;
    rejections: number;
    totalAmount: number;
    eventName?: string;
    region: string;
  }[];
  regionalData: {
    region: string;
    culturalPeriods: {
      approvalRate: number;
      totalDecisions: number;
      totalAmount: number;
    };
    normalPeriods: {
      approvalRate: number;
      totalDecisions: number;
      totalAmount: number;
    };
  }[];
  summary: {
    culturalPeriods: {
      approvalRate: number;
      totalDecisions: number;
      averageAmount: number;
    };
    normalPeriods: {
      approvalRate: number;
      totalDecisions: number;
      averageAmount: number;
    };
    significantEvents: {
      name: string;
      approvalDelta: number;
      period: {
        start: string;
        end: string;
      };
    }[];
  };
}

export interface DashboardData {
  communityImpact: CommunityImpactData;
  culturalDecisions: CulturalDecisionData;
  alignmentScore: AlignmentScore;
  activePeriods: CulturalPeriodsData;
  eventAnalytics: CulturalEventAnalyticsData;
} 

export type AnalyzableComponent = {
  id: string;
  title: string;
  type: 'cultural-alignment' | 'cultural-periods' | 'decision-impact' | 'pattern-alerts' | 'community-impact' | 'event-analytics';
  data: AlignmentScore | CulturalPeriodsData | CulturalDecisionData | CommunityImpactData | CulturalEventAnalyticsData;
};