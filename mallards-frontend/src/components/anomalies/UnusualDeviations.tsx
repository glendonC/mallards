import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { UnusualDeviation, ModelInfo } from '../../types/anomaly';

interface Props {
  deviations: UnusualDeviation[];
  modelInfo: ModelInfo;
  onInvestigate: (id: string) => void;
  onResolve: (id: string) => void;
  isLoading?: boolean;
}

interface DeviationPattern {
  category: 'timing' | 'amount' | 'frequency' | 'distribution';
  score: number;
  culturalContext?: string;
  historicalTrend: 'increasing' | 'decreasing' | 'stable';
  sensitivity: number;
}

const UnusualDeviations: React.FC<Props> = ({
  deviations,
  modelInfo,
  onInvestigate,
  onResolve,
  isLoading = false
}) => {
  const { customColors } = useTheme();
  const [sortField, setSortField] = useState<keyof UnusualDeviation>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedDeviation, setSelectedDeviation] = useState<UnusualDeviation | null>(null);

  // Add these helper functions
const getCategoryFromPattern = (pattern: string): 'timing' | 'amount' | 'frequency' | 'distribution' => {
  if (pattern.toLowerCase().includes('timing') || pattern.toLowerCase().includes('time')) {
    return 'timing';
  }
  if (pattern.toLowerCase().includes('amount') || pattern.toLowerCase().includes('value')) {
    return 'amount';
  }
  if (pattern.toLowerCase().includes('frequency') || pattern.toLowerCase().includes('rate')) {
    return 'frequency';
  }
  return 'distribution';
};

const getContextFromMetrics = (metrics: { metric: string; value: number; expectedRange: [number, number] }[]): string => {
  const contextMap = {
    timing: 'Time-based pattern deviation',
    amount: 'Transaction amount anomaly',
    frequency: 'Unusual transaction frequency',
    distribution: 'Distribution pattern change'
  };

  // Look at the most significant deviation
  const significantMetric = metrics.reduce((most, current) => {
    const currentDeviation = Math.abs(current.value - current.expectedRange[0]) / current.expectedRange[1];
    const mostDeviation = Math.abs(most.value - most.expectedRange[0]) / most.expectedRange[1];
    return currentDeviation > mostDeviation ? current : most;
  }, metrics[0]);

  return contextMap[getCategoryFromPattern(significantMetric.metric)];
};

