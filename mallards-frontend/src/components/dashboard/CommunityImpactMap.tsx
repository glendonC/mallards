import { throttle } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Filter } from 'lucide-react';
import { CommunityImpactData, RegionData } from '../../types/dashboard';

interface Props {
  data: CommunityImpactData;
  isFocused?: boolean;
  focusMode?: 'pattern' | 'decision' | 'bias'; 
}

const colorScales = {
  spending: {
    high: "rgba(239, 68, 68, 0.8)", // red
    medium: "rgba(249, 115, 22, 0.8)", // orange
    low: "rgba(59, 130, 246, 0.8)", // blue
    default: "rgba(107, 114, 128, 0.3)" // gray
  },
  decision: {
    high: "rgba(34, 197, 94, 0.8)", // green
    medium: "rgba(234, 179, 8, 0.8)", // yellow
    low: "rgba(239, 68, 68, 0.8)", // red
    default: "rgba(107, 114, 128, 0.3)"
  },
  bias: {
    high: "rgba(147, 51, 234, 0.8)", // purple
    medium: "rgba(59, 130, 246, 0.8)", // blue
    low: "rgba(239, 68, 68, 0.8)", // red
    default: "rgba(107, 114, 128, 0.3)"
  }
};

const calculateMetrics = {
  spending: (region: RegionData) => ({
    value: region?.metrics?.transactionVolume ?? 0,
    threshold: { high: 500000, medium: 200000 },
    label: 'Transaction Volume',
    format: (val: number) => `$${(val / 1000000).toFixed(1)}M`
  }),
  
  decision: (region: RegionData) => ({
    value: region?.metrics?.approvalRate ?? 0,
    threshold: { high: 85, medium: 70 },
    label: 'Approval Rate',
    format: (val: number) => `${val.toFixed(1)}%`
  }),
  
  bias: (region: RegionData) => ({
    value: region?.metrics?.culturalImpact ?? 0,
    threshold: { high: 90, medium: 75 },
    label: 'Cultural Impact',
    format: (val: number) => `${val.toFixed(1)}%`
  })
};

const calculateSpendingHotspots = (region: RegionData) => {
  return {
    value: region.metrics.transactionVolume,
    intensity: region.metrics.transactionVolume / 1000000, // Scale to millions
    hotspotScore: (region.metrics.transactionVolume / region.metrics.totalDecisions) * 100,
    trendIndicator: region.culturalFactors.some(f => f.trend === 'increasing') ? 'rising' : 'stable',
    details: {
      averageTransaction: region.metrics.transactionVolume / region.metrics.totalDecisions,
      culturalEvents: region.culturalFactors
        .filter(f => f.influence > 50)  // Only high-influence events
        .map(f => ({
          name: f.name,
          spendingImpact: f.influence
        }))
    }
  };
};

const calculateApprovalPatterns = (region: RegionData) => {
  return {
    value: region.metrics.approvalRate,
    pattern: {
      culturalPeriods: region.metrics.approvalRate,
      normalPeriods: region.metrics.approvalRate * 0.9, // Example baseline
      deviation: Math.abs(region.metrics.approvalRate - (region.metrics.approvalRate * 0.9))
    },
    culturalFactors: region.culturalFactors.map(f => ({
      name: f.name,
      approvalImpact: f.influence / 100 * region.metrics.approvalRate
    })),
    riskLevel: region.metrics.approvalRate < 70 ? 'high' : 
               region.metrics.approvalRate < 85 ? 'medium' : 'low'
  };
};

const calculateFairnessGaps = (region: RegionData) => {
  // Calculate disparity between cultural and normal periods
  const culturalApprovalRate = region.metrics.approvalRate;
  const normalApprovalRate = region.metrics.approvalRate * 0.9; // Example baseline
  const disparity = Math.abs(culturalApprovalRate - normalApprovalRate);

  return {
    value: region.metrics.culturalImpact,
    fairnessScore: 100 - (disparity * 2), // Convert disparity to fairness score
    gaps: {
      approvalDisparity: disparity,
      culturalSensitivity: region.culturalFactors.reduce((acc, f) => acc + f.influence, 0) / 
                          region.culturalFactors.length
    },
    culturalFactors: region.culturalFactors.map(f => ({
      name: f.name,
      fairnessImpact: 100 - Math.abs(f.influence - 50) // Convert influence to fairness impact
    })),
    recommendations: disparity > 20 ? [
      'Review decision criteria for cultural bias',
      'Increase cultural context awareness',
      'Monitor approval rate variations'
    ] : []
  };
};

const isFairnessData = (data: any): data is ReturnType<typeof calculateFairnessGaps> => {
  return 'fairnessScore' in data;
};

