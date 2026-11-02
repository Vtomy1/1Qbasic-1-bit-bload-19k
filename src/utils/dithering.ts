import { ConversionResult, ImageProcessingOptions } from '../types';
import { generateBsaveBinary } from './bsave';

// Bayer 4x4 matrix
const BAYER_4X4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// Bayer 8x8 matrix
const BAYER_8X8: number[][] = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

export const TARGET_WIDTH = 640;
export const TARGET_HEIGHT = 480;

/**
 * Draws image onto a 640x480 canvas according to the scaling mode
 */
export function renderImageToCanvas(
  img: HTMLImageElement,
  scaling: 'fit' | 'fill' | 'stretch'
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Fill black background (standard QBasic black border/letterbox)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  if (scaling === 'stretch') {
    ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  } else if (scaling === 'fit') {
    const scale = Math.min(TARGET_WIDTH / imgW, TARGET_HEIGHT / imgH);
    const drawW = Math.round(imgW * scale);
    const drawH = Math.round(imgH * scale);
    const drawX = Math.round((TARGET_WIDTH - drawW) / 2);
    const drawY = Math.round((TARGET_HEIGHT - drawH) / 2);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } else if (scaling === 'fill') {
    const scale = Math.max(TARGET_WIDTH / imgW, TARGET_HEIGHT / imgH);
    const drawW = Math.round(imgW * scale);
    const drawH = Math.round(imgH * scale);
    const drawX = Math.round((TARGET_WIDTH - drawW) / 2);
    const drawY = Math.round((TARGET_HEIGHT - drawH) / 2);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  return ctx.getImageData(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
}

/**
 * Preprocesses pixel buffer (luminance, contrast, brightness, gamma, inversion)
 */
function preprocessImage(
  imageData: ImageData,
  options: ImageProcessingOptions
): Float32Array {
  const { data, width, height } = imageData;
  const count = width * height;
  const gray = new Float32Array(count);

  const { brightness, contrast, gamma, invert } = options;
  // Contrast factor calculation
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const bOffset = brightness * 2.55;
  const invGamma = 1.0 / Math.max(0.1, gamma);

  for (let i = 0; i < count; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    // Standard Rec. 601 Luma
    let val = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply brightness
    val += bOffset;

    // Apply contrast
    val = cFactor * (val - 128) + 128;

    // Clamp
    val = Math.max(0, Math.min(255, val));

    // Gamma
    if (gamma !== 1.0) {
      val = 255 * Math.pow(val / 255, invGamma);
    }

    // Invert
    if (invert) {
      val = 255 - val;
    }

    gray[i] = Math.max(0, Math.min(255, val));
  }

  return gray;
}

/**
 * Executes 1-bit dithering algorithm on 640x480 grayscale buffer
 */
export function convertTo1Bit(
  imageData: ImageData,
  options: ImageProcessingOptions
): ConversionResult {
  const startTime = performance.now();
  const width = TARGET_WIDTH;
  const height = TARGET_HEIGHT;
  const totalPixels = width * height;

  const gray = preprocessImage(imageData, options);
  const binaryPixels = new Uint8Array(totalPixels); // 0 = black, 1 = white
  const threshold = options.threshold;

  switch (options.algorithm) {
    case 'threshold': {
      for (let i = 0; i < totalPixels; i++) {
        binaryPixels[i] = gray[i] >= threshold ? 1 : 0;
      }
      break;
    }

    case 'noise': {
      for (let i = 0; i < totalPixels; i++) {
        // Stochastic random jitter [-40, +40]
        const jitter = (Math.random() - 0.5) * 80;
        binaryPixels[i] = gray[i] + jitter >= threshold ? 1 : 0;
      }
      break;
    }

    case 'bayer-4': {
      for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        const by = y % 4;
        for (let x = 0; x < width; x++) {
          const bx = x % 4;
          const matrixVal = (BAYER_4X4[by][bx] / 16) * 255;
          const biasedThreshold = threshold + (matrixVal - 128);
          binaryPixels[rowOffset + x] = gray[rowOffset + x] >= biasedThreshold ? 1 : 0;
        }
      }
      break;
    }

    case 'bayer-8': {
      for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        const by = y % 8;
        for (let x = 0; x < width; x++) {
          const bx = x % 8;
          const matrixVal = (BAYER_8X8[by][bx] / 64) * 255;
          const biasedThreshold = threshold + (matrixVal - 128);
          binaryPixels[rowOffset + x] = gray[rowOffset + x] >= biasedThreshold ? 1 : 0;
        }
      }
      break;
    }

    case 'halftone': {
      const dotSize = 4;
      for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        const cy = (y % dotSize) - dotSize / 2 + 0.5;
        for (let x = 0; x < width; x++) {
          const cx = (x % dotSize) - dotSize / 2 + 0.5;
          const dist = Math.sqrt(cx * cx + cy * cy);
          const maxDist = Math.sqrt(2) * (dotSize / 2);
          const distNormalized = dist / maxDist; // 0 (center) to 1 (corner)
          const targetLuma = (1 - distNormalized) * 255;
          binaryPixels[rowOffset + x] = gray[rowOffset + x] >= targetLuma * (threshold / 128) ? 1 : 0;
        }
      }
      break;
    }

    case 'floyd-steinberg': {
      // Work on mutable copy of float buffer for error propagation
      const buffer = new Float32Array(gray);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldVal = buffer[idx];
          const newVal = oldVal >= threshold ? 255 : 0;
          binaryPixels[idx] = newVal === 255 ? 1 : 0;
          const error = oldVal - newVal;

          if (x + 1 < width) {
            buffer[idx + 1] += (error * 7) / 16;
          }
          if (y + 1 < height) {
            if (x - 1 >= 0) {
              buffer[idx + width - 1] += (error * 3) / 16;
            }
            buffer[idx + width] += (error * 5) / 16;
            if (x + 1 < width) {
              buffer[idx + width + 1] += (error * 1) / 16;
            }
          }
        }
      }
      break;
    }

    case 'atkinson': {
      // Bill Atkinson dithering: preserves sharp edges, diffuses 3/4 of error
      const buffer = new Float32Array(gray);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldVal = buffer[idx];
          const newVal = oldVal >= threshold ? 255 : 0;
          binaryPixels[idx] = newVal === 255 ? 1 : 0;
          const error = Math.floor((oldVal - newVal) / 8);

          if (x + 1 < width) buffer[idx + 1] += error;
          if (x + 2 < width) buffer[idx + 2] += error;
          if (y + 1 < height) {
            if (x - 1 >= 0) buffer[idx + width - 1] += error;
            buffer[idx + width] += error;
            if (x + 1 < width) buffer[idx + width + 1] += error;
          }
          if (y + 2 < height) {
            buffer[idx + width * 2] += error;
          }
        }
      }
      break;
    }

    case 'sierra-3': {
      // Sierra 3-row diffusion
      const buffer = new Float32Array(gray);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldVal = buffer[idx];
          const newVal = oldVal >= threshold ? 255 : 0;
          binaryPixels[idx] = newVal === 255 ? 1 : 0;
          const error = oldVal - newVal;

          // Row 0
          if (x + 1 < width) buffer[idx + 1] += (error * 5) / 32;
          if (x + 2 < width) buffer[idx + 2] += (error * 3) / 32;

          // Row 1
          if (y + 1 < height) {
            if (x - 2 >= 0) buffer[idx + width - 2] += (error * 2) / 32;
            if (x - 1 >= 0) buffer[idx + width - 1] += (error * 4) / 32;
            buffer[idx + width] += (error * 5) / 32;
            if (x + 1 < width) buffer[idx + width + 1] += (error * 4) / 32;
            if (x + 2 < width) buffer[idx + width + 2] += (error * 2) / 32;
          }

          // Row 2
          if (y + 2 < height) {
            if (x - 1 >= 0) buffer[idx + width * 2 - 1] += (error * 2) / 32;
            buffer[idx + width * 2] += (error * 3) / 32;
            if (x + 1 < width) buffer[idx + width * 2 + 1] += (error * 2) / 32;
          }
        }
      }
      break;
    }

    case 'sierra-2': {
      // Sierra Lite (2-row)
      const buffer = new Float32Array(gray);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldVal = buffer[idx];
          const newVal = oldVal >= threshold ? 255 : 0;
          binaryPixels[idx] = newVal === 255 ? 1 : 0;
          const error = oldVal - newVal;

          if (x + 1 < width) buffer[idx + 1] += (error * 2) / 4;
          if (y + 1 < height) {
            if (x - 1 >= 0) buffer[idx + width - 1] += (error * 1) / 4;
            buffer[idx + width] += (error * 1) / 4;
          }
        }
      }
      break;
    }

    case 'jarvis': {
      // Jarvis, Judice & Ninke (divisor 48)
      const buffer = new Float32Array(gray);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldVal = buffer[idx];
          const newVal = oldVal >= threshold ? 255 : 0;
          binaryPixels[idx] = newVal === 255 ? 1 : 0;
          const error = oldVal - newVal;

          if (x + 1 < width) buffer[idx + 1] += (error * 7) / 48;
          if (x + 2 < width) buffer[idx + 2] += (error * 5) / 48;

          if (y + 1 < height) {
            if (x - 2 >= 0) buffer[idx + width - 2] += (error * 3) / 48;
            if (x - 1 >= 0) buffer[idx + width - 1] += (error * 5) / 48;
            buffer[idx + width] += (error * 7) / 48;
            if (x + 1 < width) buffer[idx + width + 1] += (error * 5) / 48;
            if (x + 2 < width) buffer[idx + width + 2] += (error * 3) / 48;
          }

          if (y + 2 < height) {
            if (x - 2 >= 0) buffer[idx + width * 2 - 2] += (error * 1) / 48;
            if (x - 1 >= 0) buffer[idx + width * 2 - 1] += (error * 3) / 48;
            buffer[idx + width * 2] += (error * 5) / 48;
            if (x + 1 < width) buffer[idx + width * 2 + 1] += (error * 3) / 48;
            if (x + 2 < width) buffer[idx + width * 2 + 2] += (error * 1) / 48;
          }
        }
      }
      break;
    }

    case 'burkes': {
      // Burkes (divisor 32)
      const buffer = new Float32Array(gray);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldVal = buffer[idx];
          const newVal = oldVal >= threshold ? 255 : 0;
          binaryPixels[idx] = newVal === 255 ? 1 : 0;
          const error = oldVal - newVal;

          if (x + 1 < width) buffer[idx + 1] += (error * 8) / 32;
          if (x + 2 < width) buffer[idx + 2] += (error * 4) / 32;

          if (y + 1 < height) {
            if (x - 2 >= 0) buffer[idx + width - 2] += (error * 2) / 32;
            if (x - 1 >= 0) buffer[idx + width - 1] += (error * 4) / 32;
            buffer[idx + width] += (error * 8) / 32;
            if (x + 1 < width) buffer[idx + width + 1] += (error * 4) / 32;
            if (x + 2 < width) buffer[idx + width + 2] += (error * 2) / 32;
          }
        }
      }
      break;
    }
  }

  // Calculate statistics
  let whiteCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    if (binaryPixels[i] === 1) whiteCount++;
  }
  const blackCount = totalPixels - whiteCount;
  const whitePercent = (whiteCount / totalPixels) * 100;

  // Generate BSAVE binary (38,407 bytes)
  const bsaveBinary = generateBsaveBinary(binaryPixels, width, height);

  const endTime = performance.now();

  return {
    width,
    height,
    pixelData: binaryPixels,
    bsaveBinary,
    whitePixels: whiteCount,
    blackPixels: blackCount,
    whitePercent,
    processingTimeMs: Math.round(endTime - startTime),
  };
}
