import React, { useState } from 'react';
import { Bot, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from 'framer-motion';
import PreOptimizationInsights from './PreOptimizationInsights';

interface SimulationParameters {
  approvalRateSensitivity: number;
  spendingMultiplier: number;
  fraudThreshold: number;
  culturalWeighting: number;
}

interface OptimizationResult {
  optimizedParameters: SimulationParameters;
  improvements: Array<{
    metric: string;
    before: number;
    after: number;
    percentChange: number;
  }>;
  reasoning: string[];
}

interface Props {
  currentParameters: SimulationParameters;
  onParametersUpdate: (params: SimulationParameters) => void;
  onOptimize: () => void;
  onReset: () => void;
  isOptimizing: boolean;
  scenario: { id: string; name: string } | null;
  results: any | null;
  hasOptimizationHistory: boolean;
}

const ParameterOptimizer: React.FC<Props> = ({
  currentParameters,
  onParametersUpdate,
  onOptimize,
  onReset,
  isOptimizing,
  scenario,
  results,
  hasOptimizationHistory
}) => {
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);

  const handleOptimize = async () => {
    if (!scenario || !results) return;
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario.id,
          currentParameters,
          currentResults: results
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Optimization failed');
      }

      const data = await response.json();
      setOptimizationResults(data);
      onParametersUpdate(data.optimizedParameters);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to optimize parameters');
      console.error('Optimization error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PreOptimizationInsights
        parameters={currentParameters}
        scenario={scenario}
        results={results}
        isLoading={isOptimizing}
      />

      {!optimizationResults ? (
        <button
          onClick={handleOptimize}
          disabled={isOptimizing || !scenario || !results}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isOptimizing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
          AI Optimize Parameters
        </button>
      ) : (
        <div className="space-y-4">
          {/* Parameter Changes */}
{Object.entries(optimizationResults.optimizedParameters).map(([key, value]) => {
  const currentValue = currentParameters[key as keyof SimulationParameters];
  const paramValue = value as number;
  const percentChange = ((paramValue - currentValue) / currentValue) * 100;
  
  return (
    <div key={key} className="flex flex-col space-y-1 py-1">
      <span className="text-sm text-gray-600">
        {key.replace(/([A-Z])/g, ' $1').trim()}
      </span>
      <div className="flex items-center gap-1 text-sm">
        <span className="font-mono">{currentValue.toFixed(2)}</span>
        <span className="text-gray-400 mx-1">→</span>
        <span className="font-mono">{paramValue.toFixed(2)}</span>
        <span className={`text-xs ${
          percentChange === 0 ? 'text-gray-400' : 
          percentChange > 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          ({percentChange === 0 ? '0.0' : percentChange.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
})}


          {/* Expected Improvements */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Expected Improvements</h4>
            {optimizationResults.improvements.map((imp) => (
              <div
                key={imp.metric}
                className={`px-2 py-1 rounded mb-1 ${
                  imp.percentChange > 0 ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm">{imp.metric}</span>
                  <span className={`text-sm font-medium ${
                    imp.percentChange > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {imp.percentChange > 0 ? '+' : ''}{imp.percentChange.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {(imp.before * 100).toFixed(1)}% → {(imp.after * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          {/* AI Analysis with Toggle */}
          <div className="mt-4">
            <button
              onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
              className="flex items-center gap-2 text-sm font-medium mb-2 hover:opacity-80"
            >
              {isAnalysisExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              AI Analysis
            </button>
            <AnimatePresence>
              {isAnalysisExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {optimizationResults.reasoning.map((reason, idx) => (
                    <div
                      key={idx}
                      className="text-sm bg-blue-50 rounded p-2 mb-2"
                    >
                      {reason}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParameterOptimizer;