import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

interface MacroBarProps {
  /** Label for the nutrition metric (e.g., Protein, Carbs) */
  label: string;
  /** Current value consumed */
  current: number;
  /** Daily target value */
  total: number;
  /** Color of the progress bar */
  color: string;
}

/**
 * @description Progress bar component for displaying nutrition targets.
 * @param {MacroBarProps} props - Component properties.
 */
export const MacroBar: React.FC<MacroBarProps> = ({ label, current, total, color }) => {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>{current}/{total}g</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginBottom: 12 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 4 
  },
  label: { 
    fontSize: TYPOGRAPHY.caption.fontSize, 
    color: COLORS.gray400, 
    fontWeight: TYPOGRAPHY.caption.fontWeight 
  },
  values: { 
    fontSize: TYPOGRAPHY.caption.fontSize, 
    color: COLORS.white, 
    fontWeight: TYPOGRAPHY.caption.fontWeight 
  },
  track: { 
    height: 6, 
    backgroundColor: COLORS.gray800, 
    borderRadius: 3 
  },
  bar: { 
    height: '100%', 
    borderRadius: 3 
  },
});
