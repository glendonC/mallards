// Parameter configuration panel
import React from 'react';
import { Model, ModelPreset, DetailedPerformanceMetrics } from '../../types/model';
import { X, Settings, Info, RefreshCw } from 'lucide-react';
import Tooltip from '../Tooltip';
import PerformancePreview from './PerformancePreview';

interface ParameterPanelProps {
  model: Model;
  presets: ModelPreset[];
  parameters: { [key: string]: any };
  onParameterChange: (name: string, value: any) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  onPresetSelect: (preset: ModelPreset) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  parameterErrors: { [key: string]: string };
  validateParameter: (modelId: string, paramName: string, value: any) => string | null;
  showPresets: boolean;
  setShowPresets: React.Dispatch<React.SetStateAction<boolean>>;
  customColors: any;
  detailedMetrics?: DetailedPerformanceMetrics;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  model,
  presets,
  parameters,
  onParameterChange,
  onClose,
  onReset,
  onApply,
  onPresetSelect,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  parameterErrors,
  validateParameter,
  showPresets,
  setShowPresets,
  customColors,
  detailedMetrics
}) => {
  const renderParameterControl = (param: Model['parameters'][0]) => {
    const hasError = !!parameterErrors[param.name];
    const controlClasses = `w-full p-2 rounded-lg border ${hasError ? 'border-red-500' : ''}`;

    switch (param.type) {
      case 'range':
        return (
          <div className="flex flex-col gap-1">
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={(param.max! - param.min!) / 100}
              value={parameters[param.name]}
              onChange={(e) => onParameterChange(param.name, Number(e.target.value))}
              className={controlClasses}
            />
            <div className="flex justify-between text-sm">
              <span>{param.min}</span>
              <span>{parameters[param.name]}</span>
              <span>{param.max}</span>
            </div>
          </div>
        );
      
      case 'select':
        return (
          <select
            value={parameters[param.name]}
            onChange={(e) => onParameterChange(param.name, e.target.value)}
            className={controlClasses}
            style={{ 
              backgroundColor: customColors?.backgroundColor,
              borderColor: customColors?.borderColor,
              color: customColors?.textColor
            }}
          >
            {param.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            min={param.min}
            max={param.max}
            value={parameters[param.name]}
            onChange={(e) => onParameterChange(param.name, Number(e.target.value))}
            className={controlClasses}
            style={{ 
              backgroundColor: customColors?.backgroundColor,
              borderColor: customColors?.borderColor,
              color: customColors?.textColor
            }}
          />
        );
    }
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform transition-transform duration-300 flex flex-col"
      style={{ 
        backgroundColor: customColors?.tileColor,
        borderLeft: `1px solid ${customColors?.borderColor}` 
      }}
    >
      {/* Header - Fixed */}
      <div className="p-6 border-b" style={{ borderColor: customColors?.borderColor }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h3 className="text-lg font-medium" style={{ color: customColors?.textColor }}>
              Model Parameters
              {hasUnsavedChanges && (
                <span className="ml-2 text-sm text-yellow-500">
                  (Changes not saved)
                </span>
              )}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        <div className="space-y-6">
          {detailedMetrics && <PerformancePreview metrics={detailedMetrics} customColors={customColors} />}
          {/* Presets Section */}
          <div className="mb-6">
            <button
              className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
              onClick={() => setShowPresets(!showPresets)}
            >
              <RefreshCw className="w-4 h-4" />
              Load Preset Configuration
            </button>

            {showPresets && (
              <div className="mt-4 space-y-4 max-h-80 overflow-y-auto">
                {presets?.map(preset => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                    style={{ borderColor: customColors?.borderColor }}
                    onClick={() => {
                      onPresetSelect(preset);
                      setShowPresets(false);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium" style={{ color: customColors?.textColor }}>
                        {preset.name}
                      </h4>
                    </div>
                    <p className="text-sm opacity-75 mb-2" style={{ color: customColors?.textColor }}>
                      {preset.description}
                    </p>
                    <div className="text-sm">
                      <span className="font-medium">Recommended for:</span>
                      <ul className="list-disc list-inside opacity-75">
                        {preset.recommendedFor.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parameters */}
          <div className="space-y-6">
            {model.parameters.map(param => (
              <div key={param.name} className="space-y-2">
                <label className="block" style={{ color: customColors?.textColor }}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{param.name}</span>
                    <Tooltip text={param.description}>
                      <Info className="w-4 h-4 opacity-50" />
                    </Tooltip>
                  </div>
                </label>
                {renderParameterControl(param)}
                {parameterErrors[param.name] && (
                  <p className="text-sm text-red-500">{parameterErrors[param.name]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="p-6 border-t" style={{ borderColor: customColors?.borderColor }}>
        <div className="flex gap-2">
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={!hasUnsavedChanges || Object.keys(parameterErrors).length > 0}
            onClick={() => {
              onApply();
              setHasUnsavedChanges(false);
            }}
          >
            Apply Changes
          </button>
          <button
            className="px-4 py-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
            disabled={!hasUnsavedChanges}
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterPanel; 