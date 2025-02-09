// src/components/theme/colors/colorConfigs.ts
export interface ThemeColors {
    backgroundColor: string;
    textColor: string;
    tileColor: string;
    borderColor: string;
    accentColor: string;
  }
  
  export type ThemePresetId = 
    | 'hub-classic' 
    | 'hub-dark' 
    | 'midnight-professional' 
    | 'high-contrast'
    | 'soft-neutrals';
  
  export interface ThemeOption {
    id: ThemePresetId;
    name: string;
    description: string;
    colors: ThemeColors;
  }
  
  export default {
    'hub-classic': {
      id: 'hub-classic',
      name: 'Hub Classic',
      description: 'Official Bias Guard brand colors with professional contrast',
      colors: {
        backgroundColor: '#E8E3D9',
        textColor: '#2C353D',
        tileColor: '#FFFFFF',
        borderColor: '#D8D3C9',
        accentColor: '#006B3F'
      }
    },
    'hub-dark': {
      id: 'hub-dark',
      name: 'Hub Dark',
      description: 'Dark mode variant with Hub green accents',
      colors: {
        backgroundColor: '#1A1F1D',
        textColor: '#FFFFFF',
        tileColor: '#252925',
        borderColor: '#2E332E',
        accentColor: '#00834E'
      }
    },
    'midnight-professional': {
      id: 'midnight-professional',
      name: 'Midnight Professional',
      description: 'Sophisticated dark theme for extended viewing',
      colors: {
        backgroundColor: '#1B2332',
        textColor: '#FFFFFF',
        tileColor: '#252D3F',
        borderColor: '#2E374B',
        accentColor: '#006B3F'
      }
    },
    'high-contrast': {
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'Maximum readability for data monitoring',
      colors: {
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        tileColor: '#F8F9FA',
        borderColor: '#DEE2E6',
        accentColor: '#006B3F'
      }
    },
    'soft-neutrals': {
      id: 'soft-neutrals',
      name: 'Soft Earth',
      description: 'Gentle earth tones for low eye strain',
      colors: {
        backgroundColor: '#F5F2ED',
        textColor: '#2C353D',
        tileColor: '#FFFFFF',
        borderColor: '#E5E2DD',
        accentColor: '#3F856B'
      }
    }
  } as const;