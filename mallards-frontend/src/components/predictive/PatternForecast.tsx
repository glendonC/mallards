import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Calendar, Map, AlertCircle, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useData } from '../../context/DataContext';
import { getBestForecast } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ForecastPoint {
  timestamp: string;
  value: number;
  lower: number;
  upper: number;
  actual?: number;
}

interface RegionalVariation {
  region: string;
  deviation: number;
  confidence: number;
}

interface Props {
  data: {
    forecast: ForecastPoint[];
    regionalVariations: RegionalVariation[];
    approvalTrend: number;
    volumeTrend: number;
  };
  timeRange: '7d' | '30d' | '90d';
  onTimeRangeChange: (range: '7d' | '30d' | '90d') => void;
  isLoading?: boolean;
}

const PatternForecast: React.FC<Props> = ({
  data: initialData,
  timeRange,
  onTimeRangeChange,
  isLoading: externalLoading = false
}) => {
  const { customColors } = useTheme();
  const { selectedFocus, getProcessedData } = useData();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setIsLoading(true);
        const processedData = getProcessedData();
        
        // Transform data for the API
        const apiData = processedData.map(item => ({
          timestamp: new Date(item.timestamp).toISOString(),
          value: parseFloat(item.amount)
        }));

        const forecastResponse = await getBestForecast(apiData);

        // Transform the forecast response into the expected format
        const transformedData = {
          forecast: forecastResponse.forecast.map((point: any) => ({
            timestamp: point.timestamp,
            value: point.predicted,
            lower: point.lower_bound,
            upper: point.upper_bound,
            actual: point.actual
          })),
          regionalVariations: forecastResponse.regional_variations?.map((variation: any) => ({
            region: variation.region,
            deviation: variation.deviation,
            confidence: variation.confidence
          })) || [],
          approvalTrend: forecastResponse.trends?.approval_trend || 0,
          volumeTrend: forecastResponse.trends?.volume_trend || 0
        };

        setForecastData(transformedData);
      } catch (error) {
        console.error('Failed to fetch forecast:', error);
        // Fallback to initial data if the API call fails
        setForecastData(initialData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecast();
  }, [timeRange, getProcessedData, initialData]);

  const getMetricLabel = () => {
    switch (selectedFocus) {
      case 'pattern':
        return 'Spending Pattern';
      case 'decision':
        return 'Approval Pattern';
      case 'bias':
        return 'Bias Risk Pattern';
      default:
        return 'Pattern';
    }
  };

// Helper for generating heatmap colors based on deviation value
const getHeatmapColor = (deviation: number): string => {
  // Normalize deviation to a 0-1 scale
  const normalizedValue = Math.min(Math.max((deviation + 50) / 100, 0), 1);
  
  // Color scale from red (negative) through yellow (neutral) to green (positive)
  if (deviation < 0) {
    // Red scale for negative values
    const intensity = Math.abs(deviation) / 50; // 50 is max expected negative deviation
    return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`; // rgb(239, 68, 68) is text-red-500
  } else if (deviation > 0) {
    // Green scale for positive values
    const intensity = deviation / 50; // 50 is max expected positive deviation
    return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`; // rgb(34, 197, 94) is text-green-500
  }
  // Yellow for neutral/zero
  return 'rgba(234, 179, 8, 0.5)'; // rgb(234, 179, 8) is text-yellow-500
};

// Helper for getting significant change message based on forecast data
const getSignificantChangeMessage = (data: {
  forecast: ForecastPoint[];
  volumeTrend: number;
  approvalTrend: number;
}): string => {
  const recentTrend = data.forecast.slice(-3); // Look at last 3 points
  const volatility = Math.abs(data.volumeTrend);
  
  if (volatility > 20) {
    return `High volatility detected: ${data.volumeTrend > 0 ? '+' : ''}${data.volumeTrend}% volume change expected. Consider adjusting risk thresholds.`;
  } else if (volatility > 10) {
    return `Moderate changes detected: ${data.volumeTrend > 0 ? '+' : ''}${data.volumeTrend}% volume trend. Monitor closely.`;
  } else {
    return `Stable pattern detected: ${data.volumeTrend > 0 ? '+' : ''}${data.volumeTrend}% gradual change expected.`;
  }
};

