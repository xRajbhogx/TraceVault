import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EvidenceRecord } from "../types/evidence";

const INDEX_KEY = "evidence:index";

/**
 * Saves an evidence record to AsyncStorage and updates the index.
 */
export async function saveEvidence(record: EvidenceRecord): Promise<void> {
  const recordKey = `evidence:${record.id}`;

  // Store the record
  await AsyncStorage.setItem(recordKey, JSON.stringify(record));

  // Update the index
  const rawIndex = await AsyncStorage.getItem(INDEX_KEY);
  const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];

  if (!index.includes(record.id)) {
    index.push(record.id);
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }
}

/**
 * Retrieves all evidence records from AsyncStorage, sorted newest first.
 */
export async function getAllEvidence(): Promise<EvidenceRecord[]> {
  const rawIndex = await AsyncStorage.getItem(INDEX_KEY);
  const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];

  if (index.length === 0) return [];

  const keys = index.map((id) => `evidence:${id}`);
  const pairs = await AsyncStorage.multiGet(keys);

  const records: EvidenceRecord[] = [];

  for (const [, value] of pairs) {
    if (value) {
      records.push(JSON.parse(value) as EvidenceRecord);
    }
  }

  // Sort newest first by capturedAt
  records.sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  );

  return records;
}
