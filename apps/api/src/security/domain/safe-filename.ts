const MAX_FILENAME_LENGTH = 200;

export function sanitizeUploadFilename(filename: string): string {
  const normalized = filename.replace(/\\/g, '/');
  const baseName = normalized.split('/').pop() ?? normalized;
  const withoutTraversal = baseName.replace(/\.\.+/g, '.');
  const cleaned = [...withoutTraversal]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim();

  if (!cleaned || cleaned === '.' || cleaned === '..') {
    return 'upload.bin';
  }

  return cleaned.slice(0, MAX_FILENAME_LENGTH);
}

export function isPathTraversalAttempt(filename: string): boolean {
  const normalized = filename.replace(/\\/g, '/').toLowerCase();
  return normalized.includes('../') || normalized.includes('/..') || normalized.startsWith('..');
}
