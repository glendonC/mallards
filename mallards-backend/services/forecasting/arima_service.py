import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from datetime import datetime, timedelta
from typing import List, Dict, Union, Optional
from config.settings import MODEL_CONFIGS

class ARIMAService:
    def __init__(self):
        self.config = MODEL_CONFIGS['arima']
        self.default_params = self.config['default_params']
    
    def parse_order(self, order_str: str) -> tuple:
        """Convert order string to tuple of integers."""
        return tuple(map(int, order_str.split(',')))
    
    def get_seasonal_period(self, seasonal: str) -> Optional[int]:
        """Convert seasonal string to number of periods."""
        seasonal_map = {
            'none': None,
            'daily': 7,      # Daily seasonality with weekly pattern
            'weekly': 52,    # Weekly seasonality with yearly pattern
            'monthly': 12    # Monthly seasonality with yearly pattern
        }
        return seasonal_map.get(seasonal)
    
    def generate_forecast(
        self,
        dates: List[str],
        values: List[float],
        params: Optional[Dict] = None,
        forecast_days: int = 30
    ) -> List[Dict[str, Union[str, float, None]]]:
        """
        Generate ARIMA forecast for time series data.
        
        Args:
            dates: List of date strings
            values: List of numerical values
            params: Dictionary of model parameters (order, seasonal)
            forecast_days: Number of days to forecast
            
        Returns:
            List of dictionaries containing forecast data
        """
        try:
            # Use provided params or defaults
            params = params or self.default_params
            order = self.parse_order(params.get('order', self.default_params['order']))
            seasonal = params.get('seasonal', self.default_params['seasonal'])
            
            # Prepare data
            df = pd.DataFrame({
                'ds': pd.to_datetime(dates),
                'y': values
            }).set_index('ds')
            
            # Configure seasonal parameters if needed
            seasonal_order = None
            if seasonal != 'none':
                period = self.get_seasonal_period(seasonal)
                if period:
                    seasonal_order = (1, 1, 1, period)
            
            # Fit ARIMA model
            model = ARIMA(
                df['y'],
                order=order,
                seasonal_order=seasonal_order
            )
            fitted_model = model.fit()
            
            # Generate forecast
            forecast = fitted_model.forecast(steps=forecast_days)
            conf_int = fitted_model.get_forecast(steps=forecast_days).conf_int()
            
            # Prepare response
            response = []
            
            # Add historical points
            for i in range(len(df)):
                response.append({
                    'timestamp': df.index[i].isoformat(),
                    'value': float(df['y'].iloc[i]),
                    'lower': float(df['y'].iloc[i]),
                    'upper': float(df['y'].iloc[i]),
                    'actual': float(df['y'].iloc[i])
                })
            
            # Add forecast points
            for i in range(len(forecast)):
                response.append({
                    'timestamp': (df.index[-1] + timedelta(days=i+1)).isoformat(),
                    'value': float(forecast[i]),
                    'lower': float(conf_int.iloc[i]['lower y']),
                    'upper': float(conf_int.iloc[i]['upper y']),
                    'actual': None
                })
            
            return response
            
        except Exception as e:
            raise Exception(f"ARIMA Forecast Error: {str(e)}")