import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {CurrentWeather} from '../models/Weather';
import {COLORS, getConditionColor} from '../utils/colors';
import {SPACING, BORDER_RADIUS, FONT_SIZE} from '../utils/constants';
import {formatTemperature, formatTime, getConditionIcon} from '../utils/formatters';

interface WeatherCardProps {
  weather: CurrentWeather;
  location: string;
  temperatureUnit: 'C' | 'F';
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  location,
  temperatureUnit,
}) => {
  const conditionColor = getConditionColor(weather.conditionCode);
  
  // Original gradient based on condition
  const getGradientColors = () => {
    const code = weather.conditionCode.toLowerCase();
    if (code.includes('sun') || code.includes('clear')) {
      return ['#FFD700', '#FFA500', '#FF8C00'];
    }
    if (code.includes('rain') || code.includes('drizzle')) {
      return ['#4682B4', '#5F9EA0', '#87CEEB'];
    }
    if (code.includes('storm') || code.includes('thunder')) {
      return ['#2F4F4F', '#4A4A4A', '#696969'];
    }
    if (code.includes('cloud')) {
      return ['#708090', '#87CEEB', '#B0C4DE'];
    }
    return ['#007AFF', '#5AC8FA', '#87CEEB'];
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.mainInfo}>
          <View style={styles.temperatureContainer}>
            <Text style={styles.temperature}>
              {formatTemperature(weather.temperature, temperatureUnit)}
            </Text>
            <Text style={styles.conditionIcon}>{weather.icon}</Text>
          </View>
          <Text style={styles.condition}>{weather.condition}</Text>
        </View>

        <View style={styles.detailsContainer}>

          {weather.sunrise && weather.sunset && (
            <View style={styles.sunInfo}>
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌅</Text>
                <Text style={styles.sunText}>{formatTime(weather.sunrise)}</Text>
              </View>
              <View style={styles.sunDivider} />
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌇</Text>
                <Text style={styles.sunText}>{formatTime(weather.sunset)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.xxl + 8,
    padding: SPACING.xl + 8,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    shadowColor: COLORS.shadowDark,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backdropFilter: 'blur(10px)',
  },
  locationIcon: {
    fontSize: FONT_SIZE.sm,
    marginRight: SPACING.xs,
  },
  location: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textDark,
    fontWeight: '600',
    flex: 1,
  },
  mainInfo: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  temperature: {
    fontSize: 96,
    color: COLORS.textDark,
    fontWeight: '100',
    letterSpacing: -4,
    marginRight: SPACING.md,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: {width: 0, height: 4},
    textShadowRadius: 8,
  },
  conditionIcon: {
    fontSize: 72,
    marginTop: SPACING.sm,
  },
  condition: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textDark,
    fontWeight: '700',
    marginTop: SPACING.sm,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  detailsContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    width: '100%',
  },
  feelsLike: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textDark,
    opacity: 0.95,
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  sunInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  sunItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sunIcon: {
    fontSize: FONT_SIZE.md,
    marginRight: SPACING.xs,
  },
  sunText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  sunDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: SPACING.md,
  },
});

