import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Clock, 
  GraduationCap, 
  FileText, 
  Upload, 
  FileCheck, 
  Users,
  UserCheck,
  Tag,
  FileSpreadsheet,
  Calendar,
  Hash,
  Layers,
  Globe
} from 'lucide-react';
import { DetailedPlanRequest, TOCChapter, TOCTopic, SavedBook, PlanLengthMode } from '../types';
import { MADRASAH_CLASS_5_TOC } from '../constants/madrasahBookData';
import { TOCSelector } from './TOCSelector';
import StoredFilesManager from './StoredFilesManager';
import PageRangeSelector from './PageRangeSelector';
import { saveStoredFile, getAllStoredFiles, deleteStoredFile, clearAllStoredFiles, StoredFile } from '../services/dbService';

interface DetailedPlanFormProps {
  uploadedChapters?: TOCChapter[] | null;
  uploadedBookTitle?: string;
  savedBooks?: SavedBook[];
  onSelectSavedBook?: (book: SavedBook) => void;
  onUpdateSavedBook?: (book: SavedBook) => void;
  onDeleteSavedBook?: (bookId: string) => void;
  onUploadPdf?: (files: File | File[]) => void;
  isExtractingPdf?: boolean;
  extractionProgress?: string;
  onSubmit: (request: DetailedPlanRequest) => void;
  isLoading: boolean;
  onSelectSample?: () => void;
}

