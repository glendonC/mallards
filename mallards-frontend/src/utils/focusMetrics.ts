export const getFocusMetrics = (focusMode: 'pattern' | 'decision' | 'bias') => {
  switch (focusMode) {
    case 'pattern':
      return {
        primary: 'Spending Deviation',
        secondary: 'Transaction Volume',
        threshold: 25
      };
    case 'decision':
      return {
        primary: 'Approval Rate Change',
        secondary: 'Decision Volume',
        threshold: 15
      };
    case 'bias':
      return {
        primary: 'Regional Disparity',
        secondary: 'Group Distribution',
        threshold: 20
      };
    default:
      return {
        primary: 'Event Impact',
        secondary: 'Pattern Strength',
        threshold: 20
      };
  }
};