import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { 
  Activity, 
  BrainCircuit, 
  ArrowRight, 
  Zap, 
  Target,
  Info,
  X,
  Settings
} from 'lucide-react';
import Tooltip from '../components/Tooltip';
import ParameterPanel from '../components/model-selection/ParameterPanel';
import { MONITORING_CONFIGS } from '../types/monitoring';

interface Model {
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

interface ModelPreset {
  id: string;
  name: string;
  description: string;
  parameters: ModelParameters;
  recommendedFor: string[];
}

const MODEL_PRESETS: { [key: string]: ModelPreset[] } = {
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

const AVAILABLE_MODELS: Model[] = [
  {
    id: 'isolation-forest',
    name: 'Isolation Forest',
    type: 'anomaly',
    description: 'Fast and efficient baseline algorithm for anomaly detection',
    speed: 4,
    memory: 3,
    useCases: [
      'Initial anomaly screening',
      'Real-time detection',
      'Large dataset analysis'
    ],
    parameters: [
      {
        name: 'contamination',
        type: 'range',
        default: 0.1,
        min: 0,
        max: 0.5,
        description: 'Expected percentage of anomalies in the dataset'
      },
      {
        name: 'n_estimators',
        type: 'number',
        default: 100,
        min: 50,
        max: 1000,
        description: 'Number of trees in the forest'
      }
    ]
  },
  {
    id: 'autoencoder',
    name: 'Autoencoder',
    type: 'anomaly',
    description: 'Deep learning model for complex pattern detection',
    speed: 2,
    memory: 2,
    useCases: [
      'Complex non-linear patterns',
      'Large training datasets',
      'Feature learning'
    ],
    parameters: [
      {
        name: 'hidden_layers',
        type: 'select',
        default: 'medium',
        options: ['simple', 'medium', 'complex'],
        description: 'Network architecture complexity'
      },
      {
        name: 'learning_rate',
        type: 'range',
        default: 0.001,
        min: 0.0001,
        max: 0.01,
        description: 'Learning rate for training'
      }
    ]
  },
  {
    id: 'prophet',
    name: 'Prophet',
    type: 'predictive',
    description: 'Robust forecasting model with built-in seasonality handling',
    speed: 3,
    memory: 3,
    useCases: [
      'Seasonal pattern detection',
      'Missing data handling',
      'Long-term forecasting'
    ],
    parameters: [
      {
        name: 'seasonality_mode',
        type: 'select',
        default: 'additive',
        options: ['additive', 'multiplicative'],
        description: 'Type of seasonality'
      },
      {
        name: 'changepoint_prior_scale',
        type: 'range',
        default: 0.05,
        min: 0.001,
        max: 0.5,
        description: 'Flexibility in trend changes'
      }
    ]
  },
  {
    id: 'arima',
    name: 'ARIMA/SARIMA',
    type: 'predictive',
    description: 'Traditional statistical forecasting with interpretable results',
    speed: 4,
    memory: 4,
    useCases: [
      'Short-term forecasting',
      'Trend analysis',
      'Interpretable predictions'
    ],
    parameters: [
      {
        name: 'order',
        type: 'select',
        default: '1,1,1',
        options: ['1,1,1', '2,1,2', '0,1,1', '1,1,2'],
        description: 'ARIMA order (p,d,q)'
      },
      {
        name: 'seasonal',
        type: 'select',
        default: 'none',
        options: ['none', 'daily', 'weekly', 'monthly'],
        description: 'Seasonal period'
      }
    ]
  }
];

interface ModelParameters {
  [key: string]: any;
}

interface ValidationRule {
  min?: number;
  max?: number;
  required?: boolean;
  custom?: (value: any) => boolean;
  message: string;
}

interface ParameterValidation {
  [key: string]: ValidationRule[];
}

interface PerformanceRange {
  min: number;
  max: number;
  expected: number;
}

interface DetailedPerformanceMetrics {
  accuracy: PerformanceRange;
  speed: PerformanceRange;
  resourceUsage: PerformanceRange;
  falsePositives: PerformanceRange;
  confidenceScore: number;
  dataCompatibility: number;
  historicalComparison?: {
    improvement: number;
    sampleSize: number;
  };
}

interface PerformanceMetrics {
  accuracy: number;
  speed: number;
  resourceUsage: number;
  falsePositives: number;
}

const calculateDataComplexity = (data: string[][]): number => {
  if (!data.length) return 0.5; // Default medium complexity

  try {
    // Simple complexity estimation based on:
    // 1. Data size
    // 2. Number of unique values
    // 3. Presence of patterns
    const sizeScore = Math.min(data.length / 10000, 1); // Size up to 10k rows
    
    // Calculate unique values ratio in each column
    const uniqueRatios = data[0].map((_, colIndex) => {
      const uniqueValues = new Set(data.map(row => row[colIndex])).size;
      return uniqueValues / data.length;
    });
    
    const uniquenessScore = uniqueRatios.reduce((a, b) => a + b, 0) / uniqueRatios.length;
    
    // Combine scores (can be adjusted based on importance)
    return (sizeScore * 0.4) + (uniquenessScore * 0.6);
  } catch (error) {
    console.error('Error calculating data complexity:', error);
    return 0.5; // Default to medium complexity on error
  }
};

const estimatePerformance = (modelId: string, parameters: ModelParameters): PerformanceMetrics => {
  switch (modelId) {
    case 'isolation-forest':
      return {
        accuracy: 0.9 - (parameters.contamination * 0.5),
        speed: 0.95 - (parameters.n_estimators / 2000),
        resourceUsage: (parameters.n_estimators / 1000) * 0.8,
        falsePositives: parameters.contamination * 100
      };
    case 'autoencoder':
      const complexityMap = { simple: 0.2, medium: 0.5, complex: 0.8 };
      const complexity = complexityMap[parameters.hidden_layers as keyof typeof complexityMap] || 0.5;
      return {
        accuracy: 0.85 + (complexity * 0.1),
        speed: 0.7 - (complexity * 0.3),
        resourceUsage: complexity,
        falsePositives: (1 - complexity) * 10
      };
    // Add cases for other models...
    default:
      return {
        accuracy: 0.8,
        speed: 0.8,
        resourceUsage: 0.5,
        falsePositives: 5
      };
  }
};

const estimateDetailedPerformance = (
  modelId: string, 
  parameters: ModelParameters,
  dataSize: number,
  dataComplexity: number
): DetailedPerformanceMetrics => {
  const baseMetrics = estimatePerformance(modelId, parameters);
  const confidenceMargin = 0.1; // 10% margin

  const createRange = (value: number): PerformanceRange => ({
    expected: value,
    min: Math.max(0, value - confidenceMargin),
    max: Math.min(1, value + confidenceMargin)
  });

  switch (modelId) {
    case 'isolation-forest':
      return {
        accuracy: createRange(baseMetrics.accuracy),
        speed: createRange(baseMetrics.speed),
        resourceUsage: createRange(baseMetrics.resourceUsage),
        falsePositives: createRange(baseMetrics.falsePositives / 100),
        confidenceScore: 0.85,
        dataCompatibility: dataSize > 1000 ? 0.9 : 0.7,
        historicalComparison: {
          improvement: 0.15,
          sampleSize: 1000
        }
      };
    case 'autoencoder':
      const complexityMap = { simple: 0.2, medium: 0.5, complex: 0.8 };
      const complexity = complexityMap[parameters.hidden_layers as keyof typeof complexityMap] || 0.5;
      const learningEffect = (0.01 - parameters.learning_rate) / 0.01; // Higher learning rate = lower accuracy
      
      return {
        accuracy: createRange(0.85 + (complexity * 0.1) + (learningEffect * 0.05)),
        speed: createRange(0.8 - (complexity * 0.3)),
        resourceUsage: createRange(0.3 + (complexity * 0.5)),
        falsePositives: createRange((1 - complexity) * 0.1),
        confidenceScore: 0.7 + (complexity * 0.2),
        dataCompatibility: dataSize > 5000 ? 0.9 : 0.6,
        historicalComparison: {
          improvement: 0.2 + (complexity * 0.1),
          sampleSize: 2000
        }
      };
    case 'prophet':
      const isMultiplicative = parameters.seasonality_mode === 'multiplicative';
      const flexibility = parameters.changepoint_prior_scale / 0.05;
      
      return {
        accuracy: createRange(0.75 + (isMultiplicative ? 0.05 : 0) + (flexibility * 0.02)),
        speed: createRange(0.7 - (flexibility * 0.1)),
        resourceUsage: createRange(0.4 + (flexibility * 0.1)),
        falsePositives: createRange(0.05 + (flexibility * 0.02)),
        confidenceScore: 0.8 - (flexibility * 0.1),
        dataCompatibility: dataSize > 100 ? 0.9 : 0.6,
        historicalComparison: {
          improvement: 0.1,
          sampleSize: 1500
        }
      };
    case 'arima':
      const orderComplexity = parameters.order === '2,1,2' ? 0.8 : 
                            parameters.order === '1,1,2' ? 0.6 :
                            parameters.order === '1,1,1' ? 0.4 : 0.3;
      const hasSeasonal = parameters.seasonal !== 'none';
      
      return {
        accuracy: createRange(0.7 + (orderComplexity * 0.1) + (hasSeasonal ? 0.05 : 0)),
        speed: createRange(0.9 - (orderComplexity * 0.2) - (hasSeasonal ? 0.2 : 0)),
        resourceUsage: createRange(0.3 + (orderComplexity * 0.3) + (hasSeasonal ? 0.2 : 0)),
        falsePositives: createRange(0.08 - (orderComplexity * 0.03)),
        confidenceScore: 0.7 + (orderComplexity * 0.2),
        dataCompatibility: dataSize > 50 ? 0.85 : 0.6,
        historicalComparison: {
          improvement: 0.08 + (orderComplexity * 0.05),
          sampleSize: 1000
        }
      };
    default:
      return {
        accuracy: createRange(0.8),
        speed: createRange(0.8),
        resourceUsage: createRange(0.5),
        falsePositives: createRange(0.05),
        confidenceScore: 0.7,
        dataCompatibility: 0.8
      };
  }
};

const MetricWithConfidence: React.FC<{
  range: PerformanceRange;
  label: string;
  color: string;
  showConfidence?: boolean;
}> = ({ range, label, color, showConfidence = true }) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{Math.round(range.expected * 100)}%</span>
      </div>
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden relative">
        {/* Expected value bar */}
        <div 
          className={`h-full ${color}`}
          style={{ width: `${range.expected * 100}%` }}
        />
        {/* Confidence interval */}
        {showConfidence && (
          <div
            className={`absolute top-0 h-full ${color} opacity-25`}
            style={{ 
              left: `${range.min * 100}%`,
              width: `${(range.max - range.min) * 100}%`
            }}
          />
        )}
      </div>
      {showConfidence && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Math.round(range.min * 100)}%</span>
          <span>{Math.round(range.max * 100)}%</span>
        </div>
      )}
    </div>
  );
};

