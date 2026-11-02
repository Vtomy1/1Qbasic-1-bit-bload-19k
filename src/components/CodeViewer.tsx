import React, { useState } from 'react';
import { CODE_SAMPLES, CodeSample } from '../utils/codeSamples';
import { downloadTextFile } from '../utils/bsave';
import { Copy, Check, Download, Code2, BookOpen, Terminal } from 'lucide-react';

export const CodeViewer: React.FC = () => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('load11');
  const [copied, setCopied] = useState<boolean>(false);

  const sample = CODE_SAMPLES.find((s) => s.id === selectedSampleId) || CODE_SAMPLES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(sample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTextFile(sample.code, sample.filename);
  };

  // Group samples
  const screen11Samples = CODE_SAMPLES.filter((s) => s.screenMode === 'SCREEN 11');
  const screen12Samples = CODE_SAMPLES.filter((s) => s.screenMode === 'SCREEN 12');
  const universalSamples = CODE_SAMPLES.filter((s) => s.screenMode === 'UNIVERSAL');

  return (
    <div className="space-y-6">
      {/* Code Sample Selector Tabs */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>QBasic / QuickBASIC Loader &amp; Saver Code Suite</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Battle-tested, ready-to-run source code for Microsoft QuickBASIC 4.5, 7.1 PDS, QBasic 1.1, QB64, and DOSBox.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {sample.filename}</span>
            </button>
          </div>
        </div>

        {/* Organized Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* SCREEN 11 Group */}
          <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 px-1">
              Monochrome (SCREEN 11)
            </span>
            <div className="space-y-1">
              {screen11Samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSampleId(s.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedSampleId === s.id
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                  <span className="text-[10px] font-mono text-neutral-500 ml-1 shrink-0">
                    {s.filename}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SCREEN 12 Group */}
          <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 px-1">
              16-Color Planar (SCREEN 12)
            </span>
            <div className="space-y-1">
              {screen12Samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSampleId(s.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedSampleId === s.id
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                  <span className="text-[10px] font-mono text-neutral-500 ml-1 shrink-0">
                    {s.filename}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Universal & Utilities */}
          <div className="p-2 rounded bg-neutral-950/60 border border-neutral-800/80">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 px-1">
              Memory &amp; Header Parsers
            </span>
            <div className="space-y-1">
              {universalSamples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSampleId(s.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedSampleId === s.id
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                  <span className="text-[10px] font-mono text-neutral-500 ml-1 shrink-0">
                    {s.filename}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor Preview Window */}
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
              {sample.filename}
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-400">{sample.title}</span>
          </div>
          <span className="font-mono text-neutral-500 text-[11px]">
            {sample.screenMode}
          </span>
        </div>

        {/* Code Description Bar */}
        <div className="px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 text-xs text-neutral-300 flex items-start gap-2">
          <Terminal className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>{sample.description}</p>
        </div>

        {/* Code Content with Line Numbers */}
        <div className="p-4 bg-neutral-950 overflow-x-auto max-h-[500px] font-mono text-xs leading-relaxed">
          <pre className="text-neutral-200">
            {sample.code.split('\n').map((line, idx) => {
              const isComment = line.trim().startsWith("'");
              const isCommand = line.match(
                /\b(DEF SEG|BLOAD|BSAVE|SCREEN|OUT|CLS|LINE|CIRCLE|LOCATE|PRINT|DIM|OPEN|GET|CLOSE|END|WHILE|WEND|IF|THEN|ELSE|FOR|TO|STEP|NEXT|POKE|PEEK)\b/
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

      {/* Architecture Deep Dive Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>How SCREEN 11 (Monochrome) Loads &amp; Saves</span>
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            In SCREEN 11 (VGA Mode 11h), video memory is mapped as a single 1-bit linear plane at segment <code className="text-neutral-200 font-mono">&amp;HA000</code>.
            Each horizontal scanline is exactly 640 pixels wide, encoded in 80 sequential bytes ($640 \div 8 = 80$).
            The 480 scanlines require exactly $80 \times 480 = 38,400$ bytes.
            QuickBASIC's <code className="text-amber-400 font-mono">BLOAD "IMAGE.BSV", 0</code> transfers the entire screen memory in one high-speed block move!
          </p>
        </div>

        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>How SCREEN 12 (16-Color) Handles 1-Bit Data</span>
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            In SCREEN 12 (VGA Mode 12h), the display uses 4 parallel bitplanes (Planes 0–3 for Blue, Green, Red, Intensity).
            By sending <code className="text-neutral-200 font-mono">OUT &amp;H3C4, 2 : OUT &amp;H3C5, &amp;H0F</code>, you instruct the VGA Sequencer Map Mask to duplicate each incoming byte to all 4 bitplanes simultaneously.
            This results in instant, high-contrast bright white (<code className="text-amber-400 font-mono">Color 15</code>) on black (<code className="text-amber-400 font-mono">Color 0</code>)!
          </p>
        </div>
      </div>
    </div>
  );
};
