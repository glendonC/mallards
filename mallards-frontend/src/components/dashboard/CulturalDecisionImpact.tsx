import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CulturalDecisionData } from '../../types/dashboard';
import { Calendar, Filter, TrendingUp } from 'lucide-react';
import { Bar as ChartJSBar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend as ChartJSLegend,
  LineElement,
  PointElement
} from 'chart.js';
import { Line as ChartJSLine } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  ChartJSTooltip,
  ChartJSLegend
);

interface Props {
  data: CulturalDecisionData;
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

const CulturalDecisionImpact: React.FC<Props> = ({ data, isFocused = false, focusMode = 'decision' }) => {
  const { customColors } = useTheme();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

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
            {data.summary.significantEvents.map(event => (
              <option key={event.name} value={event.name}>{event.name}</option>
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

      {/* Main Chart */}
      <div style={{ width: '100%', height: isFocused ? '400px' : '250px' }} className="mb-6">
        <div style={{ height: '50%' }}>
          <ChartJSBar
            data={{
              labels: filteredData.map(d => d.date),
              datasets: [
                {
                  label: chartConfig.primaryMetric,
                  data: filteredData.map(d => d[chartConfig.primaryMetric as keyof typeof d]),
                  backgroundColor: chartConfig.chartColors.primary
                },
                {
                  label: chartConfig.secondaryMetric,
                  data: filteredData.map(d => d[chartConfig.secondaryMetric as keyof typeof d]),
                  backgroundColor: chartConfig.chartColors.secondary
                }
              ]
            }}
          />
        </div>
        <div style={{ height: '50%' }}>
          <ChartJSLine
            data={{
              labels: filteredData.map(d => d.date),
              datasets: [{
                label: 'Approval Rate',
                data: filteredData.map(d => d.approvalRate),
                borderColor: '#6366F1',
                tension: 0.1
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { beginAtZero: true } }
            }}
          />
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
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Significant Events</h4>
        <div className="space-y-2">
          {data.summary.significantEvents.map((event, i) => (
            <div 
              key={i}
              className="p-2 rounded text-sm cursor-pointer hover:bg-opacity-80"
              style={{ backgroundColor: customColors?.backgroundColor }}
              onClick={() => setSelectedEvent(event.name === selectedEvent ? null : event.name)}
            >
              <div className="font-medium">{event.name}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="opacity-70">
                  {new Date(event.period.start).toLocaleDateString()} - {new Date(event.period.end).toLocaleDateString()}
                </span>
                <span className={event.approvalDelta > 0 ? 'text-green-500' : 'text-red-500'}>
                  {event.approvalDelta > 0 ? '+' : ''}{event.approvalDelta.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
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