// Helper for identifying risk areas based on forecast and regional variations
const getRiskAreaMessage = (data: {
  forecast: ForecastPoint[];
  regionalVariations: RegionalVariation[];
  approvalTrend: number;
}): string => {
  // Find regions with significant negative deviations
  const riskRegions = data.regionalVariations
    .filter(v => v.deviation < -10)
    .map(v => v.region);
    
  if (riskRegions.length > 0) {
    return `High risk detected in ${riskRegions.join(', ')}. Approval rates may drop by ${Math.abs(data.approvalTrend)}%.`;
  } else if (data.approvalTrend < -5) {
    return `General approval rate decline of ${Math.abs(data.approvalTrend)}% expected. Review acceptance criteria.`;
  } else {
    return 'No significant risk areas detected. Continue monitoring.';
  }
};

// Helper for identifying opportunities based on forecast data
const getOpportunityMessage = (data: {
  forecast: ForecastPoint[];
  regionalVariations: RegionalVariation[];
  volumeTrend: number;
}): string => {
  // Find regions with positive trends
  const growthRegions = data.regionalVariations
    .filter(v => v.deviation > 10)
    .map(v => v.region);
    
  if (growthRegions.length > 0) {
    return `Growth opportunities in ${growthRegions.join(', ')}. Consider increasing credit limits.`;
  } else if (data.volumeTrend > 5) {
    return `Positive volume trend of +${data.volumeTrend}%. Consider proactive credit line increases.`;
  } else {
    return 'Stable conditions. Focus on maintaining current performance.';
  }
};

// Helper for calculating trend severity
const getTrendSeverity = (trend: number): 'low' | 'medium' | 'high' => {
  const absoluteTrend = Math.abs(trend);
  if (absoluteTrend > 20) return 'high';
  if (absoluteTrend > 10) return 'medium';
  return 'low';
};

// Helper for getting trend direction icon and color
const getTrendIndicator = (trend: number) => {
  const severity = getTrendSeverity(trend);
  return {
    icon: trend > 0 ? 'trending_up' : trend < 0 ? 'trending_down' : 'trending_flat',
    color: severity === 'high' ? 'text-red-500' :
           severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
  };
};

const chartData = {
  labels: forecastData.forecast.map(point => new Date(point.timestamp).toLocaleDateString()),
  datasets: [
    {
      label: 'Forecast',
      data: forecastData.forecast.map(point => point.value),
      borderColor: String(customColors?.primary) || '#3b82f6',
      borderWidth: 2,
      tension: 0.4,
      fill: false,
      pointRadius: 3,
      zIndex: 3 // Make forecast line appear on top
    },
    {
      label: 'Actual',
      data: forecastData.forecast.map(point => point.actual || null),
      borderColor: '#10b981',
      borderWidth: 2,
      tension: 0.4,
      fill: false,
      pointStyle: 'circle',
      pointRadius: 4,
      zIndex: 2 // Make actual values appear above confidence interval
    },
    {
      label: 'Confidence Interval',
      data: forecastData.forecast.map(point => point.upper),
      borderColor: 'transparent',
      backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue with low opacity
      fill: '+1',
      pointStyle: 'none',
      zIndex: 1
    },
    {
      label: 'Confidence Interval',
      data: forecastData.forecast.map(point => point.lower),
      borderColor: 'transparent',
      fill: false,
      pointStyle: 'none',
      zIndex: 1
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
            const point = forecastData.forecast[context.dataIndex];
            const labels = [
              `Forecast: ${point.value.toFixed(2)}`,
              `Range: ${point.lower.toFixed(2)} - ${point.upper.toFixed(2)}`
            ];
            if (point.actual) labels.push(`Actual: ${point.actual.toFixed(2)}`);
            return labels;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: customColors?.borderColor || '#e2e8f0',
          drawBorder: false
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        }
      }
    }
  };

  const renderCommunityImpact = () => (
    <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: `${customColors?.backgroundColor}40` }}>
      <h4 className="text-sm font-medium mb-3" style={{ color: customColors?.textColor }}>
        Community Impact Analysis
      </h4>
      <div className="space-y-3">
  {/* Significant Changes */}
  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
    <span className="text-sm text-yellow-800 font-medium">Significant Changes</span>
    <p className="text-sm text-yellow-700 mt-1">
      {getSignificantChangeMessage(forecastData)}
    </p>
  </div>
  
  {/* Risk Areas */}
  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
    <span className="text-sm text-red-800 font-medium">Risk Areas</span>
    <p className="text-sm text-red-700 mt-1">
      {getRiskAreaMessage(forecastData)}
    </p>
  </div>
  
  {/* Opportunities */}
  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
    <span className="text-sm text-green-800 font-medium">Opportunities</span>
    <p className="text-sm text-green-700 mt-1">
      {getOpportunityMessage(forecastData)}
    </p>
  </div>
