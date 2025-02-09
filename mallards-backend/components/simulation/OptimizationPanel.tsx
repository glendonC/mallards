import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowRight, TrendingUp, TrendingDown, BadgePercent } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  optimizedParameters: {
    approvalRateSensitivity: number;
    spendingMultiplier: number;
    fraudThreshold: number;
    culturalWeighting: number;
  };
  currentParameters: {
    approvalRateSensitivity: number;
    spendingMultiplier: number;
    fraudThreshold: number;
    culturalWeighting: number;
  };
  improvements: Array<{
    metric: string;
    before: number;
    after: number;
    percentChange: number;
  }>;
  reasoning: string[];
  onApply: () => void;
  isLoading: boolean;
}

const OptimizationPanel: React.FC<Props> = ({
  optimizedParameters,
  currentParameters,
  improvements,
  reasoning,
  onApply,
  isLoading
}) => {
  const { customColors } = useTheme();

  const MetricChange = ({ value, currentValue }: { value: number; currentValue: number }) => {
    const percentChange = ((value - currentValue) / currentValue) * 100;
    const Icon = percentChange > 0 ? TrendingUp : TrendingDown;
    const colorClass = percentChange > 0 ? 'text-green-500' : 'text-red-500';

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-75">{currentValue.toFixed(2)}</span>
        <ArrowRight className="w-4 h-4 opacity-50" />
        <div className={`flex items-center gap-1 text-sm font-medium ${colorClass}`}>
          {value.toFixed(2)}
          <Icon className="w-4 h-4" />
          <span className="text-xs">
            ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
          </span>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      style={{ color: customColors?.textColor }}
    >
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI-Optimized Parameters
        </h3>

        <div className="space-y-4 p-4 rounded-lg border" style={{ borderColor: customColors?.borderColor }}>
          {Object.entries(optimizedParameters).map(([key, value]) => {
            const currentValue = currentParameters[key as keyof typeof currentParameters];
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <MetricChange value={value} currentValue={currentValue} />
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BadgePercent className="w-4 h-4" />
            Expected Improvements
          </h4>
          <div className="grid gap-2">
            {improvements.map((imp, idx) => (
              <motion.div
                key={imp.metric}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 rounded-lg border"
                style={{ borderColor: customColors?.borderColor }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{imp.metric}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    imp.percentChange > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {imp.percentChange > 0 ? '+' : ''}{imp.percentChange.toFixed(1)}%
                  </span>
                </div>
                <MetricChange value={imp.after} currentValue={imp.before} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">AI Analysis</h4>
          <div className="space-y-2">
            {reasoning.map((reason, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-sm p-3 rounded-lg"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
              >
                {reason}
              </motion.div>
            ))}
          </div>
        </div>

        <button
          onClick={onApply}
          disabled={isLoading}
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Apply AI-Optimized Parameters
        </button>
      </div>
    </motion.div>
  );
};

export default OptimizationPanel;