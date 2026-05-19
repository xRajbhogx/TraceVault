import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Card from "../components/Card";
import IntegrityBadge from "../components/IntegrityBadge";
import { colors } from "../constants/colors";
import { getEvidenceById } from "../utils/storageUtils";
import type { EvidenceRecord, IntegrityFlag } from "../types/evidence";

function formatFullDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getVerificationLabel(flag: IntegrityFlag): string {
  switch (flag) {
    case "clean":
      return "Hash verified — content untampered";
    case "modified":
      return "Warning — file was modified after creation";
    case "unknown":
      return "Integrity could not be determined";
  }
}

function getVerificationIcon(
  flag: IntegrityFlag
): "checkmark-circle" | "alert-circle" | "help-circle" {
  switch (flag) {
    case "clean":
      return "checkmark-circle";
    case "modified":
      return "alert-circle";
    case "unknown":
      return "help-circle";
  }
}

function getVerificationColor(flag: IntegrityFlag): string {
  switch (flag) {
    case "clean":
      return colors.success;
    case "modified":
      return colors.warning;
    case "unknown":
      return colors.danger;
  }
}

function getVerificationBg(flag: IntegrityFlag): string {
  switch (flag) {
    case "clean":
      return colors.successMuted;
    case "modified":
      return colors.warningMuted;
    case "unknown":
      return colors.dangerMuted;
  }
}

export default function EvidenceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (params.id) {
        const data = await getEvidenceById(params.id);
        setRecord(data);
      }
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text style={styles.errorText}>Evidence record not found</Text>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const verifyColor = getVerificationColor(record.integrityFlag);
  const verifyBg = getVerificationBg(record.integrityFlag);
  const verifyIcon = getVerificationIcon(record.integrityFlag);
  const verifyLabel = getVerificationLabel(record.integrityFlag);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <TouchableOpacity
          style={styles.header}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={colors.accent}
          />
          <Text style={styles.headerTitle}>Vault</Text>
        </TouchableOpacity>

        {/* Screenshot preview */}
        <Card style={styles.imageCard}>
          <Image
            source={{ uri: record.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        </Card>

        {/* Verification badge */}
        <View style={[styles.verifyBadge, { backgroundColor: verifyBg }]}>
          <Ionicons name={verifyIcon} size={20} color={verifyColor} />
          <Text style={[styles.verifyText, { color: verifyColor }]}>
            {verifyLabel}
          </Text>
        </View>

        {/* Detail rows */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Platform</Text>
            <Text style={styles.detailValue}>{record.platform}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>URL</Text>
            <Text
              style={[styles.detailValue, styles.detailValueShrink]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {record.url || "—"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sender</Text>
            <Text style={styles.detailValue}>{record.sender}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Captured at</Text>
            <Text style={styles.detailValue}>
              {formatFullDate(record.capturedAt)}
            </Text>
          </View>
        </Card>

        {/* Message content */}
        {record.messageContent ? (
          <Card style={styles.messageCard}>
            <Text style={styles.messageLabel}>Message content</Text>
            <Text style={styles.messageText} selectable>
              {record.messageContent}
            </Text>
          </Card>
        ) : null}

        {/* Additional context */}
        {record.additionalContext ? (
          <Card style={styles.messageCard}>
            <Text style={styles.messageLabel}>Additional context</Text>
            <Text style={styles.messageText} selectable>
              {record.additionalContext}
            </Text>
          </Card>
        ) : null}

        {/* SHA-256 hash */}
        <Card style={styles.hashCard}>
          <Text style={styles.hashLabel}>SHA-256 hash</Text>
          <Text style={styles.hashValue} selectable>
            {record.sha256Hash}
          </Text>
        </Card>

        {/* Export PDF button — placeholder for future backend integration */}
        <TouchableOpacity
          style={styles.exportButton}
          activeOpacity={0.8}
          onPress={() => {
            // Will be wired to backend PDF generation later
          }}
        >
          <Ionicons
            name="download-outline"
            size={20}
            color={colors.textPrimary}
          />
          <Text style={styles.exportButtonText}>Export PDF report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  backLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.accent,
  },
  imageCard: {
    overflow: "hidden",
    padding: 0,
    backgroundColor: colors.surfaceStrong,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  verifyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  verifyText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  detailsCard: {
    padding: 0,
    backgroundColor: colors.surfaceStrong,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  detailValueShrink: {
    maxWidth: "55%",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  messageCard: {
    padding: 16,
    gap: 8,
    backgroundColor: colors.surfaceStrong,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  hashCard: {
    padding: 16,
    gap: 8,
    backgroundColor: colors.surfaceStrong,
  },
  hashLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hashValue: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 20,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.surfaceStrong,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
