// src/services/api.ts

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
  console.log("API Request Data Sample:", data[0]); // Log first data point

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
    console.log("API Response:", result);
    
    if (!result.forecast) {
      throw new Error('Forecast data missing from response');
    }

    return result;
  } catch (error) {
    console.error('API Call Failed:', error);
    throw error;
  }
};

// Helper function to calculate confidence score
const calculateConfidence = (forecast: any[]): number => {
  // This is a placeholder implementation
  // You might want to implement your own confidence calculation logic
  if (!forecast || forecast.length === 0) return 0;

  // Example: calculate confidence based on the spread between upper and lower bounds
  let totalConfidence = 0;
  let count = 0;

  forecast.forEach(point => {
    if (point.upper && point.lower && point.forecast) {
      const spread = (point.upper - point.lower) / point.forecast;
      // Convert spread to confidence (smaller spread = higher confidence)
      const pointConfidence = Math.max(0, 100 - (spread * 100));
      totalConfidence += pointConfidence;
      count++;
    }
  });

  return count > 0 ? totalConfidence / count : 75; // Default to 75% if can't calculate
};