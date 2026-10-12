import React, { useState, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  ChevronDown,
  Check, 
  Layers, 
  Bookmark, 
  FileText, 
  Sparkles,
  Tag,
  Upload,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
  FileCheck,
  Plus,
  LayoutGrid,
  List,
  FolderOpen,
  Trash2,
  Edit3,
  CheckCircle2,
  GraduationCap,
  FileSpreadsheet,
  X,
  ArrowRight,
  BookMarked,
  Link as LinkIcon,
  Merge
} from 'lucide-react';
import { TOCChapter, TOCTopic, SavedBook, BOOK_CATEGORIES, ALL_GRADE_LEVELS, GradeLevel } from '../types';
import { MADRASAH_CLASS_5_TOC } from '../constants/madrasahBookData';
import { normalizeChapters } from '../utils/tocNormalizer';
import { generateChapterSubheadings } from '../services/geminiService';

export const normalizeBanglaSearch = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u09AF\u09BC/g, '\u09DF') // nukta ya -> ya (য়)
    .replace(/\u09A1\u09BC/g, '\u09DC') // nukta da -> ra (ড়)
    .replace(/\u09A2\u09BC/g, '\u09DD') // nukta dha -> rha (ঢ়)
    .replace(/াএ/g, 'ায়ে') // normalize এ vs য়ে after akar (মাসায়েল vs মাসায়েল)
    .replace(/ায়ে/g, 'ায়ে')
    .replace(/্/g, '') // strip virama
    .replace(/\s+/g, ' ')
    .trim();
};

interface TOCSelectorProps {
  chapters?: TOCChapter[] | null;
  bookTitle?: string;
  savedBooks?: SavedBook[];
  onSelectSavedBook?: (book: SavedBook) => void;
  onUpdateSavedBook?: (book: SavedBook) => void;
  onDeleteSavedBook?: (bookId: string) => void;
  selectedChapter?: TOCChapter | null;
  selectedTopic?: TOCTopic | null;
  selectedTopics?: TOCTopic[]; // For multi-select
  onSelectTopic?: (chapter: TOCChapter, topic: TOCTopic) => void;
  onToggleTopic?: (chapter: TOCChapter, topic: TOCTopic) => void;
  onSelectFullChapter?: (chapter: TOCChapter) => void;
  onSelectMultipleTopics?: (topics: TOCTopic[], chapter?: TOCChapter) => void;
  onClearAllSelected?: () => void;
  onUploadPdf?: (files: File | File[]) => void;
  isExtractingPdf?: boolean;
  extractionProgress?: string;
  accentColor?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'teal';
  title?: string;
  compact?: boolean;
  allowMultiSelect?: boolean;
}

// Helper to determine category badge color styling
export const getCategoryBadgeStyle = (category?: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('কুরআন') || cat.includes('তাফসির') || cat.includes('তাজবীদ')) {
    return {
      bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500'
    };
  }
  if (cat.includes('হাদিস') || cat.includes('উসুল')) {
    return {
      bg: 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      dot: 'bg-teal-500'
    };
  }
  if (cat.includes('আকাইদ') || cat.includes('ফিকহ') || cat.includes('ইসলামিক')) {
    return {
      bg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      dot: 'bg-indigo-500'
    };
  }
  if (cat.includes('সিরাত') || cat.includes('ইতিহাস')) {
    return {
      bg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500'
    };
  }
  if (cat.includes('আরবি') || cat.includes('নাহু') || cat.includes('সরফ')) {
    return {
      bg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      dot: 'bg-sky-500'
    };
  }
  if (cat.includes('ইংরেজি') || cat.includes('english') || cat.includes('literacy')) {
    return {
      bg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-500'
    };
  }
  if (cat.includes('বাংলা') || cat.includes('সাহিত্য')) {
    return {
      bg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500'
    };
  }
  if (cat.includes('গণিত') || cat.includes('হিসাব')) {
    return {
      bg: 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      dot: 'bg-orange-500'
    };
  }
  if (cat.includes('বিজ্ঞান')) {
    return {
      bg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500'
    };
  }
  return {
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-500'
  };
};

