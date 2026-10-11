import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  CheckSquare, 
  FileText, 
  HelpCircle, 
  Layers, 
  Sliders, 
  Upload, 
  FileCheck, 
  GraduationCap, 
  Flame, 
  ListChecks, 
  Search,
  BookMarked,
  Plus,
  Library,
  Brain,
  Baby,
  CheckCircle2,
  Lightbulb,
  Hash
} from 'lucide-react';
import { GradeLevel, ExerciseRequest, ExerciseQuestionType, TOCChapter, TOCTopic, SavedBook, getGradeAgeIntellectProfile } from '../types';
import { TOCSelector } from './TOCSelector';
import StoredFilesManager from './StoredFilesManager';
import PageRangeSelector from './PageRangeSelector';
import { saveStoredFile, getAllStoredFiles, deleteStoredFile, clearAllStoredFiles, StoredFile } from '../services/dbService';

interface ExerciseGeneratorFormProps {
  uploadedChapters?: TOCChapter[] | null;
  uploadedBookTitle?: string;
  savedBooks?: SavedBook[];
  onSelectSavedBook?: (book: SavedBook) => void;
  onUpdateSavedBook?: (book: SavedBook) => void;
  onDeleteSavedBook?: (bookId: string) => void;
  onUploadPdf?: (files: File | File[]) => void;
  isExtractingPdf?: boolean;
  extractionProgress?: string;
  onSubmit: (request: ExerciseRequest) => void;
  isLoading: boolean;
  onSelectSample?: () => void;
}

