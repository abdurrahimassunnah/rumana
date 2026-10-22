
import React from 'react';
import { BookOpen, Menu, LogIn, LogOut, User as UserIcon, Sun, Moon, ShieldCheck } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  onMenuClick: () => void;
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenUsageHistory?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  user, 
  onLogin, 
  onLogout,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenUsageHistory
}) => {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm transition-colors duration-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Left Side: Menu Button */}
        <div className="flex-1 flex items-center">
          <button 
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open History"
            title="পূর্ববর্তী কাজ দেখুন"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Center: Brand Identity */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center overflow-hidden w-11 h-11 relative">
              <img 
                src="https://madrasatussunnah.org/wp-content/uploads/cropped-logo-192x192.png" 
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.includes('cropped-logo')) {
                    target.src = 'https://madrasatussunnah.org/favicon.ico';
                  } else {
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.fallback-icon');
                      if (fallback) fallback.classList.remove('hidden');
                    }
                  }
                }}
                className="w-9 h-9 object-contain"
                alt="মাদরাসাতুস সুন্নাহ"
                referrerPolicy="no-referrer"
              />
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fallback-icon hidden" />
            </div>
            <div className="flex flex-col items-start">
              <h1 className="text-xl font-bold font-sans text-gray-900 dark:text-white leading-tight">মাদরাসাতুস সুন্নাহ</h1>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">এআই শিক্ষা সহায়ক</span>
            </div>
          </div>
        </div>

        {/* Right Side: Theme Toggle & Firebase User Profile / Auth Button */}
        <div className="flex-1 flex items-center justify-end space-x-2">
          {/* Usage Analytics / Admin History Button */}
          {onOpenUsageHistory && (
            <button
              onClick={onOpenUsageHistory}
              className="px-2.5 py-1.5 rounded-xl text-teal-800 dark:text-teal-200 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/70 dark:hover:bg-teal-900 border border-teal-200/90 dark:border-teal-800/80 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              title="ব্যবহার পরিসংখ্যান ও অ্যাক্টিভিটি হিস্ট্রি (PIN সুরক্ষিত)"
            >
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="hidden sm:inline">ব্যবহার হিস্ট্রি</span>
            </button>
          )}

          {/* Theme Switcher Button */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-gray-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
              title={isDarkMode ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>
          )}

          {user ? (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{user.displayName || 'শিক্ষক'}</span>
                <span className="text-gray-500 dark:text-gray-400 text-[10px]">{user.email}</span>
              </div>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Profile'} 
                  className="w-8 h-8 rounded-full border border-emerald-200 dark:border-emerald-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="লগআউট"
                  className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            onLogin && (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>লগইন</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
