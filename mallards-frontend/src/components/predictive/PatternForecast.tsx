import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useData } from '../../context/DataContext';

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

interface Props {
  data: {
    forecast: ForecastPoint[];
    regionalVariations: any[];
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
  const [forecastData, setForecastData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setIsLoading(true);
        const processedData = getProcessedData();
        
        const API_BASE = 'http://localhost:8000';
        
        if (!Array.isArray(processedData) || processedData.length === 0) {
          throw new Error('No data available for processing');
        }

        const modelEndpoint = getModelEndpoint();
        const dates = processedData.map(item => item.transactionDate);
        const values = processedData.map(item => parseFloat(item.amount));
        const forecastDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

        const forecastResponse = await fetch(`${API_BASE}/forecast/${modelEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dates,
            values,
            forecast_days: forecastDays
          })
        });

        if (!forecastResponse.ok) {
          throw new Error('Forecast request failed');
        }

        const result = await forecastResponse.json();
        
        const transformedData = {
          forecast: result.forecast.map((point: any) => ({
            timestamp: point.timestamp,
            value: point.value,
            lower: point.lower,
            upper: point.upper,
            actual: point.actual
          })),
          regionalVariations: [],
          approvalTrend: 0,
          volumeTrend: 0
        };

        setForecastData(transformedData);
      } catch (error) {
        console.error('Failed to fetch forecast:', error);
        setForecastData(initialData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecast();
  }, [timeRange, getProcessedData, initialData, selectedFocus]);

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

  const getModelEndpoint = () => {
    switch (selectedFocus) {
      case 'pattern':
        return 'prophet';
      case 'decision':
        return 'arima';
      default:
        return 'prophet';
    }
  };

  const chartData = {
    labels: forecastData.forecast.map(point => {
      const date = new Date(point.timestamp);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }),
    datasets: [
      {
        label: 'Forecast',
        data: forecastData.forecast.map(point => point.value),
        borderColor: String(customColors?.primary) || '#3b82f6',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        zIndex: 3
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
        zIndex: 2
      },
      {
        label: 'Confidence Interval',
        data: forecastData.forecast.map(point => point.upper),
        borderColor: 'transparent',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
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

  return (
    <div className="p-6 rounded-lg w-full" style={{ backgroundColor: customColors?.tileColor }}>
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

      <div className="h-[400px] mb-6"> {/* Increased from h-64 */}
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
    </div>
  );
};

export default PatternForecast;