import {WeatherAlert} from '../models/Weather';

export const formatTemperature = (temp: number, unit: 'C' | 'F' = 'C'): string => {
  const temperature = unit === 'F' ? (temp * 9) / 5 + 32 : temp;
  return `${Math.round(temperature)}°${unit}`;
};

export const formatTime = (dateString: string, format: 'short' | 'long' = 'short'): string => {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (format === 'short') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  
  return date.toLocaleDateString('en-US', {weekday: 'long', month: 'short', day: 'numeric'});
};

export const formatDayName = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  
  return date.toLocaleDateString('en-US', {weekday: 'long'});
};

export const formatWindSpeed = (speed: number, unit: 'kmh' | 'mph' = 'kmh'): string => {
  const converted = unit === 'mph' ? speed * 0.621371 : speed;
  return `${Math.round(converted)} ${unit === 'mph' ? 'mph' : 'km/h'}`;
};

export const formatPrecipitation = (amount: number): string => {
  if (amount === 0) return '0%';
  return `${Math.round(amount * 100)}%`;
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 0) {
    return 'Past';
  }
  if (diffMins < 60) {
    return `In ${diffMins} min`;
  }
  if (diffHours < 24) {
    return `In ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
  }
  return `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
};

export const getAlertUrgencyText = (alert: WeatherAlert): string => {
  if (alert.urgency === 'immediate') {
    return 'Now';
  }
  if (alert.urgency === 'expected') {
    return formatRelativeTime(alert.startTime);
  }
  if (alert.urgency === 'future') {
    return formatRelativeTime(alert.startTime);
  }
  return 'Past';
};

export const getConditionIcon = (conditionCode: string): string => {
  const code = conditionCode.toLowerCase();
  if (code.includes('sun') || code.includes('clear')) return '☀️';
  if (code.includes('cloud') && code.includes('partly')) return '⛅';
  if (code.includes('cloud')) return '☁️';
  if (code.includes('rain') && code.includes('light')) return '🌦️';
  if (code.includes('rain')) return '🌧️';
  if (code.includes('storm') || code.includes('thunder')) return '⛈️';
  if (code.includes('snow')) return '❄️';
  if (code.includes('sleet')) return '🌨️';
  if (code.includes('fog') || code.includes('mist')) return '🌫️';
  if (code.includes('wind')) return '💨';
  // Handle Open Meteo weather codes
  if (code.includes('weathercode')) {
    const weatherCode = parseInt(code.split('-')[1] || '0');
    return getIconFromWeatherCode(weatherCode);
  }
  return '🌤️';
};

// Convert WMO weather code to condition string
export const getConditionFromCode = (weatherCode: number): string => {
  // WMO Weather interpretation codes (WW) - International standard
  if (weatherCode === 0) return 'Clear Sky';
  if (weatherCode === 1) return 'Mainly Clear';
  if (weatherCode === 2) return 'Partly Cloudy';
  if (weatherCode === 3) return 'Overcast';
  if (weatherCode === 45) return 'Foggy';
  if (weatherCode === 48) return 'Depositing Rime Fog';
  if (weatherCode === 51) return 'Light Drizzle';
  if (weatherCode === 53) return 'Moderate Drizzle';
  if (weatherCode === 55) return 'Dense Drizzle';
  if (weatherCode === 56) return 'Light Freezing Drizzle';
  if (weatherCode === 57) return 'Dense Freezing Drizzle';
  if (weatherCode === 61) return 'Slight Rain';
  if (weatherCode === 63) return 'Moderate Rain';
  if (weatherCode === 65) return 'Heavy Rain';
  if (weatherCode === 66) return 'Light Freezing Rain';
  if (weatherCode === 67) return 'Heavy Freezing Rain';
  if (weatherCode === 71) return 'Slight Snow';
  if (weatherCode === 73) return 'Moderate Snow';
  if (weatherCode === 75) return 'Heavy Snow';
  if (weatherCode === 77) return 'Snow Grains';
  if (weatherCode === 80) return 'Slight Rain Showers';
  if (weatherCode === 81) return 'Moderate Rain Showers';
  if (weatherCode === 82) return 'Violent Rain Showers';
  if (weatherCode === 85) return 'Slight Snow Showers';
  if (weatherCode === 86) return 'Heavy Snow Showers';
  if (weatherCode === 95) return 'Thunderstorm';
  if (weatherCode === 96) return 'Thunderstorm with Slight Hail';
  if (weatherCode === 99) return 'Thunderstorm with Heavy Hail';
  return 'Unknown';
};

// Get icon from Open Meteo weather code
const getIconFromWeatherCode = (weatherCode: number): string => {
  if (weatherCode === 0 || weatherCode === 1) return '☀️';
  if (weatherCode === 2) return '⛅';
  if (weatherCode === 3) return '☁️';
  if (weatherCode === 45 || weatherCode === 48) return '🌫️';
  if (weatherCode >= 51 && weatherCode <= 57) return '🌦️';
  if (weatherCode >= 61 && weatherCode <= 67) return '🌧️';
  if (weatherCode >= 71 && weatherCode <= 77) return '❄️';
  if (weatherCode >= 80 && weatherCode <= 82) return '🌧️';
  if (weatherCode >= 85 && weatherCode <= 86) return '🌨️';
  if (weatherCode >= 95 && weatherCode <= 99) return '⛈️';
  return '🌤️';
};

