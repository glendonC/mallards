from typing import List, Optional, Dict, Any, Literal, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator

class RegionMetrics(BaseModel):
    approvalRate: float
    culturalImpact: float
    totalDecisions: int
    transactionVolume: float

class CulturalFactor(BaseModel):
    name: str
    influence: float
    trend: Literal['increasing', 'decreasing', 'stable']

class RegionData(BaseModel):
    code: str
    name: str
    coordinates: Dict[str, float]
    metrics: RegionMetrics
    culturalFactors: List[CulturalFactor]

class CommunityImpactResponse(BaseModel):
    regions: List[RegionData]
    summary: Dict[str, Union[int, float, str]]
    filters: Dict[str, List[str]]

class Transaction(BaseModel):
    transactionDate: datetime
    amount: float
    transactionType: str
    approvalStatus: str
    region: Optional[str]

    class Config:
        populate_by_name = True
          
class ColumnMapping(BaseModel):
    transactionDate: Optional[str]
    amount: Optional[str]
    transactionType: Optional[str]
    approvalStatus: Optional[str]
    region: Optional[str]

    @validator('*', pre=True)
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v

class DetectionRule(BaseModel):
    threshold: float = Field(1000.0, gt=0)
    timeWindow: str = Field(..., pattern='^[0-9]+[hdwmy]$')
    sensitivity: float = Field(2.0, gt=0)
    visualizationType: Literal['line', 'bar', 'scatter'] = 'line'
    alertThreshold: float = Field(0.8, ge=0, le=1)
    predictionWindow: str = Field(..., pattern='^[0-9]+[hdwmy]$')
    autoRefresh: bool = True
    groupBy: List[str]
    culturalFactors: Optional[List[str]] = []
    seasonalAdjustment: Optional[bool] = None
    regionalWeights: Optional[bool] = None

class ModelParameters(BaseModel):
    class IsolationForest(BaseModel):
        contamination: float = Field(..., ge=0, le=0.5)
        n_estimators: int = Field(..., ge=50, le=1000)

    class Autoencoder(BaseModel):
        hidden_layers: Literal['simple', 'medium', 'complex'] = 'medium'
        learning_rate: float = Field(..., ge=0.0001, le=0.01)

    class Prophet(BaseModel):
        seasonality_mode: Literal['additive', 'multiplicative'] = 'additive'
        changepoint_prior_scale: float = Field(..., ge=0.001, le=0.5)

    class ARIMA(BaseModel):
        order: Literal['1,1,1', '2,1,2', '0,1,1', '1,1,2'] = '1,1,1'
        seasonal: Literal['none', 'daily', 'weekly', 'monthly'] = 'none'

class MonitoringFocus(BaseModel):
    focus_type: Literal['pattern', 'decision', 'bias']
    required_fields: List[str]
    thresholds: Dict[str, float]
    time_windows: List[str]
    grouping_fields: List[str]

class PerformanceMetrics(BaseModel):
    accuracy: float = Field(..., ge=0, le=1)
    speed: float = Field(..., ge=0, le=1)
    resource_usage: float = Field(..., ge=0, le=1)
    false_positives: float = Field(..., ge=0, le=100)

class DetailedPerformanceMetrics(BaseModel):
    class PerformanceRange(BaseModel):
        min: float
        max: float
        expected: float

    accuracy: PerformanceRange
    speed: PerformanceRange
    resource_usage: PerformanceRange
    false_positives: PerformanceRange
    confidence_score: float = Field(..., ge=0, le=1)
    data_compatibility: float = Field(..., ge=0, le=1)
    historical_comparison: Optional[Dict[str, float]]


# Simulation Panel AI Insights

class SimulationMetrics(BaseModel):
    approvalRate: Dict[str, float]
    riskScore: Dict[str, float]
    culturalAlignment: Dict[str, float]
    financialInclusion: Dict[str, float]

class SimulationPredictions(BaseModel):
    dates: List[str]
    baseline: List[float]
    simulated: List[float]

class RegionalImpactMetrics(BaseModel):
    region: str
    delta: float
    significance: float
    culturalAdaptation: float
    communityAccess: float

class SimulationParameters(BaseModel):
    approvalRateSensitivity: float
    spendingMultiplier: float
    fraudThreshold: float
    culturalWeighting: float

class SimulationResults(BaseModel):
    metrics: SimulationMetrics
    predictions: SimulationPredictions
    regionalImpact: List[RegionalImpactMetrics]
    parameters: Optional[SimulationParameters] = None

    class Config:
        extra = "allow"

class ScenarioInfo(BaseModel):
    id: str
    name: str
    description: str

class AIAnalysisRequest(BaseModel):
    results: Optional[SimulationResults]
    parameters: SimulationParameters
    scenario: Optional[ScenarioInfo]
    selectedComponents: Dict[str, bool] = Field(
        default_factory=lambda: {"results": True, "visualization": True}
    )
    userQuery: Optional[str]

class Insight(BaseModel):
    category: Literal["general", "risks", "opportunities"]
    content: str
    confidence: float = Field(ge=0, le=1)
    source: str
    relatedMetrics: List[str] = []

class AIAnalysisResponse(BaseModel):
    insights: List[Insight]
    analysisTimestamp: datetime
    selectedComponents: Dict[str, bool]
    metadata: Dict[str, Any] = {}

class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AIQueryRequest(BaseModel):
    query: str
    results: SimulationResults
    parameters: SimulationParameters
    conversationHistory: List[ConversationMessage] = []

# Simulation Sandbox AI Insights END


# Dashboard AI Insights START
class DashboardAnalysisRequest(BaseModel):
    componentType: Literal["cultural-alignment", "cultural-periods", "decision-impact", "pattern-alerts", "community-impact", "event-analytics"]
    data: Dict[str, Any]
    focusMode: Optional[str] = None

class DashboardAnalysisResponse(BaseModel):
    insights: List[Insight]
    analysisTimestamp: datetime
    metadata: Dict[str, Any] = {}
# Dashboard AI Insights END

class MetricPair(BaseModel):
    before: float
    after: float

class OptimizationMetrics(BaseModel):
    approvalRate: MetricPair
    riskScore: MetricPair
    culturalAlignment: MetricPair
    financialInclusion: MetricPair

class OptimizedParameters(BaseModel):
    approvalRateSensitivity: float = Field(ge=0.7, le=1.5)
    spendingMultiplier: float = Field(ge=0.8, le=1.5)
    fraudThreshold: float = Field(ge=0.7, le=0.95)
    culturalWeighting: float = Field(ge=0.8, le=1.6)

class OptimizationImprovement(BaseModel):
    metric: str
    before: float
    after: float
    percentChange: float

class OptimizationRequest(BaseModel):
    scenario: str
    currentParameters: OptimizedParameters
    currentResults: Optional[SimulationResults]

class OptimizationResponse(BaseModel):
    optimizedParameters: OptimizedParameters
    improvements: List[OptimizationImprovement]
    reasoning: List[str]