export const DetailedPlanForm: React.FC<DetailedPlanFormProps> = ({
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
  const [selectedGrade, setSelectedGrade] = useState<string>('KG');
  const [planLanguage, setPlanLanguage] = useState<'bn' | 'en' | 'ar'>('bn');
  const [subject, setSubject] = useState<string>('English (Literacy)');
  const [teacherName, setTeacherName] = useState<string>('Kabir Ustadh');
  const [activeTab, setActiveTab] = useState<'toc' | 'pages' | 'custom' | 'upload'>('toc');
  
  // Page Ranges state
  const [pageRanges, setPageRanges] = useState<{ id: string; start: number | string; end: number | string }[]>([
    { id: 'detailed_rng_1', start: 1, end: 5 }
  ]);

  // TOC Selection
  const [selectedChapter, setSelectedChapter] = useState<TOCChapter>(MADRASAH_CLASS_5_TOC[3]);
  const [selectedTopic, setSelectedTopic] = useState<TOCTopic>(MADRASAH_CLASS_5_TOC[3].topics[9]);
  const [selectedTopics, setSelectedTopics] = useState<TOCTopic[]>([MADRASAH_CLASS_5_TOC[3].topics[9]]);
  
  // Custom Topic Data
  const [customTopicTitle, setCustomTopicTitle] = useState('Colors (Red, Blue, Yellow)');
  const [customChapterTitle, setCustomChapterTitle] = useState('Foundational Literacy');
  const [content, setContent] = useState('Identifying red, blue, and yellow objects by pointing and naming them with flashcards and toys.');

  // Auto-sync when uploadedChapters change
  useEffect(() => {
    if (uploadedChapters && uploadedChapters.length > 0) {
      const firstCh = uploadedChapters[0];
      setSelectedChapter(firstCh);
      setCustomChapterTitle(firstCh.title);
      if (firstCh.topics && firstCh.topics.length > 0) {
        setSelectedTopic(firstCh.topics[0]);
        setSelectedTopics([firstCh.topics[0]]);
        setCustomTopicTitle(`${firstCh.topics[0].topicNumber ? `${firstCh.topics[0].topicNumber}. ` : ''}${firstCh.topics[0].title}`);
        setContent(firstCh.topics[0].contentExcerpt || `বইয়ের সংশ্লিষ্ট পাঠ: ${firstCh.topics[0].title} (পৃষ্ঠা ${firstCh.topics[0].pageNumber}${firstCh.topics[0].endPageNumber ? `-${firstCh.topics[0].endPageNumber}` : ''})`);
        
        const start = firstCh.topics[0].pageNumber || 1;
        const end = firstCh.topics[0].endPageNumber || firstCh.topics[0].pageNumber || 5;
        setPageRanges([{ id: `rng_${Date.now()}`, start, end }]);
      }
    }
  }, [uploadedChapters]);

  // Detailed settings
  const [totalDuration, setTotalDuration] = useState<number>(30);
  const [planDays, setPlanDays] = useState<number>(1);
  const [planLength, setPlanLength] = useState<PlanLengthMode>('standard_3page');
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

  const updateSelectionData = (topics: TOCTopic[], chapter?: TOCChapter | null) => {
    setSelectedTopics(topics);
    if (chapter) {
      setSelectedChapter(chapter);
      setCustomChapterTitle(chapter.title);
    }

    if (topics.length === 0) {
      setSelectedTopic(null);
      setCustomTopicTitle('');
      setContent('');
      return;
    }

    const primaryTopic = topics[0];
    setSelectedTopic(primaryTopic);

    if (topics.length === 1) {
      setCustomTopicTitle(`${primaryTopic.topicNumber ? `${primaryTopic.topicNumber}. ` : ''}${primaryTopic.title}`);
      setContent(primaryTopic.contentExcerpt || `বইয়ের সংশ্লিষ্ট পাঠ: ${primaryTopic.title} (পৃষ্ঠা ${primaryTopic.pageNumber}${primaryTopic.endPageNumber ? `-${primaryTopic.endPageNumber}` : ''})`);
      const start = primaryTopic.pageNumber || 1;
      const end = primaryTopic.endPageNumber || primaryTopic.pageNumber || 5;
      setPageRanges([{ id: `rng_${Date.now()}`, start, end }]);
    } else {
      const titles = topics.map(t => `${t.topicNumber ? `${t.topicNumber}. ` : ''}${t.title}`).join(', ');
      setCustomTopicTitle(`${titles} (একত্রে ${topics.length}টি পাঠ)`);

      const contentLines = topics.map((t, idx) => 
        `• [পাঠ ${idx + 1}] ${t.title} (পৃষ্ঠা ${t.pageNumber}${t.endPageNumber ? `-${t.endPageNumber}` : ''})${t.contentExcerpt ? `: ${t.contentExcerpt}` : ''}`
      ).join('\n');
      setContent(`একত্রে নির্বাচিত পাঠ ও বিষয়সমূহ (${topics.length}টি):\n${contentLines}`);

      const pages = topics.flatMap(t => {
        const p = [];
        if (t.pageNumber) p.push(Number(t.pageNumber));
        if (t.endPageNumber) p.push(Number(t.endPageNumber));
        return p;
      }).filter(p => !isNaN(p));

      if (pages.length > 0) {
        const minPage = Math.min(...pages);
        const maxPage = Math.max(...pages);
        setPageRanges([{ id: `rng_${Date.now()}`, start: minPage, end: maxPage }]);
      }
    }
  };

  const handleTopicSelect = (chapter: TOCChapter, topic: TOCTopic) => {
    handleToggleTopic(chapter, topic);
  };

  const handleToggleTopic = (chapter: TOCChapter, topic: TOCTopic) => {
    const exists = selectedTopics.some(t => t.id === topic.id);
    const updated = exists
      ? selectedTopics.filter(t => t.id !== topic.id)
      : [...selectedTopics, topic];
    updateSelectionData(updated, chapter);
  };

  const handleSelectFullChapter = (chapter: TOCChapter) => {
    if (!chapter.topics || chapter.topics.length === 0) {
      setSelectedChapter(chapter);
      setCustomChapterTitle(chapter.title);
      setCustomTopicTitle(`সম্পূর্ণ অধ্যায়: ${chapter.title}`);
      setContent(`সম্পূর্ণ অধ্যায়: ${chapter.title} (পৃষ্ঠা ${chapter.startPage}-${chapter.endPage})`);
      setPageRanges([{ id: `rng_${Date.now()}`, start: chapter.startPage, end: chapter.endPage }]);
      return;
    }

    const allSelected = chapter.topics.every(t => selectedTopics.some(st => st.id === t.id));
    let updated: TOCTopic[];
    if (allSelected) {
      const chTopicIds = new Set(chapter.topics.map(t => t.id));
      updated = selectedTopics.filter(t => !chTopicIds.has(t.id));
    } else {
      const existingIds = new Set(selectedTopics.map(t => t.id));
      const toAdd = chapter.topics.filter(t => !existingIds.has(t.id));
      updated = [...selectedTopics, ...toAdd];
    }
    updateSelectionData(updated, chapter);
  };

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
      console.error("Error uploading files in DetailedPlanForm:", err);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let topicTitle = customTopicTitle || 'আরবি শব্দ শিক্ষা ও মুখস্থকরণ';
    let chapterTitle = customChapterTitle || 'স্বাধীন বিষয়';

    if (activeTab === 'toc') {
      topicTitle = `${selectedTopic.topicNumber ? `${selectedTopic.topicNumber}. ` : ''}${selectedTopic.title}`;
      chapterTitle = selectedChapter.title;
    } else if (activeTab === 'pages') {
      const pageDesc = pageRanges.map((r, i) => `পৃষ্ঠা ${r.start}-${r.end}`).join(', ');
      topicTitle = customTopicTitle ? `${customTopicTitle} (${pageDesc})` : `পাঠ্যবই (${pageDesc})`;
      chapterTitle = customChapterTitle || uploadedBookTitle || 'পাঠ্যবই অংশ';
    } else if (activeTab === 'custom') {
      topicTitle = customTopicTitle.trim() || 'আরবি শব্দ শিক্ষা ও মুখস্থকরণ';
      chapterTitle = customChapterTitle.trim() || 'স্বাধীন বিষয় (বই ছাড়া)';
    }

    const firstRange = pageRanges[0] || { start: 1, end: 5 };
    const cleanRanges = activeTab === 'custom' ? [] : pageRanges.map(r => ({
      start: r.start,
      end: r.end
    }));

    const request: DetailedPlanRequest = {
      topicTitle,
      chapterTitle,
      gradeLevel: selectedGrade,
      subject: subject || (activeTab === 'custom' ? 'আরবি ভাষা ও শব্দভাণ্ডার' : 'English (Literacy)'),
      teacherName: teacherName || 'Kabir Ustadh',
      totalDurationMinutes: totalDuration,
      planDays: planDays,
      planLength: planLength,
      content: content || `Lesson content for ${topicTitle}`,
      file: activeTab === 'custom' ? null : uploadedFile,
      fileData: activeTab === 'custom' ? null : fileBase64,
      mimeType: activeTab === 'custom' ? '' : fileMime,
      startPage: activeTab === 'custom' ? undefined : firstRange.start,
      endPage: activeTab === 'custom' ? undefined : firstRange.end,
      pageRanges: cleanRanges,
      additionalInstructions: additionalInstructions.trim(),
      language: planLanguage,
      isStandaloneTopic: activeTab === 'custom'
    };

    onSubmit(request);
  };

  return (
    <div id="detailed-plan-form-card" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 md:p-7 shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              লেসন প্ল্যান তৈরি করুন (100% Copy-to-Copy Template)
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            মাদরাসাতুস সুন্নাহর অফিসিয়াল টেমপ্লেট ও ফর্মুলা অনুযায়ী ১০০% হুবহু লেসন প্ল্যান তৈরি ও ডাউনলোড করুন
          </p>
        </div>

        {onSelectSample && (
          <button
            type="button"
            onClick={onSelectSample}
            className="px-3.5 py-2 text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-100/70 hover:bg-teal-200 dark:bg-teal-950/60 dark:hover:bg-teal-900 rounded-xl border border-teal-300 dark:border-teal-800 transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm cursor-pointer"
            title="ইউনিক আনুষ্ঠানিক শ্রেণি পর্যবেক্ষণ (Formal Observation) মাস্টার প্ল্যান লোড করুন"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span>🌟 আনুষ্ঠানিক পর্যবেক্ষণ মাস্টার প্ল্যান দেখুন</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Language Selection Bar: Bangla, English, Arabic */}
        <div className="p-4 bg-gradient-to-r from-teal-50/80 via-emerald-50/60 to-cyan-50/80 dark:from-teal-950/50 dark:via-slate-900/60 dark:to-emerald-950/50 border border-teal-200 dark:border-teal-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-teal-600 dark:bg-teal-700 text-white rounded-xl shadow-xs shrink-0">
              <Globe className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  লেসন প্ল্যান তৈরির ভাষা নির্বাচন (PLAN LANGUAGE)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  ৩টি ভাষা সমর্থিত
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                {planLanguage === 'bn' && '🇧🇩 বাংলা সক্রিয়: বিষয় আরবি হলেও সম্পূর্ণ লেসন প্ল্যান ও টেবিল ১০০% প্রমিত বাংলায় বাম থেকে ডানে (LTR) তৈরি হবে।'}
                {planLanguage === 'en' && '🇬🇧 English selected: The entire lesson plan and table will be in English from left to right (LTR).'}
                {planLanguage === 'ar' && '🇸🇦 العربية مفعلة: سيتم إنشاء خطة الدرس بالكامل باللغة العربية الفصحى من اليمين إلى اليسار (RTL).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-teal-200 dark:border-teal-800 shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              id="lang-select-bn"
              onClick={() => setPlanLanguage('bn')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                planLanguage === 'bn'
                  ? 'bg-teal-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>🇧🇩 বাংলা</span>
            </button>
            <button
              type="button"
              id="lang-select-en"
              onClick={() => setPlanLanguage('en')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                planLanguage === 'en'
                  ? 'bg-teal-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>🇬🇧 English</span>
            </button>
            <button
              type="button"
              id="lang-select-ar"
              onClick={() => setPlanLanguage('ar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                planLanguage === 'ar'
                  ? 'bg-teal-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>🇸🇦 العربية</span>
            </button>
          </div>
        </div>
        {/* Row 1: Grade Level, Subject, Teacher's Name, Duration, Plan Days */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Class */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-teal-600" />
              Class / শ্রেণি
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="KG">KG</option>
              <option value="Play">Play</option>
              <option value="Nursery">Nursery</option>
              <option value="১ম শ্রেণি (Class 1)">১ম শ্রেণি (Class 1)</option>
              <option value="২য় শ্রেণি (Class 2)">২য় শ্রেণি (Class 2)</option>
              <option value="৩য় শ্রেণি (Class 3)">৩য় শ্রেণি (Class 3)</option>
              <option value="৪র্থ শ্রেণি (Class 4)">৪র্থ শ্রেণি (Class 4)</option>
              <option value="৫ম শ্রেণি (Class 5)">৫ম শ্রেণি (Class 5)</option>
              <option value="৬ষ্ঠ শ্রেণি (Class 6)">৬ষ্ঠ শ্রেণি (Class 6)</option>
              <option value="৭ম শ্রেণি (Class 7)">৭ম শ্রেণি (Class 7)</option>
              <option value="৮ম শ্রেণি (Class 8)">৮ম শ্রেণি (Class 8)</option>
              <option value="৯ম-১০ম শ্রেণি">৯ম-১০ম শ্রেণি</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-teal-600" />
              Subject / বিষয়
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. English (Literacy)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Teacher's Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-600" />
              Teacher’s name / শিক্ষক
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Kabir Ustadh"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Plan Scope: 1, 2, 3, 4 Days */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                পরিকল্পনার ব্যাপ্তি
              </span>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded">
                {planDays} দিন
              </span>
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPlanDays(d)}
                  className={`py-2 text-[11px] font-bold rounded-lg border transition-all text-center ${
                    planDays === d
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {d} দিন
                </button>
              ))}
            </div>
          </div>

          {/* Duration per Session */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              সময় (প্রতি সেশন)
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[25, 30, 40, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTotalDuration(mins)}
                  className={`py-2 text-[11px] font-bold rounded-lg border transition-all text-center ${
                    totalDuration === mins
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plan Length & Page Structure Selector */}
        <div className="bg-gradient-to-r from-teal-50/70 via-emerald-50/50 to-slate-50 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-teal-200/80 dark:border-teal-900/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              লেসন প্লানের আকার / পৃষ্ঠা কাঠামো (Plan Length):
            </label>
            <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-white/90 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 self-start sm:self-auto shadow-2xs">
              {planLength === 'standard_3page' ? '★ প্রস্তাবিত: অফিসিয়াল মাত্র ৩ পৃষ্ঠা' : planLength === 'compact' ? '১-২ পৃষ্ঠা সংক্ষিপ্ত' : '৪+ পৃষ্ঠা বড় ও বিস্তারিত'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setPlanLength('compact')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                planLength === 'compact'
                  ? 'bg-white dark:bg-slate-900 border-teal-600 ring-2 ring-teal-500/25 shadow-sm'
                  : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">১. সংক্ষিপ্ত (১-২ পৃষ্ঠা)</span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Compact</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                সংক্ষিপ্ত ও কার্যকর বুলেট পয়েন্ট, দ্রুত ক্লাস গ্রহণ ও ১-২ পৃষ্ঠার প্রিন্টের জন্য উপযুক্ত।
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPlanLength('standard_3page')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                planLength === 'standard_3page'
                  ? 'bg-white dark:bg-slate-900 border-teal-600 ring-2 ring-teal-500/30 shadow-md'
                  : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-teal-800 dark:text-teal-300 flex items-center gap-1">
                  ২. মাত্র ৩ পৃষ্ঠা (আদর্শ) ★
                </span>
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/80 px-1.5 py-0.5 rounded">
                  ডিফল্ট
                </span>
              </div>
              <p className="text-[11px] text-teal-950 dark:text-teal-200 leading-snug font-medium">
                মাদরাসাতুস সুন্নাহ ফরমাল অবজারভেশন মাস্টার টেমপ্লেট — নিখুঁতভাবে ঠিক ৩ পৃষ্ঠায় শেষ হয়।
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPlanLength('extended')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                planLength === 'extended'
                  ? 'bg-white dark:bg-slate-900 border-teal-600 ring-2 ring-teal-500/25 shadow-sm'
                  : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">৩. বড় / বিস্তারিত (৪ পৃষ্ঠা)</span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Extended</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                পূর্ণাঙ্গ ব্যাখ্যা, শিক্ষক-শিক্ষার্থী প্রশ্নোত্তর, বিস্তারিত অ্যাক্টিভিটি ও গভীর শিখন নিশ্চিতকরণ।
              </p>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
          <button
            type="button"
            id="detailed-tab-toc"
            onClick={() => setActiveTab('toc')}
            className={`py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'toc'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="truncate">১. বইয়ের সূচিপত্র (TOC)</span>
          </button>

          <button
            type="button"
            id="detailed-tab-pages"
            onClick={() => setActiveTab('pages')}
            className={`py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pages'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4 shrink-0 text-teal-600" />
            <span className="truncate">২. পৃষ্ঠা নম্বর দিয়ে (Page Range)</span>
          </button>

          <button
            type="button"
            id="detailed-tab-custom"
            onClick={() => setActiveTab('custom')}
            className={`py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-teal-500/50 dark:border-teal-600 ring-2 ring-teal-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="truncate">৩. কাস্টম বিষয় (বই ছাড়া স্বাধীন প্ল্যান)</span>
          </button>

          <button
            type="button"
            id="detailed-tab-upload"
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">৪. ফাইল / ছবি আপলোড</span>
          </button>
        </div>

        {/* Tab 1: TOC Selector */}
        {activeTab === 'toc' && (
          <div className="space-y-4 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <TOCSelector
              chapters={uploadedChapters || MADRASAH_CLASS_5_TOC}
              bookTitle={uploadedBookTitle || 'ইসলামিক স্টাডিজ'}
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
              onSelectMultipleTopics={(topics, ch) => updateSelectionData(topics, ch)}
              onClearAllSelected={() => updateSelectionData([], selectedChapter)}
              onUploadPdf={onUploadPdf}
              isExtractingPdf={isExtractingPdf}
              extractionProgress={extractionProgress}
              accentColor="teal"
              allowMultiSelect={true}
              title="বইয়ের সূচিপত্র থেকে অধ্যায় ও পাঠ নির্বাচন করুন"
            />

            {/* Editable Page Range for the selected topic */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <PageRangeSelector
                ranges={pageRanges}
                onChange={setPageRanges}
                accentColor="teal"
                title="নির্বাচিত পাঠের পৃষ্ঠা নম্বর ও অতিরিক্ত সীমা (Page Range)"
                subtitle="সূচিপত্রের পাঠের সাথে পৃষ্ঠা নম্বর পরিবর্তন বা একাধিক পৃষ্ঠা রেঞ্জ যোগ করতে পারেন"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Dedicated Page Range Selector */}
        {activeTab === 'pages' && (
          <div className="space-y-5 p-5 rounded-2xl bg-teal-50/30 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-900/40">
            <div className="flex items-center gap-2 pb-2 border-b border-teal-200/50 dark:border-teal-900/40">
              <span className="p-1.5 bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded-lg">
                <Hash className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  সরাসরি পৃষ্ঠা নম্বর ও একাধিক পৃষ্ঠা সীমা দিয়ে পাঠ পরিকল্পনা তৈরি
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  সূচিপত্র না থাকলেও বইয়ের যেকোনো পৃষ্ঠা (যেমন: পৃষ্ঠা ৫ থেকে ১০ বা একাধিক রেঞ্জ) নির্বাচন করে সরাসরি লেসন প্ল্যান তৈরি করুন
                </p>
              </div>
            </div>

            {/* Page Range Selector Component */}
            <PageRangeSelector
              ranges={pageRanges}
              onChange={setPageRanges}
              accentColor="teal"
              title="পৃষ্ঠা নম্বর ও একাধিক সীমা নির্ধারণ (Page Ranges)"
              subtitle="শুরু ও শেষ পৃষ্ঠা নম্বর দিন। প্রয়োজনে '+ পৃষ্ঠা রেঞ্জ যোগ করুন' বাটনে ক্লিক করে আরও পৃষ্ঠা রেঞ্জ যোগ করুন"
            />

            {/* Optional Topic / Chapter context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Topic / পাঠের শিরোনাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                  placeholder="যেমন: সূরা আল-ফাতিহা বা পাঠের বিষয়"
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Chapter / বই বা অধ্যায়ের নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={customChapterTitle}
                  onChange={(e) => setCustomChapterTitle(e.target.value)}
                  placeholder="যেমন: আকাইদ ও ফিকহ অথবা ১ম অধ্যায়"
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                অতিরিক্ত নির্দেশ বা বিষয়বস্তু সারাংশ (ঐচ্ছিক)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                placeholder="পৃষ্ঠা নম্বরের পাশাপাশি কোনো নির্দিষ্ট বিষয়ের উপর জোর দিতে চাইলে এখানে লিখুন..."
                className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Custom Text / Standalone Topic (No Book Needed) */}
        {activeTab === 'custom' && (
          <div className="space-y-4 p-4 md:p-5 rounded-2xl bg-gradient-to-b from-teal-50/50 via-slate-50/40 to-white dark:from-teal-950/20 dark:via-slate-900/40 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800/80 shadow-xs">
            {/* Standalone Feature Banner */}
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      বই ছাড়া সরাসরি বিষয় লিখে তৈরি করুন (১০০% স্বাধীন এআই প্ল্যান)
                    </h4>
                    <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                      বইমুক্ত মোড সক্রিয়
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    কোনো বই, অধ্যায় বা পিডিএফের সাহায্য ছাড়াই আপনি শুধু বিষয় বা যে শব্দগুলো শেখাতে চান তা লিখে দিন। এআই নিজের পেডাগোজিক্যাল বুদ্ধিমত্তা দিয়ে খেলাধুলা, আনন্দের কৌশল, শিখনফল ও পূর্ণাঙ্গ লেসন প্ল্যান তৈরি করবে।
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Sample Templates */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>এক ক্লিকে নমুনা লোড করুন (দ্রুত ট্রাই করার জন্য):</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomTopicTitle('আরবি ৪টি শব্দ আনন্দের সাথে মুখস্থকরণ (ورد, انبج, هدية, يد)');
                    setCustomChapterTitle('আরবি শব্দভাণ্ডার ও কথোপকথন');
                    setSubject('আরবি ভাষা ও শব্দভাণ্ডার (اللغة العربية)');
                    setSelectedGrade('১ম শ্রেণি (Class 1)');
                    setPlanLanguage('bn');
                    setContent(`و-ورد গোলাপ\nء-انبج আম\nه-هدية উপহার\nي-يد হাত\n\nএই শব্দগুলো শিক্ষার্থীদের আনন্দের সাথে, খেলাধুলা, ছবি ও অঙ্গভঙ্গির মাধ্যমে ক্লাসেই মুখস্থ করাতে হবে। কোনো বইয়ের দরকার নেই; আনন্দদায়ক পেডাগোজিক্যাল পদ্ধতি (Flashcards, TPR, Fun Repetition Game) ব্যবহার করে লেসন প্ল্যান তৈরি করুন।`);
                  }}
                  className="p-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:border-teal-400 text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="text-[11px] font-black text-teal-800 dark:text-teal-300 group-hover:text-teal-600 flex items-center gap-1">
                    <span>🇸🇦 আপনার নমুনা: আরবি শব্দ</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    ورد, انبج, هدية, يد আনন্দের সাথে খেলাচ্ছলে মুখস্থকরণ
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomTopicTitle('তাজবীদ: নূন সাকিন ও তানভীনের ইখফা');
                    setCustomChapterTitle('সহীহ কুরআন তিলাওয়াত ও তাজবীদ');
                    setSubject('কুরআন ও তাজবীদ');
                    setSelectedGrade('২য় শ্রেণি (Class 2)');
                    setPlanLanguage('bn');
                    setContent(`নূন সাকিন ও তানভীনের ইখফা হরফসমূহ (১৫টি)। শিশুদের জন্য সহজে চেনার ছড়া ও গুন্নাহ করে উচ্চারণের আনন্দদায়ক মুখস্থ কৌশল। মুখে মুখে অনুশীলন ও দলীয় কার্যক্রম।`);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:border-teal-400 text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 group-hover:text-teal-600 flex items-center gap-1">
                    <span>📖 তাজবীদ ও মাখরাজ</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    ইখফার হরফ ও গুন্নাহ মুখে মুখে অনুশীলন
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomTopicTitle('Actions & Verbs with TPR (Jump, Run, Read, Eat)');
                    setCustomChapterTitle('Early Phonics & Communication');
                    setSubject('English (Literacy)');
                    setSelectedGrade('KG');
                    setPlanLanguage('en');
                    setContent(`Teaching 4 action words: Jump, Run, Read, Eat through movement, mime, Simon Says game, and flashcards. Focus on joy and active physical movement.`);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:border-teal-400 text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 group-hover:text-teal-600 flex items-center gap-1">
                    <span>🇬🇧 English Phonics & TPR</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    Action words with Simon Says game
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomTopicTitle('১ থেকে ১০ পর্যন্ত মজার গণনা ও বস্তু দিয়ে হিসাব');
                    setCustomChapterTitle('প্রাথমিক সংখ্যার ধারণা');
                    setSubject('প্রাথমিক গণিত');
                    setSelectedGrade('Play');
                    setPlanLanguage('bn');
                    setContent(`ব্লক, মার্বেল ও রঙিন ফলমূল ব্যবহার করে হাতে-কলমে ১ থেকে ১০ পর্যন্ত গণনা। ছড়ার মাধ্যমে আঙুল গুনে আনন্দদায়ক শিক্ষা।`);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:border-teal-400 text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 group-hover:text-teal-600 flex items-center gap-1">
                    <span>🔢 গণিত: বস্তু দিয়ে গণনা</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    রঙিন খেলনা ও আঙুল গুনে বাস্তব গণনা
                  </p>
                </button>
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Topic / পাঠ বা বিষয়ের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                  placeholder="যেমন: আরবি ৪টি শব্দ আনন্দের সাথে মুখস্থকরণ (ورد, انبج, هدية, يد)"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  অধ্যায় / বিভাগ বা বিষয় (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={customChapterTitle}
                  onChange={(e) => setCustomChapterTitle(e.target.value)}
                  placeholder="যেমন: আরবি শব্দভাণ্ডার / স্বাধীন পাঠ্যক্রম"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>কী শেখাতে চান ও বিশেষ চাওয়া (শব্দ তালিকা, আনন্দের কৌশল, খেলাধুলা ইত্যাদি)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                  বইয়ের দরকার নেই, বিস্তারিত লিখে দিন
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder={`যেমন:\nو-ورد গোলাপ\nء-انبج আম\nه-هدية উপহার\nي-يد হাত\nএই শব্দগুলো শিক্ষার্থীদের আনন্দের সাথে, খেলাধুলা ও ছন্দের মাধ্যমে মুখস্থ করাতে হবে।`}
                className="w-full p-3.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100 leading-relaxed font-mono"
              />
            </div>

            {/* Reassurance Footer Badge */}
            <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-medium">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>এআই নিজের মাস্টার পেডাগোজিক্যাল দক্ষতায় ক্লাসরুমের ধাপ (Warm-up, Fun Games, Guided Memorization, Review), C.W, H.W ও শিখনফল নিখুঁতভাবে তৈরি করবে।</span>
              </div>
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-700 shrink-0">
                বইয়ের সাহায্য ছাড়া প্রস্তুত
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Upload File & Library */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
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
              accentColor="teal"
              uploadTitle="বইয়ের পাতা, স্ক্যান কপি, পিডিএফ বা ওয়ার্ড ফাইল আপলোড করুন"
              uploadSubtitle="একসাথে একাধিক ফাইল (২ বা ৩টি বই/ফাইল) নির্বাচন ও আপলোড করতে পারেন"
            />

            {/* Optional Page Range for Uploaded File */}
            <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <PageRangeSelector
                ranges={pageRanges}
                onChange={setPageRanges}
                accentColor="teal"
                title="আপলোডকৃত ফাইলের নির্দিষ্ট পৃষ্ঠা নম্বর ও সীমা (Page Ranges)"
                subtitle="পুরো ফাইল না নিয়ে নির্দিষ্ট কিছু পৃষ্ঠা থেকে পাঠ পরিকল্পনা তৈরি করতে চাইলে পৃষ্ঠা নম্বর উল্লেখ করুন"
              />
            </div>
          </div>
        )}

        {/* Additional Custom Instructions */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
            বিশেষ নির্দেশনা বা উপকরণ অগ্রাধিকার (ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="যেমন: Flashcards ও toys ব্যবহার করুন, Smartboard interaction রাখুন"
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
              isLoading 
                ? 'bg-teal-400 cursor-not-allowed' 
                : 'bg-teal-600 hover:bg-teal-700 hover:shadow-teal-500/20 shadow-lg active:scale-[0.99]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isLoading ? 'লেসন প্ল্যান তৈরি করা হচ্ছে...' : 'হুবহু টেমপ্লেট অনুযায়ী লেসন প্ল্যান তৈরি করুন'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
