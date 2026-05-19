import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import Card from "../../components/Card";
import IntegrityBadge from "../../components/IntegrityBadge";
import SectionHeader from "../../components/SectionHeader";
import { colors } from "../../constants/colors";
import { fetchEvidenceForUser } from "../../utils/evidenceApi";
import type { EvidenceRecord } from "../../types/evidence";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateHash(hash: string): string {
  return hash.length > 16 ? `${hash.substring(0, 16)}...` : hash;
}

const VaultScreen = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        setLoading(true);
        if (!userId) {
          if (active) {
            setRecords([]);
            setLoading(false);
          }
          return;
        }

        try {
          const data = await fetchEvidenceForUser(userId);
          if (active) {
            setRecords(data);
          }
        } catch (error) {
          console.error("Load evidence error:", error);
          if (active) {
            setRecords([]);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [userId])
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Vault is empty</Text>
      <Text style={styles.emptySubtitle}>
        Captured evidence will appear here.{"\n"}
        Tap "Capture evidence" on the Home tab to start.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="My vault"
          subtitle={
            loading
              ? "Loading..."
              : `${records.length} capture${records.length !== 1 ? "s" : ""} stored`
          }
        />

        {!loading && records.length === 0 && renderEmptyState()}

        <View style={styles.list}>
          {records.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "../evidence-detail",
                  params: { id: item.id },
                })
              }
            >
              <Card style={styles.vaultCard}>
                <View style={styles.vaultHeader}>
                  <View style={styles.platformPill}>
                    <Text style={styles.platformText}>{item.platform}</Text>
                  </View>
                  <Text style={styles.vaultTime}>
                    {formatDate(item.capturedAt)}
                  </Text>
                </View>

                <View style={styles.senderRow}>
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.senderText}>{item.sender}</Text>
                </View>

                <View style={styles.hashRow}>
                  <IntegrityBadge flag={item.integrityFlag} size="small" />
                  <Text style={styles.hashText}>
                    {truncateHash(item.sha256Hash)}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
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
  platformPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.accentMuted,
  },
  platformText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent,
  },
  vaultTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  senderText: {
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
    fontFamily: "monospace",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.surfaceStrong,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default VaultScreen;