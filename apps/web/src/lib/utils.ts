import { NextRequest } from 'next/server';

export interface ParsedFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

export interface ParsedFormData {
  files: ParsedFile[];
  fields: Record<string, string>;
}

/**
 * Parse multipart form data from Next.js request
 */
export async function parseFormData(request: NextRequest): Promise<ParsedFormData> {
  try {
    const formData = await request.formData();
    const files: ParsedFile[] = [];
    const fields: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer());
        files.push({
          buffer,
          filename: value.name || `file_${files.length}`,
          mimeType: value.type || 'application/octet-stream',
          size: value.size,
        });
      } else {
        fields[key] = value;
      }
    }

    return { files, fields };
  } catch (error) {
    console.error('Error parsing form data:', error);
    throw new Error('Failed to parse form data');
  }
}

/**
 * Get file type from mime type
 */
export function getFileTypeFromMime(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

/**
 * Validate file types
 */
export function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    // Audio
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    // Documents
    'application/pdf',
    'text/plain',
    'application/json',
  ];

  return allowedTypes.includes(mimeType);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}