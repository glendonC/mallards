// src/components/theme/typography/TypographyPreview.tsx
import React from 'react';
import { FontFamily } from './typographyConfigs';
import { defaultLayouts, previewItems } from '../layouts/layoutConfigs';
import { useTheme } from '../../../../context/ThemeContext';

interface TypographyPreviewProps {
  selectedFont: FontFamily;
}

const TypographyPreview: React.FC<TypographyPreviewProps> = ({ selectedFont }) => {
  const { customColors } = useTheme();
  
  // Get the default layout configuration
  const defaultLayout = defaultLayouts['grid-default'];

  const createPreviewGrid = () => {
    if (!defaultLayout) return null;

    return previewItems.map((item, index) => {
      const area = defaultLayout.areas[index];
      if (!area) return null;

      return (
        <div
          key={index}
          className="rounded-lg p-4 text-sm"
          style={{
            gridColumn: area.gridColumn,
            gridRow: area.gridRow,
            backgroundColor: customColors?.tileColor || '#ffffff',
            color: customColors?.textColor || '#000000',
            border: `1px solid ${customColors?.borderColor || '#e5e5e5'}`,
            fontFamily: selectedFont
          }}
        >
          <div className="flex flex-col h-full justify-center items-center">
            <span className="text-xs font-medium opacity-60 mb-1">{item.title}</span>
            {item.type === 'chart' ? (
              <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center text-xs">
                Chart Preview
              </div>
            ) : (
              <div className="text-center">
                <span className="text-2xl font-bold">24,789</span>
                <p className="text-xs mt-1 opacity-75">Last 24 hours</p>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div 
      className="border rounded-xl p-4 aspect-video"
      style={{
        backgroundColor: customColors?.backgroundColor || '#f3f3f0',
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: defaultLayout?.gridTemplateColumns || 'repeat(3, 1fr)',
        gridTemplateRows: defaultLayout?.gridTemplateRows || 'repeat(2, 1fr)'
      }}
    >
      {createPreviewGrid()}
    </div>
  );
};

export default TypographyPreview;