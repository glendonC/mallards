import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, TrendingUp, MapPin } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { ChartData } from 'chart.js';

interface RegionalImpact {
  region: string;
  impact: number;
  confidence: number;
}

interface EventMetrics {
  approvalRate: number;
  transactionVolume: number;
  averageAmount: number;
}

interface EventPrediction {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'cultural';
  significance: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: number;
  confidence: number;
  regionalImpact: RegionalImpact[];
  currentMetrics: EventMetrics;
  predictedMetrics: EventMetrics;
}

interface Props {
  onEventSelect?: (event: EventPrediction) => void;
  isLoading?: boolean;
}

const UpcomingEvents: React.FC<Props> = ({
  onEventSelect,
  isLoading: externalLoading = false
}) => {
  const { customColors } = useTheme();
  const { getProcessedData } = useData();
  const [events, setEvents] = useState<EventPrediction[]>([]);  // Internal state
  const [selectedEvent, setSelectedEvent] = useState<EventPrediction | null>(null);
  const [displayCount, setDisplayCount] = useState(5); // Number of events to show per month
const [expandedMonths, setExpandedMonths] = useState<string[]>([]); // Track expanded months

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const processedData = getProcessedData();
  
        if (!processedData || processedData.length === 0) {
          console.warn('No processed data available');
          setEvents([]);
          setIsLoading(false);
          return;
        }
  
        const API_BASE = 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/events/upcoming`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(processedData)
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
  
        const result = await response.json();
        setEvents(result.events);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchEvents();
  }, [getProcessedData]);
  
  // Group events by month
  const groupedEvents = events.reduce((groups, event) => {
    const month = new Date(event.startDate).toLocaleString('default', { 
      month: 'long',
      year: 'numeric' 
    });
    
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(event);
    return groups;
  }, {} as Record<string, EventPrediction[]>);
  
  const toggleMonth = (month: string) => {
  setExpandedMonths(prev => 
    prev.includes(month) 
      ? prev.filter(m => m !== month)
      : [...prev, month]
  );
};

  const isMonthExpanded = (month: string) => expandedMonths.includes(month);
  // Sort months chronologically
  const sortedMonths = Object.keys(groupedEvents).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const renderTrendChart = (event: EventPrediction) => {
    const chartData = {
      labels: ['Current', 'Predicted'],
      datasets: [
        {
          label: 'Approval Rate',
          data: [
            event.currentMetrics.approvalRate,
            event.predictedMetrics.approvalRate
          ],
          borderColor: String(customColors?.primary) || '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
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
              return `Approval Rate: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
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
      <div className="h-32 mt-4">
        <Line data={chartData} options={chartOptions} />
      </div>
    );
  };
  
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
            <span>{events.length} events detected</span>
          </div>
        </div>
      </div>
  
      {isLoading || externalLoading ? (
        <div className="flex items-center justify-center h-32">
          <span className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
            Loading events...
          </span>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedMonths.map(month => {
            const monthEvents = groupedEvents[month];
            const displayEvents = expandedMonths.includes(month) 
              ? monthEvents 
              : monthEvents.slice(0, displayCount);
            const hasMore = monthEvents.length > displayCount;
  
            return (
              <div key={month}>
                <div 
                  className="flex items-center justify-between mb-4 pb-2 border-b cursor-pointer"
                  onClick={() => toggleMonth(month)}
                  style={{ borderColor: `${customColors?.borderColor}40` }}
                >
                  <h4 className="text-md font-medium" style={{ color: customColors?.textColor }}>
                    {month}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-75" style={{ color: customColors?.textColor }}>
                      {monthEvents.length} events
                    </span>
                    {hasMore && !expandedMonths.includes(month) && (
                      <span className="text-xs text-blue-500">
                        Show all
                      </span>
                    )}
                  </div>
                </div>
  
                <div className="space-y-4">
                  {displayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`rounded-lg p-4 cursor-pointer transition-all ${
                        selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{ 
                        backgroundColor: `${customColors?.backgroundColor}20`,
                        borderLeft: `4px solid ${
                          Math.abs(event.expectedImpact) > 50 ? '#ef4444' : 
                          Math.abs(event.expectedImpact) > 25 ? '#f59e0b' : '#3b82f6'
                        }`
                      }}
                      onClick={() => {
                        setSelectedEvent(selectedEvent?.id === event.id ? null : event);
                        onEventSelect?.(event);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium" style={{ color: customColors?.textColor }}>
                            {event.name}
                          </h5>
                          <p className="text-sm opacity-75 mt-1" style={{ color: customColors?.textColor }}>
                            {event.description}
                          </p>
                        </div>
                        <div 
                          className={`text-sm font-medium ${
                            event.expectedImpact > 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {event.expectedImpact > 0 ? '+' : ''}{event.expectedImpact.toFixed(1)}%
                        </div>
                      </div>
  
                      {selectedEvent?.id === event.id && (
                        <div className="mt-4">
                          {renderTrendChart(event)}
                          
                          {event.regionalImpact.length > 0 && (
                            <div className="mt-4">
                              <h6 className="text-sm font-medium mb-2" style={{ color: customColors?.textColor }}>
                                Regional Impact
                              </h6>
                              <div className="grid gap-2">
                                {event.regionalImpact.map(region => (
                                  <div
                                    key={region.region}
                                    className="flex justify-between items-center p-2 rounded"
                                    style={{ backgroundColor: `${customColors?.backgroundColor}40` }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4" style={{ color: customColors?.textColor }} />
                                      <span className="text-sm" style={{ color: customColors?.textColor }}>
                                        {region.region}
                                      </span>
                                    </div>
                                    <span className={`text-sm ${
                                      region.impact > 0 ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                      {region.impact > 0 ? '+' : ''}{region.impact.toFixed(1)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
  
                  {!expandedMonths.includes(month) && hasMore && (
                    <button
                      className="w-full py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMonth(month);
                      }}
                    >
                      Show {monthEvents.length - displayCount} more events
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;