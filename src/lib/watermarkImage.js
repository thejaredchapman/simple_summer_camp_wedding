const WATERMARK_SRC = '/camp-sign.png';
const WATERMARK_OPACITY = 0.9; // Solid/noticeable, not a faint ghost mark.
const WATERMARK_WIDTH_RATIO = 0.18; // ~18% of the photo's width.
const WATERMARK_MARGIN_RATIO = 0.03;

let cachedWatermarkImage = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function loadImageFromFile(file) {
  const url = URL.createObjectURL(file);
  return loadImage(url).finally(() => URL.revokeObjectURL(url));
}

// Composites the camp sign into the bottom-right corner of a photo and
// returns a new watermarked File. Applied AFTER compression, so the
// watermark's proportions match what guests will actually see, and the
// canvas work stays cheap regardless of the original photo's resolution.
export async function addWatermark(file) {
  const [sourceImage, watermarkImage] = await Promise.all([
    loadImageFromFile(file),
    cachedWatermarkImage ?? loadImage(WATERMARK_SRC).then(img => (cachedWatermarkImage = img)),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceImage, 0, 0);

  const watermarkWidth = Math.round(canvas.width * WATERMARK_WIDTH_RATIO);
  const watermarkHeight = Math.round(watermarkWidth * (watermarkImage.height / watermarkImage.width));
  const margin = Math.round(canvas.width * WATERMARK_MARGIN_RATIO);
  const x = canvas.width - watermarkWidth - margin;
  const y = canvas.height - watermarkHeight - margin;

  ctx.globalAlpha = WATERMARK_OPACITY;
  ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
  ctx.globalAlpha = 1;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Failed to render watermark.'));
          return;
        }
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9
    );
  });
}
