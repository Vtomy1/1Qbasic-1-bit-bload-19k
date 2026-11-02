import JSZip from 'jszip';
import { BatchItem, ConversionResult, ImageProcessingOptions } from '../types';
import { convertTo1Bit, renderImageToCanvas } from './dithering';
import { CODE_SAMPLES } from './codeSamples';

/**
 * Sanitizes any filename into DOS 8.3 standard (uppercase, max 8 chars, .BSV extension),
 * preventing collisions with existing filenames.
 */
export function sanitizeDosFilename(filename: string, existingNames: Set<string>): string {
  // Strip extension
  const base = filename.replace(/\.[^/.]+$/, '');
  // Keep only alphanumeric characters and underscores
  let clean = base.toUpperCase().replace(/[^A-Z0-9_]/g, '');
  if (!clean || clean.length === 0) {
    clean = 'IMAGE';
  }
  clean = clean.substring(0, 8);

  let candidate = `${clean}.BSV`;
  let counter = 1;
  while (existingNames.has(candidate)) {
    const suffix = counter.toString();
    const prefix = clean.substring(0, Math.max(1, 8 - suffix.length));
    candidate = `${prefix}${suffix}.BSV`;
    counter++;
  }

  existingNames.add(candidate);
  return candidate;
}

/**
 * Loads an image file, renders to 640x480 canvas, and runs the 1-bit dithering algorithm
 */
export async function processBatchImageFile(
  file: File,
  options: ImageProcessingOptions
): Promise<{
  originalWidth: number;
  originalHeight: number;
  result: ConversionResult;
  thumbnailUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Failed to decode image ${file.name}`));
      img.onload = () => {
        try {
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;

          // Render to 640x480 according to scaling mode
          const imageData = renderImageToCanvas(img, options.scaling);
          const result = convertTo1Bit(imageData, options);

          // Generate thumbnail canvas for UI preview (160x120)
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = 160;
          thumbCanvas.height = 120;
          const tCtx = thumbCanvas.getContext('2d')!;
          const tImgData = tCtx.createImageData(160, 120);

          // Downsample the 640x480 binary pixels to 160x120
          for (let ty = 0; ty < 120; ty++) {
            const sy = ty * 4;
            for (let tx = 0; tx < 160; tx++) {
              const sx = tx * 4;
              const isSet = result.pixelData[sy * 640 + sx] === 1;
              const ptr = (ty * 160 + tx) * 4;
              const lum = isSet ? 240 : 15;
              tImgData.data[ptr] = lum;
              tImgData.data[ptr + 1] = lum;
              tImgData.data[ptr + 2] = lum;
              tImgData.data[ptr + 3] = 255;
            }
          }
          tCtx.putImageData(tImgData, 0, 0);
          const thumbnailUrl = thumbCanvas.toDataURL('image/png');

          resolve({
            originalWidth,
            originalHeight,
            result,
            thumbnailUrl,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a QBasic slideshow BAS program that cycles through all converted images in the batch
 */
export function generateBatchSlideshowBas(items: BatchItem[]): string {
  const readyItems = items.filter((i) => i.status === 'ready' && i.result);
  const dataLines = readyItems.map((i) => `DATA "${i.bsvFilename}"`).join('\n');

  return `' =========================================================================
' QUICKBASIC BATCH BSAVE SLIDESHOW PLAYER (LOADALL.BAS)
' Cycles through all ${readyItems.length} converted 1-bit 640x480 BSAVE images in this folder.
' Target: Microsoft QuickBASIC 4.5 / 7.1 / QBasic 1.1 / QB64 / DOSBox
' Controls: [SPACE] or [RIGHT] = Next, [ESC] = Exit
' =========================================================================

DEFINT A-Z
SCREEN 11                   ' 640x480 Monochrome (2 colors)
CLS

CONST NUM.IMAGES = ${readyItems.length}
DIM FileNames$(NUM.IMAGES - 1)

' Read image list into memory
FOR i = 0 TO NUM.IMAGES - 1
  READ FileNames$(i)
NEXT i

CurrentIndex = 0

MainLoop:
  ' Point CPU segment to VGA Video Memory
  DEF SEG = &HA000

  ' Load active BSAVE image file directly into video RAM
  CurrentFile$ = FileNames$(CurrentIndex)
  ON ERROR GOTO FileError
  BLOAD CurrentFile$, 0
  DEF SEG
  GOTO WaitForInput

FileError:
  DEF SEG
  CLS
  PRINT "Error loading: "; CurrentFile$
  PRINT "Make sure all .BSV files are in current working directory."
  RESUME WaitForInput

WaitForInput:
  ' Overlay subtle status text at bottom
  LOCATE 30, 2
  PRINT "[SPACE] Next Image  |  [ESC] Exit  |  ("; CurrentIndex + 1; "/"; NUM.IMAGES; ") "; CurrentFile$;

  ' Flush keyboard buffer
  DO: K$ = INKEY$: LOOP UNTIL K$ = ""

  ' Wait for keypress
  KeyWait:
    K$ = INKEY$
    IF K$ = "" THEN GOTO KeyWait

    IF K$ = CHR$(27) THEN GOTO ExitProgram     ' ESC key
    IF K$ = " " OR K$ = CHR$(13) OR K$ = CHR$(0) + CHR$(77) THEN
      ' Next image (Space, Enter, or Right Arrow)
      CurrentIndex = (CurrentIndex + 1) MOD NUM.IMAGES
      GOTO MainLoop
    END IF
    IF K$ = CHR$(0) + CHR$(75) THEN
      ' Previous image (Left Arrow)
      CurrentIndex = CurrentIndex - 1
      IF CurrentIndex < 0 THEN CurrentIndex = NUM.IMAGES - 1
      GOTO MainLoop
    END IF

    GOTO KeyWait

ExitProgram:
  DEF SEG
  SCREEN 0: WIDTH 80: CLS
  PRINT "Slideshow finished. Thank you for using QBasic BSAVE Studio."
  END

' =========================================================================
' IMAGE FILENAME DATA TABLE
' =========================================================================
${dataLines}
`;
}

/**
 * Creates the README.TXT file included in the ZIP archive
 */
function generateReadmeTxt(items: BatchItem[], algorithm: string): string {
  const readyItems = items.filter((i) => i.status === 'ready' && i.result);

  return `===============================================================================
QBASIC 1-BIT 640x480 BSAVE BATCH ARCHIVE
Generated by QBasic 1-Bit 640x480 BSAVE Studio
Algorithm: ${algorithm}
Date: ${new Date().toUTCString()}
===============================================================================

This archive contains ${readyItems.length} binary BSAVE files ready for Microsoft QuickBASIC 4.5,
QuickBASIC Extended (QBasic 1.1), QB64, or DOSBox.

FILE SPECIFICATIONS:
-------------------------------------------------------------------------------
- Resolution:       640 x 480 pixels
- Color Depth:      1-bit monochrome (Attribute 0: Black, Attribute 1: White)
- Video Memory:     VGA Mode 11h & 12h Segment &HA000
- Payload Length:   38,400 bytes (80 bytes per scanline * 480 scanlines)
- BSAVE Header:     7 bytes (&HFD, Segment &HA000, Offset &H0000, Length 38400)
- Total File Size:  38,407 bytes per .BSV file

INCLUDED FILES:
-------------------------------------------------------------------------------
${readyItems.map((i, idx) => `${(idx + 1).toString().padStart(2, ' ')}. ${i.bsvFilename.padEnd(14, ' ')} (${i.originalWidth}x${i.originalHeight}) - ${i.name}`).join('\n')}

- LOADALL.BAS       Automated QBasic slideshow player to cycle all images
- LOAD11.BAS        Single-image high speed SCREEN 11 (Monochrome) loader
- LOAD12.BAS        Single-image SCREEN 12 (16-color) bitplane loader

HOW TO RUN IN DOSBOX:
-------------------------------------------------------------------------------
1. Extract all files from this ZIP archive into a DOS folder (e.g. C:\\DOS\\IMAGES).
2. Start DOSBox and mount the directory:
     Z:\\> MOUNT C C:\\DOS\\IMAGES
     Z:\\> C:
3. Run the interactive slideshow player:
     C:\\> QBASIC /RUN LOADALL.BAS
4. Press [SPACE] to advance to the next picture, or [ESC] to exit!

===============================================================================
`;
}

/**
 * Generates the complete ZIP archive containing all .BSV files, BAS loaders, and documentation
 */
export async function createBatchZipArchive(
  items: BatchItem[],
  options: {
    algorithm: string;
    includeBasSlideshow?: boolean;
    includeStandardLoaders?: boolean;
  }
): Promise<Blob> {
  const zip = new JSZip();
  const readyItems = items.filter((i) => i.status === 'ready' && i.result);

  if (readyItems.length === 0) {
    throw new Error('No converted images available to package into ZIP.');
  }

  // 1. Add each 38,407-byte BSV file
  readyItems.forEach((item) => {
    if (item.result) {
      zip.file(item.bsvFilename, item.result.bsaveBinary);
    }
  });

  // 2. Add automated Slideshow player LOADALL.BAS
  if (options.includeBasSlideshow !== false) {
    const slideshowBas = generateBatchSlideshowBas(readyItems);
    zip.file('LOADALL.BAS', slideshowBas);
  }

  // 3. Add standard loaders
  if (options.includeStandardLoaders !== false) {
    const load11 = CODE_SAMPLES.find((s) => s.id === 'load11');
    const load12 = CODE_SAMPLES.find((s) => s.id === 'load12');
    if (load11) zip.file('LOAD11.BAS', load11.code);
    if (load12) zip.file('LOAD12.BAS', load12.code);
  }

  // 4. Add comprehensive README.TXT
  const readme = generateReadmeTxt(readyItems, options.algorithm);
  zip.file('README.TXT', readme);

  // Generate binary zip blob
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
