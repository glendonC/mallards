import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { getDecisionImpact } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { CulturalDecisionData } from '../../types/dashboard';
import { Calendar, Filter, TrendingUp, Loader, Brain } from 'lucide-react';
import { Line as ChartJSLine } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend as ChartJSLegend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  ChartJSTooltip,
  ChartJSLegend
);

interface Props {
  data: CulturalDecisionData;
  isPreview?: boolean;
  isFocused?: boolean;
  focusMode?: 'pattern' | 'decision' | 'bias';
}

interface RegionalTrend {
  period: string;
  approvalRate: number;
  volume: number;
  significance: number;
}

interface RegionalVariance {
  region: string;
  baseline: number;
  current: number;
  trend: RegionalTrend[];
  significance: 'high' | 'medium' | 'low';
  statisticalSignificance: {
    pValue: number;
    confidenceInterval: [number, number];
  };
}

const CulturalDecisionImpact: React.FC<Props> = ({ data: initialData, isPreview = false, isFocused = false, focusMode = 'decision' }) => {
  const { customColors } = useTheme();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const { getProcessedData, columnMapping } = useData();
  const [data, setData] = useState<CulturalDecisionData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const processedData = getProcessedData();
        const response = await getDecisionImpact(processedData, columnMapping);
        setData(response);
      } catch (err) {
        console.error("Full error:", err);
        setError(err instanceof Error ? err.message : 'Failed to fetch decision impact data');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [getProcessedData, columnMapping, timeRange]); // Add timeRange dependency

  if (isLoading) {
    return (
      <div className="p-6 rounded-lg min-h-[300px] flex items-center justify-center" style={{ backgroundColor: customColors?.tileColor }}>
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  const getChartConfig = (focusMode: string) => {
    switch (focusMode) {
      case 'pattern':
        return {
          primaryMetric: 'totalAmount',
          secondaryMetric: 'volume',
          chartColors: {
            primary: '#10B981',
            secondary: '#6366F1'
          }
        };
      case 'decision':
        return {
          primaryMetric: 'approvalRate',
          secondaryMetric: 'decisions',
          chartColors: {
            primary: '#3B82F6',
            secondary: '#EF4444'
          }
        };
      case 'bias':
        return {
          primaryMetric: 'regionalDisparity',
          secondaryMetric: 'variance',
          chartColors: {
            primary: '#8B5CF6',
            secondary: '#F59E0B'
          }
        };
      default:
        return {
          primaryMetric: 'approvalRate',
          secondaryMetric: 'volume',
          chartColors: {
            primary: '#10B981',
            secondary: '#6366F1'
          }
        };
    }
  };

  // Then you can use it in your chart configurations
  const chartConfig = getChartConfig(focusMode);

  // Format data for the stacked bar chart
  const chartData = data.timelineData.map(d => ({
    date: new Date(d.date).toLocaleDateString(),
    approvals: d.approvals,
    rejections: d.rejections,
    culturalPeriod: d.culturalPeriod,
    eventName: d.eventName,
    approvalRate: (d.approvals / (d.approvals + d.rejections)) * 100,
    totalAmount: d.totalAmount,
    region: d.region
  }));

  const filterDataByTimeRange = (data: any[]) => {
    const now = new Date();
    const getStartDate = () => {
      switch (timeRange) {
        case 'daily':
          return new Date(now.setDate(now.getDate() - 1));
        case 'weekly':
          return new Date(now.setDate(now.getDate() - 7));
        case 'monthly':
          return new Date(now.setMonth(now.getMonth() - 1));
        default:
          return new Date(now.setDate(now.getDate() - 7));
      }
    };
  
    const startDate = getStartDate();
    return data.filter(d => new Date(d.date) >= startDate);
  };

  // Filter data based on selections
  const filteredData = chartData
  .filter(d => {
    // Time range filter
    const isInTimeRange = filterDataByTimeRange([d]).length > 0;
    
    // Region filter (if applicable)
    const matchesRegion = selectedRegion 
      ? d.region === selectedRegion 
      : true;
    
    // Event filter
    const matchesEvent = selectedEvent 
      ? d.eventName === selectedEvent 
      : true;

    return isInTimeRange && matchesRegion && matchesEvent;
  });

  const filteredRegionalData = data.regionalData
  .filter(r => {
    if (selectedRegion && r.region !== selectedRegion) return false;
    if (selectedEvent) {
      // Filter regional data based on event if needed
      const hasEventData = data.timelineData.some(
        t => t.eventName === selectedEvent && t.region === r.region
      );
      return hasEventData;
    }
    return true;
  });

  if (isPreview) {
    return (
      <div className="p-4 h-full flex flex-col">
        {/* Header Summary */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-lg font-medium">Decision Impact</span>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-green-500 flex items-center gap-1">
              <Brain className="w-4 h-4" />
              {((data.summary.culturalPeriods.approvalRate - data.summary.normalPeriods.approvalRate) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
  
        {/* Approval Rate Comparison */}
        <div className="flex justify-around mb-2 text-sm">
          <span className="text-blue-500">Cultural Periods: {(data.summary.culturalPeriods.approvalRate * 100).toFixed(1)}%</span>
          <span className="text-gray-500">Normal Periods: {(data.summary.normalPeriods.approvalRate * 100).toFixed(1)}%</span>
        </div>
  
        {/* Mini Line Chart (Approval Rate Trend) */}
        <div className="h-28">
          <ChartJSLine
            data={{
              labels: data.timelineData.map(d => new Date(d.date).toLocaleDateString()),
              datasets: [{
                label: 'Approval Rate',
                data: data.timelineData.map(d => d.approvals / (d.approvals + d.rejections) * 100),
                borderColor: '#3b82f6',
                tension: 0.4,
                pointRadius: 0,
                fill: false
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
                  grid: { display: false }
                }
              }
            }}
          />
        </div>
  
        {/* Key Event Preview */}
        {data.summary.significantEvents.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-sm">{data.summary.significantEvents[0].name}</span>
              <span className={`text-sm font-medium ${
                data.summary.significantEvents[0].approvalDelta > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data.summary.significantEvents[0].approvalDelta > 0 ? '+' : ''}
                {data.summary.significantEvents[0].approvalDelta.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(data.summary.significantEvents[0].period.start).toLocaleDateString()} - {new Date(data.summary.significantEvents[0].period.end).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    );
  }  

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: customColors?.tileColor }}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-1" style={{ color: customColors?.textColor }}>
          Cultural Decision Impact
        </h3>
        
        {/* Controls */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1.5 rounded border text-sm"
            style={{ 
              borderColor: customColors?.borderColor,
              backgroundColor: customColors?.backgroundColor,
              color: customColors?.textColor
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <select
            value={selectedRegion || ''}
            onChange={(e) => setSelectedRegion(e.target.value || null)}
            className="px-3 py-1.5 rounded border text-sm"
            style={{ 
              borderColor: customColors?.borderColor,
              backgroundColor: customColors?.backgroundColor,
              color: customColors?.textColor
            }}
          >
            <option value="">All Regions</option>
            {data.regionalData.map(r => (
              <option key={r.region} value={r.region}>{r.region}</option>
            ))}
          </select>

          <select
            value={selectedEvent || ''}
            onChange={(e) => setSelectedEvent(e.target.value || null)}
            className="px-3 py-1.5 rounded border text-sm"
            style={{ 
              borderColor: customColors?.borderColor,
              backgroundColor: customColors?.backgroundColor,
              color: customColors?.textColor
            }}
          >
            <option value="">All Cultural Events</option>
            {data.summary.significantEvents.map((event, index) => (
              <option key={`${event.name}-${index}`} value={event.name}>
              {event.name}
            </option>
            ))}
          </select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded bg-opacity-10" style={{ backgroundColor: customColors?.backgroundColor }}>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Cultural Periods</span>
            </div>
            <div className="text-lg font-bold">
              {(data.summary.culturalPeriods.approvalRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs opacity-70">Approval Rate</div>
          </div>

          <div className="p-3 rounded bg-opacity-10" style={{ backgroundColor: customColors?.backgroundColor }}>
            <div className="flex items-center gap-2 mb-1">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Normal Periods</span>
            </div>
            <div className="text-lg font-bold">
              {(data.summary.normalPeriods.approvalRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs opacity-70">Approval Rate</div>
          </div>

          <div className="p-3 rounded bg-opacity-10" style={{ backgroundColor: customColors?.backgroundColor }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Cultural Impact</span>
            </div>
            <div className="text-lg font-bold">
              {((data.summary.culturalPeriods.approvalRate - data.summary.normalPeriods.approvalRate) * 100).toFixed(1)}%
            </div>
            <div className="text-xs opacity-70">Difference</div>
          </div>
        </div>
      </div>

      {/* Regional Breakdown */}
      {isFocused && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Regional Breakdown</h4>
          <div className="grid grid-cols-2 gap-4">
            {filteredRegionalData.map(region => (
              <div 
                key={region.region}
                className="p-3 rounded"
                style={{ backgroundColor: customColors?.backgroundColor }}
              >
                <div className="font-medium mb-1">{region.region}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm opacity-70">Cultural Periods</div>
                    <div className="font-bold">{(region.culturalPeriods.approvalRate * 100).toFixed(1)}%</div>
                    <div className="text-xs">
                      {region.culturalPeriods.totalDecisions.toLocaleString()} decisions
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-70">Normal Periods</div>
                    <div className="font-bold">{(region.normalPeriods.approvalRate * 100).toFixed(1)}%</div>
                    <div className="text-xs">
                      {region.normalPeriods.totalDecisions.toLocaleString()} decisions
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

{/* Significant Events */}
<div className="mt-6">
  <h4 className="text-sm font-medium mb-2">Significant Events</h4>
  
  {data.summary.significantEvents.length === 0 ? (
    <p className="text-sm opacity-70">No significant events detected.</p>
  ) : (
    <div className="space-y-2">
      {data.summary.significantEvents.slice(0, 3).map((event, i) => (
        <div 
          key={i}
          className="p-3 rounded"
          style={{ backgroundColor: customColors?.backgroundColor }}
        >
          <div className="font-medium">{event.name}</div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm opacity-70">
              {new Date(event.period.start).toLocaleDateString()}
            </span>
            <span className={event.approvalDelta > 0 ? 'text-green-500' : 'text-red-500'}>
              {event.approvalDelta > 0 ? '+' : ''}{event.approvalDelta.toFixed(1)}%
            </span>
          </div>
        </div>
      ))}

      {/* Expandable Dropdown */}
      {data.summary.significantEvents.length > 3 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-blue-500">View More Events</summary>
          <div className="mt-2 space-y-2">
            {data.summary.significantEvents.slice(3).map((event, i) => (
              <div 
                key={i}
                className="p-3 rounded"
                style={{ backgroundColor: customColors?.backgroundColor }}
              >
                <div className="font-medium">{event.name}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm opacity-70">
                    {new Date(event.period.start).toLocaleDateString()}
                  </span>
                  <span className={event.approvalDelta > 0 ? 'text-green-500' : 'text-red-500'}>
                    {event.approvalDelta > 0 ? '+' : ''}{event.approvalDelta.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )}
</div>


      {/* Regional Comparison */}
      <RegionalComparison data={data} />
    </div>
  );
};

const RegionalComparison: React.FC<{ data: CulturalDecisionData }> = ({ data }) => {
  const { customColors } = useTheme();
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m'>('3m');

  const calculateVariance = (region: string): RegionalVariance => {
    const regionalData = data.regionalData.find(r => r.region === region)!;
    
    // Filter timeline data based on selected timeframe
    const timeframeData = data.timelineData.filter(d => {
      const date = new Date(d.date);
      const now = new Date();
      switch (timeframe) {
        case '1m':
          return date >= new Date(now.setMonth(now.getMonth() - 1));
        case '3m':
          return date >= new Date(now.setMonth(now.getMonth() - 3));
        case '6m':
          return date >= new Date(now.setMonth(now.getMonth() - 6));
        default:
          return true;
      }
    });

    const baseline = regionalData.normalPeriods.approvalRate;
    const current = regionalData.culturalPeriods.approvalRate;
    const variance = Math.abs(current - baseline);

    return {
      region,
      baseline,
      current,
      trend: timeframeData  // Use filtered data here
        .filter(d => d.culturalPeriod && d.region === region)
        .map(d => ({
          period: d.date,
          approvalRate: d.approvals / (d.approvals + d.rejections),
          volume: d.approvals + d.rejections,
          significance: Math.abs(d.approvals / (d.approvals + d.rejections) - baseline)
        })),
      significance: variance > 0.15 ? 'high' : variance > 0.08 ? 'medium' : 'low',
      statisticalSignificance: {
        pValue: 0.05,
        confidenceInterval: [baseline - variance, baseline + variance]
      }
    };
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium">Regional Comparison</h4>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as any)}
          className="text-sm border rounded px-2 py-1"
          style={{ borderColor: customColors?.borderColor }}
        >
          <option value="1m">Last Month</option>
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
        </select>
      </div>

      <div className="space-y-4">
        {data.regionalData.map(region => {
          const variance = calculateVariance(region.region);
          
          return (
            <div 
              key={region.region}
              className="p-4 rounded-lg"
              style={{ backgroundColor: customColors?.backgroundColor }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h5 className="font-medium">{region.region}</h5>
                  <div className="text-sm opacity-75">
                    Significance: 
                    <span className={
                      variance.significance === 'high' ? 'text-red-500' :
                      variance.significance === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }> {variance.significance}</span>
                  </div>
                </div>
                <div className="text-sm">
                  Δ {((variance.current - variance.baseline) * 100).toFixed(1)}%
                </div>
              </div>

              {/* Trend Mini-Chart */}
              <div className="h-20">
                <ChartJSLine
                  data={{
                    labels: variance.trend.map(t => new Date(t.period).toLocaleDateString()),
                    datasets: [{
                      label: 'Approval Rate',
                      data: variance.trend.map(t => t.approvalRate * 100),
                      borderColor: '#3b82f6',
                      tension: 0.1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { display: false },
                      y: { 
                        display: true,
                        min: Math.min(variance.baseline * 100 - 10, ...variance.trend.map(t => t.approvalRate * 100)),
                        max: Math.max(variance.baseline * 100 + 10, ...variance.trend.map(t => t.approvalRate * 100))
                      }
                    }
                  }}
                />
              </div>

              {/* Statistical Markers */}
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="p-2 rounded bg-opacity-10" style={{ backgroundColor: `${customColors?.backgroundColor}40` }}>
                  <div className="opacity-75">Baseline</div>
                  <div className="font-medium">{(variance.baseline * 100).toFixed(1)}%</div>
                </div>
                <div className="p-2 rounded bg-opacity-10" style={{ backgroundColor: `${customColors?.backgroundColor}40` }}>
                  <div className="opacity-75">Current</div>
                  <div className="font-medium">{(variance.current * 100).toFixed(1)}%</div>
                </div>
                <div className="p-2 rounded bg-opacity-10" style={{ backgroundColor: `${customColors?.backgroundColor}40` }}>
                  <div className="opacity-75">Confidence</div>
                  <div className="font-medium">
                    {variance.trend.filter(t => t.significance > 0.1).length / variance.trend.length * 100}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CulturalDecisionImpact; 