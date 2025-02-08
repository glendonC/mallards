from typing import List, Dict, Any, Literal
from datetime import datetime
from models.schemas import (
    Insight,
    AIAnalysisResponse
)

class InsightManager:
    def __init__(self):
        self.confidence_threshold = 0.7
    
    def filter_insights(self, insights: List[Insight]) -> List[Insight]:
        """Filter insights based on confidence and relevance."""
        return [
            insight for insight in insights
            if insight.confidence >= self.confidence_threshold
        ]
    
    def categorize_insights(self, insights: List[Insight]) -> Dict[Literal["general", "risks", "opportunities"], List[Insight]]:
        """Group insights by category."""
        categories: Dict[Literal["general", "risks", "opportunities"], List[Insight]] = {
            "general": [],
            "risks": [],
            "opportunities": []
        }
        
        for insight in insights:
            categories[insight.category].append(insight)
            
        return categories
    
    def prioritize_insights(self, insights: List[Insight]) -> List[Insight]:
        """Sort insights by importance."""
        return sorted(
            insights,
            key=lambda x: (
                x.confidence,  # Higher confidence first
                len(x.relatedMetrics),  # More related metrics indicates higher importance
                -len(x.content)  # Shorter insights preferred when other factors equal
            ),
            reverse=True
        )
    
    def process_analysis(self, response: AIAnalysisResponse) -> AIAnalysisResponse:
        """Process and enhance the analysis response."""
        
        # Filter low-confidence insights
        filtered_insights = self.filter_insights(response.insights)
        
        # Prioritize remaining insights
        prioritized_insights = self.prioritize_insights(filtered_insights)
        
        # Update the response
        response.insights = prioritized_insights
        response.metadata["processedAt"] = datetime.utcnow().isoformat()
        response.metadata["insightStats"] = {
            "total": len(response.insights),
            "byCategory": {
                category: len(insights)
                for category, insights in self.categorize_insights(response.insights).items()
            }
        }
        
        return response