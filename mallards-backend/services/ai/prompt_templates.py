from typing import Dict
from models.schemas import AIAnalysisRequest, AIQueryRequest

def format_metrics(metrics: Dict[str, Dict[str, float]]) -> str:
    """Format metrics for prompt."""
    result = []
    for metric, values in metrics.items():
        change = values["after"] - values["before"]
        change_pct = (change / values["before"]) * 100 if values["before"] != 0 else 0
        result.append(
            f"{metric}:\n"
            f"- Before: {values['before']:.2%}\n"
            f"- After: {values['after']:.2%}\n"
            f"- Change: {change_pct:+.2f}%"
        )
    return "\n".join(result)

def get_analysis_prompt(request: AIAnalysisRequest) -> str:
    """Generate analysis prompt based on request."""
    
    prompt_parts = []
    
    # Add scenario context if available
    if request.scenario:
        prompt_parts.append(f"""
    Context:
    Scenario: {request.scenario.name}
    Description: {request.scenario.description}
    """)
        
        # Add parameters
        prompt_parts.append(f"""
    Simulation Parameters:
    - Approval Rate Sensitivity: {request.parameters.approvalRateSensitivity}
    - Spending Multiplier: {request.parameters.spendingMultiplier}
    - Fraud Threshold: {request.parameters.fraudThreshold}
    - Cultural Weighting: {request.parameters.culturalWeighting}
    """)
        
        # Add results analysis if selected
        if request.selectedComponents.get("results", True) and request.results:
            prompt_parts.append(f"""
    Results Analysis:
    {format_metrics(request.results.metrics.__dict__)}

    Timeline Analysis:
    - Number of periods: {len(request.results.predictions.dates)}
    - Average baseline: {sum(request.results.predictions.baseline) / len(request.results.predictions.baseline):.2f}
    - Average simulated: {sum(request.results.predictions.simulated) / len(request.results.predictions.simulated):.2f}
    """)
        
        # Add regional impact analysis if selected
        if request.selectedComponents.get("visualization", True) and request.results:
            region_impacts = "\n".join([
                f"- {impact.region}: {impact.delta:+.2%} change (significance: {impact.significance:.2f})"
                for impact in request.results.regionalImpact
            ])
            prompt_parts.append(f"""
    Regional Impact Analysis:
    {region_impacts}
    """)
        
        # Add response instructions
        prompt_parts.append("""
    Please analyze this simulation data and provide insights in the following JSON format:
    {
        "insights": [
            {
                "category": "general" | "risks" | "opportunities",
                "content": "Clear, actionable insight text",
                "confidence": 0.0 to 1.0,
                "source": "results" | "visualization",
                "relatedMetrics": ["metricName1", "metricName2"]
            }
        ],
        "metadata": {
            "keyFindings": ["finding1", "finding2"],
            "recommendedActions": ["action1", "action2"]
        }
    }

    Focus on:
    1. Clear patterns in the data
    2. Significant changes and their implications
    3. Cultural impact and regional variations
    4. Potential risks and opportunities
    5. Actionable recommendations
    """)
    
    return "\n".join(prompt_parts)

def get_query_prompt(request: AIQueryRequest) -> str:
    """Generate query prompt based on request."""
    
    context = f"""
    You are analyzing simulation results for an AI lending system with cultural intelligence.

    Current simulation state:
    {format_metrics(request.results.metrics.__dict__)}

    The user's question is: {request.query}

    Please provide a clear, specific answer based on the simulation data. Focus on actionable insights and specific metrics when relevant.
    """
    
    return context