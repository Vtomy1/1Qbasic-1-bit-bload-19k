import { VGA_16_COLORS } from './vgaColors';
import { VgaColor } from '../types';
export interface PaletteExportConfig {
  fgIndex: number;
  bgIndex: number;
  fgCustomRgb?: [number, number, number];
  bgCustomRgb?: [number, number, number];
  bsvFileName?: string;
  syntaxMode?: 'dac_ports' | 'palette_statement' | 'both';
}

export interface ColorDetail {
  index: number;
  name: string;
  hex: string;
  rgb8: [number, number, number];
  dac6: [number, number, number];
  longColor: number;
  hexColorLong: string;
  planeMask: number;
}

/**
 * Converts 8-bit RGB (0..255) to 6-bit VGA DAC values (0..63)
 */
export function rgb8ToDac6(rgb: [number, number, number]): [number, number, number] {
  return [
    Math.min(63, Math.max(0, Math.round((rgb[0] * 63) / 255))),
    Math.min(63, Math.max(0, Math.round((rgb[1] * 63) / 255))),
    Math.min(63, Math.max(0, Math.round((rgb[2] * 63) / 255))),
  ];
}

/**
 * Calculates QBasic PALETTE color& value:
 * color& = Red6 + (Green6 * 256) + (Blue6 * 65536)
 */
export function dac6ToQBasicLong(dac: [number, number, number]): number {
  return dac[0] + dac[1] * 256 + dac[2] * 65536;
}

