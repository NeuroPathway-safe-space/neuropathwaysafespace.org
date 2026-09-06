export interface FileValidationInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface FileValidationResult {
  ok: boolean;
  errors: string[];
}

const DEFAULT_ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "text/plain"];
const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateUploadMetadata(input: FileValidationInput): FileValidationResult {
  const allowedMimeTypes = (process.env.ALLOWED_UPLOAD_MIME_TYPES?.split(",") ?? DEFAULT_ALLOWED_MIME_TYPES)
    .map((item: string) => item.trim())
    .filter(Boolean);
  const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES ?? DEFAULT_MAX_UPLOAD_BYTES);
  const errors: string[] = [];

  if (!/^[\w\-. ()]+$/.test(input.fileName) || input.fileName.includes("..")) {
    errors.push("File name contains unsafe characters.");
  }

  if (!allowedMimeTypes.includes(input.mimeType)) {
    errors.push("File type is not permitted.");
  }

  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > maxUploadBytes) {
    errors.push("File size is outside permitted limits.");
  }

  return { ok: errors.length === 0, errors };
}

export function buildQuarantineStoragePath(documentId: string): string {
  return `quarantine/${documentId}`;
}

export function buildPrivateEvidenceStoragePath(organisationId: string, subjectId: string, documentId: string): string {
  return `organisations/${organisationId}/subjects/${subjectId}/documents/${documentId}`;
}
