from typing import Any
import json
from datetime import datetime
from fastapi import HTTPException
from models.schemas import Insight, AIAnalysisResponse
from .gpt_service import GPTService
from .dashboard_prompts import get_dashboard_prompt

class DashboardGPTService(GPTService):
    def analyze_dashboard(self, component_type: str, data: Any) -> AIAnalysisResponse:
        prompt = get_dashboard_prompt(component_type, data)
        
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": prompt}],
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            insights_data = json.loads(completion.choices[0].message.content)
            insights = [Insight(**insight) for insight in insights_data["insights"]]
            
            # Create the response with all required fields
            return AIAnalysisResponse(
                insights=insights,
                analysisTimestamp=datetime.utcnow(),
                # Add the required selectedComponents field
                selectedComponents={
                    "data": True,
                    "visualization": True,
                    component_type: True
                },
                metadata=insights_data.get("metadata", {})
            )
            
        except Exception as e:
            print(f"Error in analyze_dashboard: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))