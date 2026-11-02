/**
 * Types for 1-Bit 640x480 Image Conversion, Dithering & QBasic BSAVE Engine
 */

export type DitherAlgorithm =
  | 'floyd-steinberg'
  | 'atkinson'
  | 'bayer-4'
  | 'bayer-8'
  | 'sierra-3'
  | 'sierra-2'
  | 'jarvis'
  | 'burkes'
  | 'halftone'
  | 'threshold'
  | 'noise';

export type DisplayMode = 'screen11' | 'screen12';

export type PhosphorType = 'white' | 'green' | 'amber' | 'cyan' | 'paperwhite';

export interface VgaColor {
  index: number;
  name: string;
  hex: string;
  rgb: [number, number, number];
  planeMask: number; // Suggested VGA Sequencer Map Mask
}

export type ScalingMode = 'fit' | 'fill' | 'stretch';

export interface ImageProcessingOptions {
  algorithm: DitherAlgorithm;
  threshold: number; // 0 to 255 (default ~128)
  brightness: number; // -100 to 100 (default 0)
  contrast: number; // -100 to 100 (default 0)
  gamma: number; // 0.2 to 3.0 (default 1.0)
  invert: boolean;
  scaling: ScalingMode;
}

export interface BsaveHeaderInfo {
  magicByte: number; // 0xFD = 253
  segment: number; // 0xA000 (40960)
  offset: number; // 0x0000 (0)
  length: number; // 38400 (0x9600)
  headerBytes: Uint8Array;
  totalSizeBytes: number; // 38407
}

export interface ConversionResult {
  width: number;
  height: number;
  pixelData: Uint8Array; // 640 * 480 = 307,200 bits (values 0 or 1)
  bsaveBinary: Uint8Array; // 7 + 38,400 = 38,407 bytes
  whitePixels: number;
  blackPixels: number;
  whitePercent: number;
  processingTimeMs: number;
}
