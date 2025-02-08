import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, Clock, TrendingUp, AlertCircle, MapPin, Settings, ChevronRight } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { ChartData } from 'chart.js';

interface EventPrediction {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'religious' | 'regional' | 'national';
  significance: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: number;
  historicalPattern: string;
  confidence: number;
  regionalImpact: {
    region: string;
    impact: number;
    confidence: number;
  }[];
  suggestedPolicies: {
    id: string;
    description: string;
    expectedImprovement: number;
    implementationComplexity: 'low' | 'medium' | 'high';
  }[];
  currentMetrics: {
    approvalRate: number;
    transactionVolume: number;
    averageAmount: number;
  };
  predictedMetrics: {
    approvalRate: number;
    transactionVolume: number;
    averageAmount: number;
  };
}

interface Props {
  events: EventPrediction[];
  onEventSelect?: (event: EventPrediction) => void;
  isLoading?: boolean;
}

const UpcomingEvents: React.FC<Props> = ({
  events,
  onEventSelect,
  isLoading = false
}) => {
  const earliestEvent = events.reduce((earliest, event) => {
    const eventStart = new Date(event.startDate);
    return !earliest || eventStart < new Date(earliest.startDate) ? event : earliest;
  }, events[0]);

  
  const { customColors } = useTheme();
  const { selectedFocus } = useData();
  const [selectedEvent, setSelectedEvent] = useState<EventPrediction | null>(null);
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationParams, setSimulationParams] = useState({
    approvalThreshold: 0,
    creditLimit: 0,
    riskTolerance: 0
  });
  const [currentYear, setCurrentYear] = useState(
    earliestEvent ? new Date(earliestEvent.startDate).getFullYear() : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    earliestEvent ? new Date(earliestEvent.startDate).getMonth() : new Date().getMonth()
  );

  // Helper functions
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const renderCalendarView = (events: EventPrediction[]) => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const weeks = Math.ceil((daysInMonth + firstDayOfMonth) / 7);

    const getEventsForDay = (day: number) => {
      const eventsList = events.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        const currentDate = new Date(currentYear, currentMonth, day);
        
        // Normalize all dates to midnight
        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        console.log('Checking date:', {
          currentDate: currentDate.toISOString(),
          eventStart: eventStart.toISOString(),
          eventEnd: eventEnd.toISOString(),
          isWithinRange: currentDate >= eventStart && currentDate <= eventEnd
        });
        
        return currentDate >= eventStart && currentDate <= eventEnd;
      });
      
      console.log(`Events for day ${day}:`, eventsList);
      return eventsList;
    };

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(prev => prev - 1);
              } else {
                setCurrentMonth(prev => prev - 1);
              }
            }}
            className="p-2 rounded hover:bg-opacity-10"
            style={{ backgroundColor: `${customColors?.backgroundColor}20` }}
          >
            ←
          </button>
          <span className="font-medium">
            {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(prev => prev + 1);
              } else {
                setCurrentMonth(prev => prev + 1);
              }
            }}
            className="p-2 rounded hover:bg-opacity-10"
            style={{ backgroundColor: `${customColors?.backgroundColor}20` }}
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium p-2" style={{ color: customColors?.textColor }}>
              {day}
            </div>
          ))}
          
          {Array.from({ length: weeks * 7 }, (_, i) => {
            const day = i - firstDayOfMonth + 1;
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day > 0 && day <= daysInMonth;
            
            return (
              <div
                key={i}
                className={`p-2 min-h-[80px] rounded ${isCurrentMonth ? 'bg-opacity-10' : 'bg-opacity-5'}`}
                style={{ backgroundColor: customColors?.backgroundColor }}
              >
                {isCurrentMonth && (
                  <>
                    <div className="text-sm mb-1" style={{ color: customColors?.textColor }}>{day}</div>
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded mb-1"
                        style={{
                          backgroundColor: event.significance === 'high' ? '#fee2e2' :
                                         event.significance === 'medium' ? '#fef3c7' : '#dbeafe',
                          color: event.significance === 'high' ? '#ef4444' :
                                 event.significance === 'medium' ? '#f59e0b' : '#3b82f6'
                        }}
                      >
                        {event.name}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTrendChart = (event: EventPrediction) => {
    const chartData: ChartData<'line'> = {
      labels: [
        new Date(event.startDate).toLocaleDateString(),
        // Add 3 points in between
        ...Array.from({ length: 3 }, (_, i) => {
          const date = new Date(event.startDate);
          date.setDate(date.getDate() + Math.round((i + 1) * (new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / 4));
          return date.toLocaleDateString();
        }),
        new Date(event.endDate).toLocaleDateString()
      ],
      datasets: [
        {
          label: 'Predicted',
          data: [
            event.currentMetrics.approvalRate,
            // Generate smooth transition to predicted rate
            ...Array.from({ length: 3 }, (_, i) => {
              const diff = event.predictedMetrics.approvalRate - event.currentMetrics.approvalRate;
              return event.currentMetrics.approvalRate + (diff * (i + 1) / 4);
            }),
            event.predictedMetrics.approvalRate
          ],
          borderColor: String(customColors?.primary),
          tension: 0.4,
          fill: false
        }
      ]
    };

    return (
      <div className="h-32 mt-4">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: false
              }
            }
          }}
        />
      </div>
    );
  };

  const renderMetricsComparison = (event: EventPrediction) => (
    <div className="mt-4 p-4 rounded-lg bg-opacity-50" style={{ backgroundColor: customColors?.backgroundColor }}>
      <h5 className="text-sm font-medium mb-3" style={{ color: customColors?.textColor }}>
        Impact Analysis
      </h5>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm opacity-75 mb-1" style={{ color: customColors?.textColor }}>
            Approval Rate
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: customColors?.textColor }}>
              {event.currentMetrics.approvalRate}% →{' '}
              <span className={event.predictedMetrics.approvalRate > event.currentMetrics.approvalRate ? 
                'text-green-500' : 'text-red-500'}>
                {event.predictedMetrics.approvalRate}%
              </span>
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm opacity-75 mb-1" style={{ color: customColors?.textColor }}>
            Transaction Volume
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: customColors?.textColor }}>
              {event.currentMetrics.transactionVolume} →{' '}
              <span className={event.predictedMetrics.transactionVolume > event.currentMetrics.transactionVolume ? 
                'text-green-500' : 'text-red-500'}>
                {event.predictedMetrics.transactionVolume}
              </span>
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm opacity-75 mb-1" style={{ color: customColors?.textColor }}>
            Average Amount
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: customColors?.textColor }}>
              ${event.currentMetrics.averageAmount} →{' '}
              <span className={event.predictedMetrics.averageAmount > event.currentMetrics.averageAmount ? 
                'text-green-500' : 'text-red-500'}>
                ${event.predictedMetrics.averageAmount}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Add trend chart */}
      {renderTrendChart(event)}
    </div>
  );

  const renderRegionalImpact = (event: EventPrediction) => (
    <div className="mt-4">
      <h5 className="text-sm font-medium mb-3" style={{ color: customColors?.textColor }}>
        Regional Impact
      </h5>
      <div className="space-y-2">
        {event.regionalImpact.map((region) => (
          <div 
            key={region.region}
            className="flex items-center justify-between p-2 rounded"
            style={{ backgroundColor: `${customColors?.backgroundColor}40` }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: customColors?.textColor }} />
              <span className="text-sm" style={{ color: customColors?.textColor }}>
                {region.region}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: customColors?.textColor }}>
                {region.impact > 0 ? '+' : ''}{region.impact}%
              </span>
              <span className="text-xs opacity-75" style={{ color: customColors?.textColor }}>
                {region.confidence}% confidence
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPolicySuggestions = (event: EventPrediction) => (
    <div className="mt-4">
      <h5 className="text-sm font-medium mb-3" style={{ color: customColors?.textColor }}>
        Suggested Policy Adjustments
      </h5>
      <div className="space-y-2">
        {event.suggestedPolicies.map((policy) => (
          <div 
            key={policy.id}
            className="p-3 rounded"
            style={{ backgroundColor: `${customColors?.backgroundColor}40` }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm" style={{ color: customColors?.textColor }}>
                {policy.description}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                policy.implementationComplexity === 'low' ? 'bg-green-100 text-green-800' :
                policy.implementationComplexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {policy.implementationComplexity}
              </span>
            </div>
            <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
              Expected improvement: +{policy.expectedImprovement}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSimulationControls = () => (
    <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: `${customColors?.backgroundColor}40` }}>
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-sm font-medium" style={{ color: customColors?.textColor }}>
          Simulation Controls
        </h5>
        <button
          className="text-sm px-3 py-1 rounded-lg"
          style={{ 
            backgroundColor: customColors?.backgroundColor,
            color: customColors?.textColor
          }}
          onClick={() => setShowSimulation(!showSimulation)}
        >
          {showSimulation ? 'Hide' : 'Show'} Controls
        </button>
      </div>

      {showSimulation && (
        <div className="space-y-4">
          <div>
            <label className="text-sm mb-1 block" style={{ color: customColors?.textColor }}>
              Approval Threshold Adjustment
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              value={simulationParams.approvalThreshold}
              onChange={(e) => setSimulationParams(prev => ({
                ...prev,
                approvalThreshold: parseInt(e.target.value)
              }))}
              className="w-full"
            />
            <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
              {simulationParams.approvalThreshold > 0 ? '+' : ''}{simulationParams.approvalThreshold}%
            </div>
          </div>

          <div>
            <label className="text-sm mb-1 block" style={{ color: customColors?.textColor }}>
              Credit Limit Adjustment
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              value={simulationParams.creditLimit}
              onChange={(e) => setSimulationParams(prev => ({
                ...prev,
                creditLimit: parseInt(e.target.value)
              }))}
              className="w-full"
            />
            <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
              {simulationParams.creditLimit > 0 ? '+' : ''}{simulationParams.creditLimit}%
            </div>
          </div>

          <div>
            <label className="text-sm mb-1 block" style={{ color: customColors?.textColor }}>
              Risk Tolerance Adjustment
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              value={simulationParams.riskTolerance}
              onChange={(e) => setSimulationParams(prev => ({
                ...prev,
                riskTolerance: parseInt(e.target.value)
              }))}
              className="w-full"
            />
            <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
              {simulationParams.riskTolerance > 0 ? '+' : ''}{simulationParams.riskTolerance}%
            </div>
          </div>

          <button
            className="w-full py-2 rounded-lg bg-blue-500 text-white mt-4"
            onClick={() => {
              // Add simulation logic here
              console.log('Running simulation with params:', simulationParams);
            }}
          >
            Run Simulation
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: customColors?.tileColor }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium mb-1" style={{ color: customColors?.textColor }}>
            Upcoming Cultural Events
          </h3>
          <div className="flex items-center gap-2 text-sm opacity-75" style={{ color: customColors?.textColor }}>
            <Calendar className="w-4 h-4" />
            <span>{events.length} events predicted</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded-lg text-sm ${
              view === 'timeline' ? 'bg-blue-500 text-white' : ''
            }`}
            style={view !== 'timeline' ? { 
              backgroundColor: customColors?.backgroundColor,
              color: customColors?.textColor
            } : {}}
            onClick={() => setView('timeline')}
          >
            Timeline
          </button>
          <button
            className={`px-3 py-1 rounded-lg text-sm ${
              view === 'calendar' ? 'bg-blue-500 text-white' : ''
            }`}
            style={view !== 'calendar' ? { 
              backgroundColor: customColors?.backgroundColor,
              color: customColors?.textColor
            } : {}}
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Events View */}
      {view === 'calendar' ? (
        renderCalendarView(events)
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div
              key={event.id}
              className={`rounded-lg cursor-pointer transition-all ${
                selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ 
                backgroundColor: `${customColors?.backgroundColor}20`,
                borderLeft: `4px solid ${
                  event.significance === 'high' ? '#ef4444' :
                  event.significance === 'medium' ? '#f59e0b' : '#3b82f6'
                }`
              }}
            >
              {/* Event Header - Always visible */}
              <div 
                className="p-4"
                onClick={() => {
                  setSelectedEvent(selectedEvent?.id === event.id ? null : event);
                  onEventSelect?.(event);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium" style={{ color: customColors?.textColor }}>
                      {event.name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm opacity-75" style={{ color: customColors?.textColor }}>
                      <Clock className="w-4 h-4" />
                      <span>{formatDateRange(event.startDate, event.endDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-medium ${getSignificanceColor(event.significance)}`}>
                      {event.significance.toUpperCase()}
                    </div>
                    <ChevronRight 
                      className={`w-4 h-4 transition-transform ${
                        selectedEvent?.id === event.id ? 'rotate-90' : ''
                      }`}
                      style={{ color: customColors?.textColor }}
                    />
                  </div>
                </div>

                <p className="text-sm mb-3 opacity-75" style={{ color: customColors?.textColor }}>
                  {event.description}
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1" style={{ color: customColors?.textColor }}>
                      Expected Impact
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm" style={{ color: customColors?.textColor }}>
                        {event.expectedImpact}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1" style={{ color: customColors?.textColor }}>
                      Historical Pattern
                    </div>
                    <div className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                      {event.historicalPattern}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1" style={{ color: customColors?.textColor }}>
                      Confidence
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm" style={{ color: customColors?.textColor }}>
                        {event.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content - Only visible when selected */}
              {selectedEvent?.id === event.id && (
                <div className="px-4 pb-4">
                  {/* Metrics Comparison */}
                  {renderMetricsComparison(event)}

                  {/* Regional Impact */}
                  {renderRegionalImpact(event)}

                  {/* Policy Suggestions */}
                  {renderPolicySuggestions(event)}

                  {/* Simulation Controls */}
                  {renderSimulationControls()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;