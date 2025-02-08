export interface Model {
  id: string;
  name: string;
  type: 'anomaly' | 'predictive';
  description: string;
  speed: 1 | 2 | 3 | 4;
  memory: 1 | 2 | 3 | 4;
  useCases: string[];
  parameters: {
    name: string;
    type: 'number' | 'select' | 'range';
    default: any;
    options?: string[];
    min?: number;
    max?: number;
    description: string;
  }[];
}

export interface ModelPreset {
  id: string;
  name: string;
  description: string;
  parameters: { [key: string]: any };
  recommendedFor: string[];
}

export interface PerformanceMetrics {
  accuracy: number;
  speed: number;
  resourceUsage: number;
  falsePositives: number;
}

export interface DetailedPerformanceMetrics {
  accuracy: {
    min: number;
    max: number;
    expected: number;
  };
  speed: {
    min: number;
    max: number;
    expected: number;
  };
  resourceUsage: {
    min: number;
    max: number;
    expected: number;
  };
  falsePositives: {
    min: number;
    max: number;
    expected: number;
  };
  confidenceScore: number;
  dataCompatibility: number;
  historicalComparison?: {
    improvement: number;
    sampleSize: number;
  };
}