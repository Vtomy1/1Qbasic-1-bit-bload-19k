import React, { useEffect, useRef, useState } from 'react';
import { BatchItem, ImageProcessingOptions } from '../types';
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
  Sparkles,
  RotateCcw,
  X,
  Clock,
} from 'lucide-react';

interface BatchConvertViewProps {
  batchItems: BatchItem[];
  onBatchItemsChange: React.Dispatch<React.SetStateAction<BatchItem[]>>;
  options: ImageProcessingOptions;
  onPreviewInCrt: (item: BatchItem) => void;
}

interface RemovedItemRecord {
  item: BatchItem;
  index: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export const BatchConvertView: React.FC<BatchConvertViewProps> = ({
  batchItems,
  onBatchItemsChange,
  options,
  onPreviewInCrt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const removedIdsRef = useRef<Set<string>>(new Set());
  const batchItemsRef = useRef<BatchItem[]>(batchItems);
  batchItemsRef.current = batchItems;

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [autoConvertOnAdd, setAutoConvertOnAdd] = useState(false);
  const [includeSlideshow, setIncludeSlideshow] = useState(true);
  const [includeLoaders, setIncludeLoaders] = useState(true);
  const [zipSuccessMessage, setZipSuccessMessage] = useState<string | null>(null);
  const [zipErrorMessage, setZipErrorMessage] = useState<string | null>(null);
  const [lastRemoved, setLastRemoved] = useState<RemovedItemRecord | null>(null);

  // Clean up created object URLs on unmount
  useEffect(() => {
    return () => {
      batchItemsRef.current.forEach((item) => {
        if (item.sourcePreviewUrl) {
          URL.revokeObjectURL(item.sourcePreviewUrl);
        }
      });
    };
  }, []);

  // Process a specific list of BatchItems sequentially without resurrecting removed items
  const processItemsList = async (itemsToProcess: BatchItem[]) => {
    const queue = itemsToProcess.filter((item) => !removedIdsRef.current.has(item.id));
    if (queue.length === 0) return;

    setIsProcessingBatch(true);

    for (const item of queue) {
      if (removedIdsRef.current.has(item.id)) continue;

      onBatchItemsChange((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'processing', errorMessage: undefined } : it))
      );

      try {
        const resultData = await processBatchImageFile(item.file, options);
        if (removedIdsRef.current.has(item.id)) continue;

        onBatchItemsChange((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  originalWidth: resultData.originalWidth,
                  originalHeight: resultData.originalHeight,
                  result: resultData.result,
                  thumbnailUrl: resultData.thumbnailUrl,
                  status: 'ready',
                }
              : it
          )
        );
      } catch (err: unknown) {
        if (removedIdsRef.current.has(item.id)) continue;
        const message = err instanceof Error ? err.message : 'Processing failed';

        onBatchItemsChange((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'error', errorMessage: message }
              : it
          )
        );
      }
    }

    setIsProcessingBatch(false);
  };

  // Add files to batch queue (staged as pending by default so users can remove items before processing)
  const handleAddFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const existingNames = new Set(batchItemsRef.current.map((i) => i.bsvFilename));

    const newItems: BatchItem[] = fileArray.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      file,
      name: file.name,
      bsvFilename: sanitizeDosFilename(file.name, existingNames),
      originalWidth: 0,
      originalHeight: 0,
      status: 'pending',
      sourcePreviewUrl: URL.createObjectURL(file),
    }));

    onBatchItemsChange((prev) => [...prev, ...newItems]);
    setLastRemoved(null);
    setZipErrorMessage(null);

    if (autoConvertOnAdd) {
      await processItemsList(newItems);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleLoadSamplesAsBatch = async () => {
    const existingNames = new Set(batchItemsRef.current.map((i) => i.bsvFilename));
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
        sampleItems.push({
          id: `${Date.now()}_${sample.id}_${Math.random().toString(36).substring(2, 5)}`,
          file,
          name: sample.name,
          bsvFilename: sanitizeDosFilename(`${sample.id}.png`, existingNames),
          originalWidth: 640,
          originalHeight: 480,
          status: 'pending',
          sourcePreviewUrl: URL.createObjectURL(file),
        });
      } catch (err) {
        console.error('Failed to load sample as batch item:', err);
      }
    }

    if (sampleItems.length === 0) return;

    onBatchItemsChange((prev) => [...prev, ...sampleItems]);
    setLastRemoved(null);
    setZipErrorMessage(null);

    if (autoConvertOnAdd) {
      await processItemsList(sampleItems);
    }
  };

  const handleProcessPending = async () => {
    const pendingItems = batchItemsRef.current.filter(
      (i) => i.status === 'pending' || i.status === 'error'
    );
    await processItemsList(pendingItems);
  };

  const handleProcessSingleItem = async (item: BatchItem) => {
    await processItemsList([item]);
  };

  const handleRemoveItem = (item: BatchItem, index: number) => {
    removedIdsRef.current.add(item.id);
    if (lastRemoved?.item.sourcePreviewUrl && lastRemoved.item.id !== item.id) {
      URL.revokeObjectURL(lastRemoved.item.sourcePreviewUrl);
    }
    setLastRemoved({ item, index });
    onBatchItemsChange((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleUndoRemove = () => {
    if (!lastRemoved) return;
    const { item, index } = lastRemoved;
    removedIdsRef.current.delete(item.id);

    const restoredItem: BatchItem =
      item.status === 'processing' ? { ...item, status: 'pending' } : item;

    onBatchItemsChange((prev) => {
      if (prev.some((i) => i.id === restoredItem.id)) return prev;
      const next = [...prev];
      const insertAt = Math.min(Math.max(0, index), next.length);
      next.splice(insertAt, 0, restoredItem);
      return next;
    });
    setLastRemoved(null);
  };

  const handleDismissUndo = () => {
    if (lastRemoved?.item.sourcePreviewUrl) {
      URL.revokeObjectURL(lastRemoved.item.sourcePreviewUrl);
    }
    setLastRemoved(null);
  };

  const handleClearAll = () => {
    batchItemsRef.current.forEach((item) => {
      removedIdsRef.current.add(item.id);
      if (item.sourcePreviewUrl) {
        URL.revokeObjectURL(item.sourcePreviewUrl);
      }
    });
    if (lastRemoved?.item.sourcePreviewUrl) {
      URL.revokeObjectURL(lastRemoved.item.sourcePreviewUrl);
    }
    setLastRemoved(null);
    setZipErrorMessage(null);
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
    setZipErrorMessage(null);
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
        `Generated and downloaded ZIP archive with ${readyItems.length} BSV file${
          readyItems.length === 1 ? '' : 's'
        }.`
      );
      setTimeout(() => setZipSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setZipErrorMessage(`Error creating ZIP: ${message}`);
    } finally {
      setIsZipping(false);
    }
  };

  const pendingCount = batchItems.filter((i) => i.status === 'pending').length;
  const processingCount = batchItems.filter((i) => i.status === 'processing').length;
  const readyCount = batchItems.filter((i) => i.status === 'ready').length;
  const errorCount = batchItems.filter((i) => i.status === 'error').length;
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
              Queue multiple images, remove any unwanted items before converting or exporting, and generate authentic 1-bit 640×480 BSAVE files (38,407 bytes each) with DOS 8.3 filenames and an automated{' '}
              <code className="text-amber-400 font-mono">LOADALL.BAS</code> slideshow player.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {batchItems.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isZipping}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear Queue
              </button>
            )}
            {(pendingCount > 0 || errorCount > 0) && (
              <button
                onClick={handleProcessPending}
                disabled={isProcessingBatch || isZipping}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/40 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {isProcessingBatch ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>
                  Process Queue ({pendingCount + errorCount})
                </span>
              </button>
            )}
            <button
              onClick={handleDownloadZip}
              disabled={readyCount === 0 || isProcessingBatch || isZipping}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-neutral-950 transition-colors shadow-sm cursor-pointer"
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
                e.target.value = '';
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
                PNG, JPG, WebP, GIF, BMP · Files stage in the queue so you can inspect or remove items before converting
              </p>
            </div>
          </div>
        </div>

        {/* Queue Behavior & Quick Sample Controls */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-neutral-300">
            <input
              type="checkbox"
              checked={autoConvertOnAdd}
              onChange={(e) => setAutoConvertOnAdd(e.target.checked)}
              className="accent-amber-400 rounded"
            />
            <span>Auto-convert immediately on upload</span>
          </label>

          <button
            onClick={handleLoadSamplesAsBatch}
            disabled={isProcessingBatch}
            className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load All Built-in Samples into Batch</span>
          </button>
        </div>
      </div>

      {/* Undo Removal Notice */}
      {lastRemoved && (
        <div className="flex items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-300">
          <div className="flex items-center gap-2 min-w-0">
            <Trash2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">
              Removed <strong className="font-mono text-amber-400">{lastRemoved.item.bsvFilename}</strong> ({lastRemoved.item.name}) from the batch queue.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUndoRemove}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
            <button
              onClick={handleDismissUndo}
              className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
              aria-label="Dismiss removal notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {zipErrorMessage && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-red-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{zipErrorMessage}</span>
          </div>
          <button
            onClick={() => setZipErrorMessage(null)}
            className="text-red-300 hover:text-red-100 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-neutral-500 block text-[11px]">Queue Status:</span>
              <span className="font-mono font-bold text-neutral-200">
                {batchItems.length} Total
                {pendingCount > 0 && (
                  <span className="text-amber-300"> · {pendingCount} Pending</span>
                )}
                {processingCount > 0 && (
                  <span className="text-amber-400"> · {processingCount} Converting</span>
                )}
                {readyCount > 0 && (
                  <span className="text-emerald-400"> · {readyCount} Ready</span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-400"> · {errorCount} Failed</span>
                )}
              </span>
            </div>
            <div className="border-l border-neutral-800 pl-4">
              <span className="text-neutral-500 block text-[11px]">ZIP Payload Size:</span>
              <span className="font-mono font-bold text-amber-400">
                {(totalPayloadBytes / 1024).toFixed(1)} KB ({readyCount} × 38.4 KB)
              </span>
            </div>
          </div>

          {/* Archive Inclusions Checkboxes */}
          <div className="flex flex-wrap items-center gap-4 text-neutral-300">
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
            <span>BATCH QUEUE ({batchItems.length})</span>
            <span>STATUS / ACTIONS</span>
          </div>

          <div className="divide-y divide-neutral-800 max-h-[500px] overflow-y-auto">
            {batchItems.map((item, idx) => {
              const previewSrc = item.thumbnailUrl || item.sourcePreviewUrl;
              return (
                <div
                  key={item.id}
                  className="p-3 hover:bg-neutral-800/30 transition-colors flex items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Filename Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-12 bg-neutral-950 border border-neutral-800 rounded overflow-hidden shrink-0 flex items-center justify-center relative">
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={item.name}
                          className={`w-full h-full object-cover ${
                            item.status === 'processing' ? 'opacity-50' : ''
                          }`}
                          style={{
                            imageRendering: item.thumbnailUrl ? 'pixelated' : 'auto',
                          }}
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-neutral-600" />
                      )}
                      {item.status === 'processing' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/50">
                          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                        </div>
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

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-400 font-mono mt-0.5">
                        {item.status === 'pending' && (
                          <>
                            <span className="inline-flex items-center gap-1 text-amber-300">
                              <Clock className="w-3 h-3" />
                              Queued (unprocessed)
                            </span>
                            <span>·</span>
                            <span>{formatFileSize(item.file.size)}</span>
                            <span>·</span>
                            <span className="text-neutral-500">Target: 640×480 1-bit</span>
                          </>
                        )}

                        {item.status === 'processing' && (
                          <span className="text-amber-400">Dithering to 640×480 1-bit...</span>
                        )}

                        {item.status === 'ready' && (
                          <>
                            <span>
                              {item.originalWidth > 0
                                ? `${item.originalWidth}×${item.originalHeight}`
                                : '640×480'}
                            </span>
                            <span>·</span>
                            <span>640×480 1-bit</span>
                            {item.result && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-400">
                                  {item.result.whitePercent.toFixed(1)}% Fill · Ready
                                </span>
                              </>
                            )}
                          </>
                        )}

                        {item.status === 'error' && (
                          <span className="text-red-400">
                            {item.errorMessage || 'Failed to convert'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(item.status === 'pending' || item.status === 'error') && (
                      <button
                        onClick={() => handleProcessSingleItem(item)}
                        disabled={isProcessingBatch}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 disabled:opacity-40 transition-colors cursor-pointer"
                        title={`Convert ${item.name} now using ${options.algorithm}`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span className="hidden sm:inline">
                          {item.status === 'error' ? 'Retry' : 'Convert'}
                        </span>
                      </button>
                    )}

                    {item.status === 'ready' && (
                      <>
                        <button
                          onClick={() => onPreviewInCrt(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
                          title="View this image inside the CRT Monitor emulator"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span className="hidden sm:inline">Preview in CRT</span>
                        </button>

                        <button
                          onClick={() => handleDownloadSingleBsv(item)}
                          className="p-1.5 text-neutral-400 hover:text-amber-400 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                          title={`Download ${item.bsvFilename} (38,407 B)`}
                          aria-label={`Download ${item.bsvFilename}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleRemoveItem(item, idx)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/30 transition-colors cursor-pointer"
                      title={
                        item.status === 'ready'
                          ? `Remove ${item.bsvFilename} before export`
                          : `Remove ${item.bsvFilename} before processing`
                      }
                      aria-label={`Remove ${item.bsvFilename} from batch queue`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
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
            Drop multiple images above or click &quot;Load All Built-in Samples into Batch&quot; to queue files, remove unwanted items, convert to 1-bit BSAVE, and export a ZIP archive.
          </p>
        </div>
      )}
    </div>
  );
};
