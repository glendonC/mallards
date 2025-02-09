import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Line } from 'react-chartjs-2';
import { ChartData } from 'chart.js';
import { AlertTriangle, AlertCircle, Info, TrendingUp, Brain, Activity, ArrowRight } from 'lucide-react';
import { getFocusMetrics } from '../../utils/focusMetrics';

export type PatternType = 'spending' | 'decision' | 'bias';

export interface PatternAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  patternType: PatternType;
  culturalContext?: string;
  metrics: {
    value: number;
    baseline: number;
    deviation: number;
  };
  details: {
    description: string;
    affectedRegions?: string[];
    suggestedActions?: string[];
  };
  adaptation: {
    status: 'learning' | 'adjusting' | 'monitoring';
    progress: number;
    lastUpdate: string;
  };
  prediction?: {
    probability: number;
    confidence: number;
    horizon: string;  // e.g., "1h", "24h"
    modelUsed: string;
  };
  modelInsights?: {
    featureImportance: Record<string, number>;
    similarPatterns?: Array<{
      timestamp: string;
      similarity: number;
    }>;
  };
}

export interface AlertTimelineData {
  timeline: Array<{
    timestamp: string;
    alertCount: number;
    baseline: number;
    actual: number;
  }>;
  alerts: PatternAlert[];
  groupedAlerts: Record<string, PatternAlert[]>;
  predictions: Array<{
    timestamp: string;
    probability: number;
    confidence: number;
    potentialImpact: number;
  }>;
  modelMetrics: {
    accuracy: number;
    lastTraining: string;
    drift: number;
  };
  summary: {
    total: number;
    byPattern: Record<string, number>;
    bySeverity: Record<string, number>;
    byTimeOfDay: Record<string, number>;
    adaptationProgress: number;
  };
}

interface Props {
  data: AlertTimelineData;
  focusMode?: 'pattern' | 'decision' | 'bias';
  isFocused?: boolean;
  isPreview?: boolean;
  isLoading?: boolean;
}

