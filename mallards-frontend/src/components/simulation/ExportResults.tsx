import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  results: {
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
    }[];
  };
  scenario: {
    id: string;
    name: string;
    description: string;
  } | null;
  parameters: {
    approvalRateSensitivity: number;
    spendingMultiplier: number;
    fraudThreshold: number;
    culturalWeighting: number;
  };
}

const ExportResults: React.FC<Props> = ({ results, scenario, parameters }) => {
  const { customColors } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const formatMetricsForCSV = () => {
    const rows = [
      ['Metric', 'Before', 'After', 'Change'],
      ['Approval Rate', results.metrics.approvalRate.before, results.metrics.approvalRate.after, 
       results.metrics.approvalRate.after - results.metrics.approvalRate.before],
      ['Risk Score', results.metrics.riskScore.before, results.metrics.riskScore.after,
       results.metrics.riskScore.after - results.metrics.riskScore.before],
      ['Cultural Alignment', results.metrics.culturalAlignment.before, results.metrics.culturalAlignment.after,
       results.metrics.culturalAlignment.after - results.metrics.culturalAlignment.before],
      ['Financial Inclusion', results.metrics.financialInclusion.before, results.metrics.financialInclusion.after,
       results.metrics.financialInclusion.after - results.metrics.financialInclusion.before]
    ];
    return rows.map(row => row.join(',')).join('\n');
  };

  const handleExportJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      scenario: {
        id: scenario?.id,
        name: scenario?.name,
        description: scenario?.description
      },
      parameters,
      metrics: results.metrics,
      regionalImpact: results.regionalImpact,
      predictions: results.predictions
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-${scenario?.id ?? 'custom'}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const metricsCSV = formatMetricsForCSV();
    const blob = new Blob([metricsCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-metrics-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        onClick={() => setShowOptions(!showOptions)}
      >
        <Download className="w-4 h-4" />
        Export Results
      </button>

      {showOptions && (
        <div 
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border"
          style={{ 
            backgroundColor: customColors?.tileColor,
            borderColor: customColors?.borderColor 
          }}
        >
          <button
            className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100 rounded-t-lg"
            onClick={handleExportJSON}
          >
            <FileJson className="w-4 h-4" />
            <span style={{ color: customColors?.textColor }}>Export as JSON</span>
          </button>
          <button
            className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100 rounded-b-lg"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span style={{ color: customColors?.textColor }}>Export as CSV</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportResults;