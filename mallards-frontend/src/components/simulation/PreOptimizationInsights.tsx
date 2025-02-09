import React, { useState, useEffect } from 'react';
import { Bot, Loader2, InfoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimulationParameters {
  approvalRateSensitivity: number;
  spendingMultiplier: number;
  fraudThreshold: number;
  culturalWeighting: number;
}

interface Props {
  parameters: SimulationParameters;
  scenario: { id: string; name: string } | null;
  results: any | null;
  isLoading?: boolean;
}

const PreOptimizationInsights: React.FC<Props> = ({
  parameters,
  scenario,
  results,
  isLoading
}) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const analyzeParameters = async () => {
      if (!scenario || !results || isLoading) return;
      
      setIsAnalyzing(true);
      try {
        const response = await fetch('http://localhost:8000/api/pre-optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: scenario.id,
            currentParameters: parameters,
            currentResults: results
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Analysis failed');
        }
        const data = await response.json();
        setInsights(data.insights);
      } catch (error) {
        console.error('Pre-optimization analysis error:', error);
        setInsights([]);
      } finally {
        setIsAnalyzing(false);
      }
    };

    const debounceTimeout = setTimeout(analyzeParameters, 1000);
    return () => clearTimeout(debounceTimeout);
  }, [parameters, scenario, results, isLoading]);

  if (!scenario || !results || isLoading || !insights.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4 rounded-lg border bg-blue-50 border-blue-200 p-3"
      >
        <div className="flex items-start gap-2">
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 mt-1 animate-spin text-blue-500" />
          ) : (
            <Bot className="w-4 h-4 mt-1 text-blue-500" />
          )}
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-medium text-blue-700 flex items-center gap-2">
              AI Pre-Optimization Insights
              <InfoIcon className="w-3 h-3 opacity-50" />
            </h4>
            <div className="space-y-1.5">
              {insights.map((insight, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-xs text-blue-700"
                >
                  {insight}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PreOptimizationInsights;