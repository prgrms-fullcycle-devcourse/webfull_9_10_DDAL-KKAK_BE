export const UPLOAD_CONSTANTS = {
  ALLOWED_MIME_TYPES: new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]),
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;
