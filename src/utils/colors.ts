// Modern premium weather app colors
export const COLORS = {
  // Primary colors - Premium gradient
  primary: '#6366F1', // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryGradient: ['#6366F1', '#818CF8', '#A5B4FC'],
  
  // Weather condition colors - Original
  sunny: '#FFD700',
  cloudy: '#87CEEB',
  rainy: '#4682B4',
  stormy: '#2F4F4F',
  snowy: '#E6E6FA',
  foggy: '#D3D3D3',
  
  // Background colors - Soft & elegant
  background: '#F8FAFC',
  backgroundDark: '#0F172A',
  cardBackground: '#FFFFFF',
  cardBackgroundDark: '#1E293B',
  
  // Text colors - Better contrast
  text: '#0F172A',
  textSecondary: '#64748B',
  textDark: '#FFFFFF',
  textSecondaryDark: '#CBD5E1',
  
  // Alert colors
  alertMinor: '#FFD700',
  alertModerate: '#FF9500',
  alertSevere: '#FF3B30',
  alertExtreme: '#8B0000',
  
  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  
  // Gradient colors
  gradientStart: '#007AFF',
  gradientEnd: '#5AC8FA',
  gradientSunnyStart: '#FFD700',
  gradientSunnyEnd: '#FFA500',
  gradientRainyStart: '#4682B4',
  gradientRainyEnd: '#87CEEB',
  gradientStormyStart: '#2F4F4F',
  gradientStormyEnd: '#696969',
  
  // Border colors - Softer
  border: '#E2E8F0',
  borderDark: '#334155',
  
  // Shadow - Premium depth
  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowDark: 'rgba(15, 23, 42, 0.25)',
  shadowPrimary: 'rgba(99, 102, 241, 0.2)',
  
  // Glass effect
  glass: 'rgba(255, 255, 255, 0.7)',
  glassDark: 'rgba(30, 41, 59, 0.7)',
};

export const getConditionColor = (conditionCode: string): string => {
  const code = conditionCode.toLowerCase();
  if (code.includes('sun') || code.includes('clear')) return COLORS.sunny;
  if (code.includes('cloud')) return COLORS.cloudy;
  if (code.includes('rain') || code.includes('drizzle')) return COLORS.rainy;
  if (code.includes('storm') || code.includes('thunder')) return COLORS.stormy;
  if (code.includes('snow') || code.includes('sleet')) return COLORS.snowy;
  if (code.includes('fog') || code.includes('mist')) return COLORS.foggy;
  return COLORS.cloudy;
};

export const getAlertColor = (severity: string): string => {
  switch (severity) {
    case 'minor':
      return COLORS.alertMinor;
    case 'moderate':
      return COLORS.alertModerate;
    case 'severe':
      return COLORS.alertSevere;
    case 'extreme':
      return COLORS.alertExtreme;
    default:
      return COLORS.alertModerate;
  }
};