const ModelSelection: React.FC = () => {
  const navigate = useNavigate();
  const { customColors } = useTheme();
  const { selectedFocus, setSelectedModels, csvData } = useData();
  const [selectedModelsState, setSelectedModelsState] = useState<Set<string>>(new Set());
  const [parameters, setParameters] = useState<ModelParameters>({});
  const [showPanel, setShowPanel] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [currentModel, setCurrentModel] = useState<Model | null>(null);

  const focusConfig = selectedFocus ? MONITORING_CONFIGS[selectedFocus] : null;
  
  const recommendedModels = useMemo(() => {
    if (!focusConfig) return [];
    
    return [
      AVAILABLE_MODELS.find(m => m.id === focusConfig.recommendedModels.anomaly[0]),
      AVAILABLE_MODELS.find(m => m.id === focusConfig.recommendedModels.predictive[0])
    ].filter(Boolean) as Model[];
  }, [focusConfig]);

  const handleModelSelect = (modelId: string) => {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (!model) return;

    setSelectedModelsState(prev => {
      const newSet = new Set(prev);
      
      // If this model type is already selected, remove the old one
      const existingModelOfType = Array.from(prev).find(id => 
        AVAILABLE_MODELS.find(m => m.id === id)?.type === model.type
      );
      if (existingModelOfType) {
        newSet.delete(existingModelOfType);
      }
      
      newSet.add(modelId);
      return newSet;
    });
  };

  const handleConfigure = (model: Model) => {
    setCurrentModel(model);
    setShowPanel(true);
    // Initialize parameters with model defaults
    const defaultParams = model.parameters.reduce((acc, param) => ({
      ...acc,
      [param.name]: param.default
    }), {});
    setParameters(defaultParams);
  };

  const handleContinue = () => {
    if (!focusConfig || !selectedFocus) return;
    
    if (selectedFocus === 'pattern') {
      const selectedAnomalyModel = Array.from(selectedModelsState).find(id => 
        AVAILABLE_MODELS.find(m => m.id === id)?.type === 'anomaly'
      );
      const selectedPredictiveModel = Array.from(selectedModelsState).find(id => 
        AVAILABLE_MODELS.find(m => m.id === id)?.type === 'predictive'
      );
      
      if (selectedAnomalyModel && selectedPredictiveModel) {
        setSelectedModels({
          anomaly: selectedAnomalyModel,
          predictive: selectedPredictiveModel
        });
      }
    } else {
      // For decision and bias focus, just use the single selected model
      const selectedModel = Array.from(selectedModelsState)[0];
      if (selectedModel) {
        setSelectedModels({
          anomaly: selectedModel,
          predictive: selectedModel
        });
      }
    }
    
    navigate('/dashboard');
  };

  // Add this debug function
  const getSelectedModelsDebug = (selectedModels: Set<string>) => {
    const anomaly = Array.from(selectedModels).find(id => 
      AVAILABLE_MODELS.find(m => m.id === id)?.type === 'anomaly'
    );
    const predictive = Array.from(selectedModels).find(id => 
      AVAILABLE_MODELS.find(m => m.id === id)?.type === 'predictive'
    );
    return { anomaly, predictive };
  };

  // Add this helper function
  const isValidModelSelection = (selectedModels: Set<string>, focusType: string | null) => {
    if (!focusType) return false;
    
    switch (focusType) {
      case 'pattern':
        // Pattern detection requires both models
        const { anomaly, predictive } = getSelectedModelsDebug(selectedModels);
        return !!anomaly && !!predictive;
      
      case 'decision':
      case 'bias':
        // Decision and bias focus only need one model
        return selectedModels.size === 1;
      
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: customColors?.backgroundColor }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: customColors?.textColor }}>
          Recommended Model Pair for {focusConfig?.title}
        </h1>
        <p className="text-lg mb-8 opacity-75" style={{ color: customColors?.textColor }}>
          Select both models to continue
        </p>
        {/* Models Grid */}
        <div className="grid gap-6 mb-6">
          {recommendedModels.map(model => (
            <div
              key={model.id}
              className={`p-6 rounded-lg cursor-pointer transition-all ${
                selectedModelsState.has(model.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: customColors?.tileColor }}
              onClick={() => handleModelSelect(model.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium" style={{ color: customColors?.textColor }}>
                    {model.name}
                  </h3>
                  <p className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                    {model.type === 'anomaly' ? 'Pattern Detection' : 'Predictive Analysis'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfigure(model);
                  }}
                  className="px-3 py-1 rounded-lg text-sm border"
                  style={{ borderColor: customColors?.borderColor }}
                >
                  Configure
                </button>
              </div>
              
              <p className="text-sm mb-4" style={{ color: customColors?.textColor }}>
                {model.description}
              </p>

              <div className="space-y-2">
                <h4 className="text-sm font-medium" style={{ color: customColors?.textColor }}>
                  Role in {focusConfig?.title}:
                </h4>
                <ul className="text-sm space-y-1">
                  {model.useCases.map((useCase, index) => (
                    <li 
                      key={index}
                      className="flex items-center gap-2"
                      style={{ color: customColors?.textColor }}
                    >
                      <Info className="w-3 h-3" />
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            className="px-4 py-2 rounded-lg border hover:bg-opacity-90"
            style={{ 
              borderColor: customColors?.borderColor,
              color: customColors?.textColor 
            }}
            onClick={() => navigate('/configure')}
          >
            Back to Configuration
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
            onClick={handleContinue}
            disabled={!focusConfig || !isValidModelSelection(selectedModelsState, selectedFocus)}
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Parameter Panel */}
      {currentModel && (
        <div 
          className={`fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform transition-transform duration-300 ${
            showPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ 
            backgroundColor: customColors?.tileColor,
            borderLeft: `1px solid ${customColors?.borderColor}` 
          }}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <h3 className="text-lg font-medium" style={{ color: customColors?.textColor }}>
                  Model Parameters
                </h3>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ParameterPanel
              model={currentModel}
              presets={MODEL_PRESETS[currentModel.id] || []}
              parameters={parameters}
              onParameterChange={(name, value) => {
                setParameters(prev => ({
                  ...prev,
                  [name]: value
                }));
              }}
              onClose={() => setShowPanel(false)}
              onReset={() => {
                const defaultParams = currentModel.parameters.reduce((acc, param) => ({
                  ...acc,
                  [param.name]: param.default
                }), {});
                setParameters(defaultParams);
              }}
              onApply={() => {
                // Apply changes
                setShowPanel(false);
              }}
              onPresetSelect={(preset) => {
                setParameters(preset.parameters);
              }}
              hasUnsavedChanges={false}
              setHasUnsavedChanges={() => {}}
              parameterErrors={{}}
              validateParameter={() => null}
              showPresets={showPresets}
              setShowPresets={setShowPresets}
              customColors={customColors}
              detailedMetrics={currentModel ? estimateDetailedPerformance(
                currentModel.id,
                parameters,
                csvData.length,
                calculateDataComplexity(csvData)
              ) : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelection; 