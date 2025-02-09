import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsEPie, Pie, Cell } from 'recharts';
import { Map, BarChart2, PieChart } from 'lucide-react';

interface Props {
  results: {
    regionalImpact: {
      region: string;
      delta: number;
      significance: number;
      culturalAdaptation: number;
      communityAccess: number;
    }[];
  } | null;
  isLoading: boolean;
}

type ViewMode = 'map' | 'bar' | 'distribution';
type MetricView = 'impact' | 'cultural' | 'access';

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899'  // pink
];

const generateCoordinates = (regions: string[]) => {
  const coordinates: Record<string, { x: number; y: number }> = {};
  const centerX = 150;
  const centerY = 100;
  const radius = 70;

  regions.forEach((region, index) => {
    const angle = (index * 2 * Math.PI) / regions.length - Math.PI / 2;
    coordinates[region] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  return coordinates;
};

const VisualizationPanel: React.FC<Props> = ({ results, isLoading }) => {
  const { customColors } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('bar');
  const [metricView, setMetricView] = useState<MetricView>('impact');

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getChartData = () => {
    switch(metricView) {
      case 'cultural':
        return results?.regionalImpact.map(r => ({
          region: r.region,
          'Cultural Adaptation': r.culturalAdaptation,
          'Confidence': r.significance
        })) ?? [];
      case 'access':
        return results?.regionalImpact.map(r => ({
          region: r.region,
          'Community Access': r.communityAccess,
          'Confidence': r.significance
        })) ?? [];
      default:
        return results?.regionalImpact.map(r => ({
          region: r.region,
          'Impact': r.delta,
          'Confidence': r.significance
        })) ?? [];
    }
  };

  const renderBarChart = () => (
    <div className="h-64">
      {/* @ts-ignore */}
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore */}
        <BarChart data={getChartData()}>
          {/* @ts-ignore */}
          <CartesianGrid strokeDasharray="3 3" />
          {/* @ts-ignore */}
          <XAxis dataKey="region" style={{ fontSize: '12px' }} />
          {/* @ts-ignore */}
          <YAxis tickFormatter={formatPercentage} style={{ fontSize: '12px' }} />
          {/* @ts-ignore */}
          <Tooltip formatter={formatPercentage} />
          {/* @ts-ignore */}
          <Legend />
          {/* @ts-ignore */}
          <Bar
            dataKey={metricView === 'cultural' ? 'Cultural Adaptation' : 
                    metricView === 'access' ? 'Community Access' : 'Impact'}
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
          {/* @ts-ignore */}
          <Bar
            dataKey="Confidence"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderMap = () => {
    if (!results?.regionalImpact.length) return null;

    const regions = results.regionalImpact.map(r => r.region);
    const coordinates = generateCoordinates(regions);
    const centerX = 150;
    const centerY = 100;

    const connections = results.regionalImpact.map((region, i) => {
      const coord1 = coordinates[region.region];
      const nextIndex = (i + 1) % results.regionalImpact.length;
      const coord2 = coordinates[results.regionalImpact[nextIndex].region];
      
      const value1 = metricView === 'cultural' ? region.culturalAdaptation :
                    metricView === 'access' ? region.communityAccess :
                    region.delta;
      const value2 = metricView === 'cultural' ? results.regionalImpact[nextIndex].culturalAdaptation :
                    metricView === 'access' ? results.regionalImpact[nextIndex].communityAccess :
                    results.regionalImpact[nextIndex].delta;
      const valueDiff = Math.abs(value1 - value2);

      return (
        <path
          key={`connection-${i}`}
          d={`M ${coord1.x} ${coord1.y} L ${coord2.x} ${coord2.y}`}
          stroke={`rgba(156, 163, 175, ${0.2 + valueDiff})`}
          strokeWidth={1 + valueDiff * 2}
          strokeDasharray={valueDiff < 0.1 ? "none" : "4"}
        />
      );
    });

    return (
      <div className="h-64 relative">
        <svg width="100%" height="100%" viewBox="0 0 300 200">
          <rect width="300" height="200" fill={customColors?.backgroundColor || '#f8fafc'} rx="8" />
          
          <circle
            cx={centerX}
            cy={centerY}
            r="4"
            fill="#3b82f6"
            className="animate-ping"
            opacity="0.5"
          />
          
          {connections}
          
          {results.regionalImpact.map((region, idx) => {
            const coords = coordinates[region.region];
            const value = metricView === 'cultural' ? region.culturalAdaptation :
                        metricView === 'access' ? region.communityAccess :
                        region.delta;
            const radius = 20 + (Math.abs(value) * 20);
            
            return (
              <g key={region.region}>
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={radius}
                  fill={`${COLORS[idx % COLORS.length]}88`}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth="2"
                />
                <text
                  x={coords.x}
                  y={coords.y}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={customColors?.textColor || '#1f2937'}
                  fontSize="12"
                >
                  {region.region}
                </text>
                <text
                  x={coords.x}
                  y={coords.y + 15}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={customColors?.textColor || '#1f2937'}
                  fontSize="10"
                >
                  {formatPercentage(value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-3" style={{ color: customColors?.textColor }}>
          Regional Impact Analysis
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded text-sm ${metricView === 'impact' ? 'bg-blue-500 text-white' : 'border'}`}
              onClick={() => setMetricView('impact')}
            >
              Impact
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${metricView === 'cultural' ? 'bg-blue-500 text-white' : 'border'}`}
              onClick={() => setMetricView('cultural')}
            >
              Cultural
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${metricView === 'access' ? 'bg-blue-500 text-white' : 'border'}`}
              onClick={() => setMetricView('access')}
            >
              Access
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className={`p-2 rounded ${viewMode === 'map' ? 'bg-blue-500 text-white' : 'border'}`}
              onClick={() => setViewMode('map')}
              title="Map View"
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              className={`p-2 rounded ${viewMode === 'bar' ? 'bg-blue-500 text-white' : 'border'}`}
              onClick={() => setViewMode('bar')}
              title="Bar Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : results ? (
        <>
          {viewMode === 'bar' && renderBarChart()}
          {viewMode === 'map' && renderMap()}
        </>
      ) : (
        <div className="text-center py-12 opacity-75" style={{ color: customColors?.textColor }}>
          Run a simulation to see regional analysis
        </div>
      )}
    </div>
  );
};

export default VisualizationPanel;