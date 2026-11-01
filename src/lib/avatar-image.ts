/**
 * Validates, crops, and compresses member avatars before Supabase Storage upload.
 * Risk: MEDIUM. Browser compatibility and upload limits are enforced here.
 */

// ======================================================
// AVATAR UPLOAD — CLIENT-SIDE IMAGE PREPARATION
// ======================================================
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1024;
export async function validateAvatarSource(file: File): Promise<string> {
  if (file.size > MAX_SOURCE_BYTES) throw new AvatarImageError("That photo is larger than 20 MB. Please choose a smaller image.");
  if (!file.size) throw new AvatarImageError("That photo is empty. Please choose another image.");
  const bytes = new Uint8Array(await file.slice(0,64).arrayBuffer());
  const text = new TextDecoder("ascii").decode(bytes);
  if (text.slice(4,8)==="ftyp" && /heic|heix|hevc|hevx|mif1|msf1/.test(text)) {
    return "image/heic";
  }
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value)) return "image/png";
  if (text.slice(0,4)==="RIFF" && text.slice(8,12)==="WEBP") return "image/webp";
  throw new AvatarImageError("We couldn’t recognize this image. Choose a genuine JPEG, PNG or WebP file, not a renamed HEIC photo.");
}

export class AvatarImageError extends Error {}

export function loadAvatarImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AvatarImageError("This browser couldn’t decode that photo. For HEIC/HEIF, export as JPEG using Most Compatible, then choose the JPEG file."));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new AvatarImageError("This browser couldn’t prepare the photo. Please try a JPEG or PNG.")),
      "image/jpeg",
      0.86,
    );
  });
}

export async function prepareAvatarImage(file: File, crop?: { x: number; y: number; zoom: number }): Promise<Blob> {
  await validateAvatarSource(file);

  const source = await loadAvatarImage(file);
  const sourceSize = Math.min(source.naturalWidth, source.naturalHeight) / (crop?.zoom ?? 1);
  if (!sourceSize) throw new AvatarImageError("That image has no usable pixels.");

  const outputSize = Math.min(sourceSize, MAX_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  if (!context) throw new AvatarImageError("This browser couldn’t prepare the photo.");

  const maxX = Math.max(0, source.naturalWidth - sourceSize);
  const maxY = Math.max(0, source.naturalHeight - sourceSize);
  const sourceX = Math.min(maxX, Math.max(0, maxX / 2 + (crop?.x ?? 0) * maxX / 2));
  const sourceY = Math.min(maxY, Math.max(0, maxY / 2 + (crop?.y ?? 0) * maxY / 2));
  context.fillStyle = "#151d27"; context.fillRect(0,0,outputSize,outputSize);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);

  const blob = await canvasBlob(canvas);
  if (!["image/jpeg", "image/png", "image/webp"].includes(blob.type)) throw new AvatarImageError("This browser could not prepare a supported photo. Try exporting it as JPEG.");
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new AvatarImageError("The prepared photo is still larger than 5 MB. Please choose another image.");
  }
  return blob;
}
