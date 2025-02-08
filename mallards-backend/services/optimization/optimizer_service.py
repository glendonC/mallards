from openai import OpenAI
import json
from models.schemas import OptimizedParameters, OptimizationImprovement
from config.settings import OPENAI_API_KEY

class OptimizerService:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.scenario_descriptions = {
            'minority-approval': "High rejection rates in minority communities",
            'cultural-event': "Seasonal spending patterns during cultural festivals",
            'fraud-threshold': "Balance fraud detection with cultural spending patterns",
            'recession': "Economic downturn affecting lending approvals",
            'bias-reduction': "Algorithmic bias in lending decisions",
            'seasonal-credit': "Seasonal credit needs during cultural periods"
        }

    def optimize_parameters(self, scenario: str, current_results, current_parameters):
        scenario_context = self.scenario_descriptions.get(scenario, scenario)
        
        prompt = f"""You are an AI expert optimizing financial lending parameters to improve fairness while managing risk.

SCENARIO: {scenario_context}

CURRENT PARAMETERS:
{json.dumps(current_parameters.dict(), indent=2)}

CURRENT RESULTS:
{json.dumps(current_results.dict(), indent=2)}

Generate optimized parameters and detailed reasoning. Return a JSON object structured as:
{{
  "optimizedParameters": {{
    "approvalRateSensitivity": <float, 0.7-1.5>,
    "spendingMultiplier": <float, 0.8-1.5>,
    "fraudThreshold": <float, 0.7-0.95>,
    "culturalWeighting": <float, 0.8-1.6>
  }},
  "improvements": [
    {{
      "metric": <string>,
      "before": <float>,
      "after": <float>,
      "percentChange": <float>
    }}
  ],
  "reasoning": [<string explanations>]
}}

Focus on improving cultural inclusivity while maintaining risk controls."""

        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are an AI lending optimization expert."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )

        try:
            result = json.loads(response.choices[0].message.content)
            
            optimized_params = OptimizedParameters(**result["optimizedParameters"])
            improvements = [OptimizationImprovement(**imp) for imp in result["improvements"]]
            reasoning = result["reasoning"]

            return optimized_params, improvements, reasoning

        except Exception as e:
            print(f"Error processing optimization response: {e}")
            raise

    def analyze_pre_optimization(self, scenario: str, current_results, current_parameters):
        """Generate quick insights before full optimization"""
        scenario_context = self.scenario_descriptions.get(scenario, scenario)
        
        prompt = f"""You are an AI expert providing quick insights on financial lending parameters.

SCENARIO: {scenario_context}

CURRENT PARAMETERS:
{json.dumps(current_parameters.dict(), indent=2)}

CURRENT RESULTS:
{json.dumps(current_results.dict(), indent=2)}

Generate 2-3 brief, specific insights about potential parameter adjustments that could improve performance.
Focus on the most impactful changes. Return a JSON object with an 'insights' array of strings.
Each insight should be 1-2 sentences and actionable.

Example format:
{{
    "insights": [
        "Your approval sensitivity (0.8) is lower than optimal for this cultural period—consider increasing to 1.0-1.2 to better accommodate seasonal patterns.",
        "The cultural weighting could be increased to better balance risk and inclusion."
    ]
}}"""

        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are an AI lending optimization expert."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )

        try:
            result = json.loads(response.choices[0].message.content)
            return result["insights"]
        except Exception as e:
            print(f"Error processing pre-optimization analysis: {e}")
            raise