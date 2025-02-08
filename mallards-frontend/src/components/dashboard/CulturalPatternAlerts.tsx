import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Line } from 'react-chartjs-2';
import { ChartData } from 'chart.js';
import { AlertTriangle, AlertCircle, Info, TrendingUp, Brain, Activity } from 'lucide-react';

export type PatternType = 'spending' | 'decision' | 'bias';

interface PatternAlert {
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
}

export interface AlertTimelineData {
  timeline: Array<{
    timestamp: string;
    alertCount: number;
    baseline: number;
    actual: number;
  }>;
  alerts: PatternAlert[];
  summary: {
    total: number;
    byPattern: Record<string, number>;
    bySeverity: Record<string, number>;
    adaptationProgress: number;
  };
}

interface Props {
  data: AlertTimelineData;
  focusMode?: 'pattern' | 'decision' | 'bias';
  isFocused?: boolean;
}

const CulturalPatternAlerts: React.FC<Props> = ({ 
  data,
  focusMode = 'pattern',
  isFocused = false 
}) => {
  const { customColors } = useTheme();
  const [selectedAlert, setSelectedAlert] = useState<PatternAlert | null>(null);

  const getFocusMetrics = () => {
    switch (focusMode) {
      case 'pattern':
        return {
          primary: 'Spending Deviation',
          secondary: 'Transaction Volume',
          threshold: 25 // percent
        };
      case 'decision':
        return {
          primary: 'Approval Rate Change',
          secondary: 'Decision Volume',
          threshold: 15 // percent
        };
      case 'bias':
        return {
          primary: 'Regional Disparity',
          secondary: 'Group Distribution',
          threshold: 20 // percent
        };
    }
  };

  const renderTimeline = () => {
    const metrics = getFocusMetrics();
    const chartData: ChartData<'line'> = {
      labels: data.timeline.map(t => new Date(t.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: 'Actual',
          data: data.timeline.map(t => t.actual),
          borderColor: '#3b82f6',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Baseline',
          data: data.timeline.map(t => t.baseline),
          borderColor: '#9ca3af',
          borderDash: [5, 5],
          tension: 0.1,
          fill: false
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
          </div>
        )}
      </div>
    );
  };

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
        </div>
      </div>

      <div className="space-y-2">
        {data.alerts
          .filter(alert => !focusMode || alert.patternType === focusMode)
          .map(renderAlertCard)}
      </div>
    </div>
  );
};

export default CulturalPatternAlerts; 