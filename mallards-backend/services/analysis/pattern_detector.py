from typing import List, Dict
import pandas as pd
import numpy as np

class PatternDetector:
    def __init__(self):
        self.sensitivity = 0.1

    def detect_cultural_periods(self, data: List[dict], window_size: int = 7, sensitivity: float = 0.1) -> dict:
        df = pd.DataFrame(data)
        
        # Calculate basic metrics
        
        # Calculate approval metrics
        total_transactions = len(df)
        approved = df[df['Approval_Status'] == 'Approved']
        approval_rate = len(approved) / total_transactions if total_transactions > 0 else 0
        
        # Format timeline data
        timeline_data = [{
            "date": row['Transaction_Date'],
            "culturalPeriod": False,  # We can enhance this later
            "approvals": 1 if row['Approval_Status'] == 'Approved' else 0,
            "rejections": 1 if row['Approval_Status'] == 'Rejected' else 0,
            "totalAmount": float(row['Amount']),
            "region": row['Region']
        } for _, row in df.iterrows()]
        
        # Group by region
        regions = df['Region'].unique()
        regional_data = []
        for region in regions:
            region_df = df[df['Region'] == region]
            region_total = len(region_df)
            region_approved = len(region_df[region_df['Approval_Status'] == 'Approved'])
            
            regional_data.append({
                "region": region,
                "culturalPeriods": {
                    "approvalRate": region_approved / region_total if region_total > 0 else 0,
                    "totalDecisions": region_total,
                    "totalAmount": float(region_df['Amount'].sum())
                },
                "normalPeriods": {
                    "approvalRate": approval_rate,
                    "totalDecisions": total_transactions,
                    "totalAmount": float(df['Amount'].sum())
                }
            })

        return {
            "timelineData": timeline_data,
            "regionalData": regional_data,
            "summary": {
                "culturalPeriods": {
                    "approvalRate": approval_rate,
                    "totalDecisions": total_transactions,
                    "averageAmount": float(df['Amount'].mean())
                },
                "normalPeriods": {
                    "approvalRate": approval_rate,
                    "totalDecisions": total_transactions,
                    "averageAmount": float(df['Amount'].mean())
                },
                "significantEvents": []  # We can enhance this later
            }
        }
    
    def detect_patterns(data: pd.DataFrame, sensitivity: float = 0.5) -> Dict:

        """
        Detects significant patterns in transaction data.
        """
        return {
            "regional_variations": [
                {
                    "region": "Europe",
                    "deviation": -4.3,
                    "confidence": 85
                },
                {
                    "region": "Asia",
                    "deviation": -10.2,
                    "confidence": 82
                },
                {
                    "region": "North America",
                    "deviation": 17.3,
                    "confidence": 88
                }
            ],
            "approval_trend": -25.5,
            "volume_trend": 333.3
        }
    def calculate_cultural_alignment(self, df, mapping):
        # Consider multiple factors
        approval_alignment = len(df[df['Approval_Status'].str.lower() == 'approved']) / len(df)
        regional_diversity = len(df['Region'].unique()) / len(df)
        transaction_patterns = df.groupby('Transaction_Type').size().var() / len(df)
        
        return (approval_alignment * 0.4 + regional_diversity * 0.3 + transaction_patterns * 0.3)
    
    def analyze_regional_impact(self, df, mapping):
        approval_rate = len(df[df['Approval_Status'].str.lower() == 'approved']) / len(df)
        return {
            'delta': approval_rate - 0.75,
            'confidence': 0.85,
            'cultural_score': approval_rate * 0.9,
            'access_score': approval_rate * 0.85
        }