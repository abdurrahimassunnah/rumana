import React from 'react';
import { Hash, Plus, Trash2, BookOpen, Layers } from 'lucide-react';
import { PageRange } from '../types';

interface PageRangeSelectorProps {
  ranges?: { id: string; start: number | string; end: number | string }[];
  pageRanges?: { id: string; start: number | string; end: number | string }[];
  onChange: (ranges: { id: string; start: number | string; end: number | string }[]) => void;
  accentColor?: 'emerald' | 'teal' | 'indigo' | 'blue';
  title?: string;
  subtitle?: string;
  description?: string;
  maxPages?: number;
}

export const PageRangeSelector: React.FC<PageRangeSelectorProps> = ({
  ranges,
  pageRanges,
  onChange,
  accentColor = 'emerald',
  title = 'পৃষ্ঠা নম্বর ও সীমা নির্বাচন (Page Ranges)',
  subtitle,
  description,
  maxPages
}) => {
  const effectiveRanges = ranges || pageRanges || [{ id: 'default_range_1', start: 1, end: 5 }];
  const effectiveSubtitle = subtitle || description || 'বইয়ের সূচিপত্র না থাকলে বা নির্দিষ্ট পৃষ্ঠা থেকে কাজ করতে এক বা একাধিক পৃষ্ঠা সীমা যোগ করুন';

  // Accent color mappings
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      border: 'border-emerald-200/70 dark:border-emerald-900/40',
      focus: 'focus:border-emerald-500 focus:ring-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      badge: 'bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
      btn: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60',
      pill: 'bg-emerald-600 text-white'
    },
    teal: {
      bg: 'bg-teal-50/50 dark:bg-teal-950/20',
      border: 'border-teal-200/70 dark:border-teal-900/40',
      focus: 'focus:border-teal-500 focus:ring-teal-500/20',
      text: 'text-teal-700 dark:text-teal-400',
      badge: 'bg-teal-100/80 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800',
      btn: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/70 dark:border-teal-800/60 hover:bg-teal-100/80 dark:hover:bg-teal-900/60',
      pill: 'bg-teal-600 text-white'
    },
    indigo: {
      bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
      border: 'border-indigo-200/70 dark:border-indigo-900/40',
      focus: 'focus:border-indigo-500 focus:ring-indigo-500/20',
      text: 'text-indigo-700 dark:text-indigo-400',
      badge: 'bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
      btn: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60',
      pill: 'bg-indigo-600 text-white'
    },
    blue: {
      bg: 'bg-blue-50/50 dark:bg-blue-950/20',
      border: 'border-blue-200/70 dark:border-blue-900/40',
      focus: 'focus:border-blue-500 focus:ring-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      badge: 'bg-blue-100/80 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      btn: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/60 hover:bg-blue-100/80 dark:hover:bg-blue-900/60',
      pill: 'bg-blue-600 text-white'
    }
  };

  const currentTheme = colorMap[accentColor] || colorMap.emerald;

  const handleAddRange = () => {
    const lastRange = effectiveRanges[effectiveRanges.length - 1];
    let nextStart: number | string = 1;
    let nextEnd: number | string = 5;

    if (lastRange && lastRange.end) {
      const endNum = parseInt(String(lastRange.end), 10);
      if (!isNaN(endNum)) {
        nextStart = endNum + 1;
        nextEnd = endNum + 5;
      }
    }

    const newRange = {
      id: `range_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      start: nextStart,
      end: nextEnd
    };

    onChange([...effectiveRanges, newRange]);
  };

  const handleRemoveRange = (id: string) => {
    if (effectiveRanges.length <= 1) return;
    onChange(effectiveRanges.filter(r => r.id !== id));
  };

  const handleUpdateRange = (index: number, field: 'start' | 'end', val: string) => {
    const updated = [...effectiveRanges];
    updated[index] = {
      ...updated[index],
      [field]: val
    };
    onChange(updated);
  };

  // Calculate total pages count summary
  const calculateTotalPages = () => {
    let count = 0;
    for (const r of effectiveRanges) {
      const s = parseInt(String(r.start), 10);
      const e = parseInt(String(r.end), 10);
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        count += (e - s + 1);
      } else if (!isNaN(s) && (isNaN(e) || e < s)) {
        count += 1;
      }
    }
    return count;
  };

  const totalPages = calculateTotalPages();

  return (
    <div id="page-range-selector-component" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <label className={`text-xs font-bold ${currentTheme.text} flex items-center gap-1.5`}>
            <Hash className="w-4 h-4" />
            <span>{title}</span>
          </label>
          {effectiveSubtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {effectiveSubtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {totalPages > 0 && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${currentTheme.badge} flex items-center gap-1`}>
              <Layers className="w-3.5 h-3.5" />
              <span>মোট {totalPages} পৃষ্ঠা</span>
            </span>
          )}

          <button
            type="button"
            id="add-page-range-btn"
            onClick={handleAddRange}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${currentTheme.btn} active:scale-95 shadow-sm`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ পৃষ্ঠা রেঞ্জ যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Ranges List */}
      <div className="space-y-2.5">
        {effectiveRanges.map((range, index) => {
          const s = parseInt(String(range.start), 10);
          const e = parseInt(String(range.end), 10);
          const rangeCount = (!isNaN(s) && !isNaN(e) && e >= s) ? (e - s + 1) : 0;

          return (
            <div
              key={range.id || index}
              id={`page-range-item-${index}`}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border ${currentTheme.border} ${currentTheme.bg} transition-all`}
            >
              {/* Range badge */}
              <div className="flex items-center justify-between sm:justify-start gap-2 min-w-[90px]">
                <span className={`text-xs font-black ${currentTheme.text} flex items-center gap-1`}>
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>রেঞ্জ #{index + 1}</span>
                </span>
                {rangeCount > 0 && (
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {rangeCount} পৃ.
                  </span>
                )}
              </div>

              {/* Start and End inputs */}
              <div className="grid grid-cols-2 gap-3 flex-grow">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    শুরুর পৃষ্ঠা (Start Page)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxPages || 9999}
                    id={`page-range-start-${index}`}
                    value={range.start}
                    placeholder="১"
                    onChange={(e) => handleUpdateRange(index, 'start', e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs font-black text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none transition-all ${currentTheme.focus}`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    শেষ পৃষ্ঠা (End Page)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxPages || 9999}
                    id={`page-range-end-${index}`}
                    value={range.end}
                    placeholder="১০"
                    onChange={(e) => handleUpdateRange(index, 'end', e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs font-black text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none transition-all ${currentTheme.focus}`}
                  />
                </div>
              </div>

              {/* Quick Presets (+1, +3, +5) */}
              <div className="flex items-center gap-1 self-start sm:self-center">
                <button
                  type="button"
                  title="শেষ পৃষ্ঠা +১ বাড়ান"
                  onClick={() => {
                    const curEnd = parseInt(String(range.end || range.start || 1), 10);
                    handleUpdateRange(index, 'end', String(curEnd + 1));
                  }}
                  className="px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  +১ পৃ.
                </button>
                <button
                  type="button"
                  title="শেষ পৃষ্ঠা +৫ বাড়ান"
                  onClick={() => {
                    const curEnd = parseInt(String(range.end || range.start || 1), 10);
                    handleUpdateRange(index, 'end', String(curEnd + 5));
                  }}
                  className="px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  +৫ পৃ.
                </button>
              </div>

              {/* Delete Button */}
              {effectiveRanges.length > 1 && (
                <button
                  type="button"
                  id={`remove-page-range-btn-${index}`}
                  onClick={() => handleRemoveRange(range.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors self-end sm:self-center"
                  title="এই পৃষ্ঠা রেঞ্জ মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PageRangeSelector;
