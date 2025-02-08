import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { AlertCircle, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import ScenarioSelector from '../components/simulation/ScenarioSelector';
import ParameterControls from '../components/simulation/ParameterControls';
import ResultsViewer from '../components/simulation/ResultsViewer';
import VisualizationPanel from '../components/simulation/VisualizationPanel';
import ExportResults from '../components/simulation/ExportResults';
import AIInsightsPanel from '../components/simulation/AIInsightsPanel';
import Dock from '../components/navigation/Dock';
import ParameterOptimizer from '../components/simulation/ParameterOptimizer';
import { AnimatePresence, motion } from 'framer-motion';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  parameters: {
    approvalRateSensitivity: number;
    spendingMultiplier: number;
    fraudThreshold: number;
    culturalWeighting: number;
  };
  linkedInsights: string[];
}

interface SimulationResults {
  metrics: {
    approvalRate: { before: number; after: number };
    riskScore: { before: number; after: number };
    culturalAlignment: { before: number; after: number };
    financialInclusion: { before: number; after: number };
  };
  predictions: {
    dates: string[];
    baseline: number[];
    simulated: number[];
  };
  regionalImpact: {
    region: string;
    delta: number;
    significance: number;
    culturalAdaptation: number;
    communityAccess: number;
  }[];
}

interface OptimizationHistory {
    originalParams: SimulationParameters;
    optimizedParams: SimulationParameters;
    improvements: Array<{
      metric: string;
      before: number;
      after: number;
      percentChange: number;
    }>;
    timestamp: string;
  }

  interface SimulationParameters {
    approvalRateSensitivity: number;
    spendingMultiplier: number;
    fraudThreshold: number;
    culturalWeighting: number;
  }
  

const REQUIRED_COLUMNS = ['approvalStatus', 'transactionDate', 'amount', 'region'] as const;
type RequiredColumn = typeof REQUIRED_COLUMNS[number];

