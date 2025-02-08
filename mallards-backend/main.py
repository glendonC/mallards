import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))
from typing import Dict, Any
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.forecasting.prophet_service import ProphetService
from services.forecasting.arima_service import ARIMAService
from config.settings import MODEL_CONFIGS, MONITORING_CONFIGS
from models.schemas import (
    OptimizationRequest, 
    OptimizationResponse,
    SimulationResults,
    Transaction,
    ColumnMapping,
    DetectionRule,
    MonitoringFocus,
    ModelParameters,
    OptimizationRequest,
    OptimizationResponse,
    OptimizedParameters,
    OptimizationImprovement,
    SimulationResults,
    SimulationParameters
)

from typing import List, Optional
from pydantic import BaseModel, ValidationError
from services.analysis.pattern_detector import PatternDetector
from services.analysis.risk_analyzer import RiskAnalyzer
import random
from datetime import datetime, timedelta
import traceback
from services.ai.gpt_service import GPTService
from services.ai.insight_manager import InsightManager
from models.schemas import AIAnalysisRequest, AIAnalysisResponse
from openai import OpenAI
from config.settings import OPENAI_API_KEY
from fastapi.responses import StreamingResponse
import io
from models.schemas import DashboardAnalysisRequest, DashboardAnalysisResponse
from services.ai.dashboard_gpt_service import DashboardGPTService
import json
from services.optimization.optimizer_service import OptimizerService
from models.schemas import OptimizationRequest, OptimizationResponse
from services.ai.anomalies_gpt_service import AnomaliesGPTService
from services.ai.predictive_gpt_service import PredictiveGPTService

pattern_detector = PatternDetector()
risk_analyzer = RiskAnalyzer()
optimizer_service = OptimizerService()
anomalies_gpt_service = AnomaliesGPTService(api_key=OPENAI_API_KEY)
predictive_gpt_service = PredictiveGPTService(api_key=OPENAI_API_KEY)

class ForecastRequest(BaseModel):
    timestamp: str
    value: float

