import json
from typing import Any, Dict

def get_anomalies_prompt(data: Dict[str, Any]) -> str:
    return f"""You are an AI analyst specializing in detecting and analyzing cultural anomalies in financial data.

    You are analyzing three types of anomalies:
    1. Cultural Pattern Violations: {len(data['violations'])} violations detected
    2. AI Decision Conflicts: {len(data['decisions'].get('metrics', []))} metrics analyzed
    3. Unusual Deviations: {len(data['deviations'])} deviations found

    Data to analyze:
    {json.dumps(data, indent=2)}

    Provide a comprehensive analysis that:
    1. Identifies patterns across all three anomaly types
    2. Highlights critical relationships between different anomalies
    3. Suggests potential root causes
    4. Recommends mitigation strategies

    Return your analysis in JSON format:
    {{
        "insights": [
            {{
                "category": "general" | "risks" | "opportunities",
                "content": "Clear, actionable insight",
                "confidence": 0.0 to 1.0,
                "source": "anomalies",
                "relatedMetrics": ["metric1", "metric2"]
            }}
        ],
        "metadata": {{
            "totalAnomalies": number,
            "criticalAnomalies": number,
            "primaryConcerns": ["concern1", "concern2"],
            "recommendedActions": ["action1", "action2"]
        }}
    }}"""