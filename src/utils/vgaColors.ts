import { PhosphorType, VgaColor } from '../types';

export const VGA_16_COLORS: VgaColor[] = [
  { index: 0, name: '0: Black', hex: '#000000', rgb: [0, 0, 0], planeMask: 0x00 },
  { index: 1, name: '1: Blue', hex: '#0000aa', rgb: [0, 0, 170], planeMask: 0x01 },
  { index: 2, name: '2: Green', hex: '#00aa00', rgb: [0, 170, 0], planeMask: 0x02 },
  { index: 3, name: '3: Cyan', hex: '#00aaaa', rgb: [0, 170, 170], planeMask: 0x03 },
  { index: 4, name: '4: Red', hex: '#aa0000', rgb: [170, 0, 0], planeMask: 0x04 },
  { index: 5, name: '5: Magenta', hex: '#aa00aa', rgb: [170, 0, 170], planeMask: 0x05 },
  { index: 6, name: '6: Brown', hex: '#aa5500', rgb: [170, 85, 0], planeMask: 0x06 },
  { index: 7, name: '7: Light Gray', hex: '#aaaaaa', rgb: [170, 170, 170], planeMask: 0x07 },
  { index: 8, name: '8: Dark Gray', hex: '#555555', rgb: [85, 85, 85], planeMask: 0x08 },
  { index: 9, name: '9: Bright Blue', hex: '#5555ff', rgb: [85, 85, 255], planeMask: 0x09 },
  { index: 10, name: '10: Bright Green', hex: '#55ff55', rgb: [85, 255, 85], planeMask: 0x0a },
  { index: 11, name: '11: Bright Cyan', hex: '#55ffff', rgb: [85, 255, 255], planeMask: 0x0b },
  { index: 12, name: '12: Bright Red', hex: '#ff5555', rgb: [255, 85, 85], planeMask: 0x0c },
  { index: 13, name: '13: Bright Magenta', hex: '#ff55ff', rgb: [255, 85, 255], planeMask: 0x0d },
  { index: 14, name: '14: Yellow', hex: '#ffff55', rgb: [255, 255, 85], planeMask: 0x0e },
  { index: 15, name: '15: High-Intensity White', hex: '#ffffff', rgb: [255, 255, 255], planeMask: 0x0f },
];

export interface PhosphorProfile {
  name: string;
  bgHex: string;
  fgHex: string;
  bgRgb: [number, number, number];
  fgRgb: [number, number, number];
  glowClass: string;
  description: string;
}

export const PHOSPHOR_PROFILES: Record<PhosphorType, PhosphorProfile> = {
  white: {
    name: 'Paper White (VGA Mono)',
    bgHex: '#080808',
    fgHex: '#f1f5f9',
    bgRgb: [8, 8, 8],
    fgRgb: [241, 245, 249],
    glowClass: '',
    description: 'Standard monochrome VGA high-contrast white on black',
  },
  green: {
    name: 'Green Phosphor (P1)',
    bgHex: '#041206',
    fgHex: '#33ff33',
    bgRgb: [4, 18, 6],
    fgRgb: [51, 255, 51],
    glowClass: 'phosphor-glow-green',
    description: 'Classic IBM 5151 / Apple II P1 phosphor glow',
  },
  amber: {
    name: 'Amber Phosphor (P3)',
    bgHex: '#140800',
    fgHex: '#ffb000',
    bgRgb: [20, 8, 0],
    fgRgb: [255, 176, 0],
    glowClass: 'phosphor-glow-amber',
    description: 'Warm amber monochrome terminal display',
  },
  cyan: {
    name: 'Cyan Phosphor (P4/CGA)',
    bgHex: '#021017',
    fgHex: '#00f0ff',
    bgRgb: [2, 16, 23],
    fgRgb: [0, 240, 255],
    glowClass: '',
    description: 'Vibrant electric cyan monochrome',
  },
  paperwhite: {
    name: 'Inverted (Dark on White)',
    bgHex: '#f8fafc',
    fgHex: '#0f172a',
    bgRgb: [248, 250, 252],
    fgRgb: [15, 23, 42],
    glowClass: '',
    description: 'Desktop publishing print proof view',
  },
};
