import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Trash2, 
  Check, 
  Database, 
  Loader2, 
  Eye, 
  FileText,
  Files
} from 'lucide-react';
import { StoredFile } from '../services/dbService';
import FilePreview from './FilePreview';

interface StoredFilesManagerProps {
  activeFile: File | null;
  activeFileId?: string | null;
  savedFiles: StoredFile[];
  onSelectSavedFile: (stored: StoredFile) => void;
  onDeleteSavedFile: (id: string, e: React.MouseEvent) => void;
  onClearAllFiles: () => void;
  onUploadFiles: (files: File[]) => Promise<void> | void;
  onRemoveActiveFile: () => void;
  isUploading?: boolean;
  uploadProgress?: string;
  accentColor?: 'emerald' | 'teal';
  uploadTitle?: string;
  uploadSubtitle?: string;
  acceptFormats?: string;
}

// Bengali formatted date & time and size helper
export const formatBengaliFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '০.০০ MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

export const formatBengaliTimestamp = (timestamp?: number): string => {
  if (!timestamp) return 'অজানা সময়';
  const d = new Date(timestamp);
  try {
    const dateStr = d.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('bn-BD', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} • ${timeStr}`;
  } catch (e) {
    return d.toLocaleString();
  }
};

export const StoredFilesManager: React.FC<StoredFilesManagerProps> = ({
  activeFile,
  activeFileId,
  savedFiles,
  onSelectSavedFile,
  onDeleteSavedFile,
  onClearAllFiles,
  onUploadFiles,
  onRemoveActiveFile,
  isUploading = false,
  uploadProgress = '',
  accentColor = 'emerald',
  uploadTitle = 'সিলেবাস বা পাঠ্যবই ফাইল আপলোড করুন',
  uploadSubtitle = 'একসাথে একাধিক ফাইল (২ বা ৩টি) নির্বাচন ও আপলোড করতে পারেন',
  acceptFormats = '.pdf,image/*,.doc,.docx,.txt'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    onUploadFiles(filesArray);
  };

  const isEmerald = accentColor === 'emerald';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. UPLOAD & ACTIVE FILE CONTAINER (Exact visual match to design) */}
      <div 
        onClick={() => !isUploading && !activeFile && fileInputRef.current?.click()}
        onDragOver={(e) => { 
          e.preventDefault(); 
          if (!isUploading) setIsDragging(true); 
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setIsDragging(false); 
          if (!isUploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files);
          }
        }}
        className={`relative rounded-3xl p-6 sm:p-8 transition-all border-2 border-dashed ${
          isDragging 
            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 scale-[1.01]' 
            : activeFile
              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-slate-900/40'
              : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/20 hover:border-emerald-400 hover:bg-emerald-50/10 cursor-pointer'
        }`}
      >
        <input 
          ref={fileInputRef} 
          type="file" 
          multiple 
          className="hidden" 
          onChange={(e) => handleFileSelection(e.target.files)} 
          accept={acceptFormats} 
        />

        {/* State A: Uploading / Processing Progress */}
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className={`w-10 h-10 ${isEmerald ? 'text-emerald-600 dark:text-emerald-400' : 'text-teal-600 dark:text-teal-400'} animate-spin`} />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {uploadProgress || 'ফাইলসমূহ আপলোড ও প্রসেস করা হচ্ছে...'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                ফাইল ব্রাউজারে সংরক্ষিত হচ্ছে ও লাইব্রেরিতে যুক্ত হচ্ছে
              </p>
            </div>
          </div>
        ) : !activeFile ? (
          /* State B: Empty Drop Zone */
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-all text-slate-400 dark:text-slate-300">
              <Upload className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
              {uploadTitle}
            </h4>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5 justify-center">
              <Files className="w-3.5 h-3.5" />
              <span>একসাথে একাধিক ফাইল (২ বা ৩টি) নির্বাচন করতে পারেন</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md">
              স্ক্যানকৃত বই ও বড় PDF সহ যেকোনো ফাইল ড্র্যাগ করে ছাড়ুন (সর্বোচ্চ ৫০০ MB / 500 MB পর্যন্ত সমর্থিত)। সকল ফাইল ব্রাউজারে সংরক্ষিত থাকবে এবং সূচিপত্র বিশ্লেষণ করা যাবে।
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ফাইল বা বই নির্বাচন করুন (Multiple Select)</span>
            </button>
          </div>
        ) : (
          /* State C: Active File Card (Exact design from screenshot) */
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-800/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4 overflow-hidden">
              {/* Green Icon Box with [T] icon */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 dark:bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm text-white relative">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="absolute bottom-1 right-1 text-[8px] font-black bg-emerald-800/90 text-white px-1 py-0.2 rounded">T</span>
              </div>

              {/* Title & Preview Link */}
              <div className="text-left overflow-hidden min-w-0">
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate" title={activeFile.name}>
                  {activeFile.name}
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <FilePreview file={activeFile} />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    ({formatBengaliFileSize(activeFile.size)})
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Close / Remove button & Add more button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800/60 transition-colors"
                title="আরও ফাইল যুক্ত করুন"
              >
                <Upload className="w-3 h-3" />
                <span>+ আরও ফাইল</span>
              </button>

              <button
                type="button"
                id="remove-active-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveActiveFile();
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                title="ফাইল আনসিলেক্ট করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. LIBRARY OF PREVIOUSLY UPLOADED FILES (Exact visual match to screenshot) */}
      <div className="bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        {/* Library Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              পূর্বে আপলোড করা ফাইলসমূহ (লাইব্রেরি)
            </h4>
            {savedFiles.length > 0 && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                {savedFiles.length}
              </span>
            )}
          </div>

          {savedFiles.length > 0 && (
            <button
              type="button"
              id="clear-all-library-files-btn"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>সব মুছে ফেলুন</span>
            </button>
          )}
        </div>

        {/* Library List */}
        {savedFiles.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500">
            <Files className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-semibold">
              এখনও কোনো ফাইল সংরক্ষিত নেই।
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              উপরে একসাথে দুই বা তিনটি ফাইল আপলোড করলে সবগুলো এখানে স্থায়ীভাবে সংরক্ষিত থাকবে।
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {savedFiles.map((stored) => {
              const isActive = activeFileId === stored.id || (activeFile && activeFile.name === stored.name);
              const formattedSize = formatBengaliFileSize(stored.size);
              const formattedDate = formatBengaliTimestamp(stored.timestamp);

              return (
                <div
                  key={stored.id}
                  id={`stored-file-item-${stored.id}`}
                  onClick={() => onSelectSavedFile(stored)}
                  className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 border-2 border-emerald-500 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                  }`}
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3 sm:gap-3.5 overflow-hidden min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative ${
                      isActive 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300'
                    }`}>
                      <FileText className="w-5 h-5" />
                      <span className={`absolute bottom-0.5 right-0.5 text-[7px] font-black px-0.5 rounded ${
                        isActive ? 'bg-emerald-800 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                      }`}>T</span>
                    </div>

                    <div className="text-left overflow-hidden min-w-0">
                      <p className={`text-xs sm:text-sm font-bold truncate ${
                        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {stored.name}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                        {formattedSize} • {formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* Right: Active Pill or Select button + Trash Icon */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                    {isActive ? (
                      <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>সক্রিয়</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSavedFile(stored);
                        }}
                        className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        সিলেক্ট
                      </button>
                    )}

                    <button
                      type="button"
                      id={`delete-file-btn-${stored.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileToDelete(stored);
                      }}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Single File Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  ফাইল মুছে ফেলতে চান?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ব্রাউজার লাইব্রেরি থেকে অপসারণ
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                আপনি কি নিশ্চিতভাবে <span className="font-bold text-slate-900 dark:text-white">"{fileToDelete.name}"</span> ফাইলটি মুছে ফেলতে চান?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={(e) => {
                  if (fileToDelete) {
                    onDeleteSavedFile(fileToDelete.id, e as any);
                  }
                  setFileToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>হ্যাঁ, মুছে ফেলুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Files Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  সমস্ত ফাইল মুছে ফেলতে চান?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  লাইব্রেরির সকল সংরক্ষিত ফাইল অপসারিত হবে
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                আপনি কি নিশ্চিতভাবে লাইব্রেরির সমস্ত ফাইল মুছে ফেলতে চান?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllFiles();
                  setShowClearConfirm(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>হ্যাঁ, সব মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoredFilesManager;
