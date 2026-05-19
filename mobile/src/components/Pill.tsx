import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

type PillVariant = "instagram" | "twitter" | "whatsapp";

type PillProps = {
  label: string;
  variant: PillVariant;
};

const Pill = ({ label, variant }: PillProps) => {
  return (
    <View style={[styles.pill, pillVariantStyles[variant]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  instagram: {
    backgroundColor: colors.pillInstagram,
  },
  twitter: {
    backgroundColor: colors.pillTwitter,
  },
  whatsapp: {
    backgroundColor: colors.pillWhatsapp,
  },
});

const pillVariantStyles = {
  instagram: styles.instagram,
  twitter: styles.twitter,
  whatsapp: styles.whatsapp,
};

export default Pill;
