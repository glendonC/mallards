import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CulturalViolation } from '../../types/anomaly';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData } from 'chart.js';
import { CulturalPeriod } from '@/types/dashboard';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  data: CulturalViolation[];
  timeRange: '24h' | '7d' | '30d' | 'all';
  onTimeRangeChange: (range: '24h' | '7d' | '30d' | 'all') => void;
  isLoading?: boolean;
}

const CulturalPatternViolations: React.FC<Props> = ({
  data,
  timeRange,
  onTimeRangeChange,
  isLoading = false
}) => {
  const { customColors } = useTheme();
  const [selectedViolation, setSelectedViolation] = useState<CulturalViolation | null>(null);

  // Move this function before it's used
  const isDateInPeriod = (date: Date, period: {
    startDate: string;
    endDate: string;
  }) => {
    const dateTime = date.getTime();
    const startTime = new Date(period.startDate).getTime();
    const endTime = new Date(period.endDate).getTime();
    return dateTime >= startTime && dateTime <= endTime;
  };

  const chartData: ChartData<'line'> = {
    labels: data.map(d => new Date(d.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Actual Pattern',
        data: data.map(d => d.impactScore),
        borderColor: String(customColors?.primary) || '#3b82f6',
        tension: 0.4,
        fill: false,
        pointBackgroundColor: data.map(d => 
          d.severity === 'high' ? '#ef4444' : 
          d.severity === 'medium' ? '#f59e0b' : '#10b981'
        )
      },
      {
        label: 'Expected Pattern',
        data: data.map(d => {
          // Calculate expected value based on cultural period
          const period = d.culturalPeriod;
          if (isDateInPeriod(new Date(d.timestamp), period)) {
            return d.metrics.find(m => m.metric === d.category)?.expectedValue || d.impactScore;
          }
          return d.impactScore;
        }),
        borderColor: 'rgba(156, 163, 175, 0.8)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false
      },
      {
        label: 'Deviation Zone',
        data: data.map(d => {
          const metric = d.metrics.find(m => m.metric === d.category);
          return metric ? metric.expectedValue + (metric.deviation * 0.5) : null;
        }),
        borderColor: 'rgba(239, 68, 68, 0.1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: 1,
        pointRadius: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const violation = data[context.dataIndex];
            const period = violation.culturalPeriod;
            return [
              `Score: ${violation.impactScore}`,
              `Cultural Period: ${period.name}`,
              `Significance: ${(period.significance * 100).toFixed(0)}%`,
              `Expected: ${violation.expectedPattern}`,
              `Actual: ${violation.actualPattern}`
            ];
          }
        }
      },
      // Add custom background zones for cultural periods
      customBackgrounds: {
        id: 'customBackgrounds',
        beforeDraw: (chart: any) => {
          const { ctx, chartArea, scales } = chart;
          const periods = data.map(d => d.culturalPeriod).filter((p, i, arr) => 
            arr.findIndex(t => t.name === p.name) === i
          );

          periods.forEach(period => {
            const startX = scales.x.getPixelForValue(new Date(period.startDate));
            const endX = scales.x.getPixelForValue(new Date(period.endDate));
            
            // Draw period background
            ctx.save();
            ctx.fillStyle = `rgba(66, 153, 225, ${period.significance * 0.1})`;
            ctx.fillRect(
              Math.max(startX, chartArea.left),
              chartArea.top,
              Math.min(endX - startX, chartArea.right - startX),
              chartArea.height
            );

            // Draw period label
            ctx.fillStyle = customColors?.textColor || '#000';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
              period.name,
              startX + (endX - startX) / 2,
              chartArea.top + 20
            );
            ctx.restore();
          });
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: customColors?.borderColor || '#e2e8f0'
        }
      }
    }
  };

  // Add pattern comparison section below chart
  const renderPatternComparison = (violation: CulturalViolation) => (
    <div className="mt-4 p-4 rounded-lg bg-opacity-5" style={{ backgroundColor: customColors?.backgroundColor }}>
      <h4 className="text-sm font-medium mb-2">Pattern Analysis</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs opacity-75 mb-1">Expected Pattern</div>
          <div className="text-sm">{violation.expectedPattern}</div>
          {violation.culturalPeriod.expectedPatterns.map((pattern, index) => (
            <div key={index} className="mt-1 text-xs opacity-75">
              • {pattern.description}
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs opacity-75 mb-1">Actual Pattern</div>
          <div className="text-sm">{violation.actualPattern}</div>
          <div className="mt-1 text-xs">
            <span className={`font-medium ${
              violation.trendIndicator === 'increasing' ? 'text-green-500' :
              violation.trendIndicator === 'decreasing' ? 'text-red-500' :
              'text-yellow-500'
            }`}>
              {violation.trendIndicator === 'increasing' ? '↑' :
               violation.trendIndicator === 'decreasing' ? '↓' : '→'} 
              {violation.trendIndicator}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Add new severity visualization component
  const renderSeverityDetails = (violation: CulturalViolation) => (
    <div className="mt-4 p-4 rounded-lg border border-opacity-10" style={{ borderColor: customColors?.borderColor }}>
      <h4 className="text-sm font-medium mb-3">Severity Analysis</h4>
      
      {/* Overall Score */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm">Overall Impact</span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 rounded-full bg-gray-200">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${violation.impactScore}%`,
                backgroundColor: 
                  violation.severity === 'high' ? '#ef4444' :
                  violation.severity === 'medium' ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
          <span className="text-sm font-medium">{violation.impactScore}%</span>
        </div>
      </div>

      {/* Metric Impacts */}
      <div className="space-y-3">
        {violation.metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs opacity-75 capitalize">{metric.metric}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className={metric.deviation > 0 ? 'text-red-500' : 'text-green-500'}>
                  {metric.deviation > 0 ? '↑' : '↓'} {Math.abs(metric.deviation).toFixed(1)}%
                </span>
                <span className="text-xs opacity-75">
                  from expected {metric.expectedValue.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="w-24 h-1.5 rounded-full bg-gray-200">
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${Math.min(Math.abs(metric.deviation) * 2, 100)}%`,
                  backgroundColor: metric.deviation > 0 ? '#ef4444' : '#10b981'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Confidence Score */}
      <div className="mt-4 pt-4 border-t border-opacity-10" style={{ borderColor: customColors?.borderColor }}>
        <div className="flex items-center justify-between text-sm">
          <span>Detection Confidence</span>
          <span className="font-medium">{violation.confidenceScore}%</span>
        </div>
        <div className="mt-2 text-xs opacity-75">
          Based on {violation.metrics.length} metrics and historical patterns
        </div>
      </div>
    </div>
  );

  // Add pattern classification components
  const renderPatternClassification = (violations: CulturalViolation[]) => {
    // Group violations by category
    const groupedViolations = violations.reduce((acc, violation) => {
      if (!acc[violation.category]) {
        acc[violation.category] = [];
      }
      acc[violation.category].push(violation);
      return acc;
    }, {} as Record<string, CulturalViolation[]>);

    // Calculate trend for each category
    const categoryTrends = Object.entries(groupedViolations).map(([category, items]) => ({
      category,
      count: items.length,
      severity: calculateCategorySeverity(items),
      trend: calculateCategoryTrend(items),
      relatedPatterns: findRelatedPatterns(items)
    }));

    return (
      <div className="mt-6 p-4 rounded-lg border border-opacity-10" style={{ borderColor: customColors?.borderColor }}>
        <h4 className="text-sm font-medium mb-4">Pattern Classification</h4>
        
        <div className="grid gap-4">
          {categoryTrends.map(({ category, count, severity, trend, relatedPatterns }) => (
            <div 
              key={category}
              className="p-3 rounded"
              style={{ backgroundColor: `${customColors?.backgroundColor}20` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{category}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    backgroundColor: severity === 'high' ? '#fee2e2' : 
                                   severity === 'medium' ? '#fef3c7' : '#dcfce7',
                    color: severity === 'high' ? '#ef4444' :
                           severity === 'medium' ? '#f59e0b' : '#10b981'
                  }}>
                    {count} violations
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className={
                    trend > 0 ? 'text-red-500' :
                    trend < 0 ? 'text-green-500' : 'text-gray-500'
                  }>
                    {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
                    {Math.abs(trend)}%
                  </span>
                  <span className="opacity-75">30d trend</span>
                </div>
              </div>

              {/* Related Patterns */}
              {relatedPatterns.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs opacity-75 mb-1">Related Patterns:</div>
                  <div className="flex flex-wrap gap-2">
                    {relatedPatterns.map((pattern, index) => (
                      <span 
                        key={index}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${customColors?.backgroundColor}40`,
                          color: customColors?.textColor
                        }}
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper functions for pattern classification
  const calculateCategorySeverity = (violations: CulturalViolation[]): 'high' | 'medium' | 'low' => {
    const severityScores = {
      high: 3,
      medium: 2,
      low: 1
    };
    
    const avgScore = violations.reduce((sum, v) => sum + severityScores[v.severity], 0) / violations.length;
    return avgScore > 2.5 ? 'high' : avgScore > 1.5 ? 'medium' : 'low';
  };

  const calculateCategoryTrend = (violations: CulturalViolation[]): number => {
    const recentViolations = violations.filter(v => {
      const date = new Date(v.timestamp);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    });

    return recentViolations.reduce((acc, v) => {
      if (v.trendIndicator === 'increasing') return acc + 1;
      if (v.trendIndicator === 'decreasing') return acc - 1;
      return acc;
    }, 0) / recentViolations.length * 100;
  };

  const findRelatedPatterns = (violations: CulturalViolation[]): string[] => {
    const patterns = new Set<string>();
    violations.forEach(v => {
      v.culturalPeriod.expectedPatterns.forEach(p => {
        patterns.add(p.type);
      });
    });
    return Array.from(patterns);
  };

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: customColors?.tileColor }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium mb-1" style={{ color: customColors?.textColor }}>
            Cultural Pattern Violations
          </h3>
          <div className="flex items-center gap-2 text-sm opacity-75" style={{ color: customColors?.textColor }}>
            <AlertCircle className="w-4 h-4" />
            <span>{data.length} violations detected</span>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as '24h' | '7d' | '30d' | 'all')}
          className="px-2 py-1 rounded border text-sm"
          style={{ 
            borderColor: customColors?.borderColor,
            backgroundColor: customColors?.backgroundColor,
            color: customColors?.textColor
          }}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
              Loading data...
            </span>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Add Pattern Classification */}
      {data.length > 0 && renderPatternClassification(data)}

      {/* Alerts List */}
      <div className="space-y-2">
        {data.slice(0, 5).map((violation) => (
          <div key={violation.id}>
            <div
              className="p-3 rounded-lg cursor-pointer hover:bg-opacity-50 transition-colors"
              style={{ 
                backgroundColor: `${customColors?.backgroundColor}20`,
                borderLeft: `4px solid ${
                  violation.severity === 'high' ? '#ef4444' :
                  violation.severity === 'medium' ? '#f59e0b' : '#10b981'
                }`
              }}
              onClick={() => {
                setSelectedViolation(prev => 
                  prev?.id === violation.id ? null : violation
                );
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium mb-1" style={{ color: customColors?.textColor }}>
                    {violation.culturalContext}
                  </div>
                  <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                    {violation.expectedPattern}
                  </div>
                </div>
                <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                  {new Date(violation.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Details section inside the map */}
            {selectedViolation?.id === violation.id && (
              <div className="mt-4">
                {renderPatternComparison(violation)}
                {renderSeverityDetails(violation)}
              </div>
            )}
          </div>
        ))}
      </div>

      
    </div>
  );
};

export default CulturalPatternViolations; 