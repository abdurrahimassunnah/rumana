import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Users, 
  Layers, 
  FileText, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Search, 
  Copy, 
  Check, 
  MapPin, 
  Globe, 
  Activity, 
  ExternalLink,
  Download,
  Filter,
  Eye,
  Calendar
} from 'lucide-react';
import { 
  AppSession, 
  GlobalLessonPlan, 
  ADMIN_HISTORY_PASSWORD, 
  fetchUsageSessions, 
  fetchGlobalLessonPlans, 
  formatDurationBn, 
  toBengaliDigits 
} from '../services/analyticsService';

interface UsageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'sessions' | 'history' | 'devices';
type TimeFilter = 'all' | 'today' | '7days' | '30days' | '365days';

export const UsageHistoryModal: React.FC<UsageHistoryModalProps> = ({ isOpen, onClose }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('assunnah_admin_authenticated') === 'true' || 
             sessionStorage.getItem('assunnah_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [rememberBrowser, setRememberBrowser] = useState(true);

  // Data State
  const [sessions, setSessions] = useState<AppSession[]>([]);
  const [plans, setPlans] = useState<GlobalLessonPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewPlan, setPreviewPlan] = useState<GlobalLessonPlan | null>(null);

  // Load data when authenticated and open
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadAllData();
    }
  }, [isOpen, isAuthenticated]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSessions, fetchedPlans] = await Promise.all([
        fetchUsageSessions(2500),
        fetchGlobalLessonPlans(2500)
      ]);
      setSessions(fetchedSessions);
      setPlans(fetchedPlans);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load analytics data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_HISTORY_PASSWORD) {
      setIsAuthenticated(true);
      setPinError('');
      try {
        if (rememberBrowser) {
          localStorage.setItem('assunnah_admin_authenticated', 'true');
        }
        sessionStorage.setItem('assunnah_admin_authenticated', 'true');
      } catch {}
    } else {
      setPinError('ভুল পিন কোড! অনুগ্রহ করে সঠিক ৮ সংখ্যার অ্যাডমিন পাসওয়ার্ড প্রদান করুন।');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    try {
      localStorage.removeItem('assunnah_admin_authenticated');
      sessionStorage.removeItem('assunnah_admin_authenticated');
    } catch {}
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter based on Time Range
  const isWithinTimeFilter = (timestampMs: number): boolean => {
    if (timeFilter === 'all') return true;
    const now = Date.now();
    const diffMs = now - timestampMs;
    const oneDay = 24 * 60 * 60 * 1000;

    switch (timeFilter) {
      case 'today':
        return diffMs <= oneDay;
      case '7days':
        return diffMs <= 7 * oneDay;
      case '30days':
        return diffMs <= 30 * oneDay;
      case '365days':
        return diffMs <= 365 * oneDay;
      default:
        return true;
    }
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const timeMatch = isWithinTimeFilter(s.startedAt);
      if (!timeMatch) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (s.ip && s.ip.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.country && s.country.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q)) ||
        (s.deviceId && s.deviceId.toLowerCase().includes(q)) ||
        (s.browser && s.browser.toLowerCase().includes(q)) ||
        (s.os && s.os.toLowerCase().includes(q)) ||
        (s.isp && s.isp.toLowerCase().includes(q))
      );
    });
  }, [sessions, searchQuery, timeFilter]);

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const timeMatch = isWithinTimeFilter(p.timestamp);
      if (!timeMatch) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.gradeLevel && p.gradeLevel.toLowerCase().includes(q)) ||
        (p.topicTitle && p.topicTitle.toLowerCase().includes(q)) ||
        (p.previewText && p.previewText.toLowerCase().includes(q)) ||
        (p.ip && p.ip.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.deviceId && p.deviceId.toLowerCase().includes(q)) ||
        (p.fullContent && p.fullContent.toLowerCase().includes(q))
      );
    });
  }, [plans, searchQuery, timeFilter]);

  // Aggregate Metrics (All-time or based on filter)
  const metrics = useMemo(() => {
    const totalSessionsCount = filteredSessions.length;
    const totalDurationSec = filteredSessions.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
    const uniqueDevicesSet = new Set(filteredSessions.map(s => s.deviceId).filter(Boolean));
    const totalPlansCreated = filteredPlans.length;

    // Device breakdown
    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;
    filteredSessions.forEach(s => {
      if (s.deviceType === 'Mobile') mobileCount++;
      else if (s.deviceType === 'Tablet') tabletCount++;
      else desktopCount++;
    });

    const activeThreshold = Date.now() - 2.5 * 60 * 1000;
    const liveActiveCount = sessions.filter(s => s.lastPingAt > activeThreshold).length;

    return {
      totalSessionsCount,
      totalDurationSec,
      uniqueDevicesCount: uniqueDevicesSet.size,
      totalPlansCreated,
      liveActiveCount,
      mobileCount,
      desktopCount,
      tabletCount,
      mobilePct: totalSessionsCount ? Math.round((mobileCount / totalSessionsCount) * 100) : 0,
      desktopPct: totalSessionsCount ? Math.round((desktopCount / totalSessionsCount) * 100) : 0,
      tabletPct: totalSessionsCount ? Math.round((tabletCount / totalSessionsCount) * 100) : 0,
    };
  }, [filteredSessions, filteredPlans, sessions]);

  // Unique Device Summary Table
  const uniqueDeviceSummaries = useMemo(() => {
    const map = new Map<string, {
      deviceId: string;
      deviceType: string;
      os: string;
      browser: string;
      firstSeen: number;
      lastSeen: number;
      latestIp: string;
      latestLocation: string;
      totalSessions: number;
      totalSeconds: number;
      plansCreated: number;
    }>();

    filteredSessions.forEach(s => {
      const devId = s.deviceId || 'DEV-UNKNOWN';
      const existing = map.get(devId);
      if (!existing) {
        map.set(devId, {
          deviceId: devId,
          deviceType: s.deviceType,
          os: s.os,
          browser: s.browser,
          firstSeen: s.startedAt,
          lastSeen: s.lastPingAt || s.startedAt,
          latestIp: s.ip || '',
          latestLocation: s.location || '',
          totalSessions: 1,
          totalSeconds: s.durationSeconds || 0,
          plansCreated: s.plansCreatedCount || 0
        });
      } else {
        existing.totalSessions += 1;
        existing.totalSeconds += (s.durationSeconds || 0);
        existing.plansCreated += (s.plansCreatedCount || 0);
        if (s.startedAt < existing.firstSeen) existing.firstSeen = s.startedAt;
        if ((s.lastPingAt || s.startedAt) > existing.lastSeen) {
          existing.lastSeen = s.lastPingAt || s.startedAt;
          existing.latestIp = s.ip || existing.latestIp;
          existing.latestLocation = s.location || existing.latestLocation;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }, [filteredSessions]);

  // Export JSON Report
  const handleExportJson = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      timeFilter,
      metrics,
      sessions: filteredSessions,
      plans: filteredPlans,
      deviceSummaries: uniqueDeviceSummaries
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assunnah_analytics_full_history_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* TOP HEADER */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-850 dark:to-teal-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-2xl shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  মাদরাসাতুস সুন্নাহ ব্যবহার পরিসংখ্যান ও হিস্ট্রি সিস্টেম
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black tracking-wide rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  শুরু থেকে শেষ পর্যন্ত সম্পূর্ণ হিস্ট্রি
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ক্লায়েন্ট-সাইড আইপি ট্র্যাকিং, সক্রিয় সময়কাল, ইউনিক ডিভাইস ও গ্লোবাল অ্যাক্টিভিটি রিপোর্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={loadAllData}
                  disabled={isLoading}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="তথ্য রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-2.5 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-100 hover:bg-teal-200 dark:bg-teal-950/80 rounded-xl border border-teal-300 dark:border-teal-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="সম্পূর্ণ ব্যাকআপ ডাউনলোড"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ব্যাকআপ এক্সপোর্ট</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                  title="লক করুন / লগআউট"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CONTENT BODY */}
        {/* ========================================================= */}
        {!isAuthenticated ? (
          /* ========================================================= */
          /* PIN PROTECTION SCREEN */
          /* ========================================================= */
          <div className="flex-1 p-8 sm:p-14 flex flex-col items-center justify-center max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              অ্যাডমিন পিন কোড প্রদান করুন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              ব্যবহারকারীদের আইপি, সক্রিয় সময়কাল ও বিস্তারিত অ্যাক্টিভিটি হিস্ট্রি দেখার জন্য গোপন পাসওয়ার্ড (PIN) দিন।
            </p>

            <form onSubmit={handlePinSubmit} className="w-full space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  autoFocus
                  placeholder="৮ সংখ্যার অ্যাডমিন পাসওয়ার্ড..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-2xl text-center text-lg font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {pinError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold text-left">
                  {pinError}
                </div>
              )}

              {/* Remember Browser Checkbox */}
              <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer text-left select-none hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberBrowser}
                  onChange={(e) => setRememberBrowser(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    এই ব্রাউজারে স্থায়ীভাবে মনে রাখুন
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    ব্রাউজার বন্ধ করলেও পরবর্তীতে আর পাসওয়ার্ড প্রদান করতে হবে না
                  </div>
                </div>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>আনলক করুন</span>
              </button>
            </form>
          </div>
        ) : (
          /* ========================================================= */
          /* AUTHENTICATED DASHBOARD */
          /* ========================================================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Metrics Ribbon */}
            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
              {/* Metric 1: Total Active Time */}
              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">মোট সক্রিয় সময়কাল</div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {formatDurationBn(metrics.totalDurationSec)}
                  </div>
                </div>
              </div>

              {/* Metric 2: Unique Devices */}
              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">স্বতন্ত্র ডিভাইস (Unique)</div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {toBengaliDigits(metrics.uniqueDevicesCount)} টি ডিভাইস
                  </div>
                </div>
              </div>

              {/* Metric 3: Total Sessions */}
              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span>মোট সেশন ভিজিট</span>
                    {metrics.liveActiveCount > 0 && (
                      <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {toBengaliDigits(metrics.liveActiveCount)} লাইভ
                      </span>
                    )}
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {toBengaliDigits(metrics.totalSessionsCount)} টি সেশন
                  </div>
                </div>
              </div>

              {/* Metric 4: Total Plans Created */}
              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">মোট তৈরি করা আইটেম</div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {toBengaliDigits(metrics.totalPlansCreated)} টি প্ল্যান/প্রশ্ন
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Tab Navigation Bar */}
            <div className="p-3 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
              {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('sessions')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'sessions'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>ব্যবহার সেশন ({toBengaliDigits(filteredSessions.length)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>তৈরি কাজের হিস্ট্রি ({toBengaliDigits(filteredPlans.length)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('devices')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'devices'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>ডিভাইস রিপোর্ট ({toBengaliDigits(uniqueDeviceSummaries.length)})</span>
                </button>
              </div>

              {/* Filters and Search */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Time Range Filter */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 pr-2 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="dark:bg-slate-800">সর্বমোট (শুরু থেকে শেষ পর্যন্ত)</option>
                    <option value="today" className="dark:bg-slate-800">আজ (গত ২৪ ঘণ্টা)</option>
                    <option value="7days" className="dark:bg-slate-800">বিগত ৭ দিন</option>
                    <option value="30days" className="dark:bg-slate-800">বিগত ৩০ দিন</option>
                    <option value="365days" className="dark:bg-slate-800">বিগত ১ বছর</option>
                  </select>
                </div>

                {/* Search Input */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="আইপি, শহর, ডিভাইস খুঁজুন..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Contents Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {/* ======================================================= */}
              {/* TAB 1: SESSIONS VIEW */}
              {/* ======================================================= */}
              {activeTab === 'sessions' && (
                <div className="space-y-3">
                  {filteredSessions.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-medium">
                      কোনো সেশন রেকর্ড পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredSessions.map((sess) => {
                        const isLive = (Date.now() - (sess.lastPingAt || sess.startedAt)) < 2.5 * 60 * 1000;
                        return (
                          <div
                            key={sess.sessionId}
                            className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-teal-400 dark:hover:border-teal-600 transition-all flex flex-col justify-between gap-3"
                          >
                            <div>
                              {/* Top Bar of Card */}
                              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-ping' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                  <span className={`text-[11px] font-bold ${isLive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                                    {isLive ? 'বর্তমানে লাইভ সক্রিয়' : 'সেশন সমাপ্ত'}
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300">
                                    {sess.deviceType}
                                  </span>
                                </div>

                                <div className="text-[10px] text-slate-400 font-medium">
                                  {new Date(sess.startedAt).toLocaleString('bn-BD', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>

                              {/* IP & Location */}
                              <div className="mt-2.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                                  <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  <span>{sess.ip || 'আইপি প্রক্রিয়াধীন'}</span>
                                  {sess.ip && sess.ip !== 'অজানা আইপি' && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(sess.ip!, sess.sessionId + '_ip')}
                                      className="p-1 text-slate-400 hover:text-teal-600 cursor-pointer"
                                      title="আইপি কপি করুন"
                                    >
                                      {copiedId === sess.sessionId + '_ip' ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate max-w-[200px]">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span className="truncate">{sess.location || sess.city || 'বাংলাদেশ'}</span>
                                </div>
                              </div>

                              {/* System Info */}
                              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl">
                                <div>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">ডিভাইস আইডি:</span>{' '}
                                  <span className="font-mono text-[10px] text-teal-700 dark:text-teal-300 font-bold">{sess.deviceId || 'DEV-N/A'}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">অপারেটিং সিস্টেম:</span> {sess.os || 'Unknown'}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">ব্রাউজার:</span> {sess.browser || 'Browser'}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">স্ক্রিন রেজোলিউশন:</span> {sess.screenResolution || 'N/A'}
                                </div>
                              </div>
                            </div>

                            {/* Bottom stats of Session */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                              <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>সক্রিয়: {formatDurationBn(sess.durationSeconds || 0)}</span>
                              </div>

                              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>তৈরি করা কাজ: {toBengaliDigits(sess.plansCreatedCount || 0)} টি</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================= */}
              {/* TAB 2: GLOBAL GENERATED LESSON PLANS HISTORY */}
              {/* ======================================================= */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {filteredPlans.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-medium">
                      কোনো কাজের ইতিহাস পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredPlans.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-teal-400 dark:hover:border-teal-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold">
                                {item.gradeLevel || 'শ্রেণি উল্লেখ নেই'}
                              </span>
                              {item.topicTitle && (
                                <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                  {item.topicTitle}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(item.timestamp).toLocaleString('bn-BD', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                              {item.previewText}
                            </p>

                            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              <span className="flex items-center gap-1 font-mono text-[10px]">
                                <Smartphone className="w-3 h-3 text-slate-400" />
                                {item.deviceId || 'DEV-N/A'}
                              </span>
                              {item.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rose-500" />
                                  {item.location}
                                </span>
                              )}
                              {item.ip && (
                                <span className="font-mono text-[10px]">
                                  {item.ip}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.fullContent, item.id)}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              title="কন্টেন্ট কপি করুন"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">কপি হয়েছে</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>কপি</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setPreviewPlan(item)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="পূর্ণাঙ্গ প্রিভিউ দেখুন"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>প্রিভিউ</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================= */}
              {/* TAB 3: DEVICE REPORT VIEW */}
              {/* ======================================================= */}
              {activeTab === 'devices' && (
                <div className="space-y-4">
                  {/* Ratio bar */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                      <span>ডিভাইস প্রকারের অনুপাত (Device Breakdown)</span>
                      <span className="text-[11px] text-slate-400">সর্বমোট {toBengaliDigits(metrics.totalSessionsCount)} টি সেশন থেকে</span>
                    </h4>

                    {/* Multi-segment Bar */}
                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                      <div 
                        style={{ width: `${metrics.desktopPct}%` }} 
                        className="bg-indigo-600 h-full transition-all" 
                        title={`কম্পিউটার: ${metrics.desktopPct}%`}
                      />
                      <div 
                        style={{ width: `${metrics.mobilePct}%` }} 
                        className="bg-teal-500 h-full transition-all" 
                        title={`মোবাইল: ${metrics.mobilePct}%`}
                      />
                      <div 
                        style={{ width: `${metrics.tabletPct}%` }} 
                        className="bg-amber-500 h-full transition-all" 
                        title={`ট্যাবলেট: ${metrics.tabletPct}%`}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-around text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-indigo-600" />
                        <span className="text-slate-700 dark:text-slate-300">ডেস্কটপ / ল্যাপটপ: {toBengaliDigits(metrics.desktopCount)} ({toBengaliDigits(metrics.desktopPct)}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-teal-500" />
                        <span className="text-slate-700 dark:text-slate-300">মোবাইল: {toBengaliDigits(metrics.mobileCount)} ({toBengaliDigits(metrics.mobilePct)}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-slate-700 dark:text-slate-300">ট্যাবলেট: {toBengaliDigits(metrics.tabletCount)} ({toBengaliDigits(metrics.tabletPct)}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Device List Table */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        স্বতন্ত্র ডিভাইসের তালিকা ({toBengaliDigits(uniqueDeviceSummaries.length)})
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        একই ডিভাইসের একাধিক ভিজিট সমন্বিত
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-3">ডিভাইস আইডি</th>
                            <th className="p-3">ধরন ও ওএস</th>
                            <th className="p-3">সর্বশেষ আইপি ও লোকেশন</th>
                            <th className="p-3 text-center">মোট ভিজিট</th>
                            <th className="p-3 text-center">মোট সময়</th>
                            <th className="p-3 text-center">তৈরি কাজ</th>
                            <th className="p-3 text-right">সর্বশেষ সক্রিয়</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                          {uniqueDeviceSummaries.map((dev) => (
                            <tr key={dev.deviceId} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors">
                              <td className="p-3 font-mono font-bold text-teal-700 dark:text-teal-300">
                                {dev.deviceId}
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-900 dark:text-white">{dev.deviceType}</div>
                                <div className="text-[10px] text-slate-400">{dev.os} • {dev.browser}</div>
                              </td>
                              <td className="p-3">
                                <div className="text-slate-800 dark:text-slate-200">{dev.latestLocation || 'বাংলাদেশ'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{dev.latestIp}</div>
                              </td>
                              <td className="p-3 text-center font-bold">
                                {toBengaliDigits(dev.totalSessions)} বার
                              </td>
                              <td className="p-3 text-center font-bold text-teal-700 dark:text-teal-400">
                                {formatDurationBn(dev.totalSeconds)}
                              </td>
                              <td className="p-3 text-center font-bold text-emerald-600">
                                {toBengaliDigits(dev.plansCreated)} টি
                              </td>
                              <td className="p-3 text-right text-[11px] text-slate-500">
                                {new Date(dev.lastSeen).toLocaleDateString('bn-BD', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FULL PREVIEW MODAL */}
        {/* ========================================================= */}
        {previewPlan && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {previewPlan.topicTitle || 'সম্পূর্ণ কন্টেন্ট প্রিভিউ'}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{previewPlan.gradeLevel}</span>
                    <span>•</span>
                    <span>{new Date(previewPlan.timestamp).toLocaleString('bn-BD')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(previewPlan.fullContent, 'preview_copy')}
                    className="px-2.5 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-100 hover:bg-teal-200 dark:bg-teal-950 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === 'preview_copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>কপি করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlan(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 text-xs leading-relaxed font-mono whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-950/50">
                {previewPlan.fullContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageHistoryModal;
