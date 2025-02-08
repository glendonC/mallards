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
  focusMode = 'pattern',
  isLoading = false,
  error = null
}) => {
  const { customColors } = useTheme();
  const [selectedInsight, setSelectedInsight] = useState<EventInsight | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([new Date().getFullYear()]));

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

  const renderGroupedEvents = () => {
    // Group by year first, then quarter
    const groupedByYear = data.insights.reduce((years, event) => {
      const date = new Date(event.period.start);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      
      if (!years[year]) {
        years[year] = {
          quarters: {},
          totalEvents: 0
        };
      }
      
      if (!years[year].quarters[quarter]) {
        years[year].quarters[quarter] = [];
      }
      
      years[year].quarters[quarter].push(event);
      years[year].totalEvents++;
      
      return years;
    }, {} as Record<number, { quarters: Record<number, EventInsight[]>, totalEvents: number }>);

    return Object.entries(groupedByYear)
      .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
      .map(([year, yearData]) => (
        <div key={year} className="mb-8">
          <button
            className="w-full flex items-center justify-between text-lg font-medium mb-4"
            onClick={() => setExpandedYears(prev => {
              const newSet = new Set(prev);
              if (prev.has(Number(year))) {
                newSet.delete(Number(year));
              } else {
                newSet.add(Number(year));
              }
              return newSet;
            })}
          >
            <span>{year} ({yearData.totalEvents} events)</span>
            <ArrowRight className={`w-5 h-5 transform transition-transform ${
              expandedYears.has(Number(year)) ? 'rotate-90' : ''
            }`} />
          </button>

          {expandedYears.has(Number(year)) && (
            <div className="space-y-6 pl-4">
              {Object.entries(yearData.quarters)
                .sort(([qA], [qB]) => Number(qB) - Number(qA))
                .map(([quarter, events]) => (
                  <div key={`${year}-Q${quarter}`} className="border-l-2 pl-4" style={{ borderColor: customColors?.borderColor }}>
                    <h4 className="text-sm font-medium mb-3" style={{ color: customColors?.textColor }}>
                      Q{quarter} {year} ({events.length} events)
                    </h4>
                    <div className="space-y-4">
                      {events
                        .sort((a, b) => Math.abs(b.metrics.averageIncrease) - Math.abs(a.metrics.averageIncrease))
                        .slice(0, expandedMonths.has(`${year}-Q${quarter}`) ? undefined : 3)
                        .map(event => renderInsightCard(event))}
                      {events.length > 3 && (
                        <button 
                          className="text-sm text-blue-500 hover:underline w-full text-center py-2"
                          onClick={() => setExpandedMonths(prev => {
                            const newSet = new Set(prev);
                            if (prev.has(`${year}-Q${quarter}`)) {
                              newSet.delete(`${year}-Q${quarter}`);
                            } else {
                              newSet.add(`${year}-Q${quarter}`);
                            }
                            return newSet;
                          })}
                        >
                          {expandedMonths.has(`${year}-Q${quarter}`) 
                            ? '← Show less' 
                            : `Show ${events.length - 3} more events →`}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ));
  };

  const renderLineChart = () => {
    
    // Find where forecast begins
    const forecastStartIndex = data.timelineData.findIndex(d => d.forecast !== undefined);
    
    const chartData: ChartData<'line'> = {
      labels: data.timelineData.map(d => new Date(d.timestamp).toLocaleDateString()),
      // Historical Values with dynamic label
      datasets: [
        {
          label: focusMode === 'pattern' ? 'Transaction Volume' :
          focusMode === 'decision' ? 'Approval Rate' :
          'Bias Score',
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
      <div className="p-4 flex flex-col h-full">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-base">
              {focusMode === 'pattern' ? 'Volume Patterns' :
              focusMode === 'decision' ? 'Decision Patterns' :
              'Bias Patterns'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className={`text-sm ${data.summary.averageImpact > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.summary.averageImpact > 0 ? '+' : ''}{data.summary.averageImpact.toFixed(1)}% Impact
              </span>
            </div>
            {data.summary.forecastConfidence && (
              <div className="flex items-center gap-1">
                <Brain className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-indigo-500">
                  {data.summary.forecastConfidence}% Confidence
                </span>
              </div>
            )}
          </div>
        </div>
  
        {/* Enhanced Chart */}
        <div className="flex-1 min-h-[140px]">
          <Line
            data={{
              labels: data.timelineData.map(d => new Date(d.timestamp).toLocaleDateString()),
              datasets: [
                {
                  label: 'Historical',
                  data: data.timelineData.map((d, i) => 
                    d.forecast ? null : d.value
                  ),
                  borderColor: 'rgba(59, 130, 246, 0.8)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: false,
                  tension: 0.4,
                  pointRadius: 0
                },
                {
                  label: 'Forecast',
                  data: data.timelineData.map((d) => d.forecast || null),
                  borderColor: 'rgba(99, 102, 241, 0.8)',
                  borderDash: [5, 5],
                  fill: false,
                  tension: 0.4,
                  pointRadius: 0
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
                y: { 
                  display: true,
                  grid: {
                    color: 'rgba(0,0,0,0.05)',
                    display: false
                  },
                  ticks: {
                    display: false
                  }
                }
              }
            }}
          />
        </div>
  
        {/* Latest Event Preview */}
        {data.insights[0] && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-sm">{data.insights[0].eventName}</span>
              <span className={`text-sm font-medium ${
                data.insights[0].metrics.averageIncrease > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data.insights[0].metrics.averageIncrease > 0 ? '+' : ''}
                {data.insights[0].metrics.averageIncrease.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(data.insights[0].period.start).toLocaleDateString()} - {new Date(data.insights[0].period.end).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    );
  }

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
            {(() => {
              let value: number | undefined;
              
              switch (focusMode) {
                case 'pattern':
                  value = insight.metrics.volumeChange ?? insight.metrics.averageIncrease;
                  break;
                case 'decision':
                  value = insight.metrics.approvalChange ?? insight.metrics.averageIncrease;
                  break;
                case 'bias':
                  value = insight.metrics.biasReduction ?? insight.metrics.averageIncrease;
                  break;
                default:
                  value = insight.metrics.averageIncrease;
              }

              return value !== undefined ? 
                `${value > 0 ? '+' : ''}${value.toFixed(1)}%` : 
                'N/A';
            })()}
        </div>
      </div>
        
      <div className="space-y-2 mt-4">
        {insight.patterns.map((pattern, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="capitalize">{pattern.phase}</span>
            <div className="flex items-center gap-2">
              <span className={pattern.change > 0 ? 'text-green-500' : 'text-red-500'}>
                {pattern.change > 0 ? '+' : ''}{pattern.change.toFixed(1)}%
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
        
      {/* Show recommendations inline when selected */}
      {selectedInsight?.id === insight.id && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: customColors?.borderColor }}>
          <div className="text-sm font-medium mb-2">Recommendations</div>
          <div className="space-y-2">
            {insight.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-4 h-4 mt-1 text-blue-500" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 overflow-y-auto max-h-[calc(100vh-100px)]"> {/* Add overflow and max height */}
      {/* Summary Metrics */}
      <div className="flex items-center gap-4 text-sm mb-6">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {data.summary.totalEvents} {
            focusMode === 'pattern' ? 'Volume Events' :
            focusMode === 'decision' ? 'Decision Events' :
            'Bias Events'
          }
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          {focusMode === 'pattern' ? 'Volume Impact' :
          focusMode === 'decision' ? 'Decision Impact' :
          'Bias Reduction'}: {data.summary.averageImpact}%
        </span>
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

      {/* Chart */}
      {renderLineChart()}

      {/* Grouped Events */}
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-4" style={{ color: customColors?.textColor }}>
          Event Insights
        </h4>
        {renderGroupedEvents()}
      </div>
    </div>
  );
};

export default CulturalEventAnalytics;