const SimulationSandbox = () => {
    const { customColors } = useTheme();
    const { csvData, columnMapping } = useData();
    const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
    const [parameters, setParameters] = useState({
        approvalRateSensitivity: 1.0,
        spendingMultiplier: 1.0,
        fraudThreshold: 0.8,
        culturalWeighting: 1.0
    });
    const [results, setResults] = useState<SimulationResults | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showScenarios, setShowScenarios] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAIInsights, setShowAIInsights] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [originalParameters, setOriginalParameters] = useState(parameters);
    const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistory | null>(null);

  const getMissingColumns = () => {
    return REQUIRED_COLUMNS.filter(col => !columnMapping[col]);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario?.id,
          currentParameters: parameters,
          currentResults: results
        })
      });
  
      if (!response.ok) throw new Error('Optimization failed');
      const data = await response.json();
      
      setOptimizationHistory({
        originalParams: { ...parameters },
        optimizedParams: data.optimizedParameters,
        improvements: data.improvements,
        timestamp: new Date().toISOString()
      });
  
      setParameters(data.optimizedParameters);
      await runSimulation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize');
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const handleResetOptimization = () => {
    if (optimizationHistory) {
      setParameters(optimizationHistory.originalParams);
      setOptimizationHistory(null);
      runSimulation();
    }
  };
  

  useEffect(() => {
    const missingColumns = getMissingColumns();
    if (missingColumns.length > 0) {
      setError(`Missing required columns: ${missingColumns.join(', ')}`);
    } else {
      setError(null);
    }
  }, [columnMapping]);

  const runSimulation = async () => {
    const missingColumns = getMissingColumns();
    if (missingColumns.length > 0) {
      setError(`Cannot run simulation. Missing columns: ${missingColumns.join(', ')}`);
      return;
    }

    if (!csvData.length) {
      setError('No data available for simulation');
      return;
    }

    setIsSimulating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario: selectedScenario?.id,
          parameters,
          data: csvData,
          mapping: columnMapping
        })
      });

      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run simulation');
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (selectedScenario && !isSimulating) {
      runSimulation();
    }
  }, [parameters, selectedScenario]);

  if (!csvData.length) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: customColors?.backgroundColor }}
      >
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Please upload and map your data before running simulations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: customColors?.backgroundColor }}>
      <main className="flex-1 overflow-y-auto">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: customColors?.borderColor }}>
            <div className="max-w-7xl mx-auto flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: customColors?.textColor }}>
                  AI Simulation Sandbox
                </h1>
                <button
                  className="flex items-center gap-2 text-lg opacity-75 hover:opacity-100"
                  onClick={() => setShowScenarios(!showScenarios)}
                  style={{ color: customColors?.textColor }}
                >
                  {selectedScenario?.name || 'Select a scenario'}
                  {showScenarios ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                  onClick={() => setShowAIInsights(true)}
                  disabled={!results || isSimulating}
                >
                  <Bot className="w-4 h-4" />
                  AI Insights
                </button>
                {results && (
                  <ExportResults
                    results={results}
                    scenario={selectedScenario}
                    parameters={parameters}
                  />
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="px-6 py-4 border-b" style={{ borderColor: customColors?.borderColor }}>
              <div className="max-w-7xl mx-auto">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* Scenario Dropdown */}
          {showScenarios && (
            <div className="border-b" style={{ borderColor: customColors?.borderColor }}>
              <div className="max-w-7xl mx-auto p-6">
              <ScenarioSelector
                onSelect={(scenario: SimulationScenario) => {
                    setSelectedScenario(scenario);
                    setShowScenarios(false);
                    setParameters(scenario.parameters);
                    setOriginalParameters(scenario.parameters); // Add this line
                }}
                selectedScenario={selectedScenario}
                />
              </div>
            </div>
          )}

          {/* Main Content - Three Column Layout */}
          <div className="flex-1">
            <div className="max-w-7xl mx-auto p-6 pb-24">
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Controls */}
                <div className="col-span-3">
                    <div
                        className="bg-white rounded-lg p-6 sticky top-6 space-y-6"
                        style={{ backgroundColor: customColors?.tileColor }}
                    >
<ParameterOptimizer
  currentParameters={parameters}
  onParametersUpdate={setParameters}
  onOptimize={handleOptimize}
  onReset={handleResetOptimization}  // Add this line
  isOptimizing={isOptimizing}
  scenario={selectedScenario}
  results={results}
  hasOptimizationHistory={!!optimizationHistory}  // Add this line
/>
                        <ParameterControls
                        parameters={parameters}
                        originalParameters={originalParameters}
                        onChange={setParameters}
                        isLoading={isSimulating || isOptimizing}
                        />
                    </div>
                </div>

                {/* Results and Visualization Side by Side */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`results-${isOptimizing}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="col-span-9 grid grid-cols-2 gap-6"
                    >
                        <div
                        className="bg-white rounded-lg p-6"
                        style={{ backgroundColor: customColors?.tileColor }}
                        >
                        <ResultsViewer
                            results={results}
                            isLoading={isSimulating || isOptimizing}
                        />
                        </div>
                        <div
                        className="bg-white rounded-lg p-6"
                        style={{ backgroundColor: customColors?.tileColor }}
                        >
                        <VisualizationPanel
                            results={results}
                            isLoading={isSimulating || isOptimizing}
                        />
                        </div>
                    </motion.div>
                    </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer: Dock in its own row */}
      <footer className="shrink-0">
        <div className="max-w-7xl mx-auto p-6">
          <Dock />
        </div>
      </footer>

      {/* AI Insights Panel */}
      <AIInsightsPanel
        isOpen={showAIInsights}
        onClose={() => setShowAIInsights(false)}
        results={results}
        isLoading={isSimulating}
        parameters={parameters}
      />
    </div>
  );
};

export default SimulationSandbox;