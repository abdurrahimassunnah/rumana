import React, { useState } from 'react';
import { 
  History, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  X, 
  Trash2, 
  Key, 
  BookOpen, 
  BookMarked,
  GraduationCap,
  Calendar,
  Layers,
  Sparkles,
  Tag,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { HistoryItem, SavedBook } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  savedBooks?: SavedBook[];
  onSelectHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory?: () => void;
  onSelectBook?: (book: SavedBook) => void;
  onDeleteBook?: (bookId: string) => void;
  onOpenUsageHistory?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  history, 
  savedBooks = [],
  onSelectHistory, 
  onDeleteHistory, 
  onClearHistory,
  onSelectBook,
  onDeleteBook,
  onOpenUsageHistory
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'books'>('books');
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [bookToDelete, setBookToDelete] = useState<SavedBook | null>(null);
  
  // Track open state of hierarchical accordion menus
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) {
      const trimmed = savedKey.trim();
      setApiKey(trimmed);
      setIsSaved(true);
      setValidationError('');
    }
  }, []);

  // Initialize all grades open by default if not set
  React.useEffect(() => {
    if (savedBooks.length > 0) {
      const initialGrades: Record<string, boolean> = {};
      const initialCats: Record<string, boolean> = {};
      savedBooks.forEach(b => {
        const grade = b.gradeLevel || 'সকল শ্রেণি';
        const cat = b.category || b.subject || 'সাধারণ বিষয় / অন্যান্য';
        initialGrades[grade] = true;
        initialCats[`${grade}___${cat}`] = true;
      });
      setExpandedGrades(prev => Object.keys(prev).length === 0 ? initialGrades : prev);
      setExpandedCategories(prev => Object.keys(prev).length === 0 ? initialCats : prev);
    }
  }, [savedBooks]);

  const toggleGrade = (grade: string) => {
    setExpandedGrades(prev => ({
      ...prev,
      [grade]: !prev[grade]
    }));
  };

  const toggleCategory = (grade: string, cat: string) => {
    const key = `${grade}___${cat}`;
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Group books hierarchically: Grade -> Category -> Books
  const hierarchicalBooks = React.useMemo(() => {
    const tree: Record<string, Record<string, SavedBook[]>> = {};
    savedBooks.forEach(book => {
      const grade = book.gradeLevel || 'সকল শ্রেণি';
      const cat = book.category || book.subject || 'সাধারণ বিষয় / অন্যান্য';
      
      if (!tree[grade]) {
        tree[grade] = {};
      }
      if (!tree[grade][cat]) {
        tree[grade][cat] = [];
      }
      tree[grade][cat].push(book);
    });
    return tree;
  }, [savedBooks]);

  const handleSaveKey = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      if (!trimmed.startsWith('AIzaSy') && !trimmed.startsWith('AQ.')) {
        setValidationError("জেমিনি এপিআই কী সাধারণত 'AIzaSy' অথবা 'AQ.' দিয়ে শুরু হতে হবে।");
        return;
      }
      localStorage.setItem('GEMINI_API_KEY', trimmed);
      setIsSaved(true);
      setValidationError('');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleDeleteKey = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    setApiKey('');
    setIsSaved(false);
    setValidationError('');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 sm:w-88 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col h-full shadow-xl lg:shadow-none`}>
        
        {/* Header & Tabs */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2 text-gray-800 dark:text-gray-100">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
                <BookMarked className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm block leading-tight">মাদরাসা লাইব্রেরি মেনু</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">শ্রেণি ও বিভাগভিত্তিক সংগঠন</span>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
            <button
              type="button"
              id="sidebar-tab-books"
              onClick={() => setActiveTab('books')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'books'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>শ্রেণি মেনু ({savedBooks.length})</span>
            </button>

            <button
              type="button"
              id="sidebar-tab-history"
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>কাজের ইতিহাস ({history.length})</span>
            </button>
          </div>

          {onOpenUsageHistory && (
            <button
              type="button"
              onClick={() => {
                onOpenUsageHistory();
                onClose();
              }}
              className="mt-2 w-full py-1.5 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/70 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-bold transition-all flex items-center justify-between shadow-2xs cursor-pointer"
              title="ব্যবহার পরিসংখ্যান, ডিভাইস ও আইপি হিস্ট্রি (PIN সুরক্ষিত)"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>ব্যবহার পরিসংখ্যান ও আইপি হিস্ট্রি</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 bg-teal-200/80 dark:bg-teal-800 rounded font-mono font-bold">PIN</span>
            </button>
          )}
        </div>

        {/* Tab 1: Hierarchical Class & Subject Book Menu */}
        {activeTab === 'books' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {savedBooks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 px-3">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">কোনো বই এখনো আপলোড করা নেই</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  যেকোনো বাংলা বা ইংরেজি পাঠ্যবই আপলোড করুন। বইটি স্বয়ংক্রিয়ভাবে তার নির্দিষ্ট শ্রেণি ও বিভাগের মেনুর অধীনে যুক্ত হবে।
                </p>
              </div>
            ) : (
              Object.entries(hierarchicalBooks).map(([grade, categories]) => {
                const isGradeExpanded = expandedGrades[grade] !== false;
                const totalGradeBooks = Object.values(categories).reduce((acc, bList) => acc + bList.length, 0);

                return (
                  <div key={grade} className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/90 shadow-2xs">
                    {/* Grade Level Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleGrade(grade)}
                      className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {grade}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {totalGradeBooks}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        {isGradeExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {/* Grade Sub-Categories Accordion */}
                    {isGradeExpanded && (
                      <div className="p-2 space-y-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20">
                        {Object.entries(categories).map(([category, booksList]) => {
                          const catKey = `${grade}___${category}`;
                          const isCatExpanded = expandedCategories[catKey] !== false;

                          return (
                            <div key={catKey} className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/90 overflow-hidden">
                              {/* Sub-category Header */}
                              <button
                                type="button"
                                onClick={() => toggleCategory(grade, category)}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-50/70 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Tag className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                    {category}
                                  </span>
                                  <span className="text-[9px] font-semibold text-slate-400">
                                    ({booksList.length})
                                  </span>
                                </div>
                                <div className="text-slate-400">
                                  {isCatExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </div>
                              </button>

                              {/* Books under this Category */}
                              {isCatExpanded && (
                                <div className="p-1.5 space-y-1.5">
                                  {booksList.map((book) => {
                                    const totalTopics = book.chapters?.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0) || 0;
                                    const langLabel = book.language === 'en' ? 'English' : book.language === 'ar' ? 'العربية' : 'বাংলা';
                                    const langBadgeColor = book.language === 'en' 
                                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300' 
                                      : book.language === 'ar' 
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300' 
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';

                                    return (
                                      <div key={book.id} className="relative group">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (onSelectBook) onSelectBook(book);
                                            if (window.innerWidth < 1024) onClose();
                                          }}
                                          className="w-full text-left bg-white dark:bg-slate-800 hover:bg-emerald-50/90 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-500 rounded-lg p-2 transition-all shadow-2xs pr-8 cursor-pointer"
                                        >
                                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${langBadgeColor}`}>
                                              <Globe className="w-2.5 h-2.5" />
                                              <span>{langLabel}</span>
                                            </span>
                                            <span className="text-[9px] font-medium text-slate-400">
                                              {book.chapters?.length || 0} অধ্যায় • {totalTopics} পাঠ
                                            </span>
                                          </div>

                                          <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                                            {book.title}
                                          </h5>

                                          <div className="flex items-center justify-between text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 pt-1 border-t border-slate-50 dark:border-slate-700/50">
                                            <span>মেনু থেকে বেছে নিন</span>
                                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                          </div>
                                        </button>

                                        {onDeleteBook && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setBookToDelete(book);
                                            }}
                                            className="absolute top-2 right-1.5 p-1 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                                            title="বইটি মুছে ফেলুন"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Completed Work History */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium">কোনো পূর্ববর্তী কাজের রেকর্ড নেই</p>
                <p className="text-[10px] text-slate-400 mt-1">অনুশীলনী বা পাঠ পরিকল্পনা তৈরি করলে তা এখানে স্থায়ীভাবে সংরক্ষিত হবে</p>
              </div>
            ) : (
              history.map((item) => {
                const getModeIcon = () => {
                  if (item.mode === 'exercise') return <BookOpen className="w-3.5 h-3.5 text-emerald-600" />;
                  if (item.mode === 'lesson_notes') return <Calendar className="w-3.5 h-3.5 text-blue-600" />;
                  return <GraduationCap className="w-3.5 h-3.5 text-teal-600" />;
                };

                const getModeLabel = () => {
                  if (item.mode === 'exercise') return 'অনুশীলনী';
                  if (item.mode === 'lesson_notes') return 'পাঠ পরিকল্পনা';
                  return 'বিস্তারিত প্ল্যান';
                };

                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => {
                        onSelectHistory(item);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className="w-full text-left bg-white dark:bg-gray-800/80 hover:bg-emerald-50/70 dark:hover:bg-gray-700/80 border border-gray-100 dark:border-gray-700/70 hover:border-emerald-200 dark:hover:border-emerald-600/50 rounded-xl p-3 transition-all shadow-xs hover:shadow-sm pr-9 cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/60 flex items-center gap-1 shrink-0">
                          {getModeIcon()}
                          <span>{getModeLabel()}</span>
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleDateString('bn-BD')}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-2 mb-1 leading-snug">
                        {item.previewText}
                      </h4>

                      <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 mt-1.5">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          {item.gradeLevel || 'সকল শ্রেণি'}
                        </span>
                        {item.exerciseData?.sections && (
                          <span className="ml-1 text-emerald-600">• {item.exerciseData.sections.length}টি বিভাগ</span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                      </div>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistory(item.id);
                      }}
                      className="absolute top-2.5 right-2 p-1 text-gray-300 dark:text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
            
            {history.length > 0 && onClearHistory && (
              <div className="pt-2 flex justify-center">
                <button
                  onClick={onClearHistory}
                  className="w-full py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>সব কাজের ইতিহাস মুছে ফেলুন</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Gemini API Key Settings Panel */}
        <div className="p-3.5 border-t border-gray-100 dark:border-gray-800 bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 mb-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-xs text-gray-700 dark:text-gray-300">জেমিনি এপিআই সেটিংস</span>
          </div>
          
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              স্ট্যাটিক হোস্টিং-এ রান করতে জেমিনি এপিআই কী দিন।
            </p>
            
            <div className="flex gap-1.5">
              <input
                type={isSaved ? "password" : "text"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="AIzaSy... অথবা AQ..."
                className="flex-1 px-2.5 py-1.5 text-[11px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono shadow-inner text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
              {isSaved ? (
                <button
                  onClick={handleDeleteKey}
                  className="px-2 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  সংরক্ষণ
                </button>
              )}
            </div>
            {isSaved && (
              <div className="flex items-center space-x-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>সফলভাবে সংরক্ষিত হয়েছে!</span>
              </div>
            )}
            {validationError && (
              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium leading-normal mt-1 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-md border border-rose-100 dark:border-rose-900/60">
                {validationError}
              </div>
            )}
          </div>
        </div>

        <div className="p-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">সব কাজ ও সূচিপত্র ক্লাউড এবং ব্রাউজারে স্থায়ীভাবে সংরক্ষিত</p>
        </div>
      </div>

      {/* Book Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  বই মুছে ফেলতে চান?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  লাইব্রেরি থেকে স্থায়ীভাবে মুছে যাবে
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                আপনি কি নিশ্চিতভাবে <span className="font-bold text-slate-900 dark:text-white">"{bookToDelete.title}"</span> বইটি মুছে ফেলতে চান?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteBook && bookToDelete) {
                    onDeleteBook(bookToDelete.id);
                  }
                  setBookToDelete(null);
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
    </>
  );
};

export default Sidebar;
