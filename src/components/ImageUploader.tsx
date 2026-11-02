import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../utils/sampleImages';
import { ScalingMode } from '../types';
import { Archive } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (img: HTMLImageElement, name: string) => void;
  onMultipleImagesSelected?: (files: File[]) => void;
  onOpenBatchTab?: () => void;
  selectedSampleId: string;
  scalingMode: ScalingMode;
  onScalingModeChange: (mode: ScalingMode) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  onMultipleImagesSelected,
  onOpenBatchTab,
  selectedSampleId,
  scalingMode,
  onScalingModeChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [customFileName, setCustomFileName] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setCustomFileName(file.name);
        onImageSelected(img, file.name);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length > 1 && onMultipleImagesSelected) {
      onMultipleImagesSelected(files);
    } else if (files.length === 1) {
      handleFile(files[0]);
    }
  };

  const handleSampleClick = (sample: SampleImage) => {
    setCustomFileName(null);
    if (sample.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        onImageSelected(img, sample.name);
      };
      img.src = sample.url;
    } else if (sample.generator) {
      const canvas = document.createElement('canvas');
      sample.generator(canvas);
      const img = new Image();
      img.onload = () => {
        onImageSelected(img, sample.name);
      };
      img.src = canvas.toDataURL();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10'
            : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              if (e.target.files.length > 1 && onMultipleImagesSelected) {
                onMultipleImagesSelected(Array.from(e.target.files));
              } else {
                handleFile(e.target.files[0]);
              }
            }
          }}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-200">
              {customFileName ? (
                <span className="text-amber-400">{customFileName}</span>
              ) : (
                'Drop image(s) here or click to browse'
              )}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select one or multiple files at once to convert and export as ZIP
            </p>
          </div>
        </div>
      </div>

      {/* Batch Shortcut Banner */}
      {onOpenBatchTab && (
        <button
          onClick={onOpenBatchTab}
          className="w-full flex items-center justify-between p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/15 transition-colors text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Multi-Image Batch to ZIP Mode</span>
          </div>
          <span className="text-[11px] underline">Open Batch Queue →</span>
        </button>
      )}

      {/* Preset Gallery */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Built-in Test & Retro Samples
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_IMAGES.map((sample) => {
            const isSelected = !customFileName && selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSampleClick(sample)}
                className={`flex items-start gap-2.5 p-2.5 text-left rounded border transition-colors ${
                  isSelected
                    ? 'border-amber-500/60 bg-amber-500/10'
                    : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="w-12 h-9 rounded bg-neutral-950 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {sample.url ? (
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-400/80" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-neutral-200 truncate">
                      {sample.name}
                    </p>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                    {sample.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aspect Ratio Scaling Mode */}
      <div className="pt-1">
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          640x480 Frame Scaling Mode
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-900 rounded border border-neutral-800">
          <button
            onClick={() => onScalingModeChange('fit')}
            className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              scalingMode === 'fit'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Fit (Letterbox)
          </button>
          <button
            onClick={() => onScalingModeChange('fill')}
            className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              scalingMode === 'fill'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Fill (Crop)
          </button>
          <button
            onClick={() => onScalingModeChange('stretch')}
            className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              scalingMode === 'stretch'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Stretch
          </button>
        </div>
      </div>
    </div>
  );
};
