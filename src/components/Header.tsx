import React from 'react';
import { Download, Monitor, FileCode, Binary } from 'lucide-react';

interface HeaderProps {
  onDownloadBsave: () => void;
  onNavigateSection: (sectionId: string) => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({
  onDownloadBsave,
  onNavigateSection,
  activeSection,
}) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-8 px-6 py-3.5 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-sm">
          QB
        </div>
        <span className="text-lg font-bold tracking-tight text-neutral-100 whitespace-nowrap shrink-0">
          QBasic BSAVE Studio
        </span>
      </div>

      {/* Zone 2: Navigation Links (single line, clean hover) */}
      <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-neutral-400">
        <button
          onClick={() => onNavigateSection('converter')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'converter' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Image Converter
        </button>
        <button
          onClick={() => onNavigateSection('crt')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'crt' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          CRT Simulator
        </button>
        <button
          onClick={() => onNavigateSection('palette-export')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'palette-export' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Palette Export
        </button>
        <button
          onClick={() => onNavigateSection('header-inspector')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'header-inspector' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          BSAVE Hex
        </button>
        <button
          onClick={() => onNavigateSection('code-suite')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'code-suite' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Code Samples
        </button>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onDownloadBsave}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 rounded hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          title="Download 38,407-byte BSAVE binary file ready for QBasic"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download .BSV (38.4 KB)</span>
        </button>
      </div>
    </header>
  );
};