const processRegionalData = (region: RegionData, focusMode: string) => {
  switch (focusMode) {
    case 'pattern':
      return calculateSpendingHotspots(region);
    case 'decision':
      return calculateApprovalPatterns(region);
    case 'bias':
      return calculateFairnessGaps(region);
    default:
      return calculateSpendingHotspots(region);
  }
};

const getHeatmapColor = (region: RegionData, focusMode: string) => {
  const processedData = processRegionalData(region, focusMode);
  const value = processedData.value;

  switch (focusMode) {
    case 'pattern':
      return value > 500000 ? "rgba(239, 68, 68, 0.8)" :  // High spending
            value > 200000 ? "rgba(249, 115, 22, 0.8)" : // Medium spending
            value > 50000 ? "rgba(59, 130, 246, 0.8)" :  // Low spending
            "rgba(107, 114, 128, 0.3)";                  // Minimal spending

    case 'decision':
      return value > 85 ? "rgba(34, 197, 94, 0.8)" :     // High approval
            value > 70 ? "rgba(249, 115, 22, 0.8)" :    // Medium approval
            "rgba(239, 68, 68, 0.8)";                    // Low approval

    case 'bias':
      const fairnessScore = isFairnessData(processedData) ? processedData.fairnessScore : 0;
      return fairnessScore > 90 ? "rgba(34, 197, 94, 0.8)" :     // High fairness
            fairnessScore > 75 ? "rgba(249, 115, 22, 0.8)" :    // Medium fairness
            "rgba(239, 68, 68, 0.8)";                           // Low fairness

    default:
      return "rgba(107, 114, 128, 0.3)";
  }
};

const defaultRegionData = {
  metrics: {
    approvalRate: 0,
    culturalImpact: 0,
    totalDecisions: 0,
    transactionVolume: 0
  }
};

