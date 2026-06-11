export interface ProcessedImage {
  image: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
  imagePreviewUrl: string;
  thumbPreviewUrl: string;
}

interface ResizeOptions {
  maxWidth: number;
  quality: number;
}

export async function processScreenshotImage(file: File): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file);
  const display = await resizeToBlob(bitmap, {maxWidth: 1600, quality: 0.8});
  const thumbnail = await resizeToBlob(bitmap, {maxWidth: 480, quality: 0.7});
  bitmap.close();

  return {
    image: display.blob,
    thumbnail: thumbnail.blob,
    width: display.width,
    height: display.height,
    imagePreviewUrl: URL.createObjectURL(display.blob),
    thumbPreviewUrl: URL.createObjectURL(thumbnail.blob),
  };
}

async function resizeToBlob(bitmap: ImageBitmap, options: ResizeOptions) {
  const ratio = Math.min(1, options.maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', {alpha: false});
  if (!context) {
    throw new Error('이미지를 처리할 수 없습니다.');
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, 'image/webp', options.quality).catch(() => canvasToBlob(canvas, 'image/jpeg', options.quality));
  return {blob, width, height};
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('이미지 변환에 실패했습니다.'));
        }
      },
      type,
      quality,
    );
  });
}

export function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagsToInput(tags: string[]) {
  return tags.join(', ');
}
