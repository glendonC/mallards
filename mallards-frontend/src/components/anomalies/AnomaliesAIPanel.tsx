import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Loader2, MessageSquare, AlertTriangle, TrendingUp, Volume2, Pause } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CulturalViolation, 
  AIDecisionData, 
  UnusualDeviation 
} from '../../types/anomaly';

interface AnomaliesAIPanelProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
      violations: CulturalViolation[];
      decisions: AIDecisionData;
      deviations: UnusualDeviation[];
    };
    customColors: any;
  }

interface InsightCardProps {
  content: string;
  style?: React.CSSProperties;
  className?: string;
  customColors: any;
  autoPlay?: boolean;
  onPlaybackEnd?: () => void;
  playbackQueue?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const InsightCard: React.FC<InsightCardProps> = ({ 
  content, 
  style, 
  className, 
  customColors,
  autoPlay = false,
  onPlaybackEnd,
  playbackQueue
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (autoPlay && playbackQueue === 0) {
      playTTS();
    }
  }, [autoPlay, playbackQueue]);

  const playTTS = async () => {
    try {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content })
      });

      if (!response.ok) throw new Error('TTS request failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => {
        setIsPlaying(false);
        if (onPlaybackEnd) {
          onPlaybackEnd();
        }
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [onPlaybackEnd]);

  return (
    <div 
      className={`p-3 rounded-lg border text-sm relative group ${className}`}
      style={{ 
        ...style,
        borderColor: customColors?.borderColor,
        color: customColors?.textColor 
      }}
    >
      {content}
      <button
        onClick={playTTS}
        className="absolute right-2 top-2 p-1 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
        title={isPlaying ? "Stop" : "Play"}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

const AnomaliesAIPanel: React.FC<AnomaliesAIPanelProps> = ({
    isOpen,
    onClose,
    data,
    customColors
}) => {
  const [insights, setInsights] = useState<Array<{
    category: "general" | "risks" | "opportunities";
    content: string;
    confidence: number;
    source: string;
    relatedMetrics: string[];
  }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackQueue, setPlaybackQueue] = useState<number>(-1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeView, setActiveView] = useState<'insights' | 'chat'>('insights');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && data) {
        analyzeComponent();
      }
    }, [isOpen, data]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const preprocessData = () => {
    return {
      violations: data.violations.map(v => ({
        severity: v.severity,
        metrics: v.metrics,
        culturalContext: v.culturalContext,
        timestamp: v.timestamp
      })),
      decisions: {
        metrics: data.decisions.metrics,
        analysis: data.decisions.analysis,
        culturalPeriods: data.decisions.culturalPeriods
      },
      deviations: data.deviations.map(d => ({
        severity: d.severity,
        pattern: d.pattern,
        score: d.score,
        affectedMetrics: d.affectedMetrics
      }))
    };
  };

  const analyzeComponent = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const processedData = preprocessData();
      
      const response = await fetch('http://localhost:8000/api/analyze/anomalies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: processedData
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const responseData = await response.json();
      setInsights(responseData.insights);
      
      // Start autoplay queue when insights are loaded
      if (responseData.insights.length > 0) {
        setPlaybackQueue(0);
      }
    } catch (err) {
      setError(String(err));
      setInsights([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/anomalies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          context: {
            data: preprocessData(),
            insights: insights.map(insight => insight.content)
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const responseData = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseData.response,
        timestamp: new Date(responseData.timestamp)
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const categorizedInsights = insights.reduce((acc, insight, globalIdx) => {
    acc[insight.category].push({
      content: insight.content,
      globalIndex: globalIdx
    });
    return acc;
  }, { general: [], risks: [], opportunities: [] } as Record<string, Array<{ content: string; globalIndex: number }>>);

  const handlePlaybackEnd = () => {
    setPlaybackQueue(prev => {
      const next = prev + 1;
      return next < insights.length ? next : -1;
    });
  };

  const getComponentTitle = () => "Anomalies Analysis";

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-96 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ backgroundColor: customColors?.tileColor }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: customColors?.borderColor }}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
            <h2 className="text-lg font-medium" style={{ color: customColors?.textColor }}>
            AI Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveView('insights')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeView === 'insights' 
                ? 'bg-white shadow text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveView('chat')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeView === 'chat' 
                ? 'bg-white shadow text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Chat
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="h-[calc(100%-116px)] flex flex-col">
        {activeView === 'insights' ? (
          // Insights View
          <div className="flex-1 overflow-y-auto p-4">
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {typeof error === 'object' ? 'Error analyzing component' : error}
                </AlertDescription>
              </Alert>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm" style={{ color: customColors?.textColor }}>
                  Analyzing {getComponentTitle()}...
                </p>
              </div>
            ) : insights.length > 0 ? (
              <div className="space-y-6">
                {/* Render categorized insights */}
                {Object.entries(categorizedInsights).map(([category, items]) => 
                  items.length > 0 && (
                    <div key={category}>
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-2"
                          style={{ color: customColors?.textColor }}>
                        {category === 'general' && <MessageSquare className="w-4 h-4" />}
                        {category === 'risks' && <AlertTriangle className="w-4 h-4" />}
                        {category === 'opportunities' && <TrendingUp className="w-4 h-4" />}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </h3>
                      <div className="space-y-2">
                        {items.map(({ content, globalIndex }) => (
                          <InsightCard
                            key={globalIndex}
                            content={content}
                            customColors={customColors}
                            autoPlay={true}
                            playbackQueue={playbackQueue - globalIndex}
                            onPlaybackEnd={handlePlaybackEnd}
                            className={
                              category === 'risks' ? 'bg-red-50' :
                              category === 'opportunities' ? 'bg-green-50' : ''
                            }
                            style={{
                              backgroundColor: category === 'risks' ? 'rgba(239, 68, 68, 0.1)' :
                                             category === 'opportunities' ? 'rgba(34, 197, 94, 0.1)' :
                                             undefined
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
            <div className="text-center py-12 opacity-75" style={{ color: customColors?.textColor }}>
                    No insights available
                </div>
            )}
          </div>
        ) : (
          // Chat View
          <div className="flex-1 flex flex-col">
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4"
              ref={chatContainerRef}
            >
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t" style={{ borderColor: customColors?.borderColor }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                  <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask about the anomalies..."
                        className="flex-1 p-2 rounded-lg border text-sm"
                        style={{
                        borderColor: customColors?.borderColor,
                        backgroundColor: customColors?.backgroundColor,
                        color: customColors?.textColor
                        }}
                    />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-blue-500 text-white"
                  disabled={!inputMessage.trim()}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomaliesAIPanel;