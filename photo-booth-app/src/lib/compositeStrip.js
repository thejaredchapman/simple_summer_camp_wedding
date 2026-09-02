const CANVAS_WIDTH = 1080;
const SINGLE_PHOTO_HEIGHT = 1350; // Instagram 4:5 portrait feed ratio
const STRIP_HEIGHT = 1920; // Instagram 9:16 Stories/Reels ratio
const TILE_GAP = 24; // gap between stacked photos, like a real photobooth strip
const OUTER_PADDING = 24; // matching border around the whole strip

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load a captured photo for compositing.'));
    img.src = dataUrl;
  });
}

// Draws `image` into the rectangle (x, y, w, h), cropping to fill it without
// stretching — same behavior as CSS `object-fit: cover`. This preserves each
// photo's bottom-right watermark position relative to that photo's own tile.
function drawCover(ctx, image, x, y, w, h) {
  const imageRatio = image.width / image.height;
  const targetRatio = w / h;
  let sx, sy, sw, sh;
  if (imageRatio > targetRatio) {
    sh = image.height;
    sw = sh * targetRatio;
    sx = (image.width - sw) / 2;
    sy = 0;
  } else {
    sw = image.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (image.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

export async function compositeStrip(photoDataUrls) {
  const count = photoDataUrls.length;
  if (count < 1 || count > 4) {
    throw new Error(`compositeStrip expects 1-4 photos, got ${count}`);
  }

  const images = await Promise.all(photoDataUrls.map(loadImage));

  const canvasHeight = count === 1 ? SINGLE_PHOTO_HEIGHT : STRIP_HEIGHT;
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tileWidth = CANVAS_WIDTH - OUTER_PADDING * 2;
  const totalGap = TILE_GAP * (count - 1);
  const tileHeight = (canvasHeight - OUTER_PADDING * 2 - totalGap) / count;

  images.forEach((image, index) => {
    const y = OUTER_PADDING + index * (tileHeight + TILE_GAP);
    drawCover(ctx, image, OUTER_PADDING, y, tileWidth, tileHeight);
  });

  return canvas.toDataURL('image/jpeg', 0.92);
}
