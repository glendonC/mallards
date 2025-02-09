// src/components/theme/layouts/layoutConfigs.ts
export interface GridArea {
  gridColumn: string;
  gridRow: string;
}

export interface LayoutConfig {
  gridTemplateColumns: string;
  gridTemplateRows: string;
  areas: GridArea[];
}

export type PreviewItemType = 'metric' | 'chart';

export interface PreviewItem {
  id: string;
  title: string;
  type: PreviewItemType;
}

export type LayoutId = 'grid-default' | 'grid-focused' | 'grid-stacked';

export interface LayoutOption {
  id: LayoutId;
  name: string;
}

export const layoutOptions: LayoutOption[] = [
  { id: 'grid-default', name: 'Default Grid (3×2)' },
  { id: 'grid-focused', name: 'Focused View' },
  { id: 'grid-stacked', name: 'Stacked View' }
];

export const previewItems: PreviewItem[] = [
  { id: 'total-transactions', title: 'Cultural Alignment', type: 'metric' },
  { id: 'total-anomalies', title: 'Cultural Periods', type: 'metric' },
  { id: 'anomaly-percentage', title: 'Decision Impact', type: 'metric' },
  { id: 'high-severity', title: 'Cultural Pattern Alerts', type: 'metric' },
  { id: 'severity-distribution', title: 'Community Impact', type: 'chart' },
  { id: 'anomalies-over-time', title: 'Event Analytics', type: 'chart' }
];

export const defaultLayouts: Record<LayoutId, LayoutConfig> = {
  'grid-default': {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(2, minmax(140px, auto))',
    areas: [
      { gridColumn: '1', gridRow: '1' },
      { gridColumn: '2', gridRow: '1' },
      { gridColumn: '3', gridRow: '1' },
      { gridColumn: '1', gridRow: '2' },
      { gridColumn: '2', gridRow: '2' },
      { gridColumn: '3', gridRow: '2' }
    ]
  },
  'grid-focused': {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(3, minmax(140px, auto))',
    areas: [
      { gridColumn: '1', gridRow: '1' },
      { gridColumn: '2', gridRow: '1' },
      { gridColumn: '1', gridRow: '2' },
      { gridColumn: '2', gridRow: '2' },
      { gridColumn: '1', gridRow: '3' },
      { gridColumn: '2', gridRow: '3' }
    ]
  },
  'grid-stacked': {
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'repeat(6, minmax(140px, auto))',
    areas: [
      { gridColumn: '1', gridRow: '1' },
      { gridColumn: '1', gridRow: '2' },
      { gridColumn: '1', gridRow: '3' },
      { gridColumn: '1', gridRow: '4' },
      { gridColumn: '1', gridRow: '5' },
      { gridColumn: '1', gridRow: '6' }
    ]
  }
};