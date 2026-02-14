/**
 * Image optimization script for Camp Javery wedding site.
 *
 * Generates optimized WebP versions and responsive sizes for all photos.
 * Run with: node scripts/optimize-images.mjs
 *
 * Outputs to public/photos/optimized/
 */

import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, parse } from 'path';

const PHOTOS_DIR = new URL('../public/photos', import.meta.url).pathname;
const OUTPUT_DIR = join(PHOTOS_DIR, 'optimized');

// Widths to generate for srcset
const SIZES = [
  { width: 400, suffix: '-400w' },
  { width: 800, suffix: '-800w' },
  { width: 1200, suffix: '-1200w' },
];

const QUALITY = 80;

async function optimizeImages() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = await readdir(PHOTOS_DIR);
  const imageFiles = files.filter(f =>
    /\.(jpe?g|png)$/i.test(f) && !f.startsWith('.')
  );

  console.log(`Found ${imageFiles.length} images to optimize.`);

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const file of imageFiles) {
    const inputPath = join(PHOTOS_DIR, file);
    const { name } = parse(file);
    const fileStat = await stat(inputPath);
    totalOriginal += fileStat.size;

    for (const { width, suffix } of SIZES) {
      const outputPath = join(OUTPUT_DIR, `${name}${suffix}.webp`);
      try {
        const info = await sharp(inputPath)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(outputPath);
        totalOptimized += info.size;
      } catch (err) {
        console.error(`  Failed: ${file} @ ${width}w - ${err.message}`);
      }
    }

    // Also generate a full-size WebP (for lightbox / hero)
    const fullPath = join(OUTPUT_DIR, `${name}.webp`);
    try {
      const info = await sharp(inputPath)
        .resize(1920, null, { withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(fullPath);
      totalOptimized += info.size;
    } catch (err) {
      console.error(`  Failed full-size: ${file} - ${err.message}`);
    }

    process.stdout.write('.');
  }

  console.log('\n');
  console.log(`Original total:  ${(totalOriginal / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Optimized total: ${(totalOptimized / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Savings:         ${(((totalOriginal - totalOptimized) / totalOriginal) * 100).toFixed(0)}%`);
  console.log(`Output:          ${OUTPUT_DIR}`);
}

optimizeImages().catch(console.error);
