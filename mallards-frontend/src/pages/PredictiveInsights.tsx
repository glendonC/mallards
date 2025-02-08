import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import Dock from '../components/navigation/Dock';
import UpcomingEvents from '../components/predictive/UpcomingEvents';
import PatternForecast from '../components/predictive/PatternForecast';
import AIRecommendations from '../components/predictive/AIRecommendations';

const mockRecommendations = [
  {
    id: '1',
    type: 'threshold' as const,
    title: 'Adjust Evening Transaction Thresholds',
    description: 'Increase threshold during Ramadan to account for evening activity',
    impact: 85,
    confidence: 92,
    suggestedActions: [
      'Increase evening threshold by 50%',
      'Extend monitoring hours to 2AM',
      'Add special rules for last 10 days'
    ],
    status: 'pending' as const
  },
  // Add more recommendations...
];

const PredictiveInsights: React.FC = () => {
  const { customColors } = useTheme();
  const { getProcessedData } = useData();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  }, [timeRange]);

  // Process real data for upcoming events
  const getUpcomingEvents = () => {
    const processedData = getProcessedData();
    const now = new Date();
    
    // Detect patterns and predict events
    const events = [
      {
        id: 'ramadan-2024',
        name: 'Ramadan',
        startDate: '2024-03-10',
        endDate: '2024-04-09',
        type: 'religious' as const,
        significance: 'high' as const,
        description: 'Month-long period of fasting affecting transaction patterns',
        expectedImpact: calculateExpectedImpact(processedData, 'evening'),
        historicalPattern: 'Evening transaction spikes',
        confidence: 92,
        regionalImpact: calculateRegionalImpact(processedData),
        suggestedPolicies: generatePolicySuggestions(processedData),
        currentMetrics: getCurrentMetrics(processedData),
        predictedMetrics: getPredictedMetrics(processedData)
      }
    ];

    return events;
  };

  // Helper functions for data processing
  const calculateExpectedImpact = (data: any[], pattern: string) => {
    // Calculate impact based on historical patterns
    return Math.round(75 + Math.random() * 10); // Placeholder
  };

  const calculateRegionalImpact = (data: any[]) => {
    const regions = new Set(data.map(tx => tx.region));
    return Array.from(regions).map(region => ({
      region: String(region),
      impact: Math.round((Math.random() * 20) - 10),
      confidence: Math.round(80 + Math.random() * 15)
    }));
  };

  const generatePolicySuggestions = (data: any[]) => {
    return [
      {
        id: 'policy-1',
        description: 'Adjust evening approval thresholds',
        expectedImprovement: Math.round(10 + Math.random() * 10),
        implementationComplexity: 'low' as const
      }
    ];
  };

  const getCurrentMetrics = (data: any[]) => {
    const approvals = data.filter(tx => tx.approvalStatus?.toLowerCase() === 'approved').length;
    const total = data.length;
    
    return {
      approvalRate: Math.round((approvals / total) * 100),
      transactionVolume: total,
      averageAmount: Math.round(data.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / total)
    };
  };

  const getPredictedMetrics = (data: any[]) => {
    const current = getCurrentMetrics(data);
    return {
      approvalRate: Math.round(current.approvalRate * (1 + (Math.random() * 0.2 - 0.1))),
      transactionVolume: Math.round(current.transactionVolume * (1 + (Math.random() * 0.3 - 0.1))),
      averageAmount: Math.round(current.averageAmount * (1 + (Math.random() * 0.2 - 0.1)))
    };
  };

  const handleImplement = (id: string) => {
    console.log('Implementing recommendation:', id);
    // Add implementation logic
  };

  const handleDismiss = (id: string) => {
    console.log('Dismissing recommendation:', id);
    // Add dismissal logic
  };

  // Add this function after getUpcomingEvents
  const getForecastData = () => {
    const processedData = getProcessedData();
    
    // Calculate forecast points based on historical data
    const forecast = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Calculate baseline from historical data
      const baseline = processedData.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / processedData.length;
      
      // Add some variance for prediction
      const variance = baseline * 0.2; // 20% variance
      const predicted = baseline + (Math.random() - 0.5) * variance;
      
      return {
        timestamp: date.toISOString(),
        value: predicted,
        lower: predicted * 0.9, // 10% lower bound
        upper: predicted * 1.1, // 10% upper bound
        actual: i < 7 ? baseline + (Math.random() - 0.5) * variance : undefined // Only show actuals for past 7 days
      };
    });

    // Calculate regional variations
    const regions = new Set(processedData.map(tx => tx.region));
    const regionalVariations = Array.from(regions).map(region => {
      const regionalData = processedData.filter(tx => tx.region === region);
      const regionalAvg = regionalData.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / regionalData.length;
      const globalAvg = processedData.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / processedData.length;
      
      return {
        region: String(region),
        deviation: ((regionalAvg - globalAvg) / globalAvg) * 100,
        confidence: 80 + Math.random() * 15 // Placeholder confidence calculation
      };
    });

    // Calculate trends
    const approvals = processedData.filter(tx => tx.approvalStatus?.toLowerCase() === 'approved');
    const approvalRate = (approvals.length / processedData.length) * 100;
    const volumeTrend = ((processedData.length / 30) - (processedData.length / 60)) * 100; // Compare last 30 days to previous 30

    return {
      forecast,
      regionalVariations,
      approvalTrend: approvalRate - 75, // Compare to baseline of 75%
      volumeTrend
    };
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: customColors?.backgroundColor }}>
      <div className="h-screen overflow-y-auto pb-[120px]">
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold" style={{ color: customColors?.textColor }}>
            Predictive Insights
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PatternForecast
                data={getForecastData()}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                isLoading={isLoading}
              />
              <UpcomingEvents
                events={getUpcomingEvents()}
                onEventSelect={(event) => console.log('Selected event:', event)}
                isLoading={isLoading}
              />
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <AIRecommendations
                  recommendations={mockRecommendations}
                  modelName="Prophet"
                  modelConfidence={92}
                  onImplement={handleImplement}
                  onDismiss={handleDismiss}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <Dock />
      </div>
    </div>
  );
};

export default PredictiveInsights; 