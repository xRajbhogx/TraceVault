import * as MediaLibrary from "expo-media-library";
import { File } from "expo-file-system";
import type { IntegrityFlag } from "../types/evidence";

/** Threshold in milliseconds — 5 seconds */
const TAMPER_THRESHOLD_MS = 5000;

export interface ExtractedMetadata {
  creationTime: number | null;
  modificationTime: number | null;
  width: number | null;
  height: number | null;
  integrityFlag: IntegrityFlag;
}

function computeIntegrity(
  creationTime: number | null,
  modificationTime: number | null
): IntegrityFlag {
  if (creationTime != null && modificationTime != null) {
    const diff = Math.abs(modificationTime - creationTime);
    return diff > TAMPER_THRESHOLD_MS ? "modified" : "clean";
  }
  return "unknown";
}

/**
 * Extracts metadata from a media-library asset and determines integrity.
 * Compares creationTime vs modificationTime — if they differ by more than
 * 5 seconds the image is flagged as "modified", otherwise "clean".
 */
export async function extractMetadata(
  assetId: string
): Promise<ExtractedMetadata> {
  const asset = await MediaLibrary.getAssetInfoAsync(assetId);

  const creationTime = asset.creationTime;
  const modificationTime = asset.modificationTime;
  const width = asset.width;
  const height = asset.height;

  return {
    creationTime,
    modificationTime,
    width,
    height,
    integrityFlag: computeIntegrity(creationTime, modificationTime),
  };
}

/**
 * Fallback metadata extraction using the file URI directly.
 * Used when assetId is unavailable (common on Android).
 * Reads timestamps from the filesystem and accepts dimensions
 * from the image picker result.
 */
export async function extractMetadataFromUri(
  fileUri: string,
  pickerWidth: number | null,
  pickerHeight: number | null
): Promise<ExtractedMetadata> {
  const file = new File(fileUri);
  const creationTime = file.creationTime;
  const modificationTime = file.modificationTime;

  return {
    creationTime,
    modificationTime,
    width: pickerWidth,
    height: pickerHeight,
    integrityFlag: computeIntegrity(creationTime, modificationTime),
  };
}
