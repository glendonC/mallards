import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta
from typing import List, Dict, Union, Optional
from config.settings import MODEL_CONFIGS

class ProphetService:
    def __init__(self):
        self.config = MODEL_CONFIGS['prophet']
        self.default_params = self.config['default_params']
    
    def generate_forecast(
        self,
        dates: List[str],
        values: List[float],
        params: Optional[Dict] = None,
        forecast_days: int = 30
    ) -> List[Dict[str, Union[str, float, None]]]:
        """
        Generate Prophet forecast for time series data.
        
        Args:
            dates: List of date strings
            values: List of numerical values
            params: Dictionary of model parameters
            forecast_days: Number of days to forecast
            
        Returns:
            List of dictionaries containing forecast data
        """
        try:
            # Use provided params or defaults
            params = params or self.default_params
            
            # Prepare data for Prophet
            df = pd.DataFrame({
                'ds': pd.to_datetime(dates),
                'y': values
            })
            
            # Initialize Prophet model with parameters
            model = Prophet(
                seasonality_mode=params.get('seasonality_mode', 
                                          self.default_params['seasonality_mode']),
                changepoint_prior_scale=params.get('changepoint_prior_scale',
                                                 self.default_params['changepoint_prior_scale']),
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False
            )
            
            # Add custom seasonality if needed based on data frequency
            if len(df) > 90:  # Only add monthly seasonality for longer series
                model.add_seasonality(
                    name='monthly',
                    period=30.5,
                    fourier_order=5
                )
            
            # Fit model
            model.fit(df)
            
            # Make future dataframe for prediction
            future = model.make_future_dataframe(periods=forecast_days)
            forecast = model.predict(future)
            
            # Prepare response
            response = []
            for i in range(len(forecast)):
                response.append({
                    'timestamp': forecast['ds'].iloc[i].isoformat(),
                    'value': float(forecast['yhat'].iloc[i]),
                    'lower': float(forecast['yhat_lower'].iloc[i]),
                    'upper': float(forecast['yhat_upper'].iloc[i]),
                    'actual': float(values[i]) if i < len(values) else None
                })
            
            return response
            
        except Exception as e:
            raise Exception(f"Prophet Forecast Error: {str(e)}")