const CulturalPatternAlerts: React.FC<Props> = ({ 
  data,
  focusMode = 'pattern',
  isFocused = false,
  isPreview = false
}) => {
  const { customColors } = useTheme();
  const [selectedAlert, setSelectedAlert] = useState<PatternAlert | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const renderTimeline = () => {
    const metrics = getFocusMetrics(focusMode);
    const chartData: ChartData<'line'> = {
      labels: [
        ...data.timeline.map(t => new Date(t.timestamp).toLocaleTimeString()),
        ...data.predictions.map(t => new Date(t.timestamp).toLocaleTimeString())
      ],
      datasets: [
        {
          label: 'Actual',
          data: [...data.timeline.map(t => t.actual), ...Array(data.predictions.length).fill(null)],
          borderColor: '#3b82f6',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Baseline',
          data: [...data.timeline.map(t => t.baseline), ...Array(data.predictions.length).fill(null)],
          borderColor: '#9ca3af',
          borderDash: [5, 5],
          tension: 0.1,
          fill: false
        },
        {
          label: 'Predicted',
          data: [...Array(data.timeline.length).fill(null), ...data.predictions.map(p => p.probability)],
          borderColor: 'rgba(99, 102, 241, 0.8)',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false
        },
        {
          label: 'Confidence Range',
          data: [...Array(data.timeline.length).fill(null), ...data.predictions.map(p => p.confidence)],
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }
      ]
    };

    return (
      <div className="h-48">
        <Line 
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw as number;
                    return `${metrics.primary}: ${value.toFixed(1)}%`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: customColors?.borderColor || '#e2e8f0' }
              }
            }
          }}
        />
      </div>
    );
  };

  const renderAlertCard = (alert: PatternAlert) => {
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'high': return 'text-red-500';
        case 'medium': return 'text-yellow-500';
        case 'low': return 'text-blue-500';
        default: return '';
      }
    };

    const getAdaptationIcon = (status: string) => {
      switch (status) {
        case 'learning': return <Brain className="w-4 h-4" />;
        case 'adjusting': return <Activity className="w-4 h-4" />;
        case 'monitoring': return <AlertCircle className="w-4 h-4" />;
        default: return null;
      }
    };

    return (
      <div 
        key={alert.id}
        className={`p-4 rounded-lg cursor-pointer transition-all ${
          selectedAlert?.id === alert.id ? 'ring-2' : ''
        }`}
        style={{ backgroundColor: customColors?.backgroundColor }}
        onClick={() => setSelectedAlert(alert.id === selectedAlert?.id ? null : alert)}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className={`flex items-center gap-2 ${getSeverityColor(alert.severity)}`}>
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">{alert.culturalContext || 'Pattern Alert'}</span>
            </div>
            <p className="text-sm mt-1 opacity-75">{alert.details.description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {getAdaptationIcon(alert.adaptation.status)}
            <div className="w-16 h-1 rounded-full bg-gray-200">
              <div 
                className="h-full rounded-full bg-green-500"
                style={{ width: `${alert.adaptation.progress}%` }}
              />
            </div>
          </div>
        </div>

        {selectedAlert?.id === alert.id && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs opacity-75">Deviation</div>
                <div className="font-medium">
                  {alert.metrics.deviation.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs opacity-75">Affected Regions</div>
                <div className="font-medium">
                  {alert.details.affectedRegions?.join(', ') || 'All'}
                </div>
              </div>
            </div>
            {alert.details.suggestedActions && (
              <div>
                <div className="text-xs opacity-75 mb-1">Suggested Actions</div>
                <ul className="text-sm space-y-1">
                  {alert.details.suggestedActions.map((action, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-current" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {alert.prediction && (
              <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Predictive Insights</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs opacity-75">Probability</div>
                    <div>{(alert.prediction.probability * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75">Confidence</div>
                    <div>{(alert.prediction.confidence * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75">Model Used</div>
                    <div>{alert.prediction.modelUsed}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75">Time Horizon</div>
                    <div>{alert.prediction.horizon}</div>
                  </div>
                </div>
                {alert.modelInsights?.similarPatterns && (
                  <div className="mt-2">
                    <div className="text-xs opacity-75 mb-1">Similar Historical Patterns</div>
                    {alert.modelInsights.similarPatterns.map((pattern, i) => (
                      <div key={i} className="text-xs flex justify-between">
                        <span>{new Date(pattern.timestamp).toLocaleDateString()}</span>
                        <span>{(pattern.similarity * 100).toFixed(1)}% similar</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isPreview) {
    const alertsByType = {
      high: data.alerts.filter(a => a.severity === 'high').length,
      medium: data.alerts.filter(a => a.severity === 'medium').length,
      low: data.alerts.filter(a => a.severity === 'low').length
    };
  
    return (
      <div className="p-4 h-full flex flex-col">
        {/* Header Stats */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-lg font-medium">{data.summary.total} Alerts</span>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-green-500 flex items-center gap-1">
              <Brain className="w-4 h-4" />
              {data.summary.adaptationProgress}%
            </span>
            <span className="text-blue-500 flex items-center gap-1">
              <Activity className="w-4 h-4" />
              {data.modelMetrics.accuracy}%
            </span>
          </div>
        </div>
  
        {/* Alert Distribution */}
        <div className="flex justify-around mb-2 text-sm">
          <span className="text-red-500">●{alertsByType.high} High</span>
          <span className="text-yellow-500">●{alertsByType.medium} Med</span>
          <span className="text-blue-500">●{alertsByType.low} Low</span>
        </div>
  
        {/* Enhanced Timeline */}
        <div className="h-28">
          <Line
            data={{
              labels: data.timeline.map(t => new Date(t.timestamp).toLocaleTimeString()),
              datasets: [{
                label: 'Alerts',
                data: data.timeline.map(t => t.actual),
                borderColor: '#3b82f6',
                tension: 0.4,
                pointRadius: 0,
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              },
              {
                label: 'Baseline',
                data: data.timeline.map(t => t.baseline),
                borderColor: '#9ca3af',
                borderDash: [5, 5],
                tension: 0.1,
                pointRadius: 0
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { display: false },
                y: { 
                  display: false,
                  grid: { display: true, color: 'rgba(0,0,0,0.05)' }
                }
              }
            }}
          />
        </div>
  
        {/* Latest Alerts */}
        <div className="space-y-2 mt-2">
          {data.alerts.slice(0, 2).map(alert => (
            <div
              key={alert.id}
              className={`p-2 rounded-lg ${
                alert.severity === 'high' ? 'bg-red-50 border-red-100' :
                alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-100' :
                'bg-blue-50 border-blue-100'
              } border`}
            >
              <div className="flex justify-between">
                <span className="font-medium">{alert.culturalContext}</span>
                <span className="text-sm opacity-75">
                  {new Date(alert.timestamp).toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {renderTimeline()}
      
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm">
          <span>
            Total Alerts: {data.summary.total}
          </span>
          <span className="text-green-500">
            AI Adaptation: {data.summary.adaptationProgress}%
          </span>
          <span className="text-indigo-500">
            <Brain className="w-4 h-4 inline mr-1" />
            Accuracy: {data.modelMetrics.accuracy.toFixed(1)}%
          </span>
          {data.modelMetrics.drift > 0.1 && (
            <span className="text-yellow-500">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Model Drift Detected
            </span>
          )}
        </div>
      </div>
  
      <div className="space-y-4">
        {Object.entries(
          Object.entries(data.groupedAlerts).reduce((months, [date, alerts]) => {
            const monthYear = new Date(date).toLocaleDateString('en-US', { 
              month: 'long',
              year: 'numeric'
            });
            if (!months[monthYear]) {
              months[monthYear] = {};
            }
            months[monthYear][date] = alerts;
            return months;
          }, {} as Record<string, Record<string, PatternAlert[]>>)
        )
          .sort(([monthA], [monthB]) => new Date(monthB).getTime() - new Date(monthA).getTime())
          .map(([month, dates]) => {
            const totalAlerts = Object.values(dates)
              .reduce((sum, alerts) => sum + alerts.length, 0);
            
            return (
              <div key={month} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
                  onClick={() => setExpandedMonth(expandedMonth === month ? null : month)}
                >
                  <div>
                    <span className="font-medium">{month}</span>
                    <span className="ml-2 text-sm opacity-75">
                      ({totalAlerts} alerts)
                    </span>
                  </div>
                  <ArrowRight 
                    className={`w-5 h-5 transition-transform ${
                      expandedMonth === month ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                
                {expandedMonth === month && (
                  <div className="p-3 space-y-3">
                    {Object.entries(dates)
                      .sort(([dateA], [dateB]) => 
                        new Date(dateB).getTime() - new Date(dateA).getTime()
                      )
                      .map(([date, alerts]) => (
                        <div key={date} className="space-y-2">
                          <h4 className="text-sm font-medium" style={{ color: customColors?.textColor }}>
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                            <span className="ml-2 text-sm opacity-75">
                              ({alerts.length} alerts)
                            </span>
                          </h4>
                          {alerts
                            .filter(alert => !focusMode || alert.patternType === focusMode)
                            .map(renderAlertCard)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CulturalPatternAlerts; 