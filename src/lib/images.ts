"use client";

import type { ImageMetadata } from "@/lib/ai/schemas";
import { extractMetadata } from "@/lib/metadata";

export const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
export const MAX_FILES = 12;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Long edge sent to Gemini. Plenty for landmark recognition, small on the wire. */
const ANALYSIS_MAX_EDGE = 1024;
/** Long edge kept on device for the journey page. */
const STORED_MAX_EDGE = 1800;

export type PreparedImage = {
  imageId: string;
  /** Downscaled copy kept in IndexedDB and rendered on the journey page. */
  blob: Blob;
  /** Smaller JPEG, base64 without the data: prefix, sent to the model. */
  analysisBase64: string;
  analysisMimeType: string;
  previewUrl: string;
  fileName: string;
  /** Read from the ORIGINAL file, before the canvas re-encode strips EXIF. */
  metadata: ImageMetadata;
};

export function isAcceptedType(file: File): boolean {
  return (ACCEPTED_TYPES as readonly string[]).includes(file.type);
}

export async function prepareImage(file: File, imageId: string, uploadIndex: number): Promise<PreparedImage> {
  // Metadata first, and from the File itself: everything below re-encodes
  // through a canvas, which discards the EXIF segment entirely.
  const metadata = await extractMetadata(file, imageId, uploadIndex);

  const bitmap = await loadBitmap(file);

  try {
    const stored = await encode(bitmap, STORED_MAX_EDGE, 0.9);
    const analysis = await encode(bitmap, ANALYSIS_MAX_EDGE, 0.82);

    return {
      imageId,
      blob: stored,
      analysisBase64: await toBase64(analysis),
      analysisMimeType: "image/jpeg",
      previewUrl: URL.createObjectURL(stored),
      fileName: file.name,
      metadata,
    };
  } finally {
    bitmap.close?.();
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> path (some Safari builds reject certain files).
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode image"));
      element.src = url;
    });
    return await createImageBitmap(image);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function encode(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Could not encode image");
  return blob;
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}
