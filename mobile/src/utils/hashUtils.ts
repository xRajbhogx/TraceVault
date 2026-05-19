import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";

/**
 * Computes a SHA-256 hash of the file at the given URI.
 * Reads the file as base64, then hashes the raw bytes.
 */
export async function computeSHA256(fileUri: string): Promise<string> {
  const file = new File(fileUri);
  const base64 = await file.base64();

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64,
    { encoding: Crypto.CryptoEncoding.HEX }
  );

  return hash;
}
