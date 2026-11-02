import React, { useState } from 'react';
import { VGA_16_COLORS } from '../utils/vgaColors';
import {
  generatePaletteBasCode,
  getColorDetail,
  rgb8ToDac6,
  PaletteExportConfig,
} from '../utils/paletteExport';
import { downloadTextFile } from '../utils/bsave';
import {
  Palette,
  Copy,
  Check,
  Download,
  ArrowLeftRight,
  Sliders,
  Code2,
  Terminal,
  Zap,
} from 'lucide-react';

interface PaletteExportViewProps {
  fgIndex: number;
  bgIndex: number;
  onFgIndexChange: (idx: number) => void;
  onBgIndexChange: (idx: number) => void;
  bsvFileName?: string;
}

export const PaletteExportView: React.FC<PaletteExportViewProps> = ({
  fgIndex,
  bgIndex,
  onFgIndexChange,
  onBgIndexChange,
  bsvFileName = 'IMAGE.BSV',
}) => {
  const [copied, setCopied] = useState(false);
  const [customFgRgb, setCustomFgRgb] = useState<[number, number, number] | null>(null);
  const [customBgRgb, setCustomBgRgb] = useState<[number, number, number] | null>(null);
  const [enableFineTuning, setEnableFineTuning] = useState(false);

  const fg = getColorDetail(fgIndex, customFgRgb || undefined);
  const bg = getColorDetail(bgIndex, customBgRgb || undefined);

  const basCode = generatePaletteBasCode({
    fgIndex,
    bgIndex,
    fgCustomRgb: customFgRgb || undefined,
    bgCustomRgb: customBgRgb || undefined,
    bsvFileName,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(basCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTextFile(basCode, 'PALETTE.BAS');
  };

  const handleSwap = () => {
    const oldFg = fgIndex;
    const oldBg = bgIndex;
    const oldFgRgb = customFgRgb;
    const oldBgRgb = customBgRgb;

    onFgIndexChange(oldBg);
    onBgIndexChange(oldFg);
    setCustomFgRgb(oldBgRgb);
    setCustomBgRgb(oldFgRgb);
  };

  const applyPairPreset = (fgI: number, bgI: number) => {
    onFgIndexChange(fgI);
    onBgIndexChange(bgI);
    setCustomFgRgb(null);
    setCustomBgRgb(null);
  };

  const handleRgbSlider = (
    target: 'fg' | 'bg',
    channel: 0 | 1 | 2,
    val: number
  ) => {
    if (target === 'fg') {
      const current = customFgRgb ? [...customFgRgb] : [...fg.rgb8];
      current[channel] = val;
      setCustomFgRgb(current as [number, number, number]);
    } else {
      const current = customBgRgb ? [...customBgRgb] : [...bg.rgb8];
      current[channel] = val;
      setCustomBgRgb(current as [number, number, number]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>VGA 16-Color Palette Source Generator (.BAS)</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Export exact QBasic / QuickBASIC code configuring the VGA DAC hardware registers{' '}
              (<code className="text-amber-400 font-mono">OUT &amp;H3C8/&amp;H3C9</code>) and{' '}
              <code className="text-amber-400 font-mono">PALETTE</code> statements for your CRT foreground/background color pair.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PALETTE.BAS</span>
            </button>
          </div>
        </div>

        {/* Selected Pair Swatch & Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Foreground Color Card */}
          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Foreground Color (Index {fg.index})
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  Map Mask: &amp;H{fg.planeMask.toString(16).toUpperCase().padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded border border-white/20 shadow-inner shrink-0"
                  style={{ backgroundColor: fg.hex }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-neutral-100 truncate">
                    {fg.name}
                  </div>
                  <div className="text-xs font-mono text-neutral-400">
                    Hex: {fg.hex.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Data specifications */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-neutral-900/80 p-2.5 rounded border border-neutral-800/80">
                <div>
                  <span className="text-[10px] text-neutral-500 block">8-Bit RGB (0..255)</span>
                  <span className="text-neutral-200">
                    [{fg.rgb8.join(', ')}]
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">VGA DAC (0..63)</span>
                  <span className="text-amber-400 font-semibold">
                    [{fg.dac6.join(', ')}]
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">PALETTE Long Integer Value</span>
                  <span className="text-neutral-300">
                    {fg.longColor}&amp; ({fg.hexColorLong})
                  </span>
                </div>
              </div>
            </div>

            {/* Selector Dropdown */}
            <div className="mt-3">
              <label className="text-[11px] text-neutral-400 block mb-1">
                Select VGA Preset Color:
              </label>
              <select
                value={fgIndex}
                onChange={(e) => {
                  onFgIndexChange(parseInt(e.target.value));
                  setCustomFgRgb(null);
                }}
                className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                {VGA_16_COLORS.map((c) => (
                  <option key={c.index} value={c.index}>
                    Color {c.index}: {c.name.split(': ')[1]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Background Color Card */}
          <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Background Color (Index {bg.index})
                </span>
                <button
                  onClick={handleSwap}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                  title="Swap foreground and background"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Swap FG/BG</span>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded border border-white/20 shadow-inner shrink-0"
                  style={{ backgroundColor: bg.hex }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-neutral-100 truncate">
                    {bg.name}
                  </div>
                  <div className="text-xs font-mono text-neutral-400">
                    Hex: {bg.hex.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Data specifications */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-neutral-900/80 p-2.5 rounded border border-neutral-800/80">
                <div>
                  <span className="text-[10px] text-neutral-500 block">8-Bit RGB (0..255)</span>
                  <span className="text-neutral-200">
                    [{bg.rgb8.join(', ')}]
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">VGA DAC (0..63)</span>
                  <span className="text-amber-400 font-semibold">
                    [{bg.dac6.join(', ')}]
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">PALETTE Long Integer Value</span>
                  <span className="text-neutral-300">
                    {bg.longColor}&amp; ({bg.hexColorLong})
                  </span>
                </div>
              </div>
            </div>

            {/* Selector Dropdown */}
            <div className="mt-3">
              <label className="text-[11px] text-neutral-400 block mb-1">
                Select VGA Preset Color:
              </label>
              <select
                value={bgIndex}
                onChange={(e) => {
                  onBgIndexChange(parseInt(e.target.value));
                  setCustomBgRgb(null);
                }}
                className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-400"
              >
                {VGA_16_COLORS.map((c) => (
                  <option key={c.index} value={c.index}>
                    Color {c.index}: {c.name.split(': ')[1]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Contrast Composite Strip */}
        <div className="mt-4 p-3 rounded-lg border border-neutral-800 flex items-center justify-between"
             style={{ backgroundColor: bg.hex }}>
          <div className="font-mono text-sm font-bold tracking-wide" style={{ color: fg.hex }}>
            QuickBASIC 640x480 Contrast Preview · The quick brown fox jumps over the lazy dog
          </div>
          <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/60 text-white/90">
            FG:{fg.index} / BG:{bg.index}
          </div>
        </div>

        {/* Quick Color Pair Presets */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">Quick Pairs:</span>
          <button
            onClick={() => applyPairPreset(15, 0)}
            className="px-2.5 py-1 text-xs rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            White on Black (15 &amp; 0)
          </button>
          <button
            onClick={() => applyPairPreset(14, 1)}
            className="px-2.5 py-1 text-xs rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            Yellow on Navy Blue (14 &amp; 1)
          </button>
          <button
            onClick={() => applyPairPreset(10, 0)}
            className="px-2.5 py-1 text-xs rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            Matrix Green on Black (10 &amp; 0)
          </button>
          <button
            onClick={() => applyPairPreset(11, 8)}
            className="px-2.5 py-1 text-xs rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            Cyan on Dark Gray (11 &amp; 8)
          </button>
          <button
            onClick={() => applyPairPreset(12, 0)}
            className="px-2.5 py-1 text-xs rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            Light Red on Black (12 &amp; 0)
          </button>
          <button
            onClick={() => applyPairPreset(0, 7)}
            className="px-2.5 py-1 text-xs rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            Black on Light Gray (0 &amp; 7)
          </button>

          <button
            onClick={() => setEnableFineTuning(!enableFineTuning)}
            className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
              enableFineTuning
                ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Custom RGB Fine-Tuning</span>
          </button>
        </div>

        {/* Custom RGB Fine Tuning Sliders (if toggled) */}
        {enableFineTuning && (
          <div className="mt-4 p-4 rounded-lg bg-neutral-950 border border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FG Fine Tune */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-amber-400 block">
                Foreground DAC RGB (0..255 / 0..63)
              </span>
              {(['Red', 'Green', 'Blue'] as const).map((ch, idx) => (
                <div key={ch}>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>{ch}</span>
                    <span className="font-mono">
                      8-bit: {fg.rgb8[idx]} · DAC: {fg.dac6[idx]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={fg.rgb8[idx]}
                    onChange={(e) =>
                      handleRgbSlider('fg', idx as 0 | 1 | 2, parseInt(e.target.value))
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {/* BG Fine Tune */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-300 block">
                Background DAC RGB (0..255 / 0..63)
              </span>
              {(['Red', 'Green', 'Blue'] as const).map((ch, idx) => (
                <div key={ch}>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>{ch}</span>
                    <span className="font-mono">
                      8-bit: {bg.rgb8[idx]} · DAC: {bg.dac6[idx]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={bg.rgb8[idx]}
                    onChange={(e) =>
                      handleRgbSlider('bg', idx as 0 | 1 | 2, parseInt(e.target.value))
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generated QBasic Source Code Viewer */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {/* Editor Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="font-mono text-neutral-300 font-semibold ml-2">
              PALETTE.BAS
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-400">
              VGA SCREEN 12 Palette &amp; Color Setup
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download .BAS</span>
            </button>
          </div>
        </div>

        {/* Code Content with Syntax Formatting */}
        <div className="p-4 bg-neutral-950 overflow-x-auto max-h-[500px] font-mono text-xs leading-relaxed">
          <pre className="text-neutral-200">
            {basCode.split('\n').map((line, idx) => {
              const isComment = line.trim().startsWith("'");
              const isCommand = line.match(
                /\b(DEFINT|SCREEN|CLS|PRINT|OUT|PALETTE|DEF SEG|BLOAD|ON ERROR|GOTO|RESUME|LINE|CIRCLE|COLOR|LOCATE|WHILE|WEND|END|SUB|END SUB)\b/
              );

              return (
                <div key={idx} className="table-row hover:bg-neutral-900/50">
                  <span className="table-cell select-none pr-4 text-right text-neutral-600 font-mono tabular-nums text-[11px] w-8">
                    {idx + 1}
                  </span>
                  <span
                    className={`table-cell ${
                      isComment
                        ? 'text-neutral-500 italic'
                        : isCommand
                        ? 'text-amber-300'
                        : 'text-neutral-200'
                    }`}
                  >
                    {line}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>

      {/* Educational Callout on VGA Palette Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Why 6-Bit VGA DAC Registers (0..63)?</span>
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The IBM VGA hardware Digital-to-Analog Converter (Inmos INM-G171) accepts 6 bits per channel (Red, Green, Blue), giving $64 \times 64 \times 64 = 262,144$ possible hardware colors.
            When porting modern 8-bit RGB (0..255) to QBasic, each channel must be scaled by $\frac{63}{255}$ (or integer division <code className="text-neutral-300 font-mono">(RGB * 63) \ 255</code>).
            Values above 63 will overflow and cause color corruption.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>QBasic PALETTE Statement Formula</span>
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            When using the built-in <code className="text-neutral-300 font-mono">PALETTE attr, color&amp;</code> statement, QBasic packs 6-bit DAC values into a long integer using:
            <br />
            <code className="text-amber-300 font-mono">color&amp; = Red6 + (Green6 * 256) + (Blue6 * 65536)</code>
            <br />
            This updates the VGA hardware lookup register without needing manual port I/O loops.
          </p>
        </div>
      </div>
    </div>
  );
};
