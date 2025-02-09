import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import Dock from '../components/navigation/Dock';
import UpcomingEvents from '../components/predictive/UpcomingEvents';
import PatternForecast from '../components/predictive/PatternForecast';
import PredictiveAIPanel from '../components/predictive/PredictiveAIPanel';
import { Bot } from 'lucide-react';

const PredictiveInsights: React.FC = () => {
  const { customColors } = useTheme();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [events, setEvents] = useState([]);
  
  const initialForecastData = {
    forecast: [],
    regionalVariations: [],
    approvalTrend: 0,
    volumeTrend: 0
  };

  const [forecastData, setForecastData] = useState(initialForecastData);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  }, [timeRange]);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: customColors?.backgroundColor }}>
      <div className="h-screen overflow-y-auto pb-[120px]">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: customColors?.textColor }}>
                Predictive Insights
              </h1>
              <p className="text-sm mt-1 opacity-75" style={{ color: customColors?.textColor }}>
                View forecasts and upcoming cultural events
              </p>
            </div>
            <button
              onClick={() => setIsAIPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              <Bot className="w-4 h-4" />
              <span>Analyze</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PatternForecast
                data={forecastData}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                isLoading={isLoading}
              />
              <UpcomingEvents
                onEventSelect={(event) => console.log('Selected event:', event)}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      <PredictiveAIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        data={{
          forecast: forecastData,
          events: events
        }}
        customColors={customColors}
      />

      <div className="fixed bottom-0 left-0 right-0">
        <Dock />
      </div>
    </div>
  );
};

export default PredictiveInsights;