export function getColorDetail(
  index: number,
  customRgb?: [number, number, number]
): ColorDetail {
  const baseColor = VGA_16_COLORS[index] || VGA_16_COLORS[0];
  const rgb8 = customRgb || baseColor.rgb;
  const dac6 = rgb8ToDac6(rgb8);
  const longColor = dac6ToQBasicLong(dac6);
  const hex = `#${rgb8.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  const hexColorLong = `&H${dac6[2].toString(16).padStart(2, '0')}${dac6[1]
    .toString(16)
    .padStart(2, '0')}${dac6[0].toString(16).padStart(2, '0')}`.toUpperCase();

  return {
    index,
    name: baseColor.name,
    hex,
    rgb8,
    dac6,
    longColor,
    hexColorLong,
    planeMask: baseColor.planeMask,
  };
}

/**
 * Generates standalone, tested QBasic source code (.BAS) for setting up the selected palette
 */
export function generatePaletteBasCode(config: PaletteExportConfig): string {
  const {
    fgIndex,
    bgIndex,
    fgCustomRgb,
    bgCustomRgb,
    bsvFileName = 'IMAGE.BSV',
    syntaxMode = 'both',
  } = config;

  const fg = getColorDetail(fgIndex, fgCustomRgb);
  const bg = getColorDetail(bgIndex, bgCustomRgb);

  const planeMaskHex = `&H${fg.planeMask.toString(16).padStart(2, '0').toUpperCase()}`;

  return `' =========================================================================
' QUICKBASIC VGA PALETTE DEFINITION & COLOR SETUP FILE (.BAS)
' Target: Microsoft QuickBASIC 4.5 / 7.1 / QBasic 1.1 / QB64 / DOSBox
' Mode: SCREEN 12 (640x480, 16 Colors, 4 Bitplanes)
'
' Selected 16-Color Palette Pair:
'   - Foreground: Color Index ${fg.index} (${fg.name.split(': ')[1]})
'     RGB (8-bit): [${fg.rgb8.join(', ')}]  -> VGA DAC (6-bit): [${fg.dac6.join(', ')}]
'     PALETTE Long: ${fg.longColor}& (${fg.hexColorLong})
'     VGA Sequencer Map Mask: ${planeMaskHex}
'
'   - Background: Color Index ${bg.index} (${bg.name.split(': ')[1]})
'     RGB (8-bit): [${bg.rgb8.join(', ')}]  -> VGA DAC (6-bit): [${bg.dac6.join(', ')}]
'     PALETTE Long: ${bg.longColor}& (${bg.hexColorLong})
' =========================================================================

DEFINT A-Z

' 1. Set VGA 640x480 16-color graphics mode
SCREEN 12
CLS

PRINT "Applying custom VGA palette definitions..."

' =========================================================================
' METHOD 1: Direct VGA DAC Hardware Ports (&H3C8 / &H3C9)
' The VGA DAC has 256 color registers storing 18-bit RGB (6 bits per channel: 0..63).
' Port &H3C8 specifies the palette index.
' Port &H3C9 receives three successive writes for Red, Green, and Blue.
' =========================================================================

' Set Background Color (Attribute ${bg.index}):
OUT &H3C8, ${bg.index}           ' Palette index for background
OUT &H3C9, ${bg.dac6[0]}           ' Red   (0..63) [8-bit: ${bg.rgb8[0]}]
OUT &H3C9, ${bg.dac6[1]}           ' Green (0..63) [8-bit: ${bg.rgb8[1]}]
OUT &H3C9, ${bg.dac6[2]}           ' Blue  (0..63) [8-bit: ${bg.rgb8[2]}]

' Set Foreground Color (Attribute ${fg.index}):
OUT &H3C8, ${fg.index}          ' Palette index for foreground
OUT &H3C9, ${fg.dac6[0]}          ' Red   (0..63) [8-bit: ${fg.rgb8[0]}]
OUT &H3C9, ${fg.dac6[1]}          ' Green (0..63) [8-bit: ${fg.rgb8[1]}]
OUT &H3C9, ${fg.dac6[2]}          ' Blue  (0..63) [8-bit: ${fg.rgb8[2]}]


' =========================================================================
' METHOD 2: Standard QBasic PALETTE Statement
' Formula: color& = Red6 + (Green6 * 256) + (Blue6 * 65536)
' =========================================================================
' Background (Attribute ${bg.index}):
PALETTE ${bg.index}, ${bg.longColor}&

' Foreground (Attribute ${fg.index}):
PALETTE ${fg.index}, ${fg.longColor}&


' =========================================================================
' METHOD 3: 1-Bit 640x480 BSAVE Image Loader with this Palette
' =========================================================================
' The 1-bit image data is loaded into VGA video memory at segment &HA000.
' Using the VGA Sequencer Map Mask Register (Index 2 of port &H3C4),
' we direct the 1-bit data to the bitplanes corresponding to Color ${fg.index}.

' Step A: Select Sequencer Map Mask register
OUT &H3C4, 2

' Step B: Write plane mask (${planeMaskHex})
' &H0F writes to all 4 bitplanes (Color 15)
' Single plane masks route to specific primary planes
OUT &H3C5, ${planeMaskHex}

' Step C: Load the 38,400-byte 1-bit image file
DEF SEG = &HA000
ON ERROR GOTO FileMissing
BLOAD "${bsvFileName}", 0
DEF SEG
GOTO PaletteDemo

FileMissing:
  ' Fallback demo if .BSV is not yet present on disk
  RESUME FallbackDraw

FallbackDraw:
  CLS
  DEF SEG
  ' Restore default Map Mask so standard BASIC drawing commands work
  OUT &H3C4, 2: OUT &H3C5, &H0F

  ' Draw background border and sample graphic with the custom palette
  LINE (10, 10)-(629, 469), ${fg.index}, B
  LINE (20, 20)-(619, 459), ${fg.index}, B
  FOR r = 30 TO 200 STEP 25
    CIRCLE (320, 240), r, ${fg.index}
  NEXT r

  COLOR ${fg.index}, ${bg.index}
  LOCATE 14, 25: PRINT "VGA PALETTE CONFIGURATION ACTIVE"
  LOCATE 16, 22: PRINT "Foreground: Color ${fg.index} | Background: Color ${bg.index}"
  LOCATE 18, 20: PRINT "Place ${bsvFileName} in directory for BSAVE test"
  GOTO Finish

PaletteDemo:
  ' Restore default Sequencer Map Mask (&H0F)
  OUT &H3C4, 2: OUT &H3C5, &H0F

  ' Overlay a small status footer
  COLOR ${fg.index}, ${bg.index}
  LOCATE 29, 3: PRINT "SCREEN 12 Palette: FG=${fg.index} (DAC ${fg.dac6.join('/')}) | BG=${bg.index} (DAC ${bg.dac6.join('/')}) | Any key to exit";

Finish:
  WHILE INKEY$ = "": WEND
  SCREEN 0: WIDTH 80: CLS
  PRINT "VGA Palette program complete."
  END


' =========================================================================
' REUSABLE SUBROUTINE: SetVgaRgb
' Accepts: Attribute% (0..15), Red8% (0..255), Green8% (0..255), Blue8% (0..255)
' Converts 8-bit RGB to 6-bit VGA DAC registers and updates hardware.
' =========================================================================
SUB SetVgaRgb (attr AS INTEGER, r8 AS INTEGER, g8 AS INTEGER, b8 AS INTEGER)
  ' Convert 0..255 to 0..63
  r6% = (r8% * 63) \ 255
  g6% = (g8% * 63) \ 255
  b6% = (b8% * 63) \ 255

  ' Send to DAC
  OUT &H3C8, attr%
  OUT &H3C9, r6%
  OUT &H3C9, g6%
  OUT &H3C9, b6%
END SUB
`;
}
