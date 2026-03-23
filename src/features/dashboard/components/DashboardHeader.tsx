import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import STRINGS from "../../../constants/strings.json";
import { COLORS, SPACING, TYPOGRAPHY } from "../../../constants/theme";

interface DashboardHeaderProps {
  userName: string;
  formattedDate: string;
}

/**
 * @description Header component for the Dashboard showing greeting and current date.
 * @param {string} userName - The name of the user to be greeted.
 * @param {string} formattedDate - The current formatted date string.
 * @returns {JSX.Element} The rendered header component.
 */
export const DashboardHeader = ({ userName, formattedDate }: DashboardHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
      <View>
        <Text style={styles.greeting}>
          {STRINGS.dashboard.greeting.replace("{name}", userName)}
        </Text>
        <Text style={styles.date}>
          {STRINGS.dashboard.statusBadge.replace("{date}", formattedDate)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  greeting: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight,
    color: COLORS.secondary,
    marginBottom: 2,
    letterSpacing: TYPOGRAPHY.h2.letterSpacing,
  },
  date: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
