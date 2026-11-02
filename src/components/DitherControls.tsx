import React from 'react';
import { DitherAlgorithm, ImageProcessingOptions, ComparisonConfig } from '../types';
import { Sliders, RotateCcw, Sparkles, Columns2, ArrowLeftRight, Check, Info } from 'lucide-react';

interface DitherControlsProps {
  options: ImageProcessingOptions;
  onChange: (options: ImageProcessingOptions) => void;
  comparison: ComparisonConfig;
  onComparisonChange: (config: ComparisonConfig) => void;
}

interface AlgorithmInfo {
  id: DitherAlgorithm;
  name: string;
  badge: string;
  description: string;
}

export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'floyd-steinberg',
    name: 'Floyd-Steinberg',
    badge: 'Standard',
    description: 'Classic 4-pixel error diffusion (7/16, 3/16, 5/16, 1/16). Smooth gradients.',
  },
  {
    id: 'atkinson',
    name: 'Bill Atkinson',
    badge: 'MacPaint',
    description: 'Diffuses only 3/4 of error across 6 neighbors. Iconic high-contrast Apple Macintosh 1-bit look.',
  },
  {
    id: 'bayer-8',
    name: 'Bayer 8x8 Ordered',
    badge: 'Matrix',
    description: 'Classic VGA / EGA crosshatch texture. Very stable for animated frames and retro games.',
  },
  {
    id: 'bayer-4',
    name: 'Bayer 4x4 Ordered',
    badge: 'Coarse Matrix',
    description: 'Coarser 16-level ordered dither pattern with distinct geometric halftone rhythm.',
  },
  {
    id: 'sierra-3',
    name: 'Sierra 3-Row',
    badge: 'High Fidelity',
    description: 'Frankie Sierra 3-line error diffusion. Reduces worm artifacts and preserves fine detail.',
  },
  {
    id: 'sierra-2',
    name: 'Sierra Lite (2-Row)',
    badge: 'Fast',
    description: 'Simple 3-neighbor error diffusion. Crisp, low latency, retro pixel art look.',
  },
  {
    id: 'jarvis',
    name: 'Jarvis, Judice & Ninke',
    badge: 'Ultra Smooth',
    description: 'Spreads error over 12 surrounding cells (divisor 48). Smoothest continuous tones.',
  },
  {
    id: 'burkes',
    name: 'Burkes',
    badge: 'Crisp',
    description: '7-pixel diffusion with powers of 2 math. Sharp edges with soft midtones.',
  },
  {
    id: 'halftone',
    name: 'Halftone Dot Matrix',
    badge: 'Print Screen',
    description: 'Simulates newspaper and comic printing raster dots at 45-degree angle.',
  },
  {
    id: 'threshold',
    name: 'Pure Threshold',
    badge: 'Hard Cut',
    description: 'No dithering; strict binary cutoff. Ideal for line art, schematics, and text.',
  },
  {
    id: 'noise',
    name: 'Stochastic Noise',
    badge: 'Random Grain',
    description: 'Random jitter added to thresholding for film grain / sand texture.',
  },
];

export interface DitheringPreset {
  id: string;
  name: string;
  subject: string;
  description: string;
  algorithm: DitherAlgorithm;
  brightness: number;
  contrast: number;
  threshold: number;
  gamma: number;
  invert: boolean;
  tag: string;
}

