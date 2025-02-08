// src/services/api.ts

import { CommunityImpactData } from "@/types/dashboard";
import { ColumnMapping } from "@/types/mapping";

interface ForecastResponse {
  forecast: Array<{
    timestamp: string;
    value: number;
    forecast?: number;
    upper?: number;
    lower?: number;
  }>;
  modelUsed: 'prophet' | 'arima';
  confidence: number;
  regional_variations?: any[];
  trends?: {
    approval_trend: number;
    volume_trend: number;
  };
}

export const getBestForecast = async (
  data: Array<{ timestamp: string; value: number }>
): Promise<ForecastResponse> => {

  try {
    const response = await fetch('http://localhost:8000/forecast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      // Get the error message from the response if possible
      const errorText = await response.text();
      console.error('Forecast API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Forecast API Error: ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.forecast) {
      throw new Error('Forecast data missing from response');
    }

    return result;
  } catch (error) {
    console.error('API Call Failed:', error);
    throw error;
  }
};

export const getPatternPredictions = async (historicalData: any[], options: {
  focusMode: 'pattern' | 'decision' | 'bias';
  window: string;
  sensitivity: number;
}) => {
  try {
    // Update URL to match your backend server
    const response = await fetch('http://localhost:8000/predictions/patterns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: historicalData,
        options
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Prediction API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error('Failed to get predictions');
    }
    
    const result = await response.json();
    return result.predictions;
  } catch (error) {
    console.error('Error getting predictions:', error);
    throw error;
  }
};



interface DecisionImpactResponse {
  timelineData: Array<{
    date: string;
    culturalPeriod: boolean;
    approvals: number;
    rejections: number;
    totalAmount: number;
    region: string;
  }>;
  regionalData: Array<{
    region: string;
    culturalPeriods: {
      approvalRate: number;
      totalDecisions: number;
      totalAmount: number;
    };
    normalPeriods: {
      approvalRate: number;
      totalDecisions: number;
      totalAmount: number;
    };
  }>;
  summary: {
    culturalPeriods: {
      approvalRate: number;
      totalDecisions: number;
      averageAmount: number;
    };
    normalPeriods: {
      approvalRate: number;
      totalDecisions: number;
      averageAmount: number;
    };
    significantEvents: Array<{
      name: string;
      approvalDelta: number;
      period: {
        start: string;
        end: string;
      };
    }>;
  };
}

export const getDecisionImpact = async (data: any[], columnMapping: ColumnMapping): Promise<DecisionImpactResponse> => {
  try {
    // Add validation and logging
    if (!data || data.length === 0) {
      throw new Error('No data provided to getDecisionImpact');
    }

    // Ensure all required fields are present and properly formatted
    const transformedData = data.map(d => ({
      Transaction_Date: new Date(d.transactionDate).toISOString(),  // Ensure proper date format
      Amount: parseFloat(d.amount || '0'),
      Transaction_Type: d.transactionType || 'unknown',
      Approval_Status: d.approvalStatus || 'pending',
      Region: d.region || 'unknown'
    }));

    if (!transformedData[0].Transaction_Date || !transformedData[0].Region) {
      throw new Error('Required fields missing after transformation');
    }

    const response = await fetch('http://localhost:8000/analysis/decision-impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformedData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Decision Impact API Error: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting decision impact:', error);
    throw error;
  }
};

export const getCulturalPeriods = async (
  data: any[], 
  windowSize: number = 7, 
  sensitivity: number = 0.1
) => {
  try {
    const response = await fetch('http://localhost:8000/analysis/cultural-periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, windowSize, sensitivity })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cultural Periods API Error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error detecting cultural periods:', error);
    throw error;
  }
};

export const getRegionalAnalysis = async (data: any[], culturalPeriods?: any) => {
  try {
    const response = await fetch('http://localhost:8000/analysis/regional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, culturalPeriods })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Regional Analysis API Error: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing regional patterns:', error);
    throw error;
  }
};

export const getCommunityImpact = async (data: any[], columnMapping: any): Promise<CommunityImpactData> => {
  try {
    const response = await fetch('http://localhost:8000/analysis/community-impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: data,
        column_mapping: columnMapping
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Community Impact API Error: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting community impact:', error);
    throw error;
  }
};