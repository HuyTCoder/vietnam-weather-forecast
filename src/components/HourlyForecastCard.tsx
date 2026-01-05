import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {HourlyForecast} from '../models/Weather';
import {COLORS} from '../utils/colors';
import {SPACING, BORDER_RADIUS, FONT_SIZE} from '../utils/constants';
import {formatTemperature, formatTime} from '../utils/formatters';

interface HourlyForecastCardProps {
  forecasts: HourlyForecast[];
  temperatureUnit: 'C' | 'F';
}

export const HourlyForecastCard: React.FC<HourlyForecastCardProps> = ({
  forecasts,
  temperatureUnit,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dự báo theo giờ</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {forecasts.map((forecast, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.time}>{formatTime(forecast.time, 'short')}</Text>
            <Text style={styles.icon}>{forecast.icon}</Text>
            <Text style={styles.temperature}>
              {formatTemperature(forecast.temperature, temperatureUnit)}
            </Text>
            {forecast.precipitation > 0 && (
              <Text style={styles.precipitation}>🌧️ {Math.round(forecast.precipitation * 100)}%</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: SPACING.xl,
    letterSpacing: -1.2,
  },
  scrollView: {
    flexGrow: 0,
  },
  item: {
    alignItems: 'center',
    marginRight: SPACING.md,
    minWidth: 80,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  time: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  icon: {
    fontSize: 36,
    marginVertical: SPACING.sm,
  },
  temperature: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    fontWeight: '800',
    marginTop: SPACING.sm,
    letterSpacing: -0.5,
  },
  precipitation: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
});