export const TOCSelector: React.FC<TOCSelectorProps> = ({
  chapters = [],
  bookTitle,
  savedBooks = [],
  onSelectSavedBook,
  onUpdateSavedBook,
  onDeleteSavedBook,
  selectedChapter,
  selectedTopic,
  selectedTopics = [],
  onSelectTopic,
  onToggleTopic,
  onSelectFullChapter,
  onSelectMultipleTopics,
  onClearAllSelected,
  onUploadPdf,
  isExtractingPdf = false,
  extractionProgress = '',
  accentColor = 'emerald',
  title = 'বইয়ের সূচিপত্র থেকে অধ্যায় ও বিষয় নির্বাচন করুন',
  compact = false,
  allowMultiSelect = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subTopicSearch, setSubTopicSearch] = useState('');
  const [viewMode, setViewMode] = useState<'nested' | 'columns'>('columns');
  const [isBookMenuOpen, setIsBookMenuOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<SavedBook | null>(null);

  // Edit category/purpose states
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<string>('কুরআন ও তাফসির');
  const [editGrade, setEditGrade] = useState<string>('পঞ্চম শ্রেণি');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAllInActiveChapter, setShowAllInActiveChapter] = useState(false);

  // Find currently active book in savedBooks if available
  const currentSavedBook = useMemo(() => {
    if (!bookTitle && (!savedBooks || savedBooks.length === 0)) return null;
    return savedBooks.find(b => b.title === bookTitle || b.chapters === chapters) || (savedBooks.length > 0 ? savedBooks[0] : null);
  }, [savedBooks, bookTitle, chapters]);

  const [isGeneratingSubheadings, setIsGeneratingSubheadings] = useState(false);
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(null);

  const activeChapters = useMemo(() => {
    if (chapters && chapters.length > 0) return normalizeChapters(chapters);
    if (currentSavedBook && currentSavedBook.chapters && currentSavedBook.chapters.length > 0) return normalizeChapters(currentSavedBook.chapters);
    return normalizeChapters(MADRASAH_CLASS_5_TOC);
  }, [chapters, currentSavedBook]);

  // Effective book display title and category/purpose
  const displayTitle = useMemo(() => {
    if (bookTitle) return bookTitle;
    if (currentSavedBook?.title) return currentSavedBook.title;
    return 'পাঠ্যবইয়ের সূচিপত্র';
  }, [bookTitle, currentSavedBook]);

  const displayCategory = useMemo(() => {
    if (currentSavedBook?.category) return currentSavedBook.category;
    if (currentSavedBook?.subject) return currentSavedBook.subject;
    // Auto-detect purpose from title
    const t = displayTitle.toLowerCase();
    if (t.includes('কুরআন') || t.includes('তাজবীদ')) return 'কুরআন ও তাফসির';
    if (t.includes('হাদিস')) return 'হাদিস ও উসুল';
    if (t.includes('আকাইদ') || t.includes('ফিকহ') || t.includes('ইসলামিক')) return 'আকাইদ ও ফিকহ';
    if (t.includes('সিরাত')) return 'সিরাত ও ইতিহাস';
    if (t.includes('আরবি')) return 'আরবি ভাষা ও ব্যাকরণ';
    if (t.includes('english') || t.includes('literacy')) return 'ইংরেজি (English)';
    if (t.includes('বাংলা')) return 'বাংলা';
    if (t.includes('গণিত')) return 'গণিত';
    return 'সাধারণ ও ইসলামিক বিষয়';
  }, [currentSavedBook, displayTitle]);

  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
    if (selectedChapter && selectedChapter.id) return selectedChapter.id;
    if (activeChapters.length > 0) return activeChapters[0].id;
    return '';
  });

  // Track expanded chapters in nested view
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    activeChapters.forEach((ch, idx) => {
      initial[ch.id] = idx === 0 || activeChapters.length <= 4;
    });
    return initial;
  });

  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapterIds(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  // Sync active chapter if chapters change
  React.useEffect(() => {
    if (activeChapters.length > 0) {
      if (!activeChapters.some(c => c.id === activeChapterId)) {
        setActiveChapterId(activeChapters[0].id);
      }
    }
  }, [activeChapters, activeChapterId]);

  React.useEffect(() => {
    if (selectedChapter && selectedChapter.id) {
      setActiveChapterId(selectedChapter.id);
    }
  }, [selectedChapter]);

  // Reset subTopicSearch and showAll state when changing active chapter
  React.useEffect(() => {
    setSubTopicSearch('');
    setShowAllInActiveChapter(false);
  }, [activeChapterId]);

  // Filter TOC based on search query with Bangla tolerance
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) {
      return activeChapters;
    }
    const qNorm = normalizeBanglaSearch(searchQuery);
    return activeChapters.map(ch => {
      const chTitleNorm = normalizeBanglaSearch(ch.title);
      const chArabicNorm = normalizeBanglaSearch(ch.arabicTitle || '');
      const chMatch = chTitleNorm.includes(qNorm) || chArabicNorm.includes(qNorm);

      const matchingTopics = (ch.topics || []).filter(t => {
        const tTitleNorm = normalizeBanglaSearch(t.title);
        const tExcerptNorm = normalizeBanglaSearch(t.contentExcerpt || '');
        return tTitleNorm.includes(qNorm) || tExcerptNorm.includes(qNorm);
      });

      // CRITICAL FIX: If the chapter title itself matched the user's search
      // (e.g. user searched for "মাসায়েল" or "মাসায়েল" or "আহকাম"),
      // keep all its subheadings so the user can see everything!
      const finalTopics = chMatch ? (ch.topics || []) : matchingTopics;

      return {
        ...ch,
        topics: finalTopics,
        matchedByChapterTitle: chMatch,
        matchingTopicsCount: matchingTopics.length
      };
    }).filter(ch => (ch.topics && ch.topics.length > 0) || (ch as any).matchedByChapterTitle);
  }, [activeChapters, searchQuery]);

  // Unabridged active chapter (contains all topics without search exclusion)
  const fullCurrentChapter = useMemo(() => {
    return activeChapters.find(ch => ch.id === activeChapterId) || activeChapters[0] || null;
  }, [activeChapters, activeChapterId]);

  // Current active chapter to display topics from
  const currentChapter = useMemo(() => {
    return filteredChapters.find(ch => ch.id === activeChapterId) || filteredChapters[0] || fullCurrentChapter || null;
  }, [filteredChapters, activeChapterId, fullCurrentChapter]);

  const handleGenerateSubheadingsForChapter = async (chapter: TOCChapter) => {
    if (!chapter) return;
    setIsGeneratingSubheadings(true);
    setGeneratingChapterId(chapter.id);
    try {
      const generated = await generateChapterSubheadings({
        chapterTitle: chapter.title,
        bookTitle: displayTitle,
        category: displayCategory,
        gradeLevel: currentSavedBook?.gradeLevel || 'পঞ্চম শ্রেণি',
        startPage: chapter.startPage,
        endPage: chapter.endPage,
        count: 4
      });

      if (generated && generated.length > 0) {
        const updatedChapters = activeChapters.map(c => {
          if (c.id === chapter.id) {
            return {
              ...c,
              topics: generated
            };
          }
          return c;
        });

        if (currentSavedBook && onUpdateSavedBook) {
          onUpdateSavedBook({
            ...currentSavedBook,
            chapters: updatedChapters
          });
        }
      }
    } catch (err) {
      console.error("Failed to generate subheadings for chapter:", err);
    } finally {
      setIsGeneratingSubheadings(false);
      setGeneratingChapterId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadPdf) {
      const filesArray = Array.from(e.target.files);
      onUploadPdf(filesArray.length === 1 ? filesArray[0] : filesArray);
      setIsBookMenuOpen(false);
    }
    // reset input value so re-uploading the same file works
    e.target.value = '';
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onUploadPdf) {
      const filesArray = Array.from(e.dataTransfer.files);
      onUploadPdf(filesArray.length === 1 ? filesArray[0] : filesArray);
    }
  };

  const handleOpenCategoryEdit = () => {
    setEditTitle(displayTitle);
    setEditCategory(currentSavedBook?.category || currentSavedBook?.subject || displayCategory);
    setEditGrade(currentSavedBook?.gradeLevel || GradeLevel.Grade5);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryEdit = () => {
    if (currentSavedBook && onUpdateSavedBook) {
      const updated: SavedBook = {
        ...currentSavedBook,
        title: editTitle.trim() || currentSavedBook.title,
        category: editCategory,
        subject: editCategory,
        gradeLevel: editGrade,
        updatedAt: Date.now()
      };
      onUpdateSavedBook(updated);
    }
    setIsCategoryModalOpen(false);
  };

  const isTopicChecked = (topicId: string) => {
    if (selectedTopics && selectedTopics.length > 0) {
      return selectedTopics.some(t => t.id === topicId);
    }
    if (selectedTopic && selectedTopic.id === topicId) return true;
    return false;
  };

  const isChapterFullySelected = (chapter: TOCChapter) => {
    if (!chapter.topics || chapter.topics.length === 0) return false;
    return chapter.topics.every(t => isTopicChecked(t.id));
  };

  const isChapterPartiallySelected = (chapter: TOCChapter) => {
    if (!chapter.topics || chapter.topics.length === 0) return false;
    const count = chapter.topics.filter(t => isTopicChecked(t.id)).length;
    return count > 0 && count < chapter.topics.length;
  };

  // Toggle all topics of a chapter
  const handleToggleChapter = (chapter: TOCChapter) => {
    if (!chapter.topics || chapter.topics.length === 0) {
      if (onSelectFullChapter) onSelectFullChapter(chapter);
      return;
    }

    const fullySelected = isChapterFullySelected(chapter);

    if (onSelectMultipleTopics) {
      if (fullySelected) {
        const chTopicIds = new Set(chapter.topics.map(t => t.id));
        const remaining = selectedTopics.filter(t => !chTopicIds.has(t.id));
        onSelectMultipleTopics(remaining, chapter);
      } else {
        const existingIds = new Set(selectedTopics.map(t => t.id));
        const toAdd = chapter.topics.filter(t => !existingIds.has(t.id));
        onSelectMultipleTopics([...selectedTopics, ...toAdd], chapter);
      }
    } else if (onSelectFullChapter) {
      onSelectFullChapter(chapter);
    } else if (onToggleTopic) {
      chapter.topics.forEach(t => {
        if (fullySelected) {
          if (isTopicChecked(t.id)) onToggleTopic(chapter, t);
        } else {
          if (!isTopicChecked(t.id)) onToggleTopic(chapter, t);
        }
      });
    }
  };

  // Select all chapters and subheadings
  const handleSelectAllInBook = () => {
    const allTopics = activeChapters.flatMap(c => c.topics || []);
    if (onSelectMultipleTopics) {
      onSelectMultipleTopics(allTopics, activeChapters[0]);
    } else if (onSelectFullChapter) {
      activeChapters.forEach(c => {
        if (!isChapterFullySelected(c)) onSelectFullChapter(c);
      });
    }
  };

  // List of all chapters that currently have selected topics
  const selectedChaptersWithTopics = useMemo(() => {
    return activeChapters.filter(ch => 
      (selectedTopic && ch.topics?.some(t => t.id === selectedTopic.id)) ||
      (selectedTopics && selectedTopics.some(st => ch.topics?.some(t => t.id === st.id)))
    );
  }, [activeChapters, selectedTopic, selectedTopics]);

  // Combine dialog state
  const [isCombineModalOpen, setIsCombineModalOpen] = useState(false);
  const [combineSelectedChapterIds, setCombineSelectedChapterIds] = useState<string[]>([]);
  const [combineSelectedTopicIds, setCombineSelectedTopicIds] = useState<string[]>([]);

  const handleOpenCombineModal = () => {
    const preselectedChapterIds = selectedChaptersWithTopics.map(c => c.id);
    const preselectedTopicIds = selectedTopics.map(t => t.id);
    setCombineSelectedChapterIds(preselectedChapterIds.length > 0 ? preselectedChapterIds : (activeChapters.slice(0, 2).map(c => c.id)));
    setCombineSelectedTopicIds(preselectedTopicIds);
    setIsCombineModalOpen(true);
  };

  const handleToggleCombineChapter = (chId: string) => {
    setCombineSelectedChapterIds(prev => 
      prev.includes(chId) ? prev.filter(id => id !== chId) : [...prev, chId]
    );
  };

  const handleToggleCombineTopic = (topicId: string) => {
    setCombineSelectedTopicIds(prev =>
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  };

  const handleApplyCombine = () => {
    if (combineSelectedChapterIds.length === 0 && combineSelectedTopicIds.length === 0) {
      setIsCombineModalOpen(false);
      return;
    }

    const chosenChapters = activeChapters.filter(c => combineSelectedChapterIds.includes(c.id));
    
    // Trigger chapter selections
    chosenChapters.forEach(ch => {
      if (onSelectFullChapter) {
        onSelectFullChapter(ch);
      }
    });

    // Also trigger individually chosen topics
    if (onToggleTopic) {
      activeChapters.forEach(ch => {
        ch.topics?.forEach(t => {
          if (combineSelectedTopicIds.includes(t.id) && !isTopicChecked(t.id)) {
            onToggleTopic(ch, t);
          }
        });
      });
    }

    setIsCombineModalOpen(false);
  };

  // Total topics count across all chapters
  const totalTopicsCount = useMemo(() => {
    return activeChapters.reduce((acc, ch) => acc + (ch.topics?.length || 0), 0);
  }, [activeChapters]);

  const catStyle = getCategoryBadgeStyle(displayCategory);

  return (
    <div className="space-y-4" id="master-toc-container">
      {/* Hidden File Input for fast multi-file upload */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isExtractingPdf}
      />

      {/* TOP MASTER BAR: Current Book Identity + Purpose Category Badge + Book Switcher Dropdown + Fast Upload */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Active Book Info & Purpose Tag */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  সক্রিয় বই ও পাঠ্যসূচি:
                </span>
                
                {/* Purpose / Category Badge */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${catStyle.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`}></span>
                  <span>{displayCategory}</span>
                </div>

                {/* Edit Category / Purpose Trigger */}
                {currentSavedBook && onUpdateSavedBook && (
                  <button
                    type="button"
                    onClick={handleOpenCategoryEdit}
                    className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                    title="বইয়ের বিষয় বা ক্যাটাগরি পরিবর্তন করুন"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
                  {displayTitle}
                </h3>

                {activeChapters.length > 0 && (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {activeChapters.length}টি অধ্যায় • {totalTopicsCount}টি পাঠ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Book Switcher Menu & Fast File Upload Button */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
            {/* Book Switcher Dropdown Button */}
            {savedBooks && savedBooks.length > 0 && onSelectSavedBook && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBookMenuOpen(prev => !prev)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <BookMarked className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>অন্য বই বেছে নিন ({savedBooks.length})</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBookMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu of Saved Books */}
                {isBookMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsBookMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-2.5 space-y-1.5 max-h-96 overflow-y-auto">
                      <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                          সংরক্ষিত বইসমূহ (লাইব্রেরি)
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          ক্লিক করে সক্রিয় করুন
                        </span>
                      </div>

                      <div className="space-y-1 mt-1">
                        {savedBooks.map((book) => {
                          const isCurrent = book.title === displayTitle;
                          const bookCat = book.category || book.subject || 'সাধারণ ও ইসলামিক বিষয়';
                          const bStyle = getCategoryBadgeStyle(bookCat);
                          const chCount = book.chapters?.length || 0;

                          return (
                            <div
                              key={book.id}
                              onClick={() => {
                                onSelectSavedBook(book);
                                setIsBookMenuOpen(false);
                              }}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                                isCurrent
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/80 text-emerald-950 dark:text-emerald-100 shadow-2xs'
                                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/70 hover:bg-emerald-50/40 hover:border-emerald-300 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${bStyle.bg}`}>
                                    {bookCat}
                                  </span>
                                  {book.gradeLevel && (
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                      • {book.gradeLevel}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold truncate">
                                  {book.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {chCount}টি অধ্যায় {book.pageCount ? `• ${book.pageCount} পৃষ্ঠা` : ''}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 self-center">
                                {isCurrent ? (
                                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                                    <Check className="w-3 h-3" /> সক্রিয়
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectSavedBook(book);
                                      setIsBookMenuOpen(false);
                                    }}
                                    className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-700 hover:bg-emerald-600 hover:text-white rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                                  >
                                    নির্বাচন
                                  </button>
                                )}

                                {onDeleteSavedBook && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBookToDelete(book);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Upload inside dropdown */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ নতুন ফাইল / বই আপলোড করুন</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Direct Upload Button */}
            {onUploadPdf && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtractingPdf}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isExtractingPdf
                    ? 'bg-emerald-700 text-white opacity-70 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
                }`}
                title="নতুন PDF, Word, Excel বা টেক্সট ফাইল আপলোড করুন"
              >
                {isExtractingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>বিশ্লেষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ বই / ফাইল আপলোড</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Real-time Extraction Status Banner */}
        {isExtractingPdf && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">ফাইল প্রসেসিং চলছে: </span>
              <span>{extractionProgress || "সূচিপত্র ও অধ্যায়সমূহ দ্রুত সাজানো হচ্ছে..."}</span>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Edit Book Category & Purpose */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                বইয়ের বিষয় ও ক্যাটাগরি নির্ধারণ
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বইয়ের নাম / শিরোনাম
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বিষয় / উদ্দেশ্য (Purpose / Category)
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {BOOK_CATEGORIES.map((cat) => {
                    const isSelected = editCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditCategory(cat)}
                        className={`p-2 rounded-xl text-xs font-bold border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  শ্রেণি (Grade Level)
                </label>
                <select
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
                >
                  {ALL_GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveCategoryEdit}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Combine 2+ Chapters or Headings */}
      {isCombineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Merge className="w-4 h-4 text-emerald-600" />
                  একাধিক অধ্যায় বা শিরোনাম একত্রিত করুন (Combine)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  একসাথে ২টি বা ততোধিক অধ্যায়/শিরোনাম নির্বাচন করে সমন্বিত প্রশ্ন বা পাঠ পরিকল্পনা তৈরি করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCombineModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 2-Chapter Combiner presets */}
            {activeChapters.length >= 2 && (
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  দ্রুত ২টি অধ্যায় একত্রিত করার শর্টকাট:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeChapters.slice(0, Math.min(activeChapters.length - 1, 3)).map((ch, idx) => {
                    const nextCh = activeChapters[idx + 1];
                    if (!nextCh) return null;
                    const isCombined = combineSelectedChapterIds.includes(ch.id) && combineSelectedChapterIds.includes(nextCh.id);
                    return (
                      <button
                        key={`${ch.id}-${nextCh.id}`}
                        type="button"
                        onClick={() => {
                          setCombineSelectedChapterIds([ch.id, nextCh.id]);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isCombined
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span className="truncate max-w-[180px]">{ch.title} + {nextCh.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chapter Selection Checklist */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                যে অধ্যায়গুলো একত্রিত করতে চান তা টিক দিন ({combineSelectedChapterIds.length}টি অধ্যায় নির্বাচিত):
              </label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {activeChapters.map((ch) => {
                  const isChecked = combineSelectedChapterIds.includes(ch.id);
                  const topicCount = ch.topics?.length || 0;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => handleToggleCombineChapter(ch.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-500 text-slate-900 dark:text-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate">{ch.title}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {topicCount}টি পাঠ • পৃষ্ঠা {ch.startPage}-{ch.endPage}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-white dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 shrink-0">
                        পৃ: {ch.startPage}-{ch.endPage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                মোট {combineSelectedChapterIds.length}টি অধ্যায় একত্রিত করা হবে
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCombineModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleApplyCombine}
                  disabled={combineSelectedChapterIds.length === 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-2xs flex items-center gap-1.5"
                >
                  <Merge className="w-3.5 h-3.5" />
                  <span>একত্রিত সিলেকশন প্রয়োগ করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If no chapters are loaded yet (empty state) */}
      {activeChapters.length === 0 ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDropFile}
          className={`p-8 md:p-10 border-2 border-dashed rounded-2xl text-center flex flex-col items-center justify-center gap-4 transition-all ${
            isDraggingFile 
              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 scale-[1.01]' 
              : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              কোনো বই বা ফাইল বর্তমানে লোড করা নেই
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              যেকোনো বিষয়ের পাঠ্যবইয়ের ফাইল (PDF, Word, Excel বা Text) এখানে আপলোড করুন। প্রধান অধ্যায় এবং অধ্যায়ের ভেতরের সকল উপশিরোনাম সমন্বিতভাবে সংরক্ষিত থাকবে।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtractingPdf}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all ${
                isExtractingPdf
                  ? 'bg-emerald-700 text-white opacity-70 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
              }`}
            >
              {isExtractingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{extractionProgress || "সূচিপত্র বিশ্লেষণ হচ্ছে..."}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>+ পাঠ্যবই / ফাইল আপলোড করুন (PDF/DOCX/Excel)</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* CHAPTERS & TOPICS NAVIGATION */
        <div className="space-y-3">
          {/* Sub-header Controls: View Mode Toggle, Combine Tool & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('nested')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'nested'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                  title="হেডিং ও সাব-হেডিং সমন্বিত তালিকা"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>সমন্বিত ভিউ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('columns')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'columns'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                  title="২-কলাম বিভাজন ভিউ"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>২-কলাম ভিউ</span>
                </button>
              </div>

              {/* Combine 2+ Chapters / Headings Button */}
              {allowMultiSelect && (
                <button
                  type="button"
                  onClick={handleOpenCombineModal}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="২ বা ততোধিক অধ্যায় অথবা শিরোনাম একসাথে সমন্বিতভাবে নির্বাচন করুন"
                >
                  <Merge className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>অধ্যায় বা শিরোনাম একত্রিত করুন</span>
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="অধ্যায় বা পাঠ খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowAllInActiveChapter(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="অনুসন্ধান মুছুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* COMBINED SELECTION BANNER: Displays active multi-chapter / multi-topic selection */}
          {selectedChaptersWithTopics.length >= 2 && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 via-emerald-50 to-teal-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-emerald-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1 rounded-md bg-indigo-600 text-white shrink-0">
                  <Merge className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  সমন্বিত অধ্যায় নির্বাচন ({selectedChaptersWithTopics.length}টি অধ্যায় একত্রিত):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedChaptersWithTopics.map((ch) => (
                    <span
                      key={ch.id}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 shadow-2xs"
                    >
                      <BookOpen className="w-3 h-3 text-indigo-500" />
                      <span>{ch.title}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCombineModal}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 hover:underline cursor-pointer"
                >
                  + আরও পরিবর্তন করুন
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 1: UNIFIED NESTED ACCORDION (HEADING ENCAPSULATES ALL SUBHEADINGS) */}
          {viewMode === 'nested' && (
            <div className="space-y-3">
              {filteredChapters.map((chapter, chIdx) => {
                const isExpanded = expandedChapterIds[chapter.id] ?? true;
                const isFullSelected = isChapterFullySelected(chapter);
                const isPartialSelected = isChapterPartiallySelected(chapter);
                const topicCount = chapter.topics?.length || 0;

                return (
                  <div
                    key={chapter.id}
                    id={`nested-chapter-card-${chapter.id}`}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isFullSelected
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-500/80 dark:border-emerald-600 shadow-sm'
                        : isPartialSelected
                        ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {/* Main Heading Header (প্রধান অধ্যায়/শিরোনাম) */}
                    <div 
                      className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isFullSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:bg-emerald-50/70'
                      }`}
                      onClick={() => toggleChapterExpand(chapter.id)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChapterExpand(chapter.id);
                          }}
                          className="p-1 rounded-md hover:bg-black/10 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isFullSelected 
                                ? 'bg-emerald-700 text-emerald-100' 
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            }`}>
                              অধ্যায় {chIdx + 1}
                            </span>

                            <h4 className="text-sm font-bold truncate">
                              {chapter.title}
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                          isFullSelected 
                            ? 'bg-emerald-700 text-emerald-100' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          পৃষ্ঠা {chapter.startPage}-{chapter.endPage}
                        </span>

                        <span className={`text-xs font-semibold ${isFullSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                          ({topicCount}টি পাঠ)
                        </span>

                        {/* Select Entire Heading Button */}
                        {onSelectFullChapter && (
                          <button
                            type="button"
                            onClick={() => onSelectFullChapter(chapter)}
                            className={`text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 ${
                              isFullSelected
                                ? 'bg-white text-emerald-800 hover:bg-emerald-50'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            title="এই অধ্যায়ের সকল পাঠ নির্বাচন করুন"
                          >
                            {isFullSelected ? (
                              <>
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>অধ্যায় নির্বাচিত</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5" />
                                <span>পুরো অধ্যায় নির্বাচন</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subheadings Container (উপশিরোনাম/পাঠসমূহ - strictly nested inside this Heading) */}
                    {isExpanded && (
                      <div className="p-3.5 bg-slate-50/40 dark:bg-slate-900/40 space-y-2">
                        {topicCount === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400">
                            এই অধ্যায়ে কোনো আলাদা উপশিরোনাম তালিকাভুক্ত নেই। পুরো অধ্যায় হিসেবেই কাজ করা হবে।
                          </div>
                        ) : (
                          chapter.topics.map((topic, tIdx) => {
                            const isChecked = isTopicChecked(topic.id);
                            const isSingleSelected = selectedTopic && selectedTopic.id === topic.id;
                            const displayNumber = topic.topicNumber || `${tIdx + 1}`;

                            return (
                              <div
                                key={topic.id}
                                id={`nested-topic-${topic.id}`}
                                onClick={() => {
                                  if (allowMultiSelect && onToggleTopic) {
                                    onToggleTopic(chapter, topic);
                                  } else if (onSelectTopic) {
                                    onSelectTopic(chapter, topic);
                                  }
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                  isChecked || isSingleSelected
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-600 ring-1 ring-emerald-500/30 text-slate-900 dark:text-slate-100 shadow-2xs'
                                    : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 hover:bg-emerald-50/30 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                    isChecked || isSingleSelected
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  }`}>
                                    {displayNumber}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                      {topic.title}
                                    </h5>

                                    {topic.contentExcerpt && (
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                        {topic.contentExcerpt}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                    পৃ: {topic.pageNumber}{topic.endPageNumber ? `-${topic.endPageNumber}` : ''}
                                  </span>

                                  {allowMultiSelect ? (
                                    <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                      isChecked
                                        ? 'bg-emerald-600 text-white'
                                        : 'border border-slate-300 dark:border-slate-600'
                                    }`}>
                                      {isChecked && <Check className="w-3 h-3" />}
                                    </div>
                                  ) : (
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      isSingleSelected
                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                        : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                      {isSingleSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: TWO-COLUMN SIDE-BY-SIDE SPLIT VIEW */}
          {viewMode === 'columns' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
              {/* Left Column: Chapters / Main Headings */}
              <div className="md:col-span-5 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between pb-1 px-1">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    প্রধান অধ্যায়সমূহ ({filteredChapters.length})
                  </div>
                  {allowMultiSelect && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllInBook}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        title="বইয়ের সকল অধ্যায় ও পাঠ নির্বাচন করুন"
                      >
                        সব সিলেক্ট
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onClearAllSelected) {
                            onClearAllSelected();
                          } else if (onSelectMultipleTopics) {
                            onSelectMultipleTopics([]);
                          }
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                        title="সব সিলেকশন বাতিল করুন"
                      >
                        ক্লিয়ার
                      </button>
                    </div>
                  )}
                </div>

                {filteredChapters.map((ch, idx) => {
                  const isActive = currentChapter?.id === ch.id;
                  const isFull = isChapterFullySelected(ch);
                  const isPartial = isChapterPartiallySelected(ch);
                  const topicCount = ch.topics?.length || 0;

                  return (
                    <div
                      key={ch.id}
                      onClick={() => setActiveChapterId(ch.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/20 text-slate-900 dark:text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold truncate">
                            {ch.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {topicCount}টি পাঠ • পৃ: {ch.startPage}-{ch.endPage}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Chapter Checkbox for One-Click Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleChapter(ch);
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all border cursor-pointer ${
                          isFull
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : isPartial
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 text-transparent hover:text-slate-300'
                        }`}
                        title={isFull ? 'অধ্যায়ের সকল পাঠ আনসিলেক্ট করুন' : 'এই অধ্যায়ের সকল পাঠ সিলেক্ট করুন'}
                      >
                        {isFull ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : isPartial ? (
                          <span className="w-2 h-2 rounded-xs bg-emerald-600" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Topics / Subheadings of Selected Chapter */}
              <div className="md:col-span-7 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 min-h-[360px]">
                {currentChapter ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                            ডান কলাম: সাব-হেডিং ও পাঠসমূহ
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            পৃষ্ঠা {currentChapter.startPage}-{currentChapter.endPage}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {currentChapter.title}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          মোট {fullCurrentChapter?.topics?.length || currentChapter.topics?.length || 0}টি সাব-হেডিং / বিষয় অন্তর্ভুক্ত
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleGenerateSubheadingsForChapter(currentChapter)}
                          disabled={isGeneratingSubheadings}
                          title="এআই দিয়ে এই অধ্যায়ের জন্য বিস্তারিত সাব-হেডিং তৈরি করুন"
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isGeneratingSubheadings && generatingChapterId === currentChapter.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span>{isGeneratingSubheadings && generatingChapterId === currentChapter.id ? 'তৈরি হচ্ছে...' : '✨ এআই সাব-হেডিং'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleChapter(currentChapter)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            isChapterFullySelected(currentChapter)
                              ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>
                            {isChapterFullySelected(currentChapter) ? 'অধ্যায় আনসিলেক্ট করুন' : 'পুরো অধ্যায় নির্বাচন'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Notice if search query filtered out some topics in this chapter */}
                    {searchQuery.trim() && fullCurrentChapter && fullCurrentChapter.topics && (currentChapter.topics?.length || 0) < fullCurrentChapter.topics.length && (
                      <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Search className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-amber-900 dark:text-amber-200 truncate">
                            সার্চ ফিল্টার '<strong>{searchQuery}</strong>' সক্রিয় ({currentChapter.topics?.length || 0}টি সাব-হেডিং মিল পাওয়া গেছে / মোট {fullCurrentChapter.topics.length}টি)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowAllInActiveChapter(prev => !prev)}
                            className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-lg font-bold text-[11px] cursor-pointer"
                          >
                            {showAllInActiveChapter ? 'ফিল্টারকৃত সাব-হেডিং দেখুন' : `সব ${fullCurrentChapter.topics.length}টি সাব-হেডিং দেখুন`}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setShowAllInActiveChapter(false);
                            }}
                            className="p-1 hover:bg-amber-200 dark:hover:bg-amber-900 rounded-md text-amber-700 dark:text-amber-300 cursor-pointer"
                            title="সার্চ মুছুন"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Subheading quick search if many topics */}
                    {((fullCurrentChapter?.topics?.length || currentChapter.topics?.length || 0) > 4) && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="এই অধ্যায়ের ভেতরের সাব-হেডিং খুঁজুন (যেমন: সালাত, পবিত্রতা, হজ্জ, কুরবানি)..."
                          value={subTopicSearch}
                          onChange={(e) => setSubTopicSearch(e.target.value)}
                          className="w-full pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 shadow-2xs"
                        />
                        {subTopicSearch && (
                          <button
                            type="button"
                            onClick={() => setSubTopicSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="মুছুন"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                      {(() => {
                        const rawTopics = (showAllInActiveChapter && fullCurrentChapter?.topics)
                          ? fullCurrentChapter.topics
                          : (currentChapter.topics || []);
                        const filtered = rawTopics.filter(t => {
                          if (!subTopicSearch.trim()) return true;
                          const sq = normalizeBanglaSearch(subTopicSearch);
                          return normalizeBanglaSearch(t.title).includes(sq) || normalizeBanglaSearch(t.contentExcerpt || '').includes(sq);
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="py-8 text-center text-xs text-slate-500 space-y-3 bg-white dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5">
                              <p className="font-medium text-slate-600 dark:text-slate-300">এই অধ্যায়ে কোনো সাব-হেডিং মিল পাওয়া যায়নি বা এখনো তৈরি করা হয়নি।</p>
                              <button
                                type="button"
                                onClick={() => handleGenerateSubheadingsForChapter(currentChapter)}
                                disabled={isGeneratingSubheadings}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 mx-auto shadow-sm cursor-pointer disabled:opacity-50"
                              >
                                {isGeneratingSubheadings && generatingChapterId === currentChapter.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                                ) : (
                                  <Sparkles className="w-4 h-4 text-amber-300" />
                                )}
                                <span>✨ এআই দিয়ে এই অধ্যায়ের জন্য বিস্তারিত সাব-হেডিং তৈরি করুন</span>
                              </button>
                              {(subTopicSearch || searchQuery) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubTopicSearch('');
                                    setSearchQuery('');
                                    setShowAllInActiveChapter(true);
                                  }}
                                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 underline cursor-pointer block mx-auto"
                                >
                                  সকল সাব-হেডিং দেখতে সার্চ ফিল্টার মুছুন
                                </button>
                              )}
                            </div>
                          );
                        }

                        return filtered.map((t, idx) => {
                          const isChecked = isTopicChecked(t.id);
                          const isSingleSelected = selectedTopic && selectedTopic.id === t.id;

                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                if (allowMultiSelect && onToggleTopic) {
                                  onToggleTopic(currentChapter, t);
                                } else if (onSelectTopic) {
                                  onSelectTopic(currentChapter, t);
                                }
                              }}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                isChecked || isSingleSelected
                                  ? 'bg-emerald-50/90 dark:bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/30 text-slate-900 dark:text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                  isChecked || isSingleSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {t.topicNumber || `${idx + 1}`}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                    {t.title}
                                  </h5>
                                  {t.contentExcerpt && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                      {t.contentExcerpt}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                  পৃ: {t.pageNumber}{t.endPageNumber ? `-${t.endPageNumber}` : ''}
                                </span>

                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                  isChecked || isSingleSelected
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                }`}>
                                  {(isChecked || isSingleSelected) ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    বাম পাশ থেকে একটি অধ্যায় নির্বাচন করুন।
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SELECTED HEADINGS & SUBHEADINGS SUMMARY BAR */}
          {allowMultiSelect && (selectedTopics.length > 0 || selectedTopic) && (
            <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl shadow-xs space-y-2.5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>নির্বাচিত বিষয়সমূহ:</span>
                      <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-md font-mono">
                        মোট {selectedTopics.length > 0 ? selectedTopics.length : 1}টি পাঠ / সাব-হেডিং
                      </span>
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {selectedChaptersWithTopics.length > 0 
                        ? `${selectedChaptersWithTopics.length}টি অধ্যায়ের অন্তর্ভুক্ত বিষয়াদি নির্বাচিত হয়েছে` 
                        : 'নির্বাচিত পাঠসমূহ'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearAllSelected) {
                        onClearAllSelected();
                      } else if (onSelectMultipleTopics) {
                        onSelectMultipleTopics([]);
                      }
                    }}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 shadow-2xs hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>সব বাতিল করুন</span>
                  </button>
                </div>
              </div>

              {/* Badges of selected topics */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                {(selectedTopics.length > 0 ? selectedTopics : (selectedTopic ? [selectedTopic] : [])).map(topic => {
                  const parentCh = activeChapters.find(c => c.topics?.some(t => t.id === topic.id));
                  return (
                    <span
                      key={topic.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate max-w-[200px]" title={topic.title}>
                        {topic.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        (পৃ: {topic.pageNumber}{topic.endPageNumber ? `-${topic.endPageNumber}` : ''})
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (parentCh && onToggleTopic) {
                            onToggleTopic(parentCh, topic);
                          } else if (onSelectMultipleTopics) {
                            onSelectMultipleTopics(selectedTopics.filter(t => t.id !== topic.id));
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-0.5 cursor-pointer"
                        title="এই পাঠটি বাদ দিন"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Book Confirmation Modal */}
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
                  if (onDeleteSavedBook && bookToDelete) {
                    onDeleteSavedBook(bookToDelete.id);
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
    </div>
  );
};
