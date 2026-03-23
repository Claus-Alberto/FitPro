import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import STRINGS from "../../../constants/strings.json";
import { COLORS, SPACING } from "../../../constants/theme";

/**
 * @description Social Proof component displaying avatars and text to trigger community feeling.
 * @returns {JSX.Element} The rendered social proof component.
 */
export const DashboardSocialProof = () => {
  return (
    <View style={styles.socialProofBox}>
      <View style={styles.avatarGroup}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.avatarMini, { marginLeft: i > 1 ? -10 : 0 }]}
          >
            <MaterialCommunityIcons
              name="account"
              size={12}
              color={COLORS.white}
            />
          </View>
        ))}
      </View>
      <Text style={styles.socialText}>
        {STRINGS.dashboard.social.proofText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  socialProofBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  avatarGroup: {
    flexDirection: "row",
    marginRight: 10,
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gray400,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  socialText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray500,
  },
});
