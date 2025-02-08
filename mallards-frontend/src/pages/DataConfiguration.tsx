import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  MonitoringFocusType, 
  MONITORING_CONFIGS, 
  MonitoringFocusConfig 
} from '../types/monitoring';

const DataConfiguration: React.FC = () => {
  const navigate = useNavigate();
  const { customColors } = useTheme();
  const { 
    columnMapping, 
    setSelectedModels, 
    setDetectionRules,
    setSelectedFocus
  } = useData();

  // Simplified field validation
  const isFocusAvailable = (focus: MonitoringFocusConfig) => {
    return focus.requiredFields.every(field => !!columnMapping[field]);
  };

  // Helper function to show missing fields
  const getMissingFields = (focus: MonitoringFocusConfig) => {
    return focus.requiredFields.filter(field => !columnMapping[field]);
  };

  const handleFocusSelect = (focus: MonitoringFocusType) => {
    setSelectedFocus(focus);
    
    const focusConfig = MONITORING_CONFIGS[focus];
    
    setDetectionRules(prev => ({
      ...prev,
      sensitivity: focusConfig.thresholds.sensitivity,
      alertThreshold: focusConfig.thresholds.alertConfidence,
      groupBy: getFocusGroupBy(focus),
      timeWindow: getFocusTimeWindow(focus),
      culturalFactors: [],
      seasonalAdjustment: focus === 'pattern',
      regionalWeights: focus === 'bias',
      visualizationType: getFocusVisualization(focus)
    }));

    navigate('/models');
  };

  // Helper functions remain the same
  const getFocusGroupBy = (focus: MonitoringFocusType): string[] => {
    switch (focus) {
      case 'pattern':
        return ['transactionType', 'region'];
      case 'decision':
        return ['transactionDate', 'region'];
      case 'bias':
        return ['region', 'transactionType'];
      default:
        return ['region'];
    }
  };

  const getFocusTimeWindow = (focus: MonitoringFocusType): string => {
    switch (focus) {
      case 'pattern':
        return '24h';
      case 'decision':
        return '7d';
      case 'bias':
        return '30d';
      default:
        return '24h';
    }
  };

  const getFocusVisualization = (focus: MonitoringFocusType): 'line' | 'bar' | 'scatter' => {
    switch (focus) {
      case 'pattern':
        return 'line';
      case 'decision':
        return 'bar';
      case 'bias':
        return 'scatter';
      default:
        return 'line';
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: customColors?.backgroundColor }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: customColors?.textColor }}>
          Choose Monitoring Focus
        </h1>
        <p className="text-lg mb-8 opacity-75" style={{ color: customColors?.textColor }}>
          Select how you want to monitor your data based on available features
        </p>

        <div className="grid gap-6">
          {Object.values(MONITORING_CONFIGS).map(focus => {
            const isAvailable = isFocusAvailable(focus);
            const missingFields = getMissingFields(focus);
            
            return (
              <div
                key={focus.id}
                className={`bg-white rounded-lg p-6 border-2 transition-all ${
                  isAvailable ? 'hover:border-blue-500 cursor-pointer' : 'opacity-50'
                }`}
                style={{ 
                  backgroundColor: customColors?.tileColor,
                  borderColor: isAvailable ? customColors?.borderColor : 'transparent'
                }}
                onClick={() => isAvailable && handleFocusSelect(focus.id)}
              >
                <div className="flex items-start gap-4">
                  <focus.icon className="w-6 h-6 mt-1" style={{ color: customColors?.textColor }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium" style={{ color: customColors?.textColor }}>
                        {focus.title}
                      </h3>
                      {isAvailable ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm opacity-75 mb-4" style={{ color: customColors?.textColor }}>
                      {focus.description}
                    </p>
                    <div className="text-sm" style={{ color: customColors?.textColor }}>
                      <span className="font-medium">Required Fields: </span>
                      {focus.requiredFields.map(field => (
                        <span
                          key={field}
                          className={`inline-flex items-center gap-1 mr-2 ${
                            columnMapping[field] ? 'text-green-500' : 'text-yellow-500'
                          }`}
                        >
                          {columnMapping[field] ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          {field}
                        </span>
                      ))}
                    </div>
                    
                    {!isAvailable && missingFields.length > 0 && (
                      <div className="mt-2 text-sm text-yellow-500">
                        Missing fields: {missingFields.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            className="px-4 py-2 rounded-lg border hover:bg-opacity-90"
            style={{ 
              borderColor: customColors?.borderColor,
              color: customColors?.textColor 
            }}
            onClick={() => navigate('/mapping')}
          >
            Back to Mapping
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataConfiguration; 