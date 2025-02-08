import React, { useState, FC, useEffect } from "react";
import {
  DndContext as DndContextType,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import GridItem from "../components/dashboard/GridItem";
import Dock from "../components/navigation/Dock";
import { useTheme } from "../context/ThemeContext";
import "../styles/components/grid.css";
import "../styles/components/dock.css";
import FlickeringGrid from "../components/ui/flickering-grid";
import CulturalAlignmentScore from "../components/dashboard/CulturalAlignmentScore";
import ActiveCulturalPeriods from "../components/dashboard/ActiveCulturalPeriods";
import { 
  CommunityImpactData,
  CulturalEventAnalyticsData,
  CulturalDecisionData,
  TimelineDataPoint,
  EventInsight
} from '../types/dashboard';
import CulturalPatternAlerts, { AlertTimelineData, PatternType } from "../components/dashboard/CulturalPatternAlerts";
import Modal from "../components/modals/Modal";
import CommunityImpactMap from "../components/dashboard/CommunityImpactMap";
import CulturalEventAnalytics from "../components/dashboard/CulturalEventAnalytics";
import CulturalDecisionImpact from "../components/dashboard/CulturalDecisionImpact";
import { useData } from '../context/DataContext';
import { getBestForecast } from '../services/api';

interface Item {
  id: string;
  title: string;
  type: 'metric' | 'chart';
  content: JSX.Element;
}

const DndContext = DndContextType as FC<any>;

const Dashboard: React.FC = () => {
  // 1. Context and State
  const { customColors, currentLayout, layouts, backgroundConfig } = useTheme();
  const { getProcessedData, columnMapping, selectedFocus } = useData();
  const [modalType, setModalType] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);

  // 2. Utility Functions
  const isCulturalPeriod = (date: string): boolean => {
    const d = new Date(date);
    
    // Weekend detection
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    
    // Holiday detection
    const month = d.getMonth();
    const day = d.getDate();
    const isHoliday = (
      (month === 11 && day >= 20) || // Christmas period
      (month === 0 && day <= 2) ||   // New Year
      (month === 6 && day === 4)     // Independence Day
    );
    
    return isWeekend || isHoliday;
  };
  const detectSignificantEvents = (
    timelineData: Array<TimelineDataPoint>, 
    dailyData: Record<number, any>
  ): Array<EventInsight> => {
    const events: EventInsight[] = [];
    const windowSize = 7; // 7-day window

    for (let i = windowSize; i < timelineData.length; i++) {
      const window = timelineData.slice(i - windowSize, i);
      const avgDifference = window.reduce((sum, d) => sum + d.difference, 0) / windowSize;

      if (avgDifference > 1000) { // Significant difference threshold
        const startDate = window[0].timestamp;
        const endDate = window[window.length - 1].timestamp;
        
        events.push({
          id: `event-${i}`,
          eventName: `Pattern Change ${new Date(startDate).toLocaleDateString()}`,
          period: { start: startDate, end: endDate },
          metrics: {
            averageIncrease: avgDifference / 10, // Scale for display
            peakDifference: Math.max(...window.map(d => d.difference)),
            duration: windowSize,
            patternConfidence: 85,
            adaptationProgress: 70,
            volumeChange: window[window.length - 1].eventValue - window[0].eventValue
          },
          patterns: [
            {
              phase: 'before',
              change: window[0].difference,
              trend: window[0].eventValue > window[0].normalValue ? 'increasing' : 'decreasing'
            },
            {
              phase: 'during',
              change: avgDifference,
              trend: 'stable'
            },
            {
              phase: 'after',
              change: window[window.length - 1].difference,
              trend: window[window.length - 1].eventValue > window[window.length - 1].normalValue ? 'increasing' : 'decreasing'
            }
          ],
          recommendations: [
            'Monitor pattern progression',
            'Review approval thresholds',
            'Check regional distribution'
          ]
        });
      }
    }

    return events;
  };

  // 3. Data Processing Functions
  const getDecisionImpactData = (): CulturalDecisionData => {
    const processedData = getProcessedData() as Array<{
      transactionDate: string;
      amount: string;
      approvalStatus: string;
      region: string;
    }>;
  
    const timelineData = processedData.map(d => ({
      date: d.transactionDate,
      culturalPeriod: isCulturalPeriod(d.transactionDate),
      approvals: d.approvalStatus?.toLowerCase() === 'approved' ? 1 : 0,
      rejections: d.approvalStatus?.toLowerCase() === 'rejected' ? 1 : 0,
      totalAmount: parseFloat(d.amount),
      region: d.region
    }));
  
    const culturalPeriodData = timelineData.filter(d => d.culturalPeriod);
    const normalPeriodData = timelineData.filter(d => !d.culturalPeriod);
  
    const calculateStats = (data: typeof timelineData) => {
      if (!data.length) return {
        approvalRate: 0,
        totalDecisions: 0,
        averageAmount: 0
      };
      
      return {
        approvalRate: data.reduce((sum, d) => sum + d.approvals, 0) / 
                     Math.max(data.reduce((sum, d) => sum + d.approvals + d.rejections, 0), 1),
        totalDecisions: data.reduce((sum, d) => sum + d.approvals + d.rejections, 0),
        averageAmount: data.reduce((sum, d) => sum + d.totalAmount, 0) / data.length
      };
    };
  
    const detectEvents = () => {
      const events = [];
      const windowSize = 7; // 7-day window
      
      for (let i = windowSize; i < timelineData.length; i++) {
        const window = timelineData.slice(i - windowSize, i);
        const currentApprovalRate = window.reduce((sum, d) => sum + d.approvals, 0) / 
          Math.max(window.reduce((sum, d) => sum + d.approvals + d.rejections, 0), 1);
        
        if (currentApprovalRate > 0.85 || currentApprovalRate < 0.65) {
          const timestamp = new Date(window[0].date).getTime();
          events.push({
            name: `${currentApprovalRate > 0.85 ? 'Approval Spike' : 'Approval Drop'} ${i}-${timestamp}`,
            period: {
              start: window[0].date,
              end: window[window.length - 1].date
            },
            approvalDelta: (currentApprovalRate - 0.75) * 100
          });
        }
      }
      
      return events;
    };
  
    return {
      timelineData,
      regionalData: Object.entries(
        timelineData.reduce((acc, d) => {
          if (!acc[d.region]) {
            acc[d.region] = {
              culturalPeriods: { approvals: 0, total: 0, amount: 0 },
              normalPeriods: { approvals: 0, total: 0, amount: 0 }
            };
          }
          const target = d.culturalPeriod ? 'culturalPeriods' : 'normalPeriods';
          acc[d.region][target].total++;
          acc[d.region][target].amount += d.totalAmount;
          acc[d.region][target].approvals += d.approvals;
          return acc;
        }, {} as Record<string, any>)
      ).map(([region, data]) => ({
        region,
        culturalPeriods: {
          approvalRate: data.culturalPeriods.approvals / Math.max(data.culturalPeriods.total, 1),
          totalDecisions: data.culturalPeriods.total,
          totalAmount: data.culturalPeriods.amount
        },
        normalPeriods: {
          approvalRate: data.normalPeriods.approvals / Math.max(data.normalPeriods.total, 1),
          totalDecisions: data.normalPeriods.total,
          totalAmount: data.normalPeriods.amount
        }
      })),
      summary: {
        culturalPeriods: calculateStats(culturalPeriodData),
        normalPeriods: calculateStats(normalPeriodData),
        significantEvents: detectEvents()
      }
    };
  };

  const getPatternAlertData = (): AlertTimelineData => {
    const processedData = getProcessedData() as Array<{
      transactionDate: string;
      amount: string;
      approvalStatus: string;
      region: string;
    }>;
  
    // Cultural period detection (reuse from getDecisionImpactData)
    const isCulturalPeriod = (date: string): boolean => {
      const d = new Date(date);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const month = d.getMonth();
      const day = d.getDate();
      const isHoliday = (
        (month === 11 && day >= 20) || // Christmas
        (month === 0 && day <= 2) ||   // New Year
        (month === 6 && day === 4)     // Independence Day
      );
      return isWeekend || isHoliday;
    };
  
    // Focus-specific metric calculation
    const getMetricsForFocus = (data: any, focusMode: string) => {
      switch (focusMode) {
        case 'pattern':
          const avgAmount = data.amount / data.total;
          return {
            value: avgAmount,
            baseline: 1000, // Example baseline
            actual: avgAmount,
            deviation: Math.abs(avgAmount - 1000)
          };
        case 'decision':
          const approvalRate = (data.approvals / data.total) * 100;
          return {
            value: approvalRate,
            baseline: 75,
            actual: approvalRate,
            deviation: Math.abs(approvalRate - 75)
          };
        case 'bias':
          // Calculate regional disparity
          const regionalRate = data.approvals / data.total;
          return {
            value: regionalRate * 100,
            baseline: 80,
            actual: regionalRate * 100,
            deviation: Math.abs(regionalRate * 100 - 80)
          };
        default:
          return null;
      }
    };
  
    // Group and process hourly data
    const hourlyData = processedData.reduce((acc, tx) => {
      const hour = new Date(tx.transactionDate).setMinutes(0, 0, 0);
      if (!acc[hour]) {
        acc[hour] = {
          approvals: 0,
          rejections: 0,
          total: 0,
          amount: 0,
          regions: {} as Record<string, number>
        };
      }
      acc[hour].total++;
      acc[hour].amount += parseFloat(tx.amount);
      acc[hour].regions[tx.region] = (acc[hour].regions[tx.region] || 0) + 1;
      if (tx.approvalStatus?.toLowerCase() === 'approved') {
        acc[hour].approvals++;
      } else {
        acc[hour].rejections++;
      }
      return acc;
    }, {} as Record<number, any>);
  
    // Generate timeline and alerts
    const timeline = Object.entries(hourlyData).map(([timestamp, data]) => {
      const metrics = getMetricsForFocus(data, selectedFocus || 'pattern') ?? {
        value: 0,
        baseline: 0,
        actual: 0,
        deviation: 0
      };
      
      return {
        timestamp: new Date(parseInt(timestamp)).toISOString(),
        alertCount: metrics.deviation > 15 ? 1 : 0,
        baseline: metrics.baseline,
        actual: metrics.actual
      };
    });
  
    // Generate alerts
    const alerts = timeline
      .filter(t => t.alertCount > 0)
      .map((t, i) => {
        const hourData = hourlyData[new Date(t.timestamp).getTime()];
        const metrics = getMetricsForFocus(hourData, selectedFocus || 'pattern') ?? {
          value: 0,
          baseline: 0,
          actual: 0,
          deviation: 0
        };
        
        return {
          id: `alert-${i}`,
          timestamp: t.timestamp,
          severity: (metrics.deviation > 25 ? 'high' : 
                   metrics.deviation > 20 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          patternType: selectedFocus as PatternType,
          culturalContext: isCulturalPeriod(t.timestamp) ? 
            'Cultural Period Alert' : 'Pattern Alert',
          metrics: {
            value: metrics.value,
            baseline: metrics.baseline,
            deviation: metrics.deviation
          },
          details: {
            description: `Unusual ${selectedFocus} pattern detected`,
            affectedRegions: Object.keys(hourData.regions),
            suggestedActions: [
              'Review recent activity patterns',
              'Check for cultural events correlation',
              'Monitor pattern progression'
            ]
          },
          adaptation: {
            status: 'learning' as 'learning' | 'adjusting' | 'monitoring',
            progress: 65,
            lastUpdate: new Date().toISOString()
          }
        };
      });
  
    return {
      timeline,
      alerts,
      summary: {
        total: alerts.length,
        byPattern: {
          spending: alerts.filter(a => a.patternType === 'spending').length,
          decision: alerts.filter(a => a.patternType === 'decision').length,
          bias: alerts.filter(a => a.patternType === 'bias').length
        },
        bySeverity: {
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        },
        adaptationProgress: 65
      }
    };
  };

  const getCommunityImpactData = (): CommunityImpactData => {
    const processedData = getProcessedData() as Array<{
      transactionDate: string;
      amount: string;
      approvalStatus: string;
      region: string;
    }>;
  
    // Add mapping for region names to ISO codes and coordinates
    const regionMapping: Record<string, { code: string; coordinates: { lat: number; lng: number } }> = {
      'Asia': { 
        code: 'CHN', // Using China as center point for Asia
        coordinates: { lat: 35.8617, lng: 104.1954 }
      },
      'Europe': { 
        code: 'DEU', // Using Germany as center point for Europe
        coordinates: { lat: 51.1657, lng: 10.4515 }
      },
      'North America': { 
        code: 'USA',
        coordinates: { lat: 37.0902, lng: -95.7129 }
      },
      // Add more regions as needed
    };
  
    // Group data by region
    const regionData = processedData.reduce((acc, tx) => {
      if (!acc[tx.region]) {
        acc[tx.region] = {
          approvals: 0,
          total: 0,
          amount: 0,
          culturalPeriods: new Set<string>()
        };
      }
      acc[tx.region].total++;
      acc[tx.region].amount += parseFloat(tx.amount);
      if (tx.approvalStatus?.toLowerCase() === 'approved') {
        acc[tx.region].approvals++;
      }
      return acc;
    }, {} as Record<string, any>);
  
    // Transform into CommunityImpactData format
    const regions = Object.entries(regionData).map(([name, data]) => ({
      id: `region-${name}`,
      name,
      code: regionMapping[name]?.code || name.substring(0, 3).toUpperCase(),
      coordinates: regionMapping[name]?.coordinates || { lat: 0, lng: 0 },
      metrics: {
        approvalRate: (data.approvals / data.total) * 100,
        culturalImpact: (data.approvals / data.total) * 90,
        totalDecisions: data.total,
        transactionVolume: data.amount
      },
      culturalFactors: [
        {
          name: 'Regional Pattern',
          influence: (data.approvals / data.total) * 100,
          trend: (data.approvals / data.total > 0.8 ? 'increasing' : 'stable') as 'increasing' | 'stable' | 'decreasing'
        }
      ]
    }));
  
    // Calculate summary
    const sortedByImpact = [...regions].sort((a, b) => 
      b.metrics.culturalImpact - a.metrics.culturalImpact
    );
  
    return {
      regions,
      summary: {
        totalRegions: regions.length,
        averageApprovalRate: regions.reduce((sum, r) => sum + r.metrics.approvalRate, 0) / regions.length,
        highestImpact: sortedByImpact[0]?.name || 'None',
        lowestImpact: sortedByImpact[sortedByImpact.length - 1]?.name || 'None'
      },
      filters: {
        countries: regions.map(r => r.name),
        culturalFactors: ['Regional Pattern']
      }
    };
  };

  const getEventAnalyticsData = async (): Promise<CulturalEventAnalyticsData> => {

    const processedData = getProcessedData() as Array<{
      transactionDate: string;
      amount: string;
      approvalStatus: string;
      region: string;
    }>;
  
    // Group data by date to calculate daily metrics
    const dailyData = processedData.reduce((acc, tx) => {
      const date = new Date(tx.transactionDate).setHours(0, 0, 0, 0);
      if (!acc[date]) {
        acc[date] = {
          approvals: 0,
          total: 0,
          amount: 0
        };
      }
      acc[date].total++;
      acc[date].amount += parseFloat(tx.amount);
      if (tx.approvalStatus?.toLowerCase() === 'approved') {
        acc[date].approvals++;
      }
      return acc;
    }, {} as Record<number, any>);
  
    // Prepare historical data for forecasting
    // In Dashboard.tsx, modify the historicalData creation:
    const historicalData = Object.entries(dailyData).map(([timestamp, data]) => ({
      // Remove timezone info by only taking the date part
      timestamp: new Date(parseInt(timestamp)).toISOString().split('T')[0],
      value: data.amount / data.total
    }));


    try {
      // Get forecast data
      const { forecast, modelUsed, confidence } = await getBestForecast(historicalData);

      // For historical data
      const timelineData: TimelineDataPoint[] = historicalData.map(point => ({
        timestamp: point.timestamp,
        value: point.value,
        eventValue: point.value,
        normalValue: point.value,
        difference: 0
      } as TimelineDataPoint));  // Add type assertion
  
      forecast.forEach(forecastPoint => {
        timelineData.push({
          timestamp: forecastPoint.timestamp,
          value: forecastPoint.value,
          forecast: forecastPoint.value,
          upper: forecastPoint.upper,
          lower: forecastPoint.lower,
          eventValue: forecastPoint.value,
          normalValue: forecastPoint.value,
          difference: 0
        } as TimelineDataPoint);
      });
  
      // Detect significant events
      const insights = detectSignificantEvents(timelineData, dailyData);
  
      const returnData = {
        timelineData,
        insights,
        summary: {
          totalEvents: insights.length,
          averageImpact: insights.reduce((sum, i) => sum + i.metrics.averageIncrease, 0) / 
                        Math.max(insights.length, 1),
          significantPatterns: [
            'Volume Changes',
            'Approval Rate Shifts', 
            'Regional Variations',
            `${modelUsed.toUpperCase()} Forecast Patterns`
          ],
          aiAdaptation: 75,
          forecastConfidence: confidence
        }
      };
      console.log('Returning data:', returnData);
      return returnData;
    } catch (error) {
      console.error('Error getting forecast:', error);
      
      // Fallback to historical data only
      const timelineData: TimelineDataPoint[] = historicalData.map(point => ({
        timestamp: point.timestamp,
        value: point.value,
        forecast: undefined,
        upper: undefined,
        lower: undefined,
        eventValue: point.value,
        normalValue: point.value,
        difference: 0
      } as TimelineDataPoint));
  
      const insights = detectSignificantEvents(timelineData, dailyData);
  
      return {
        timelineData,
        insights,
        summary: {
          totalEvents: insights.length,
          averageImpact: insights.reduce((sum, i) => sum + i.metrics.averageIncrease, 0) / 
                        Math.max(insights.length, 1),
          significantPatterns: ['Volume Changes', 'Approval Rate Shifts', 'Regional Variations'],
          aiAdaptation: 75
        }
      };
    }
  };

  // 4. Initial State
  const [items, setItems] = useState<Item[]>([
    { 
      id: "cultural-alignment", 
      title: "Cultural Alignment", 
      type: "metric",
      content: <CulturalAlignmentScore showFactors={true} />
    },
    { 
      id: "cultural-periods", 
      title: "Cultural Periods", 
      type: "metric",
      content: <ActiveCulturalPeriods />
    },
    { 
      id: "decision-impact", 
      title: "Decision Impact", 
      type: "metric",
      content: <CulturalDecisionImpact data={getDecisionImpactData()} />
    },
    { 
      id: "cultural-pattern-alerts", 
      title: "Cultural Pattern Alerts", 
      type: "metric",
      content: <CulturalPatternAlerts 
        data={getPatternAlertData()} 
        focusMode={selectedFocus || 'pattern'}
      />
    },
    { 
      id: "community-impact", 
      title: "Community Impact", 
      type: "metric",
      content: <CommunityImpactMap 
        data={getCommunityImpactData()} 
        focusMode={selectedFocus || 'pattern'}
      />
    },
    { 
      id: "event-analytics", 
      title: "Event Analytics", 
      type: "chart",
      content: <CulturalEventAnalytics 
        data={{
          timelineData: [],
          insights: [],
          summary: {
            totalEvents: 0,
            averageImpact: 0,
            significantPatterns: [],
            aiAdaptation: 0
          }
        }} 
        focusMode={selectedFocus || 'pattern'}
        isLoading={true}
      />
    }
  ]);

  // 5. Event Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    document.querySelectorAll<HTMLElement>(".grid-item").forEach((el) => {
      el.classList.remove("over");
      if (el.classList.contains(String(active.id))) {
        el.style.cursor = "grabbing";
      }
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    document.querySelectorAll<HTMLElement>(".grid-item").forEach((el) => {
      el.classList.remove("over");
    });

    const overElement = document.querySelector<HTMLElement>(`.grid-item.${String(over.id)}`);
    if (overElement && active.id !== over.id) {
      overElement.classList.add("over");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    document.querySelectorAll<HTMLElement>(".grid-item").forEach((el) => {
      el.classList.remove("over");
      el.style.cursor = "grab";
    });

    if (!over || active.id === over.id) return;

    setItems((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };
  
  // 6. UI/Render Functions
  const renderBackground = () => {
    const { type, config } = backgroundConfig;
    console.log('Rendering background type:', type);
    
    switch (type) {
      case 'gradient-analytics':
        return (
          <div className="absolute inset-0 w-full h-full" style={{
            background: `linear-gradient(to bottom right, ${customColors.backgroundColor}, white, ${customColors.tileColor})`
          }}/>
        );
      case 'enterprise-mesh':
        return (
          <div className="absolute inset-0 w-full h-full" style={{
            background: `linear-gradient(to right, ${customColors.backgroundColor}, ${customColors.tileColor}50)`
          }}/>
        );
      case 'clean-interface':
        return (
          <div className="absolute inset-0 w-full h-full" style={{
            backgroundColor: `${customColors.backgroundColor}80`
          }}/>
        );
      case 'flickering-grid':
        return (
          <div className="absolute inset-0 w-full h-full">
            <FlickeringGrid
              className="w-full h-full"
              squareSize={4}
              gridGap={6}
              color="#2563eb"
              maxOpacity={0.2}
              flickerChance={0.1}
            />
          </div>
        );
      case 'dot-pattern':
        return (
          <div className="absolute inset-0 w-full h-full" style={{ 
            backgroundColor: "#f8fafc",
            backgroundImage: `radial-gradient(#2563eb 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            opacity: 0.8
          }}/>
        );
      default:
        return null;
    }
  };

  const renderModalContent = (type: string) => {
    const item = items.find(i => i.id === type);
    if (!item) return null;
    
    return React.cloneElement(item.content, { 
      isFocused: true,
      isPreview: false 
    });
  };


  // 7. Effects
  useEffect(() => {
    let isMounted = true; // Add mounted check
  
    const loadEventAnalytics = async () => {
      try {
        const eventAnalyticsData = await getEventAnalyticsData();
        
        if (!isMounted) return; // Check if still mounted
  
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === "event-analytics" 
              ? {
                  ...item,
                  content: <CulturalEventAnalytics 
                    data={eventAnalyticsData}
                    focusMode={selectedFocus || 'pattern'}
                    isLoading={false}
                  />
                }
              : item
          )
        );
      } catch (error) {
        console.error('Error loading event analytics:', error);
        if (!isMounted) return;
        
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === "event-analytics" 
              ? {
                  ...item,
                  content: <CulturalEventAnalytics 
                    data={{
                      timelineData: [],
                      insights: [],
                      summary: {
                        totalEvents: 0,
                        averageImpact: 0,
                        significantPatterns: [],
                        aiAdaptation: 0
                      }
                    }}
                    focusMode={selectedFocus || 'pattern'}
                    isLoading={false}
                    error={error instanceof Error ? error.message : 'Failed to load event analytics'}
                  />
                }
              : item
          )
        );
      }
    };
  
    loadEventAnalytics();
  
    return () => {
      isMounted = false; // Cleanup
    };
  }, [selectedFocus, getProcessedData, customColors]); // Add getProcessedData to dependencies

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  return (
    <div className="min-h-screen relative">
      {/* Background layer */}
      {(backgroundConfig.type === 'flickering-grid' || backgroundConfig.type === 'dot-pattern') && (
        <div className="fixed inset-0">
          {renderBackground()}
        </div>
      )}

      {/* Content layer */}
      <div className="relative">
        <div
          className={`grid-container ${focusedItem ? "focus-mode" : ""}`}
          style={{
            gridTemplateColumns: layouts[currentLayout]?.gridTemplateColumns,
            gridTemplateRows: layouts[currentLayout]?.gridTemplateRows,
            backgroundColor: backgroundConfig.type === 'clean-interface' 
              ? customColors.backgroundColor
              : 'transparent',
            position: 'relative',
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map((item) => item.id)}>
              {items.map((item, index) => {
                const area = layouts[currentLayout]?.areas[index];
                return (
                  <GridItem
                    key={item.id}
                    item={item}
                    gridArea={area}
                    isFocused={focusedItem === item.id}
                    isHidden={!!focusedItem && focusedItem !== item.id}
                    onFocus={() => {
                      setFocusedItem(focusedItem === item.id ? null : item.id);
                      setModalType(item.id);
                    }}
                    customColors={customColors}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        <Dock />
      </div>

      {modalType && (
        <Modal
          isOpen={!!modalType}
          onClose={() => {
            setModalType(null);
            setFocusedItem(null);
          }}
          type={modalType}
        >
          {renderModalContent(modalType)}
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
