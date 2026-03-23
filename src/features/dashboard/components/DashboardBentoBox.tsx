import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import STRINGS from "../../../constants/strings.json";
import { COLORS, SHADOWS, SPACING } from "../../../constants/theme";

interface DashboardBentoBoxProps {
  weight: number;
}

/**
 * @description Bento Box component displaying user body metrics like weight.
 * @param {number} weight - The current user's weight.
 * @returns {JSX.Element} The rendered Bento Box metrics component.
 */
export const DashboardBentoBox = ({ weight }: DashboardBentoBoxProps) => {
  return (
    <View style={styles.bentoContainer}>
      <TouchableOpacity activeOpacity={0.8} style={styles.wideWidget}>
        <View>
          <Text style={styles.widgetLabel}>
            {STRINGS.dashboard.metrics.weightLabel}
          </Text>
          <Text style={styles.widgetValue}>
            {weight} <Text style={styles.unit}>{STRINGS.common.units.kg}</Text>
          </Text>
        </View>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="chart-line"
            size={24}
            color={COLORS.primary}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bentoContainer: {
    gap: 12,
    marginTop: 0,
  },
  wideWidget: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.soft,
  },
  widgetLabel: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 4,
    fontWeight: "600",
  },
  widgetValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  unit: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray400,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.successLight,
    justifyContent: "center",
    alignItems: "center",
  },
});
