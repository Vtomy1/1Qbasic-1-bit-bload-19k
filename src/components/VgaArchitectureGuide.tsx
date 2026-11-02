import React from 'react';
import { Cpu, HardDrive, Terminal, Zap, Layers, HelpCircle } from 'lucide-react';

export const VgaArchitectureGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>VGA Graphics Architecture &amp; QuickBASIC Compatibility Guide</span>
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          Reference manual covering hardware registers, memory map layouts, and step-by-step DOSBox execution instructions.
        </p>
      </div>

      {/* 2-Column Architectural Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Memory Mapping & Mode Comparison */}
        <div className="p-5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
            <Cpu className="w-4 h-4 text-amber-400" />
            <h4>SCREEN 11 vs. SCREEN 12 Memory Models</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded bg-neutral-950 border border-neutral-800">
              <div className="font-semibold text-neutral-200 mb-1">
                SCREEN 11 (VGA BIOS Mode 11h)
              </div>
              <ul className="space-y-1 text-neutral-400">
                <li>· Resolution: 640 × 480 pixels</li>
                <li>· Color Depth: 1-bit per pixel (2 colors: 0 and 1)</li>
                <li>· Video RAM: Segment <code className="text-amber-300 font-mono">&amp;HA000</code>, linear plane</li>
                <li>· Scanline math: $640 \div 8 = 80$ bytes per row</li>
                <li>· Full screen payload: $80 \times 480 = 38,400$ bytes</li>
                <li>· Palette: Customizable via DAC registers (green/amber/paperwhite)</li>
              </ul>
            </div>

            <div className="p-3 rounded bg-neutral-950 border border-neutral-800">
              <div className="font-semibold text-neutral-200 mb-1">
                SCREEN 12 (VGA BIOS Mode 12h)
              </div>
              <ul className="space-y-1 text-neutral-400">
                <li>· Resolution: 640 × 480 pixels</li>
                <li>· Color Depth: 4-bit per pixel (16 colors from 262,144 palette)</li>
                <li>· Memory Architecture: 4 planar bitplanes at <code className="text-amber-300 font-mono">&amp;HA000</code></li>
                <li>· Plane 0 (Blue), Plane 1 (Green), Plane 2 (Red), Plane 3 (Intensity)</li>
                <li>· To display 1-bit data: Write to all 4 planes with Map Mask <code className="text-amber-300 font-mono">&amp;H0F</code></li>
                <li>· Results in clean Color 15 (bright white) without color fringing!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Hardware Register Reference */}
        <div className="p-5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4>VGA I/O Port &amp; Register Reference</h4>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
              <div className="flex justify-between font-mono text-neutral-200">
                <span>Port &amp;H3C4 / &amp;H3C5</span>
                <span className="text-amber-400">Sequencer Controller</span>
              </div>
              <p className="text-neutral-400 text-[11px] mt-1">
                Index 2 is the <strong>Map Mask Register</strong>. Controls which bitplanes receive CPU memory writes.
                <br />
                <code className="text-neutral-300 font-mono">OUT &amp;H3C4, 2 : OUT &amp;H3C5, &amp;H0F</code> enables all 4 planes.
              </p>
            </div>

            <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
              <div className="flex justify-between font-mono text-neutral-200">
                <span>Port &amp;H3CE / &amp;H3CF</span>
                <span className="text-blue-400">Graphics Controller</span>
              </div>
              <p className="text-neutral-400 text-[11px] mt-1">
                Index 4 is the <strong>Read Map Select Register</strong>. Controls which plane is read during CPU PEEK or BSAVE.
                <br />
                <code className="text-neutral-300 font-mono">OUT &amp;H3CE, 4 : OUT &amp;H3CF, plane</code> (0 to 3).
              </p>
            </div>

            <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800">
              <div className="flex justify-between font-mono text-neutral-200">
                <span>Port &amp;H3C8 / &amp;H3C9</span>
                <span className="text-emerald-400">VGA DAC Color Palette</span>
              </div>
              <p className="text-neutral-400 text-[11px] mt-1">
                Write index to <code className="text-neutral-300 font-mono">&amp;H3C8</code>, then write three 6-bit RGB values (0 to 63) to <code className="text-neutral-300 font-mono">&amp;H3C9</code> in succession.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DOSBox Quick-Start Run Instructions */}
      <div className="p-5 rounded-lg bg-neutral-900 border border-neutral-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200 mb-3">
          <Terminal className="w-4 h-4 text-amber-400" />
          <h4>Running in DOSBox / QuickBASIC 4.5</h4>
        </div>

        <div className="space-y-3 text-xs text-neutral-300">
          <p>
            Follow these simple steps to run your downloaded <code className="text-amber-400 font-mono">IMAGE.BSV</code> and <code className="text-amber-400 font-mono">LOAD11.BAS</code> inside DOSBox:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-neutral-400 pl-1">
            <li>
              Place both <strong className="text-neutral-200">IMAGE.BSV</strong> and <strong className="text-neutral-200">LOAD11.BAS</strong> in your DOS directory (e.g. <code className="text-neutral-300 font-mono">C:\DOS\BASIC\</code>).
            </li>
            <li>
              Launch DOSBox and mount your local directory:
              <div className="my-1.5 p-2 rounded bg-neutral-950 font-mono text-amber-300 border border-neutral-800">
                Z:\&gt; MOUNT C C:\DOS\BASIC<br />
                Z:\&gt; C:<br />
                C:\&gt; QBASIC /RUN LOAD11.BAS
              </div>
            </li>
            <li>
              QuickBASIC will immediately switch to 640x480 resolution, issue <code className="text-neutral-200 font-mono">BLOAD "IMAGE.BSV", 0</code> into <code className="text-neutral-200 font-mono">&amp;HA000</code>, and display your pixel-perfect dithered image!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
