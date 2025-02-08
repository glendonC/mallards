import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { Line } from 'react-chartjs-2';
import { ArrowUp, ArrowDown, Calendar, Users, Heart, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData } from 'chart.js';

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

// Types
interface ProcessedTransaction {
  date: Date;
  amount: number;
  type: string;
  approved?: boolean;
  region?: string;
}

interface AlignmentMetrics {
  score: number;
  factors: {
    temporal: number;   // Time-based patterns
    regional: number;   // Geographic distribution
    categorical: number; // Transaction type patterns
  };
}

interface HistoricalEntry {
  timestamp: string;
  metrics: AlignmentMetrics;
  volume: number;
  approvalRate?: number;
}

interface AlignmentEvent {
  id: string;
  startDate: string;
  endDate: string;
  type: 'volume' | 'pattern' | 'decision';
  status: 'active' | 'upcoming' | 'past';
  intensity: number;
  metrics: {
    before: number;
    during: number;
    after?: number;
  };
}

interface Props {
  showFactors?: boolean;
  isPreview?: boolean;
  isFocused?: boolean;
}

interface FocusVisualization {
  title: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  color: string;
  thresholds: {
    warning: number;
    critical: number;
  };
}

const CulturalAlignmentScore: React.FC<Props> = ({ 
  showFactors = false,
  isPreview = false,
  isFocused = false
}) => {
  // Hooks
  const { customColors } = useTheme();
  const { 
    columnMapping, 
    getProcessedData, 
    selectedModels, 
    selectedFocus,
    detectionRules 
  } = useData();

  // State
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [alignmentData, setAlignmentData] = useState<{
    current: AlignmentMetrics;
    history: HistoricalEntry[];
    events: AlignmentEvent[];
    trend: number;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AlignmentEvent | null>(null);

  // Focus-based configuration
  const getFocusConfig = (): FocusVisualization => {
    switch (selectedFocus) {
      case 'pattern':
        return {
          title: 'Pattern Alignment',
          primaryMetric: 'Pattern Strength',
          secondaryMetrics: ['Temporal', 'Category'],
          color: '#3b82f6',
          thresholds: {
            warning: detectionRules.threshold * 0.8,
            critical: detectionRules.threshold
          }
        };
      case 'decision':
        return {
          title: 'Decision Alignment',
          primaryMetric: 'Approval Balance',
          secondaryMetrics: ['Regional', 'Temporal'],
          color: '#10b981',
          thresholds: {
            warning: detectionRules.alertThreshold * 0.9,
            critical: detectionRules.alertThreshold
          }
        };
      case 'bias':
        return {
          title: 'Regional Fairness',
          primaryMetric: 'Equity Score',
          secondaryMetrics: ['Regional', 'Category'],
          color: '#8b5cf6',
          thresholds: {
            warning: detectionRules.threshold * 0.85,
            critical: detectionRules.threshold
          }
        };
      default:
        return {
          title: 'Overall Alignment',
          primaryMetric: 'Alignment Score',
          secondaryMetrics: ['Temporal', 'Regional'],
          color: '#6b7280',
          thresholds: {
            warning: 70,
            critical: 85
          }
        };
    }
  };

  // Data Processing Functions
  const processTransactions = (rawData: any[]): ProcessedTransaction[] => {
    // The data should already be mapped to our standard field names by DataContext
    const processed = rawData
      .filter(entry => {
        // Access the fields directly since they're already mapped
        const date = entry.transactionDate;
        const amount = entry.amount;
        return date && amount && !isNaN(parseFloat(amount));
      })
      .map(entry => {
        try {
          const processedEntry = {
            date: new Date(entry.transactionDate),
            amount: parseFloat(entry.amount),
            type: entry.transactionType || 'unknown',
            approved: entry.approvalStatus?.toLowerCase() === 'approved',
            region: entry.region
          };
          return processedEntry;
        } catch (error) {
          console.error('Error processing entry:', error, entry);
          return null;
        }
      })
      .filter(entry => entry !== null) // Remove any failed entries
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  
    return processed;
  };

  const calculateTimeWindowMetrics = (
    transactions: ProcessedTransaction[],
    startDate: Date,
    endDate: Date
  ): AlignmentMetrics => {
    const windowTransactions = transactions.filter(
      tx => tx.date >= startDate && tx.date <= endDate
    );

    // 1. Calculate temporal patterns
    const temporalScore = calculateTemporalPatterns(windowTransactions);

    // 2. Calculate regional patterns if region data available
    const regionalScore = columnMapping.region 
      ? calculateRegionalPatterns(windowTransactions)
      : 100; // Default score if no regional data

    // 3. Calculate categorical patterns if type data available
    const categoricalScore = columnMapping.transactionType
      ? calculateCategoryPatterns(windowTransactions)
      : 100; // Default score if no type data

    return {
      score: (temporalScore + regionalScore + categoricalScore) / 3,
      factors: {
        temporal: temporalScore,
        regional: regionalScore,
        categorical: categoricalScore
      }
    };
  };

  // Pattern Detection Functions
  const calculateTemporalPatterns = (transactions: ProcessedTransaction[]): number => {
    if (transactions.length < 2) return 100;
  
    // Group by hour of day and day of week
    const hourlyDistribution = new Array(24).fill(0);
    const dailyDistribution = new Array(7).fill(0);
    
    transactions.forEach(tx => {
      hourlyDistribution[tx.date.getHours()]++;
      dailyDistribution[tx.date.getDay()]++;
    });
  
    // Calculate distribution evenness (higher variance = lower score)
    const hourlyVariance = calculateVariance(hourlyDistribution);
    const dailyVariance = calculateVariance(dailyDistribution);
  
    // Convert to a 0-100 score (lower variance = higher score)
    // Add bounds to ensure score stays between 0 and 100
    const score = Math.max(0, Math.min(100, 100 - (hourlyVariance + dailyVariance)));
    return score;
  };

  const calculateRegionalPatterns = (transactions: ProcessedTransaction[]): number => {
    if (!columnMapping.region) return 100;

    // Group by region
    const regionalVolumes = transactions.reduce((acc, tx) => {
      if (tx.region) {
        acc[tx.region] = (acc[tx.region] || 0) + tx.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate distribution evenness
    const volumes = Object.values(regionalVolumes);
    const variance = calculateVariance(volumes);

    // Convert to score (lower variance = higher score)
    return 100 - (variance * 100);
  };

  const calculateCategoryPatterns = (transactions: ProcessedTransaction[]): number => {
    if (!columnMapping.transactionType) return 100;

    // Group by type
    const typeVolumes = transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate distribution evenness
    const volumes = Object.values(typeVolumes);
    const variance = calculateVariance(volumes);

    // Convert to score (lower variance = higher score)
    return 100 - (variance * 100);
  };

  // Utility Functions
  const calculateVariance = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    
    // Remove zeros to avoid skewing the variance
    const nonZeroNumbers = numbers.filter(n => n > 0);
    if (nonZeroNumbers.length === 0) return 0;
    
    const mean = nonZeroNumbers.reduce((a, b) => a + b, 0) / nonZeroNumbers.length;
    if (mean === 0) return 0;
    
    const variance = nonZeroNumbers.reduce((sum, n) => sum + Math.pow((n - mean) / mean, 2), 0) / nonZeroNumbers.length;
    
    // Return normalized variance between 0 and 1
    return Math.min(1, variance);
  };

  // Event Detection and Analysis
  const detectEvents = (transactions: ProcessedTransaction[]): AlignmentEvent[] => {
    if (transactions.length < detectionRules.sensitivity * 2) return [];
  
    const events: AlignmentEvent[] = [];
    const windowSize = getTimeWindowSize(timeRange); // Use timeRange instead
    let currentWindow: ProcessedTransaction[] = [];
    let eventStart: Date | null = null;
  
    // Adjust sensitivity based on time range
    const adjustedSensitivity = Math.ceil(detectionRules.sensitivity * 
      (timeRange === 'week' ? 1 : 
       timeRange === 'month' ? 4 : 
       12)); // More data points needed for longer ranges
  
    // Sliding window analysis
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      currentWindow = currentWindow.filter(t => 
        tx.date.getTime() - t.date.getTime() <= windowSize
      );
      currentWindow.push(tx);
  
      if (currentWindow.length < adjustedSensitivity) continue;
  
      const metrics = calculateTimeWindowMetrics(
        currentWindow,
        currentWindow[0].date,
        currentWindow[currentWindow.length - 1].date
      );
  
      // Detect significant pattern changes
      const isSignificant = metrics.score < detectionRules.threshold;
      
      if (isSignificant && !eventStart) {
        eventStart = tx.date;
      } else if (!isSignificant && eventStart) {
        // Event ended, calculate metrics
        const eventTransactions = transactions.filter(t => 
          t.date >= eventStart! && t.date <= tx.date
        );
        
        // Calculate before/during/after metrics using the same time range window
        const beforeStart = new Date(eventStart.getTime() - windowSize);
        const afterEnd = new Date(tx.date.getTime() + windowSize);
        
        const beforeMetrics = calculateTimeWindowMetrics(
          transactions.filter(t => t.date >= beforeStart && t.date < eventStart!),
          beforeStart,
          eventStart!
        );
        
        const duringMetrics = calculateTimeWindowMetrics(
          eventTransactions,
          eventStart!,
          tx.date
        );
        
        const afterMetrics = calculateTimeWindowMetrics(
          transactions.filter(t => t.date > tx.date && t.date <= afterEnd),
          tx.date,
          afterEnd
        );
  
        events.push({
          id: `event-${events.length + 1}`,
          startDate: eventStart.toISOString(),
          endDate: tx.date.toISOString(),
          type: selectedFocus === 'decision' ? 'decision' : 'pattern',
          status: tx.date > new Date() ? 'active' : 'past',
          intensity: Math.abs(100 - duringMetrics.score),
          metrics: {
            before: beforeMetrics.score,
            during: duringMetrics.score,
            after: afterMetrics.score
          }
        });
  
        eventStart = null;
      }
    }
  
    return events;
  };

  const getTimeWindowSize = (selectedRange: 'week' | 'month' | 'quarter'): number => {
    switch (selectedRange) {
      case 'week':
        return 7 * 24 * 60 * 60 * 1000;  // 7 days
      case 'month':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      case 'quarter':
        return 90 * 24 * 60 * 60 * 1000; // 90 days
      default:
        return 30 * 24 * 60 * 60 * 1000; // default to month
    }
  };

  // Data Processing Effect
  useEffect(() => {
    
    // Check required fields
    if (!columnMapping.transactionDate || !columnMapping.amount) {
      console.log('Missing required fields:', { columnMapping });
      return;
    }

    const processedData = getProcessedData();
    const transactions = processTransactions(processedData);

    if (!transactions.length) {
      console.log('No valid transactions after processing');
      return;
    }

    try {
      // Calculate historical metrics using detection rules window
      const windowSize = getTimeWindowSize(timeRange);
      const history: HistoricalEntry[] = [];
      let currentDate = transactions[0].date;
      const endDate = transactions[transactions.length - 1].date;  

      while (currentDate <= endDate) {
        const windowEnd = new Date(currentDate.getTime() + windowSize);
        const windowTransactions = transactions.filter(
          tx => tx.date >= currentDate && tx.date <= windowEnd
        );

        const metrics = calculateTimeWindowMetrics(
          windowTransactions,
          currentDate,
          windowEnd
        );

        history.push({
          timestamp: currentDate.toISOString(),
          metrics,
          volume: windowTransactions.reduce((sum, tx) => sum + tx.amount, 0),
          approvalRate: columnMapping.approvalStatus
            ? windowTransactions.filter(tx => tx.approved).length / windowTransactions.length
            : undefined
        });

        currentDate = new Date(currentDate.getTime() + windowSize);
      }

      // Detect events
      const events = detectEvents(transactions);

      // Calculate trend
      const currentScore = history[history.length - 1].metrics.score;
      const previousScore = history[history.length - 2]?.metrics.score ?? currentScore;
      const trend = ((currentScore - previousScore) / previousScore) * 100;

      setAlignmentData({
        current: history[history.length - 1].metrics,
        history,
        events,
        trend
      });

    } catch (error) {
      console.error('Error in processing effect:', error);
    }
  }, [columnMapping, getProcessedData, selectedModels, selectedFocus, detectionRules, timeRange]);

  // Chart Configuration
  const getChartOptions = (isPreview: boolean = false) => {
    const focusConfig = getFocusConfig();
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: !isPreview
        },
        tooltip: {
          enabled: !isPreview
        }
      },
      scales: {
        y: {
          display: !isPreview,
          beginAtZero: true,
          max: 100,
          min: 0,  // Add this to prevent negative values
          grid: {
            color: `${customColors?.borderColor}40`
          }
        },
        x: {
          display: !isPreview,
          grid: {
            display: false
          }
        }
      }
    };
  };

  // Render Helpers
  const getMetricColor = (value: number): string => {
    const config = getFocusConfig();
    if (value > config.thresholds.critical) return 'text-green-500';
    if (value > config.thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEventLabel = (event: AlignmentEvent): string => {
    const focusConfig = getFocusConfig();
    const intensity = event.intensity;
    const metric = focusConfig.primaryMetric;
    return `${metric} Change (${intensity.toFixed(1)}% deviation)`;
  };

  // Preview Mode Render
  if (isPreview) {
    return (
      <div className="p-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span 
            className={`text-2xl font-bold ${getMetricColor(alignmentData?.current.score ?? 0)}`}
          >
            {alignmentData?.current.score.toFixed(1)}%
          </span>
          {alignmentData?.trend && (
            <div className={`flex items-center gap-1 text-xs ${getMetricColor(alignmentData.trend)}`}>
              {alignmentData.trend >= 0 ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              <span>{Math.abs(alignmentData.trend).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="h-16">
          <Line
            data={{
              labels: alignmentData?.history.map(h => 
                new Date(h.timestamp).toLocaleDateString()
              ) ?? [],
              datasets: [{
                label: getFocusConfig().primaryMetric,
                data: alignmentData?.history.map(h => h.metrics.score) ?? [],
                borderColor: getFocusConfig().color,
                tension: 0.4,
                fill: false
              }]
            }}
            options={getChartOptions(true)}
          />
        </div>

        {alignmentData?.events.some(e => e.status === 'active') && (
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>
              {alignmentData.events.filter(e => e.status === 'active').length} Active Events
            </span>
          </div>
        )}
      </div>
    );
  }

  // Full Mode Render
  if (!alignmentData) {
    return (
      <div className="p-6 text-center" style={{ color: customColors?.textColor }}>
        <p className="text-lg">No alignment data available</p>
        <p className="text-sm opacity-75">Processing data...</p>
        <div className="mt-4 text-left text-xs opacity-75 font-mono">
          Debug Info:
          <pre>
            {JSON.stringify({
              hasMapping: !!(columnMapping.transactionDate && columnMapping.amount),
              dataLength: getProcessedData().length,
              focus: selectedFocus,
              rules: detectionRules
            }, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium mb-1" style={{ color: customColors?.textColor }}>
            {getFocusConfig().title}
          </h3>
          <div className="flex items-baseline gap-3">
            <span 
              className={`text-3xl font-bold ${getMetricColor(alignmentData?.current.score ?? 0)}`}
            >
              {alignmentData?.current.score.toFixed(2)}%
            </span>
            {/* Only show trend if it's non-zero */}
            {alignmentData?.trend !== 0 && (
              <div className={`flex items-center gap-1 ${getMetricColor(alignmentData.trend)}`}>
                {alignmentData.trend >= 0 ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {Math.abs(alignmentData.trend).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
          className="px-2 py-1 rounded border text-sm"
          style={{ 
            borderColor: customColors?.borderColor,
            backgroundColor: customColors?.backgroundColor,
            color: customColors?.textColor
          }}
        >
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
        </select>
      </div>

      <div className="h-64 mb-6">
        <Line
          data={{
            labels: alignmentData?.history.map(h => 
              new Date(h.timestamp).toLocaleDateString()
            ) ?? [],
            datasets: [
              {
                label: getFocusConfig().primaryMetric,
                data: alignmentData?.history.map(h => h.metrics.score) ?? [],
                borderColor: getFocusConfig().color,
                tension: 0.4,
                fill: false
              },
              ...getFocusConfig().secondaryMetrics.map((metric, index) => ({
                label: metric,
                data: alignmentData?.history.map(h => 
                  h.metrics.factors[
                    Object.keys(h.metrics.factors)[index] as keyof typeof h.metrics.factors
                  ]
                ) ?? [],
                borderColor: `${getFocusConfig().color}80`,
                borderDash: [5, 5],
                tension: 0.4,
                fill: false
              }))
            ]
          }}
          options={getChartOptions()}
        />
      </div>

      {(alignmentData && alignmentData.events.length > 0) && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: customColors?.borderColor }}>
          <h4 className="text-sm font-medium mb-3" style={{ color: customColors?.textColor }}>
            Detected Events
          </h4>
          <div className="space-y-2">
            {alignmentData.events.map(event => (
              <div
                key={event.id}
                className="flex items-center gap-2 p-2 rounded"
                style={{ backgroundColor: `${customColors?.backgroundColor}20` }}
              >
                {event.status === 'active' ? (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                <div>
                <div className="text-sm font-medium" style={{ color: customColors?.textColor }}>
                    {getEventLabel(event)}
                  </div>
                  <div className="text-xs opacity-75" style={{ color: customColors?.textColor }}>
                    {new Date(event.startDate).toLocaleDateString()} - 
                    {new Date(event.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="text-xs">
                    Impact:
                    <span className={getMetricColor(event.intensity)}>
                      {' '}{event.intensity.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CulturalAlignmentScore; 