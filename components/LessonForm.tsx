
import { Upload, Calendar, Layers, AlertCircle, X, FileType, Loader2, Sparkles, ChevronRight, PenTool, Hash, Clock, Database, Trash2, Check, BookOpen, FileText, ClipboardList, RefreshCw, Copy, BookMarked, Sliders, Baby, Brain, Lightbulb, CheckCircle2, Globe } from 'lucide-react';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GradeLevel, LessonPlanRequest, TOCChapter, TOCTopic, SavedBook, getGradeAgeIntellectProfile } from '../types';
import FilePreview from './FilePreview';
import { saveStoredFile, getAllStoredFiles, deleteStoredFile, clearAllStoredFiles, StoredFile, getSampleLessonPlan, saveSampleLessonPlan, deleteSampleLessonPlan } from '../services/dbService';
import { DEFAULT_SAMPLE_LESSON_PLAN } from '../constants/defaultSamplePlan';
import { MADRASAH_CLASS_5_TOC } from '../constants/madrasahBookData';
import { TOCSelector } from './TOCSelector';
import StoredFilesManager from './StoredFilesManager';


const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200; // Optimal size for legibility and payload weight
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Convert to quality 0.75 jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

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
      reject(new Error("পিডিএফ রিডার লোড করা যায়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।"));
    };
    document.head.appendChild(script);
  });
};

const extractTextFromPdf = async (
  file: File, 
  ranges: { start: number | string; end: number | string }[]
): Promise<string> => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  const numPages = pdf.numPages;
  
  for (const range of ranges) {
    const sPage = parseInt(String(range.start), 10) || 1;
    const ePage = parseInt(String(range.end), 10) || numPages;
    
    // Calculate exact bounds
    const start = Math.max(1, Math.min(sPage, numPages));
    const end = Math.max(start, Math.min(ePage, numPages));
    
    for (let i = start; i <= end; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
  }
  
  return fullText;
};

const processPdfFile = async (
  file: File, 
  ranges: { start: number | string; end: number | string }[]
): Promise<{ extractedText: string; pageImages: string[] }> => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  const pageImages: string[] = [];
  const numPages = pdf.numPages;
  const MAX_IMAGE_PAGES = 25; // Safe threshold for rendering scanned pages

  for (const range of ranges) {
    const sPage = parseInt(String(range.start), 10) || 1;
    const ePage = parseInt(String(range.end), 10) || numPages;
    
    const start = Math.max(1, Math.min(sPage, numPages));
    const end = Math.max(start, Math.min(ePage, numPages));
    
    for (let i = start; i <= end; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';

      // If page text is sparse (< 25 characters, indicating image/scanned page),
      // render canvas image so Gemini multimodal vision engine can process it
      const isScannedPage = !pageText || pageText.trim().length < 25;
      if (isScannedPage && pageImages.length < MAX_IMAGE_PAGES) {
        try {
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            
            // Constrain canvas dimensions to max 1200px to maintain legibility while keeping payload lightweight
            let targetCanvas = canvas;
            const maxDim = 1200;
            if (canvas.width > maxDim || canvas.height > maxDim) {
              const resizedCanvas = document.createElement('canvas');
              let w = canvas.width;
              let h = canvas.height;
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
              resizedCanvas.width = w;
              resizedCanvas.height = h;
              const rCtx = resizedCanvas.getContext('2d');
              rCtx?.drawImage(canvas, 0, 0, w, h);
              targetCanvas = resizedCanvas;
            }

            const imgData = targetCanvas.toDataURL('image/jpeg', 0.8);
            pageImages.push(imgData);
          }
        } catch (renderErr) {
          console.warn(`Could not render page ${i} to image:`, renderErr);
        }
      }
    }
  }

  return { extractedText: fullText.trim(), pageImages };
};

