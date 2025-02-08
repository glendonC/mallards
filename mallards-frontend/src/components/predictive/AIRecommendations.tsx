import React, { useState } from 'react';
import { Brain, Settings, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Recommendation {
  id: string;
  type: 'threshold' | 'monitoring' | 'risk';
  title: string;
  description: string;
  impact: number;
  confidence: number;
  suggestedActions: string[];
  status: 'pending' | 'implemented' | 'dismissed';
}

interface Props {
  recommendations: Recommendation[];
  modelName: string;
  modelConfidence: number;
  onImplement: (id: string) => void;
  onDismiss: (id: string) => void;
  isLoading?: boolean;
}

const AIRecommendations: React.FC<Props> = ({
  recommendations,
  modelName,
  modelConfidence,
  onImplement,
  onDismiss,
  isLoading = false
}) => {
  const { customColors } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'threshold':
        return <Settings className="w-5 h-5 text-blue-500" />;
      case 'monitoring':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'risk':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: customColors?.tileColor }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium mb-1" style={{ color: customColors?.textColor }}>
            AI Recommendations
          </h3>
          <div className="flex items-center gap-2 text-sm" style={{ color: customColors?.textColor }}>
            <Brain className="w-4 h-4" />
            <span>Using {modelName}</span>
            <span className={`font-medium ${getConfidenceColor(modelConfidence)}`}>
              {modelConfidence}% confidence
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map(rec => (
          <div
            key={rec.id}
            className="rounded-lg p-4"
            style={{ backgroundColor: `${customColors?.backgroundColor}20` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getTypeIcon(rec.type)}
                <div>
                  <h4 className="font-medium mb-1" style={{ color: customColors?.textColor }}>
                    {rec.title}
                  </h4>
                  <p className="text-sm opacity-75 mb-2" style={{ color: customColors?.textColor }}>
                    {rec.description}
                  </p>
                  
                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span style={{ color: customColors?.textColor }}>
                        {rec.impact}% impact
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Brain className="w-4 h-4 text-blue-500" />
                      <span className={getConfidenceColor(rec.confidence)}>
                        {rec.confidence}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <ChevronRight 
                className={`w-5 h-5 cursor-pointer transition-transform ${
                  expandedId === rec.id ? 'rotate-90' : ''
                }`}
                style={{ color: customColors?.textColor }}
                onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
              />
            </div>

            {/* Expanded Content */}
            {expandedId === rec.id && (
              <div className="mt-4 pl-8">
                <div className="space-y-2 mb-4">
                  {rec.suggestedActions.map((action, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: customColors?.textColor }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ 
                        backgroundColor: String(customColors?.primary) || '#3b82f6'
                      }} />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>

                {rec.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 rounded text-sm"
                      style={{ 
                        backgroundColor: String(customColors?.primary),
                        color: 'white'
                      }}
                      onClick={() => onImplement(rec.id)}
                    >
                      Implement
                    </button>
                    <button
                      className="px-3 py-1 rounded text-sm border"
                      style={{ 
                        borderColor: customColors?.borderColor,
                        color: customColors?.textColor
                      }}
                      onClick={() => onDismiss(rec.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {rec.status !== 'pending' && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: customColors?.textColor }}>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{rec.status === 'implemented' ? 'Implemented' : 'Dismissed'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendations; 