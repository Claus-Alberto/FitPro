import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ActionButton } from "../../../components/ActionButton";
import STRINGS from "../../../constants/strings.json";
import { COLORS } from "../../../constants/theme";

interface DashboardActionGridProps {
  onStartWorkout: () => void;
  onOpenWater: () => void;
}

/**
 * @description Action Grid component offering quick navigation to primary app features.
 * @param {function} onStartWorkout - Callback to trigger the active workout flow.
 * @param {function} onOpenWater - Callback to open the water-logging modal.
 * @returns {JSX.Element} The rendered action grid component.
 */
export const DashboardActionGrid = ({
  onStartWorkout,
  onOpenWater,
}: DashboardActionGridProps) => {
  const router = useRouter();

  return (
    <>
      <View style={styles.gridContainer}>
        <View style={styles.gridItemSpaced}>
          <ActionButton
            icon="dumbbell"
            color={COLORS.white}
            bg={COLORS.primary}
            label={STRINGS.dashboard.actions.workout}
            onPress={onStartWorkout}
          />
        </View>
        <View style={styles.gridItem}>
          <ActionButton
            icon="silverware-fork-knife"
            color={COLORS.info}
            bg="#E0F2FE"
            label={STRINGS.dashboard.actions.meal}
            onPress={() => router.push("/(tabs)/diet")}
          />
        </View>
      </View>

      <View style={styles.gridContainerSecondary}>
        <View style={styles.gridItemSpaced}>
          <ActionButton
            icon="water-plus"
            color={COLORS.info}
            bg="#E0F2FE"
            label={STRINGS.dashboard.actions.hydration}
            onPress={onOpenWater}
          />
        </View>
        <View style={styles.gridItem}>
          <ActionButton
            icon="cart-outline"
            color="#D97706"
            bg="#FEF3C7"
            label={STRINGS.dashboard.actions.market}
            onPress={() => router.push("/(tabs)/market")}
          />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  gridContainerSecondary: {
    flexDirection: "row",
    marginBottom: 24,
  },
  gridItem: {
    flex: 1,
  },
  gridItemSpaced: {
    flex: 1,
    marginRight: 12,
  },
});