</div>
    </div>
  );

  const renderRegionalHeatmap = () => (
    <div className="mt-6">
      <h4 className="text-sm font-medium mb-3" style={{ color: customColors?.textColor }}>
        Regional Impact Heatmap
      </h4>
      <div className="grid grid-cols-5 gap-2">
        {forecastData.regionalVariations.map(variation => (
          <div
            key={variation.region}
            className="p-3 rounded-lg"
            style={{
              backgroundColor: getHeatmapColor(variation.deviation),
              cursor: 'pointer',
              opacity: selectedRegion === variation.region ? 1 : 0.7
            }}
            onClick={() => setSelectedRegion(variation.region)}
          >
            <div className="text-xs font-medium mb-1 text-white">
              {variation.region}
            </div>
            <div className="text-sm text-white">
              {variation.deviation > 0 ? '+' : ''}{variation.deviation.toFixed(1)}%
            </div>
            <div className="text-xs text-white opacity-75">
              {variation.confidence}% confidence
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  
  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: customColors?.tileColor }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium mb-1" style={{ color: customColors?.textColor }}>
            {getMetricLabel()} Forecast
          </h3>
          <div className="flex items-center gap-2 text-sm opacity-75" style={{ color: customColors?.textColor }}>
            <TrendingUp className="w-4 h-4" />
            <span>Predicting {forecastData.forecast.length} days ahead</span>
          </div>
        </div>

        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as '7d' | '30d' | '90d')}
          className="px-2 py-1 rounded border text-sm"
          style={{ 
            borderColor: customColors?.borderColor,
            backgroundColor: customColors?.backgroundColor,
            color: customColors?.textColor
          }}
        >
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="90d">90 Days</option>
        </select>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        {(isLoading || externalLoading) ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
              Loading forecast...
            </span>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Pattern Breakdown */}
      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
            Volume Trend
          </div>
          <div className="flex items-center gap-2">
            <Calendar 
              className="w-4 h-4" 
              style={{ color: getTrendIndicator(forecastData.volumeTrend).color }} 
            />
            <span className={`text-sm ${getTrendIndicator(forecastData.volumeTrend).color}`}>
              {forecastData.volumeTrend > 0 ? '+' : ''}{forecastData.volumeTrend.toFixed(1)}% expected
            </span>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
            Approval Rate
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle 
              className="w-4 h-4" 
              style={{ color: getTrendIndicator(forecastData.approvalTrend).color }} 
            />
            <span className={`text-sm ${getTrendIndicator(forecastData.approvalTrend).color}`}>
              {forecastData.approvalTrend > 0 ? '+' : ''}{forecastData.approvalTrend.toFixed(1)}% change
            </span>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
            Regional Variations
          </div>
          <div className="space-y-1">
            {forecastData.regionalVariations.map(variation => (
              <div 
                key={variation.region}
                className="flex items-center justify-between text-sm cursor-pointer hover:opacity-75"
                style={{ color: customColors?.textColor }}
                onClick={() => setSelectedRegion(variation.region)}
              >
                <div className="flex items-center gap-1">
                  <Map className="w-3 h-3" />
                  <span>{variation.region}</span>
                </div>
                <span className={getTrendIndicator(variation.deviation).color}>
                  {variation.deviation > 0 ? '+' : ''}{variation.deviation.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Impact Analysis */}
      {renderCommunityImpact()}

      {/* Regional Heatmap */}
      {renderRegionalHeatmap()}
    </div>
  );
};

export default PatternForecast; 