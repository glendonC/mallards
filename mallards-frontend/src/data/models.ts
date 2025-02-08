// Model definitions and presets
import { Model, ModelPreset } from '../types/model';

export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'isolation-forest',
    name: 'Isolation Forest',
    type: 'anomaly',
    description: 'Identifies unusual spending patterns and cultural deviations',
    speed: 4,
    memory: 3,
    useCases: [
      'Cultural spending pattern detection',
      'Rapid anomaly screening',
      'Large-scale transaction analysis'
    ],
    parameters: [
      {
        name: 'contamination',
        type: 'range',
        default: 0.1,
        min: 0,
        max: 0.5,
        description: 'Expected percentage of cultural anomalies'
      },
      {
        name: 'n_estimators',
        type: 'number',
        default: 100,
        min: 50,
        max: 1000,
        description: 'Number of detection trees'
      }
    ]
  },
  {
    id: 'autoencoder',
    name: 'Cultural Autoencoder',
    type: 'anomaly',
    description: 'Deep learning model for complex cultural pattern recognition',
    speed: 2,
    memory: 2,
    useCases: [
      'Complex cultural pattern detection',
      'Multi-dimensional bias analysis',
      'Subtle discrimination detection'
    ],
    parameters: [
      {
        name: 'hidden_layers',
        type: 'select',
        default: 'medium',
        options: ['simple', 'medium', 'complex'],
        description: 'Pattern recognition depth'
      },
      {
        name: 'learning_rate',
        type: 'range',
        default: 0.001,
        min: 0.0001,
        max: 0.01,
        description: 'Cultural pattern learning speed'
      }
    ]
  },
  {
    id: 'prophet',
    name: 'Cultural Prophet',
    type: 'predictive',
    description: 'Forecasting model with built-in cultural event handling',
    speed: 3,
    memory: 3,
    useCases: [
      'Cultural event impact prediction',
      'Seasonal celebration patterns',
      'Long-term cultural trend analysis'
    ],
    parameters: [
      {
        name: 'seasonality_mode',
        type: 'select',
        default: 'additive',
        options: ['additive', 'multiplicative'],
        description: 'Cultural seasonality type'
      },
      {
        name: 'changepoint_prior_scale',
        type: 'range',
        default: 0.05,
        min: 0.001,
        max: 0.5,
        description: 'Sensitivity to cultural changes'
      }
    ]
  },
  {
    id: 'xgboost',
    name: 'XGBoost Classifier',
    type: 'predictive',
    description: 'Advanced model for cultural bias detection and prediction',
    speed: 3,
    memory: 4,
    useCases: [
      'Decision bias detection',
      'Cultural fairness assessment',
      'Risk scoring analysis'
    ],
    parameters: [
      {
        name: 'max_depth',
        type: 'number',
        default: 6,
        min: 3,
        max: 10,
        description: 'Pattern complexity level'
      },
      {
        name: 'learning_rate',
        type: 'range',
        default: 0.1,
        min: 0.01,
        max: 0.3,
        description: 'Bias detection sensitivity'
      }
    ]
  }
];

export const MODEL_PRESETS: { [key: string]: ModelPreset[] } = {
  'isolation-forest': [
    {
      id: 'balanced',
      name: 'Balanced Detection',
      description: 'Good balance between precision and recall',
      parameters: {
        contamination: 0.1,
        n_estimators: 100
      },
      recommendedFor: ['General purpose', 'Initial analysis']
    },
    {
      id: 'aggressive',
      name: 'Aggressive Detection',
      description: 'Higher sensitivity, may have more false positives',
      parameters: {
        contamination: 0.15,
        n_estimators: 200
      },
      recommendedFor: ['High-risk scenarios', 'When false negatives are costly']
    },
    {
      id: 'conservative',
      name: 'Conservative Detection',
      description: 'Lower sensitivity, fewer false positives',
      parameters: {
        contamination: 0.05,
        n_estimators: 150
      },
      recommendedFor: ['Low-risk scenarios', 'When false positives are costly']
    }
  ],
  'autoencoder': [
    {
      id: 'simple',
      name: 'Simple Architecture',
      description: 'Fast training, good for smaller datasets',
      parameters: {
        hidden_layers: 'simple',
        learning_rate: 0.001
      },
      recommendedFor: ['Small datasets', 'Quick analysis']
    },
    {
      id: 'complex',
      name: 'Complex Architecture',
      description: 'Better for finding subtle patterns',
      parameters: {
        hidden_layers: 'complex',
        learning_rate: 0.0005
      },
      recommendedFor: ['Large datasets', 'Complex patterns']
    }
  ],
  'prophet': [
    {
      id: 'default',
      name: 'Standard Forecasting',
      description: 'Balanced configuration for most cases',
      parameters: {
        seasonality_mode: 'additive',
        changepoint_prior_scale: 0.05
      },
      recommendedFor: ['General forecasting', 'Regular patterns']
    },
    {
      id: 'flexible',
      name: 'Flexible Forecasting',
      description: 'Better for volatile data with many changes',
      parameters: {
        seasonality_mode: 'multiplicative',
        changepoint_prior_scale: 0.15
      },
      recommendedFor: ['Volatile data', 'Complex seasonality']
    }
  ],
  'arima': [
    {
      id: 'simple',
      name: 'Simple Forecasting',
      description: 'Basic configuration for straightforward trends',
      parameters: {
        order: '1,1,1',
        seasonal: 'none'
      },
      recommendedFor: ['Simple trends', 'Short-term forecasting']
    },
    {
      id: 'seasonal',
      name: 'Seasonal Forecasting',
      description: 'Configured for seasonal patterns',
      parameters: {
        order: '2,1,2',
        seasonal: 'weekly'
      },
      recommendedFor: ['Seasonal data', 'Weekly patterns']
    }
  ]
}; 