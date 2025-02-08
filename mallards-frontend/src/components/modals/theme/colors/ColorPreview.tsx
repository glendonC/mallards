import React from 'react';
import { defaultLayouts, previewItems } from '../layouts/layoutConfigs';
import { ThemePresetId } from './colorConfigs';

interface ColorPreviewProps {
  selectedTheme: ThemePresetId;
  previewColors: {
    backgroundColor: string;
    textColor: string;
    tileColor: string;
    borderColor: string;
    accentColor: string;
  };
}

const ColorPreview: React.FC<ColorPreviewProps> = ({ selectedTheme, previewColors }) => {
  const defaultLayout = defaultLayouts['grid-default'];

  const getMetricValue = (itemId: string) => {
    switch (itemId) {
      case 'total-transactions': return '157,893';
      case 'total-anomalies': return '42';
      case 'anomaly-percentage': return '0.027%';
      case 'high-severity': return '8';
      default: return '0';
    }
  };

  const createPreviewGrid = () => {
    if (!defaultLayout) return null;

    return previewItems.map((item, index) => {
      const area = defaultLayout.areas[index];
      if (!area) return null;

      return (
        <div
          key={index}
          className="rounded-lg p-4 text-sm transition-colors duration-200"
          style={{
            gridColumn: area.gridColumn,
            gridRow: area.gridRow,
            backgroundColor: previewColors.tileColor,
            color: previewColors.textColor,
            border: `1px solid ${previewColors.borderColor}`,
          }}
        >
          <div className="flex flex-col h-full justify-center items-center">
            <span 
              className="text-xs font-medium mb-1"
              style={{ opacity: 0.7 }}
            >
              {item.title}
            </span>
            
            {item.type === 'chart' ? (
              <div 
                className="w-full h-16 rounded flex items-center justify-center text-xs"
                style={{ backgroundColor: previewColors.backgroundColor }}
              >
                <div className="w-full h-8 mx-4 rounded"
                     style={{ 
                       background: `linear-gradient(90deg, 
                         ${previewColors.accentColor}40 0%, 
                         ${previewColors.accentColor} 50%, 
                         ${previewColors.accentColor}40 100%)`
                     }}>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span 
                  className="text-2xl font-bold"
                  style={{ color: previewColors.accentColor }}
                >
                  {getMetricValue(item.id)}
                </span>
                <p className="text-xs mt-1" style={{ opacity: 0.6 }}>
                  Last 24h
                </p>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div 
      className="border rounded-xl p-4 aspect-video transition-colors duration-200"
      style={{
        backgroundColor: previewColors.backgroundColor,
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: defaultLayout?.gridTemplateColumns,
        gridTemplateRows: defaultLayout?.gridTemplateRows,
        borderColor: previewColors.borderColor
      }}
    >
      {createPreviewGrid()}
    </div>
  );
};

export default ColorPreview;