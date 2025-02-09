// src/components/theme/layouts/LayoutPreview.tsx
import React from 'react';
import { defaultLayouts, previewItems, LayoutId } from './layoutConfigs';
import { useTheme } from '../../../../context/ThemeContext';

interface LayoutPreviewProps {
  selectedLayout: LayoutId;
}

interface PreviewItemProps {
  title: string;
  type: 'metric' | 'chart';
  style: React.CSSProperties;
}

const PreviewItem: React.FC<PreviewItemProps> = ({ title, type, style }) => (
  <div
    className="rounded-lg p-4 text-sm font-medium"
    style={style}
  >
    <div className="flex flex-col h-full justify-center items-center">
      <span className="text-xs opacity-60 mb-1">{title}</span>
      {type === 'chart' ? (
        <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center text-xs">
          Chart Preview
        </div>
      ) : (
        <span className="text-lg font-bold">000</span>
      )}
    </div>
  </div>
);

export const LayoutPreview: React.FC<LayoutPreviewProps> = ({ selectedLayout }) => {
  const { layouts = defaultLayouts, customColors } = useTheme();

  const createPreviewGrid = () => {
    const currentLayout = layouts[selectedLayout] || defaultLayouts[selectedLayout];
    if (!currentLayout) return null;

    return previewItems.map((item, index) => {
      const area = currentLayout.areas[index];
      if (!area) return null;

      return (
        <PreviewItem
          key={item.id}
          title={item.title}
          type={item.type}
          style={{
            gridColumn: area.gridColumn,
            gridRow: area.gridRow,
            backgroundColor: customColors?.tileColor || '#ffffff',
            color: customColors?.textColor || '#000000',
            border: `1px solid ${customColors?.borderColor || '#e5e5e5'}`
          }}
        />
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
        gridTemplateColumns: (layouts[selectedLayout] || defaultLayouts[selectedLayout])?.gridTemplateColumns,
        gridTemplateRows: (layouts[selectedLayout] || defaultLayouts[selectedLayout])?.gridTemplateRows
      }}
    >
      {createPreviewGrid()}
    </div>
  );
};

export default LayoutPreview;