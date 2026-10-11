import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  GraduationCap, 
  Tag, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Calendar,
  FileText,
  CheckCircle2,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { SavedBook, BOOK_CATEGORIES, ALL_GRADE_LEVELS, GradeLevel } from '../types';

interface BookLibraryCatalogProps {
  savedBooks: SavedBook[];
  selectedBookId?: string;
  onSelectBook: (book: SavedBook) => void;
  onUpdateBook?: (book: SavedBook) => void;
  onDeleteBook?: (bookId: string) => void;
  onUploadNewPdf?: () => void;
  compact?: boolean;
}

export const BookLibraryCatalog: React.FC<BookLibraryCatalogProps> = ({
  savedBooks = [],
  selectedBookId,
  onSelectBook,
  onUpdateBook,
  onDeleteBook,
  onUploadNewPdf,
  compact = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('সব বিষয়');
  const [selectedGrade, setSelectedGrade] = useState<string>('সকল শ্রেণি');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingBook, setEditingBook] = useState<SavedBook | null>(null);
  const [bookToDelete, setBookToDelete] = useState<SavedBook | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLanguage, setEditLanguage] = useState<'bn' | 'en' | 'ar' | 'auto'>('bn');

  // Extract all categories available across existing books
  const availableCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    savedBooks.forEach(b => {
      if (b.category) categoriesSet.add(b.category);
      if (b.subject) categoriesSet.add(b.subject);
    });
    return Array.from(categoriesSet);
  }, [savedBooks]);

  // Extract all classes available across existing books
  const availableGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    savedBooks.forEach(b => {
      if (b.gradeLevel) gradesSet.add(b.gradeLevel);
    });
    return Array.from(gradesSet);
  }, [savedBooks]);

  // Filter books by Class, Category, and Search Query
  const filteredBooks = useMemo(() => {
    return savedBooks.filter(book => {
      // Category filter
      if (selectedCategory !== 'সব বিষয়') {
        const bookCat = book.category || book.subject || 'সাধারণ ও অন্যান্য';
        if (bookCat !== selectedCategory) return false;
      }

      // Class/Grade filter
      if (selectedGrade !== 'সকল শ্রেণি') {
        if (book.gradeLevel !== selectedGrade) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = book.title.toLowerCase().includes(q);
        const matchesCat = (book.category || book.subject || '').toLowerCase().includes(q);
        const matchesGrade = (book.gradeLevel || '').toLowerCase().includes(q);
        const matchesChapter = (book.chapters || []).some(c => 
          c.title.toLowerCase().includes(q) || 
          (c.topics || []).some(t => t.title.toLowerCase().includes(q))
        );
        if (!matchesTitle && !matchesCat && !matchesGrade && !matchesChapter) return false;
      }

      return true;
    });
  }, [savedBooks, selectedCategory, selectedGrade, searchQuery]);

  const handleStartEdit = (book: SavedBook, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBook(book);
    setEditTitle(book.title);
    setEditGrade(book.gradeLevel || 'পঞ্চম শ্রেণি');
    setEditCategory(book.category || book.subject || 'আকাইদ ও ফিকহ');
    setEditLanguage((book.language as any) || 'bn');
  };

  const handleSaveEdit = () => {
    if (!editingBook || !onUpdateBook) return;
    const updated: SavedBook = {
      ...editingBook,
      title: editTitle.trim() || editingBook.title,
      gradeLevel: editGrade,
      category: editCategory,
      subject: editCategory,
      language: editLanguage,
      updatedAt: Date.now()
    };
    onUpdateBook(updated);
    setEditingBook(null);
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'কুরআন ও তাফসির':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'হাদিস ও উসুল':
        return 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'আকাইদ ও ফিকহ':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'সিরাত ও ইতিহাস':
        return 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'আরবি ভাষা ও ব্যাকরণ':
        return 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'বাংলা':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'ইংরেজি':
        return 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'গণিত':
        return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'বিজ্ঞান':
        return 'bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>সংরক্ষিত পাঠ্যবই লাইব্রেরি</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  {savedBooks.length}টি বই উপলব্ধ
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                শ্রেণি ও বিভাগ/বিষয় অনুযায়ী বই বেছে নিয়ে সাথে সাথে সূচিপত্র ও প্রশ্ন তৈরির কাজ শুরু করুন
              </p>
            </div>
          </div>
        </div>

        {/* Search & New Upload Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="বই, বিষয় বা অধ্যায় খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onUploadNewPdf && (
            <button
              type="button"
              id="library-upload-new-book-btn"
              onClick={onUploadNewPdf}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">+ নতুন বই আপলোড</span>
              <span className="sm:hidden">আপলোড</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs: Class (শ্রেণি) & Category (বিভাগ/বিষয়) */}
      <div className="p-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        {/* Class / Grade Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>শ্রেণি:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedGrade('সকল শ্রেণি')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedGrade === 'সকল শ্রেণি'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            সকল শ্রেণি
          </button>

          {ALL_GRADE_LEVELS.map(grade => {
            const hasBooks = savedBooks.some(b => b.gradeLevel === grade);
            return (
              <button
                key={grade}
                type="button"
                onClick={() => setSelectedGrade(grade)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  selectedGrade === grade
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{grade}</span>
                {hasBooks && (
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedGrade === grade ? 'bg-white' : 'bg-emerald-500'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Category / Subject Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>বিভাগ:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategory('সব বিষয়')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'সব বিষয়'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            সব বিষয়
          </button>

          {BOOK_CATEGORIES.map(cat => {
            const count = savedBooks.filter(b => (b.category === cat || b.subject === cat)).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCategory === cat ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Books Grid */}
      <div className="p-4 sm:p-5">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {savedBooks.length === 0 
                ? 'এখনো কোনো বই সংরক্ষিত নেই' 
                : 'নির্বাচিত শ্রেণি বা বিষয়ে কোনো বই পাওয়া যায়নি'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              {savedBooks.length === 0
                ? 'যেকোনো পাঠ্যবই বা পিডিএফ আপলোড করুন। আপলোড করা বইটি স্থায়ীভাবে সংরক্ষিত হবে এবং পরবর্তীতে ১-ক্লিকেই কাজ করা যাবে।'
                : 'ফিল্টার পরিবর্তন করুন অথবা নতুন পাঠ্যবই আপলোড করে শ্রেণি ও বিষয় যুক্ত করুন।'}
            </p>

            {onUploadNewPdf && (
              <button
                type="button"
                onClick={onUploadNewPdf}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন পাঠ্যবই আপলোড করুন</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => {
              const isSelected = selectedBookId === book.id;
              const totalTopics = book.chapters?.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0) || 0;
              const category = book.category || book.subject || 'সাধারণ ও অন্যান্য';
              const grade = book.gradeLevel || 'সকল শ্রেণি';

              return (
                <div
                  key={book.id}
                  id={`book-card-${book.id}`}
                  onClick={() => onSelectBook(book)}
                  className={`relative group rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md'
                  }`}
                >
                  {/* Top Badges: Category, Class & Language */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getCategoryColor(category)} flex items-center gap-1`}>
                        <Tag className="w-3 h-3" />
                        <span>{category}</span>
                      </span>

                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-emerald-600" />
                        <span>{grade}</span>
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        book.language === 'en'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                          : book.language === 'ar'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {book.language === 'en' ? 'English' : book.language === 'ar' ? 'العربية' : 'বাংলা'}
                      </span>
                    </div>

                    {/* Action buttons (Edit, Delete) */}
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {onUpdateBook && (
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(book, e)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                          title="শ্রেণি ও বিভাগ পরিবর্তন করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteBook && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookToDelete(book);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Book Title */}
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                      {book.title}
                    </h4>
                    {book.fileName && book.fileName !== book.title && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate font-mono">
                        {book.fileName}
                      </p>
                    )}
                  </div>

                  {/* Metadata Stats & Select Action */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-600" />
                        <span>{book.chapters?.length || 0} অধ্যায়</span>
                      </span>
                      <span>•</span>
                      <span>{totalTopics}টি পাঠ</span>
                    </div>

                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 group-hover:bg-emerald-600 group-hover:text-white'
                    }`}>
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>নির্বাচিত</span>
                        </>
                      ) : (
                        <>
                          <span>শুরু করুন</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  বইয়ের তথ্য ও ক্যাটাগরি সম্পাদনা
                </h3>
              </div>
              <button 
                onClick={() => setEditingBook(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বইয়ের নাম (Title):
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শ্রেণি (Class / Grade Level):
                </label>
                <select
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {ALL_GRADE_LEVELS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিভাগ / ক্যাটাগরি (Subject Category):
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {BOOK_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বইয়ের ভাষা (Transcription / Book Language):
                </label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="bn">বাংলা (Bengali - প্রশ্ন ও ট্রান্সক্রিপশন বাংলায় হবে)</option>
                  <option value="en">ইংরেজি (English - Questions & Plan will be in English)</option>
                  <option value="ar">আরবি (Arabic - باللغة العربية)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  বই মুছে ফেলার নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  স্থায়ীভাবে লাইব্রেরি থেকে অপসারণ
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                আপনি কি নিশ্চিতভাবে <span className="font-bold text-slate-900 dark:text-white">"{bookToDelete.title}"</span> বইটি লাইব্রেরি থেকে মুছে ফেলতে চান?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