app = FastAPI(title="Cultural Intelligence API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
prophet_service = ProphetService()
arima_service = ARIMAService()

@app.get("/")
async def root():
    return {"message": "Cultural Intelligence API"}

# Forecasting endpoints
@app.post("/forecast/prophet")
async def get_prophet_forecast(
    dates: List[str],
    values: List[float],
    params: Optional[ModelParameters.Prophet] = None,
    forecast_days: int = 30
):
    try:
        # Convert Pydantic model to dict if params provided
        params_dict = params.dict() if params else None
        forecast = prophet_service.generate_forecast(
            dates,
            values,
            params=params_dict,
            forecast_days=forecast_days
        )
        return {"forecast": forecast}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/forecast/arima")
async def get_arima_forecast(
    dates: List[str],
    values: List[float],
    params: Optional[ModelParameters.ARIMA] = None,
    forecast_days: int = 30
):
    try:
        # Convert Pydantic model to dict if params provided
        params_dict = params.dict() if params else None
        forecast = arima_service.generate_forecast(
            dates,
            values,
            params=params_dict,
            forecast_days=forecast_days
        )
        return {"forecast": forecast}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/forecast")
async def get_forecast(data: List[ForecastRequest]):
    try:
        dates = [d.timestamp for d in data]
        values = [d.value for d in data]
        
        forecast = prophet_service.generate_forecast(
            dates,
            values,
            forecast_days=30
        )
        
        response = {
            "forecast": forecast,
            "modelUsed": "prophet",
            "confidence": 85,
            "regional_variations": [],
            "trends": {
                "approval_trend": 0,
                "volume_trend": 0
            }
        }
        return response
    except Exception as e:
        print("Error processing forecast:", str(e))  # Log the error
        import traceback
        traceback.print_exc()  # Print stack trace
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/predictions/patterns")
async def get_pattern_predictions(
    data: List[dict],
    options: dict
):
    try:
        # Extract time series data
        timestamps = [entry['transactionDate'] for entry in data]
        
        # Calculate metrics based on focus mode
        if options['focusMode'] == 'pattern':
            values = [float(entry['amount']) for entry in data]
        elif options['focusMode'] == 'decision':
            values = [1 if entry['approvalStatus'].lower() == 'approved' else 0 for entry in data]
        else:  # bias mode
            # Calculate regional distribution
            values = [float(entry['amount']) for entry in data]

        # Get forecast using Prophet service
        forecast = prophet_service.generate_forecast(
            timestamps,
            values,
            forecast_days=7  # One week forecast
        )

        # Transform forecast into pattern predictions
        predictions = [
            {
                "timestamp": pred['timestamp'],
                "probability": pred['value'],
                "confidence": 85,  # Using fixed confidence for now
                "impact": abs(pred['value'] - pred.get('baseline', 0))
            }
            for pred in forecast
        ]

        return {
            "predictions": predictions,
            "modelMetrics": {
                "accuracy": 85,
                "confidence": 85,
                "drift": 0.05
            }
        }
    except Exception as e:
        print("Error in pattern predictions:", str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analysis/decision-impact")
async def get_decision_impact(data: List[dict]):
    try:
        print("Backend received data sample:", data[0])
        
        processed_data = [{
            'Transaction_Date': item.get('Transaction_Date'),
            'Amount': float(item.get('Amount', 0)),
            'Transaction_Type': item.get('Transaction_Type'),
            'Approval_Status': item.get('Approval_Status'),
            'Region': item.get('Region')
        } for item in data if all(item.get(key) for key in ['Transaction_Date', 'Amount', 'Region'])]
        
        if not processed_data:
            raise HTTPException(status_code=400, detail="No valid data after processing")

        def calculate_metrics(transactions):
            if not transactions:
                return {
                    "approvalRate": 0,
                    "totalDecisions": 0,
                    "totalAmount": 0,
                    "averageAmount": 0
                }
            
            approvals = sum(1 for tx in transactions if tx['Approval_Status'].lower() == 'approved')
            total = len(transactions)
            total_amount = sum(float(tx['Amount']) for tx in transactions)
            
            return {
                "approvalRate": approvals / total if total > 0 else 0,
                "totalDecisions": total,
                "totalAmount": total_amount,
                "averageAmount": total_amount / total if total > 0 else 0
            }
        
        def get_period_name(date_str: str) -> str:
            date = datetime.fromisoformat(date_str.split('T')[0])
            
            # Weekend detection
            if date.weekday() == 5:  # Saturday
                return "Weekend - Saturday"
            elif date.weekday() == 6:  # Sunday
                return "Weekend - Sunday"
            
            # Holiday detection
            month, day = date.month, date.day
            
            # Major holidays
            if month == 12:
                if 20 <= day <= 26:
                    return "Christmas Week"
                elif 27 <= day <= 31:
                    return "New Year's Week"
            elif month == 1 and day <= 2:
                return "New Year Period"
            elif month == 7 and day == 4:
                return "Independence Day"
            
            return f"Cultural Period {date.strftime('%B %d')}"

        def is_cultural_period(date_str: str) -> bool:
            date = datetime.fromisoformat(date_str.split('T')[0])
            # Weekend detection
            if date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                return True
            # Holiday detection
            if (date.month == 12 and date.day >= 20) or (date.month == 1 and date.day <= 5) or (date.month == 7 and date.day == 4):
                return True
            return False

        # Group transactions by date
        date_groups = {}
        for tx in processed_data:
            date = tx['Transaction_Date'].split('T')[0]
            if date not in date_groups:
                date_groups[date] = []
            date_groups[date].append(tx)

        # Calculate baseline metrics from all data
        all_metrics = calculate_metrics(processed_data)
        baseline_rate = all_metrics["approvalRate"]

        # Create timeline data
        timeline_data = []
        for date, transactions in sorted(date_groups.items()):
            metrics = calculate_metrics(transactions)
            timeline_data.append({
                "date": date,
                "culturalPeriod": is_cultural_period(date),
                "approvals": sum(1 for tx in transactions if tx['Approval_Status'].lower() == 'approved'),
                "rejections": sum(1 for tx in transactions if tx['Approval_Status'].lower() == 'rejected'),
                "totalAmount": sum(float(tx['Amount']) for tx in transactions),
                "region": transactions[0]['Region']
            })

        # Split into cultural and normal periods
        cultural_periods = [tx for tx in processed_data if is_cultural_period(tx['Transaction_Date'])]
        normal_periods = [tx for tx in processed_data if not is_cultural_period(tx['Transaction_Date'])]

        # Calculate regional metrics
        regions = set(tx['Region'] for tx in processed_data)
        regional_data = [{
            "region": region,
            "culturalPeriods": calculate_metrics([tx for tx in cultural_periods if tx['Region'] == region]),
            "normalPeriods": calculate_metrics([tx for tx in normal_periods if tx['Region'] == region])
        } for region in regions]

        # Find significant events
        significant_events = []
        for date, transactions in sorted(date_groups.items()):
            if is_cultural_period(date):
                metrics = calculate_metrics(transactions)
                if abs(metrics["approvalRate"] - baseline_rate) > 0.05:  # 5% threshold
                    significant_events.append({
                        "name": get_period_name(date),
                        "approvalDelta": (metrics["approvalRate"] - baseline_rate) * 100,
                        "period": {"start": date, "end": date}
                    })

        response = {
            "timelineData": timeline_data,
            "regionalData": regional_data,
            "summary": {
                "culturalPeriods": calculate_metrics(cultural_periods),
                "normalPeriods": calculate_metrics(normal_periods),
                "significantEvents": significant_events
            }
        }
        
        
        return response
        
    except Exception as e:
        print("Error in decision impact:", str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
    
@app.post("/analysis/cultural-periods")
async def detect_cultural_periods(
    data: List[Transaction],
    window_size: Optional[int] = 7,
    sensitivity: Optional[float] = 0.1
):
    try:
        periods = pattern_detector.detect_cultural_periods(
            [tx.dict() for tx in data],
            window_size=window_size,
            sensitivity=sensitivity
        )
        return periods
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analysis/regional")
async def analyze_regional_patterns(
    data: List[Transaction],
    cultural_periods: Optional[dict] = None
):
    try:
        analysis = risk_analyzer.analyze_regional_patterns(
            [tx.dict() for tx in data],
            cultural_periods
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analysis/community-impact")
async def get_community_impact(request: Dict[str, Any]):
    try:
        data = request.get('data', [])
        column_mapping = request.get('column_mapping', {})
        
        # Create transactions
        transactions = []
        for row in data:
            try:
                transactions.append(Transaction(
                    transactionDate=row['transactionDate'],
                    amount=float(row['amount']),
                    transactionType=row['transactionType'],
                    approvalStatus=row['approvalStatus'],
                    region=row['region']
                ))
            except Exception as e:
                print(f"3. Error processing row: {row}")
                print(f"4. Error: {str(e)}")
                continue
        if not transactions:
            return {
                "regions": [],
                "summary": {
                    "totalRegions": 0,
                    "averageApprovalRate": 0,
                    "highestImpact": "None",
                    "lowestImpact": "None"
                },
                "filters": {
                    "countries": [],
                    "culturalFactors": []
                }
            }

        # Define region mapping for ISO codes
        region_mapping = {
            'Asia': {'code': 'CHN', 'lat': 35.8617, 'lng': 104.1954},
            'Europe': {'code': 'DEU', 'lat': 51.1657, 'lng': 10.4515},
            'North America': {'code': 'USA', 'lat': 37.0902, 'lng': -95.7129},
            'South America': {'code': 'BRA', 'lat': -14.235, 'lng': -51.925},
            'Africa': {'code': 'ZAF', 'lat': -30.5595, 'lng': 22.9375},
            'Oceania': {'code': 'AUS', 'lat': -25.2744, 'lng': 133.7751}
        }

        # Convert transactions to dictionaries for DataFrame
        df = pd.DataFrame([tx.dict() for tx in transactions])
        
        # Group by region
        region_data = []
        for region_name, region_info in region_mapping.items():
            region_transactions = df[df['region'] == region_name]

            if len(region_transactions) > 0:
                approvals = len(region_transactions[region_transactions['approvalStatus'].str.lower() == 'approved'])
                total = len(region_transactions)
                approval_rate = (approvals / total) * 100 if total > 0 else 0
                
                region_data.append({
                    "code": region_info['code'],
                    "name": region_name,
                    "coordinates": {
                        "lat": region_info['lat'],
                        "lng": region_info['lng']
                    },
                    "metrics": {
                        "approvalRate": approval_rate,
                        "culturalImpact": approval_rate * 0.9,
                        "totalDecisions": total,
                        "transactionVolume": float(region_transactions['amount'].sum())
                    },
                    "culturalFactors": [{
                        "name": "Regional Pattern",
                        "influence": approval_rate,
                        "trend": "increasing" if approval_rate > 75 else "decreasing"
                    }]
                })

        # Calculate summary metrics
        if region_data:
            avg_approval = sum(r["metrics"]["approvalRate"] for r in region_data) / len(region_data)
            sorted_regions = sorted(region_data, key=lambda x: x["metrics"]["culturalImpact"], reverse=True)
            
            response = {
                "regions": region_data,
                "summary": {
                    "totalRegions": len(region_data),
                    "averageApprovalRate": avg_approval,
                    "highestImpact": sorted_regions[0]["name"] if sorted_regions else "None",
                    "lowestImpact": sorted_regions[-1]["name"] if sorted_regions else "None"
                },
                "filters": {
                    "countries": [r["name"] for r in region_data],
                    "culturalFactors": ["Regional Pattern"]
                }
            }
            
            return response
        else:
            return {
                "regions": [],
                "summary": {
                    "totalRegions": 0,
                    "averageApprovalRate": 0,
                    "highestImpact": "None",
                    "lowestImpact": "None"
                },
                "filters": {
                    "countries": [],
                    "culturalFactors": []
                }
            }
            
    except Exception as e:
        print("Error in community impact:", str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/events/upcoming")
async def get_upcoming_events(data: List[Transaction]):
    try:
        processed_data = [tx.dict() for tx in data]
        
        # Detect cultural periods using existing functions
        def get_period_name(date_str: str) -> str:
            date = datetime.fromisoformat(date_str.split('T')[0])
            
            # Weekend detection
            if date.weekday() == 5:  # Saturday
                return "Weekend - Saturday"
            elif date.weekday() == 6:  # Sunday
                return "Weekend - Sunday"
            
            # Holiday detection
            month, day = date.month, date.day
            
            # Major holidays
            if month == 12:
                if 20 <= day <= 26:
                    return "Christmas Week"
                elif 27 <= day <= 31:
                    return "New Year's Week"
            elif month == 1 and day <= 2:
                return "New Year Period"
            elif month == 7 and day == 4:
                return "Independence Day"
            
            return f"Cultural Period {date.strftime('%B %d')}"

        def calculate_metrics(transactions):
            if not transactions:
                return {
                    "approvalRate": 0,
                    "transactionVolume": 0,
                    "averageAmount": 0
                }
            
            total = len(transactions)
            total_amount = sum(float(tx['amount']) for tx in transactions)
            approvals = sum(1 for tx in transactions if tx['approvalStatus'].lower() == 'approved')
            
            return {
                "approvalRate": (approvals / total * 100) if total > 0 else 0,
                "transactionVolume": total,
                "averageAmount": total_amount / total if total > 0 else 0
            }

        # Group by date and detect patterns
        date_groups = {}
        for tx in processed_data:
            date = tx['transactionDate'].date().isoformat()
            if date not in date_groups:
                date_groups[date] = []
            date_groups[date].append(tx)

        # Use Prophet to forecast future values
        forecast = prophet_service.generate_forecast(
            dates=[tx['transactionDate'].isoformat() for tx in processed_data],
            values=[float(tx['amount']) for tx in processed_data],
            forecast_days=30  # Look ahead 30 days
        )

        # Create event predictions
        events = []
        for date, transactions in sorted(date_groups.items()):
            metrics = calculate_metrics(transactions)
            
            # Calculate regional impact
            regions = set(tx['region'] for tx in transactions if tx['region'])
            regional_impact = []
            for region in regions:
                region_txs = [tx for tx in transactions if tx['region'] == region]
                region_metrics = calculate_metrics(region_txs)
                impact = ((region_metrics['approvalRate'] - metrics['approvalRate']) / 
                         metrics['approvalRate'] * 100) if metrics['approvalRate'] > 0 else 0
                
                regional_impact.append({
                    "region": region,
                    "impact": impact,
                    "confidence": 85  # Fixed for now
                })

            event = {
                "id": f"event-{date}",
                "name": get_period_name(date),
                "startDate": date,
                "endDate": date,  # Single day events for now
                "type": "cultural",
                "significance": "high" if abs(metrics['approvalRate'] - 75) > 10 else "medium",
                "description": f"Cultural period detected with {metrics['transactionVolume']} transactions",
                "expectedImpact": metrics['approvalRate'] - 75,  # Compare to baseline
                "confidence": 85,
                "regionalImpact": regional_impact,
                "currentMetrics": metrics,
                "predictedMetrics": {
                    "approvalRate": metrics['approvalRate'] * 1.1,  # Simple prediction
                    "transactionVolume": metrics['transactionVolume'] * 1.15,
                    "averageAmount": metrics['averageAmount'] * 1.05
                }
            }
            
            events.append(event)

        return {"events": events}
        
    except Exception as e:
        print("Error in upcoming events:", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    
# Configuration endpoints
@app.get("/config/models")
async def get_model_configs():
    """Get available model configurations"""
    return MODEL_CONFIGS

@app.get("/config/monitoring")
async def get_monitoring_configs():
    """Get monitoring focus configurations"""
    return MONITORING_CONFIGS

@app.get("/config/models/{model_id}")
async def get_model_config(model_id: str):
    """Get configuration for specific model"""
    if model_id not in MODEL_CONFIGS:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    return MODEL_CONFIGS[model_id]

# Validation endpoints
@app.post("/validate/mapping")
async def validate_column_mapping(mapping: ColumnMapping):
    """Validate column mapping configuration"""
    try:
        return {"valid": True, "mapping": mapping.dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/validate/detection-rule")
async def validate_detection_rule(rule: DetectionRule):
    """Validate detection rule configuration"""
    try:
        return {"valid": True, "rule": rule.dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/validate/transactions")
async def validate_transactions(transactions: List[Transaction]):
    """Validate transaction data format"""
    try:
        return {
            "valid": True,
            "count": len(transactions)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Model parameter validation
@app.post("/validate/model-params/{model_id}")
async def validate_model_parameters(model_id: str, params: dict):
    """Validate model parameters for specific model"""
    if model_id not in MODEL_CONFIGS:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    try:
        # Validate parameters against bounds
        param_bounds = MODEL_CONFIGS[model_id]['param_bounds']
        for param, value in params.items():
            if param not in param_bounds:
                raise ValueError(f"Unknown parameter: {param}")
            
            bounds = param_bounds[param]
            if isinstance(bounds, tuple):
                if not bounds[0] <= value <= bounds[1]:
                    raise ValueError(
                        f"Parameter {param} must be between {bounds[0]} and {bounds[1]}"
                    )
            elif isinstance(bounds, list):
                if value not in bounds:
                    raise ValueError(
                        f"Parameter {param} must be one of: {', '.join(map(str, bounds))}"
                    )
        
        return {"valid": True, "parameters": params}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Monitoring Focus endpoint
@app.post("/monitoring/focus")
async def set_monitoring_focus(focus: MonitoringFocus):
    """Set and validate monitoring focus configuration"""
    try:
        # Validate focus configuration
        if focus.focus_type not in MONITORING_CONFIGS:
            raise ValueError(f"Invalid focus type: {focus.focus_type}")
            
        config = MONITORING_CONFIGS[focus.focus_type]
        
        # Validate required fields are present
        missing_fields = [
            field for field in config['required_fields'] 
            if field not in focus.required_fields
        ]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
            
        return {
            "valid": True,
            "focus": focus.dict(),
            "config": config
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "prophet": prophet_service is not None,
            "arima": arima_service is not None
        }
    }

@app.get("/routes")
async def get_routes():
    """List all registered routes"""
    routes = []
    for route in app.routes:
        routes.append(f"{route.methods} {route.path}")
    return {"routes": routes}

@app.post("/api/simulation")
async def run_simulation(request: dict):
    try:
        parameters = request['parameters']
        scenario = request['scenario']
        data = request['data']
        mapping = request['mapping']

        # Create DataFrame with explicit columns
        columns = ['id', 'Transaction_Date', 'Amount', 'Transaction_Type', 'Approval_Status', 'Region']
        df = pd.DataFrame(data, columns=columns)
        
        # Calculate baseline metrics
        baseline_metrics = {
            "approvalRate": len(df[df['Approval_Status'].str.lower() == 'approved']) / len(df),
            "riskScore": risk_analyzer.calculate_risk_score(df, mapping),
            "culturalAlignment": pattern_detector.calculate_cultural_alignment(df, mapping),
            "financialInclusion": calculate_financial_inclusion(df, mapping)
        }

        # Apply scenario adjustments
        adjusted_metrics = apply_scenario_adjustments(baseline_metrics, parameters, scenario)

        # Generate predictions using Prophet
        prophet_service = ProphetService()
        date_series = pd.to_datetime(df['Transaction_Date'])
        amount_series = df['Amount'].astype(float)
        
        try:
            forecast = prophet_service.generate_forecast(
                dates=date_series.tolist(),
                values=amount_series.tolist(),
                forecast_days=12
            )
            
            # Extract values from forecast dictionaries
            future_dates = [f['timestamp'] for f in forecast[-12:]]  # Get last 12 predictions
            baseline_values = [float(f['value']) for f in forecast[-12:]]
            simulated_values = [v * float(parameters['spendingMultiplier']) for v in baseline_values]
            
        except Exception as forecast_error:
            print("Forecast error:", forecast_error)
            # Fallback to statistical projection
            future_dates = [(datetime.now() + timedelta(days=x)).strftime('%Y-%m-%d') for x in range(12)]
            baseline_values = [float(amount_series.mean()) + random.normalvariate(0, amount_series.std()) 
                             for _ in range(12)]
            simulated_values = [v * float(parameters['spendingMultiplier']) for v in baseline_values]

        # Calculate regional impact
        regional_impact = []
        for region in df['Region'].unique():
            region_df = df[df['Region'] == region]
            impact = pattern_detector.analyze_regional_impact(region_df, mapping)
            regional_impact.append({
                "region": region,
                "delta": impact['delta'],
                "significance": impact['confidence'],
                "culturalAdaptation": impact['cultural_score'],
                "communityAccess": impact['access_score']
            })

        return {
            "metrics": {
                "approvalRate": {"before": baseline_metrics["approvalRate"], "after": adjusted_metrics["approvalRate"]},
                "riskScore": {"before": baseline_metrics["riskScore"], "after": adjusted_metrics["riskScore"]},
                "culturalAlignment": {"before": baseline_metrics["culturalAlignment"], "after": adjusted_metrics["culturalAlignment"]},
                "financialInclusion": {"before": baseline_metrics["financialInclusion"], "after": adjusted_metrics["financialInclusion"]}
            },
            "predictions": {
                "dates": future_dates,
                "baseline": baseline_values,
                "simulated": simulated_values
            },
            "regionalImpact": regional_impact
        }

    except Exception as e:
        print("Simulation error:", str(e))
        print("Data sample:", data[0] if data else "No data")
        print("Column mapping:", mapping)
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
     
def calculate_financial_inclusion(df: pd.DataFrame, mapping: dict) -> float:
    """Calculate financial inclusion score based on approval patterns"""
    approvals = df[df[mapping['approvalStatus']].str.lower() == 'approved']
    return len(approvals.groupby(mapping['region'])) / len(df[mapping['region']].unique())

def apply_scenario_adjustments(metrics: dict, parameters: dict, scenario_id: str) -> dict:
    base_adjustments = {
        "approvalRate": min(metrics["approvalRate"] * parameters['approvalRateSensitivity'], 1.0),
        "riskScore": metrics["riskScore"] * (2 - parameters['approvalRateSensitivity']),
        "culturalAlignment": metrics["culturalAlignment"] * parameters['culturalWeighting'],
        "financialInclusion": metrics["financialInclusion"] * parameters['approvalRateSensitivity']
    }

    # Apply scenario-specific adjustments
    scenario_modifiers = {
        'minority-approval': {'approvalRate': 1.2, 'financialInclusion': 1.3},
        'cultural-event': {'culturalAlignment': 1.4, 'spendingMultiplier': 1.2},
        'fraud-threshold': {'riskScore': 1.3},
        'recession': {'approvalRate': 0.8, 'riskScore': 1.2},
        'bias-reduction': {'culturalAlignment': 1.5},
        'seasonal-credit': {'approvalRate': 1.1, 'spendingMultiplier': 1.3}
    }

    if scenario_id in scenario_modifiers:
        for metric, modifier in scenario_modifiers[scenario_id].items():
            if metric in base_adjustments:
                base_adjustments[metric] *= modifier

    return base_adjustments


gpt_service = GPTService(api_key=OPENAI_API_KEY)
dashboard_gpt_service = DashboardGPTService(api_key=OPENAI_API_KEY)
insight_manager = InsightManager()

@app.post("/api/analyze/simulation")
async def analyze_simulation(request: AIAnalysisRequest) -> AIAnalysisResponse:
    try:
        # Get AI analysis
        analysis = gpt_service.analyze_simulation(request)
        
        # Process and enhance insights
        processed_analysis = insight_manager.process_analysis(analysis)
        
        return processed_analysis
        
    except Exception as e:
        print("Analysis error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/dashboard")
async def analyze_dashboard(request: DashboardAnalysisRequest) -> DashboardAnalysisResponse:
    try:
        print(f"Analyzing dashboard component: {request.componentType}")
        print(f"Component data: {request.data}")
        
        analysis = dashboard_gpt_service.analyze_dashboard(
            request.componentType,
            request.data
        )
        
        # Process and enhance the analysis while maintaining the required structure
        processed_analysis = insight_manager.process_analysis(analysis)
        
        # Ensure the processed response includes all required fields
        if isinstance(processed_analysis, dict):
            return AIAnalysisResponse(
                insights=processed_analysis.get("insights", []),
                analysisTimestamp=processed_analysis.get("analysisTimestamp", datetime.utcnow()),
                selectedComponents=processed_analysis.get("selectedComponents", {
                    request.componentType: True,
                    "data": True,
                    "visualization": True
                }),
                metadata=processed_analysis.get("metadata", {})
            )
        return processed_analysis
        
    except Exception as e:
        print(f"Dashboard analysis error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
client = OpenAI(api_key=OPENAI_API_KEY)

@app.post("/api/tts")
async def text_to_speech(request: dict):
    try:
        text = request["text"]
        
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",  # Options: alloy, echo, fable, onyx, nova, shimmer
            input=text
        )
        
        audio_data = io.BytesIO(response.content)
        audio_data.seek(0)
        
        return StreamingResponse(
            audio_data,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment;filename=speech.mp3"
            }
        )
        
    except Exception as e:
        print("TTS error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: dict  # Contains simulation results and insights

class DashboardChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Dict[str, Any]  # Contains componentType, componentData, and insights

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Format the chat context for GPT
        context_prompt = f"""You are analyzing simulation results for an AI lending system with cultural intelligence.

Current simulation metrics:
Approval Rate: {request.context.get('results', {}).get('metrics', {}).get('approvalRate', {})}
Risk Score: {request.context.get('results', {}).get('metrics', {}).get('riskScore', {})}
Cultural Alignment: {request.context.get('results', {}).get('metrics', {}).get('culturalAlignment', {})}
Financial Inclusion: {request.context.get('results', {}).get('metrics', {}).get('financialInclusion', {})}

Previous insights generated:
{request.context.get('insights', [])}

Previous conversation:
{' '.join([f"{msg.role}: {msg.content}" for msg in request.messages[:-1]])}

User question: {request.messages[-1].content}

Please provide a clear, specific answer based on the simulation data and insights. Focus on actionable information and specific metrics when relevant."""

        # Get completion from OpenAI
        completion = client.chat.completions.create(
            model="gpt-4-0125-preview",
            messages=[
                {"role": "system", "content": "You are an AI analyst specializing in cultural intelligence and financial decision-making patterns."},
                {"role": "user", "content": context_prompt}
            ],
            temperature=0.7,
            max_tokens=250
        )
        
        response = completion.choices[0].message.content

        # Ensure response ends with a complete sentence
        if not response.endswith(('.', '!', '?')):
            response = response.rsplit('.', 1)[0] + '.'

        return {
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
            
    except Exception as e:
        print("Chat error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/chat/dashboard")
async def dashboard_chat(request: DashboardChatRequest):
    try:
        # Keep the greeting check
        last_message = request.messages[-1].content.strip().lower()
        if last_message in ['hi', 'hello', 'hey']:
            return {
                "response": "Hello! How can I help you analyze this component's data?",
                "timestamp": datetime.utcnow().isoformat()
            }

        # Define component-specific contexts
        component_contexts = {
            "cultural-alignment": {
                "focus": "alignment scores and cultural impact trends",
                "key_metrics": ["score", "trend", "culturalPeriodScore", "normalPeriodScore"],
                "analysis_points": ["Score trends", "Cultural vs normal periods", "Adaptation progress"]
            },
            "cultural-periods": {
                "focus": "active and upcoming cultural events",
                "key_metrics": ["totalEvents", "highImpact", "averageChange"],
                "analysis_points": ["Active periods", "Predicted events", "Historical patterns"]
            },
            "decision-impact": {
                "focus": "approval rates and regional patterns",
                "key_metrics": ["approvalRate", "culturalPeriods", "normalPeriods", "significantEvents"],
                "analysis_points": ["Regional variations", "Cultural period impact", "Decision patterns"]
            },
            "cultural-pattern-alerts": {
                "focus": "detected anomalies and alerts",
                "key_metrics": ["total", "adaptationProgress", "accuracy", "drift"],
                "analysis_points": ["Alert patterns", "Severity distribution", "Model performance"]
            },
            "community-impact": {
                "focus": "regional performance and cultural factors",
                "key_metrics": ["averageApprovalRate", "highestImpact", "lowestImpact"],
                "analysis_points": ["Regional disparities", "Cultural adaptation", "Community access"]
            },
            "event-analytics": {
                "focus": "significant events and predictions",
                "key_metrics": ["totalEvents", "averageImpact", "aiAdaptation", "forecastConfidence"],
                "analysis_points": ["Event patterns", "Impact analysis", "Forecast accuracy"]
            }
        }

        component_type = request.context['componentType']
        component_info = component_contexts.get(component_type, {
            "focus": "component data",
            "key_metrics": [],
            "analysis_points": ["General analysis"]
        })

        # Enhanced context prompt
        context_prompt = f"""You are analyzing {component_info['focus']} in an AI lending system with cultural intelligence.

Component: {component_type}
Focus Areas: {', '.join(component_info['analysis_points'])}
Key Metrics to Consider: {', '.join(component_info['key_metrics'])}

Current Component Data:
{json.dumps(request.context['componentData'], indent=2)}

Previous Insights:
{request.context.get('insights', [])}

Previous Conversation:
{' '.join([f"{msg.role}: {msg.content}" for msg in request.messages[:-1]])}

User Question: {request.messages[-1].content}

Please provide a specific answer that:
1. Focuses on this component's metrics and patterns
2. References relevant data points when available
3. Maintains context of the component type
4. Provides actionable insights when appropriate"""

        # Get completion from OpenAI with the same parameters
        completion = client.chat.completions.create(
            model="gpt-4-0125-preview",
            messages=[
                {
                    "role": "system", 
                    "content": f"You are an AI analyst specializing in cultural intelligence and lending patterns, focusing on {component_info['focus']}."
                },
                {"role": "user", "content": context_prompt}
            ],
            temperature=0.7,
            max_tokens=250,
            stop=[".", "!", "?"]
        )
        
        response = completion.choices[0].message.content

        # Keep the sentence completion logic
        if not response.endswith(('.', '!', '?')):
            last_sentence_end = max(
                response.rfind('.'),
                response.rfind('!'),
                response.rfind('?')
            )
            if last_sentence_end != -1:
                response = response[:last_sentence_end + 1]
            else:
                response = response + '.'

        return {
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
            
    except Exception as e:
        print("Dashboard chat error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class AnomaliesChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Dict[str, Any]  # Contains data and insights

class AnomaliesChatResponse(BaseModel):
    response: str
    timestamp: str
    
@app.post("/api/analyze/anomalies")
async def analyze_anomalies(request: dict) -> AIAnalysisResponse:
    try:
        print(f"Analyzing anomalies data")
        print(f"Data: {request['data']}")
        
        analysis = anomalies_gpt_service.analyze_anomalies(request['data'])
        
        # Process and enhance the analysis using the existing insight manager
        processed_analysis = insight_manager.process_analysis(analysis)
        
        return processed_analysis
        
    except Exception as e:
        print(f"Anomalies analysis error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/anomalies")
async def anomalies_chat(request: AnomaliesChatRequest):
    try:
        # Format the chat context for GPT
        context_prompt = f"""You are analyzing anomalies in an AI lending system with cultural intelligence.

Current anomalies data:
Violations: {len(request.context['data'].get('violations', []))} cultural pattern violations
Decisions: {len(request.context['data'].get('decisions', {}).get('metrics', []))} decision conflicts
Deviations: {len(request.context['data'].get('deviations', []))} unusual deviations

Previous insights generated:
{request.context.get('insights', [])}

Previous conversation:
{' '.join([f"{msg.role}: {msg.content}" for msg in request.messages[:-1]])}

User question: {request.messages[-1].content}

Please provide a clear, specific answer focused on the anomalies data. Consider:
1. Patterns across different types of anomalies
2. Relationships between violations, conflicts, and deviations
3. Cultural context and impact
4. Specific metrics and trends when relevant"""

        # Keep the greeting check from your dashboard chat
        last_message = request.messages[-1].content.strip().lower()
        if last_message in ['hi', 'hello', 'hey']:
            return {
                "response": "Hello! How can I help you analyze the anomalies data?",
                "timestamp": datetime.utcnow().isoformat()
            }

        # Get completion from OpenAI
        completion = client.chat.completions.create(
            model="gpt-4-0125-preview",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an AI analyst specializing in detecting and analyzing cultural anomalies in financial data."
                },
                {"role": "user", "content": context_prompt}
            ],
            temperature=0.7,
            max_tokens=250
        )
        
        response = completion.choices[0].message.content

        # Ensure response ends with a complete sentence
        if not response.endswith(('.', '!', '?')):
            last_sentence_end = max(
                response.rfind('.'),
                response.rfind('!'),
                response.rfind('?')
            )
            if last_sentence_end != -1:
                response = response[:last_sentence_end + 1]
            else:
                response = response + '.'

        return {
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
            
    except Exception as e:
        print("Anomalies chat error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/predictive")
async def analyze_predictive(request: dict) -> AIAnalysisResponse:
    try:
        print(f"Analyzing predictive data")
        print(f"Data: {request['data']}")
        
        analysis = predictive_gpt_service.analyze_predictive(request['data'])
        processed_analysis = insight_manager.process_analysis(analysis)
        
        return processed_analysis
        
    except Exception as e:
        print(f"Predictive analysis error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class PredictiveChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Dict[str, Any]  # Contains forecast and events data + insights

class PredictiveChatResponse(BaseModel):
    response: str
    timestamp: str

@app.post("/api/chat/predictive")
async def predictive_chat(request: PredictiveChatRequest):
    try:
        # Format the chat context for GPT
        context_prompt = f"""You are analyzing predictive insights in an AI lending system with cultural intelligence.

Current predictive data:
Forecast: {len(request.context['data'].get('forecast', {}).get('forecast', []))} predictions
Events: {len(request.context['data'].get('events', []))} upcoming events

Previous insights generated:
{request.context.get('insights', [])}

Previous conversation:
{' '.join([f"{msg.role}: {msg.content}" for msg in request.messages[:-1]])}

User question: {request.messages[-1].content}

Please provide a clear, specific answer focused on the predictive data. Consider:
1. Forecast patterns and trends
2. Upcoming cultural events and their impact
3. Regional variations and cultural context
4. Specific metrics and confidence levels when relevant"""

        # Keep the greeting check
        last_message = request.messages[-1].content.strip().lower()
        if last_message in ['hi', 'hello', 'hey']:
            return {
                "response": "Hello! How can I help you analyze the predictive insights?",
                "timestamp": datetime.utcnow().isoformat()
            }

        # Get completion from OpenAI
        completion = client.chat.completions.create(
            model="gpt-4-0125-preview",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an AI analyst specializing in predictive analytics and cultural financial patterns."
                },
                {"role": "user", "content": context_prompt}
            ],
            temperature=0.7,
            max_tokens=250
        )
        
        response = completion.choices[0].message.content

        # Ensure response ends with a complete sentence
        if not response.endswith(('.', '!', '?')):
            last_sentence_end = max(
                response.rfind('.'),
                response.rfind('!'),
                response.rfind('?')
            )
            if last_sentence_end != -1:
                response = response[:last_sentence_end + 1]
            else:
                response = response + '.'

        return {
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
            
    except Exception as e:
        print("Predictive chat error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/optimize")
async def optimize_parameters(request: OptimizationRequest) -> OptimizationResponse:

    try:
        if not request.currentResults:
            raise HTTPException(
                status_code=400, 
                detail="Current simulation results required"
            )

        print(f"Optimizing for scenario: {request.scenario}")
        print(f"Current parameters: {request.currentParameters}")
        
        optimized_params, improvements, reasoning = optimizer_service.optimize_parameters(
            request.scenario,
            request.currentResults,
            request.currentParameters
        )
        
        return OptimizationResponse(
            optimizedParameters=optimized_params,
            improvements=improvements,
            reasoning=reasoning
        )
        
    except Exception as e:
        print("Optimization error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/pre-optimize")
async def pre_optimize_parameters(request: OptimizationRequest):
    """Generate quick insights before full optimization"""
    try:
        if not request.currentResults:
            raise HTTPException(
                status_code=400, 
                detail="Current simulation results required"
            )

        insights = optimizer_service.analyze_pre_optimization(
            request.scenario,
            request.currentResults,
            request.currentParameters
        )
        
        return {"insights": insights}
        
    except Exception as e:
        print("Pre-optimization analysis error:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))