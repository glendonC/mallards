import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, Loader, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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
  } | null;
  isLoading: boolean;
}

type MetricKey = 'approvalRate' | 'riskScore' | 'culturalAlignment' | 'financialInclusion';

const ResultsViewer: React.FC<Props> = ({ results, isLoading }) => {
  const { customColors } = useTheme();

    const metrics: Array<{
    key: MetricKey;
    label: string;
    description: string;
    }> = [
    { key: 'approvalRate', label: 'Lending Approval Rate', description: 'Rate of approved transactions' },
    { key: 'culturalAlignment', label: 'Cultural Sensitivity', description: 'AI alignment with cultural patterns' },
    { key: 'financialInclusion', label: 'Community Access', description: 'Financial inclusion metrics' },
    { key: 'riskScore', label: 'Risk Assessment', description: 'Overall risk evaluation score' }
    ];


  const chartData = results?.predictions.dates.map((date, i) => ({
    date,
    'Before Optimization': results.predictions.baseline[i],
    'After Optimization': results.predictions.simulated[i]
  })) ?? [];

  const getMetricData = () => {
    if (!results) return [];
    return metrics.map(metric => ({
      name: metric.label,
      before: results.metrics[metric.key as keyof typeof results.metrics].before * 100,
      after: results.metrics[metric.key as keyof typeof results.metrics].after * 100,
      change: ((results.metrics[metric.key as keyof typeof results.metrics].after - 
               results.metrics[metric.key as keyof typeof results.metrics].before) /
               results.metrics[metric.key as keyof typeof results.metrics].before) * 100
    }));
  };

  const MetricCard = ({ 
    label, 
    before, 
    after, 
    description 
  }: { 
    label: string; 
    before: number; 
    after: number; 
    description: string;
  }) => {
    const percentChange = ((after - before) / before) * 100;
    const isPositive = percentChange > 0;
  
    return (
      <div
        className="p-4 rounded-lg border"
        style={{ borderColor: customColors?.borderColor }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-medium" style={{ color: customColors?.textColor }}>
              {label}
            </span>
            <p className="text-xs opacity-75" style={{ color: customColors?.textColor }}>
              {description}
            </p>
          </div>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}%
          </motion.div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${before * 100}%` }}
            />
            </div>
            <span className="text-sm mt-1 block" style={{ color: customColors?.textColor }}>
              {(before * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  isPositive ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${after * 100}%` }}
              />
            </div>
            <span className={`text-sm mt-1 block font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {(after * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderMetricComparison = () => (
    <div className="h-64 mt-6">
        {/* @ts-ignore */}
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore */}
        <BarChart data={getMetricData()} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          {/* @ts-ignore */}
          <XAxis type="number" domain={[0, 100]} />
          {/* @ts-ignore */}
          <YAxis 
            dataKey="name" 
            type="category" 
            width={150}
            tick={{ fill: customColors?.textColor ?? '#666' }}
          />
          {/* @ts-ignore */}
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(1)}%`}
            labelStyle={{ color: customColors?.textColor }}
          />
          {/* @ts-ignore */}
          <Legend />
          {/* @ts-ignore */}
          <Bar 
            dataKey="before" 
            name="Before" 
            fill="#94a3b8"
            radius={[0, 4, 4, 0]}
          />
          {/* @ts-ignore */}
          <Bar 
            dataKey="after" 
            name="After" 
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div>
      <h2 className="text-lg font-medium mb-4" style={{ color: customColors?.textColor }}>
        Optimization Impact Analysis
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      ) : results ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
          {metrics.map(({ key, label, description }) => (
                <MetricCard
                key={key}
                label={label}
                description={description}
                before={results.metrics[key].before}
                after={results.metrics[key].after}
                />
            ))}
          </div>
          
          {renderMetricComparison()}

          <div className="h-64">
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height="100%">
                {/* @ts-ignore */}
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    {/* @ts-ignore */}
                    <XAxis 
                    dataKey="date" 
                    style={{ fontSize: '12px' }}
                    tick={{ fill: customColors?.textColor ?? '#666' }}
                    />
                    {/* @ts-ignore */}
                    <YAxis 
                    style={{ fontSize: '12px' }}
                    tick={{ fill: customColors?.textColor ?? '#666' }}
                    />
                    {/* @ts-ignore */}
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}`} />
                    {/* @ts-ignore */}
                    <Legend />
                    {/* @ts-ignore */}
                    <Line
                    type="monotone"
                    dataKey="Before Optimization"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                    />
                    {/* @ts-ignore */}
                    <Line
                    type="monotone"
                    dataKey="After Optimization"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    />
                    {/* @ts-ignore */}
                </LineChart>
                {/* @ts-ignore */}
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 opacity-75" style={{ color: customColors?.textColor }}>
          Select a scenario and adjust parameters to see impact analysis
        </div>
      )}
    </div>
  );
};

export default ResultsViewer;