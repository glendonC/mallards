import json
from typing import Any, Dict

def get_component_prompt(component_type: str, data: Any) -> str:
    base_prompts = {
        "cultural-alignment": """You are analyzing Cultural Alignment data. Focus on:
    1. Overall alignment score: {data.score}%
    2. Cultural vs normal period performance
    3. Trend direction: {data.trend}%
    4. AI confidence: {data.confidence}%

    Provide analysis in these categories:
    - General: Overall health and metrics
    - Risks: Concerning trends or patterns
    - Opportunities: Areas for improvement

    Format insights clearly and use metrics when available.""",

            "cultural-periods": """You are analyzing Cultural Period data for:
    - Active periods: {len(data.active)}
    - Upcoming events: {len(data.upcoming)}
    - Historical metrics
    - Impact predictions

    Structure insights around:
    - General: Current status and predictions
    - Risks: Potential conflicts or overlaps
    - Opportunities: Preparation strategies""",

            "decision-impact": """Analyzing Decision Impact across:
    - Cultural Periods: {data.summary.culturalPeriods.approvalRate * 100}% approval
    - Normal Periods: {data.summary.normalPeriods.approvalRate * 100}% approval
    - Regional variations
    - {len(data.summary.significantEvents)} significant events

    Focus insights on:
    - General: Key metrics and patterns
    - Risks: Major deviations and concerns
    - Opportunities: Improvement areas""",

            "cultural-pattern-alerts": """Analyzing Pattern Alerts showing:
    - {data.summary.total} total alerts
    - Severity distribution: {data.summary.bySeverity}
    - Model accuracy: {data.modelMetrics.accuracy}%
    - AI adaptation: {data.summary.adaptationProgress}%

    Structure analysis around:
    - General: Alert patterns and metrics
    - Risks: High-severity patterns
    - Opportunities: Prevention strategies""",

            "community-impact": """Analyzing Community Impact across:
    - {len(data.regions)} regions
    - Average approval rate: {data.summary.averageApprovalRate}%
    - Regional variations and cultural factors

    Provide insights on:
    - General: Regional performance
    - Risks: Regional disparities
    - Opportunities: Regional improvements""",

            "event-analytics": """Analyzing Event Analytics showing:
    - {data.summary.totalEvents} significant events
    - Average impact: {data.summary.averageImpact}%
    - AI adaptation: {data.summary.aiAdaptation}%
    {data.summary.forecastConfidence and f"- Forecast confidence: {data.summary.forecastConfidence}%" or ""}

    Structure insights around:
    - General: Event patterns and predictions
    - Risks: Concerning patterns
    - Opportunities: Preparation strategies"""
    }

    prompt_template = base_prompts.get(component_type, "Analyze the provided data")
    return prompt_template.format(data=data)

def get_dashboard_prompt(component_type: str, data: Any) -> str:
    component_context = {
        "cultural-alignment": "You are analyzing real-time cultural alignment metrics and trends.",
        "cultural-periods": "You are analyzing active and upcoming cultural periods affecting financial decisions.",
        "decision-impact": "You are analyzing the impact of decisions across different cultural contexts.",
        "pattern-alerts": "You are analyzing detected cultural pattern anomalies and alerts.",
        "community-impact": "You are analyzing community impact metrics across regions.",
        "event-analytics": "You are analyzing cultural event patterns and their financial implications."
    }

    return f"""You are an AI analyst specializing in cultural intelligence and financial decision-making.

    {component_context[component_type]}

    Data to analyze:
    {json.dumps(data, indent=2)}

    Provide analysis in JSON format:
    {{
        "insights": [
            {{
                "category": "general" | "risks" | "opportunities",
                "content": "Clear, actionable insight",
                "confidence": 0.0 to 1.0,
                "source": "{component_type}",
                "relatedMetrics": ["metric1", "metric2"]
            }}
        ]
    }}"""