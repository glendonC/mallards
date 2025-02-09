import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sliders, Loader, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  parameters: {
    approvalRateSensitivity: number;
    spendingMultiplier: number;
    fraudThreshold: number;
    culturalWeighting: number;
  };
  originalParameters?: Props['parameters'];
  onChange: (params: Props['parameters']) => void;
  isLoading: boolean;
  isOptimized?: boolean;
}

const ParameterControls: React.FC<Props> = ({
  parameters,
  originalParameters,
  onChange,
  isLoading,
  isOptimized
}) => {
  const { customColors } = useTheme();

  const handleChange = (key: keyof Props['parameters'], value: number) => {
    onChange({
      ...parameters,
      [key]: value
    });
  };

  const controls = [
    {
      key: 'approvalRateSensitivity',
      label: 'Approval Rate Sensitivity',
      min: 0.7,
      max: 1.5,
      step: 0.1,
      tooltip: 'Adjusts lending criteria sensitivity. Higher values increase approval likelihood for culturally-specific patterns'
    },
    {
      key: 'spendingMultiplier',
      label: 'Spending Pattern Multiplier',
      min: 0.8,
      max: 1.5,
      step: 0.1,
      tooltip: 'Adjusts expected transaction volumes during cultural events or seasonal periods'
    },
    {
      key: 'fraudThreshold',
      label: 'Cultural-Aware Fraud Threshold',
      min: 0.7,
      max: 0.95,
      step: 0.05,
      tooltip: 'Balances fraud detection with cultural spending patterns (higher = stricter)'
    },
    {
      key: 'culturalWeighting',
      label: 'Cultural Factor Weight',
      min: 0.8,
      max: 1.6,
      step: 0.1,
      tooltip: 'Importance given to cultural context in decision-making'
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isOptimized ? <Bot className="w-5 h-5 text-blue-500" /> : <Sliders className="w-5 h-5" />}
          <h2 className="text-lg font-medium" style={{ color: customColors?.textColor }}>
            {isOptimized ? 'AI-Optimized Parameters' : 'Adjustment Parameters'}
          </h2>
        </div>
        {isLoading && <Loader className="w-5 h-5 animate-spin" />}
      </div>

      <div className="space-y-4">
        {controls.map(control => {
          const key = control.key as keyof Props['parameters'];
          const isModified = originalParameters && parameters[key] !== originalParameters[key];

          return (
            <motion.div
              key={control.key}
              className="space-y-2"
              initial={false}
              animate={{
                scale: isModified ? [1.05, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between">
                <label 
                  className="text-sm font-medium"
                  style={{ color: customColors?.textColor }}
                  title={control.tooltip}
                >
                  {control.label}
                </label>
                <span className={`text-sm ${
                  isModified ? 'text-blue-600 font-medium' : 'opacity-75'
                }`} style={{ color: customColors?.textColor }}>
                  {parameters[key].toFixed(2)}x
                  {isModified && <span className="ml-1 text-xs">
                    ({((parameters[key] - (originalParameters?.[key] || 0)) / (originalParameters?.[key] || 1) * 100).toFixed(1)}%)
                  </span>}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={parameters[key]}
                  onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                  className={`w-full ${
                    isModified ? 'accent-blue-500' : 'accent-gray-400'
                  }`}
                  disabled={isLoading}
                />
                {originalParameters && isModified && (
                  <div 
                    className="absolute top-0 w-1 h-4 bg-gray-400"
                    style={{
                      left: `${((originalParameters[key] - control.min) / (control.max - control.min)) * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                )}
              </div>
              <p className="text-xs opacity-75 mt-1" style={{ color: customColors?.textColor }}>
                {control.tooltip}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ParameterControls;