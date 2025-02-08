import React from 'react';
import { ShieldAlert, Calculator, Scale } from 'lucide-react';

export type MonitoringFocusType = 'pattern' | 'decision' | 'bias';

export interface MonitoringFocusConfig {
  id: MonitoringFocusType;
  title: string;
  description: string;
  icon: React.ElementType;
  requiredFields: string[];
  recommendedModels: {
    anomaly: string[];
    predictive: string[];
  };
  thresholds: {
    sensitivity: number;
    alertConfidence: number;
    culturalWeight: number;
  };
  visualizationPriorities: {
    dashboard: string[];
    anomalies: string[];
    predictive: string[];
  };
  metrics: {
    primary: string[];
    secondary: string[];
    alerts: string[];
  };
}

export const MONITORING_CONFIGS: Record<MonitoringFocusType, MonitoringFocusConfig> = {
  pattern: {
    id: 'pattern',
    title: 'Cultural Pattern Detection',
    description: 'Identify and analyze spending patterns during cultural events and celebrations',
    icon: ShieldAlert,
    requiredFields: ['transactionDate', 'amount', 'transactionType', 'region'],  // Removed culturalEvent
    recommendedModels: {
      anomaly: ['isolation-forest', 'local-outlier-factor'],
      predictive: ['prophet', 'lstm']
    },
    thresholds: {
      sensitivity: 3,
      alertConfidence: 0.85,
      culturalWeight: 0.8
    },
    visualizationPriorities: {
      dashboard: [
        'temporalPatterns',
        'categorySpending',
        'regionalComparison'
      ],
      anomalies: [
        'unusualSpendingPatterns',
        'categoryDeviations',
        'seasonalAnomalies'
      ],
      predictive: [
        'seasonalForecasts',
        'spendingTrendForecasts',
        'categoryPredictions'
      ]
    },
    metrics: {
      primary: ['seasonalCorrelation', 'spendingPatternStrength'],
      secondary: ['categoryDistribution', 'regionalVariance'],
      alerts: ['unusualSeasonalSpending', 'patternBreaks']
    }
  },
  decision: {
    id: 'decision',
    title: 'Cultural Decision Impact',
    description: 'Track how AI decisions align with temporal patterns and regional norms',
    icon: Calculator,
    requiredFields: ['approvalStatus', 'transactionDate', 'region'],
    recommendedModels: {
      anomaly: ['autoencoder', 'isolation-forest'],
      predictive: ['xgboost', 'prophet']
    },
    thresholds: {
      sensitivity: 2,
      alertConfidence: 0.75,
      culturalWeight: 0.7
    },
    visualizationPriorities: {
      dashboard: [
        'approvalRatesTemporal',
        'regionalDecisionPatterns',
        'decisionTrends'
      ],
      anomalies: [
        'unusualDecisionPatterns',
        'temporalInconsistencies',
        'regionalVariations'
      ],
      predictive: [
        'seasonalDecisionForecasts',
        'approvalTrendPredictions',
        'regionalTrendProjections'
      ]
    },
    metrics: {
      primary: ['temporalConsistency', 'regionalBalance'],
      secondary: ['seasonalVariance', 'approvalDistribution'],
      alerts: ['seasonalDeviation', 'inconsistentDecisions']
    }
  },
  bias: {
    id: 'bias',
    title: 'Cultural Bias Analysis',
    description: 'Monitor decision patterns across different regions and transaction types',
    icon: Scale,
    requiredFields: ['approvalStatus', 'region', 'transactionType'],  // Using standard fields
    recommendedModels: {
      anomaly: ['isolation-forest', 'one-class-svm'],
      predictive: ['xgboost', 'neural-network']
    },
    thresholds: {
      sensitivity: 2.5,
      alertConfidence: 0.8,
      culturalWeight: 0.9
    },
    visualizationPriorities: {
      dashboard: [
        'regionalComparisons',
        'categoryDisparity',
        'decisionEquity'
      ],
      anomalies: [
        'systematicBias',
        'regionalDisparities',
        'categorySkew'
      ],
      predictive: [
        'biasProjections',
        'equityTrends',
        'disparityForecasts'
      ]
    },
    metrics: {
      primary: ['regionalDisparityIndex', 'categoryEquityScore'],
      secondary: ['temporalFairness', 'approvalParity'],
      alerts: ['significantDisparity', 'systematicBias']
    }
  }
};