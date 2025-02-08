import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Line } from 'react-chartjs-2';
import { ChartData, LegendItem, TooltipItem } from 'chart.js';
import { Calendar, TrendingUp, Brain, ArrowRight, Info } from 'lucide-react';
import { CulturalEventAnalyticsData, EventInsight } from '../../types/dashboard';

interface Props {
  data: CulturalEventAnalyticsData;
  isPreview?: boolean;
  isFocused?: boolean;
  focusMode?: 'pattern' | 'decision' | 'bias';
  isLoading?: boolean;
  error?: string | null;
}

const CulturalEventAnalytics: React.FC<Props> = ({ 
  data,
  isPreview = false,
  isFocused = false,
  focusMode = 'pattern',
  isLoading = false,
  error = null
}) => {
  const { customColors } = useTheme();
  const [selectedInsight, setSelectedInsight] = useState<EventInsight | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <Info className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  const getFocusMetrics = (focusMode: string) => {
    switch (focusMode) {
      case 'pattern':
        return {
          primaryMetric: 'Transaction Volume',
          secondaryMetric: 'Spending Pattern',
          trend: 'spending',
          threshold: 25
        };
      case 'decision':
        return {
          primaryMetric: 'Approval Rate',
          secondaryMetric: 'Decision Volume',
          trend: 'approvals',
          threshold: 15
        };
      case 'bias':
        return {
          primaryMetric: 'Fairness Score',
          secondaryMetric: 'Regional Distribution',
          trend: 'bias',
          threshold: 20
        };
      default:
        return {
          primaryMetric: 'Event Impact',
          secondaryMetric: 'Pattern Strength',
          trend: 'general',
          threshold: 20
        };
    }
  };

  const renderLineChart = () => {
    const metrics = getFocusMetrics(focusMode);
    
    // Find where forecast begins
    const forecastStartIndex = data.timelineData.findIndex(d => d.forecast !== undefined);
    
    const chartData: ChartData<'line'> = {
      labels: data.timelineData.map(d => new Date(d.timestamp).toLocaleDateString()),
      datasets: [
        // Historical Values
        {
          label: 'Historical Data',
          data: data.timelineData.map((d, i) => 
            i < forecastStartIndex ? d.value : null
          ),
          borderColor: 'rgba(59, 130, 246, 0.8)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
          tension: 0.4
        },
        // Forecast Values
        {
          label: 'Forecast',
          data: data.timelineData.map((d, i) => 
            i >= forecastStartIndex ? d.forecast ?? null : null
          ),
          borderColor: 'rgba(99, 102, 241, 0.8)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4
        },
        // Confidence Intervals
        {
          label: 'Upper Bound',
          data: data.timelineData.map((d, i) => 
            i >= forecastStartIndex ? d.upper ?? null : null
          ),
          borderColor: 'transparent',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: '+1',
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Lower Bound',
          data: data.timelineData.map((d, i) => 
            i >= forecastStartIndex ? d.lower ?? null : null
          ),
          borderColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 0
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            filter: (legendItem: LegendItem) => !['Upper Bound', 'Lower Bound'].includes(legendItem.text || '')
          }
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              const index = context.dataIndex;
              const dataPoint = data.timelineData[index];
              
              if (index >= forecastStartIndex) {
                return [
                  `Forecast: ${dataPoint.forecast?.toFixed(2)}`,
                  `Range: ${dataPoint.lower?.toFixed(2)} - ${dataPoint.upper?.toFixed(2)}`
                ];
              }
              return `Actual: ${dataPoint.value?.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: customColors?.borderColor || '#e2e8f0'
          }
        },
        x: {
          grid: {
            color: (context: { index: number }) => {
              return context.index === forecastStartIndex ? 
                'rgba(99, 102, 241, 0.5)' : 
                customColors?.borderColor || '#e2e8f0';
            },
            lineWidth: (context: { index: number }) => {
              return context.index === forecastStartIndex ? 2 : 1;
            }
          }
        }
      }
    };

    return (
      <div className="h-64">
        <Line data={chartData} options={options} />
        {/* Forecast Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-500" />
            <span>Historical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-indigo-500 border-t-2 border-dashed" />
            <span>Forecast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-indigo-100" />
            <span>Confidence Range</span>
          </div>
        </div>
      </div>
    );
  };

  // Preview version remains mostly the same but with forecast data
  if (isPreview) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {data.summary.totalEvents} Events
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {data.summary.averageImpact}% Impact
          </span>
          {data.summary.forecastConfidence && (
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {data.summary.forecastConfidence}% Confidence
            </span>
          )}
        </div>

        <div className="h-[120px]">
          <Line
            data={{
              labels: data.timelineData.map(d => new Date(d.timestamp).toLocaleDateString()),
              datasets: [
                {
                  label: 'Value',
                  data: data.timelineData.map(d => d.value || d.eventValue),
                  borderColor: 'rgba(59, 130, 246, 0.8)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true }
              }
            }}
          />
        </div>

        {data.insights[0] && (
          <div className="mt-2 text-xs">
            <div className="font-medium">{data.insights[0].eventName}</div>
            <div className="text-blue-500">
              {data.insights[0].metrics.averageIncrease > 0 ? '+' : ''}
              {data.insights[0].metrics.averageIncrease}% Impact
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderAILearningMetrics = (insight: EventInsight) => (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="p-3 rounded bg-opacity-10" style={{ backgroundColor: customColors?.backgroundColor }}>
        <div className="text-xs opacity-75">Pattern Recognition</div>
        <div className="font-medium">{insight.metrics.patternConfidence || 0}%</div>
        <div className="w-full h-1 mt-1 rounded-full bg-gray-200">
          <div 
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${insight.metrics.patternConfidence || 0}%` }}
          />
        </div>
      </div>
      <div className="p-3 rounded bg-opacity-10" style={{ backgroundColor: customColors?.backgroundColor }}>
        <div className="text-xs opacity-75">Adaptation Progress</div>
        <div className="font-medium">{insight.metrics.adaptationProgress || 0}%</div>
        <div className="w-full h-1 mt-1 rounded-full bg-gray-200">
          <div 
            className="h-full rounded-full bg-green-500"
            style={{ width: `${insight.metrics.adaptationProgress || 0}%` }}
          />
        </div>
      </div>
    </div>
  );

  const renderPredictions = (insight: EventInsight) => (
    <div className="mt-6">
      <h4 className="text-sm font-medium mb-2">Future Predictions</h4>
      <div className="space-y-2">
        {insight.predictions?.map((prediction, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span>{prediction.date}</span>
            <span className={prediction.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {prediction.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInsightCard = (insight: EventInsight) => (
    <div
      key={insight.id}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        selectedInsight?.id === insight.id ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ 
        backgroundColor: customColors?.tileColor,
        borderColor: customColors?.borderColor
      }}
      onClick={() => setSelectedInsight(insight)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium" style={{ color: customColors?.textColor }}>
            {insight.eventName}
          </h4>
          <div className="flex items-center gap-2 text-sm opacity-75">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(insight.period.start).toLocaleDateString()} - {new Date(insight.period.end).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-sm font-medium text-blue-500">
          {insight.metrics.averageIncrease > 0 ? '+' : ''}{insight.metrics.averageIncrease}%
        </div>
      </div>

      <div className="space-y-2 mt-4">
        {insight.patterns.map((pattern, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="capitalize">{pattern.phase}</span>
            <div className="flex items-center gap-2">
              <span className={pattern.change > 0 ? 'text-green-500' : 'text-red-500'}>
                {pattern.change > 0 ? '+' : ''}{pattern.change}%
              </span>
              <span className={
                pattern.trend === 'increasing' ? 'text-green-500' :
                pattern.trend === 'decreasing' ? 'text-red-500' :
                'text-gray-500'
              }>
                {pattern.trend === 'increasing' ? '↑' :
                 pattern.trend === 'decreasing' ? '↓' : '→'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 rounded bg-opacity-10" style={{ backgroundColor: customColors?.backgroundColor }}>
          <div className="text-xs opacity-75">Pattern Recognition</div>
          <div className="font-medium">{insight.metrics.patternConfidence || 0}%</div>
          <div className="w-full h-1 mt-1 rounded-full bg-gray-200">
            <div 
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${insight.metrics.patternConfidence || 0}%` }}
            />
          </div>
        </div>
        <div className="p-3 rounded bg-opacity-10" style={{ backgroundColor: customColors?.backgroundColor }}>
          <div className="text-xs opacity-75">AI Adaptation</div>
          <div className="font-medium">{insight.metrics.adaptationProgress || 0}%</div>
          <div className="w-full h-1 mt-1 rounded-full bg-gray-200">
            <div 
              className="h-full rounded-full bg-green-500"
              style={{ width: `${insight.metrics.adaptationProgress || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (isPreview) {
    // Simplified preview version
    return (
      <div className="p-4">
        {/* Key metrics */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {data.summary.totalEvents} Events
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {data.summary.averageImpact}% Impact
          </span>
        </div>

        {/* Mini chart */}
        <div className="h-[120px]">
          <Line
            data={{
              labels: data.timelineData.map(d => new Date(d.timestamp).toLocaleDateString()),
              datasets: [
                {
                  label: 'Event Period',
                  data: data.timelineData.map(d => d.value),
                  borderColor: 'rgba(59, 130, 246, 0.8)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: {
                  display: false
                },
                y: {
                  display: false,
                  beginAtZero: true
                }
              }
            }}
          />
        </div>

        {/* Most recent insight preview */}
        {data.insights[0] && (
          <div className="mt-2 text-xs">
            <div className="font-medium">{data.insights[0].eventName}</div>
            <div className="text-blue-500">
              {data.insights[0].metrics.averageIncrease > 0 ? '+' : ''}
              {data.insights[0].metrics.averageIncrease}% Impact
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full version with all insight components remaining the same
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 text-sm mb-6">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {data.summary.totalEvents} Events
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          {data.summary.averageImpact}% Avg. Impact
        </span>
        <span className="flex items-center gap-1 text-green-500">
          <Brain className="w-4 h-4" />
          {data.summary.aiAdaptation || 0}% AI Learning
        </span>
        {data.summary.forecastConfidence && (
          <span className="flex items-center gap-1 text-indigo-500">
            <Info className="w-4 h-4" />
            {data.summary.forecastConfidence}% Forecast Confidence
          </span>
        )}
      </div>

      {renderLineChart()}

      <div className="mt-6 grid gap-4">
        <h4 className="text-sm font-medium" style={{ color: customColors?.textColor }}>
          Event Insights
        </h4>
        <div className="space-y-4">
          {data.insights.map(renderInsightCard)}
        </div>
      </div>

      {selectedInsight && (
  <>
    {/* Existing recommendations section */}
    <div className="mt-6 pt-6 border-t" style={{ borderColor: customColors?.borderColor }}>
      <h4 className="text-sm font-medium mb-4" style={{ color: customColors?.textColor }}>
        Recommendations
      </h4>
      <div className="space-y-2">
        {selectedInsight.recommendations.map((rec, index) => (
          <div key={index} className="flex items-start gap-2 text-sm">
            <ArrowRight className="w-4 h-4 mt-1 text-blue-500" />
            <span>{rec}</span>
          </div>
        ))}
      </div>
    </div>
    
    {/* Add AI Learning Metrics */}
    <div className="mt-6 pt-6 border-t" style={{ borderColor: customColors?.borderColor }}>
      {renderAILearningMetrics(selectedInsight)}
    </div>
    
    {/* Add Predictions */}
    {selectedInsight.predictions && selectedInsight.predictions.length > 0 && (
      <div className="mt-6 pt-6 border-t" style={{ borderColor: customColors?.borderColor }}>
        {renderPredictions(selectedInsight)}
      </div>
    )}
  </>
)}
    </div>
  );
};

export default CulturalEventAnalytics;