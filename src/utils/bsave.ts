import { BsaveHeaderInfo } from '../types';

export const BSAVE_MAGIC = 0xfd; // 253
export const VGA_SCREEN_SEGMENT = 0xa000; // 40960
export const VGA_SCREEN_OFFSET = 0x0000; // 0
export const SCREEN11_12_PLANE_BYTES = 38400; // 640 / 8 * 480 = 80 * 480
export const TOTAL_BSAVE_BYTES = 7 + SCREEN11_12_PLANE_BYTES; // 38407

/**
 * Packs 640x480 binary pixels (0 or 1) into an 80-byte/row * 480-row buffer (38,400 bytes),
 * prepends the 7-byte QuickBASIC BSAVE header, and returns the 38,407-byte Uint8Array.
 */
export function generateBsaveBinary(
  pixels: Uint8Array,
  width: number = 640,
  height: number = 480,
  segment: number = VGA_SCREEN_SEGMENT,
  offset: number = VGA_SCREEN_OFFSET
): Uint8Array {
  const bytesPerRow = Math.ceil(width / 8); // 80 bytes
  const dataLength = bytesPerRow * height; // 38400 bytes
  const totalLength = 7 + dataLength; // 38407 bytes

  const buffer = new Uint8Array(totalLength);

  // 1. BSAVE 7-byte Header
  // Byte 0: Signature 0xFD (253)
  buffer[0] = BSAVE_MAGIC;

  // Bytes 1-2: Segment in little-endian (e.g. 0xA000 -> 0x00, 0xA0)
  buffer[1] = segment & 0xff;
  buffer[2] = (segment >> 8) & 0xff;

  // Bytes 3-4: Offset in little-endian (e.g. 0x0000 -> 0x00, 0x00)
  buffer[3] = offset & 0xff;
  buffer[4] = (offset >> 8) & 0xff;

  // Bytes 5-6: Length of payload in little-endian (e.g. 38400 = 0x9600 -> 0x00, 0x96)
  buffer[5] = dataLength & 0xff;
  buffer[6] = (dataLength >> 8) & 0xff;

  // 2. Data payload: 80 bytes per row, MSB first
  let targetIdx = 7;
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let byteX = 0; byteX < bytesPerRow; byteX++) {
      let byteVal = 0;
      const pixelStartX = byteX * 8;
      for (let bit = 0; bit < 8; bit++) {
        const px = pixelStartX + bit;
        if (px < width) {
          const bitVal = pixels[rowOffset + px] ? 1 : 0;
          if (bitVal === 1) {
            // MSB corresponds to leftmost pixel
            byteVal |= 1 << (7 - bit);
          }
        }
      }
      buffer[targetIdx++] = byteVal;
    }
  }

  return buffer;
}

/**
 * Parses and verifies a BSAVE binary buffer
 */
export function inspectBsaveHeader(buffer: Uint8Array): BsaveHeaderInfo | null {
  if (buffer.length < 7) return null;

  const magicByte = buffer[0];
  const segment = buffer[1] | (buffer[2] << 8);
  const offset = buffer[3] | (buffer[4] << 8);
  const length = buffer[5] | (buffer[6] << 8);

  return {
    magicByte,
    segment,
    offset,
    length,
    headerBytes: buffer.slice(0, 7),
    totalSizeBytes: buffer.length,
  };
}

export interface HexLine {
  address: string;
  bytes: string[];
  ascii: string;
  isHeader: boolean[];
}

/**
 * Formats a slice of a binary buffer for the hex viewer
 */
export function formatHexSlice(
  buffer: Uint8Array,
  startOffset: number,
  lineCount: number = 16,
  bytesPerLine: number = 16
): HexLine[] {
  const lines: HexLine[] = [];
  const endOffset = Math.min(buffer.length, startOffset + lineCount * bytesPerLine);

  for (let i = startOffset; i < endOffset; i += bytesPerLine) {
    const lineBytes: string[] = [];
    const isHeader: boolean[] = [];
    let ascii = '';

    for (let b = 0; b < bytesPerLine; b++) {
      const byteIndex = i + b;
      if (byteIndex < buffer.length) {
        const val = buffer[byteIndex];
        lineBytes.push(val.toString(16).padStart(2, '0').toUpperCase());
        isHeader.push(byteIndex < 7);
        // Printable ASCII
        ascii += val >= 32 && val <= 126 ? String.fromCharCode(val) : '.';
      } else {
        lineBytes.push('  ');
        isHeader.push(false);
        ascii += ' ';
      }
    }

    lines.push({
      address: i.toString(16).padStart(6, '0').toUpperCase(),
      bytes: lineBytes,
      ascii,
      isHeader,
    });
  }

  return lines;
}

/**
 * Trigger browser file download for BSV or BAS files
 */
export function downloadBinaryFile(data: Uint8Array, filename: string): void {
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
