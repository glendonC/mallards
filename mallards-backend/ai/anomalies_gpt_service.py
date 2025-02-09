from typing import Any, Dict
import json
from datetime import datetime
from fastapi import HTTPException
from models.schemas import Insight, AIAnalysisResponse
from .gpt_service import GPTService
from .anomalies_prompts import get_anomalies_prompt

class AnomaliesGPTService(GPTService):
    def analyze_anomalies(self, data: Dict[str, Any]) -> AIAnalysisResponse:
        prompt = get_anomalies_prompt(data)
        
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
            
            return AIAnalysisResponse(
                insights=insights,
                analysisTimestamp=datetime.utcnow(),
                selectedComponents={
                    "data": True,
                    "visualization": True,
                    "anomalies": True
                },
                metadata=insights_data.get("metadata", {})
            )
            
        except Exception as e:
            print(f"Error in analyze_anomalies: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))