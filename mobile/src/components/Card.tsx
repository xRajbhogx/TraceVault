import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../constants/colors";

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const Card = ({ children, style }: CardProps) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default Card;
