import { File } from "expo-file-system";
import type { EvidenceRecord, IntegrityFlag } from "../types/evidence";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://tracevault-backend.onrender.com";

type CaptureEvidenceInput = {
  userId: string;
  platform: string;
  url: string;
  sender: string;
  messageContent: string;
  additionalContext: string;
  imageUri: string;
  sha256Hash: string;
  capturedAt: string;
  device: string;
  exifData: EvidenceRecord["exifData"];
  integrityFlag: IntegrityFlag;
};

type CaptureEvidenceResponse = {
  success?: boolean;
  evidence_id?: string;
  image_url?: string;
  hash_valid?: boolean;
  message?: string;
};

function inferMimeType(uri: string): string {
  const parts = uri.split("?")[0]?.split("#")[0]?.split(".");
  const ext = parts?.[parts.length - 1]?.toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}

async function imageUriToDataUrl(uri: string): Promise<string> {
  const file = new File(uri);
  const base64 = await file.base64();
  const mimeType = inferMimeType(uri);

  return `data:${mimeType};base64,${base64}`;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload?.error ?? payload?.message ?? "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

function resolveIntegrityFlag(hashValid?: boolean): IntegrityFlag {
  if (hashValid === true) return "clean";
  if (hashValid === false) return "modified";
  return "unknown";
}

function resolveIntegrityFlagFromRaw(
  raw: Record<string, unknown>
): IntegrityFlag {
  const explicit =
    (raw.integrity_flag as IntegrityFlag | undefined) ??
    (raw.integrityFlag as IntegrityFlag | undefined);

  if (explicit === "clean" || explicit === "modified" || explicit === "unknown") {
    return explicit;
  }

  return resolveIntegrityFlag(
    (raw.hash_valid as boolean | undefined) ??
      (raw.hashValid as boolean | undefined)
  );
}

function resolvePlatform(raw: Record<string, unknown>): string {
  const platform =
    (raw.platform as string | undefined) ??
    (raw.platform_name as string | undefined) ??
    (raw.platformName as string | undefined) ??
    (raw.platform_url as string | undefined) ??
    (raw.platformUrl as string | undefined);

  return platform && platform.trim().length > 0 ? platform : "Unknown";
}

function normalizeRecord(raw: Record<string, unknown>): EvidenceRecord {
  const exifRaw =
    (raw.exif_data as Record<string, unknown> | undefined) ??
    (raw.exifData as Record<string, unknown> | undefined) ??
    {};

  return {
    id:
      (raw.evidence_id as string | undefined) ??
      (raw.evidenceId as string | undefined) ??
      (raw.id as string | undefined) ??
      "",
    capturedAt:
      (raw.captured_at as string | undefined) ??
      (raw.capturedAt as string | undefined) ??
      (raw.created_at as string | undefined) ??
      new Date().toISOString(),
    platform: resolvePlatform(raw),
    url:
      (raw.platform_url as string | undefined) ??
      (raw.platformUrl as string | undefined) ??
      (raw.url as string | undefined) ??
      "",
    sender:
      (raw.sender_id as string | undefined) ??
      (raw.senderId as string | undefined) ??
      (raw.sender as string | undefined) ??
      "",
    messageContent:
      (raw.page_content as string | undefined) ??
      (raw.pageContent as string | undefined) ??
      (raw.messageContent as string | undefined) ??
      "",
    additionalContext:
      (raw.additional_context as string | undefined) ??
      (raw.additionalContext as string | undefined) ??
      (raw.notes as string | undefined) ??
      "",
    imageUri:
      (raw.image_url as string | undefined) ??
      (raw.imageUrl as string | undefined) ??
      (raw.imageUri as string | undefined) ??
      "",
    sha256Hash:
      (raw.sha256_hash as string | undefined) ??
      (raw.sha256Hash as string | undefined) ??
      "",
    exifData: {
      creationTime:
        (exifRaw.creationTime as number | null | undefined) ??
        (exifRaw.creation_time as number | null | undefined) ??
        null,
      modificationTime:
        (exifRaw.modificationTime as number | null | undefined) ??
        (exifRaw.modification_time as number | null | undefined) ??
        null,
      width:
        (exifRaw.width as number | null | undefined) ??
        (exifRaw.image_width as number | null | undefined) ??
        null,
      height:
        (exifRaw.height as number | null | undefined) ??
        (exifRaw.image_height as number | null | undefined) ??
        null,
    },
    integrityFlag: resolveIntegrityFlagFromRaw(raw),
  };
}

function resolveArrayResponse(response: unknown): Record<string, unknown>[] {
  if (Array.isArray(response)) return response as Record<string, unknown>[];
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
    if (Array.isArray(obj.evidence)) return obj.evidence as Record<string, unknown>[];
    if (Array.isArray(obj.records)) return obj.records as Record<string, unknown>[];
  }
  return [];
}

function resolveObjectResponse(response: unknown): Record<string, unknown> | null {
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object") {
      return obj.data as Record<string, unknown>;
    }
    if (obj.evidence && typeof obj.evidence === "object") {
      return obj.evidence as Record<string, unknown>;
    }
    return obj;
  }
  return null;
}

export async function captureEvidence(
  input: CaptureEvidenceInput
): Promise<EvidenceRecord> {
  const screenshotBase64 = await imageUriToDataUrl(input.imageUri);

  const response = await apiRequest<CaptureEvidenceResponse>("/evidence/capture", {
    method: "POST",
    body: JSON.stringify({
      captured_at: input.capturedAt,
      platform_url: input.url,
      platform_name: input.platform,
      sender_id: input.sender,
      screenshot_base64: screenshotBase64,
      page_content: input.messageContent,
      page_title: input.platform,
      sha256_hash: input.sha256Hash,
      device: input.device,
      user_id: input.userId,
      userId: input.userId,
      platform: input.platform,
      additional_context: input.additionalContext,
      notes: input.additionalContext,
      exif_data: input.exifData,
      integrity_flag: input.integrityFlag,
    }),
  });

  return normalizeRecord({
    evidence_id: response.evidence_id,
    image_url: response.image_url ?? input.imageUri,
    hash_valid: response.hash_valid,
    captured_at: input.capturedAt,
    platform: input.platform,
    platform_url: input.url,
    sender_id: input.sender,
    page_content: input.messageContent,
    additional_context: input.additionalContext,
    sha256_hash: input.sha256Hash,
    exif_data: input.exifData,
    integrity_flag: input.integrityFlag,
  });
}

export async function fetchEvidenceForUser(
  userId: string
): Promise<EvidenceRecord[]> {
  const response = await apiRequest<unknown>(
    `/evidence/user/${encodeURIComponent(userId)}`
  );

  const records = resolveArrayResponse(response).map(normalizeRecord);
  records.sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  );

  return records;
}

export async function fetchEvidenceById(
  evidenceId: string
): Promise<EvidenceRecord | null> {
  const response = await apiRequest<unknown>(
    `/evidence/${encodeURIComponent(evidenceId)}`
  );

  const record = resolveObjectResponse(response);
  return record ? normalizeRecord(record) : null;
}

export async function deleteEvidence(evidenceId: string): Promise<void> {
  await apiRequest<void>(`/evidence/${encodeURIComponent(evidenceId)}`, {
    method: "DELETE",
  });
}