export const ExerciseGeneratorForm: React.FC<ExerciseGeneratorFormProps> = ({
  uploadedChapters = null,
  uploadedBookTitle,
  savedBooks = [],
  onSelectSavedBook,
  onUpdateSavedBook,
  onDeleteSavedBook,
  onUploadPdf,
  isExtractingPdf = false,
  extractionProgress = '',
  onSubmit,
  isLoading,
  onSelectSample
}) => {

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(GradeLevel.Grade5);
  const [activeTab, setActiveTab] = useState<'toc' | 'pages' | 'custom' | 'upload'>('toc');
  
  // Page Ranges state
  const [pageRanges, setPageRanges] = useState<{ id: string; start: number | string; end: number | string }[]>([
    { id: 'ex_rng_1', start: 1, end: 10 }
  ]);

  // TOC Selection
  const [selectedChapter, setSelectedChapter] = useState<TOCChapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TOCTopic | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<TOCTopic[]>([]);
  const [isEntireChapterSelected, setIsEntireChapterSelected] = useState<boolean>(false);
  
  // Custom Topic Data
  const [customTopicTitle, setCustomTopicTitle] = useState('');
  const [customChapterTitle, setCustomChapterTitle] = useState('');
  const [content, setContent] = useState('');

  // Question Types Configuration
  const [selectedTypes, setSelectedTypes] = useState<ExerciseQuestionType[]>([
    'short', 
    'mcq', 
    'true_false', 
    'blank', 
    'essay'
  ]);
  
  const [questionCounts, setQuestionCounts] = useState<{ [key in ExerciseQuestionType]?: number }>({
    short: 2,
    mcq: 4,
    true_false: 3,
    blank: 3,
    essay: 1,
    match: 4
  });

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  // File Upload & Library state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string>('');
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [savedFiles, setSavedFiles] = useState<StoredFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const loadSavedFiles = async () => {
    try {
      const files = await getAllStoredFiles();
      setSavedFiles(files);
    } catch (err) {
      console.error("Error loading stored files:", err);
    }
  };

  useEffect(() => {
    loadSavedFiles();
  }, []);

  const handleSelectSavedFile = (stored: StoredFile) => {
    try {
      const arr = stored.data.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || '';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const reconstructed = new File([u8arr], stored.name, { type: mime });
      setUploadedFile(reconstructed);
      setActiveFileId(stored.id);
      setFileBase64(stored.data);
      setFileMime(stored.type || mime);
    } catch (e) {
      console.error("Error selecting stored file:", e);
    }
  };

  const handleDeleteSavedFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteStoredFile(id);
      if (activeFileId === id) {
        setUploadedFile(null);
        setActiveFileId(null);
        setFileBase64(null);
        setFileMime('');
      }
      loadSavedFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleMultipleFilesUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const prefix = files.length > 1 ? `[${i + 1}/${files.length}] "${file.name}": ` : '';
        setUploadProgress(`${prefix}ফাইল প্রসেস ও ব্রাউজারে সেভ করা হচ্ছে...`);

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await saveStoredFile({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          data: dataUrl
        });

        if (i === 0 || files.length === 1) {
          setUploadedFile(file);
          setActiveFileId(fileId);
          setFileBase64(dataUrl);
          setFileMime(file.type);
        }
      }

      await loadSavedFiles();

      if (onUploadPdf) {
        onUploadPdf(files.length === 1 ? files[0] : files);
      }
    } catch (err) {
      console.error("Error uploading files in ExerciseGeneratorForm:", err);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  // Auto-select first chapter & topic when chapters are loaded/uploaded
  useEffect(() => {
    if (uploadedChapters && uploadedChapters.length > 0) {
      if (!selectedChapter || !uploadedChapters.some(c => c.id === selectedChapter.id)) {
        const firstCh = uploadedChapters[0];
        setSelectedChapter(firstCh);
        if (firstCh.topics && firstCh.topics.length > 0) {
          setSelectedTopic(firstCh.topics[0]);
          setSelectedTopics([firstCh.topics[0]]);
          setContent(firstCh.topics[0].contentExcerpt || `বইয়ের সংশ্লিষ্ট পাঠ: ${firstCh.topics[0].title} (পৃষ্ঠা ${firstCh.topics[0].pageNumber})`);
        }
      }
    } else {
      setSelectedChapter(null);
      setSelectedTopic(null);
      setSelectedTopics([]);
    }
  }, [uploadedChapters]);

  const toggleType = (type: ExerciseQuestionType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleTopicSelect = (chapter: TOCChapter, topic: TOCTopic) => {
    setSelectedChapter(chapter);
    setSelectedTopic(topic);
    setSelectedTopics([topic]);
    setIsEntireChapterSelected(false);
    setCustomChapterTitle(chapter.title);
    setCustomTopicTitle(`${topic.topicNumber ? `${topic.topicNumber}. ` : ''}${topic.title}`);
    setContent(topic.contentExcerpt || `বইয়ের সংশ্লিষ্ট পাঠ: ${topic.title} (পৃষ্ঠা ${topic.pageNumber}${topic.endPageNumber ? `-${topic.endPageNumber}` : ''})`);
  };

  const handleToggleTopic = (chapter: TOCChapter, topic: TOCTopic) => {
    setSelectedChapter(chapter);
    setIsEntireChapterSelected(false);
    
    if (selectedTopics.some(t => t.id === topic.id)) {
      const remaining = selectedTopics.filter(t => t.id !== topic.id);
      setSelectedTopics(remaining);
      if (remaining.length > 0) {
        setSelectedTopic(remaining[0]);
      } else {
        setSelectedTopic(null);
      }
    } else {
      const updated = [...selectedTopics, topic];
      setSelectedTopics(updated);
      setSelectedTopic(topic);
    }
  };

  const handleSelectFullChapter = (chapter: TOCChapter) => {
    setSelectedChapter(chapter);
    setIsEntireChapterSelected(true);
    if (chapter.topics && chapter.topics.length > 0) {
      setSelectedTopics([...chapter.topics]);
      setSelectedTopic(chapter.topics[0]);
      setCustomTopicTitle(`সম্পূর্ণ অধ্যায়: ${chapter.title} (সকল পাঠ)`);
      setContent(`অধ্যায়: ${chapter.title}, পৃষ্ঠা ${chapter.startPage}-${chapter.endPage} এর অন্তর্ভুক্ত সকল পাঠের ওপর পরীক্ষা ও অনুশীলনী।`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setFileMime(file.type);
      const reader = new FileReader();
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);

      // If it's a PDF, also trigger the TOC analysis
      if (file.type === 'application/pdf' && onUploadPdf) {
        onUploadPdf(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTopicTitle = '';
    let finalChapterTitle = '';

    if (activeTab === 'toc') {
      if (isEntireChapterSelected && selectedChapter) {
        finalTopicTitle = `সম্পূর্ণ অধ্যায়: ${selectedChapter.title} (সকল পাঠ)`;
        finalChapterTitle = selectedChapter.title;
      } else if (selectedTopics.length > 1 && selectedChapter) {
        finalTopicTitle = selectedTopics.map(t => `${t.topicNumber ? `${t.topicNumber}. ` : ''}${t.title}`).join(', ');
        finalChapterTitle = selectedChapter.title;
      } else if (selectedTopic && selectedChapter) {
        finalTopicTitle = `${selectedTopic.topicNumber ? `${selectedTopic.topicNumber}. ` : ''}${selectedTopic.title}`;
        finalChapterTitle = selectedChapter.title;
      } else {
        finalTopicTitle = customTopicTitle || 'নির্বাচিত বিষয়বস্তু';
        finalChapterTitle = customChapterTitle || 'সাধারণ অধ্যায়';
      }
    } else if (activeTab === 'pages') {
      const pageDesc = pageRanges.map((r, i) => `পৃষ্ঠা ${r.start}-${r.end}`).join(', ');
      finalTopicTitle = customTopicTitle ? `${customTopicTitle} (${pageDesc})` : `অনুশীলনী ও প্রশ্নপত্র (${pageDesc})`;
      finalChapterTitle = customChapterTitle || uploadedBookTitle || 'পাঠ্যবই অংশ';
    } else {
      finalTopicTitle = customTopicTitle || 'বিষয়বস্তু';
      finalChapterTitle = customChapterTitle || 'সাধারণ অধ্যায়';
    }

    const firstRange = pageRanges[0] || { start: 1, end: 10 };
    const cleanRanges = pageRanges.map(r => ({
      start: r.start,
      end: r.end
    }));

    const exerciseRequest: ExerciseRequest = {
      topicTitle: finalTopicTitle,
      chapterTitle: finalChapterTitle,
      gradeLevel: selectedGrade,
      content: content || `বইয়ের পৃষ্ঠা ${selectedTopic ? selectedTopic.pageNumber : ''} এর বিষয়বস্তু`,
      file: uploadedFile,
      fileData: fileBase64,
      mimeType: fileMime,
      startPage: firstRange.start,
      endPage: firstRange.end,
      pageRanges: cleanRanges,
      selectedQuestionTypes: selectedTypes,
      questionCounts: questionCounts,
      difficulty,
      additionalInstructions
    };

    onSubmit(exerciseRequest);
  };

  return (
    <div id="exercise-form-card" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 md:p-7 shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              স্মার্ট অনুশীলনী ও পরীক্ষা তৈরি করুন
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            বইয়ের যে কোনো পাঠ বা সূচিপত্র নির্বাচন করে স্বয়ংক্রিয়ভাবে নির্ভুল প্রশ্ন ও উত্তরমালা প্রস্তুত করুন
          </p>
        </div>

        {onSelectSample && (
          <button
            type="button"
            id="view-sample-exercise-btn"
            onClick={onSelectSample}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            নমুনা অনুশীলনী দেখুন
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Navigation Tabs matching other modules */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
          <button
            type="button"
            id="tab-toc-selection"
            onClick={() => setActiveTab('toc')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeTab === 'toc'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookMarked className="w-4 h-4 shrink-0" />
            <span className="truncate">১. বইয়ের সূচিপত্র (TOC)</span>
          </button>

          <button
            type="button"
            id="tab-pages-selection"
            onClick={() => setActiveTab('pages')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeTab === 'pages'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Hash className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">২. পৃষ্ঠা নম্বর দিয়ে (Page Range)</span>
          </button>

          <button
            type="button"
            id="tab-custom-topic"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeTab === 'custom'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">৩. কাস্টম বিষয় / টপিক</span>
          </button>

          <button
            type="button"
            id="tab-upload-file"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">৪. ফাইল / ছবি আপলোড</span>
          </button>
        </div>

        {/* Grade Selector (TARGET GRADE) matching screenshot */}
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
                id={`grade-btn-${g}`}
                onClick={() => setSelectedGrade(g)}
                className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                  selectedGrade === g
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: Table of Contents Interactive Browser */}
        {activeTab === 'toc' && (
          <div className="space-y-4">
            <TOCSelector 
              chapters={uploadedChapters}
              bookTitle={uploadedBookTitle}
              savedBooks={savedBooks}
              onSelectSavedBook={onSelectSavedBook}
              onUpdateSavedBook={onUpdateSavedBook}
              onDeleteSavedBook={onDeleteSavedBook}
              selectedChapter={selectedChapter}
              selectedTopic={selectedTopic}
              selectedTopics={selectedTopics}
              onSelectTopic={handleTopicSelect}
              onToggleTopic={handleToggleTopic}
              onSelectFullChapter={handleSelectFullChapter}
              onUploadPdf={onUploadPdf}
              isExtractingPdf={isExtractingPdf}
              extractionProgress={extractionProgress}
              allowMultiSelect={true}
              title="বইয়ের সূচিপত্র থেকে অধ্যায় ও বিষয় নির্বাচন করুন"
            />


            {/* Currently Selected Topic Banner */}
            {selectedChapter && (
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-emerald-950 dark:text-emerald-200 truncate">
                      {isEntireChapterSelected ? (
                        <>
                          নির্বাচিত সম্পূর্ণ অধ্যায়: <span className="font-bold">{selectedChapter.title}</span> (পৃষ্ঠা {selectedChapter.startPage}-{selectedChapter.endPage}, মোট {selectedChapter.topics?.length || 0}টি পাঠ)
                        </>
                      ) : selectedTopics.length > 1 ? (
                        <>
                          নির্বাচিত পাঠসমূহ ({selectedTopics.length}টি): <span className="font-bold">{selectedChapter.title}</span> › {selectedTopics.map(t => t.title).join(', ')}
                        </>
                      ) : selectedTopic ? (
                        <>
                          নির্বাচিত পাঠ: <span className="font-bold">{selectedChapter.title} › {selectedTopic.topicNumber ? `${selectedTopic.topicNumber}. ` : ''}{selectedTopic.title}</span> (পৃষ্ঠা {selectedTopic.pageNumber})
                        </>
                      ) : (
                        <span>অধ্যায়: {selectedChapter.title}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-full shrink-0 shadow-xs">
                  প্রস্তুত
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Page Ranges Selector */}
        {activeTab === 'pages' && (
          <div className="space-y-4">
            <PageRangeSelector
              pageRanges={pageRanges}
              onChange={setPageRanges}
              accentColor="emerald"
              title="বইয়ের নির্দিষ্ট পৃষ্ঠা নির্বাচন করে অনুশীলনী তৈরি করুন"
              description="সূচিপত্র ছাড়াও আপনি সরাসরি বইয়ের এক বা একাধিক পৃষ্ঠা রেঞ্জ (যেমন: পৃষ্ঠা ৫ থেকে ১৫) দিয়ে প্রশ্ন ও পরীক্ষা তৈরি করতে পারবেন।"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অধ্যায় বা বইয়ের নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: আকাইদ ও ফিকহ্"
                  value={customChapterTitle}
                  onChange={(e) => setCustomChapterTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  টপিক বা পাঠ শিরোনাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: তাওহীদ ও রিসালাত"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Custom Topic Entry */}
        {activeTab === 'custom' && (
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অধ্যায়ের নাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ঈমান ও আকীদা"
                  value={customChapterTitle}
                  onChange={(e) => setCustomChapterTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পাঠ বা বিষয়ের শিরোনাম *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বিশুদ্ধ ঈমানের গুরুত্ব ও শিরক-কুফরের ভয়াবহতা"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                  required={activeTab === 'custom'}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                পাঠ্যবইয়ের টেক্সট বা মূল বিষয়বস্তু (Textbook Content)
              </label>
              <textarea
                rows={4}
                placeholder="এখানে বইয়ের পাতার টেক্সট, আয়াত, হাদিস বা বিষয়বস্তু পেস্ট করুন..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>
        )}

        {/* TAB 3: File Upload & Library */}
        {activeTab === 'upload' && (
          <StoredFilesManager
            activeFile={uploadedFile}
            activeFileId={activeFileId}
            savedFiles={savedFiles}
            onSelectSavedFile={handleSelectSavedFile}
            onDeleteSavedFile={handleDeleteSavedFile}
            onClearAllFiles={async () => {
              await clearAllStoredFiles();
              setUploadedFile(null);
              setActiveFileId(null);
              setFileBase64(null);
              setFileMime('');
              loadSavedFiles();
            }}
            onUploadFiles={handleMultipleFilesUpload}
            onRemoveActiveFile={() => {
              setUploadedFile(null);
              setActiveFileId(null);
              setFileBase64(null);
              setFileMime('');
            }}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            accentColor="emerald"
            uploadTitle="বইয়ের পাতার ছবি বা পিডিএফ ফাইল আপলোড করুন"
            uploadSubtitle="একসাথে একাধিক ফাইল (২ বা ৩টি বই/ফাইল) নির্বাচন ও আপলোড করতে পারেন"
          />
        )}

        {/* Question Types Configuration */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              অনুশীলনীতে কোন কোন ধরনের প্রশ্ন থাকবে? (সীমাহীন প্রশ্ন সংখ্যা নির্ধারণ)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                নির্বাচিত: {selectedTypes.length}টি প্রকার
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                মোট প্রশ্ন: {
                  (selectedTypes.includes('short') ? (questionCounts.short || 0) : 0) +
                  (selectedTypes.includes('mcq') ? (questionCounts.mcq || 0) : 0) +
                  (selectedTypes.includes('true_false') ? (questionCounts.true_false || 0) : 0) +
                  (selectedTypes.includes('blank') ? (questionCounts.blank || 0) : 0) +
                  (selectedTypes.includes('essay') ? (questionCounts.essay || 0) : 0) +
                  (selectedTypes.includes('match') ? (questionCounts.match || 0) : 0)
                } টি
              </span>
            </div>
          </div>

          {/* Quick unlimited question count banner */}
          <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">
                কোনো সীমাবদ্ধতা নেই — আপনি ইচ্ছামতো যেকোনো সংখ্যার প্রশ্ন (যেমন: ১০, ২০, ৫০, ১০০+) তৈরি করতে পারবেন
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setQuestionCounts({
                    short: 5,
                    mcq: 10,
                    true_false: 5,
                    blank: 5,
                    essay: 2,
                    match: 4
                  });
                }}
                className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              >
                নমুনা ৩০টি
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuestionCounts({
                    short: 10,
                    mcq: 20,
                    true_false: 10,
                    blank: 10,
                    essay: 5,
                    match: 5
                  });
                }}
                className="px-2 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                বড় সেট ৬০টি
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {/* Short Answer */}
            <div 
              onClick={() => toggleType('short')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedTypes.includes('short')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('short')}
                  onChange={() => {}}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold">সংক্ষিপ্ত উত্তর প্রশ্ন</div>
                  <div className="text-[10px] text-slate-500">Short Answer Questions</div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="1"
                  value={questionCounts.short || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setQuestionCounts({ ...questionCounts, short: isNaN(val) ? 1 : val });
                  }}
                  className="w-16 text-center py-1 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="সংখ্যা"
                />
                <span className="text-[10px] font-semibold text-slate-500">টি</span>
              </div>
            </div>

            {/* MCQ */}
            <div 
              onClick={() => toggleType('mcq')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedTypes.includes('mcq')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('mcq')}
                  onChange={() => {}}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold">বহুনির্বাচনী প্রশ্ন (MCQ)</div>
                  <div className="text-[10px] text-slate-500">৪টি অপশনসহ</div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="1"
                  value={questionCounts.mcq || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setQuestionCounts({ ...questionCounts, mcq: isNaN(val) ? 1 : val });
                  }}
                  className="w-16 text-center py-1 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="সংখ্যা"
                />
                <span className="text-[10px] font-semibold text-slate-500">টি</span>
              </div>
            </div>

            {/* True/False */}
            <div 
              onClick={() => toggleType('true_false')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedTypes.includes('true_false')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('true_false')}
                  onChange={() => {}}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold">সত্য / মিথ্যা যাচাই</div>
                  <div className="text-[10px] text-slate-500">সঠিক বাক্যসহ</div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="1"
                  value={questionCounts.true_false || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setQuestionCounts({ ...questionCounts, true_false: isNaN(val) ? 1 : val });
                  }}
                  className="w-16 text-center py-1 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="সংখ্যা"
                />
                <span className="text-[10px] font-semibold text-slate-500">টি</span>
              </div>
            </div>

            {/* Fill in the Blanks */}
            <div 
              onClick={() => toggleType('blank')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedTypes.includes('blank')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('blank')}
                  onChange={() => {}}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold">শূণ্যস্থান পূরণ</div>
                  <div className="text-[10px] text-slate-500">Fill in the blanks</div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="1"
                  value={questionCounts.blank || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setQuestionCounts({ ...questionCounts, blank: isNaN(val) ? 1 : val });
                  }}
                  className="w-16 text-center py-1 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="সংখ্যা"
                />
                <span className="text-[10px] font-semibold text-slate-500">টি</span>
              </div>
            </div>

            {/* Descriptive / Essay */}
            <div 
              onClick={() => toggleType('essay')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedTypes.includes('essay')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('essay')}
                  onChange={() => {}}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold">ব্যাখ্যামূলক / বর্ণনামূলক</div>
                  <div className="text-[10px] text-slate-500">রচনামূলক প্রশ্ন</div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="1"
                  value={questionCounts.essay || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setQuestionCounts({ ...questionCounts, essay: isNaN(val) ? 1 : val });
                  }}
                  className="w-16 text-center py-1 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="সংখ্যা"
                />
                <span className="text-[10px] font-semibold text-slate-500">টি</span>
              </div>
            </div>

            {/* Column Match */}
            <div 
              onClick={() => toggleType('match')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedTypes.includes('match')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes('match')}
                  onChange={() => {}}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold">ডান-বাম মিলকরণ</div>
                  <div className="text-[10px] text-slate-500">কলাম মিলানো</div>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  min="2"
                  value={questionCounts.match || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    setQuestionCounts({ ...questionCounts, match: isNaN(val) ? 2 : val });
                  }}
                  className="w-16 text-center py-1 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="জোড়া"
                />
                <span className="text-[10px] font-semibold text-slate-500">জোড়া</span>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty & Additional notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
              <Flame className="w-4 h-4 text-emerald-600" />
              কঠিনতার মাত্রা (Difficulty)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                    difficulty === d
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {d === 'easy' ? 'সহজ' : d === 'medium' ? 'মাঝারি' : 'উচ্চতর'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              বিশেষ নির্দেশনা (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="যেমন: রেফারেন্স ও ব্যাখ্যাসহ নির্ভুল উত্তর প্রদান করুন..."
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Submit Action matching screenshot */}
        <div className="pt-3">
          <button
            type="submit"
            id="generate-exercise-submit-btn"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>স্মার্ট অনুশীলনী ও প্রশ্নপত্র তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>স্মার্ট অনুশীলনী ও পরীক্ষা তৈরি করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
