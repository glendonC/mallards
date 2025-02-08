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
  EventInsight,
  CulturalPeriod,
  CulturalPeriodsData,
  AnalyzableComponent
} from '../types/dashboard';
import CulturalPatternAlerts, { AlertTimelineData, PatternType, PatternAlert } from "../components/dashboard/CulturalPatternAlerts";
import Modal from "../components/modals/Modal";
import CommunityImpactMap from "../components/dashboard/CommunityImpactMap";
import CulturalEventAnalytics from "../components/dashboard/CulturalEventAnalytics";
import CulturalDecisionImpact from "../components/dashboard/CulturalDecisionImpact";
import { useData } from '../context/DataContext';
import { getBestForecast, getCommunityImpact, getPatternPredictions } from '../services/api';
import { getFocusMetrics } from "@/utils/focusMetrics";
import { Bot } from "lucide-react";
import DashboardAIPanel from "@/components/dashboard/DashboardAIPanel";

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
  const [patternAlertsLoading, setPatternAlertsLoading] = useState(true);
  const [culturalPeriodsData, setCulturalPeriodsData] = useState<CulturalPeriodsData | null>(null);
  const [selectedComponentForAI, setSelectedComponentForAI] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [communityImpactData, setCommunityImpactData] = useState<CommunityImpactData>({
    
    regions: [],
    summary: {
      totalRegions: 0,
      averageApprovalRate: 0,
      highestImpact: '',
      lowestImpact: ''
    },
    filters: {
      countries: [],
      culturalFactors: []
    }
  });

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
    
    // Calculate baseline statistics
    const values = timelineData.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );
    
    // Dynamic threshold based on data characteristics
    const threshold = stdDev * 2; // 2 standard deviations
    
    for (let i = windowSize; i < timelineData.length; i++) {
      const window = timelineData.slice(i - windowSize, i);
      
      // Calculate moving average
      const movingAvg = window.reduce((sum, d) => sum + d.value, 0) / windowSize;
      
      // Calculate deviation from baseline
      const deviation = Math.abs(movingAvg - mean);
      
      // Detect if current window represents cultural period
      const startDate = new Date(window[0].timestamp);
      const isCulturalPeriodForWindow = isCulturalPeriod(startDate.toISOString());
      
      if (deviation > threshold || isCulturalPeriodForWindow) {
        const peakValue = Math.max(...window.map(d => d.value));
        const volumeChange = ((window[window.length - 1].value - window[0].value) / window[0].value) * 100;
        
        events.push({
          id: `event-${i}`,
          eventName: isCulturalPeriodForWindow ? 
            `Cultural Period Impact ${startDate.toLocaleDateString()}` : 
            `Pattern Change ${startDate.toLocaleDateString()}`,
          period: {
            start: window[0].timestamp,
            end: window[window.length - 1].timestamp
          },
          metrics: {
            averageIncrease: ((movingAvg - mean) / mean) * 100,
            peakDifference: ((peakValue - mean) / mean) * 100,
            duration: windowSize,
            patternConfidence: isCulturalPeriodForWindow ? 90 : 75,
            adaptationProgress: isCulturalPeriodForWindow ? 85 : 65,
            volumeChange
          },
          patterns: [
            {
              phase: 'before',
              change: ((window[0].value - mean) / mean) * 100,
              trend: window[0].value > mean ? 'increasing' : 'decreasing'
            },
            {
              phase: 'during',
              change: ((movingAvg - mean) / mean) * 100,
              trend: 'stable'
            },
            {
              phase: 'after',
              change: ((window[window.length - 1].value - mean) / mean) * 100,
              trend: window[window.length - 1].value > movingAvg ? 'increasing' : 'decreasing'
            }
          ],
          recommendations: isCulturalPeriodForWindow ? [
            `Adjust thresholds by ${volumeChange > 0 ? '+' : ''}${volumeChange.toFixed(1)}%`,
            `Review ${(Math.abs(movingAvg - mean) / mean * 100).toFixed(1)}% pattern deviation`,
            `Analyze impact across ${dailyData[startDate.getTime()]?.regions?.length || 0} regions`
          ] : [
            `Investigate ${Math.abs(deviation).toFixed(1)}% deviation from baseline`,
            `Monitor ${window.length}-day trend progression`,
            `Compare with historical patterns (${mean.toFixed(1)} average)`
          ]
        });
      }
    }
  
    return events;
  };
  const calculateThresholds = (data: Array<{
    transactionDate: string;
    amount: string;
    approvalStatus: string;
    region: string;
  }>) => {
    // Group transactions by hour first
    const hourlyVolumes = data.reduce((acc, tx) => {
      const hour = new Date(tx.transactionDate).setMinutes(0, 0, 0);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  
    const volumes = Object.values(hourlyVolumes);
    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const stdDev = Math.sqrt(
      volumes.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / volumes.length
    );
    
    return {
      alert: mean + stdDev,
      high: mean + (2 * stdDev),
      medium: mean + (1.5 * stdDev),
      low: mean + stdDev
    };
  };
  const groupAlerts = (alerts: PatternAlert[]) => {
    return alerts.reduce((groups, alert) => {
      const date = new Date(alert.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(alert);
      return groups;
    }, {} as Record<string, PatternAlert[]>);
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

  const generateSuggestedActions = (
    hourData: { transactions: any[], regions: Set<string> },
    severity: 'high' | 'medium' | 'low',
    focusMode: string,
    deviation: number,
    isCulturalPeriod: boolean
  ): string[] => {
    const actions = [];
    
    if (severity === 'high') {
      actions.push(`Urgent: Review ${hourData.transactions.length} transactions in ${hourData.regions.size} regions`);
      actions.push(`Investigate ${Math.abs(deviation).toFixed(1)}% deviation from baseline`);
    }
    
    if (isCulturalPeriod) {
      actions.push(`Adjust thresholds for cultural period impact`);
      actions.push(`Monitor regional distribution changes`);
    } else {
      actions.push(`Check for pattern correlation with ${focusMode} metrics`);
    }
    
    if (hourData.regions.size > 3) {
      actions.push(`Analyze impact across ${hourData.regions.size} affected regions`);
    }
    
    return actions;
  };

  const getPatternAlertData = async (): Promise<AlertTimelineData> => {
    setPatternAlertsLoading(true);
    try {
      const processedData = getProcessedData() as Array<{
        transactionDate: string;
        amount: string;
        approvalStatus: string;
        region: string;
      }>;
  
      // Get predictions first
      const predictions = await getPatternPredictions(
        processedData,
        {
          focusMode: selectedFocus || 'pattern',
          window: '24h',
          sensitivity: getFocusMetrics(selectedFocus || 'pattern').threshold
        }
      );
      
      const hourlyData = processedData.reduce((acc, row) => {
        const timestamp = new Date(row.transactionDate).getTime();
        if (!acc[timestamp]) {
          acc[timestamp] = {
            transactions: [],
            regions: new Set()
          };
        }
        acc[timestamp].transactions.push(row);
        acc[timestamp].regions.add(row.region);
        return acc;
      }, {} as Record<number, { transactions: any[], regions: Set<string> }>);

      // Add threshold calculation
      const thresholds = calculateThresholds(processedData);

      // Update timeline and alerts to use dynamic thresholds
      const timeline = Object.entries(hourlyData).map(([timestamp, data]) => ({
        timestamp: new Date(parseInt(timestamp)).toISOString(),
        alertCount: data.transactions.length > thresholds.alert ? 1 : 0,
        baseline: thresholds.alert,
        actual: data.transactions.length
      }));

      const alerts = timeline
        .filter(t => t.alertCount > 0)
        .map((t, i) => {
          const hourData = hourlyData[new Date(t.timestamp).getTime()];
          const severity = (
            hourData.transactions.length > thresholds.high ? 'high' :
            hourData.transactions.length > thresholds.medium ? 'medium' : 'low'
          ) as 'high' | 'medium' | 'low';
          const prediction = predictions.find((p: { timestamp: string }) => p.timestamp === t.timestamp);
          const deviation = ((hourData.transactions.length - thresholds.alert) / thresholds.alert) * 100;

          return {
            id: `alert-${i}`,
            timestamp: t.timestamp,
            severity,
            patternType: selectedFocus as PatternType,
            culturalContext: isCulturalPeriod(t.timestamp) ? 
              'Cultural Period Alert' : 'Pattern Alert',
            metrics: {
              value: hourData.transactions.length,
              baseline: thresholds.alert,
              deviation
            },
            details: {
              description: `Unusual ${selectedFocus} pattern detected`,
              affectedRegions: Array.from(hourData.regions),
              suggestedActions: generateSuggestedActions(
                hourData,
                severity,
                selectedFocus || 'pattern',
                deviation,
                isCulturalPeriod(t.timestamp)
              )
            },
            adaptation: {
              status: 'learning' as 'learning' | 'adjusting' | 'monitoring',
              progress: 65,
              lastUpdate: new Date().toISOString()
            },
            prediction,
            modelInsights: {
              featureImportance: {
                'time_of_day': 0.4,
                'day_of_week': 0.3,
                'region': 0.3
              },
              similarPatterns: timeline
                .slice(Math.max(0, i-3), i)
                .map(pt => ({
                  timestamp: pt.timestamp,
                  similarity: 0.8 + Math.random() * 0.2
                }))
            }
          };
        });

      const groupedAlerts = groupAlerts(alerts);

      return {
        timeline,
        alerts,
        groupedAlerts,
        predictions,
        modelMetrics: {
          accuracy: 85,
          lastTraining: new Date().toISOString(),
          drift: 0.05
        },
        summary: {
          total: alerts.length,
          byPattern: {
            [selectedFocus || 'pattern']: alerts.length
          },
          bySeverity: alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byTimeOfDay: Object.keys(groupedAlerts).reduce((acc, period) => {
            acc[period] = groupedAlerts[period].length;
            return acc;
          }, {} as Record<string, number>),
          adaptationProgress: 65
        }
      };
    } catch (error) {
      console.error('Error getting pattern predictions:', error);
      throw error;
    } finally {
      setPatternAlertsLoading(false);
    }
  };

  const getCulturalPeriodsData = async (): Promise<CulturalPeriodsData | null> => {
    try {
      const processedData = getProcessedData();
      if (!processedData.length) return null;
  
      const historicalData = processedData.map(tx => ({
        timestamp: tx.transactionDate,
        value: parseFloat(tx.amount),
      }));
  
      const { forecast } = await getBestForecast(historicalData);
  
      const predictedPeriods: CulturalPeriod[] = forecast.map((point, index) => ({
        id: `predicted-${index}`,
        name: `Predicted Event (${new Date(point.timestamp).toLocaleDateString()})`,
        description: "AI-forecasted cultural impact",
        type: "community",
        startDate: point.timestamp,
        endDate: point.timestamp,
        impact: {
          level: point.value > 0.5 ? "high" : "medium",
          expectedChange: point.value,
          affectedMetrics: ["Predicted Transaction Volume"],
        },
        patternChanges: [{ metric: "Volume", change: point.value, direction: "increase" }],
        aiGenerated: true,
      }));
  
      return {
        active: [], 
        upcoming: predictedPeriods,
        recentlyEnded: [],
        historical: { // ✅ Ensure this field exists
          spending: processedData.map(tx => parseFloat(tx.amount)),
          approvals: processedData.map(tx => (tx.approvalStatus.toLowerCase() === "approved" ? 1 : 0)),
          dates: processedData.map(tx => tx.transactionDate),
        },
        impactMetrics: {
          totalEvents: predictedPeriods.length,
          highImpact: predictedPeriods.filter(p => p.impact.level === "high").length,
          averageChange: predictedPeriods.length
            ? predictedPeriods.reduce((acc, p) => acc + p.impact.expectedChange, 0) / predictedPeriods.length
            : 0,
        }
      };
    } catch (error) {
      console.error("Error fetching cultural periods:", error);
      return null;
    }
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
      content: <CulturalAlignmentScore 
        showDetails={true} // Changed from showFactors to showDetails
        isPreview={false} 
      />
    },
    { 
      id: "cultural-periods", 
      title: "Cultural Periods", 
      type: "metric",
      content: <ActiveCulturalPeriods 
        isPreview={true} 
        isFocused={false} 
        data={undefined} // This will be replaced dynamically by useEffect
      />
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
        data={{
          timeline: [],
          alerts: [],
          predictions: [],
          groupedAlerts: {},
          modelMetrics: {
            accuracy: 0,
            lastTraining: new Date().toISOString(),
            drift: 0
          },
          summary: {
            total: 0,
            byPattern: {},
            bySeverity: {},
            byTimeOfDay: {},
            adaptationProgress: 0
          }
        }}
        focusMode={selectedFocus || 'pattern'}
        isPreview={true}
        isLoading={patternAlertsLoading}
      />
    },
    { 
      id: "community-impact", 
      title: "Community Impact", 
      type: "metric",
      content: <CommunityImpactMap 
        data={communityImpactData}
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
    let isMounted = true;
  
    const loadDashboardData = async () => {
      try {
        // Fetch all data in parallel
        const [
          eventAnalyticsData, 
          patternData, 
          culturalPeriodsData,
          communityImpactResponse
        ] = await Promise.all([
          getEventAnalyticsData(),
          getPatternAlertData(),
          getCulturalPeriodsData(),
          getCommunityImpact(getProcessedData(), columnMapping)  // Add this
        ]);
  
        if (!isMounted) return;
        
        setCommunityImpactData(communityImpactResponse);

        // ✅ Store fetched Cultural Periods data separately
        if (culturalPeriodsData) {
          setCulturalPeriodsData(culturalPeriodsData);
        }
  
        // ✅ Update items efficiently in one state update
        setItems(prevItems =>
          prevItems.map(item => {
            switch (item.id) {
              case "event-analytics":
                return {
                  ...item,
                  content: (
                    <CulturalEventAnalytics
                      data={eventAnalyticsData}
                      focusMode={selectedFocus || "pattern"}
                      isLoading={false}
                    />
                  )
                };
  
              case "cultural-pattern-alerts":
                return {
                  ...item,
                  content: (
                    <CulturalPatternAlerts
                      data={patternData}
                      focusMode={selectedFocus || "pattern"}
                      isLoading={false}
                    />
                  )
                };
  
              case "cultural-periods":
                return {
                  ...item,
                  content: (
                    <ActiveCulturalPeriods
                      isPreview={true}
                      isFocused={false}
                      data={culturalPeriodsData ?? undefined}
                    />
                  )
                };

                case "community-impact":
                  return {
                    ...item,
                    content: (
                      <CommunityImpactMap
                        data={communityImpactResponse}
                        focusMode={selectedFocus || "pattern"}
                      />
                    )
                  };
  
              default:
                return item;
            }
          })
        );
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };
  
    loadDashboardData();
  
    return () => {
      isMounted = false;
    };
  }, [selectedFocus, getProcessedData]); // ✅ Runs when dependencies change

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
        {/* Header section */}
        <div className="p-4 border-b" style={{ borderColor: customColors?.borderColor }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold" style={{ color: customColors?.textColor }}>
                Dashboard
              </h1>
              <div className="flex items-center gap-2">
                <select
                  value={selectedComponentForAI || ''}
                  onChange={(e) => setSelectedComponentForAI(e.target.value)}
                  className="p-2 rounded-lg border text-sm"
                  style={{
                    borderColor: customColors?.borderColor,
                    backgroundColor: customColors?.backgroundColor,
                    color: customColors?.textColor
                  }}
                >
                  <option value="">Select component to analyze...</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAIPanel(true)}
                  disabled={!selectedComponentForAI}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white disabled:opacity-50"
                >
                  <Bot className="w-4 h-4" />
                  AI Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
  
        {/* Grid Container */}
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
  
      {/* Modal */}
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
  
      {/* AI Panel */}
      <DashboardAIPanel
        isOpen={showAIPanel}
        onClose={() => setShowAIPanel(false)}
        componentType={selectedComponentForAI || ''}
        data={selectedComponentForAI ? items.find(item => item.id === selectedComponentForAI)?.content.props.data : null}
        isLoading={false}
        customColors={customColors}
      />
    </div>
  );
}

export default Dashboard;