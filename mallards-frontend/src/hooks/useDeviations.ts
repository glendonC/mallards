import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { UnusualDeviation } from '@/types/anomaly';
import { AVAILABLE_MODELS } from '@/data/models';
import { MONITORING_CONFIGS } from '@/types/monitoring';
import { Model } from '@/types/model';
import { MonitoringFocusConfig } from '@/types/monitoring';

interface DetectionRule {
  threshold: number;
  sensitivity: number;
}

const detectDeviations = async (
    data: any[],
    model: Model | undefined,
    detectionRules: DetectionRule,
    focusConfig: MonitoringFocusConfig | null
  ): Promise<UnusualDeviation[]> => {
    if (!model || !data.length) return [];
  
    // Calculate baseline statistics
    const amounts = data.map(d => parseFloat(d.amount)).filter(a => !isNaN(a));
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length
    );
  
    // Lower the threshold to catch more deviations
    const sensitivity = 1.5; // Using 1.5 standard deviations instead of 3
  
    // Find deviations
    const anomalies = data.filter(point => {
      const amount = parseFloat(point.amount);
      const deviationScore = Math.abs(amount - mean) / stdDev;
      return deviationScore > sensitivity;
    });
  
    return anomalies.map((point, index) => {
      const amount = parseFloat(point.amount);
      const deviationScore = Math.abs(amount - mean) / stdDev;
      const score = Math.min(100, (deviationScore / 2) * 100); // Adjusted score calculation
      
      return {
        id: `dev-${index}`,
        timestamp: point.transactionDate,
        severity: score > 80 ? 'high' : score > 50 ? 'medium' : 'low',
        score,
        pattern: 'Unusual transaction amount',
        modelConfidence: 0.85,
        modelType: 'isolation-forest',
        explanation: `Transaction amount of $${amount.toFixed(2)} deviates ${deviationScore.toFixed(1)} standard deviations from mean`,
        affectedMetrics: [{
          metric: 'amount',
          value: amount,
          expectedRange: [mean - stdDev, mean + stdDev]
        }],
        status: 'pending'
      };
    });
  };

// Helper functions for detection logic
const calculateIsolationScore = (point: any, data: any[], sensitivity: number): number => {
  // Implement isolation forest scoring logic
  // This is a simplified version - would need actual implementation
  const average = data.reduce((sum, p) => sum + parseFloat(p.amount), 0) / data.length;
  const deviation = Math.abs(parseFloat(point.amount) - average);
  return (deviation / average) * 100 * sensitivity;
};

const getSeverity = (score: number): 'high' | 'medium' | 'low' => {
  if (score > 80) return 'high';
  if (score > 50) return 'medium';
  return 'low';
};

const calculateConfidence = (score: number): number => {
  return Math.min(0.95, score / 100);
};

const getExplanation = (point: any, score: number): string => {
  return `Unusual pattern detected with ${score.toFixed(1)}% deviation from normal behavior`;
};

const getAffectedMetrics = (point: any, data: any[]): { metric: string; value: number; expectedRange: [number, number] }[] => {
  const amount = parseFloat(point.amount);
  const average = data.reduce((sum, p) => sum + parseFloat(p.amount), 0) / data.length;
  const stdDev = Math.sqrt(
    data.reduce((sum, p) => sum + Math.pow(parseFloat(p.amount) - average, 2), 0) / data.length
  );

  return [{
    metric: 'amount',
    value: amount,
    expectedRange: [average - 2 * stdDev, average + 2 * stdDev]
  }];
};

export const useDeviations = () => {
  const [deviations, setDeviations] = useState<UnusualDeviation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { 
    selectedModels, 
    detectionRules,
    selectedFocus,
    getProcessedData 
  } = useData();

  // Get model and focus configs
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModels.anomaly);
  const focusConfig = selectedFocus ? MONITORING_CONFIGS[selectedFocus] : null;

  const modelInfo = {
    type: selectedModel?.type || 'isolation-forest',
    name: selectedModel?.name || 'Default Model',
    confidence: focusConfig?.thresholds.alertConfidence || 0.8,
    parameters: selectedModel?.parameters.reduce((acc, param) => ({
      ...acc,
      [param.name]: param.default
    }), {}) || {}
  };

  useEffect(() => {
    const processDeviations = async () => {
      setIsLoading(true);
      try {
        const processedData = getProcessedData();
        // Check if we have required data
        if (!processedData?.length) {
          setDeviations([]);
          return;
        }
  
        const detectedDeviations = await detectDeviations(
          processedData,
          selectedModel,
          detectionRules,
          focusConfig
        );
  
        setDeviations(detectedDeviations);
      } catch (error) {
        console.error('Error processing deviations:', error);
        setDeviations([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    processDeviations();
  }, [getProcessedData, selectedModel, focusConfig, detectionRules]);

  return {
    deviations,
    isLoading,
    modelInfo
  };
};