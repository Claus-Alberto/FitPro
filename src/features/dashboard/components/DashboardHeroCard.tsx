import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MacroBar } from "../../../components/MacroBar";
import STRINGS from "../../../constants/strings.json";
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from "../../../constants/theme";

interface DashboardHeroCardProps {
  streak: number;
  nutrition: {
    caloriesRemaining: number;
    macros: {
      label: string;
      current: number;
      total: number;
      color: string;
    }[];
  };
}

/**
 * @description Hero Card component displaying daily overview, streak, and nutrition macros.
 * @param {number} streak - The user's current consecutive login/workout streak.
 * @param {object} nutrition - Object containing remaining calories and macro nutrients data.
 * @returns {JSX.Element} The rendered Hero Card component.
 */
export const DashboardHeroCard = ({ streak, nutrition }: DashboardHeroCardProps) => {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroTitle}>{STRINGS.dashboard.hero.title}</Text>
        <View style={styles.streakBadge}>
          <MaterialCommunityIcons name="fire" size={20} color={COLORS.accent} />
          <Text style={styles.streakText}>
            {STRINGS.dashboard.hero.streak.replace("{days}", String(streak))}
          </Text>
        </View>
      </View>
      <View style={styles.macroContainer}>
        <View style={styles.calorieCircle}>
          <Text style={styles.calNumber}>{nutrition.caloriesRemaining}</Text>
          <Text style={styles.calLabel}>{STRINGS.dashboard.hero.calLabel}</Text>
        </View>
        <View style={styles.macroBars}>
          {nutrition.macros.map((macro, idx) => (
            <MacroBar
              key={idx}
              label={macro.label}
              current={macro.current}
              total={macro.total}
              color={macro.color}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 24,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.default,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.subtitle.fontSize,
    fontWeight: TYPOGRAPHY.subtitle.fontWeight,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  streakText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "800",
  },
  macroContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  calorieCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  calNumber: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
  },
  calLabel: {
    color: COLORS.gray400,
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  macroBars: {
    flex: 1,
  },
});
