import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Upload, 
  Search, 
  CheckSquare, 
  Square, 
  FileText, 
  Sparkles, 
  Trash2, 
  Check, 
  ChevronRight, 
  Layers, 
  Bookmark, 
  Loader2, 
  AlertCircle,
  FileCheck,
  BookMarked,
  Sliders,
  Calendar,
  GraduationCap,
  Plus,
  Library,
  Globe
} from 'lucide-react';
import { TOCChapter, TOCTopic, GradeLevel, SavedBook, BOOK_CATEGORIES, ALL_GRADE_LEVELS } from '../types';
import { extractPdfTableOfContents } from '../services/geminiService';
import { TOCSelector } from './TOCSelector';
import { BookLibraryCatalog } from './BookLibraryCatalog';

const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = (err) => {
      console.error("Failed to load PDF.js from CDN", err);
      reject(new Error("পিডিএফ রিডার লোড করা যায়নি।"));
    };
    document.head.appendChild(script);
  });
};

export interface SelectedTopicItem {
  chapterId: string;
  chapterTitle: string;
  topic: TOCTopic;
}

interface PDFTableOfContentsProps {
  chapters?: TOCChapter[] | null;
  bookTitle?: string;
  savedBooks?: SavedBook[];
  onSelectSavedBook?: (book: SavedBook) => void;
  onUpdateBook?: (book: SavedBook) => void;
  onDeleteBook?: (bookId: string) => void;
  onBookExtracted?: (book: SavedBook) => void;
  onGenerateQuestions: (selectedTopics: SelectedTopicItem[], extractedContent: string, file?: File | null) => void;
  onGenerateLessonPlan?: (selectedTopics: SelectedTopicItem[], extractedContent: string, language?: string) => void;
  onGenerateDetailedPlan?: (selectedTopics: SelectedTopicItem[], extractedContent: string, language?: string) => void;
  onUploadPdf?: (file: File) => void;
  isExtractingPdf?: boolean;
  extractionProgress?: string;
}

