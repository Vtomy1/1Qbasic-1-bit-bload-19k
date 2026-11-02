import React, { useState } from 'react';
import { ConversionResult } from '../types';
import { formatHexSlice, downloadBinaryFile, TOTAL_BSAVE_BYTES } from '../utils/bsave';
import { Binary, CheckCircle2, Download, Search, Info } from 'lucide-react';

interface BsaveInspectorProps {
  conversionResult: ConversionResult | null;
}

export const BsaveInspector: React.FC<BsaveInspectorProps> = ({ conversionResult }) => {
  const [currentOffset, setCurrentOffset] = useState<number>(0);

  if (!conversionResult) {
    return (
      <div className="p-8 text-center bg-neutral-900/50 rounded-lg border border-neutral-800">
        <p className="text-sm text-neutral-400">Convert an image to inspect its BSAVE binary structure.</p>
      </div>
    );
  }

  const binary = conversionResult.bsaveBinary;
  const hexLines = formatHexSlice(binary, currentOffset, 14);

  // Jump presets
  const jumpOffsets = [
    { label: 'Header (0x0000)', offset: 0 },
    { label: 'Row 0 (0x0007)', offset: 7 },
    { label: 'Row 1 (0x0057)', offset: 7 + 80 },
    { label: 'Center (0x4B07)', offset: 7 + 80 * 240 },
    { label: 'EOF Tail (0x95B0)', offset: Math.max(0, TOTAL_BSAVE_BYTES - 16 * 6) },
  ];

  // Dissect first data byte (Byte 7)
  const firstDataByte = binary.length > 7 ? binary[7] : 0;
  const bitArray = [7, 6, 5, 4, 3, 2, 1, 0].map((bit) => ({
    bit,
    val: (firstDataByte >> bit) & 1,
    weight: Math.pow(2, bit),
  }));

  return (
    <div className="space-y-6">
      {/* 7-Byte Header Architecture Diagram */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-neutral-100">
              QuickBASIC 7-Byte BSAVE Binary Header Specification
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Exact binary layout prepended to video RAM data for compatibility with{' '}
              <code className="text-amber-400 font-mono">BLOAD "FILE.BSV", 0</code>.
            </p>
          </div>
          <button
            onClick={() => downloadBinaryFile(binary, 'IMAGE.BSV')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download IMAGE.BSV</span>
          </button>
        </div>

        {/* 7-Byte Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Byte 0: Magic Signature */}
          <div className="p-3 rounded bg-neutral-950 border border-amber-500/40">
            <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
              <span className="font-semibold">Byte 0: Signature</span>
              <span className="font-mono font-bold">&amp;HFD</span>
            </div>
            <div className="font-mono text-xl font-bold text-neutral-100">
              FD <span className="text-xs text-neutral-500 font-normal">(253)</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-snug">
              BSAVE signature marker byte (253). Confirms valid binary image.
            </p>
          </div>

          {/* Bytes 1-2: Segment Address */}
          <div className="p-3 rounded bg-neutral-950 border border-blue-500/40">
            <div className="flex items-center justify-between text-xs text-blue-400 mb-1">
              <span className="font-semibold">Bytes 1-2: Segment</span>
              <span className="font-mono font-bold">&amp;HA000</span>
            </div>
            <div className="font-mono text-xl font-bold text-neutral-100">
              00 A0 <span className="text-xs text-neutral-500 font-normal">(Little-Endian)</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-snug">
              Target segment address. 40,960 points to VGA video memory.
            </p>
          </div>

          {/* Bytes 3-4: Offset Address */}
          <div className="p-3 rounded bg-neutral-950 border border-emerald-500/40">
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
              <span className="font-semibold">Bytes 3-4: Offset</span>
              <span className="font-mono font-bold">&amp;H0000</span>
            </div>
            <div className="font-mono text-xl font-bold text-neutral-100">
              00 00 <span className="text-xs text-neutral-500 font-normal">(Offset 0)</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-snug">
              Start offset inside segment. 0 corresponds to top-left pixel (0,0).
            </p>
          </div>

          {/* Bytes 5-6: Data Payload Length */}
          <div className="p-3 rounded bg-neutral-950 border border-purple-500/40">
            <div className="flex items-center justify-between text-xs text-purple-400 mb-1">
              <span className="font-semibold">Bytes 5-6: Length</span>
              <span className="font-mono font-bold">38,400 B</span>
            </div>
            <div className="font-mono text-xl font-bold text-neutral-100">
              00 96 <span className="text-xs text-neutral-500 font-normal">(&amp;H9600)</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5 leading-snug">
              640/8 = 80 bytes/row × 480 rows = 38,400 payload bytes.
            </p>
          </div>
        </div>

        {/* Byte math summary */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Header (7 bytes) + 1-Bit Plane (38,400 bytes) ={' '}
              <strong className="text-neutral-200">38,407 Total File Bytes</strong>
            </span>
          </div>
          <span className="font-mono text-amber-400/90">
            MSB First: Bit 7 = Leftmost Pixel, Bit 0 = Rightmost Pixel
          </span>
        </div>
      </div>

      {/* Bit Dissection of Scanline 0, Byte 0 */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <h4 className="text-sm font-semibold text-neutral-200 mb-1">
          Scanline Bit Dissection: Row 0, First 8 Pixels (Byte 7)
        </h4>
        <p className="text-xs text-neutral-400 mb-3">
          How binary byte <code className="text-amber-400 font-mono">0x{firstDataByte.toString(16).toUpperCase().padStart(2, '0')}</code> maps into physical pixels:
        </p>

        <div className="grid grid-cols-8 gap-1.5 max-w-xl">
          {bitArray.map((b) => (
            <div
              key={b.bit}
              className={`p-2 rounded text-center border font-mono transition-colors ${
                b.val === 1
                  ? 'bg-amber-400/20 border-amber-500/60 text-amber-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-500'
              }`}
            >
              <div className="text-[10px] text-neutral-400">Bit {b.bit}</div>
              <div className="text-lg font-bold my-0.5">{b.val}</div>
              <div className="text-[10px] text-neutral-500">{b.val ? 'WHITE' : 'BLACK'}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-neutral-500 mt-2">
          Pixel column (0 to 7) maps left-to-right. Bit 7 is drawn at X=0, Bit 6 at X=1, down to Bit 0 at X=7.
        </p>
      </div>

      {/* Live Hex Viewer */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-neutral-200">
              Binary Hex Dump (38,407 Bytes)
            </h4>
          </div>

          {/* Jump to Offsets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-neutral-400 mr-1">Jump to:</span>
            {jumpOffsets.map((j) => (
              <button
                key={j.label}
                onClick={() => setCurrentOffset(j.offset)}
                className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                  currentOffset === j.offset
                    ? 'bg-amber-400 text-neutral-950 border-amber-400 font-semibold'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                {j.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hex Grid Table */}
        <div className="font-mono text-xs bg-neutral-950 border border-neutral-850 rounded-lg p-3.5 overflow-x-auto">
          <div className="text-neutral-500 pb-2 mb-2 border-b border-neutral-850 grid grid-cols-[80px_1fr_120px] gap-4">
            <div>OFFSET</div>
            <div className="tracking-wider">
              00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F
            </div>
            <div>ASCII</div>
          </div>

          <div className="space-y-1">
            {hexLines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[80px_1fr_120px] gap-4 py-0.5 hover:bg-neutral-900/60 transition-colors"
              >
                <div className="text-neutral-500 select-none">{line.address}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {line.bytes.map((byteStr, bIdx) => {
                    const isHeaderByte = line.isHeader[bIdx];
                    return (
                      <span
                        key={bIdx}
                        className={`inline-block ${
                          isHeaderByte
                            ? 'text-amber-400 font-bold bg-amber-500/10 px-0.5 rounded'
                            : byteStr === '00'
                            ? 'text-neutral-600'
                            : 'text-neutral-200'
                        } ${bIdx === 7 ? 'mr-2' : ''}`}
                      >
                        {byteStr}
                      </span>
                    );
                  })}
                </div>
                <div className="text-neutral-400 font-mono tracking-widest">{line.ascii}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Offset Paging Controls */}
        <div className="flex items-center justify-between mt-3 text-xs text-neutral-400">
          <div>
            Viewing bytes <span className="font-mono tabular-nums text-neutral-200">{currentOffset}</span> to{' '}
            <span className="font-mono tabular-nums text-neutral-200">
              {Math.min(TOTAL_BSAVE_BYTES, currentOffset + 14 * 16)}
            </span>{' '}
            of <span className="font-mono tabular-nums text-neutral-200">{TOTAL_BSAVE_BYTES}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentOffset <= 0}
              onClick={() => setCurrentOffset(Math.max(0, currentOffset - 14 * 16))}
              className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 disabled:opacity-40 text-neutral-300 hover:text-white"
            >
              Previous
            </button>
            <button
              disabled={currentOffset + 14 * 16 >= TOTAL_BSAVE_BYTES}
              onClick={() =>
                setCurrentOffset(Math.min(TOTAL_BSAVE_BYTES - 16, currentOffset + 14 * 16))
              }
              className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 disabled:opacity-40 text-neutral-300 hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
