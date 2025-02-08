export type FontFamily = 'Chakra Petch' | 'DM Sans' | 'Switzer' | 'Arquitecta' | 'Aileron';

export interface FontOption {
  id: FontFamily;
  name: string;
  previewText?: string;
}

export const fontOptions = [
  { 
    id: 'Chakra Petch' as FontFamily,
    name: 'Chakra Petch',
    previewText: 'Modern technical display'
  },
  {
    id: 'DM Sans' as FontFamily,
    name: 'DM Sans',
    previewText: 'Clean and readable body text'
  },
  {
    id: 'Switzer' as FontFamily,
    name: 'Switzer',
    previewText: 'Contemporary sans serif'
  },
  {
    id: 'Arquitecta' as FontFamily,
    name: 'Arquitecta',
    previewText: 'Geometric and architectural'
  },
  {
    id: 'Aileron' as FontFamily,
    name: 'Aileron',
    previewText: 'Versatile modern sans'
  }
] as const;

export default fontOptions;