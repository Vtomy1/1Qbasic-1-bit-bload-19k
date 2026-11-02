import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { DitherControls } from './components/DitherControls';
import { CRTPreview } from './components/CRTPreview';
import { BsaveInspector } from './components/BsaveInspector';
import { CodeViewer } from './components/CodeViewer';
import { VgaArchitectureGuide } from './components/VgaArchitectureGuide';
import { PaletteExportView } from './components/PaletteExportView';
import {
  ConversionResult,
  DisplayMode,
  ImageProcessingOptions,
  PhosphorType,
  ScalingMode,
} from './types';
import { convertTo1Bit, renderImageToCanvas } from './utils/dithering';
import { downloadBinaryFile } from './utils/bsave';
import { SAMPLE_IMAGES } from './utils/sampleImages';
import { Monitor, Binary, FileCode, Layers, Sliders, Check, Palette } from 'lucide-react';

export default function App() {
  const [activeImage, setActiveImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState<string>('VINTAGE_PC');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('retro_pc');
  const [activeTab, setActiveTab] = useState<
    'crt' | 'palette-export' | 'header-inspector' | 'code-suite' | 'vga-docs'
  >('crt');

  const [options, setOptions] = useState<ImageProcessingOptions>({
    algorithm: 'atkinson',
    threshold: 128,
    brightness: 0,
    contrast: 15,
    gamma: 1.0,
    invert: false,
    scaling: 'fit',
  });

  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('screen11');
  const [phosphorType, setPhosphorType] = useState<PhosphorType>('amber');
  const [screen12FgColor, setScreen12FgColor] = useState<number>(15);
  const [screen12BgColor, setScreen12BgColor] = useState<number>(0);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<boolean>(false);

  // Load default retro image on initial mount
  useEffect(() => {
    const defaultSample = SAMPLE_IMAGES[0];
    if (defaultSample && defaultSample.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setActiveImage(img);
        setImageName('RETRO_PC');
      };
      img.src = defaultSample.url;
    }
  }, []);

  // Re-run 1-bit conversion whenever activeImage or options change
  useEffect(() => {
    if (!activeImage) return;

    try {
      const imageData = renderImageToCanvas(activeImage, options.scaling);
      const result = convertTo1Bit(imageData, options);
      setConversionResult(result);
    } catch (err) {
      console.error('Error during 1-bit conversion:', err);
    }
  }, [activeImage, options]);

  const handleImageSelected = useCallback((img: HTMLImageElement, name: string) => {
    setActiveImage(img);
    setImageName(name.replace(/\.[^/.]+$/, '').toUpperCase());
  }, []);

  const handleScalingModeChange = useCallback((scaling: ScalingMode) => {
    setOptions((prev) => ({ ...prev, scaling }));
  }, []);

  const handleDownloadBsave = useCallback(() => {
    if (!conversionResult) return;
    const cleanName = imageName.replace(/[^A-Z0-9_-]/gi, '_').substring(0, 8) || 'IMAGE';
    downloadBinaryFile(conversionResult.bsaveBinary, `${cleanName}.BSV`);
    setDownloadSuccessNotice(true);
    setTimeout(() => setDownloadSuccessNotice(false), 3000);
  }, [conversionResult, imageName]);

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'converter') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (
      sectionId === 'crt' ||
      sectionId === 'palette-export' ||
      sectionId === 'header-inspector' ||
      sectionId === 'code-suite' ||
      sectionId === 'vga-docs'
    ) {
      setActiveTab(sectionId as any);
      const el = document.getElementById('workspace-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* 3-Zone Header Contract */}
      <Header
        onDownloadBsave={handleDownloadBsave}
        onNavigateSection={scrollToSection}
        activeSection={activeTab}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-1">
              <span>QuickBASIC 4.5 / QBasic 1.1 / QB64</span>
              <span>·</span>
              <span>VGA 640x480 Standards</span>
              <span>·</span>
              <span>Mode 11h &amp; 12h</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight text-balance">
              Image to QBasic 1-Bit 640x480 BSAVE Studio
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-3xl leading-relaxed text-balance">
              Convert modern images to authentic 1-bit monochrome VGA bitmaps using 11 dithering algorithms,
              generate exact 7-byte BSAVE binary files (38,407 bytes total), and copy tested QuickBASIC loader
              and saver code for both monochrome (SCREEN 11) and 16-color (SCREEN 12) displays.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-right">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Standard Resolution
              </span>
              <span className="font-mono text-sm font-bold text-neutral-200">
                640 × 480 px
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-right">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                BSAVE Binary Size
              </span>
              <span className="font-mono text-sm font-bold text-amber-400">
                38,407 Bytes
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Source & Dithering Calibration (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-5 space-y-6">
              {/* Image Input Section */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>1. Source Image &amp; Frame Layout</span>
                </h2>
                <ImageUploader
                  onImageSelected={handleImageSelected}
                  selectedSampleId={selectedSampleId}
                  scalingMode={options.scaling}
                  onScalingModeChange={handleScalingModeChange}
                />
              </div>

              {/* Dithering Pipeline Section */}
              <div className="pt-4 border-t border-neutral-800">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>2. 1-Bit Dithering &amp; Luma Engine</span>
                </h2>
                <DitherControls options={options} onChange={setOptions} />
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Workstation (7 Columns) */}
          <div id="workspace-panel" className="lg:col-span-7 space-y-6">
            {/* Workstation Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800 overflow-x-auto">
              <button
                onClick={() => setActiveTab('crt')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'crt'
                    ? 'bg-neutral-800 text-amber-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>CRT Simulator</span>
              </button>

              <button
                onClick={() => setActiveTab('palette-export')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'palette-export'
                    ? 'bg-neutral-800 text-amber-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Palette Export (.BAS)</span>
              </button>

              <button
                onClick={() => setActiveTab('header-inspector')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'header-inspector'
                    ? 'bg-neutral-800 text-amber-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Binary className="w-3.5 h-3.5" />
                <span>7-Byte BSAVE Header</span>
              </button>

              <button
                onClick={() => setActiveTab('code-suite')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'code-suite'
                    ? 'bg-neutral-800 text-amber-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>QBasic Code Samples</span>
              </button>

              <button
                onClick={() => setActiveTab('vga-docs')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'vga-docs'
                    ? 'bg-neutral-800 text-amber-400 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>VGA Guide</span>
              </button>
            </div>

            {/* Notification Banner when file is downloaded */}
            {downloadSuccessNotice && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Downloaded <strong>{imageName}.BSV</strong> (38,407 bytes) with valid QuickBASIC 7-byte header!
                </span>
              </div>
            )}

            {/* Tab Viewport Content */}
            {activeTab === 'crt' && (
              <CRTPreview
                conversionResult={conversionResult}
                displayMode={displayMode}
                onDisplayModeChange={setDisplayMode}
                phosphorType={phosphorType}
                onPhosphorTypeChange={setPhosphorType}
                screen12FgColor={screen12FgColor}
                onScreen12FgColorChange={setScreen12FgColor}
                screen12BgColor={screen12BgColor}
                onScreen12BgColorChange={setScreen12BgColor}
                onOpenPaletteExport={() => setActiveTab('palette-export')}
              />
            )}

            {activeTab === 'palette-export' && (
              <PaletteExportView
                fgIndex={screen12FgColor}
                bgIndex={screen12BgColor}
                onFgIndexChange={setScreen12FgColor}
                onBgIndexChange={setScreen12BgColor}
                bsvFileName={`${imageName}.BSV`}
              />
            )}

            {activeTab === 'header-inspector' && (
              <BsaveInspector conversionResult={conversionResult} />
            )}

            {activeTab === 'code-suite' && <CodeViewer />}

            {activeTab === 'vga-docs' && <VgaArchitectureGuide />}
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-neutral-900 bg-neutral-950 px-6 py-6 text-center text-xs text-neutral-500">
        <p>
          QBasic 1-Bit 640x480 BSAVE Studio · Microsoft QuickBASIC 4.5 &amp; QB64 Compatible · Exact 7-Byte Header Standard
        </p>
      </footer>
    </div>
  );
}
