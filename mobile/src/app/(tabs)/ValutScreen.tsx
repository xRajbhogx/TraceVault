import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "../../components/Card";
import Pill from "../../components/Pill";
import SectionHeader from "../../components/SectionHeader";
import StatusDot from "../../components/StatusDot";
import { colors } from "../../constants/colors";

const vaultItems = [
  {
    id: "instagram",
    platform: "Instagram",
    variant: "instagram" as const,
    time: "Today, 9:41 AM",
    title: "instagram.com/p/abc123xyz",
    hash: "a3f5c21e8b74f2c...",
    status: "success" as const,
  },
  {
    id: "twitter",
    platform: "Twitter",
    variant: "twitter" as const,
    time: "Yesterday",
    title: "twitter.com/messages/934...",
    hash: "f72a19dc3e5b841...",
    status: "success" as const,
  },
  {
    id: "whatsapp",
    platform: "WhatsApp",
    variant: "whatsapp" as const,
    time: "2 days ago",
    title: "Group: Class 2024",
    hash: "d91c44ef72da356...",
    status: "success" as const,
  },
];

const ValutScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="My vault" subtitle="3 captures stored" />

        <View style={styles.list}>
          {vaultItems.map((item) => (
            <Card key={item.id} style={styles.vaultCard}>
              <View style={styles.vaultHeader}>
                <Pill label={item.platform} variant={item.variant} />
                <Text style={styles.vaultTime}>{item.time}</Text>
              </View>
              <Text style={styles.vaultTitle}>{item.title}</Text>
              <View style={styles.hashRow}>
                <StatusDot variant={item.status} />
                <Text style={styles.hashText}>{item.hash}</Text>
                <View style={styles.hashBar} />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 18,
  },
  list: {
    gap: 14,
  },
  vaultCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: colors.surfaceStrong,
  },
  vaultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vaultTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  vaultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  hashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hashText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  hashBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
});

export default ValutScreen;