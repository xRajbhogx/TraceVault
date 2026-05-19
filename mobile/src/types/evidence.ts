export type IntegrityFlag = "clean" | "modified" | "unknown"

export interface EvidenceRecord {
  id: string
  capturedAt: string
  platform: string
  url: string
  sender: string
  messageContent: string
  additionalContext: string
  imageUri: string
  sha256Hash: string
  exifData: {
    creationTime: number | null
    modificationTime: number | null
    width: number | null
    height: number | null
  }
  integrityFlag: IntegrityFlag
}
