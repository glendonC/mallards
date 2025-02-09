import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { UnusualDeviation } from '../../types/anomaly';
import { useDeviations } from '@/hooks/useDeviations';

interface DeviationPattern {
  category: 'timing' | 'amount' | 'frequency' | 'distribution';
  score: number;
  culturalContext?: string;
  historicalTrend: 'increasing' | 'decreasing' | 'stable';
  sensitivity: number;
}

const UnusualDeviations: React.FC = () => {
  const { customColors } = useTheme();
  const { 
    deviations, 
    isLoading, 
    modelInfo, 
  } = useDeviations();
  
  const [sortField, setSortField] = useState<keyof UnusualDeviation>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedDeviation, setSelectedDeviation] = useState<UnusualDeviation | null>(null);

  // Helper functions for analyzing deviations
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

    const significantMetric = metrics.reduce((most, current) => {
      const currentDeviation = Math.abs(current.value - current.expectedRange[0]) / current.expectedRange[1];
      const mostDeviation = Math.abs(most.value - most.expectedRange[0]) / most.expectedRange[1];
      return currentDeviation > mostDeviation ? current : most;
    }, metrics[0]);

    return contextMap[getCategoryFromPattern(significantMetric.metric)];
  };

  const getHistoricalTrend = (deviation: UnusualDeviation): 'increasing' | 'decreasing' | 'stable' => {
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

  // Rendering helper functions
  const renderCulturalContext = (deviation: UnusualDeviation) => (
    <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: `${customColors?.backgroundColor}20` }}>
      <h4 className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
        Cultural Context Analysis
      </h4>
      <div className="space-y-3">
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

  // Sorting functions
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

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 rounded-lg" style={{ backgroundColor: customColors?.tileColor }}>
        <div className="flex items-center justify-center h-64">
          <span className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
            Loading deviations...
          </span>
        </div>
      </div>
    );
  }

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
  
      {/* Deviations by Severity Groups */}
      {['high', 'medium', 'low'].map(severityLevel => {
        const filteredDeviations = sortedDeviations.filter(d => d.severity === severityLevel);
        if (filteredDeviations.length === 0) return null;
        
        return (
          <div key={severityLevel} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              {getSeverityIcon(severityLevel as 'high' | 'medium' | 'low')}
              <h4 className="text-lg font-medium" style={{ color: customColors?.textColor }}>
                {severityLevel.charAt(0).toUpperCase() + severityLevel.slice(1)} Severity
                <span className="text-sm opacity-75 ml-2">
                  ({filteredDeviations.length})
                </span>
              </h4>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeviations.map((deviation) => (
                <div 
                  key={deviation.id}
                  className="p-4 rounded-lg cursor-pointer hover:bg-opacity-50 transition-all"
                  style={{ 
                    backgroundColor: `${customColors?.backgroundColor}20`,
                    borderLeft: `4px solid ${
                      deviation.severity === 'high' ? '#ef4444' :
                      deviation.severity === 'medium' ? '#f59e0b' : '#10b981'
                    }`
                  }}
                  onClick={() => setSelectedDeviation(selectedDeviation?.id === deviation.id ? null : deviation)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(deviation.severity)}
                      <span style={{ color: customColors?.textColor }}>
                        {deviation.severity.charAt(0).toUpperCase() + deviation.severity.slice(1)}
                      </span>
                    </div>
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
                  </div>
                  
                  <div>
                    <div style={{ color: customColors?.textColor }}>{deviation.pattern}</div>
                    <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                      {deviation.explanation}
                    </div>
                  </div>
  
                  {/* Expandable Details */}
                  {selectedDeviation?.id === deviation.id && (
                    <div className="mt-4">
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
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UnusualDeviations;