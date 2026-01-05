import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {WeatherAlert} from '../models/Weather';
import {COLORS, getAlertColor} from '../utils/colors';
import {SPACING, BORDER_RADIUS, FONT_SIZE} from '../utils/constants';
import {getAlertUrgencyText} from '../utils/formatters';

interface AlertCardProps {
  alert: WeatherAlert;
  onDismiss?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({alert, onDismiss}) => {
  const alertColor = getAlertColor(alert.severity);
  const urgencyText = getAlertUrgencyText(alert);

  return (
    <View style={[styles.container, {borderLeftColor: alertColor, borderLeftWidth: 4}]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.severityBadge}>
            <View style={[styles.severityDot, {backgroundColor: alertColor}]} />
            <Text style={[styles.severityText, {color: alertColor}]}>
              {alert.severity.toUpperCase()}
            </Text>
          </View>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title}>{alert.title}</Text>
        <Text style={styles.description}>{alert.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.area}>{alert.area}</Text>
          <Text style={styles.urgency}>{urgencyText}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  severityText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dismissButton: {
    padding: SPACING.xs,
  },
  dismissText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  area: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  urgency: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