const CommunityImpactMap: React.FC<Props> = ({ 
  data = { regions: [], summary: { totalRegions: 0, averageApprovalRate: 0, highestImpact: '', lowestImpact: '' }, filters: { countries: [], culturalFactors: [] } }, 
  isFocused = false,
  focusMode = 'pattern'
}) => {

  const { customColors } = useTheme();
  const globeRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'heatmap' | 'bubble'>('heatmap');
  const [selectedFilter, setSelectedFilter] = useState<'approvalRate' | 'culturalImpact'>('approvalRate');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCulturalRegion, setSelectedCulturalRegion] = useState<string | null>(null);
  const [bubbleMetric, setBubbleMetric] = useState<'totalDecisions' | 'transactionVolume'>('totalDecisions');

  useEffect(() => {
    // 1. Cleanup previous instance and early return if no ref
    if (!globeRef.current) return;
  
    // 2. Create globe instance
    const globe = new Globe(globeRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .width(globeRef.current.clientWidth)
      .height(globeRef.current.clientHeight)
      .enablePointerInteraction(true)
      .polygonAltitude(0.01)
      .polygonsTransitionDuration(300);
  
    // 3. Load world data and setup visualization
    fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(worldData => {
        // Filter out Antarctica
        const countries = worldData.features.filter((d: any) => d.properties.ISO_A3 !== 'ATA');
        
  
        // Handle visualization based on mode
        if (viewMode === 'heatmap') {
          // Filter countries to match our regions
          const filteredCountries = countries.filter((d: any) => {
            const region = data.regions.find(r => r.code === d.properties.ISO_A3);
            return region && 
              (!selectedRegion || region.code === selectedRegion) &&
              (!selectedCulturalRegion || region.culturalFactors.some(f => f.name === selectedCulturalRegion));
          });
  
          // Apply visualization
          globe
            .polygonsData(filteredCountries)
            .polygonsTransitionDuration(200)
            .polygonCapColor((d: any) => {
              const region = data.regions.find(r => r.code === d.properties.ISO_A3);
              if (!region?.metrics) return colorScales.spending.default;
              return getHeatmapColor(region as RegionData, focusMode);
            })
            .polygonSideColor(() => 'rgba(0, 100, 0, 0.15)')
            .polygonStrokeColor(() => '#111')
            // Add hover functionality
            .onPolygonHover(throttle((polygon: object | null) => {
              document.body.style.cursor = polygon ? 'pointer' : 'default';
              const region = data.regions.find(r => r.code === (polygon as any)?.properties?.ISO_A3);
              
              if (polygon && region) {
                globe.polygonAltitude((d: any) => d === polygon ? 0.3 : 0.01);
              }
              
              // Handle tooltip
              const tooltip = globeRef.current?.querySelector('.globe-tooltip');
              if (tooltip) tooltip.remove();
              
              if (polygon && region && region.metrics) {
                const metrics = getMetricsByFocus(focusMode, region as RegionData);
                const processedData = processRegionalData(region, focusMode);
                
                const content = `
                  <div class="bg-white p-2 rounded shadow-lg">
                    <div class="font-bold mb-2">${region.name}</div>
                    <div class="mb-2">${metrics.label}: ${metrics.format(metrics.value)}</div>
                    <div class="text-sm">
                      <div>Approval Rate: ${region.metrics.approvalRate.toFixed(1)}%</div>
                      <div>Cultural Impact: ${region.metrics.culturalImpact.toFixed(1)}%</div>
                      <div>Total Decisions: ${region.metrics.totalDecisions.toLocaleString()}</div>
                      <div>Transaction Volume: $${(region.metrics.transactionVolume / 1000000).toFixed(1)}M</div>
                    </div>
                    <div class="mt-2 text-sm font-semibold">Cultural Factors:</div>
                    ${region.culturalFactors.map(f => 
                      `<div class="text-sm flex justify-between gap-4">
                        <span>${f.name}</span>
                        <span>${f.influence.toFixed(1)}% (${f.trend})</span>
                      </div>`
                    ).join('')}
                    ${focusMode === 'bias' && isFairnessData(processedData) ? `
                      <div class="mt-2 text-sm text-red-500">
                        ${processedData.recommendations.join('<br>')}
                      </div>
                    ` : ''}
                  </div>
                `;
                
                const newTooltip = document.createElement('div');
                newTooltip.innerHTML = content;
                newTooltip.className = 'globe-tooltip';
                newTooltip.style.position = 'absolute';
                newTooltip.style.left = '20px';
                newTooltip.style.bottom = '20px';
                newTooltip.style.zIndex = '1000';
                globeRef.current?.appendChild(newTooltip);
              }
            }, 100));
  
        } else {
          // Bubble view
          const pointsData = data.regions.map(region => ({
            ...region,
            size: bubbleMetric === 'totalDecisions' 
              ? Math.sqrt(region.metrics.totalDecisions) * 0.2
              : Math.sqrt(region.metrics.transactionVolume) * 0.1,
            color: colorScales[focusMode === 'pattern' ? 'spending' : focusMode].high,
            lat: region.coordinates.lat,
            lng: region.coordinates.lng,
            altitude: 0.1,
            radius: Math.max(
              bubbleMetric === 'totalDecisions' 
                ? Math.sqrt(region.metrics.totalDecisions) * 0.2
                : Math.sqrt(region.metrics.transactionVolume) * 0.1,
              2
            )
          }));
  
          // Clear polygons and add points
          globe
            .polygonsData([])
            .pointsData(pointsData)
            .pointLat('lat')
            .pointLng('lng')
            .pointAltitude('altitude')
            .pointRadius('radius')
            .pointColor('color')
            .pointsMerge(false)
            .pointLabel((d: any) => {
              const metrics = getMetricsByFocus(focusMode, d as RegionData);
              const processedData = processRegionalData(d as RegionData, focusMode);
              
              return `
                <div class="bg-white p-2 rounded shadow-lg">
                  <div class="font-bold mb-2">${d.name}</div>
                  <div class="mb-2">${metrics.label}: ${metrics.format(metrics.value)}</div>
                  <div class="text-sm">
                    <div>Approval Rate: ${d.metrics.approvalRate.toFixed(1)}%</div>
                    <div>Cultural Impact: ${d.metrics.culturalImpact.toFixed(1)}%</div>
                    <div>Total Decisions: ${d.metrics.totalDecisions.toLocaleString()}</div>
                    <div>Transaction Volume: $${(d.metrics.transactionVolume / 1000000).toFixed(1)}M</div>
                  </div>
                  <div class="mt-2 text-sm font-semibold">Cultural Factors:</div>
                  ${d.culturalFactors.map((f: any) => 
                    `<div class="text-sm flex justify-between gap-4">
                      <span>${f.name}</span>
                      <span>${f.influence.toFixed(1)}% (${f.trend})</span>
                    </div>`
                  ).join('')}
                  ${focusMode === 'bias' && isFairnessData(processedData) ? `
                    <div class="mt-2 text-sm text-red-500">
                      ${processedData.recommendations.join('<br>')}
                    </div>
                  ` : ''}
                </div>
              `;
            });
        }

        // Add mouse move handler for smooth rendering
        globe.controls().addEventListener('change', () => {
          globe.renderer().render(globe.scene(), globe.camera());
        });
  
        // Set initial view position
        globe.pointOfView({ lat: 30, lng: 0, altitude: 2.5 });
  
        // Start render loop
        const animate = () => {
          globe.renderer().render(globe.scene(), globe.camera());
          return requestAnimationFrame(animate);
        };
        const frameId = animate();
  
        // Cleanup animation on unmount
        return () => {
          cancelAnimationFrame(frameId);
        };
      });
  
    // Cleanup function
    return () => {
      if (globeRef.current) {
        globeRef.current.innerHTML = '';
      }
    };
  }, [data, viewMode, selectedFilter, selectedRegion, selectedCulturalRegion, bubbleMetric, isFocused, focusMode]);

  useEffect(() => {
    return () => {
      const tooltip = globeRef.current?.querySelector('.globe-tooltip');
      if (tooltip) tooltip.remove();
    };
  }, []);

  const getMetricsByFocus = (focusMode: string, region: RegionData) => {
    const mode = focusMode === 'pattern' ? 'spending' : focusMode;
    const calculator = calculateMetrics[mode as keyof typeof calculateMetrics];
    return calculator(region);
  };

  // Update the legend
  const getLegendItems = () => {
    const mode = focusMode === 'pattern' ? 'spending' : focusMode;
    const metrics = calculateMetrics[mode as keyof typeof calculateMetrics](defaultRegionData as RegionData);
    
    return [
      { color: colorScales[mode as keyof typeof colorScales].high, label: `High ${metrics.label}` },
      { color: colorScales[mode as keyof typeof colorScales].medium, label: `Medium ${metrics.label}` },
      { color: colorScales[mode as keyof typeof colorScales].low, label: `Low ${metrics.label}` }
    ];
  };

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: customColors?.tileColor }}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-1" style={{ color: customColors?.textColor }}>
          Community Impact Map
        </h3>
        
        {/* Controls - Moved up */}
        <div className="flex gap-2 mb-2">
          <button
            className={`px-3 py-1.5 rounded text-sm ${viewMode === 'heatmap' ? 'bg-blue-500 text-white' : 'border'}`}
            onClick={() => setViewMode('heatmap')}
            style={viewMode !== 'heatmap' ? { borderColor: customColors?.borderColor } : {}}
          >
            Heatmap
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm ${viewMode === 'bubble' ? 'bg-blue-500 text-white' : 'border'}`}
            onClick={() => setViewMode('bubble')}
            style={viewMode !== 'bubble' ? { borderColor: customColors?.borderColor } : {}}
          >
            Bubbles
          </button>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as 'approvalRate' | 'culturalImpact')}
            className="px-3 py-1.5 rounded border text-sm"
            style={{ 
              borderColor: customColors?.borderColor,
              backgroundColor: customColors?.backgroundColor,
              color: customColors?.textColor
            }}
          >
            <option value="approvalRate">Approval Rate</option>
            <option value="culturalImpact">Cultural Impact</option>
          </select>

          {/* Always show these filters for both views */}
          <select
            value={selectedRegion || ''}
            onChange={(e) => setSelectedRegion(e.target.value || null)}
            className="px-3 py-1.5 rounded border text-sm"
            style={{ 
              borderColor: customColors?.borderColor,
              backgroundColor: customColors?.backgroundColor,
              color: customColors?.textColor
            }}
          >
            <option value="">All Regions</option>
            {data.regions.map(region => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCulturalRegion || ''}
            onChange={(e) => setSelectedCulturalRegion(e.target.value || null)}
            className="px-3 py-1.5 rounded border text-sm"
            style={{ 
              borderColor: customColors?.borderColor,
              backgroundColor: customColors?.backgroundColor,
              color: customColors?.textColor
            }}
          >
            <option value="">All Cultural Regions</option>
            {Array.from(new Set(data.regions.flatMap(r => r.culturalFactors.map(f => f.name)))).map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* View-specific controls */}
          {viewMode === 'bubble' && (
            <select
              value={bubbleMetric}
              onChange={(e) => setBubbleMetric(e.target.value as 'totalDecisions' | 'transactionVolume')}
              className="px-3 py-1.5 rounded border text-sm"
              style={{ 
                borderColor: customColors?.borderColor,
                backgroundColor: customColors?.backgroundColor,
                color: customColors?.textColor
              }}
            >
              <option value="totalDecisions">Total Decisions</option>
              <option value="transactionVolume">Transaction Volume</option>
            </select>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {data.summary.totalRegions} Regions
          </span>
          <span className="flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Highest: {data.summary.highestImpact}
          </span>
        </div>
      </div>

      {/* Globe Container */}
      <div
        ref={globeRef}
        className="w-full rounded-lg overflow-hidden"
        style={{
          height: isFocused ? '600px' : '400px',
          backgroundColor: '#000'
        }}
      />

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        {getLegendItems().map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs" style={{ color: customColors?.textColor }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityImpactMap;