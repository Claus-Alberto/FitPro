import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MacroBar } from "../../../components/MacroBar";
import ProgressRing from "../../../components/ProgressRing";
import STRINGS from "../../../constants/strings.json";
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from "../../../constants/theme";

interface DashboardHeroCardProps {
  streak: number;
  nutrition: {
    caloriesRemaining: number;
    progress: number;
    macros: {
      label: string;
      current: number;
      total: number;
      color: string;
    }[];
  };
  water: number;
  waterGoal: number;
  onOpenWater: () => void;
}

/**
 * @description Hero Card component displaying daily overview, streak, nutrition macros, and a
 * water-intake ring nested over the calorie ring — both are real animated progress arcs, not
 * decorative borders.
 * @param {number} streak - The user's current consecutive login/workout streak.
 * @param {object} nutrition - Remaining calories, 0-1 progress toward the goal, and macro data.
 * @param {number} water - Today's water intake in ml.
 * @param {number} waterGoal - Today's water goal in ml.
 * @param {function} onOpenWater - Opens the water-logging modal (tapping the mini ring or the FAB).
 * @returns {JSX.Element} The rendered Hero Card component.
 */
export const DashboardHeroCard = ({
  streak,
  nutrition,
  water,
  waterGoal,
  onOpenWater,
}: DashboardHeroCardProps) => {
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
        <View style={styles.ringStack}>
          <ProgressRing
            size={100}
            strokeWidth={8}
            progress={nutrition.progress}
            color={COLORS.primary}
            trackColor={COLORS.whiteOpacity10}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={styles.calNumber}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {nutrition.caloriesRemaining}
              </Text>
              <Text style={styles.calLabel}>
                {STRINGS.dashboard.hero.calLabel}
              </Text>
            </View>
          </ProgressRing>
          <TouchableOpacity
            style={styles.waterRingWrap}
            onPress={onOpenWater}
            activeOpacity={0.85}
          >
            <ProgressRing
              size={38}
              strokeWidth={4}
              progress={waterGoal > 0 ? water / waterGoal : 0}
              color={COLORS.info}
              trackColor={COLORS.whiteOpacity10}
            >
              <MaterialCommunityIcons
                name="water"
                size={14}
                color={COLORS.info}
              />
            </ProgressRing>
          </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  streakText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 4,
  },
  macroContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ringStack: {
    width: 100,
    height: 100,
    marginRight: 20,
  },
  waterRingWrap: {
    position: "absolute",
    bottom: -12,
    right: -10,
    backgroundColor: COLORS.secondary,
    borderRadius: 999,
    padding: 3,
  },
  calNumber: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    maxWidth: 68,
    textAlign: "center",
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
