const WATERMARK_SRC = '/camp-sign-new.png';
const HASHTAG_TEXT = '#CampJavery';
// Wider than the main site's single-upload watermark (18%) — booth photos
// are viewed small within a strip tile, so the mark needs to read clearly
// at that scale.
const WATERMARK_WIDTH_RATIO = 0.28;
const MARGIN_RATIO = 0.04;

let cachedWatermarkImage = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Composites the camp sign + "#CampJavery" into the bottom-right corner of
// one photo and returns a new JPEG data URL. Must run BEFORE compositeStrip
// — the strip's "cover crop" per tile preserves each photo's corner mark in
// its correct relative position, so watermarking after compositing would
// put the mark in the wrong place (or clip it) for anything but the last tile.
export async function watermarkPhoto(photoDataUrl) {
  const [sourceImage, watermarkImage] = await Promise.all([
    loadImage(photoDataUrl),
    cachedWatermarkImage ?? loadImage(WATERMARK_SRC).then(img => (cachedWatermarkImage = img)),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceImage, 0, 0);

  const margin = Math.round(canvas.width * MARGIN_RATIO);
  const markWidth = Math.round(canvas.width * WATERMARK_WIDTH_RATIO);
  const markHeight = Math.round(markWidth * (watermarkImage.height / watermarkImage.width));
  const fontSize = Math.max(14, Math.round(markWidth * 0.11));
  const textGap = Math.round(fontSize * 0.35);

  const markX = canvas.width - markWidth - margin;
  const textY = canvas.height - margin; // hashtag baseline — the bottom-most element
  const markY = textY - fontSize - textGap - markHeight; // sign sits above the hashtag

  ctx.drawImage(watermarkImage, markX, markY, markWidth, markHeight);

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  const textX = markX + markWidth;
  ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.18));
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.strokeText(HASHTAG_TEXT, textX, textY);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(HASHTAG_TEXT, textX, textY);

  return canvas.toDataURL('image/jpeg', 0.92);
}
