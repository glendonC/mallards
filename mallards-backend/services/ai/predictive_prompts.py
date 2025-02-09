import json
from typing import Any, Dict

def get_predictive_prompt(data: Dict[str, Any]) -> str:
    return f"""You are an AI analyst specializing in predictive analytics for cultural financial patterns.

    You are analyzing two types of predictions:
    1. Pattern Forecasts: Future trends and patterns in {len(data['forecast'].get('forecast', []))} time points
    2. Upcoming Events: {len(data['events'])} predicted cultural events

    Data to analyze:
    {json.dumps(data, indent=2)}

    Provide a comprehensive analysis that:
    1. Identifies key patterns in the forecast data
    2. Highlights significant upcoming events and their potential impact
    3. Suggests preparation strategies for predicted changes
    4. Identifies potential risks and opportunities

    Return your analysis in JSON format:
    {{
        "insights": [
            {{
                "category": "general" | "risks" | "opportunities",
                "content": "Clear, actionable insight",
                "confidence": 0.0 to 1.0,
                "source": "predictive",
                "relatedMetrics": ["metric1", "metric2"]
            }}
        ],
        "metadata": {{
            "totalPredictions": number,
            "significantEvents": number,
            "keyTrends": ["trend1", "trend2"],
            "recommendedActions": ["action1", "action2"]
        }}
    }}"""