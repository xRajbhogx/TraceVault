import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import type { IntegrityFlag } from "../types/evidence";

type IntegrityBadgeProps = {
  flag: IntegrityFlag;
  size?: "small" | "default";
};

const badgeConfig: Record<
  IntegrityFlag,
  { label: string; icon: string; textColor: string; bgColor: string }
> = {
  clean: {
    label: "Clean",
    icon: "✓",
    textColor: colors.success,
    bgColor: colors.successMuted,
  },
  modified: {
    label: "Modified",
    icon: "⚠",
    textColor: colors.warning,
    bgColor: colors.warningMuted,
  },
  unknown: {
    label: "Unknown",
    icon: "?",
    textColor: colors.danger,
    bgColor: colors.dangerMuted,
  },
};

const IntegrityBadge = ({ flag, size = "default" }: IntegrityBadgeProps) => {
  const config = badgeConfig[flag];
  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bgColor },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: config.textColor },
          isSmall && styles.badgeTextSmall,
        ]}
      >
        {config.icon} {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeSmall: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  badgeTextSmall: {
    fontSize: 11,
  },
});

export default IntegrityBadge;
