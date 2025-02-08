import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { 
  DecisionMetrics, 
  AIDecisionData,
  CulturalContext,
  ConflictAnalysis 
} from '../../types/anomaly';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartData } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  data: AIDecisionData;
  timeRange: '24h' | '7d' | '30d' | 'all';
  onTimeRangeChange: (range: '24h' | '7d' | '30d' | 'all') => void;
  isLoading?: boolean;
}

const AIDecisionConflicts: React.FC<Props> = ({
  data,
  timeRange,
  onTimeRangeChange,
  isLoading = false
}) => {
  const { customColors } = useTheme();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Add state for focus type
const [focusType, setFocusType] = useState<'spending' | 'approval' | 'regional'>('approval');

// Add this after the focusType state
const getFocusData = () => {
  switch (focusType) {
    case 'spending':
      return {
        labels: data.metrics.map(m => m.culturalGroup),
        datasets: [{
          label: 'Average Transaction Amount',
          data: data.metrics.map(m => m.regionalDistribution[0].rate * 1000), // Convert to currency amount
          backgroundColor: String(customColors?.primary) || '#3b82f6',
          borderRadius: 4,
        }]
      };
    case 'regional':
      return {
        labels: data.metrics.map(m => m.region || m.culturalGroup),
        datasets: [{
          label: 'Regional Approval Rate',
          data: data.metrics.map(m => m.regionalDistribution[0].rate * 100),
          backgroundColor: String(customColors?.primary) || '#3b82f6',
          borderRadius: 4,
        }]
      };
    case 'approval':
    default:
      return {
        labels: data.metrics.map(m => m.culturalGroup),
        datasets: [
          {
            label: 'Approvals',
            data: data.metrics.map(m => m.approvalRate * 100),
            backgroundColor: String(customColors?.primary) || '#3b82f6',
            borderRadius: 4,
          },
          {
            label: 'Average Rate',
            data: data.metrics.map(() => data.averageApprovalRate * 100),
            backgroundColor: 'rgba(156, 163, 175, 0.5)',
            borderRadius: 4,
          }
        ]
      };
  }
};

// Replace the existing chartData with this:
const chartData: ChartData<'bar'> = getFocusData();

// Add handler
const handleFocusChange = (type: 'spending' | 'approval' | 'regional') => {
  setFocusType(type);
};



// Add the focus selector component after the header
const renderFocusSelector = () => (
  <div className="mb-6 flex gap-4">
    <button
      className={`px-4 py-2 rounded-lg transition-colors ${
        focusType === 'spending' ? 'bg-blue-500 text-white' : ''
      }`}
      onClick={() => handleFocusChange('spending')}
      style={focusType !== 'spending' ? { 
        backgroundColor: `${customColors?.backgroundColor}20`,
        color: customColors?.textColor 
      } : {}}
    >
      Spending Conflicts
    </button>
    <button
      className={`px-4 py-2 rounded-lg transition-colors ${
        focusType === 'approval' ? 'bg-blue-500 text-white' : ''
      }`}
      onClick={() => handleFocusChange('approval')}
      style={focusType !== 'approval' ? { 
        backgroundColor: `${customColors?.backgroundColor}20`,
        color: customColors?.textColor 
      } : {}}
    >
      Approval Conflicts
    </button>
    <button
      className={`px-4 py-2 rounded-lg transition-colors ${
        focusType === 'regional' ? 'bg-blue-500 text-white' : ''
      }`}
      onClick={() => handleFocusChange('regional')}
      style={focusType !== 'regional' ? { 
        backgroundColor: `${customColors?.backgroundColor}20`,
        color: customColors?.textColor 
      } : {}}
    >
      Regional Conflicts
    </button>
  </div>
);

// Add after the focus change handler
const renderCulturalContext = () => (
  <div className="mt-6 p-4 rounded-lg border border-opacity-10" 
       style={{ borderColor: customColors?.borderColor }}>
    <h4 className="text-sm font-medium mb-4" style={{ color: customColors?.textColor }}>
      Cultural Context
    </h4>
    <div className="space-y-4">
      {data.culturalPeriods.map((context, index) => (
        <div key={index} className="p-3 rounded-lg" 
             style={{ backgroundColor: `${customColors?.backgroundColor}20` }}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-sm font-medium" style={{ color: customColors?.textColor }}>
                {context.group}
              </span>
              <span className="text-xs ml-2 opacity-75" style={{ color: customColors?.textColor }}>
                {context.period}
              </span>
            </div>
            <div className="px-2 py-1 rounded-full text-xs"
                 style={{ backgroundColor: `${customColors?.backgroundColor}40` }}>
              {(context.culturalSignificance * 100).toFixed(0)}% relevance
            </div>
          </div>
          <p className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
            {context.expectedBehavior}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const getChartOptions = () => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const metric = data.metrics[context.dataIndex];
            switch (focusType) {
              case 'spending':
                return [
                  `Amount: $${context.parsed.y.toFixed(2)}`,
                  `Impact: ${metric.impact.toFixed(2)}`
                ];
              case 'regional':
                return [
                  `Rate: ${context.parsed.y.toFixed(1)}%`,
                  `Deviation: ${metric.regionalDistribution[0].deviation.toFixed(2)}%`
                ];
              default:
                return [
                  `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`,
                  `Impact: ${metric.impact.toFixed(2)}`
                ];
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: focusType === 'spending' ? undefined : 100,
        title: {
          display: true,
          text: focusType === 'spending' ? 'Amount ($)' : 
                focusType === 'regional' ? 'Regional Rate (%)' : 
                'Approval Rate (%)'
        }
      }
    }
  };

  return baseOptions;
};

// Replace the existing chartOptions with this:
const chartOptions = getChartOptions();

const getTableHeaders = () => {
  switch (focusType) {
    case 'spending':
      return ['Cultural Group', 'Average Amount', 'Trend', 'Impact'];
    case 'regional':
      return ['Region', 'Approval Rate', 'Deviation', 'Impact'];
    default:
      return ['Cultural Group', 'Approval Rate', 'Trend', 'Impact'];
  }
};

const getRowData = (metric: DecisionMetrics) => {
  switch (focusType) {
    case 'spending':
      return [
        metric.culturalGroup,
        `$${(metric.regionalDistribution[0].rate * 1000).toFixed(2)}`,
        metric.trend,
        metric.impact
      ];
    case 'regional':
      return [
        metric.region || metric.culturalGroup,
        `${(metric.regionalDistribution[0].rate * 100).toFixed(1)}%`,
        metric.regionalDistribution[0].deviation,
        metric.impact
      ];
    default:
      return [
        metric.culturalGroup,
        `${(metric.approvalRate * 100).toFixed(1)}%`,
        metric.trend,
        metric.impact
      ];
  }
};

const getTrendIndicator = (trend: number) => {
  if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return null;
};

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: customColors?.tileColor }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium mb-1" style={{ color: customColors?.textColor }}>
            AI Decision Conflicts
          </h3>
          <div className="flex items-center gap-2 text-sm opacity-75" style={{ color: customColors?.textColor }}>
            <AlertTriangle className="w-4 h-4" />
            <span>{data.significantDeviations.length} significant deviations detected</span>
          </div>
        </div>

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

      {renderFocusSelector()}

      {/* Chart */}
      <div className="h-64 mb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
              Loading data...
            </span>
          </div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>

      {renderCulturalContext()}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
          <tr style={{ borderBottom: `1px solid ${customColors?.borderColor}` }}>
          {getTableHeaders().map((header, index) => (
            <th 
              key={index}
              className={`py-2 px-4 ${index === 0 ? 'text-left' : 'text-right'}`}
              style={{ color: customColors?.textColor }}
            >
              {header}
            </th>
          ))}
          </tr>
          </thead>
          <tbody>
  {data.metrics.map((metric) => {
    const rowData = getRowData(metric);
    return (
      <tr 
        key={metric.culturalGroup}
        className="hover:bg-opacity-50 cursor-pointer"
        style={{ borderBottom: `1px solid ${customColors?.borderColor}` }}
        onClick={() => setSelectedGroup(metric.culturalGroup)}
      >
        {rowData.map((value, index) => (
          <td 
            key={index}
            className={`py-2 px-4 ${index === 0 ? 'text-left' : 'text-right'}`}
            style={{ color: customColors?.textColor }}
          >
            {index === 2 ? (
              <div className="flex justify-end items-center gap-1">
                {getTrendIndicator(Number(value))}
                <span>{Math.abs(Number(value)).toFixed(1)}%</span>
              </div>
            ) : (
              typeof value === 'number' ? value.toFixed(2) : value
            )}
          </td>
        ))}
      </tr>
    );
  })}
</tbody>
        </table>
      </div>
    </div>
  );
};

export default AIDecisionConflicts; 