import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../constants/colors";
import IntegrityBadge from "../components/IntegrityBadge";
import Card from "../components/Card";
import { captureEvidence } from "../utils/evidenceApi";
import type { IntegrityFlag } from "../types/evidence";

function formatTimestamp(ms: number | null): string {
  if (ms === null) return "N/A";
  const date = new Date(ms);
  return date.toLocaleString();
}

export default function CaptureFormScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{
    imageUri: string;
    sha256Hash: string;
    integrityFlag: string;
    exifData: string;
  }>();

  const imageUri = params.imageUri ?? "";
  const sha256Hash = params.sha256Hash ?? "";
  const integrityFlag = (params.integrityFlag ?? "unknown") as IntegrityFlag;
  const exifData = params.exifData
    ? JSON.parse(params.exifData as string)
    : { creationTime: null, modificationTime: null, width: null, height: null };

  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [sender, setSender] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [saving, setSaving] = useState(false);

  const truncatedHash = sha256Hash.length > 16
    ? `${sha256Hash.substring(0, 16)}...`
    : sha256Hash;

  const handleSave = async () => {
    if (!platform.trim()) {
      Alert.alert("Required", "Please enter the platform name.");
      return;
    }
    if (!sender.trim()) {
      Alert.alert("Required", "Please enter the sender or username.");
      return;
    }
    if (!messageContent.trim()) {
      Alert.alert("Required", "Please paste the harassing message.");
      return;
    }
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to save evidence.");
      return;
    }

    try {
      setSaving(true);

      const capturedAt = new Date().toISOString();
      const deviceLabel = Platform.OS === "ios" ? "iOS" : "Android";

      const saved = await captureEvidence({
        userId,
        platform: platform.trim(),
        url: url.trim(),
        sender: sender.trim(),
        messageContent: messageContent.trim(),
        additionalContext: additionalContext.trim(),
        imageUri,
        sha256Hash,
        capturedAt,
        device: deviceLabel,
        exifData: {
          creationTime: exifData.creationTime,
          modificationTime: exifData.modificationTime,
          width: exifData.width,
          height: exifData.height,
        },
        integrityFlag,
      });

      const suffix = saved.id ? ` (ID: ${saved.id})` : "";
      Alert.alert("Evidence saved", `Your evidence has been securely stored.${suffix}`, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save evidence. Please try again.");
      console.error("Save evidence error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New capture</Text>
            <View style={styles.backButton} />
          </View>

          {/* Screenshot Preview */}
          <Card style={styles.previewCard}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </Card>

          {/* Hash & Integrity Info */}
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons
                name="finger-print"
                size={18}
                color={colors.accent}
              />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>SHA-256 Hash</Text>
                <Text style={styles.infoValue} selectable>
                  {truncatedHash}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={
                  integrityFlag === "clean"
                    ? colors.success
                    : integrityFlag === "modified"
                    ? colors.warning
                    : colors.danger
                }
              />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoLabel}>Integrity</Text>
                <IntegrityBadge flag={integrityFlag} size="small" />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.exifGrid}>
              <View style={styles.exifItem}>
                <Text style={styles.exifLabel}>Created</Text>
                <Text style={styles.exifValue}>
                  {formatTimestamp(exifData.creationTime)}
                </Text>
              </View>
              <View style={styles.exifItem}>
                <Text style={styles.exifLabel}>Modified</Text>
                <Text style={styles.exifValue}>
                  {formatTimestamp(exifData.modificationTime)}
                </Text>
              </View>
              <View style={styles.exifItem}>
                <Text style={styles.exifLabel}>Dimensions</Text>
                <Text style={styles.exifValue}>
                  {exifData.width && exifData.height
                    ? `${exifData.width} × ${exifData.height}`
                    : "N/A"}
                </Text>
              </View>
            </View>
          </Card>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Incident details</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Platform</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Instagram, WhatsApp, Twitter"
                placeholderTextColor={colors.inputPlaceholder}
                value={platform}
                onChangeText={setPlatform}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>URL or source</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. https://instagram.com/p/..."
                placeholderTextColor={colors.inputPlaceholder}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Sender / username</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. @username"
                placeholderTextColor={colors.inputPlaceholder}
                value={sender}
                onChangeText={setSender}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Message content</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Paste the harassing message here"
                placeholderTextColor={colors.inputPlaceholder}
                value={messageContent}
                onChangeText={setMessageContent}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Additional context</Text>
              <TextInput
                style={[styles.input, styles.contextInput]}
                placeholder="Describe what happened"
                placeholderTextColor={colors.inputPlaceholder}
                value={additionalContext}
                onChangeText={setAdditionalContext}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={colors.textPrimary}
                />
                <Text style={styles.saveButtonText}>Save Evidence</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  previewCard: {
    overflow: "hidden",
    padding: 0,
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
  },
  infoCard: {
    padding: 16,
    gap: 12,
    backgroundColor: colors.surfaceStrong,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoTextGroup: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  exifGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exifItem: {
    flex: 1,
    gap: 4,
  },
  exifLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exifValue: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  formSection: {
    gap: 14,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  contextInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
