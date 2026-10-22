import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  KeyRound, 
  Sparkles,
  Info
} from 'lucide-react';
import { 
  requestPreciseLocationDetailed, 
  isLocationVerified, 
  getCachedPreciseLocation, 
  PreciseLocationInfo,
  ADMIN_HISTORY_PASSWORD
} from '../services/analyticsService';

export const MandatoryLocationGate: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isLocationVerified());
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<{ code: string; message: string } | null>(null);
  const [successInfo, setSuccessInfo] = useState<PreciseLocationInfo | null>(() => getCachedPreciseLocation());
  
  // Emergency admin bypass state
  const [showAdminBypass, setShowAdminBypass] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  // Auto-request location on initial mount if not yet verified
  useEffect(() => {
    if (!isUnlocked) {
      handleRequestPermission();
    }
  }, [isUnlocked]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setErrorState(null);
    try {
      const result = await requestPreciseLocationDetailed();
      if (result.success && result.info) {
        setSuccessInfo(result.info);
        // Short pleasant delay so user sees their detected place and landmark
        setTimeout(() => {
          setIsUnlocked(true);
        }, 1200);
      } else {
        setErrorState({
          code: result.errorCode || 'unavailable',
          message: result.errorMessage || 'লোকেশন অনুমতি পাওয়া যায়নি।'
        });
      }
    } catch {
      setErrorState({
        code: 'error',
        message: 'লোকেশন প্রাপ্তিতে সমস্যা হয়েছে। অনুগ্রহ করে ব্রাউজার সেটিংস চেক করুন।'
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleAdminBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.trim() === ADMIN_HISTORY_PASSWORD) {
      try {
        localStorage.setItem('assunnah_location_verified', 'true');
        sessionStorage.setItem('assunnah_location_verified', 'true');
      } catch {}
      setIsUnlocked(true);
    } else {
      setAdminError('ভুল পিন কোড! সঠিক ৮ সংখ্যার অ্যাডমিন পাসওয়ার্ড দিন।');
    }
  };

  // If location is already verified and unlocked, do not render any gate
  if (isUnlocked) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto"
      style={{ touchAction: 'pan-y' }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />

        {/* Radar MapPin Pulsing Badge */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-teal-500/20 dark:bg-teal-500/30 rounded-full animate-ping opacity-75" />
          <div className="absolute inset-1.5 bg-teal-500/20 dark:bg-teal-500/20 rounded-full" />
          <div className="relative w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            {successInfo ? (
              <CheckCircle2 className="w-8 h-8 text-white animate-bounce" />
            ) : (
              <MapPin className="w-8 h-8 text-white" />
            )}
          </div>
        </div>

        {/* Badge & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-black mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>বাধ্যতামূলক লোকেশন ভেরিফিকেশন</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">
          {successInfo ? 'লোকেশন সফলভাবে যাচাই হয়েছে!' : 'লোকেশন অনুমতি দিয়ে প্রবেশ করুন'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed max-w-md mx-auto">
          {successInfo
            ? 'আপনার ভৌগোলিক এলাকা ও নিকটস্থ জনপ্রিয় স্থাপনা সফলভাবে শনাক্ত হয়েছে। আপনাকে সিস্টেমে প্রবেশ করানো হচ্ছে...'
            : 'মাদরাসাতুস সুন্নাহ পাঠ পরিকল্পনা ও শিক্ষা সহকারী প্ল্যাটফর্মটি ব্যবহার করতে হলে ব্রাউজারের লোকেশন অনুমতি দেওয়া বাধ্যতামূলক।'}
        </p>

        {/* Success Preview Card */}
        {successInfo && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-300 dark:border-emerald-700/80 mb-6 text-left animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5">
              <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                  {successInfo.landmark ? `${successInfo.landmark} সংলগ্ন` : successInfo.precisePlace}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 truncate">
                  {successInfo.precisePlace}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error / Instruction Card */}
        {errorState && !successInfo && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 rounded-2xl border border-rose-200 dark:border-rose-800/80 mb-6 text-left animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-200 flex-1">
                <div className="font-bold mb-1">
                  {errorState.code === 'denied' ? 'ব্রাউজারে লোকেশন ব্লক করা রয়েছে!' : 'লোকেশন অনুমতি প্রয়োজন'}
                </div>
                <div className="leading-relaxed text-[11px]">
                  {errorState.message}
                </div>

                {errorState.code === 'denied' && (
                  <div className="mt-3 p-2.5 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-rose-200 dark:border-rose-900 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="font-bold text-rose-700 dark:text-rose-300 mb-1">কীভাবে অনুমতি চালু করবেন:</div>
                    <div>১. ব্রাউজারের উপরে URL বারের বামে তালা (🔒) আইকনে চাপুন।</div>
                    <div>২. <strong>Location / অবস্থান</strong> অপশনটি <strong>Allow</strong> বা <strong>অনুমতি দিন</strong> করুন।</div>
                    <div>৩. এরপর নিচের বাটনে ক্লিক করে পুনরায় চেষ্টা করুন।</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions Button */}
        {!successInfo && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-teal-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isRequesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>অনুমতি অপেক্ষা করা হচ্ছে... (Allow চাপুন)</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>📍 লোকেশন অনুমতি দিন ও প্রবেশ করুন</span>
                </>
              )}
            </button>

            {errorState && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>পেজটি রিফ্রেশ (রিলোড) করুন</span>
              </button>
            )}
          </div>
        )}

        {/* Emergency Admin Bypass / Info Section */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Info className="w-3 h-3 text-teal-600" />
            <span>সুরক্ষিত ও নিরাপদ উপস্থিতি নিশ্চিতকরণ</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAdminBypass(!showAdminBypass)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer flex items-center gap-1"
          >
            <Lock className="w-3 h-3" />
            <span>অ্যাডমিন</span>
          </button>
        </div>

        {/* Admin Bypass Form */}
        {showAdminBypass && !successInfo && (
          <form onSubmit={handleAdminBypassSubmit} className="mt-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 text-left animate-in fade-in duration-150">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span>অ্যাডমিন ইমার্জেন্সি বাইপাস কোড</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value);
                  setAdminError('');
                }}
                placeholder="৮ সংখ্যার পাসওয়ার্ড..."
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                প্রবেশ
              </button>
            </div>
            {adminError && (
              <div className="text-[10px] text-rose-600 font-semibold mt-1">
                {adminError}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