const getHistoricalTrend = (deviation: UnusualDeviation): 'increasing' | 'decreasing' | 'stable' => {
  // Calculate average deviation from expected ranges
  const averageDeviation = deviation.affectedMetrics.reduce((sum, metric) => {
    const expectedAvg = (metric.expectedRange[0] + metric.expectedRange[1]) / 2;
    const deviation = (metric.value - expectedAvg) / expectedAvg;
    return sum + deviation;
  }, 0) / deviation.affectedMetrics.length;

  if (Math.abs(averageDeviation) < 0.1) {
    return 'stable';
  }
  return averageDeviation > 0 ? 'increasing' : 'decreasing';
};
  
  // Add helper function
  const analyzePattern = (deviation: UnusualDeviation): DeviationPattern => {
    const baseScore = deviation.score;
    const culturalWeight = deviation.modelConfidence;
    
    return {
      category: getCategoryFromPattern(deviation.pattern),
      score: baseScore * culturalWeight,
      culturalContext: getContextFromMetrics(deviation.affectedMetrics),
      historicalTrend: getHistoricalTrend(deviation),
      sensitivity: deviation.modelConfidence
    };
  };

  const renderCulturalContext = (deviation: UnusualDeviation) => (
    <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: `${customColors?.backgroundColor}20` }}>
      <h4 className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
        Cultural Context Analysis
      </h4>
      <div className="space-y-3">
        {/* Pattern Information */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium" style={{ color: customColors?.textColor }}>
              Pattern Type
            </div>
            <div className="text-sm opacity-75">{deviation.pattern}</div>
          </div>
          <div className="px-2 py-1 rounded-full text-xs" 
               style={{ backgroundColor: `${customColors?.backgroundColor}40` }}>
            {deviation.modelConfidence * 100}% confidence
          </div>
        </div>
  
        {/* Metrics Analysis */}
        {deviation.affectedMetrics.map((metric, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="text-sm" style={{ color: customColors?.textColor }}>
              {metric.metric}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(metric.value / metric.expectedRange[1]) * 100}%`,
                    backgroundColor: metric.value > metric.expectedRange[1] ? '#ef4444' : '#10b981'
                  }}
                />
              </div>
              <span className="text-xs">
                {metric.value} / {metric.expectedRange[1]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTrendAnalysis = (deviation: UnusualDeviation) => (
    <div className="mt-4 p-4 rounded-lg border border-opacity-10" 
         style={{ borderColor: customColors?.borderColor }}>
      <h4 className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
        Trend Analysis
      </h4>
      <div className="grid gap-3">
        {deviation.affectedMetrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="text-sm" style={{ color: customColors?.textColor }}>
              {metric.metric}
            </div>
            <div className="flex items-center gap-2">
              <span className={metric.value > metric.expectedRange[1] ? 'text-red-500' : 'text-green-500'}>
                {((metric.value / metric.expectedRange[1]) * 100).toFixed(1)}%
              </span>
              <div className="w-24 h-1.5 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(metric.value / metric.expectedRange[1]) * 100}%`,
                    backgroundColor: metric.value > metric.expectedRange[1] ? '#ef4444' : '#10b981'
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <AlertOctagon className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleSort = (field: keyof UnusualDeviation) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedDeviations = [...deviations].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return aValue > bValue ? modifier : -modifier;
  });

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: customColors?.tileColor }}>
      {/* Header with Model Info */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium mb-1" style={{ color: customColors?.textColor }}>
            Unusual Deviations
          </h3>
          <div className="flex items-center gap-2 text-sm" style={{ color: customColors?.textColor }}>
            <span className="opacity-75">Using {modelInfo.name}</span>
            <div className="flex items-center gap-1">
              <Info className="w-4 h-4" />
              <span>{Math.round(modelInfo.confidence * 100)}% confidence</span>
            </div>
          </div>
        </div>
      </div>
  
      {/* Deviations Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${customColors?.borderColor}` }}>
              <th className="text-left py-2 px-4" style={{ color: customColors?.textColor }}>Severity</th>
              <th 
                className="text-left py-2 px-4 cursor-pointer"
                onClick={() => handleSort('score')}
                style={{ color: customColors?.textColor }}
              >
                <div className="flex items-center gap-1">
                  Score
                  {sortField === 'score' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="text-left py-2 px-4" style={{ color: customColors?.textColor }}>Pattern</th>
              <th className="text-right py-2 px-4" style={{ color: customColors?.textColor }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDeviations.map((deviation) => (
              <React.Fragment key={deviation.id}>
                <tr 
                  style={{ borderBottom: `1px solid ${customColors?.borderColor}` }}
                  className="hover:bg-opacity-50 cursor-pointer"
                  onClick={() => setSelectedDeviation(selectedDeviation?.id === deviation.id ? null : deviation)}
                >
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(deviation.severity)}
                      <span style={{ color: customColors?.textColor }}>
                        {deviation.severity.charAt(0).toUpperCase() + deviation.severity.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-16 h-2 rounded-full"
                        style={{
                          background: `linear-gradient(to right, ${customColors?.primary}, transparent)`,
                          opacity: deviation.score / 100
                        }}
                      />
                      <span style={{ color: customColors?.textColor }}>
                        {deviation.score.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div>
                      <div style={{ color: customColors?.textColor }}>{deviation.pattern}</div>
                      <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                        {deviation.explanation}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right">
                    {deviation.status === 'pending' ? (
                      <button
                        className="px-3 py-1 rounded text-sm"
                        style={{ 
                          backgroundColor: String(customColors?.primary) || '#3b82f6',
                          color: 'white'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onInvestigate(deviation.id);
                        }}
                      >
                        Investigate
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 rounded text-sm border"
                        style={{ 
                          borderColor: customColors?.borderColor,
                          color: customColors?.textColor
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onResolve(deviation.id);
                        }}
                      >
                        {deviation.status === 'investigating' ? 'Investigating...' : 'Resolved'}
                      </button>
                    )}
                  </td>
                </tr>
                {selectedDeviation?.id === deviation.id && (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <div className="p-4" style={{ backgroundColor: `${customColors?.backgroundColor}10` }}>
                        {/* Pattern Analysis */}
                        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: `${customColors?.backgroundColor}20` }}>
                          <h4 className="text-sm font-medium mb-3" style={{ color: customColors?.textColor }}>
                            Pattern Analysis
                          </h4>
                          {(() => {
                            const analysis = analyzePattern(deviation);
                            return (
                              <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm" style={{ color: customColors?.textColor }}>Category</span>
                                  <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${customColors?.backgroundColor}40`, color: customColors?.textColor }}>
                                    {analysis.category}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm" style={{ color: customColors?.textColor }}>Score</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-1.5 rounded-full bg-gray-200">
                                      <div
                                        className="h-full rounded-full"
                                        style={{ 
                                          width: `${analysis.score}%`,
                                          backgroundColor: String(customColors?.primary)
                                        }}
                                      />
                                    </div>
                                    <span className="text-sm">{analysis.score.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Cultural Context */}
                        {renderCulturalContext(deviation)}
                        
                        {/* Trend Analysis */}
                        {renderTrendAnalysis(deviation)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnusualDeviations; 