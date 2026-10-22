import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ExternalLink, X, CheckCircle2, Loader2 } from 'lucide-react';
import { 
  requestPreciseLocation, 
  subscribeToPreciseLocation, 
  getCachedPreciseLocation, 
  PreciseLocationInfo 
} from '../services/analyticsService';

export const LocationPermissionBanner: React.FC = () => {
  const [preciseLocation, setPreciseLocation] = useState<PreciseLocationInfo | null>(() => getCachedPreciseLocation());
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('assunnah_location_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPreciseLocation((info) => {
      setPreciseLocation(info);
      if (info && info.isGpsAccurate) {
        setShowSuccessToast(true);
        const timer = setTimeout(() => {
          setShowSuccessToast(false);
        }, 7000);
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, []);

  const handleRequestLocation = async () => {
    setIsRequesting(true);
    try {
      const result = await requestPreciseLocation();
      if (result && result.isGpsAccurate) {
        setPreciseLocation(result);
        setShowSuccessToast(true);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('assunnah_location_banner_dismissed', 'true');
    } catch {}
  };

  // 1. Success Notification when GPS is acquired
  if (showSuccessToast && preciseLocation) {
    return (
      <aside 
        aria-label="লোকেশন নিশ্চিতকরণ"
        className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100vw-2.5rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-3.5 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
      >
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                🎯 রিয়েল-টাইম জিপিএস নিশ্চিত
              </span>
              <button
                type="button"
                onClick={() => setShowSuccessToast(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                title="বন্ধ করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">
              {preciseLocation.landmark || preciseLocation.precisePlace}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {preciseLocation.precisePlace}
            </p>
            {preciseLocation.googleMapsUrl && (
              <a
                href={preciseLocation.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                <span>গুগল ম্যাপে দেখুন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // If already acquired or dismissed, don't show the permission request banner
  if (preciseLocation?.isGpsAccurate || isDismissed) {
    return null;
  }

  // 2. Permission Request Prompt Banner
  return (
    <aside 
      aria-label="লোকেশন অনুরোধ"
      className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100vw-2.5rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-teal-500/30 dark:border-teal-500/20 rounded-2xl p-3.5 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-2.5">
        <div className="relative p-2 bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-xl shrink-0 mt-0.5">
          <MapPin className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-500 rounded-full animate-ping" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
              <Navigation className="w-3 h-3 text-teal-600" />
              রিয়েল-টাইম লোকেশন ও স্থাপনা
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
              title="পরে করুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            কোন জায়গা ও নিকটস্থ জনপ্রিয় স্থাপনা থেকে সাইট ভিজিট করা হচ্ছে, তা নির্ভুলভাবে সংরক্ষণের জন্য লোকেশন অনুমতি দিন।
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={isRequesting}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>সনাক্ত হচ্ছে...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3" />
                  <span>অনুমতি দিন (Allow)</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl text-xs font-medium cursor-pointer"
            >
              এখন নয়
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
