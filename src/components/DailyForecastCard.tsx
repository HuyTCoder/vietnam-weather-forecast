import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {DailyForecast} from '../models/Weather';
import {COLORS} from '../utils/colors';
import {SPACING, BORDER_RADIUS, FONT_SIZE} from '../utils/constants';
import {formatTemperature, formatDayName} from '../utils/formatters';

interface DailyForecastCardProps {
  forecast: DailyForecast;
  temperatureUnit: 'C' | 'F';
  onPress?: () => void;
}

export const DailyForecastCard: React.FC<DailyForecastCardProps> = ({
  forecast,
  temperatureUnit,
  onPress,
}) => {
  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.dayName}>{formatDayName(forecast.date)}</Text>
          {forecast.precipitation > 0 && (
            <Text style={styles.precipitation}>
              🌧️ {Math.round(forecast.precipitation * 100)}%
            </Text>
          )}
        </View>
        <View style={styles.middleSection}>
          <Text style={styles.icon}>{forecast.icon}</Text>
          <Text style={styles.condition}>{forecast.condition}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.high}>
            {formatTemperature(forecast.high, temperatureUnit)}
          </Text>
          <Text style={styles.low}>
            {formatTemperature(forecast.low, temperatureUnit)}
          </Text>
        </View>
      </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.dayName}>{formatDayName(forecast.date)}</Text>
          {forecast.precipitation > 0 && (
            <Text style={styles.precipitation}>
              🌧️ {Math.round(forecast.precipitation * 100)}%
            </Text>
          )}
        </View>
        <View style={styles.middleSection}>
          <Text style={styles.icon}>{forecast.icon}</Text>
          <Text style={styles.condition}>{forecast.condition}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.high}>
            {formatTemperature(forecast.high, temperatureUnit)}
          </Text>
          <Text style={styles.low}>
            {formatTemperature(forecast.low, temperatureUnit)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
  },
  dayName: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  precipitation: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
  },
  middleSection: {
    flex: 1,
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  condition: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  high: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  low: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

