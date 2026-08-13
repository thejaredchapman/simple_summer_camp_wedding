#!/usr/bin/env node
import QRCode from 'qrcode';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error('Usage: node scripts/generate-qr.js <upload-page-url>');
  console.error('Example: node scripts/generate-qr.js https://campjavery.com/upload');
  process.exit(1);
}

const outputDir = path.join(process.cwd(), 'scripts', 'output');
const outputPath = path.join(outputDir, 'upload-qr.png');

await mkdir(outputDir, { recursive: true });
await QRCode.toFile(outputPath, targetUrl, {
  width: 1024,
  margin: 2,
});

console.log(`QR code saved to ${outputPath}`);
console.log(`Encodes: ${targetUrl}`);
