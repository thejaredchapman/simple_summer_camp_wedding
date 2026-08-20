import { parse } from 'exifr';

// GPS is deliberately never parsed — a guest's photo could reveal a home
// address to anyone else viewing the gallery. `gps: false` skips that IFD
// entirely rather than just filtering it out after the fact.
const EXIFR_OPTIONS = { gps: false };

const ALLOWED_FIELDS = [
  'Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime',
  'ISO', 'Flash', 'DateTimeOriginal', 'Orientation', 'ExifImageWidth', 'ExifImageHeight', 'Software',
];

export async function extractPhotoMetadata(file) {
  try {
    const exif = await parse(file, EXIFR_OPTIONS);
    if (!exif) return null;

    const metadata = {};
    for (const field of ALLOWED_FIELDS) {
      const value = exif[field];
      if (value === undefined || value === null) continue;
      metadata[field] = value instanceof Date ? value.toISOString() : value;
    }
    return Object.keys(metadata).length > 0 ? metadata : null;
  } catch {
    // Many phone photos have no EXIF at all (screenshots, downloaded
    // images, already-compressed re-shares) — that's expected, not an error.
    return null;
  }
}
