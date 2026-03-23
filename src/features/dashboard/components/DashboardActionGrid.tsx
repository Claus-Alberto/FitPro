import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ActionButton } from "../../../components/ActionButton";
import STRINGS from "../../../constants/strings.json";
import { COLORS } from "../../../constants/theme";

interface DashboardActionGridProps {
  onStartWorkout: () => void;
}

/**
 * @description Action Grid component offering quick navigation to primary app features.
 * @param {function} onStartWorkout - Callback to trigger the active workout flow.
 * @returns {JSX.Element} The rendered action grid component.
 */
export const DashboardActionGrid = ({
  onStartWorkout,
}: DashboardActionGridProps) => {
  const router = useRouter();

  return (
    <>
      <View style={styles.gridContainer}>
        <ActionButton
          icon="dumbbell"
          color={COLORS.white}
          bg={COLORS.primary}
          label={STRINGS.dashboard.actions.workout}
          onPress={onStartWorkout}
        />
        <ActionButton
          icon="silverware-fork-knife"
          color={COLORS.info}
          bg="#E0F2FE"
          label={STRINGS.dashboard.actions.meal}
          onPress={() => router.push("/(tabs)/diet")}
        />
      </View>

      <View style={styles.gridContainerSecondary}>
        <ActionButton
          icon="water-plus"
          color="#0EA5E9"
          bg="#E0F2FE"
          label={STRINGS.dashboard.actions.hydration}
          onPress={() => {}}
        />
        <ActionButton
          icon="cart-outline"
          color="#D97706"
          bg="#FEF3C7"
          label={STRINGS.dashboard.actions.market}
          onPress={() => {}}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  gridContainerSecondary: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
});