export const PDFTableOfContents: React.FC<PDFTableOfContentsProps> = ({
  chapters: externalChapters = null,
  bookTitle: externalBookTitle = '',
  savedBooks = [],
  onSelectSavedBook,
  onUpdateBook,
  onDeleteBook,
  onBookExtracted,
  onGenerateQuestions,
  onGenerateLessonPlan,
  onGenerateDetailedPlan,
  onUploadPdf,
  isExtractingPdf: externalIsExtracting = false,
  extractionProgress: externalProgress = ''
}) => {
  const [internalChapters, setInternalChapters] = useState<TOCChapter[] | null>(externalChapters);
  const [bookTitle, setBookTitle] = useState<string>(externalBookTitle);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(GradeLevel.Grade5);
  const [planLanguage, setPlanLanguage] = useState<'bn' | 'en' | 'ar'>('bn');
  
  // Selected Topics (Multi-selection)
  const [selectedTopicItems, setSelectedTopicItems] = useState<SelectedTopicItem[]>([]);
  const [activeChapter, setActiveChapter] = useState<TOCChapter | null>(null);

  // Uploaded File state
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(externalIsExtracting);
  const [extractionProgress, setExtractionProgress] = useState<string>(externalProgress);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Sync with external chapters
  React.useEffect(() => {
    if (externalChapters && externalChapters.length > 0) {
      setInternalChapters(externalChapters);
      if (!activeChapter || !externalChapters.some(c => c.id === activeChapter.id)) {
        setActiveChapter(externalChapters[0]);
      }
    } else {
      setInternalChapters(null);
    }
  }, [externalChapters]);

  React.useEffect(() => {
    if (externalBookTitle) {
      setBookTitle(externalBookTitle);
    }
  }, [externalBookTitle]);

  const chapters = internalChapters;

  // Process uploaded PDF
  const handlePdfUpload = async (file: File) => {
    setUploadedPdf(file);
    setIsExtracting(true);
    setExtractError(null);
    setExtractionProgress("পিডিএফ ফাইল লোড করা হচ্ছে...");

    if (onUploadPdf) {
      onUploadPdf(file);
    }

    try {
      setExtractionProgress("পিডিএফ থেকে সূচিপত্র ও টেক্সট পড়া হচ্ছে...");
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const numPages = pdf.numPages;
      let initialPagesText = '';
      
      // Read first 15 pages for TOC
      const pagesToScan = Math.min(15, numPages);
      for (let i = 1; i <= pagesToScan; i++) {
        setExtractionProgress(`সূচিপত্রের পাতা স্ক্যান করা হচ্ছে (${i}/${pagesToScan})...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStr = textContent.items.map((item: any) => item.str).join(' ');
        initialPagesText += `\n--- PAGE ${i} ---\n` + pageStr;
      }

      setExtractionProgress("সূচিপত্র ও অধ্যায়সমূহ সুন্দরভাবে সাজানো হচ্ছে...");
      const result = await extractPdfTableOfContents({
        extractedText: initialPagesText,
        fileName: file.name
      }, (progress, msg) => {
        setExtractionProgress(msg);
      });

      if (result && result.chapters && result.chapters.length > 0) {
        const detectedTitle = result.bookTitle || file.name.replace(/\.[^/.]+$/, "");
        const detectedCategory = result.category || result.subject || 'সাধারণ ও অন্যান্য';
        const detectedGrade = result.gradeLevel || gradeLevel;
        const detectedLang = result.language || (/[a-zA-Z]{5,}/.test(detectedTitle) ? 'en' : 'bn');

        setInternalChapters(result.chapters);
        setBookTitle(detectedTitle);
        setActiveChapter(result.chapters[0]);
        if (result.chapters[0].topics && result.chapters[0].topics.length > 0) {
          setSelectedTopicItems([{
            chapterId: result.chapters[0].id,
            chapterTitle: result.chapters[0].title,
            topic: result.chapters[0].topics[0]
          }]);
        }

        const newSavedBook: SavedBook = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'book_' + Date.now(),
          title: detectedTitle,
          fileName: file.name,
          pageCount: numPages,
          gradeLevel: detectedGrade,
          category: detectedCategory,
          subject: detectedCategory,
          language: detectedLang,
          chapters: result.chapters,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        if (onBookExtracted) {
          onBookExtracted(newSavedBook);
        }
      } else {
        throw new Error("পিডিএফ থেকে কোনো সূচিপত্র পাওয়া যায়নি। অনুগ্রহ করে স্পষ্ট সূচিপত্রসহ ফাইল দিন।");
      }
    } catch (err: any) {
      console.error("Failed to extract TOC from PDF", err);
      setExtractError(err.message || "পিডিএফ থেকে সূচিপত্র উদ্ধার করতে সমস্যা হয়েছে।");
    } finally {
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  // Toggle single topic selection
  const handleToggleTopic = (chapter: TOCChapter, topic: TOCTopic) => {
    setActiveChapter(chapter);
    const exists = selectedTopicItems.some(item => item.topic.id === topic.id);
    if (exists) {
      setSelectedTopicItems(prev => prev.filter(item => item.topic.id !== topic.id));
    } else {
      setSelectedTopicItems(prev => [
        ...prev,
        {
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          topic: topic
        }
      ]);
    }
  };

  // Select entire chapter
  const handleSelectFullChapter = (chapter: TOCChapter) => {
    setActiveChapter(chapter);
    if (!chapter.topics || chapter.topics.length === 0) return;

    const allInChapterSelected = chapter.topics.every(t => 
      selectedTopicItems.some(item => item.topic.id === t.id)
    );

    if (allInChapterSelected) {
      setSelectedTopicItems(prev => prev.filter(item => item.chapterId !== chapter.id));
    } else {
      const otherItems = selectedTopicItems.filter(item => item.chapterId !== chapter.id);
      const newItems: SelectedTopicItem[] = chapter.topics.map(t => ({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        topic: t
      }));
      setSelectedTopicItems([...otherItems, ...newItems]);
    }
  };

  // Build extracted text for selected topics
  const buildExtractedContent = (): string => {
    if (selectedTopicItems.length === 0) return '';
    return selectedTopicItems.map((item, idx) => {
      return `[পাঠ ${idx + 1}] অধ্যায়: ${item.chapterTitle} | বিষয়: ${item.topic.topicNumber ? `${item.topic.topicNumber}. ` : ''}${item.topic.title} (পৃষ্ঠা ${item.topic.pageNumber}${item.topic.endPageNumber ? `-${item.topic.endPageNumber}` : ''})\n${item.topic.contentExcerpt || ''}`;
    }).join('\n\n');
  };

  const handleAction = (type: 'questions' | 'lesson_plan' | 'detailed_plan') => {
    if (selectedTopicItems.length === 0) {
      alert("অনুগ্রহ করে অন্তত একটি পাঠ বা অধ্যায় নির্বাচন করুন!");
      return;
    }
    const content = buildExtractedContent();
    if (type === 'questions') {
      onGenerateQuestions(selectedTopicItems, content, uploadedPdf);
    } else if (type === 'lesson_plan' && onGenerateLessonPlan) {
      onGenerateLessonPlan(selectedTopicItems, content, planLanguage);
    } else if (type === 'detailed_plan' && onGenerateDetailedPlan) {
      onGenerateDetailedPlan(selectedTopicItems, content, planLanguage);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 md:p-7 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <BookMarked className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              স্মার্ট বইয়ের সূচিপত্র ও পরীক্ষা প্রস্তুতকারক
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            যেকোনো বিষয়ের পাঠ্যবই আপলোড করুন এবং সূচিপত্র থেকে এক বা একাধিক অধ্যায়/পাঠ নির্বাচন করে পরীক্ষা তৈরি করুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf"
            id="toc-browser-replace-pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePdfUpload(f);
            }}
            className="hidden"
            disabled={isExtracting}
          />
          <label
            htmlFor="toc-browser-replace-pdf"
            className="cursor-pointer text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5"
          >
            {isExtracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>+ নতুন বই/PDF আপলোড</span>
          </label>
        </div>
      </div>

      {/* Categorized Permanent Books Library */}
      <BookLibraryCatalog 
        savedBooks={savedBooks}
        selectedBookId={savedBooks.find(b => b.title === bookTitle)?.id}
        onSelectBook={(book) => {
          if (onSelectSavedBook) {
            onSelectSavedBook(book);
          } else {
            setInternalChapters(book.chapters);
            setBookTitle(book.title);
            if (book.chapters && book.chapters.length > 0) {
              setActiveChapter(book.chapters[0]);
              if (book.chapters[0].topics && book.chapters[0].topics.length > 0) {
                setSelectedTopicItems([{
                  chapterId: book.chapters[0].id,
                  chapterTitle: book.chapters[0].title,
                  topic: book.chapters[0].topics[0]
                }]);
              }
            }
          }
        }}
        onUpdateBook={onUpdateBook}
        onDeleteBook={onDeleteBook}
        onUploadNewPdf={() => {
          const input = document.getElementById('toc-browser-replace-pdf');
          if (input) input.click();
        }}
      />

      {extractError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{extractError}</span>
        </div>
      )}

      {/* Grade Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          শ্রেণি নির্বাচন (TARGET GRADE)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {Object.values(GradeLevel).map((g) => (
            <button
              key={g}
              type="button"
              id={`toc-grade-btn-${g}`}
              onClick={() => setGradeLevel(g)}
              className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                gradeLevel === g
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column TOC Selector Component */}
      <TOCSelector 
        chapters={chapters}
        bookTitle={bookTitle}
        selectedChapter={activeChapter}
        selectedTopics={selectedTopicItems.map(item => item.topic)}
        onToggleTopic={handleToggleTopic}
        onSelectTopic={(ch, top) => {
          handleToggleTopic(ch, top);
        }}
        onSelectFullChapter={handleSelectFullChapter}
        onUploadPdf={handlePdfUpload}
        isExtractingPdf={isExtracting}
        extractionProgress={extractionProgress}
        allowMultiSelect={true}
        title="বইয়ের সূচিপত্র থেকে অধ্যায় ও বিষয় নির্বাচন করুন"
      />

      {/* Selection Bottom Action Bar */}
      {chapters && chapters.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {selectedTopicItems.length > 0 ? (
                    <span>মোট <span className="text-emerald-600 dark:text-emerald-400">{selectedTopicItems.length}টি পাঠ</span> নির্বাচিত হয়েছে</span>
                  ) : (
                    <span>সূচিপত্র থেকে পাঠ বা অধ্যায় সিলেক্ট করুন</span>
                  )}
                </h4>
                {selectedTopicItems.length > 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {selectedTopicItems.map(item => item.topic.title).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {selectedTopicItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTopicItems([])}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline shrink-0 cursor-pointer"
              >
                সব বাতিল করুন
              </button>
            )}
          </div>

          {/* Language Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  লেসন প্ল্যান তৈরির ভাষা নির্বাচন (LANGUAGE)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  বাংলা, ইংরেজি অথবা আরবি ভাষায় সরাসরি প্ল্যান তৈরি হবে
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPlanLanguage('bn')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  planLanguage === 'bn'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                }`}
              >
                🇧🇩 বাংলা
              </button>
              <button
                type="button"
                onClick={() => setPlanLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  planLanguage === 'en'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                }`}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                onClick={() => setPlanLanguage('ar')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  planLanguage === 'ar'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                }`}
              >
                🇸🇦 العربية
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              id="toc-generate-questions-btn"
              onClick={() => handleAction('questions')}
              disabled={selectedTopicItems.length === 0}
              className="py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>স্মার্ট অনুশীলনী ও পরীক্ষা তৈরি করুন</span>
            </button>

            <button
              type="button"
              id="toc-generate-lesson-plan-btn"
              onClick={() => handleAction('lesson_plan')}
              disabled={selectedTopicItems.length === 0}
              className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>পাঠ পরিকল্পনা তৈরি করুন</span>
            </button>

            <button
              type="button"
              id="toc-generate-detailed-plan-btn"
              onClick={() => handleAction('detailed_plan')}
              disabled={selectedTopicItems.length === 0}
              className="py-3 px-4 rounded-xl font-bold text-xs bg-teal-700 hover:bg-teal-800 text-white shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>বিস্তারিত পাঠ পরিকল্পনা তৈরি করুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

