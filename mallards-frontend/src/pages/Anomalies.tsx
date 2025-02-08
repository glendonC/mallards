import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import Dock from '../components/navigation/Dock';
import CulturalPatternViolations from '../components/anomalies/CulturalPatternViolations';
import AIDecisionConflicts from '../components/anomalies/AIDecisionConflicts';
import UnusualDeviations from '../components/anomalies/UnusualDeviations';
import { CulturalViolation, AIDecisionData, UnusualDeviation, ModelInfo } from '../types/anomaly';
import { useData } from '../context/DataContext';

const mockModelInfo: ModelInfo = {
  type: 'isolation-forest',
  name: 'Isolation Forest',
  confidence: 0.92,
  parameters: {
    contamination: 0.1,
    n_estimators: 100
  }
};

const Anomalies: React.FC = () => {
  const { customColors } = useTheme();
  const { getProcessedData } = useData();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [isLoadingViolations, setIsLoadingViolations] = useState(true);
  const [isLoadingDecisions, setIsLoadingDecisions] = useState(true);
  const [isLoadingDeviations, setIsLoadingDeviations] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingViolations(true);
      setIsLoadingDecisions(true);
      setIsLoadingDeviations(true);
  
      try {
        // Force a re-render of components by setting loading states
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsLoadingViolations(false);
        setIsLoadingDecisions(false);
        setIsLoadingDeviations(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoadingViolations(false);
        setIsLoadingDecisions(false);
        setIsLoadingDeviations(false);
      }
    };
  
    loadData();
  }, [timeRange]); // This will re-run when timeRange changes

  const handleInvestigate = (id: string) => {
    // Get deviations from real data
    const deviations = getUnusualDeviations();
    const deviation = deviations.find(d => d.id === id);
    if (!deviation) return;

    console.log('Investigation started:', {
      id,
      timestamp: new Date().toISOString(),
      severity: deviation.severity,
      pattern: deviation.pattern
    });

    // TODO: Implement real investigation logic
    // For now, just log the investigation
  };

  const handleResolve = (id: string) => {
    // Get deviations from real data
    const deviations = getUnusualDeviations();
    const deviation = deviations.find(d => d.id === id);
    if (!deviation) return;

    console.log('Deviation resolved:', {
      id,
      timestamp: new Date().toISOString(),
      pattern: deviation.pattern,
      severity: deviation.severity
    });

    // TODO: Implement real resolution logic
    // For now, just log the resolution
  };

  // Process real data for cultural violations
  const getCulturalViolations = (): CulturalViolation[] => {
    const processedData = getProcessedData() as Array<{
      transactionDate: string;
      amount: string;
      approvalStatus: string;
      region: string;
    }>;
  
    // Get start date based on timeRange
    const getStartDate = () => {
      const now = new Date();
      switch (timeRange) {
        case '24h':
          return new Date(now.setHours(now.getHours() - 24));
        case '7d':
          return new Date(now.setDate(now.getDate() - 7));
        case '30d':
          return new Date(now.setDate(now.getDate() - 30));
        case 'all':
          return new Date(0); // Beginning of time
        default:
          return new Date(now.setHours(now.getHours() - 24));
      }
    };
  
    // Filter data by timeRange first
    const startDate = getStartDate();
    const filteredData = processedData.filter(tx => 
      new Date(tx.transactionDate) >= startDate
    );
  
    // Group transactions by hour to detect patterns
    const hourlyData = filteredData.reduce((acc, tx) => {
      const hour = new Date(tx.transactionDate).setMinutes(0, 0, 0);
      if (!acc[hour]) {
        acc[hour] = { total: 0, amount: 0, approvals: 0 };
      }
      acc[hour].total++;
      acc[hour].amount += parseFloat(tx.amount);
      if (tx.approvalStatus?.toLowerCase() === 'approved') {
        acc[hour].approvals++;
      }
      return acc;
    }, {} as Record<number, any>);
  
    // Rest of your violation detection logic...
    return Object.entries(hourlyData)
      .filter(([timestamp, data]) => {
        const approvalRate = data.approvals / data.total;
        const avgAmount = data.amount / data.total;
        return approvalRate < 0.7 || avgAmount > 5000;
      })
      .map(([timestamp, data], index) => ({
        id: `violation-${index}`,
        timestamp: new Date(parseInt(timestamp)).toISOString(),
        severity: data.approvals / data.total < 0.6 ? 'high' : 'medium',
        type: 'pattern_violation',
        amount: data.amount,
        status: 'pending',
        culturalContext: 'Transaction Pattern',
        expectedPattern: 'Normal approval rate and transaction volume',
        actualPattern: `${((data.approvals / data.total) * 100).toFixed(1)}% approval rate`,
        impactScore: Math.round((1 - data.approvals / data.total) * 100),
        confidenceScore: 85,
        category: 'timing',
        trendIndicator: 'increasing',
        metrics: [{
          metric: 'approval_rate',
          value: (data.approvals / data.total) * 100,
          expectedValue: 75,
          deviation: 75 - (data.approvals / data.total) * 100,
          culturalSignificance: 0.8
        }],
        culturalPeriod: {
          name: 'Business Hours',
          startDate: new Date(parseInt(timestamp)).toISOString(),
          endDate: new Date(parseInt(timestamp) + 3600000).toISOString(),
          significance: 0.9,
          expectedPatterns: [{
            type: 'timing',
            description: 'Normal business hour pattern'
          }]
        }
      }));
  };

  // Add this function after getCulturalViolations
  const getDecisionConflicts = (): AIDecisionData => {
    const processedData = getProcessedData() as Array<{
      transactionDate: string;
      amount: string;
      approvalStatus: string;
      region: string;
    }>;

    // Group by region to analyze cultural patterns
    const regionalData = processedData.reduce((acc, tx) => {
      if (!acc[tx.region]) {
        acc[tx.region] = { approvals: 0, rejections: 0, amount: 0 };
      }
      if (tx.approvalStatus?.toLowerCase() === 'approved') {
        acc[tx.region].approvals++;
      } else {
        acc[tx.region].rejections++;
      }
      acc[tx.region].amount += parseFloat(tx.amount);
      return acc;
    }, {} as Record<string, any>);

    return {
      metrics: Object.entries(regionalData).map(([region, data]) => ({
        culturalGroup: region,
        approvals: data.approvals,
        rejections: data.rejections,
        approvalRate: data.approvals / (data.approvals + data.rejections),
        trend: 0, // Calculate from historical data if available
        impact: data.amount / processedData.length,
        timestamp: new Date().toISOString(),
        confidenceLevel: 0.85,
        seasonalAdjustment: 1.0,
        regionalDistribution: [{ region, rate: data.approvals / (data.approvals + data.rejections), deviation: 0 }]
      })),
      totalApprovals: Object.values(regionalData).reduce((sum: number, data: any) => sum + data.approvals, 0),
      totalRejections: Object.values(regionalData).reduce((sum: number, data: any) => sum + data.rejections, 0),
      averageApprovalRate: 0.75,
      significantDeviations: [],
      focusType: 'approval',
      analysis: {
        type: 'approval',
        metrics: [{ category: 'approval_rate', value: 75, expected: 80, deviation: -5 }]
      },
      culturalPeriods: [
        {
          group: 'Global',
          period: 'Business Hours',
          expectedBehavior: 'Normal approval patterns',
          culturalSignificance: 0.8
        }
      ]
    };
  };

  // Add this function after getDecisionConflicts
  const getUnusualDeviations = (): UnusualDeviation[] => {
    const processedData = getProcessedData() as Array<{
      transactionDate: string;
      amount: string;
      approvalStatus: string;
      region: string;
    }>;

    // Get start date based on timeRange
    const getStartDate = () => {
      const now = new Date();
      switch (timeRange) {
        case '24h':
          return new Date(now.setHours(now.getHours() - 24));
        case '7d':
          return new Date(now.setDate(now.getDate() - 7));
        case '30d':
          return new Date(now.setDate(now.getDate() - 30));
        case 'all':
          return new Date(0); // Beginning of time
        default:
          return new Date(now.setHours(now.getHours() - 24));
      }
    };

    // Get start date based on timeRange
    const startDate = getStartDate();
    const filteredData = processedData.filter(tx => 
      new Date(tx.transactionDate) >= startDate
    );

    // Calculate baseline metrics
    const baselineMetrics = {
      avgAmount: filteredData.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / filteredData.length,
      approvalRate: filteredData.filter(tx => tx.approvalStatus?.toLowerCase() === 'approved').length / filteredData.length,
      hourlyVolume: filteredData.length / 24
    };

    // Detect unusual patterns
    const deviations: UnusualDeviation[] = [];
    const hourlyData = new Map<number, any>();

    // Group by hour for pattern detection
    filteredData.forEach(tx => {
      const hour = new Date(tx.transactionDate).getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { transactions: [], amount: 0, approvals: 0 });
      }
      const hourData = hourlyData.get(hour);
      hourData.transactions.push(tx);
      hourData.amount += parseFloat(tx.amount);
      if (tx.approvalStatus?.toLowerCase() === 'approved') {
        hourData.approvals++;
      }
    });

    // Analyze hourly patterns
    hourlyData.forEach((data, hour) => {
      const hourlyAvgAmount = data.amount / data.transactions.length;
      const hourlyApprovalRate = data.approvals / data.transactions.length;
      const hourlyVolume = data.transactions.length;

      // Check for significant deviations
      if (
        Math.abs(hourlyAvgAmount - baselineMetrics.avgAmount) > baselineMetrics.avgAmount * 0.5 ||
        Math.abs(hourlyApprovalRate - baselineMetrics.approvalRate) > 0.2 ||
        Math.abs(hourlyVolume - baselineMetrics.hourlyVolume) > baselineMetrics.hourlyVolume * 0.5
      ) {
        deviations.push({
          id: `deviation-${hour}`,
          timestamp: new Date().setHours(hour).toString(),
          severity: hourlyAvgAmount > baselineMetrics.avgAmount * 2 ? 'high' : 'medium',
          score: Math.min(100, Math.abs((hourlyAvgAmount / baselineMetrics.avgAmount - 1) * 100)),
          pattern: 'Unusual transaction pattern',
          modelConfidence: 0.85,
          modelType: 'isolation-forest',
          explanation: `Significant deviation in hour ${hour}`,
          affectedMetrics: [
            {
              metric: 'amount',
              value: hourlyAvgAmount,
              expectedRange: [baselineMetrics.avgAmount * 0.5, baselineMetrics.avgAmount * 1.5]
            },
            {
              metric: 'approval_rate',
              value: hourlyApprovalRate * 100,
              expectedRange: [baselineMetrics.approvalRate * 50, baselineMetrics.approvalRate * 150]
            }
          ],
          status: 'pending'
        });
      }
    });

    return deviations;
  };

  return (
    <div 
      className="min-h-screen relative" 
      style={{ backgroundColor: customColors?.backgroundColor }}
    >
      {/* Main content area with scrolling */}
      <div 
        className="h-screen overflow-y-auto pb-[120px]"
      >
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold" style={{ color: customColors?.textColor }}>
            Anomalies
          </h1>

          <CulturalPatternViolations
            data={getCulturalViolations()}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            isLoading={false}
          />

          <AIDecisionConflicts
            data={getDecisionConflicts()}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            isLoading={false}
          />

          <UnusualDeviations
            deviations={getUnusualDeviations()}
            modelInfo={mockModelInfo}
            onInvestigate={handleInvestigate}
            onResolve={handleResolve}
            isLoading={false}
          />
        </div>
      </div>

      {/* Dock fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0">
        <Dock />
      </div>
    </div>
  );
};

export default Anomalies; 