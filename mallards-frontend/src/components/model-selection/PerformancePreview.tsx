// Performance metrics visualization
import React from 'react';
import { DetailedPerformanceMetrics } from '../../types/model';
import Tooltip from '../Tooltip';
import { TrendingUp, AlertTriangle, Cpu } from 'lucide-react';
// ... other imports

interface PerformancePreviewProps {
  metrics: DetailedPerformanceMetrics;
  customColors: any;
}

interface MetricWithConfidenceProps {
  range: {
    min: number;
    max: number;
    expected: number;
  };
  label: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  showConfidence?: boolean;
}

const MetricWithConfidence: React.FC<MetricWithConfidenceProps> = ({
  range,
  label,
  color,
  icon,
  description,
  showConfidence = true
}) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon}
          <Tooltip text={description}>
            <span className="text-sm font-medium">{label}</span>
          </Tooltip>
        </div>
        <span className="text-sm">{Math.round(range.expected * 100)}%</span>
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
          <span className="text-xs opacity-75">Confidence Range</span>
          <span>{Math.round(range.max * 100)}%</span>
        </div>
      )}
    </div>
  );
};

export const PerformancePreview: React.FC<PerformancePreviewProps> = ({ metrics, customColors }) => {
  return (
    <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: customColors?.borderColor }}>
      <h4 className="text-sm font-medium mb-4" style={{ color: customColors?.textColor }}>
        Performance Impact Preview
      </h4>
      
      <div className="space-y-4">
        <MetricWithConfidence
          range={metrics.accuracy}
          label="Accuracy"
          color="bg-green-500"
          icon={<TrendingUp className="w-4 h-4 text-green-500" />}
          description="Model's prediction accuracy percentage"
        />
        <MetricWithConfidence
          range={metrics.speed}
          label="Processing Speed"
          color="bg-blue-500"
          icon={<Cpu className="w-4 h-4 text-blue-500" />}
          description="Data processing speed relative to baseline"
        />
        <MetricWithConfidence
          range={metrics.resourceUsage}
          label="Resource Usage"
          color="bg-yellow-500"
          icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />}
          description="System resource utilization level"
        />
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium mb-2">Analysis Confidence</h5>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Model Confidence:</span>
            <span className={`font-medium ${
              metrics.confidenceScore > 0.8 ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {Math.round(metrics.confidenceScore * 100)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Data Compatibility:</span>
            <span className={`font-medium ${
              metrics.dataCompatibility > 0.8 ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {Math.round(metrics.dataCompatibility * 100)}%
            </span>
          </div>
          {metrics.historicalComparison && (
            <div className="flex justify-between text-sm">
              <span>Historical Improvement:</span>
              <span className="font-medium text-green-500">
                +{Math.round(metrics.historicalComparison.improvement * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformancePreview; 