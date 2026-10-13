import React, { useState, useEffect, useRef } from 'react';
import { Upload, RotateCcw, Image as ImageIcon, Check } from 'lucide-react';

interface MadrasahLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'formal' | 'crest' | 'modern';
  allowUpload?: boolean;
}

/**
 * Official Madrasatus Sunnah Crest & Logo
 * Designed accurately based on official Madrasatus Sunnah branding:
 * - Teal arched dome medallion
 * - Arabesque minarets and crescent
 * - Bold Arabic calligraphy "مدرسة السنة" / "السنة"
 * - Bengali typography "মাদরাসাতুস সুন্নাহ"
 * - Custom Logo Upload support (persisted in localStorage)
 * - Graceful fallback to pristine SVG vector crest
 */
export const MadrasahLogo: React.FC<MadrasahLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  orientation = 'horizontal',
  variant = 'crest',
  allowUpload = false
}) => {
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom logo from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('madrasah_custom_logo');
      if (saved) {
        setCustomLogoUrl(saved);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setCustomLogoUrl(dataUrl);
          setImageError(false);
          try {
            localStorage.setItem('madrasah_custom_logo', dataUrl);
          } catch (err) {
            console.warn('Storage limit exceeded', err);
          }
          setShowUploadModal(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefault = () => {
    setCustomLogoUrl(null);
    setImageError(false);
    try {
      localStorage.removeItem('madrasah_custom_logo');
    } catch (e) {}
    setShowUploadModal(false);
  };

  const dimensionMap = {
    sm: { box: 'w-10 h-10', img: 36, textTitle: 'text-xs', textSub: 'text-[9px]' },
    md: { box: 'w-14 h-14', img: 50, textTitle: 'text-sm font-black', textSub: 'text-[10px]' },
    lg: { box: 'w-20 h-20', img: 72, textTitle: 'text-base font-black', textSub: 'text-xs' },
    xl: { box: 'w-28 h-28', img: 100, textTitle: 'text-xl font-black', textSub: 'text-sm' },
  };

  const dim = dimensionMap[size] || dimensionMap.md;

  // Vector SVG crest matching official Madrasatus Sunnah crest
  const renderVectorCrest = () => (
    <div
      className={`${dim.box} relative flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-b from-teal-50 to-emerald-100/80 dark:from-teal-950/80 dark:to-emerald-950/60 border-2 border-teal-700/80 dark:border-teal-500/80 p-1 shadow-xs`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer Circular/Arched Seal */}
        <circle cx="50" cy="50" r="46" stroke="#0f766e" strokeWidth="2.5" fill="#f0fdfa" />
        <circle cx="50" cy="50" r="41" stroke="#0d9488" strokeWidth="1" strokeDasharray="3 2" />

        {/* Arch & Dome Shape */}
        <path
          d="M 28 65 L 28 44 C 28 32 50 20 50 20 C 50 20 72 32 72 44 L 72 65 Z"
          fill="#0f766e"
          opacity="0.12"
        />
        <path
          d="M 32 65 L 32 46 C 32 36 50 26 50 26 C 50 26 68 36 68 46 L 68 65"
          stroke="#0f766e"
          strokeWidth="2"
          fill="none"
        />

        {/* Crescent at top */}
        <path
          d="M 52 13 C 55 13 57 15 57 18 C 57 22 53 24 50 24 C 47 24 45 22 45 19 C 47 20 50 20 52 18 C 53 16 53 14 52 13 Z"
          fill="#047857"
        />

        {/* Open Book / Quran Motif at base */}
        <path
          d="M 50 62 C 43 57 34 58 31 60 L 31 71 C 35 69 43 68 50 72 C 57 68 65 69 69 71 L 69 60 C 66 58 57 57 50 62 Z"
          fill="#0f766e"
        />
        <line x1="50" y1="62" x2="50" y2="72" stroke="#ffffff" strokeWidth="1.5" />

        {/* Arabic Calligraphy "السنة" inside arch */}
        <text
          x="50"
          y="48"
          textAnchor="middle"
          fill="#0f766e"
          fontSize="17"
          fontWeight="900"
          fontFamily="'Amiri', 'Traditional Arabic', serif"
        >
          السُّنَّة
        </text>

        {/* Arabic Subtitle "مدرسة" */}
        <text
          x="50"
          y="35"
          textAnchor="middle"
          fill="#047857"
          fontSize="9"
          fontWeight="bold"
          fontFamily="'Amiri', 'Traditional Arabic', serif"
        >
          مَدْرَسَةُ
        </text>

        {/* Bottom Banner Curved Text */}
        <text
          x="50"
          y="84"
          textAnchor="middle"
          fill="#0f766e"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="'Kalpurush', 'SolaimanLipi', sans-serif"
        >
          মাদরাসাতুস সুন্নাহ
        </text>
      </svg>
    </div>
  );

  return (
    <div
      className={`inline-flex ${
        orientation === 'vertical' ? 'flex-col items-center text-center' : 'items-center gap-3'
      } ${className} relative group`}
    >
      {/* If custom logo is provided, show it */}
      {customLogoUrl && !imageError ? (
        <div
          className={`${dim.box} relative flex items-center justify-center shrink-0 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-700/80 dark:border-teal-500/80 p-1 shadow-xs overflow-hidden cursor-pointer`}
          onClick={() => allowUpload && setShowUploadModal(true)}
          title={allowUpload ? "লোগো পরিবর্তন করতে ক্লিক করুন" : undefined}
        >
          <img
            src={customLogoUrl}
            alt="মাদরাসাতুস সুন্নাহ লোগো"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div
          className="cursor-pointer"
          onClick={() => allowUpload && setShowUploadModal(true)}
          title={allowUpload ? "লোগো পরিবর্তন করতে ক্লিক করুন" : undefined}
        >
          {renderVectorCrest()}
        </div>
      )}

      {showText && (
        <div className={orientation === 'vertical' ? 'mt-2' : ''}>
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <h2 className={`${dim.textTitle} text-teal-900 dark:text-teal-200 tracking-tight leading-tight`}>
              মাদরাসাতুস সুন্নাহ
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
              السنة
            </span>
          </div>
          <p className={`${dim.textSub} text-teal-700/80 dark:text-teal-400 font-medium tracking-wide mt-0.5`}>
            MADRASATUS SUNNAH • স্মার্ট ইসলামিক শিক্ষা ও মূল্যায়ন
          </p>
        </div>
      )}

      {/* Quick Upload Button on Hover if allowUpload is true */}
      {allowUpload && (
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          title="মাদ্রাসার লোগো পরিবর্তন / আপলোড করুন"
          className="print:hidden text-[10px] text-teal-700 hover:text-teal-900 underline ml-1 cursor-pointer"
        >
          লোগো পরিবর্তন
        </button>
      )}

      {/* Custom Logo Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-600" />
                <span>মাদ্রাসার লোগো আপলোড বা পরিবর্তন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              আপনার কম্পিউটার বা ওয়ার্ড ফাইল থেকে মাদ্রাসার লোগো (PNG, JPG, SVG) আপলোড করতে পারেন। এটি স্বয়ংক্রিয়ভাবে সকল প্রশ্নপত্র ও পাঠ পরিকল্পনায় প্রদর্শিত হবে।
            </p>

            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 text-center">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-teal-600 mb-2" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                লোগো ফাইল নির্বাচন করুন (Select Image)
              </button>
              <span className="text-[10px] text-slate-400 mt-2">
                সমর্থিত ফরম্যাট: PNG, JPG, JPEG, SVG
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ডিফল্ট ভেক্টর লোগোতে ফেরত যান</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
