import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Layers, Users, PartyPopper, Shield, TrendingDown, Brain, CreditCard } from 'lucide-react';

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

interface Props {
  selectedScenario: SimulationScenario | null;
  onSelect: (scenario: SimulationScenario) => void;
}

const predefinedScenarios: SimulationScenario[] = [
  {
    id: 'minority-approval',
    name: 'Increase Minority Group Approvals',
    description: 'Adjust approval thresholds to improve financial inclusion',
    icon: Users,
    parameters: {
      approvalRateSensitivity: 1.3,
      spendingMultiplier: 1.0,
      fraudThreshold: 0.85,
      culturalWeighting: 1.4
    },
    linkedInsights: ['Cultural Alignment Score', 'Pattern Forecast']
  },
  {
    id: 'cultural-event',
    name: 'Cultural Event Spending Surge',
    description: 'Adapt to increased spending during major cultural events',
    icon: PartyPopper,
    parameters: {
      approvalRateSensitivity: 1.2,
      spendingMultiplier: 1.5,
      fraudThreshold: 0.8,
      culturalWeighting: 1.3
    },
    linkedInsights: ['Upcoming Cultural Events', 'Community Impact Map']
  },
  {
    id: 'fraud-threshold',
    name: 'Adjust Fraud Detection Sensitivity',
    description: 'Fine-tune fraud detection thresholds for cultural patterns',
    icon: Shield,
    parameters: {
      approvalRateSensitivity: 0.9,
      spendingMultiplier: 1.0,
      fraudThreshold: 0.7,
      culturalWeighting: 1.2
    },
    linkedInsights: ['AI Decision Conflicts', 'Cultural Pattern Violations']
  },
  {
    id: 'recession',
    name: 'Regional Economic Downturn',
    description: 'Simulate impact of regional recession conditions',
    icon: TrendingDown,
    parameters: {
      approvalRateSensitivity: 0.7,
      spendingMultiplier: 0.8,
      fraudThreshold: 0.9,
      culturalWeighting: 1.1
    },
    linkedInsights: ['Community Impact Map', 'Pattern Forecast']
  },
  {
    id: 'bias-reduction',
    name: 'Reduce AI Decision Bias',
    description: 'Optimize AI parameters for cultural fairness',
    icon: Brain,
    parameters: {
      approvalRateSensitivity: 1.1,
      spendingMultiplier: 1.0,
      fraudThreshold: 0.85,
      culturalWeighting: 1.6
    },
    linkedInsights: ['Cultural Decision Impact', 'AI Recommendations']
  },
  {
    id: 'seasonal-credit',
    name: 'Seasonal Credit Limit Adjustment',
    description: 'Adapt credit limits for high-spending seasons',
    icon: CreditCard,
    parameters: {
      approvalRateSensitivity: 1.2,
      spendingMultiplier: 1.3,
      fraudThreshold: 0.8,
      culturalWeighting: 1.2
    },
    linkedInsights: ['Upcoming Cultural Events', 'Pattern Forecast']
  }
];

const ScenarioSelector: React.FC<Props> = ({ selectedScenario, onSelect }) => {
  const { customColors } = useTheme();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5" />
        <h2 className="text-lg font-medium" style={{ color: customColors?.textColor }}>
          Select Scenario
        </h2>
      </div>

      <div className="space-y-3">
        {predefinedScenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <div
              key={scenario.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedScenario?.id === scenario.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
              style={{
                borderColor: selectedScenario?.id === scenario.id ? undefined : customColors?.borderColor,
                backgroundColor: selectedScenario?.id === scenario.id ? undefined : customColors?.backgroundColor
              }}
              onClick={() => onSelect(scenario)}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: customColors?.textColor }} />
                <div>
                  <h3 className="font-medium mb-1" style={{ color: customColors?.textColor }}>
                    {scenario.name}
                  </h3>
                  <p className="text-sm opacity-75 mb-2" style={{ color: customColors?.textColor }}>
                    {scenario.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scenario.linkedInsights.map((insight, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800"
                      >
                        {insight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScenarioSelector;