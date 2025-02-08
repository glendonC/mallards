import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { Calendar, Clock, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { CulturalPeriodsData, CulturalPeriod } from '../../types/dashboard';
import { Bar } from 'react-chartjs-2';

interface ActiveCulturalPeriodsProps {
  isFocused?: boolean;
  isPreview?: boolean;
}

interface PeriodData {
  active: CulturalPeriod[];
  upcoming: CulturalPeriod[];
  historical: {
    spending: number[];
    approvals: number[];
    dates: string[];
  };
}

interface RegionalImpact {
  region: string;
  expectedChange: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CulturalGroupData {
  groupId: string;
  name: string;
  metrics: {
    approvalRate: number;
    transactionVolume: number;
    averageAmount: number;
  };
  patterns: {
    temporalPreferences: string[];
    categoryPreferences: string[];
  };
}

const ActiveCulturalPeriods: React.FC<ActiveCulturalPeriodsProps> = ({ 
  isFocused = false,
  isPreview = false 
}) => {
  const { customColors } = useTheme();
  const { columnMapping, getProcessedData, selectedFocus, selectedModels } = useData();
  const [periodData, setPeriodData] = useState<PeriodData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<CulturalPeriod | null>(null);

  // Add focus-based view configuration
  const getFocusView = (mode: 'pattern' | 'decision' | 'bias') => {
    switch (mode) {
      case 'pattern':
        return {
          primaryMetric: 'spending',
          grouping: 'cultural',
          visualization: 'timeline'
        };
      case 'decision':
        return {
          primaryMetric: 'approvals',
          grouping: 'group',
          visualization: 'comparison'
        };
      case 'bias':
        return {
          primaryMetric: 'disparity',
          grouping: 'region',
          visualization: 'heatmap'
        };
    };
  };

  const getFocusSpecificMetrics = (focus: string, transactions: any[]) => {
    switch (focus) {
      case 'pattern':
        return ['Volume Trend', 'Category Distribution'];
      case 'decision':
        return ['Approval Rate', 'Decision Volume'];
      case 'bias':
        return ['Regional Balance', 'Approval Distribution'];
      default:
        return ['Transaction Volume', 'Pattern Strength'];
    }
  };
  
  // Enhanced period detection
  const analyzeCulturalPeriods = (data: any[]): PeriodData => {
  
    const transactions = data
      .map(tx => ({
        date: new Date(tx.transactionDate),
        amount: parseFloat(tx.amount),
        type: tx.transactionType,
        approved: tx.approvalStatus?.toLowerCase() === 'approved',
        region: tx.region
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  
    // Group by date for volume analysis
    const dailyVolumes = new Map<string, number>();
    transactions.forEach(tx => {
      const dateKey = tx.date.toISOString().split('T')[0];
      dailyVolumes.set(dateKey, (dailyVolumes.get(dateKey) || 0) + tx.amount);
    });
  
    // Calculate rolling average and standard deviation
    const values = Array.from(dailyVolumes.values());
    const windowSize = 7; // 7-day rolling window
    const periods: CulturalPeriod[] = [];
    
    // Look for periods of high activity
    Array.from(dailyVolumes.entries()).forEach(([dateStr, volume], index) => {
      if (index < windowSize) return;
  
      // Calculate rolling stats
      const windowValues = values.slice(index - windowSize, index);
      const mean = windowValues.reduce((sum, v) => sum + v, 0) / windowSize;
      const stdDev = Math.sqrt(
        windowValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / windowSize
      );
  
      // Detect significant deviation (2 standard deviations)
      const isSignificant = volume > mean + (1.5 * stdDev);
      
      if (isSignificant) {
        // Find consecutive days of high activity
        let endIndex = index;
        while (endIndex < values.length && values[endIndex] > mean + stdDev) {
          endIndex++;
        }
  
        const dates = Array.from(dailyVolumes.keys());

        const getImpactDescription = (changePercent: number) => {
          if (changePercent > 500) return 'Extraordinary spike in transaction activity';
          if (changePercent > 200) return 'Major surge in transaction volume';
          if (changePercent > 100) return 'Significant increase in activity';
          return 'Notable increase in transaction activity';
        };

        const patternChanges = [
          {
            metric: 'Volume',
            change: ((volume - mean) / mean) * 100,
            direction: 'increase'
          }
        ];

        if (columnMapping.transactionType) {
          const typeDistribution = transactions
            .filter(tx => tx.date >= new Date(dateStr) && tx.date <= new Date(dates[endIndex]))
            .reduce((acc, tx) => {
              acc[tx.type] = (acc[tx.type] || 0) + tx.amount;
              return acc;
            }, {} as Record<string, number>);
        
          patternChanges.push({
            metric: 'Transaction Types',
            change: Object.keys(typeDistribution).length,
            direction: 'varied'
          });
        }

        periods.push({
          id: `period-${periods.length + 1}`,
          name: `Activity Spike ${new Date(dateStr).toLocaleDateString('en-US', { month: 'short' })}`,
          description: getImpactDescription(((volume - mean) / mean) * 100),
          type: volume > mean + (2.5 * stdDev) ? 'religious' : 'community',
          startDate: dateStr,
          endDate: dates[Math.min(endIndex, dates.length - 1)],
          impact: {
            level: volume > mean + (2 * stdDev) ? 'high' : 'medium',
            expectedChange: ((volume - mean) / mean) * 100,
            affectedMetrics: getFocusSpecificMetrics(selectedFocus || 'pattern', transactions)
          },
          patternChanges: [
            {
              metric: 'Volume',
              change: ((volume - mean) / mean) * 100,
              direction: 'increase'
            }
          ]          
        });

        // Skip processed days
        index = endIndex;
      }
    });
  
  // At the end, separate periods into active and historical
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

  // Consider a period "active" if it's within the last 14 days
  const active = periods.filter(p => {
    const endDate = new Date(p.endDate);
    return endDate >= fourteenDaysAgo;
  });

  return {
    active: active,
    upcoming: [],  // We can add upcoming detection later
    historical: {
      spending: Array.from(dailyVolumes.values()),
      approvals: Array.from(dailyVolumes.entries()).map(([_, value]) => value > 0 ? 1 : 0),
      dates: Array.from(dailyVolumes.keys())
    }
  };
  };

  useEffect(() => {

    if (!columnMapping.transactionDate || !columnMapping.amount) {
      console.log('Missing required fields');
      return;
    }
  
    const processedData = getProcessedData();
  
    if (!processedData.length) {
      console.log('No processed data');
      return;
    }
  
    // Process the data to identify cultural periods
    const periods = analyzeCulturalPeriods(processedData);
    setPeriodData(periods);
  }, [columnMapping, getProcessedData, selectedFocus, selectedModels]);

  const getImpactColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
    }
  };

  const renderEventCard = (period: CulturalPeriod) => (
    <div
      key={period.id}
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        selectedPeriod?.id === period.id ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{ 
        backgroundColor: customColors?.tileColor,
        borderColor: customColors?.borderColor
      }}
      onClick={() => setSelectedPeriod(period)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium" style={{ color: customColors?.textColor }}>
            {period.name}
          </h4>
          <div className="flex items-center gap-2 text-sm opacity-75">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-sm ${getImpactColor(period.impact.level)}`}>
          {period.impact.level.toUpperCase()}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>Expected change: {period.impact.expectedChange}%</span>
        </div>
        {period.impact.affectedMetrics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {period.impact.affectedMetrics.map(metric => (
              <span
                key={metric}
                className="px-2 py-1 rounded-full text-xs"
                style={{ 
                  backgroundColor: `${customColors?.backgroundColor}40`,
                  color: customColors?.textColor
                }}
              >
                {metric}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPatternChart = () => {
    if (!selectedPeriod) return null;

    const chartData = {
      labels: selectedPeriod.patternChanges.map(p => p.metric),
      datasets: [{
        label: 'Expected Change',
        data: selectedPeriod.patternChanges.map(p => p.change),
        backgroundColor: selectedPeriod.patternChanges.map(p => 
          p.direction === 'increase' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        ),
        borderColor: selectedPeriod.patternChanges.map(p => 
          p.direction === 'increase' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1
      }]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          display: false
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

    return (
      <div className="h-48">
        <Bar data={chartData} options={options} />
      </div>
    );
  };

  // Add getPredictions function
  const getPredictions = (period: CulturalPeriod) => {
    switch (selectedFocus) {
      case 'pattern':
        return {
          title: 'Spending Predictions',
          metrics: [
            { label: 'Volume Change', value: `${period.impact.expectedChange}%` },
            { label: 'Category Impact', value: period.patternChanges.map(p => p.metric).join(', ') }
          ]
        };
      case 'decision':
        return {
          title: 'Approval Predictions',
          metrics: [
            { label: 'Approval Rate Change', value: `${period.impact.expectedChange}%` },
            { label: 'Decision Volume', value: period.patternChanges[0]?.change || 0 }
          ]
        };
      case 'bias':
        return {
          title: 'Regional Impact',
          metrics: [
            { label: 'Regional Variation', value: `${period.impact.expectedChange}%` },
            { label: 'Risk Level', value: period.impact.level }
          ]
        };
      default:
        return {
          title: 'Impact Predictions',
          metrics: [
            { label: 'Expected Change', value: `${period.impact.expectedChange}%` },
            { label: 'Impact Level', value: period.impact.level }
          ]
        };
    }
  };

  const renderRegionalImpact = (period: CulturalPeriod) => {
    if (!period.regionalImpact?.length) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
          Regional Impact
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {period.regionalImpact.map((impact) => (
            <div 
              key={impact.region}
              className={`p-2 rounded bg-opacity-10`}
              style={{ 
                backgroundColor: `${customColors?.backgroundColor}20`,
                borderLeft: `3px solid ${
                  impact.riskLevel === 'high' ? '#ef4444' :
                  impact.riskLevel === 'medium' ? '#f59e0b' :
                  '#10b981'
                }`
              }}
            >
              <div className="font-medium" style={{ color: customColors?.textColor }}>
                {impact.region}
              </div>
              <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                Expected Change: {impact.expectedChange}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!periodData) {
    return (
      <div className="p-6 text-center" style={{ color: customColors?.textColor }}>
        <p className="text-lg">No cultural period data available</p>
        <p className="text-sm opacity-75">
          {!columnMapping.transactionDate || !columnMapping.amount 
            ? "Missing required fields: Transaction Date and Amount"
            : "Processing data..."}
        </p>
      </div>
    );
  }

  if (isPreview) {
    // Render a simplified preview version
    return (
      <div className="p-4">
        <div className="space-y-4">
          {/* Show only the most important active period */}
          {periodData.active[0] && (
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="font-medium">{periodData.active[0].name}</span>
              <span className="text-sm text-gray-500">
                Impact: {periodData.active[0].impact.level}
              </span>
            </div>
          )}
          
          {/* Show summary stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Active Events</p>
              <p className="font-medium">{periodData.active.length}</p>
            </div>
            <div>
              <p className="text-gray-500">Upcoming</p>
              <p className="font-medium">{periodData.upcoming.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the full detailed version for the modal
  return (
    <div className="p-6 space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold" style={{ color: customColors?.textColor }}>
          Cultural Periods
        </h3>
      </div>

      {/* View Content */}
      <div className="space-y-6">
        <div className="space-y-4">
          {periodData.active.map(renderEventCard)}
        </div>
      </div>

      {/* Selected Period Details */}
      {selectedPeriod && (
        <div className="mt-6 p-4 rounded-lg border" style={{ 
          backgroundColor: customColors?.tileColor,
          borderColor: customColors?.borderColor
        }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-medium" style={{ color: customColors?.textColor }}>
                {selectedPeriod.name}
              </h4>
              <p className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                {selectedPeriod.description}
              </p>
            </div>
            <div className={`px-2 py-1 rounded text-sm ${getImpactColor(selectedPeriod.impact.level)}`}>
              {selectedPeriod.impact.level.toUpperCase()}
            </div>
          </div>

          {/* Focus-based Predictions */}
          <div className="mt-4">
            <h5 className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
              {getPredictions(selectedPeriod).title}
            </h5>
            <div className="grid grid-cols-2 gap-4">
              {getPredictions(selectedPeriod).metrics.map((metric, index) => (
                <div key={index} className="bg-opacity-10 rounded p-2" style={{ 
                  backgroundColor: `${customColors?.backgroundColor}20`
                }}>
                  <div className="text-xs opacity-75" style={{ color: customColors?.textColor }}>
                    {metric.label}
                  </div>
                  <div className="font-medium" style={{ color: customColors?.textColor }}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Regional Impact section before Pattern Changes */}
          {selectedFocus === 'bias' && renderRegionalImpact(selectedPeriod)}
          
          {/* Pattern Changes Chart */}
          <div className="mt-4">
            <h5 className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
              Pattern Changes
            </h5>
            {renderPatternChart()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveCulturalPeriods; 