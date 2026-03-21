import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface ActionButtonProps {
  /** Icon name from MaterialCommunityIcons */
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Color of the icon */
  color: string;
  /** Background color of the icon container */
  bg: string;
  /** Label text for the button */
  label: string;
  /** Callback when the button is pressed */
  onPress: () => void;
}

/**
 * @description Flexible and reusable action button for dashboard and grids.
 * @param {ActionButtonProps} props - Component properties.
 */
export const ActionButton: React.FC<ActionButtonProps> = ({ icon, color, bg, label, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.actionCard} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBg, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionCard: { 
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    padding: SPACING.md, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: COLORS.gray100 
  },
  iconBg: { 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.md 
  },
  actionText: { 
    flex: 1, 
    fontSize: TYPOGRAPHY.body.fontSize, 
    fontWeight: TYPOGRAPHY.body.fontWeight, 
    color: COLORS.gray800 
  },
});
