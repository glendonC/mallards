import openai
import json
from datetime import datetime
from fastapi import HTTPException
import logging
from models.schemas import (
    AIAnalysisRequest,
    AIAnalysisResponse,
    AIQueryRequest,
    Insight,
)
from .prompt_templates import (
    get_analysis_prompt,
    get_query_prompt
)

logger = logging.getLogger(__name__)

class GPTService:
    def __init__(self, api_key: str, model: str = "gpt-4-0125-preview"):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model
        
    def analyze_simulation(self, request: AIAnalysisRequest) -> AIAnalysisResponse:
        """Analyze simulation results using GPT."""
        prompt = get_analysis_prompt(request)
        
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an AI analyst specializing in cultural intelligence and financial decision-making patterns."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
                response_format={ "type": "json_object" }
            )
            
            # Parse the JSON response
            response_content = completion.choices[0].message.content
            insights_data = json.loads(response_content)
            
            # Convert to our schema
            insights = [
                Insight(
                    category=insight["category"],
                    content=insight["content"],
                    confidence=insight["confidence"],
                    source=insight["source"],
                    relatedMetrics=insight["relatedMetrics"]
                )
                for insight in insights_data["insights"]
            ]
            
            return AIAnalysisResponse(
                insights=insights,
                analysisTimestamp=datetime.utcnow(),
                selectedComponents=request.selectedComponents,
                metadata=insights_data.get("metadata", {})
            )
            
        except Exception as e:
            logger.error(f"GPT analysis failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Analysis failed: {str(e)}"
            )
    
    def answer_query(self, request: AIQueryRequest) -> str:
        """Answer a specific query about the simulation results."""
        prompt = get_query_prompt(request)
        
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an AI analyst specializing in cultural intelligence and financial decision-making patterns."},
                    *[{"role": msg.role, "content": msg.content} for msg in request.conversationHistory],
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            logger.error(f"GPT query failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Query failed: {str(e)}"
            )