export const DITHERING_PRESETS: DitheringPreset[] = [
  {
    id: 'line-art',
    name: 'Line Art',
    subject: 'Schematics, Ink & Line Art',
    description: 'Crisp binary thresholding with boosted contrast to eliminate paper noise and keep vector-like black/white lines razor sharp.',
    algorithm: 'threshold',
    brightness: 12,
    contrast: 55,
    threshold: 140,
    gamma: 1.0,
    invert: false,
    tag: 'Crisp Cutoff',
  },
  {
    id: 'photographic',
    name: 'Photographic',
    subject: 'Portraits & Natural Scenery',
    description: 'Floyd-Steinberg error diffusion with subtle gamma lift to retain smooth facial gradations, skin tones, and organic textures.',
    algorithm: 'floyd-steinberg',
    brightness: 4,
    contrast: 10,
    threshold: 128,
    gamma: 1.05,
    invert: false,
    tag: 'Smooth Midtones',
  },
  {
    id: 'high-contrast-graphics',
    name: 'High Contrast Graphics',
    subject: 'Logos, Sprites & Typography',
    description: 'Atkinson 3/4 error diffusion combined with punchy contrast for iconic 1984 MacPaint-style silhouettes and sharp graphics.',
    algorithm: 'atkinson',
    brightness: 6,
    contrast: 34,
    threshold: 130,
    gamma: 1.0,
    invert: false,
    tag: '1984 MacPaint',
  },
  {
    id: 'retro-halftone',
    name: 'Retro Halftone',
    subject: 'Newsprint & Screen Prints',
    description: 'Geometric matrix screen with boosted contrast for vintage comic book, newspaper, and industrial print aesthetics.',
    algorithm: 'halftone',
    brightness: 2,
    contrast: 26,
    threshold: 128,
    gamma: 1.0,
    invert: false,
    tag: 'Dot Screen',
  },
  {
    id: 'architectural',
    name: 'Architectural & Textures',
    subject: 'Masonry, CAD & Complex Foliage',
    description: 'Sierra 3-row diffusion with slight gamma compress to capture micro-details without clumping or worm artifacts.',
    algorithm: 'sierra-3',
    brightness: -2,
    contrast: 18,
    threshold: 126,
    gamma: 0.95,
    invert: false,
    tag: 'Micro-Detail',
  },
  {
    id: 'low-light',
    name: 'Low-Light Recovery',
    subject: 'Night Photography & Shadows',
    description: 'Burkes diffusion with aggressive brightness boost and high gamma curve to extract hidden shadow information into 1-bit space.',
    algorithm: 'burkes',
    brightness: 22,
    contrast: 18,
    threshold: 112,
    gamma: 1.35,
    invert: false,
    tag: 'Shadow Lift',
  },
];

