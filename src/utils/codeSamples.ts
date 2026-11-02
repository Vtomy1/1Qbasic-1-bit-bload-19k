export interface CodeSample {
  id: string;
  title: string;
  category: 'loader' | 'saver' | 'advanced';
  screenMode: 'SCREEN 11' | 'SCREEN 12' | 'UNIVERSAL';
  filename: string;
  description: string;
  code: string;
}

export const CODE_SAMPLES: CodeSample[] = [
  {
    id: 'load11',
    title: 'SCREEN 11 Monochrome Image Loader',
    category: 'loader',
    screenMode: 'SCREEN 11',
    filename: 'LOAD11.BAS',
    description:
      'Direct high-speed BLOAD into VGA memory (&HA000:0000) on SCREEN 11 (640x480, 2-color). Includes custom phosphor DAC palette switching (green, amber, white).',
    code: `' =========================================================================
' SCREEN 11 (640x480 2-COLOR MONOCHROME) BSAVE IMAGE LOADER
' Target: Microsoft QuickBASIC 4.5 / 7.1 / QBasic / QB64 / DOSBox
' Image format: 1-bit 640x480 dithered bitmap (38,400 bytes payload)
' =========================================================================

DEFINT A-Z
SCREEN 11                   ' 640x480 resolution, 2 colors (Attributes 0 & 1)
CLS

' 1. Display loading message
LOCATE 1, 1: PRINT "Loading 640x480 1-bit BSAVE image..."

' 2. Point CPU Segment to VGA Video RAM
'    VGA Mode 11h video memory starts at segment &HA000, offset 0.
'    SCREEN 11 is a linear single-bitplane mode (80 bytes per row * 480 rows).
DEF SEG = &HA000

' 3. Fast Hardware BLOAD: Copies the 38,400 raw bitmap bytes in 1 operation
'    The 7-byte BSAVE header specifies segment &HA000, offset 0, length 38400.
BLOAD "IMAGE.BSV", 0

' 4. Restore default BASIC data segment
DEF SEG

' -------------------------------------------------------------------------
' OPTIONAL: Hardware DAC Phosphor Palette Tinting
' VGA DAC registers allow setting any 18-bit RGB color (6 bits per channel: 0..63)
' -------------------------------------------------------------------------
' Uncomment ONE of the blocks below to tint your display:

' --- Green Phosphor (IBM 5151 / Apple II P1) ---
' OUT &H3C8, 1            ' DAC Palette Index 1 (Foreground)
' OUT &H3C9, 12           ' Red   (0..63)
' OUT &H3C9, 63           ' Green (max intensity)
' OUT &H3C9, 12           ' Blue  (0..63)

' --- Amber Phosphor (Warm Amber P3 CRT) ---
' OUT &H3C8, 1            ' DAC Palette Index 1 (Foreground)
' OUT &H3C9, 63           ' Red   (63)
' OUT &H3C9, 42           ' Green (42)
' OUT &H3C9, 0            ' Blue  (0)

' --- Paper White (High-contrast cool white) ---
' OUT &H3C8, 1
' OUT &H3C9, 60: OUT &H3C9, 60: OUT &H3C9, 63

' 5. Wait for keypress before exiting
WHILE INKEY$ = "": WEND
SCREEN 0: WIDTH 80: CLS
PRINT "Image displayed successfully. Exiting."
END
`,
  },

  {
    id: 'save11',
    title: 'SCREEN 11 Monochrome Screen Saver',
    category: 'saver',
    screenMode: 'SCREEN 11',
    filename: 'SAVE11.BAS',
    description:
      'Draws sample test pattern and high-res text on SCREEN 11, then exports the active screen to an exact 38,407-byte BSAVE file with 7-byte header.',
    code: `' =========================================================================
' SCREEN 11 (640x480 MONOCHROME) BSAVE SCREEN SAVER
' Saves active 640x480 screen memory to standard QuickBASIC BSAVE format.
' Total output file size = 7 bytes header + 38,400 bytes data = 38,407 bytes.
' =========================================================================

DEFINT A-Z
SCREEN 11                   ' 640x480 2-color mode
CLS

' 1. Draw a test graphic on screen
LINE (0, 0)-(639, 479), 1, B        ' Outer border
LINE (0, 0)-(639, 479), 1           ' Diagonal 1
LINE (0, 479)-(639, 0), 1           ' Diagonal 2
CIRCLE (320, 240), 180, 1          ' Center circle

' Render some test text
LOCATE 14, 32: PRINT "QBASIC SCREEN 11 BSAVE"
LOCATE 16, 28: PRINT "Resolution: 640x480 x 1-bit"
LOCATE 18, 30: PRINT "Press any key to save..."

WHILE INKEY$ = "": WEND

' 2. Point segment to VGA Graphics Buffer
DEF SEG = &HA000

' 3. BSAVE format parameters:
'    FileName$: Destination file path
'    Offset:    0 (start of video RAM)
'    Length:    38400 (80 bytes per scanline * 480 scanlines)
'
'    BSAVE automatically prepends the 7-byte header:
'    [&HFD, &H00, &HA0, &H00, &H00, &H00, &H96]
'    (FD=Signature, A000=Segment, 0000=Offset, 9600=38400 bytes)
BSAVE "SAVED11.BSV", 0, 38400

' 4. Restore BASIC segment
DEF SEG

LOCATE 20, 26: PRINT "Saved as SAVED11.BSV (38,407 bytes)!"
LOCATE 22, 33: PRINT "Press key to exit."
WHILE INKEY$ = "": WEND

SCREEN 0: WIDTH 80: CLS
END
`,
  },

  {
    id: 'load12',
    title: 'SCREEN 12 (16-Color) 1-Bit Planar Loader',
    category: 'loader',
    screenMode: 'SCREEN 12',
    filename: 'LOAD12.BAS',
    description:
      'Loads a 1-bit 640x480 BSAVE image onto a 16-color VGA display (SCREEN 12). Uses VGA Sequencer Controller Map Mask register (&H3C4/&H3C5) to write to any combination of the 4 bitplanes.',
    code: `' =========================================================================
' SCREEN 12 (640x480 16-COLOR) 1-BIT BSAVE LOADER & PLANAR MAPPER
' Demonstrates loading 1-bit image data into a 4-bitplane 16-color VGA mode.
' Target: QuickBASIC 4.5 / 7.1 / QBasic / QB64 / DOSBox
' =========================================================================

DEFINT A-Z
SCREEN 12                   ' 640x480 resolution, 16 colors (4 planar bitplanes)
CLS

' -------------------------------------------------------------------------
' VGA HARDWARE PLANAR ARCHITECTURE EXPLAINED:
' SCREEN 12 stores 4 bitplanes in parallel at &HA000:
'   Bitplane 0 = Blue component    (Color bit 0)
'   Bitplane 1 = Green component   (Color bit 1)
'   Bitplane 2 = Red component     (Color bit 2)
'   Bitplane 3 = Intensity/Bright  (Color bit 3)
'
' The Sequencer Register at port &H3C4 / &H3C5 controls WHICH planes receive
' CPU write data via the Map Mask Register (Index 2).
' -------------------------------------------------------------------------

' Step 1: Select VGA Sequencer Map Mask Register
OUT &H3C4, 2

' Step 2: Configure write mask:
'   &H0F (Binary 00001111): Write to ALL 4 bitplanes simultaneously!
'        This maps set pixels (1) to Color 15 (High-Intensity Bright White)
'        and clear pixels (0) to Color 0 (Black).
'   &H01: Plane 0 only  -> Color 1 (Blue)
'   &H02: Plane 1 only  -> Color 2 (Green)
'   &H04: Plane 2 only  -> Color 4 (Red)
'   &H0E: Planes 1+2+3  -> Color 14 (Bright Yellow)
'   &H0B: Planes 0+1+3  -> Color 11 (Bright Cyan)

OUT &H3C5, &H0F             ' Enable all 4 planes for crisp white-on-black!

' Step 3: Fast BLOAD into video RAM
DEF SEG = &HA000
BLOAD "IMAGE.BSV", 0
DEF SEG

' Step 4: CRITICAL RESTORATION!
' Restore default VGA write mask (&H0F) so subsequent BASIC drawings work normally
OUT &H3C4, 2
OUT &H3C5, &H0F

' Step 5: Draw a 16-color decorative status banner at the bottom
LINE (0, 460)-(639, 479), 1, BF      ' Dark Blue banner
COLOR 14                             ' Yellow text
LOCATE 30, 4: PRINT "SCREEN 12: 1-Bit Dithered Image in 16-Color VGA Mode | Press any key";

WHILE INKEY$ = "": WEND
SCREEN 0: WIDTH 80: CLS
END
`,
  },

  {
    id: 'save12',
    title: 'SCREEN 12 Bitplane Extractor & Saver',
    category: 'saver',
    screenMode: 'SCREEN 12',
    filename: 'SAVE12.BAS',
    description:
      'Extracts a single bitplane from SCREEN 12 using the VGA Graphics Controller Read Map Select register (&H3CE/&H3CF) and saves it as a 1-bit BSAVE file.',
    code: `' =========================================================================
' SCREEN 12 (16-COLOR) BITPLANE EXTRACTOR & 1-BIT BSAVE SAVER
' Reads a single planar bitplane from VGA memory and saves as 1-bit BSAVE.
' =========================================================================

DEFINT A-Z
SCREEN 12                   ' 640x480 16-color mode
CLS

' 1. Draw multi-color graphic on screen
FOR r = 20 TO 220 STEP 20
  CIRCLE (320, 240), r, (r \ 20) MOD 16
NEXT r
LINE (50, 50)-(590, 430), 15, B
COLOR 15: LOCATE 2, 25: PRINT "SCREEN 12 VGA PLANAR BITPLANE SAVER"
COLOR 11: LOCATE 4, 22: PRINT "Press 0-3 to select plane to save as 1-bit BSAVE:"

' 2. Select which bitplane to read (0 = Blue, 1 = Green, 2 = Red, 3 = Intensity)
PlaneToRead = 0             ' Default: Bitplane 0

' 3. Configure VGA Graphics Controller Read Map Select Register
'    Port &H3CE = Address Register, Index 4 = Read Map Select Register
'    Port &H3CF = Data Register (value 0, 1, 2, or 3)
OUT &H3CE, 4
OUT &H3CF, PlaneToRead

' 4. Save selected 1-bit plane directly from video RAM
DEF SEG = &HA000
BSAVE "PLANE0.BSV", 0, 38400
DEF SEG

' 5. Restore default Read Map (Plane 0)
OUT &H3CE, 4
OUT &H3CF, 0

COLOR 10: LOCATE 28, 20: PRINT "Successfully saved Bitplane 0 as PLANE0.BSV!"
WHILE INKEY$ = "": WEND

SCREEN 0: WIDTH 80: CLS
END
`,
  },

  {
    id: 'arraybuf',
    title: 'Memory Array Buffer Loader (Off-Screen)',
    category: 'advanced',
    screenMode: 'UNIVERSAL',
    filename: 'ARRAYBUF.BAS',
    description:
      'Loads a 38,400-byte BSAVE file into an integer array in conventional RAM using VARSEG and VARPTR, enabling off-screen buffering, masking, or custom blitting.',
    code: `' =========================================================================
' OFF-SCREEN CONVENTIONAL RAM BUFFER LOADER
' Allocates an integer array in RAM and loads BSAVE file without touching VRAM.
' Target: QuickBASIC 4.5 / 7.1 / QB64
' =========================================================================

DEFINT A-Z

' 38,400 bytes = 19,200 16-bit integers (0 to 19199)
CONST BUFFER.SIZE = 19200
DIM SHARED ImgBuffer(BUFFER.SIZE - 1) AS INTEGER

CLS
PRINT "Allocating buffer in conventional memory..."
PRINT "Buffer size: 19,200 integers (38,400 bytes)"

' Point CPU segment to the array segment in RAM
DEF SEG = VARSEG(ImgBuffer(0))

' Load BSAVE image directly into the array offset
BLOAD "IMAGE.BSV", VARPTR(ImgBuffer(0))

' Restore segment
DEF SEG

PRINT "Image successfully loaded into RAM array!"
PRINT "Array memory address: "; HEX$(VARSEG(ImgBuffer(0))); ":"; HEX$(VARPTR(ImgBuffer(0)))
PRINT "First word (16 pixels): &H"; HEX$(ImgBuffer(0))
PRINT ""
PRINT "Press any key to copy buffer into SCREEN 11 video RAM..."
WHILE INKEY$ = "": WEND

' Switch to SCREEN 11 and blit buffer byte-by-byte into Video RAM
SCREEN 11: CLS
DEF SEG = &HA000            ' Destination: Screen video RAM
SrcSeg = VARSEG(ImgBuffer(0))
SrcOff = VARPTR(ImgBuffer(0))

FOR i% = 0 TO 38399
  DEF SEG = SrcSeg
  B% = PEEK(SrcOff + i%)
  DEF SEG = &HA000
  POKE i%, B%
NEXT i%

DEF SEG
WHILE INKEY$ = "": WEND
SCREEN 0: WIDTH 80: CLS
END
`,
  },

  {
    id: 'header_parser',
    title: 'BSAVE 7-Byte Binary Header Parser & Validator',
    category: 'advanced',
    screenMode: 'UNIVERSAL',
    filename: 'PARS_BSV.BAS',
    description:
      'Pure QBasic code that opens any .BSV file, reads and validates the 7-byte header (signature, segment, offset, payload length), and prints detailed structural telemetry.',
    code: `' =========================================================================
' BSAVE 7-BYTE HEADER PARSER & VALIDATOR
' Reads and verifies the internal structure of any QuickBASIC BSAVE binary file.
' =========================================================================

DEFINT A-Z
CLS
FileName$ = "IMAGE.BSV"

OPEN FileName$ FOR BINARY AS #1
IF LOF(1) = 0 THEN
  PRINT "Error: File not found or empty!": CLOSE #1: END
END IF

PRINT "================================================================="
PRINT "  QUICKBASIC BSAVE FILE HEADER INSPECTOR: "; FileName$
PRINT "================================================================="
PRINT "Total File Size on Disk: "; LOF(1); " bytes"
PRINT ""

' Read 7-byte BSAVE header
DIM Hdr(6) AS STRING * 1
FOR i = 0 TO 6
  GET #1, , Hdr(i)
NEXT i

MagicByte = ASC(Hdr(0))
Segm = ASC(Hdr(1)) + ASC(Hdr(2)) * 256
Offs = ASC(Hdr(3)) + ASC(Hdr(4)) * 256
Length& = ASC(Hdr(5)) + ASC(Hdr(6)) * 256&

PRINT "Byte 0 (Signature):   &H"; HEX$(MagicByte); " (Decimal "; MagicByte; ")"
IF MagicByte = &HFD THEN
  PRINT "  -> VALID: QuickBASIC BSAVE magic byte confirmed (&HFD / 253)"
ELSE
  PRINT "  -> WARNING: Invalid signature! Expected &HFD (253)"
END IF

PRINT "Bytes 1-2 (Segment):  &H"; HEX$(Segm); " (Decimal "; Segm; ")"
IF Segm = &HA000 THEN
  PRINT "  -> VALID: Target segment matches VGA Video Memory (&HA000)"
END IF

PRINT "Bytes 3-4 (Offset):   &H"; HEX$(Offs); " (Decimal "; Offs; ")"
PRINT "Bytes 5-6 (Length):   "; Length&; " bytes (&H"; HEX$(Length&); ")"

ExpectedBytes& = 640& \ 8 * 480
IF Length& = ExpectedBytes& THEN
  PRINT "  -> MATCH: Exact 1-bit 640x480 plane size (80 * 480 = 38,400 bytes)"
END IF

ExpectedTotal& = 7 + Length&
IF LOF(1) = ExpectedTotal& THEN
  PRINT "  -> INTEGRITY PASS: File length on disk matches header payload!"
ELSE
  PRINT "  -> WARNING: File length discrepancy! Disk="; LOF(1); " vs Hdr="; ExpectedTotal&
END IF

PRINT "================================================================="
CLOSE #1
END
`,
  },
];
