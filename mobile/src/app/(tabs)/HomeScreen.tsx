import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import Card from "../../components/Card";
import SectionHeader from "../../components/SectionHeader";
import StatusDot from "../../components/StatusDot";
import { colors } from "../../constants/colors";
import { computeSHA256 } from "../../utils/hashUtils";
import { extractMetadata, extractMetadataFromUri } from "../../utils/metadataUtils";

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
  const router = useRouter();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCaptureEvidence = async () => {
    try {
      setLoading(true);

      // Request gallery permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "TraceVault needs access to your photo library to capture evidence."
        );
        return;
      }

      // Also request media library permission for metadata extraction
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (mediaPermission.status !== "granted") {
        Alert.alert(
          "Permission required",
          "TraceVault needs media library access to read image metadata."
        );
        return;
      }

      // Open gallery — images only, no editing
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const pickedAsset = result.assets[0];
      const imageUri = pickedAsset.uri;
      const assetId = pickedAsset.assetId;

      // Extract metadata — use MediaLibrary if assetId available, otherwise fallback to file system
      const metadataPromise = assetId
        ? extractMetadata(assetId)
        : extractMetadataFromUri(imageUri, pickedAsset.width, pickedAsset.height);

      // Run metadata extraction and SHA-256 hash in parallel
      const [metadata, sha256Hash] = await Promise.all([
        metadataPromise,
        computeSHA256(imageUri),
      ]);

      // Navigate to capture form with all extracted data
      router.push({
        pathname: "/capture-form",
        params: {
          imageUri,
          sha256Hash,
          integrityFlag: metadata.integrityFlag,
          exifData: JSON.stringify({
            creationTime: metadata.creationTime,
            modificationTime: metadata.modificationTime,
            width: metadata.width,
            height: metadata.height,
          }),
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to process image. Please try again.");
      console.error("Capture evidence error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <SectionHeader
            title="TraceVault"
            subtitle="Your evidence is safe here"
          />
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => signOut()}
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCaptureEvidence}
          disabled={loading}
        >
          <Card style={styles.captureCard}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <View style={styles.captureIcon}>
                <Ionicons name="camera" size={26} color={colors.textPrimary} />
              </View>
            )}
            <Text style={styles.captureTitle}>
              {loading ? "Processing..." : "Capture evidence"}
            </Text>
            <Text style={styles.captureSubtitle}>
              Screenshot + metadata + hash
            </Text>
          </Card>
        </TouchableOpacity>

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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
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