interface LessonFormProps {
  uploadedChapters?: TOCChapter[] | null;
  uploadedBookTitle?: string;
  savedBooks?: SavedBook[];
  onSelectSavedBook?: (book: SavedBook) => void;
  onUpdateSavedBook?: (book: SavedBook) => void;
  onDeleteSavedBook?: (bookId: string) => void;
  onUploadPdf?: (files: File | File[]) => void;
  isExtractingPdf?: boolean;
  extractionProgress?: string;
  onSubmit: (request: LessonPlanRequest) => void;
  isLoading: boolean;
  progress: number;
  statusMessage: string;
}

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const LessonForm: React.FC<LessonFormProps> = ({ 
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
  progress, 
  statusMessage 
}) => {
  const [sourceTab, setSourceTab] = useState<'toc' | 'upload' | 'custom'>('toc');
  const [selectedChapter, setSelectedChapter] = useState<TOCChapter>(MADRASAH_CLASS_5_TOC[3]);
  const [selectedTopic, setSelectedTopic] = useState<TOCTopic>(MADRASAH_CLASS_5_TOC[3].topics[9]);
  const [selectedTopics, setSelectedTopics] = useState<TOCTopic[]>([MADRASAH_CLASS_5_TOC[3].topics[9]]);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(5);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pageRanges, setPageRanges] = useState<{ id: string; start: number | string; end: number | string }[]>([
    { id: 'default', start: 67, end: 72 }
  ]);
  // Defaulting to Grade 5 (পঞ্চম শ্রেণি) as requested
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.Grade5);
  const [planLanguage, setPlanLanguage] = useState<'bn' | 'en' | 'ar'>('bn');
  const [context, setContext] = useState<string>(MADRASAH_CLASS_5_TOC[3].topics[9].contentExcerpt || '');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingPdf, setIsReadingPdf] = useState<boolean>(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>('');

  // Auto-sync chapter & topic when uploadedChapters change
  useEffect(() => {
    if (uploadedChapters && uploadedChapters.length > 0) {
      const firstCh = uploadedChapters[0];
      setSelectedChapter(firstCh);
      if (firstCh.topics && firstCh.topics.length > 0) {
        setSelectedTopic(firstCh.topics[0]);
        setSelectedTopics([firstCh.topics[0]]);
        const start = firstCh.topics[0].pageNumber || 1;
        const end = firstCh.topics[0].endPageNumber || firstCh.topics[0].pageNumber || 10;
        setPageRanges([{ id: 'default', start, end }]);
        setContext(firstCh.topics[0].contentExcerpt || `অধ্যায়: ${firstCh.title}\nপাঠ: ${firstCh.topics[0].title} (পৃষ্ঠা ${start}-${end})`);
      }
    }
  }, [uploadedChapters]);

  const updateLessonSelection = (topics: TOCTopic[], chapter?: TOCChapter) => {
    setSelectedTopics(topics);
    if (chapter) setSelectedChapter(chapter);

    if (topics.length === 0) {
      setSelectedTopic(null as any);
      setContext(chapter ? `অধ্যায়: ${chapter.title}` : '');
      return;
    }

    const first = topics[0];
    setSelectedTopic(first);

    const pages = topics.flatMap(t => {
      const arr = [];
      if (t.pageNumber) arr.push(Number(t.pageNumber));
      if (t.endPageNumber) arr.push(Number(t.endPageNumber));
      return arr;
    }).filter(n => !isNaN(n));

    const minPage = pages.length > 0 ? Math.min(...pages) : (first.pageNumber || 1);
    const maxPage = pages.length > 0 ? Math.max(...pages) : (first.endPageNumber || first.pageNumber || 10);

    setPageRanges([{ id: 'default', start: minPage, end: maxPage }]);

    if (topics.length === 1) {
      setContext(first.contentExcerpt || `অধ্যায়: ${(chapter || selectedChapter)?.title}\nপাঠ: ${first.title} (পৃষ্ঠা ${minPage}-${maxPage})`);
    } else {
      const topicList = topics.map((t, i) => `${i + 1}. ${t.title} (পৃষ্ঠা ${t.pageNumber}${t.endPageNumber ? `-${t.endPageNumber}` : ''})`).join('\n');
      setContext(`একত্রে নির্বাচিত ${topics.length}টি পাঠসমূহ:\n${topicList}\nঅধ্যায়: ${(chapter || selectedChapter)?.title || ''}`);
    }
  };

  const handleToggleTopic = (chapter: TOCChapter, topic: TOCTopic) => {
    const exists = selectedTopics.some(t => t.id === topic.id);
    const updated = exists 
      ? selectedTopics.filter(t => t.id !== topic.id)
      : [...selectedTopics, topic];
    updateLessonSelection(updated, chapter);
  };

  const handleTopicSelect = (chapter: TOCChapter, topic: TOCTopic) => {
    handleToggleTopic(chapter, topic);
  };

  const handleSelectFullChapter = (chapter: TOCChapter) => {
    if (!chapter.topics || chapter.topics.length === 0) return;
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
    updateLessonSelection(updated, chapter);
  };

  // Stored file states
  const [savedFiles, setSavedFiles] = useState<StoredFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [fileBase64Data, setFileBase64Data] = useState<string | null>(null);
  const [fileExtractedText, setFileExtractedText] = useState<string | null>(null);
  
  // Sample lesson plan states
  const [sampleText, setSampleText] = useState<string>(DEFAULT_SAMPLE_LESSON_PLAN);
  const [sampleFileName, setSampleFileName] = useState<string | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [isSampleDragging, setIsSampleDragging] = useState<boolean>(false);
  const [isReadingSample, setIsReadingSample] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sampleFileInputRef = useRef<HTMLInputElement>(null);

  const loadSavedFiles = useCallback(async () => {
    try {
      const files = await getAllStoredFiles();
      setSavedFiles(files);
    } catch (err) {
      console.error("Error loading saved files:", err);
    }
  }, []);

  const loadSamplePlan = useCallback(async () => {
    try {
      const storedSample = await getSampleLessonPlan();
      if (storedSample) {
        setSampleText(storedSample.text);
        setSampleFileName(storedSample.fileName || "uploaded_sample.txt");
        if (storedSample.data) {
          try {
            const reconstructed = dataURLtoFile(storedSample.data, storedSample.fileName || "uploaded_sample.txt");
            setSampleFile(reconstructed);
          } catch (reconstErr) {
            console.error("Error reconstructing sample file:", reconstErr);
            const dummy = new File([storedSample.text], storedSample.fileName || "uploaded_sample.txt", { type: storedSample.type || "text/plain" });
            setSampleFile(dummy);
          }
        } else {
          const dummy = new File([storedSample.text], storedSample.fileName || "uploaded_sample.txt", { type: "text/plain" });
          setSampleFile(dummy);
        }
      } else {
        setSampleText(DEFAULT_SAMPLE_LESSON_PLAN);
        setSampleFileName(null);
        setSampleFile(null);
      }
    } catch (err) {
      console.error("Error loading sample lesson plan:", err);
    }
  }, []);

  useEffect(() => {
    loadSavedFiles();
    loadSamplePlan();
  }, [loadSavedFiles, loadSamplePlan]);

  const handleMultipleFilesUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsReadingPdf(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const selectedFile = files[i];
        if (selectedFile.type === 'application/pdf' && selectedFile.size > 200 * 1024 * 1024) {
          setError(`"${selectedFile.name}" ফাইলটি অনেক বড় (২০০MB এর বেশি)।`);
          continue;
        }

        const prefix = files.length > 1 ? `[${i + 1}/${files.length}] "${selectedFile.name}": ` : '';
        setUploadProgressMsg(`${prefix}ফাইল পড়া ও ব্রাউজারে সংরক্ষণ করা হচ্ছে...`);

        let dataUrl = '';
        let extracted = '';

        if (selectedFile.type.startsWith('image/')) {
          dataUrl = await compressImage(selectedFile);
        } else {
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(selectedFile);
          });
        }

        if (selectedFile.type === 'application/pdf') {
          try {
            extracted = await extractTextFromPdf(selectedFile, pageRanges);
          } catch (pdfErr) {
            console.warn("PDF extraction skipped or failed on initial load", pdfErr);
          }
        }

        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await saveStoredFile({
          id: fileId,
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          data: dataUrl,
          extractedText: extracted
        });

        // Set the first/active file in current state
        if (i === 0 || files.length === 1) {
          setFile(selectedFile);
          setActiveFileId(fileId);
          setFileBase64Data(dataUrl);
          setFileExtractedText(extracted);
        }
      }

      await loadSavedFiles();

      // Trigger global book TOC extraction if callback provided
      if (onUploadPdf) {
        onUploadPdf(files.length === 1 ? files[0] : files);
      }
    } catch (err: any) {
      console.error("Error processing multiple files:", err);
      setError("ফাইলসমূহ প্রসেস ও ব্রাউজারে সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setIsReadingPdf(false);
      setUploadProgressMsg('');
    }
  };

  const handleFileChange = (selectedFile: File) => {
    handleMultipleFilesUpload([selectedFile]);
  };

  const handleSelectSavedFile = async (stored: StoredFile) => {
    try {
      const reconstructedFile = dataURLtoFile(stored.data, stored.name);
      setFile(reconstructedFile);
      setActiveFileId(stored.id);
      setFileBase64Data(stored.data);
      setFileExtractedText(stored.extractedText || '');
    } catch (err) {
      console.error("Error selecting saved file:", err);
      setError("সংরক্ষিত ফাইলটি লোড করতে সমস্যা হয়েছে।");
    }
  };

  const handleDeleteSavedFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteStoredFile(id);
      if (activeFileId === id) {
        setFile(null);
        setActiveFileId(null);
        setFileBase64Data(null);
        setFileExtractedText(null);
      }
      loadSavedFiles();
    } catch (err) {
      console.error("Error deleting saved file:", err);
      setError("সংরক্ষিত ফাইলটি মুছে ফেলা যায়নি।");
    }
  };

  const handleSampleFileChange = async (selectedFile: File) => {
    setError(null);
    setIsReadingSample(true);
    try {
      let text = '';
      let dataUrl = '';

      // Get base64 data URL
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(selectedFile);
      });

      if (selectedFile.type === 'application/pdf') {
        text = await extractTextFromPdf(selectedFile, [{ start: 1, end: 15 }]); // extract first 15 pages of sample
      } else if (selectedFile.type === 'text/plain') {
        text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsText(selectedFile);
        });
      } else if (selectedFile.type.startsWith('image/')) {
        text = `[নমুনা ছবি আপলোড করা হয়েছে: ${selectedFile.name}]`;
      } else {
        // Fallback text read
        try {
          text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsText(selectedFile);
          });
        } catch (e) {
          text = `[নমুনা ফাইল আপলোড করা হয়েছে: ${selectedFile.name}]`;
        }
      }

      await saveSampleLessonPlan(text, selectedFile.name, selectedFile.type, selectedFile.size, dataUrl);
      setSampleText(text);
      setSampleFileName(selectedFile.name);
      setSampleFile(selectedFile);
    } catch (err: any) {
      console.error("Error reading sample file:", err);
      setError("নমুনা ফাইলটি লোড করতে সমস্যা হয়েছে।");
    } finally {
      setIsReadingSample(false);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file && !context.trim()) {
      setError("ফাইল আপলোড করুন অথবা সিলেবাস দিন।");
      return;
    }

    let fileData: string | null = fileBase64Data;
    let mimeType = file ? file.type : '';
    let extractedText = fileExtractedText || '';
    let pageImages: string[] = [];

    if (file) {
      if (file.type === 'application/pdf' && file.size > 500 * 1024 * 1024) {
        setError("পিডিএফ ফাইলটি ৫০০ মেগাবাইটের বেশি। অনুগ্রহ করে ৫০০ মেগাবাইটের কম সাইজের পিডিএফ ব্যবহার করুন।");
        return;
      }

      try {
        if (file.type === 'application/pdf') {
          setIsReadingPdf(true);
          try {
            const pdfResult = await processPdfFile(file, pageRanges);
            extractedText = pdfResult.extractedText;
            pageImages = pdfResult.pageImages;
            mimeType = 'application/pdf';

            if (!fileData) {
              fileData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(file);
              });
            }
          } catch (pdfErr: any) {
            console.error("PDF extraction error:", pdfErr);
            setError(pdfErr.message || "পিডিএফ ফাইলটি পড়া যায়নি। অনুগ্রহ করে সঠিক পিডিএফ আপলোড করুন।");
            return;
          } finally {
            setIsReadingPdf(false);
          }
        } else if (!fileData) {
          if (file.type.startsWith('image/')) {
            fileData = await compressImage(file);
            mimeType = 'image/jpeg';
          } else {
            fileData = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(file);
            });
            mimeType = file.type;
          }
        }
      } catch (err) {
        console.error("Error compressing/reading file:", err);
        setError("ফাইল প্রসেস করতে ত্রুটি হয়েছে। অনুগ্রহ করে অন্য ফাইল ব্যবহার করুন বা ম্যানুয়ালি লিখুন।");
        return;
      }
    }

    if (activeFileId && file && fileData) {
      saveStoredFile({
        id: activeFileId,
        name: file.name,
        type: file.type,
        size: file.size,
        data: fileData,
        extractedText: extractedText
      }).catch(err => console.error("Error updating cache in IndexedDB:", err));
    }

    onSubmit({
      file,
      fileId: activeFileId || undefined,
      fileData,
      mimeType,
      extractedText,
      pageImages,
      duration,
      startDate,
      startPage: pageRanges[0]?.start || 1,
      endPage: pageRanges[0]?.end || 10,
      pageRanges: pageRanges.map(r => ({ start: r.start, end: r.end })),
      gradeLevel: grade,
      additionalContext: context,
      holidays: '',
      weeks: 1, // legacy support
      sampleLessonPlan: sampleText,
      language: planLanguage
    });
  }, [file, activeFileId, fileBase64Data, fileExtractedText, duration, startDate, pageRanges, grade, context, sampleText, planLanguage, onSubmit]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 md:p-12 transition-all relative overflow-hidden max-w-2xl mx-auto">
      <div className="transition-all duration-500">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-5 border border-emerald-100/50 dark:border-emerald-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>স্মার্ট শিক্ষা সহায়ক</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">নতুন রুটিন তৈরি করুন</h2>
          <p className="text-[15px] text-slate-500 dark:text-gray-400 mt-2 font-medium">প্রয়োজনীয় তথ্য দিয়ে আপনার পাঠ পরিকল্পনা তৈরি করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-center text-rose-800 dark:text-rose-300 text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-rose-500 dark:text-rose-400" />
              {error}
            </div>
          )}

          {/* Language Selection Bar: Bangla, English, Arabic */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                <Globe className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    রুটিন ও পাঠ পরিকল্পনার ভাষা
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    ৩টি ভাষা
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  যে ভাষায় রুটিনের C.W, H.W ও পাঠ পরিকল্পনা চান তা বেছে নিন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                id="lesson-lang-select-bn"
                onClick={() => setPlanLanguage('bn')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  planLanguage === 'bn'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                }`}
              >
                <span>🇧🇩 বাংলা</span>
              </button>
              <button
                type="button"
                id="lesson-lang-select-en"
                onClick={() => setPlanLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  planLanguage === 'en'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                }`}
              >
                <span>🇬🇧 English</span>
              </button>
              <button
                type="button"
                id="lesson-lang-select-ar"
                onClick={() => setPlanLanguage('ar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  planLanguage === 'ar'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                }`}
              >
                <span>🇸🇦 العربية</span>
              </button>
            </div>
          </div>

          {/* Source Selection Tabs */}
          <div className="flex bg-slate-100 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setSourceTab('toc')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                sourceTab === 'toc'
                  ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>বইয়ের সূচিপত্র (TOC)</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceTab('upload')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                sourceTab === 'upload'
                  ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>ফাইল আপলোড</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceTab('custom')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                sourceTab === 'custom'
                  ? 'bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>কাস্টম সিলেবাস</span>
            </button>
          </div>

          {/* TOC Tab */}
          {sourceTab === 'toc' && (
            <div className="space-y-4">
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
                onSelectMultipleTopics={(topics, ch) => updateLessonSelection(topics, ch)}
                onClearAllSelected={() => updateLessonSelection([], selectedChapter)}
                onUploadPdf={onUploadPdf}
                isExtractingPdf={isExtractingPdf}
                extractionProgress={extractionProgress}
                accentColor="emerald"
                allowMultiSelect={true}
                title="বইয়ের সূচিপত্র থেকে অধ্যায় ও পাঠ নির্বাচন করুন"
              />
            </div>
          )}

          {/* Upload Tab with Multi-File & Library Support */}
          {sourceTab === 'upload' && (
            <StoredFilesManager
              activeFile={file}
              activeFileId={activeFileId}
              savedFiles={savedFiles}
              onSelectSavedFile={handleSelectSavedFile}
              onDeleteSavedFile={handleDeleteSavedFile}
              onClearAllFiles={async () => {
                await clearAllStoredFiles();
                setFile(null);
                setActiveFileId(null);
                setFileBase64Data(null);
                setFileExtractedText(null);
                loadSavedFiles();
              }}
              onUploadFiles={handleMultipleFilesUpload}
              onRemoveActiveFile={() => {
                setFile(null);
                setActiveFileId(null);
                setFileBase64Data(null);
                setFileExtractedText(null);
              }}
              isUploading={isReadingPdf}
              uploadProgress={uploadProgressMsg}
              accentColor="emerald"
              uploadTitle="সিলেবাস বা পাঠ্যবই ফাইল আপলোড করুন"
              uploadSubtitle="একসাথে একাধিক ফাইল (২ বা ৩টি বই/ফাইল) নির্বাচন ও আপলোড করতে পারেন"
            />
          )}

          {/* Sample Lesson Plan Upload Section */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-[0.15em] ml-1 flex items-center justify-between">
              <span className="flex items-center">
                <ClipboardList className="w-3.5 h-3.5 mr-2 text-emerald-500 dark:text-emerald-400" /> নমুনা পাঠ পরিকল্পনা (ঐচ্ছিক)
              </span>
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider transition-all duration-300 ${
                sampleFile 
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40" 
                  : "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 border border-slate-200/50 dark:border-gray-700"
              }`}>
                {sampleFile ? "কাস্টম নমুনা সক্রিয়" : "ডিফল্ট স্থায়ী নমুনা সক্রিয়"}
              </span>
            </label>

            <div 
              onClick={() => !isLoading && !isReadingSample && sampleFileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); if(!isLoading && !isReadingSample) setIsSampleDragging(true); }}
              onDragLeave={() => setIsSampleDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsSampleDragging(false); if(!isLoading && e.dataTransfer.files[0]) handleSampleFileChange(e.dataTransfer.files[0]); }}
              className={`relative group border-2 border-dashed rounded-[2rem] p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                isSampleDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 scale-[1.01]' : 'border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/5'
              }`}
            >
              {isReadingSample ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-black">নমুনা ফাইল প্রসেস করা হচ্ছে...</p>
                </div>
              ) : !sampleFile ? (
                <>
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 text-slate-400 dark:text-gray-300">
                    <ClipboardList className="w-6 h-6 group-hover:text-white" />
                  </div>
                  <h4 className="text-[15px] font-black text-slate-800 dark:text-white mb-1">এখানে নমুনা পাঠ পরিকল্পনা আপলোড করুন</h4>
                  <p className="text-[11px] text-slate-400 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">PDF, TXT বা ইমেজ ড্র্যাগ করুন</p>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 max-w-sm">এআই এই নমুনার গঠন (Format), ভাষা শৈলী ও সমন্বয় কঠোরভাবে অনুসরণ করে নতুন রুটিন তৈরি করবে</p>
                </>
              ) : (
                <div className="flex items-center space-x-5 w-full bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800/60">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200/50">
                    <FileType className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-grow overflow-hidden">
                    <p className="text-xs font-black truncate text-slate-900 dark:text-white">{sampleFile.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400">
                      {(sampleFile.size / 1024).toFixed(1)} KB • {sampleFile.type || "text/plain"}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      if (window.confirm("আপনি কি আপলোড করা নমুনা ফাইলটি ডিলিট করতে চান? ডিলিট করলে এটি ডিফল্ট নমুনায় ফিরে যাবে।")) {
                        await deleteSampleLessonPlan();
                        setSampleFile(null);
                        setSampleFileName(null);
                        setSampleText(DEFAULT_SAMPLE_LESSON_PLAN);
                      }
                    }} 
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="মুছে ফেলুন ও ডিফল্ট নমুনায় ফিরুন"
                  >
                    <Trash2 className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400" />
                  </button>
                </div>
              )}
              <input 
                ref={sampleFileInputRef} 
                type="file" 
                className="hidden" 
                onChange={(e) => e.target.files && handleSampleFileChange(e.target.files[0])} 
                accept=".pdf,.txt,image/*" 
              />
            </div>
          </div>

          {/* Primary Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-[0.15em] ml-1 flex items-center">
                <Layers className="w-3.5 h-3.5 mr-2 text-emerald-500 dark:text-emerald-400" /> শ্রেণি
              </label>
              <select 
                value={grade} 
                onChange={(e) => setGrade(e.target.value as GradeLevel)} 
                className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-[15px] font-bold text-slate-800 dark:text-gray-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer shadow-sm"
              >
                {Object.values(GradeLevel).map(g => <option key={g} value={g} className="dark:bg-gray-800 dark:text-white">{g}</option>)}
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-[0.15em] ml-1 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-2 text-emerald-500 dark:text-emerald-400" /> শুরুর তারিখ
              </label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 text-[15px] font-bold text-slate-800 dark:text-gray-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all cursor-pointer shadow-sm" 
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-[0.15em] ml-1 flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-2 text-emerald-500 dark:text-emerald-400" /> রুটিনের ব্যাপ্তি (দিন)
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-100/50 dark:border-emerald-800/40">
                {duration === 90 ? '৯০ দিন (৩ মাস)' : duration === 60 ? '৬০ দিন (২ মাস)' : duration === 30 ? '৩০ দিন (১ মাস)' : `${duration} দিন`}
              </span>
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
              {[1, 2, 3, 4, 5, 10, 15, 20, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all border-2 flex flex-col items-center justify-center ${
                    duration === d 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200/50 dark:shadow-emerald-950/50' 
                      : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:border-emerald-200 dark:hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  <span>{d} দিন</span>
                  {d === 30 && <span className="text-[7px] opacity-80 font-normal">১ মাস</span>}
                  {d === 60 && <span className="text-[7px] opacity-80 font-normal">২ মাস</span>}
                  {d === 90 && <span className="text-[7px] opacity-80 font-normal">৩ মাস</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Page Ranges Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em] ml-1 flex items-center">
                <Hash className="w-3.5 h-3.5 mr-2 text-emerald-600 dark:text-emerald-400" /> পৃষ্ঠা সীমা (Page Ranges)
              </label>
              <button
                type="button"
                onClick={() => {
                  const newId = `range_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
                  setPageRanges([...pageRanges, { id: newId, start: '', end: '' }]);
                }}
                className="inline-flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border border-emerald-200/50 dark:border-emerald-800/40 hover:scale-[1.02]"
              >
                <span>+ পৃষ্ঠা রেঞ্জ যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-3">
              {pageRanges.map((range, index) => (
                <div key={range.id} className="flex items-center gap-4 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/30 p-4 rounded-2xl animate-in fade-in-50 zoom-in-95 duration-200">
                  <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 w-16">
                    রেঞ্জ #{index + 1}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 flex-grow">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500">শুরুর পৃষ্ঠা</span>
                      <input 
                        type="number" 
                        value={range.start} 
                        placeholder="১"
                        onChange={(e) => {
                          const updated = [...pageRanges];
                          updated[index].start = e.target.value;
                          setPageRanges(updated);
                        }} 
                        className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-black text-emerald-950 dark:text-emerald-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500">শেষ পৃষ্ঠা</span>
                      <input 
                        type="number" 
                        value={range.end} 
                        placeholder="১০"
                        onChange={(e) => {
                          const updated = [...pageRanges];
                          updated[index].end = e.target.value;
                          setPageRanges(updated);
                        }} 
                        className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-black text-emerald-950 dark:text-emerald-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {pageRanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPageRanges(pageRanges.filter(r => r.id !== range.id));
                      }}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-slate-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors self-end"
                      title="রেঞ্জটি মুছে ফেলুন"
                    >
                      <Trash2 className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Context */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-[0.15em] ml-1 flex items-center">
              <PenTool className="w-3.5 h-3.5 mr-2 text-emerald-500 dark:text-emerald-400" /> অতিরিক্ত নির্দেশাবলী
            </label>
            <textarea 
              value={context} onChange={(e) => setContext(e.target.value)} 
              className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-[2rem] px-7 py-6 text-[15px] font-medium text-slate-700 dark:text-gray-200 min-h-[140px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none leading-relaxed placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm"
              placeholder="পড়া, মুখস্থ করা বা লেখার বিশেষ নির্দেশাবলী এখানে দিন..."
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" disabled={isLoading || isReadingPdf}
            className={`w-full py-6 rounded-[1.75rem] text-white font-black text-xl shadow-2xl transition-all transform active:scale-[0.97] flex flex-col items-center justify-center relative overflow-hidden group ${
              isLoading || isReadingPdf ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200/50'
            }`}
          >
            {isLoading || isReadingPdf ? (
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span className="tracking-tight">
                    {isReadingPdf ? 'সিলেবাস পড়া হচ্ছে...' : 'রুটিন জেনারেট হচ্ছে...'}
                  </span>
                </div>
              </div>
            ) : (
              <span className="flex items-center tracking-tight">
                পাঠ পরিকল্পনা তৈরি করুন
                <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1.5 transition-transform" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LessonForm;
