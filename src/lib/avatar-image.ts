const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class AvatarImageError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AvatarImageError("We couldn’t read that image. Please choose another photo."));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new AvatarImageError("This browser couldn’t prepare the photo. Please try a JPEG or PNG.")),
      "image/webp",
      0.86,
    );
  });
}

export async function prepareAvatarImage(file: File): Promise<Blob> {
  const lowerName = file.name.toLowerCase();
  if (file.type === "image/heic" || file.type === "image/heif" || /\.hei[cf]$/.test(lowerName)) {
    throw new AvatarImageError("HEIC photos aren’t supported yet. Please choose a JPEG, PNG, or WebP image.");
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new AvatarImageError("Please choose a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new AvatarImageError("That photo is larger than 5 MB. Please choose a smaller image.");
  }

  const source = await loadImage(file);
  const sourceSize = Math.min(source.naturalWidth, source.naturalHeight);
  if (!sourceSize) throw new AvatarImageError("That image has no usable pixels.");

  const outputSize = Math.min(sourceSize, MAX_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  if (!context) throw new AvatarImageError("This browser couldn’t prepare the photo.");

  const sourceX = Math.max(0, (source.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (source.naturalHeight - sourceSize) / 2);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);

  const blob = await canvasBlob(canvas);
  if (blob.type !== "image/webp") {
    throw new AvatarImageError("This browser doesn’t support WebP uploads. Please update your browser and try again.");
  }
  if (blob.size > MAX_SOURCE_BYTES) {
    throw new AvatarImageError("The prepared photo is still larger than 5 MB. Please choose another image.");
  }
  return blob;
}
