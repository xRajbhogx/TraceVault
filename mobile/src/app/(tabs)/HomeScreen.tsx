import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import SectionHeader from "../../components/SectionHeader";
import StatusDot from "../../components/StatusDot";
import { colors } from "../../constants/colors";

const recentCaptures = [
  {
    id: "instagram",
    title: "Instagram - @user123",
    time: "2 mins ago",
    status: "accent" as const,
  },
  {
    id: "twitter",
    title: "Twitter - DM thread",
    time: "Yesterday",
    status: "success" as const,
  },
  {
    id: "whatsapp",
    title: "WhatsApp - Group chat",
    time: "2 days ago",
    status: "success" as const,
  },
];

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="TraceVault"
          subtitle="Your evidence is safe here"
        />

        <Card style={styles.captureCard}>
          <View style={styles.captureIcon}>
            <Ionicons name="camera" size={26} color={colors.textPrimary} />
          </View>
          <Text style={styles.captureTitle}>Capture evidence</Text>
          <Text style={styles.captureSubtitle}>Screenshot + metadata + hash</Text>
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent captures</Text>
        </View>

        <View style={styles.list}>
          {recentCaptures.map((item) => (
            <Card key={item.id} style={styles.listCard}>
              <View style={styles.listRow}>
                <StatusDot variant={item.status} />
                <View style={styles.listTextGroup}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listTime}>{item.time}</Text>
                </View>
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
  captureCard: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  captureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  captureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  captureSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  list: {
    gap: 12,
  },
  listCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listTextGroup: {
    gap: 4,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  listTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default HomeScreen;