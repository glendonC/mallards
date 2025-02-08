export interface Anomaly {
  id: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  type: string;
  amount: number;
  status: 'pending' | 'resolved';
}

export interface FilterState {
  severity: 'all' | 'high' | 'medium' | 'low';
  timeRange: '24h' | '7d' | '30d' | 'all';
  transactionType: string | 'all';
  searchQuery: string;
}

export interface CulturalViolation extends Anomaly {
  culturalContext: string;
  expectedPattern: string;
  actualPattern: string;
  impactScore: number;
  metrics: PatternMetrics[];
  relatedTransactions?: string[];
  culturalPeriod: {
    name: string;
    startDate: string;
    endDate: string;
    significance: number;
    expectedPatterns: {
      type: string;
      description: string;
    }[];
  };
  confidenceScore: number;
  remedialSuggestions?: string[];
  category: 'timing' | 'volume' | 'frequency' | 'distribution';
  trendIndicator: 'increasing' | 'decreasing' | 'stable';
}

export interface DecisionMetrics {
  culturalGroup: string;
  approvals: number;
  rejections: number;
  approvalRate: number;
  trend: number;
  impact: number;
  region?: string;
  timestamp: string;
  // New fields
  culturalContext?: CulturalContext;
  confidenceLevel: number;
  seasonalAdjustment: number;
  regionalDistribution: {
    region: string;
    rate: number;
    deviation: number;
  }[];
}

export interface AIDecisionData {
  metrics: DecisionMetrics[];
  totalApprovals: number;
  totalRejections: number;
  averageApprovalRate: number;
  significantDeviations: {
    culturalGroup: string;
    deviation: number;
    impact: number;
  }[];
  focusType: 'spending' | 'approval' | 'regional';
  analysis: ConflictAnalysis;
  culturalPeriods: CulturalContext[];
}

export interface UnusualDeviation {
  id: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  score: number;
  pattern: string;
  modelConfidence: number;
  modelType: 'isolation-forest' | 'autoencoder' | 'heuristic';
  explanation: string;
  affectedMetrics: {
    metric: string;
    value: number;
    expectedRange: [number, number];
  }[];
  status: 'pending' | 'investigating' | 'resolved';
}

export interface ModelInfo {
  type: 'isolation-forest' | 'autoencoder' | 'heuristic';
  name: string;
  confidence: number;
  parameters: Record<string, any>;
} 

// New types to add
interface PatternMetrics {
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  culturalSignificance: number;
}

export interface CulturalPeriod {
  name: string;
  startDate: string;
  endDate: string;
  significance: number;
  expectedPatterns: {
    type: string;
    description: string;
  }[];
}

export interface CulturalContext {
  group: string;
  period: string;
  expectedBehavior: string;
  culturalSignificance: number;
}

export interface ConflictAnalysis {
  type: 'spending' | 'approval' | 'regional';
  metrics: {
    category: string;
    value: number;
    expected: number;
    deviation: number;
    culturalContext?: string;
  }[];
}

export interface AnomaliesData {
  violations: CulturalViolation[];
  decisions: AIDecisionData;
  deviations: UnusualDeviation[];
}

export interface AnomaliesAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnomaliesData;
  customColors: any;
}