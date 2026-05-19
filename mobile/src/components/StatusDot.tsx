import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../constants/colors";

type DotVariant = "accent" | "success" | "info";

type StatusDotProps = {
  variant?: DotVariant;
};

const StatusDot = ({ variant = "accent" }: StatusDotProps) => {
  return <View style={[styles.dot, dotVariantStyles[variant]]} />;
};

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  success: {
    backgroundColor: colors.success,
  },
  info: {
    backgroundColor: colors.info,
  },
});

const dotVariantStyles = {
  accent: styles.accent,
  success: styles.success,
  info: styles.info,
};

export default StatusDot;
