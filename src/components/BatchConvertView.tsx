import React, { useRef, useState } from 'react';
import { BatchItem, ConversionResult, ImageProcessingOptions } from '../types';
import {
  sanitizeDosFilename,
  processBatchImageFile,
  createBatchZipArchive,
} from '../utils/batchZip';
import { downloadBinaryFile } from '../utils/bsave';
import { SAMPLE_IMAGES } from '../utils/sampleImages';
import {
  Archive,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  FileText,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';

interface BatchConvertViewProps {
  batchItems: BatchItem[];
  onBatchItemsChange: (items: BatchItem[]) => void;
  options: ImageProcessingOptions;
  onPreviewInCrt: (item: BatchItem) => void;
}

export const BatchConvertView: React.FC<BatchConvertViewProps> = ({
  batchItems,
  onBatchItemsChange,
  options,
  onPreviewInCrt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [includeSlideshow, setIncludeSlideshow] = useState(true);
  const [includeLoaders, setIncludeLoaders] = useState(true);
  const [zipSuccessMessage, setZipSuccessMessage] = useState<string | null>(null);

  // Add files to batch queue and auto-process them
  const handleAddFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const existingNames = new Set(batchItems.map((i) => i.bsvFilename));

    // Create preliminary items
    const newItems: BatchItem[] = fileArray.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      file,
      name: file.name,
      bsvFilename: sanitizeDosFilename(file.name, existingNames),
      originalWidth: 0,
      originalHeight: 0,
      status: 'pending',
    }));

    const updatedQueue = [...batchItems, ...newItems];
    onBatchItemsChange(updatedQueue);
    setIsProcessingBatch(true);

    // Process each newly added item
    for (const item of newItems) {
      // Mark item as processing
      onBatchItemsChange(
        updatedQueue.map((it) => (it.id === item.id ? { ...it, status: 'processing' } : it))
      );

      try {
        const resultData = await processBatchImageFile(item.file, options);
        item.originalWidth = resultData.originalWidth;
        item.originalHeight = resultData.originalHeight;
        item.result = resultData.result;
        item.thumbnailUrl = resultData.thumbnailUrl;
        item.status = 'ready';
      } catch (err: any) {
        item.status = 'error';
        item.errorMessage = err?.message || 'Processing failed';
      }

      // Update state after each item finishes
      onBatchItemsChange([...updatedQueue]);
    }

    setIsProcessingBatch(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleLoadSamplesAsBatch = async () => {
    setIsProcessingBatch(true);
    const existingNames = new Set(batchItems.map((i) => i.bsvFilename));
    const sampleItems: BatchItem[] = [];

    for (const sample of SAMPLE_IMAGES) {
      try {
        let blob: Blob;
        if (sample.url) {
          const res = await fetch(sample.url);
          blob = await res.blob();
        } else if (sample.generator) {
          const canvas = document.createElement('canvas');
          sample.generator(canvas);
          blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
        } else {
          continue;
        }

        const file = new File([blob], `${sample.id}.png`, { type: 'image/png' });
        const item: BatchItem = {
          id: `${Date.now()}_${sample.id}`,
          file,
          name: sample.name,
          bsvFilename: sanitizeDosFilename(`${sample.id}.png`, existingNames),
          originalWidth: 640,
          originalHeight: 480,
          status: 'processing',
        };

        const resultData = await processBatchImageFile(file, options);
        item.originalWidth = resultData.originalWidth;
        item.originalHeight = resultData.originalHeight;
        item.result = resultData.result;
        item.thumbnailUrl = resultData.thumbnailUrl;
        item.status = 'ready';

        sampleItems.push(item);
      } catch (err) {
        console.error('Failed to load sample as batch item:', err);
      }
    }

    onBatchItemsChange([...batchItems, ...sampleItems]);
    setIsProcessingBatch(false);
  };

  const handleRemoveItem = (id: string) => {
    onBatchItemsChange(batchItems.filter((i) => i.id !== id));
  };

  const handleClearAll = () => {
    onBatchItemsChange([]);
  };

  const handleDownloadSingleBsv = (item: BatchItem) => {
    if (!item.result) return;
    downloadBinaryFile(item.result.bsaveBinary, item.bsvFilename);
  };

  const handleDownloadZip = async () => {
    const readyItems = batchItems.filter((i) => i.status === 'ready' && i.result);
    if (readyItems.length === 0) return;

    setIsZipping(true);
    try {
      const zipBlob = await createBatchZipArchive(readyItems, {
        algorithm: options.algorithm,
        includeBasSlideshow: includeSlideshow,
        includeStandardLoaders: includeLoaders,
      });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qbasic_bsv_batch_${readyItems.length}images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setZipSuccessMessage(
        `Successfully generated and downloaded zip archive with ${readyItems.length} BSV files!`
      );
      setTimeout(() => setZipSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`Error creating ZIP: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsZipping(false);
    }
  };

  const readyCount = batchItems.filter((i) => i.status === 'ready').length;
  const totalPayloadBytes = readyCount * 38407;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-400" />
              <span>Multi-Image Batch to ZIP Exporter</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Upload multiple images simultaneously. Each file is converted into an authentic 1-bit 640x480 BSAVE binary file (38,407 bytes) with DOS 8.3 filenames, bundled with an automated QBasic slideshow player (<code className="text-amber-400 font-mono">LOADALL.BAS</code>) and documentation in a single ZIP download.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {batchItems.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isProcessingBatch || isZipping}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors"
              >
                Clear Queue
              </button>
            )}
            <button
              onClick={handleDownloadZip}
              disabled={readyCount === 0 || isProcessingBatch || isZipping}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 transition-colors shadow-sm"
            >
              {isZipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download ZIP ({readyCount} Files)</span>
            </button>
          </div>
        </div>

        {/* Multi-File Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10'
              : 'border-neutral-700 hover:border-neutral-500 bg-neutral-950/60'
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
                handleAddFiles(e.target.files);
              }
            }}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-200">
                Click to browse or drop multiple image files here
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                PNG, JPG, WebP, GIF, BMP · Select multiple files at once to convert in parallel
              </p>
            </div>
          </div>
        </div>

        {/* Quick Sample Button */}
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
          <span>Need test images?</span>
          <button
            onClick={handleLoadSamplesAsBatch}
            disabled={isProcessingBatch}
            className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load All Built-in Samples into Batch</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {zipSuccessMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{zipSuccessMessage}</span>
        </div>
      )}

      {/* Batch Summary & Archive Options */}
      {batchItems.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-neutral-500 block text-[11px]">Total Queue:</span>
              <span className="font-mono font-bold text-neutral-200">
                {batchItems.length} Images ({readyCount} Ready)
              </span>
            </div>
            <div className="border-l border-neutral-800 pl-4">
              <span className="text-neutral-500 block text-[11px]">Uncompressed Size:</span>
              <span className="font-mono font-bold text-amber-400">
                {(totalPayloadBytes / 1024).toFixed(1)} KB (exact 38.4 KB each)
              </span>
            </div>
          </div>

          {/* Archive Inclusions Checkboxes */}
          <div className="flex items-center gap-4 text-neutral-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSlideshow}
                onChange={(e) => setIncludeSlideshow(e.target.checked)}
                className="accent-amber-400 rounded"
              />
              <span>Include LOADALL.BAS Slideshow</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLoaders}
                onChange={(e) => setIncludeLoaders(e.target.checked)}
                className="accent-amber-400 rounded"
              />
              <span>Include LOAD11/LOAD12.BAS</span>
            </label>
          </div>
        </div>
      )}

      {/* Batch Items Queue List */}
      {batchItems.length > 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-semibold">
            <span>CONVERTED BATCH FILES ({batchItems.length})</span>
            <span>STATUS / ACTIONS</span>
          </div>

          <div className="divide-y divide-neutral-800 max-h-[500px] overflow-y-auto">
            {batchItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 hover:bg-neutral-850/40 transition-colors flex items-center justify-between gap-4"
              >
                {/* Left: Thumbnail & Filename Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-12 bg-neutral-950 border border-neutral-800 rounded overflow-hidden shrink-0 flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : item.status === 'processing' ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 truncate">
                        {item.bsvFilename}
                      </span>
                      <span className="text-[10px] text-neutral-500 truncate hidden sm:inline">
                        ({item.name})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
                      <span>
                        {item.originalWidth > 0
                          ? `${item.originalWidth}×${item.originalHeight}`
                          : 'Pending'}
                      </span>
                      <span>·</span>
                      <span>640×480 1-bit</span>
                      {item.result && (
                        <>
                          <span>·</span>
                          <span className="text-neutral-300">
                            {item.result.whitePercent.toFixed(1)}% Fill
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'processing' && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-mono">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Converting</span>
                    </span>
                  )}

                  {item.status === 'ready' && (
                    <>
                      <button
                        onClick={() => onPreviewInCrt(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                        title="View this image inside the CRT Monitor emulator"
                      >
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span className="hidden sm:inline">Preview in CRT</span>
                      </button>

                      <button
                        onClick={() => handleDownloadSingleBsv(item)}
                        className="p-1.5 text-neutral-400 hover:text-amber-400 transition-colors"
                        title={`Download ${item.bsvFilename} (38,407 B)`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {item.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Failed</span>
                    </span>
                  )}

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 text-center bg-neutral-900/40 border border-neutral-800 rounded-lg">
          <Archive className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-neutral-300">
            Batch queue is currently empty
          </h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Drop multiple images above or click "Load All Built-in Samples into Batch" to test the automated multi-file BSV zip generator.
          </p>
        </div>
      )}
    </div>
  );
};
