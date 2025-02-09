import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { Line } from 'react-chartjs-2';
import { ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { getPatternPredictions } from '@/services/api';

// Register Chart.js components
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
  isPreview?: boolean;
  showDetails?: boolean;
}

interface AlignmentMetrics {
  score: number;
  culturalPeriodScore: number;
  normalPeriodScore: number;
  trend: number;
  confidence: number;
}

interface TimelineEntry {
  date: string;
  score: number;
  isCulturalPeriod: boolean;
}

const CulturalAlignmentScore: React.FC<Props> = ({ 
  isPreview = false,
  showDetails = false 
}) => {
  // States
  const [metrics, setMetrics] = useState<AlignmentMetrics | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { customColors } = useTheme();
  const { 
    columnMapping, 
    getProcessedData, 
    selectedModels,
    selectedFocus 
  } = useData();

  // Check if a date falls within a cultural period
  const isCulturalPeriod = (date: Date): boolean => {
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    // Weekend detection
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;

    // Major holidays/cultural periods
    if (
      (month === 11 && day >= 20) || // Christmas/End of year
      (month === 0 && day <= 7) ||   // New Year
      (month === 6 && day === 4)     // Independence Day
    ) return true;

    return false;
  };

  // Process transaction data and calculate metrics
  const processTransactionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      if (!columnMapping.approvalStatus || !columnMapping.transactionDate) {
        throw new Error('Missing required fields: Approval Status and Transaction Date');
      }

      const rawData = getProcessedData();
      
      // Process and sort transactions by date
      const transactions = rawData
        .filter(tx => tx.transactionDate && tx.approvalStatus)
        .map(tx => ({
          date: new Date(tx.transactionDate),
          approved: tx.approvalStatus.toLowerCase() === 'approved',
          amount: parseFloat(tx.amount || '0')
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (!transactions.length) {
        throw new Error('No valid transactions found');
      }

      // Get AI model predictions if available
      let modelPredictions = null;
      // Inside processTransactionData function, modify the model predictions section:
      if (selectedModels.anomaly) {
        try {
          // Transform the data to match backend expectations
          const formattedTransactions = transactions.map(tx => ({
            transactionDate: tx.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            amount: tx.amount,
            transactionType: 'standard', // Add default since we don't track this
            approvalStatus: tx.approved ? 'approved' : 'rejected',
            region: 'global' // Add default since we don't track this
          }));

          modelPredictions = await getPatternPredictions(
            formattedTransactions,
            {
              focusMode: selectedFocus || 'pattern',
              window: 'month',
              sensitivity: 2
            }
          );
        } catch (error) {
          console.warn('Model predictions unavailable, using heuristic calculations:', error);
        }
      }

      // Separate cultural and normal period transactions
      const culturalPeriodTxs = transactions.filter(tx => isCulturalPeriod(tx.date));
      const normalPeriodTxs = transactions.filter(tx => !isCulturalPeriod(tx.date));

      // Calculate approval rates
      const calculateApprovalRate = (txs: typeof transactions) =>
        txs.length ? (txs.filter(tx => tx.approved).length / txs.length) * 100 : 0;

      const culturalPeriodScore = calculateApprovalRate(culturalPeriodTxs);
      const normalPeriodScore = calculateApprovalRate(normalPeriodTxs);

      // Generate timeline data
      const timelineData: TimelineEntry[] = [];
      let currentDate = transactions[0].date;
      const endDate = transactions[transactions.length - 1].date;
      
      while (currentDate <= endDate) {
        const windowEnd = new Date(currentDate);
        windowEnd.setDate(windowEnd.getDate() + 7);

        const windowTxs = transactions.filter(
          tx => tx.date >= currentDate && tx.date <= windowEnd
        );

        if (windowTxs.length) {
          timelineData.push({
            date: currentDate.toISOString(),
            score: calculateApprovalRate(windowTxs),
            isCulturalPeriod: isCulturalPeriod(currentDate)
          });
        }

        currentDate = windowEnd;
      }

      // Calculate overall metrics
      const overallScore = modelPredictions?.accuracy || 
      (culturalPeriodTxs.length + normalPeriodTxs.length > 0 
        ? ((culturalPeriodScore * culturalPeriodTxs.length) + 
           (normalPeriodScore * normalPeriodTxs.length)) / 
          (culturalPeriodTxs.length + normalPeriodTxs.length)
        : 0);
    
      const trend = timelineData.length > 1 
        ? ((timelineData[timelineData.length - 1].score - timelineData[0].score) / 
          Math.max(timelineData[0].score, 0.1)) * 100
        : 0;
      
      setMetrics({
        score: overallScore,
        culturalPeriodScore,
        normalPeriodScore,
        trend,
        confidence: modelPredictions?.confidence || 85
      });
      
      console.log("Setting Metrics:", {
        score: overallScore,
        culturalPeriodScore,
        normalPeriodScore,
        trend,
        confidence: modelPredictions?.confidence || 85
      });

      setTimeline(timelineData);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process data');
      console.error('Error processing transaction data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    processTransactionData();
  }, [columnMapping, getProcessedData, selectedModels, selectedFocus]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 text-center" style={{ color: customColors?.textColor }}>
        <p className="text-lg">Processing alignment data...</p>
        <p className="text-sm opacity-75">Analyzing cultural patterns</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 text-center" style={{ color: customColors?.textColor }}>
        <p className="text-lg text-red-500">Unable to process alignment data</p>
        <p className="text-sm opacity-75">{error}</p>
      </div>
    );
  }

  // No data state
  if (!metrics || !timeline.length) {
    return (
      <div className="p-6 text-center" style={{ color: customColors?.textColor }}>
        <p className="text-lg">No alignment data available</p>
        <p className="text-sm opacity-75">Please check data requirements</p>
      </div>
    );
  }

  // Preview mode render
  if (isPreview) {
    return (
      <div className="p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {metrics.score.toFixed(1)}%
          </span>
          <div className="flex items-center gap-1 text-xs">
            {metrics.trend >= 0 ? (
              <ArrowUp className="w-3 h-3 text-green-500" />
            ) : (
              <ArrowDown className="w-3 h-3 text-red-500" />
            )}
            <span>{Math.abs(metrics.trend).toFixed(1)}%</span>
          </div>
        </div>
        <div className="h-16 mt-2">
          <Line
            data={{
              labels: timeline.map(t => new Date(t.date).toLocaleDateString()),
              datasets: [{
                label: 'Alignment Score',
                data: timeline.map(t => t.score),
                borderColor: customColors?.textColor,
                tension: 0.4,
                fill: false
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { x: { display: false }, y: { display: false } }
            }}
          />
        </div>
      </div>
    );
  }

  // Full view render
  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2" style={{ color: customColors?.textColor }}>
          Cultural Alignment Score
        </h3>
        <div className="flex items-baseline gap-4">
          <span className="text-3xl font-bold" style={{ color: customColors?.textColor }}>
            {metrics.score.toFixed(1)}%
          </span>
          <div className="flex items-center gap-1">
            {metrics.trend >= 0 ? (
              <ArrowUp className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm" style={{ color: customColors?.textColor }}>
              {Math.abs(metrics.trend).toFixed(1)}% {metrics.trend >= 0 ? 'increase' : 'decrease'}
            </span>
          </div>
        </div>
      </div>

      <div className="h-64 mb-6">
        <Line
          data={{
            labels: timeline.map(t => new Date(t.date).toLocaleDateString()),
            datasets: [{
              label: 'Alignment Score',
              data: timeline.map(t => t.score),
              borderColor: timeline.map(t => 
                t.isCulturalPeriod ? '#3b82f6' : customColors?.textColor
              ),
              tension: 0.4,
              fill: false
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                grid: { color: `${customColors?.borderColor}40` }
              }
            }
          }}
        />
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t" 
          style={{ borderColor: customColors?.borderColor }}>
          <div className="space-y-2">
            <h4 className="text-sm font-medium" style={{ color: customColors?.textColor }}>
              Cultural Periods
            </h4>
            <p className="text-2xl font-bold" style={{ color: customColors?.textColor }}>
              {metrics.culturalPeriodScore.toFixed(1)}%
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium" style={{ color: customColors?.textColor }}>
              Normal Periods
            </h4>
            <p className="text-2xl font-bold" style={{ color: customColors?.textColor }}>
              {metrics.normalPeriodScore.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CulturalAlignmentScore;