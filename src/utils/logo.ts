// Turns an uploaded logo into a small PNG data URL that is safe to store and to draw in a PDF.
// The logo is scaled to fit inside maxW x maxH, keeps its transparency, and never grows.
export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

export async function logoFileToDataUrl(file: File, maxW = 600, maxH = 240): Promise<string> {
  if (!LOGO_ACCEPT.split(",").includes(file.type)) {
    throw new Error("Use a PNG, JPG, WEBP or SVG logo.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Logo must be smaller than 5 MB.");
  }

  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("That image could not be opened."));
    el.src = src;
  });

  const w = img.naturalWidth || maxW;
  const h = img.naturalHeight || maxH;
  const scale = Math.min(1, maxW / w, maxH / h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process the image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/** Reads the pixel size of a data URL image (used to keep the logo's proportions in the PDF). */
export function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve({ w: el.naturalWidth, h: el.naturalHeight });
    el.onerror = () => reject(new Error("Logo could not be loaded."));
    el.src = dataUrl;
  });
}
