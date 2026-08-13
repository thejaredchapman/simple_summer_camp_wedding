import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxWidthOrHeight: 2000,
  initialQuality: 0.8,
  fileType: 'image/jpeg',
  useWebWorker: true,
};

export async function compressPhoto(file) {
  try {
    return await imageCompression(file, COMPRESSION_OPTIONS);
  } catch (error) {
    console.error('Photo compression failed, uploading original file:', error.message);
    return file;
  }
}