export const DitherControls: React.FC<DitherControlsProps> = ({
  options,
  onChange,
  comparison,
  onComparisonChange,
}) => {
  const handleAlgorithmChange = (algorithm: DitherAlgorithm) => {
    onChange({ ...options, algorithm });
  };

  const handleAlgorithmBChange = (algorithmB: DitherAlgorithm) => {
    onComparisonChange({ ...comparison, algorithmB });
  };

  const handleToggleComparison = () => {
    onComparisonChange({
      ...comparison,
      enabled: !comparison.enabled,
      // If turning on and B is same as A, pick a contrasting default
      algorithmB:
        comparison.algorithmB === options.algorithm
          ? options.algorithm === 'atkinson'
            ? 'floyd-steinberg'
            : 'atkinson'
          : comparison.algorithmB,
    });
  };

  const handleSwapComparison = () => {
    const tempA = options.algorithm;
    const tempB = comparison.algorithmB;
    onChange({ ...options, algorithm: tempB });
    onComparisonChange({ ...comparison, algorithmB: tempA });
  };

  const applyComparisonPreset = (algoA: DitherAlgorithm, algoB: DitherAlgorithm) => {
    onChange({ ...options, algorithm: algoA });
    onComparisonChange({
      ...comparison,
      enabled: true,
      algorithmB: algoB,
    });
  };

  const handleSliderChange = (key: keyof ImageProcessingOptions, val: number) => {
    onChange({ ...options, [key]: val });
  };

  const handleInvertChange = () => {
    onChange({ ...options, invert: !options.invert });
  };

  const handleApplyPreset = (preset: DitheringPreset) => {
    onChange({
      ...options,
      algorithm: preset.algorithm,
      brightness: preset.brightness,
      contrast: preset.contrast,
      threshold: preset.threshold,
      gamma: preset.gamma,
      invert: preset.invert,
    });
  };

  const handleResetDefaults = () => {
    onChange({
      ...options,
      algorithm: 'floyd-steinberg',
      threshold: 128,
      brightness: 0,
      contrast: 0,
      gamma: 1.0,
      invert: false,
    });
  };

  const activePreset = DITHERING_PRESETS.find(
    (p) =>
      p.algorithm === options.algorithm &&
      p.brightness === options.brightness &&
      p.contrast === options.contrast &&
      p.threshold === options.threshold &&
      Math.abs(p.gamma - options.gamma) < 0.01 &&
      p.invert === options.invert
  );

  const currentAlgoA = ALGORITHMS.find((a) => a.id === options.algorithm) || ALGORITHMS[0];
  const currentAlgoB =
    ALGORITHMS.find((a) => a.id === comparison.algorithmB) || ALGORITHMS[1];

  return (
    <div className="space-y-4">
      {/* Side-by-Side Algorithm Comparison Mode Card */}
      <div
        className={`p-3 rounded-lg border transition-colors ${
          comparison.enabled
            ? 'bg-amber-500/10 border-amber-500/40'
            : 'bg-neutral-900/60 border-neutral-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns2 className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-semibold text-neutral-200 block">
                Side-by-Side Comparison
              </span>
              <span className="text-[10px] text-neutral-500">
                Compare 2 algorithms simultaneously in CRT
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleComparison}
            className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
              comparison.enabled
                ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            {comparison.enabled ? 'Active (ON)' : 'Enable Split'}
          </button>
        </div>

        {comparison.enabled && (
          <div className="mt-3 space-y-3 pt-3 border-t border-amber-500/20 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-amber-400 font-semibold block uppercase truncate">
                  Side A (Left)
                </span>
                <select
                  value={options.algorithm}
                  onChange={(e) => handleAlgorithmChange(e.target.value as DitherAlgorithm)}
                  className="w-full mt-1 text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-amber-400"
                >
                  {ALGORITHMS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSwapComparison}
                className="p-1.5 mt-4 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors shrink-0"
                title="Swap Left and Right algorithms"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-blue-400 font-semibold block uppercase truncate">
                  Side B (Right)
                </span>
                <select
                  value={comparison.algorithmB}
                  onChange={(e) => handleAlgorithmBChange(e.target.value as DitherAlgorithm)}
                  className="w-full mt-1 text-xs bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-amber-400"
                >
                  {ALGORITHMS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split position slider */}
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Split Position</span>
                <span className="font-mono text-amber-400">
                  {comparison.splitPosition}% A / {100 - comparison.splitPosition}% B
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={comparison.splitPosition}
                onChange={(e) =>
                  onComparisonChange({
                    ...comparison,
                    splitPosition: parseInt(e.target.value),
                  })
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Quick comparison pairs */}
            <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-neutral-500 mr-1">Presets:</span>
              <button
                onClick={() => applyComparisonPreset('atkinson', 'floyd-steinberg')}
                className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
              >
                Atkinson vs. Floyd
              </button>
              <button
                onClick={() => applyComparisonPreset('bayer-8', 'halftone')}
                className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
              >
                Bayer vs. Halftone
              </button>
              <button
                onClick={() => applyComparisonPreset('sierra-3', 'jarvis')}
                className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
              >
                Sierra vs. Jarvis
              </button>
              <button
                onClick={() => applyComparisonPreset('threshold', 'atkinson')}
                className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
              >
                Cutoff vs. Atkinson
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dithering Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Dithering Presets
            </span>
          </div>
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Reset algorithm, brightness, contrast, and gamma to default neutral baseline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {DITHERING_PRESETS.map((preset) => {
            const isActive = activePreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`flex flex-col text-left p-2.5 rounded-lg border transition-all text-xs cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/80 text-amber-100 ring-1 ring-amber-500/40 shadow-sm'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-neutral-100 flex items-center gap-1.5">
                    {preset.name}
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {preset.tag}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-neutral-400 leading-tight mb-2">
                  {preset.subject}
                </div>

                <div className="mt-auto pt-1.5 border-t border-neutral-800/60 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-neutral-400">
                  <span>
                    Algo: <strong className="text-neutral-200">{preset.algorithm}</strong>
                  </span>
                  <span>
                    Bright: <strong className="text-neutral-200">{preset.brightness > 0 ? `+${preset.brightness}` : preset.brightness}%</strong>
                  </span>
                  <span>
                    Contrast: <strong className="text-neutral-200">{preset.contrast > 0 ? `+${preset.contrast}` : preset.contrast}%</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Preset Context Callout */}
        {activePreset ? (
          <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-amber-400 font-semibold">{activePreset.name}:</span>{' '}
              {activePreset.description}{' '}
              <span className="text-neutral-400 block sm:inline">
                (You can further fine-tune the calibration sliders below).
              </span>
            </div>
          </div>
        ) : (
          <div className="px-2.5 py-1.5 rounded bg-neutral-900/40 border border-neutral-800/70 text-[11px] text-neutral-400 flex items-center justify-between">
            <span>Custom calibration active (manual adjustments).</span>
            <button
              onClick={handleResetDefaults}
              className="text-amber-400 hover:underline text-[10px] cursor-pointer"
            >
              Reset to baseline
            </button>
          </div>
        )}
      </div>

      {/* Algorithm Selector */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          Dithering Algorithm ({ALGORITHMS.length} Available)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {ALGORITHMS.map((algo) => {
            const isSelected = options.algorithm === algo.id;
            return (
              <button
                key={algo.id}
                onClick={() => handleAlgorithmChange(algo.id)}
                className={`flex flex-col p-2 text-left rounded border transition-colors ${
                  isSelected
                    ? 'border-amber-500/80 bg-amber-500/10 text-amber-200'
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold truncate">{algo.name}</span>
                </div>
                <span className="text-[10px] text-neutral-500 mt-0.5">{algo.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Algorithm description card */}
        <p className="text-xs text-neutral-400 bg-neutral-900/80 border border-neutral-800 rounded p-2.5 mt-2">
          <strong className="text-amber-400 font-semibold">{currentAlgoA.name}:</strong>{' '}
          {currentAlgoA.description}
        </p>
      </div>

      {/* Image Adjustments */}
      <div className="space-y-3 pt-2 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Tone & Luma Calibration
          </span>
          <button
            onClick={handleInvertChange}
            className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
              options.invert
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Invert Pixels {options.invert ? '(ON)' : '(OFF)'}
          </button>
        </div>

        {/* Threshold Slider */}
        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Cutoff Threshold</span>
            <span className="font-mono tabular-nums text-neutral-200">{options.threshold}</span>
          </div>
          <input
            type="range"
            min={10}
            max={245}
            value={options.threshold}
            onChange={(e) => handleSliderChange('threshold', parseInt(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Contrast Slider */}
        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Contrast</span>
            <span className="font-mono tabular-nums text-neutral-200">
              {options.contrast > 0 ? `+${options.contrast}` : options.contrast}%
            </span>
          </div>
          <input
            type="range"
            min={-80}
            max={80}
            value={options.contrast}
            onChange={(e) => handleSliderChange('contrast', parseInt(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Brightness Slider */}
        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Brightness</span>
            <span className="font-mono tabular-nums text-neutral-200">
              {options.brightness > 0 ? `+${options.brightness}` : options.brightness}%
            </span>
          </div>
          <input
            type="range"
            min={-70}
            max={70}
            value={options.brightness}
            onChange={(e) => handleSliderChange('brightness', parseInt(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Gamma Slider */}
        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Gamma Correction</span>
            <span className="font-mono tabular-nums text-neutral-200">{options.gamma.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={2.4}
            step={0.05}
            value={options.gamma}
            onChange={(e) => handleSliderChange('gamma', parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
