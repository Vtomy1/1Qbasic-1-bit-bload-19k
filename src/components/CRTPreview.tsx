import React, { useRef, useEffect, useState } from 'react';
import { ConversionResult, DisplayMode, PhosphorType, ComparisonConfig } from '../types';
import { PHOSPHOR_PROFILES, VGA_16_COLORS } from '../utils/vgaColors';
import { Monitor, Eye, Download, Maximize2, Sparkles, Columns2 } from 'lucide-react';

interface CRTPreviewProps {
  conversionResult: ConversionResult | null;
  comparisonResult?: ConversionResult | null;
  comparison?: ComparisonConfig;
  onSplitPositionChange?: (pos: number) => void;
  algoAName?: string;
  algoBName?: string;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  phosphorType: PhosphorType;
  onPhosphorTypeChange: (type: PhosphorType) => void;
  screen12FgColor: number;
  onScreen12FgColorChange: (index: number) => void;
  screen12BgColor: number;
  onScreen12BgColorChange: (index: number) => void;
  onOpenPaletteExport?: () => void;
}

export const CRTPreview: React.FC<CRTPreviewProps> = ({
  conversionResult,
  comparisonResult,
  comparison,
  onSplitPositionChange,
  algoAName = 'Side A',
  algoBName = 'Side B',
  displayMode,
  onDisplayModeChange,
  phosphorType,
  onPhosphorTypeChange,
  screen12FgColor,
  onScreen12FgColorChange,
  screen12BgColor,
  onScreen12BgColorChange,
  onOpenPaletteExport,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enableScanlines, setEnableScanlines] = useState(true);
  const [enableCurvature, setEnableCurvature] = useState(true);
  const [enableGlow, setEnableGlow] = useState(true);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Render to canvas whenever conversionResult, comparisonResult, or color selections change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !conversionResult) return;

    const ctx = canvas.getContext('2d')!;
    const { width, height, pixelData } = conversionResult;

    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    let fgRgb: [number, number, number];
    let bgRgb: [number, number, number];

    if (displayMode === 'screen11') {
      const profile = PHOSPHOR_PROFILES[phosphorType];
      fgRgb = profile.fgRgb;
      bgRgb = profile.bgRgb;
    } else {
      const fgColor = VGA_16_COLORS[screen12FgColor] || VGA_16_COLORS[15];
      const bgColor = VGA_16_COLORS[screen12BgColor] || VGA_16_COLORS[0];
      fgRgb = fgColor.rgb;
      bgRgb = bgColor.rgb;
    }

    const isComparing = Boolean(comparison?.enabled && comparisonResult);
    const splitX = isComparing
      ? Math.round(((comparison?.splitPosition ?? 50) / 100) * width)
      : width;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        const idx = rowOffset + x;
        const ptr = idx * 4;

        if (isComparing && (x === splitX || x === splitX - 1)) {
          // Subtle amber divider line between comparisons
          data[ptr] = 251;
          data[ptr + 1] = 191;
          data[ptr + 2] = 36;
          data[ptr + 3] = 255;
        } else {
          const isPixelSet =
            isComparing && x >= splitX
              ? comparisonResult!.pixelData[idx] === 1
              : pixelData[idx] === 1;

          const rgb = isPixelSet ? fgRgb : bgRgb;
          data[ptr] = rgb[0];
          data[ptr + 1] = rgb[1];
          data[ptr + 2] = rgb[2];
          data[ptr + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [
    conversionResult,
    comparisonResult,
    comparison,
    displayMode,
    phosphorType,
    screen12FgColor,
    screen12BgColor,
  ]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!comparison?.enabled || !onSplitPositionChange) return;
    setIsDraggingSplit(true);
    updateSplit(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingSplit && onSplitPositionChange) {
      updateSplit(e);
    }
  };

  const handlePointerUp = () => {
    setIsDraggingSplit(false);
  };

  const updateSplit = (e: React.PointerEvent) => {
    if (!canvasRef.current || !onSplitPositionChange) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const pct = Math.max(10, Math.min(90, Math.round((relativeX / rect.width) * 100)));
    onSplitPositionChange(pct);
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qbasic_${displayMode}_640x480.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const currentPhosphor = PHOSPHOR_PROFILES[phosphorType];
  const currentVgaFg = VGA_16_COLORS[screen12FgColor] || VGA_16_COLORS[15];
  const currentVgaBg = VGA_16_COLORS[screen12BgColor] || VGA_16_COLORS[0];

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Display Mode & Palette Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
        {/* Screen Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded border border-neutral-800">
          <button
            onClick={() => onDisplayModeChange('screen11')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              displayMode === 'screen11'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            SCREEN 11 (Monochrome)
          </button>
          <button
            onClick={() => onDisplayModeChange('screen12')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              displayMode === 'screen12'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            SCREEN 12 (16-Color VGA)
          </button>
        </div>

        {/* Mode-Specific Color Configuration */}
        {displayMode === 'screen11' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Phosphor:</span>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'white', label: 'White' },
                  { id: 'green', label: 'Green P1' },
                  { id: 'amber', label: 'Amber P3' },
                  { id: 'cyan', label: 'Cyan' },
                  { id: 'paperwhite', label: 'Invert' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPhosphorTypeChange(p.id)}
                  className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                    phosphorType === p.id
                      ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                      : 'border-neutral-800 text-neutral-400 hover:text-neutral-200 bg-neutral-950'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {/* FG Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400">FG:</span>
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: currentVgaFg.hex }}
              />
              <select
                value={screen12FgColor}
                onChange={(e) => onScreen12FgColorChange(parseInt(e.target.value))}
                className="text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                {VGA_16_COLORS.map((c) => (
                  <option key={c.index} value={c.index}>
                    {c.index}: {c.name.split(': ')[1]}
                  </option>
                ))}
              </select>
            </div>

            {/* BG Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400">BG:</span>
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: currentVgaBg.hex }}
              />
              <select
                value={screen12BgColor}
                onChange={(e) => onScreen12BgColorChange(parseInt(e.target.value))}
                className="text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                {VGA_16_COLORS.map((c) => (
                  <option key={c.index} value={c.index}>
                    {c.index}: {c.name.split(': ')[1]}
                  </option>
                ))}
              </select>
            </div>

            {/* Palette Export CTA Button */}
            {onOpenPaletteExport && (
              <button
                onClick={onOpenPaletteExport}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-amber-400/20 text-amber-300 border border-amber-500/40 hover:bg-amber-400/30 transition-colors"
                title="Generate QBasic PALETTE.BAS code for this color pair"
              >
                <span>Export Palette (.BAS)</span>
              </button>
            )}
          </div>
        )}

        {/* Display Toggles */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <button
            onClick={() => setEnableScanlines(!enableScanlines)}
            className={`px-2 py-1 rounded border transition-colors ${
              enableScanlines
                ? 'border-neutral-700 bg-neutral-800 text-neutral-200'
                : 'border-neutral-800 bg-neutral-950 text-neutral-500'
            }`}
          >
            Scanlines {enableScanlines ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setEnableCurvature(!enableCurvature)}
            className={`px-2 py-1 rounded border transition-colors ${
              enableCurvature
                ? 'border-neutral-700 bg-neutral-800 text-neutral-200'
                : 'border-neutral-800 bg-neutral-950 text-neutral-500'
            }`}
          >
            CRT Bezel
          </button>
          <button
            onClick={handleDownloadPng}
            className="p-1 text-neutral-400 hover:text-amber-400 transition-colors"
            title="Download PNG Preview"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main CRT Monitor Viewport */}
      <div className="relative flex-1 min-h-[460px] bg-neutral-950 rounded-lg border border-neutral-800 p-4 flex items-center justify-center overflow-hidden">
        {/* CRT Exterior Bezel Casing */}
        <div
          className={`relative max-w-full rounded-2xl p-3 sm:p-5 transition-all ${
            enableCurvature
              ? 'bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 border-4 border-neutral-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
              : 'border border-neutral-800 bg-black'
          }`}
        >
          {/* Inner Screen Bezel */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`relative rounded-lg overflow-hidden border-2 border-neutral-950/80 bg-black select-none ${
              comparison?.enabled ? 'cursor-col-resize' : ''
            }`}
          >
            {/* The Canvas */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className={`block max-w-full max-h-[58vh] object-contain ${
                enableGlow && displayMode === 'screen11' ? currentPhosphor.glowClass : ''
              }`}
              style={{
                imageRendering: 'pixelated',
              }}
            />

            {/* CRT Scanline Overlay */}
            {enableScanlines && (
              <div className="pointer-events-none absolute inset-0 crt-scanlines z-10" />
            )}

            {/* CRT Screen Glass Curvature Vignette */}
            {enableCurvature && (
              <div className="pointer-events-none absolute inset-0 crt-vignette z-20" />
            )}

            {/* Retro OSD Tag (Screen mode indicator) */}
            <div className="pointer-events-none absolute top-3 left-3 z-30 font-mono text-[10px] text-amber-400/90 bg-neutral-950/85 border border-amber-500/30 px-2 py-0.5 rounded shadow flex items-center gap-1.5">
              <span>{displayMode === 'screen11' ? 'MODE 11h' : `MODE 12h`}</span>
              {comparison?.enabled && (
                <>
                  <span>·</span>
                  <span className="text-amber-300 font-bold">A: {algoAName}</span>
                </>
              )}
            </div>

            {/* Comparison Right OSD Tag */}
            {comparison?.enabled && (
              <div className="pointer-events-none absolute top-3 right-3 z-30 font-mono text-[10px] text-blue-300 bg-neutral-950/85 border border-blue-500/30 px-2 py-0.5 rounded shadow">
                B: {algoBName}
              </div>
            )}

            {/* Draggable Divider Grip on Screen */}
            {comparison?.enabled && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-30 flex items-center justify-center"
                style={{ left: `${comparison.splitPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="px-1.5 py-1 rounded bg-amber-400 text-neutral-950 font-mono font-bold text-[9px] shadow-lg flex items-center gap-0.5 opacity-90">
                  <span>◀</span>
                  <span>▶</span>
                </div>
              </div>
            )}
          </div>

          {/* CRT Monitor Bottom Chin Badge */}
          {enableCurvature && (
            <div className="flex items-center justify-between mt-2.5 px-2 text-[10px] font-mono text-neutral-500">
              <span className="tracking-widest uppercase font-semibold">IBM VGA DISPLAY 8514/A</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>60 Hz SYNC</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Realtime Telemetry Grid */}
      {conversionResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
            <span className="text-[11px] text-neutral-400 block">Resolution & Mode</span>
            <span className="font-mono tabular-nums text-neutral-200 font-semibold mt-0.5 block">
              640 × 480 · {comparison?.enabled ? 'Split Compare' : '1-bit'}
            </span>
          </div>

          {comparison?.enabled && comparisonResult ? (
            <>
              <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[11px] text-amber-400 block truncate">
                  Side A ({algoAName})
                </span>
                <span className="font-mono tabular-nums text-neutral-200 font-semibold mt-0.5 block">
                  {conversionResult.whitePercent.toFixed(1)}% ({conversionResult.whitePixels.toLocaleString()} px)
                </span>
              </div>

              <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[11px] text-blue-400 block truncate">
                  Side B ({algoBName})
                </span>
                <span className="font-mono tabular-nums text-neutral-200 font-semibold mt-0.5 block">
                  {comparisonResult.whitePercent.toFixed(1)}% ({comparisonResult.whitePixels.toLocaleString()} px)
                </span>
              </div>

              <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Difference</span>
                <span className="font-mono tabular-nums text-amber-400 font-semibold mt-0.5 block">
                  {Math.abs(conversionResult.whitePercent - comparisonResult.whitePercent).toFixed(1)}% Delta
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Scanline Buffer</span>
                <span className="font-mono tabular-nums text-neutral-200 font-semibold mt-0.5 block">
                  80 Bytes / Scanline
                </span>
              </div>

              <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">BSAVE File Size</span>
                <span className="font-mono tabular-nums text-amber-400 font-semibold mt-0.5 block">
                  38,407 Bytes (Exact)
                </span>
              </div>

              <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Active Pixel Fill</span>
                <span className="font-mono tabular-nums text-neutral-200 font-semibold mt-0.5 block">
                  {conversionResult.whitePercent.toFixed(1)}% ({conversionResult.whitePixels.toLocaleString()} px)
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
