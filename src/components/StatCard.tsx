import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS} from '../utils/colors';
import {SPACING, BORDER_RADIUS, FONT_SIZE} from '../utils/constants';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number; // Chấp nhận cả số và chuỗi
}

export const StatCard: React.FC<StatCardProps> = ({icon, label, value}) => {
return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      {/* Hiển thị trực tiếp value, không parseFloat ở đây nữa */}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SPACING.xs,
    minHeight: 130,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary + '25',
  },
  icon: {
    fontSize: 28,
  },
  value: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    letterSpacing: -1,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

