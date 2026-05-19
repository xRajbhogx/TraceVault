import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

const SectionHeader = ({ title, subtitle }: SectionHeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default SectionHeader;
