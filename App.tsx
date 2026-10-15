import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  FileText, 
  BookMarked, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight,
  Upload,
  Clock,
  ListChecks
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { ExerciseGeneratorForm } from './components/ExerciseGeneratorForm';
import { ExerciseDisplay } from './components/ExerciseDisplay';
import LessonForm from './components/LessonForm';
import PlanDisplay from './components/PlanDisplay';
import { DetailedPlanForm } from './components/DetailedPlanForm';
import { DetailedPlanDisplay } from './components/DetailedPlanDisplay';
import { PDFTableOfContents, SelectedTopicItem } from './components/PDFTableOfContents';
import { 
  AppMode, 
  ExerciseRequest, 
  GeneratedExercise, 
  GenerationState, 
  HistoryItem, 
  LessonPlanRequest, 
  DetailedPlanRequest, 
  DetailedLessonPlan,
  GradeLevel,
  TOCChapter,
  SavedBook
} from './types';
import { normalizeChapters } from './utils/tocNormalizer';
import { 
  generateExercise, 
  generateLessonPlan, 
  generateDetailedPlan,
  regenerateSingleDay,
  extractPdfTableOfContents
} from './services/geminiService';
import { saveStoredFile, deleteStoredFile } from './services/dbService';
import { SAMPLE_DEFAULT_EXERCISE } from './constants/madrasahBookData';
import { DEFAULT_SAMPLE_LESSON_PLAN } from './constants/defaultSamplePlan';
import { EXACT_SAMPLE_DETAILED_PLAN } from './constants/sampleDetailedPlan';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  saveHistoryToFirestore, 
  fetchHistoryFromFirestore, 
  deleteHistoryFromFirestore, 
  clearHistoryFromFirestore,
  fetchBooksFromFirestore,
  saveBookToFirestore,
  deleteBookFromFirestore,
  testConnection 
} from './services/firebase';

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

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode | 'toc_browser'>('exercise');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // Global Dynamic Uploaded Book State (starts empty - no preloaded Islamic studies books)
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>(() => {
    try {
      const stored = localStorage.getItem('madrasahSavedBooks');
      const parsed: SavedBook[] = stored ? JSON.parse(stored) : [];
      return parsed.map(b => ({
        ...b,
        chapters: normalizeChapters(b.chapters)
      }));
    } catch (e) {
      console.error("Failed to read saved books from localStorage", e);
      return [];
    }
  });
  const [uploadedBookChapters, setUploadedBookChapters] = useState<TOCChapter[] | null>(null);
  const [uploadedBookTitle, setUploadedBookTitle] = useState<string>('');
  const [isExtractingBookPdf, setIsExtractingBookPdf] = useState<boolean>(false);
  const [bookExtractionProgress, setBookExtractionProgress] = useState<string>('');

  // Active Results State for each mode
  const [currentExercise, setCurrentExercise] = useState<GeneratedExercise | null>(null);
  const [currentExerciseRequest, setCurrentExerciseRequest] = useState<ExerciseRequest | null>(null);

  const [currentLessonPlanContent, setCurrentLessonPlanContent] = useState<string | null>(null);
  const [currentLessonPlanRequest, setCurrentLessonPlanRequest] = useState<LessonPlanRequest | null>(null);

  const [currentDetailedPlan, setCurrentDetailedPlan] = useState<DetailedLessonPlan | null>(null);
  const [currentDetailedPlanRequest, setCurrentDetailedPlanRequest] = useState<DetailedPlanRequest | null>(null);

  // Pre-filled data from TOC Multi-Selection
  const [prefilledTopics, setPrefilledTopics] = useState<SelectedTopicItem[] | null>(null);
  const [prefilledContent, setPrefilledContent] = useState<string>('');
  const [prefilledPdfFile, setPrefilledPdfFile] = useState<File | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Sync dark mode class to root document & persist
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      console.error("Failed to update theme", e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const resultRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    progress: 0,
    statusMessage: '',
    error: null,
    result: null,
  });

  // Test connection & Subscribe to Firebase Auth changes
  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const firestoreHistory = await fetchHistoryFromFirestore(currentUser.uid);
          if (firestoreHistory && firestoreHistory.length > 0) {
            setHistory(firestoreHistory);
          }
        } catch (err) {
          console.error("Failed to load history from Firestore", err);
        }

        try {
          const firestoreBooks = await fetchBooksFromFirestore(currentUser.uid);
          if (firestoreBooks && firestoreBooks.length > 0) {
            setSavedBooks(firestoreBooks);
          }
        } catch (err) {
          console.error("Failed to load saved books from Firestore", err);
        }
      } else {
        try {
          const savedHistory = localStorage.getItem('madrasahAppHistory');
          if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
          }
        } catch (e) {
          console.error("Failed to read history from localStorage", e);
        }

        try {
          const storedBooks = localStorage.getItem('madrasahSavedBooks');
          if (storedBooks) {
            setSavedBooks(JSON.parse(storedBooks));
          }
        } catch (e) {
          console.error("Failed to read saved books from localStorage", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync history to localStorage as offline fallback
  useEffect(() => {
    try {
      const cleanHistory = history.map(item => {
        return {
          ...item,
          exerciseRequest: item.exerciseRequest ? { ...item.exerciseRequest, file: null, fileData: null } : undefined,
          lessonPlanRequest: item.lessonPlanRequest ? { ...item.lessonPlanRequest, file: null, fileData: null, pageImages: [] } : undefined,
          detailedPlanRequest: item.detailedPlanRequest ? { ...item.detailedPlanRequest, file: null, fileData: null } : undefined,
        };
      });
      localStorage.setItem('madrasahAppHistory', JSON.stringify(cleanHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  // Sync savedBooks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('madrasahSavedBooks', JSON.stringify(savedBooks));
    } catch (e) {
      console.error("Failed to save books to localStorage", e);
    }
  }, [savedBooks]);

  useEffect(() => {
    if ((currentExercise || currentLessonPlanContent || currentDetailedPlan) && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentExercise, currentLessonPlanContent, currentDetailedPlan]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      alert("লগইন করতে সমস্যা হয়েছে: " + (err.message || "অজানা ত্রুটি"));
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err: any) {
      alert("লগআউট করতে সমস্যা হয়েছে");
    }
  };

  // Save Book handler (Local + Cloud)
  const handleSaveBook = (book: SavedBook) => {
    const normalizedBook: SavedBook = {
      ...book,
      chapters: normalizeChapters(book.chapters)
    };
    setSavedBooks(prev => {
      const filtered = prev.filter(b => b.id !== normalizedBook.id && b.title !== normalizedBook.title);
      return [normalizedBook, ...filtered];
    });

    if (user) {
      saveBookToFirestore(user.uid, normalizedBook).catch(err => {
        console.error("Error saving book to Firestore:", err);
      });
    }
  };

  // Select a Saved Book to load its TOC into the current editor
  const handleSelectBook = (book: SavedBook) => {
    const normalized = normalizeChapters(book.chapters);
    setUploadedBookChapters(normalized);
    setUploadedBookTitle(book.title);
  };

  // Update an existing saved book's metadata (e.g. title, category, gradeLevel)
  const handleUpdateBook = (updatedBook: SavedBook) => {
    setSavedBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    if (uploadedBookTitle === updatedBook.title || (uploadedBookChapters && uploadedBookChapters === updatedBook.chapters)) {
      setUploadedBookTitle(updatedBook.title);
      setUploadedBookChapters(updatedBook.chapters);
    }
    if (user) {
      saveBookToFirestore(user.uid, updatedBook).catch(err => {
        console.error("Error updating book in Firestore:", err);
      });
    }
  };

  // Delete a saved book
  const handleDeleteBook = (bookId: string) => {
    setSavedBooks(prev => {
      const remaining = prev.filter(b => b.id !== bookId);
      try {
        localStorage.setItem('madrasahSavedBooks', JSON.stringify(remaining));
      } catch (e) {
        console.error("Failed to sync deletion to localStorage", e);
      }
      return remaining;
    });

    const targetBook = savedBooks.find(b => b.id === bookId);
    if (targetBook && (uploadedBookTitle === targetBook.title || uploadedBookTitle === targetBook.fileName)) {
      setUploadedBookTitle('');
      setUploadedBookChapters(null);
    }

    // Also delete associated stored file in IndexedDB if exists
    deleteStoredFile(bookId).catch(() => {});

    if (user) {
      deleteBookFromFirestore(user.uid, bookId).catch(err => {
        console.error("Error deleting book from Firestore:", err);
      });
    }
  };

  // Global Dynamic File/PDF Upload and Instant TOC Extraction (Supports multiple files simultaneously)
  const handleBookUpload = async (filesInput: File | File[] | FileList) => {
    const filesArray: File[] = Array.isArray(filesInput) 
      ? filesInput 
      : filesInput instanceof FileList 
        ? Array.from(filesInput) 
        : [filesInput];

    if (filesArray.length === 0) return;

    setIsExtractingBookPdf(true);
    const totalFiles = filesArray.length;

    for (let index = 0; index < totalFiles; index++) {
      const file = filesArray[index];
      const filePrefix = totalFiles > 1 ? `[${index + 1}/${totalFiles}] "${file.name}": ` : '';
      setBookExtractionProgress(`${filePrefix}ফাইল ব্রাউজারে পড়া ও সংরক্ষণ করা হচ্ছে...`);

      try {
        let initialPagesText = '';
        let numPages = 1;
        let fileDataUrl = '';

        // Read file as base64 for IndexedDB storage
        try {
          fileDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });
        } catch (readErr) {
          console.warn("Could not convert file to DataURL for storage:", readErr);
        }

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const pdfjsLib = await loadPdfJs();
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          numPages = pdf.numPages;

          const pagesToScan = Math.min(12, numPages);
          setBookExtractionProgress(`${filePrefix}সূচিপত্রের পাতা স্ক্যান করা হচ্ছে (১-${pagesToScan})...`);
          
          // Fast parallel page extraction
          const pagePromises = [];
          for (let i = 1; i <= pagesToScan; i++) {
            pagePromises.push(
              pdf.getPage(i).then(async (page: any) => {
                const textContent = await page.getTextContent();
                const pageStr = textContent.items.map((item: any) => item.str).join(' ');
                return `\n--- PAGE ${i} ---\n` + pageStr;
              }).catch(() => '')
            );
          }
          const pageTexts = await Promise.all(pagePromises);
          initialPagesText = pageTexts.join('\n');
        } else if (file.name.match(/\.(txt|md|csv|json)$/i)) {
          initialPagesText = await file.text();
        } else {
          initialPagesText = `File Name: ${file.name}\nFile Size: ${file.size} bytes\nType: ${file.type}`;
        }

        // Save to IndexedDB StoredFiles so it immediately shows in the library
        if (fileDataUrl) {
          try {
            await saveStoredFile({
              id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: file.size,
              data: fileDataUrl,
              extractedText: initialPagesText
            });
          } catch (dbErr) {
            console.warn("Could not save file to StoredFile IndexedDB:", dbErr);
          }
        }

        setBookExtractionProgress(`${filePrefix}সূচিপত্র ও পাঠ্যসূচি গোছানো হচ্ছে...`);
        const result = await extractPdfTableOfContents({
          extractedText: initialPagesText.substring(0, 20000),
          fileName: file.name
        }, (progress, msg) => {
          setBookExtractionProgress(`${filePrefix}${msg}`);
        });

        if (result && result.chapters && result.chapters.length > 0) {
          const detectedTitle = result.bookTitle || file.name.replace(/\.[^/.]+$/, "");
          const detectedCategory = result.category || 'কুরআন ও তাফসির';
          const detectedGrade = result.gradeLevel || GradeLevel.Grade5;

          const newSavedBook: SavedBook = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'book_' + Date.now() + '_' + index,
            title: detectedTitle,
            fileName: file.name,
            pageCount: numPages,
            gradeLevel: detectedGrade,
            category: detectedCategory,
            subject: detectedCategory,
            chapters: result.chapters,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          setUploadedBookChapters(result.chapters);
          setUploadedBookTitle(detectedTitle);
          handleSaveBook(newSavedBook);
        } else {
          throw new Error("No structured chapters found");
        }
      } catch (err: any) {
        console.warn("Structured extraction fallback applied for:", file.name, err);
        const fallbackTitle = file.name.replace(/\.[^/.]+$/, "");
        const fallbackChapters: TOCChapter[] = [
          {
            id: `ch_${Date.now()}_1`,
            title: fallbackTitle,
            startPage: 1,
            endPage: 25,
            topics: [
              {
                id: `t_${Date.now()}_1_1`,
                topicNumber: '১',
                title: 'পাঠ ১: মূল আলোচনা ও বিষয়বস্তু',
                pageNumber: 1,
                endPageNumber: 8,
                contentExcerpt: `${fallbackTitle} সম্পর্কিত প্রাথমিক পাঠ ও আলোচনা`
              },
              {
                id: `t_${Date.now()}_1_2`,
                topicNumber: '২',
                title: 'পাঠ ২: বিশদ বিশ্লেষণ ও প্রশ্নোত্তর',
                pageNumber: 9,
                endPageNumber: 18,
                contentExcerpt: `${fallbackTitle} সম্পর্কিত বিশদ জ্ঞান ও মূল্যায়ন`
              }
            ]
          }
        ];

        const newSavedBook: SavedBook = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'book_' + Date.now() + '_' + index,
          title: fallbackTitle,
          fileName: file.name,
          pageCount: 25,
          gradeLevel: GradeLevel.Grade5,
          category: 'সাধারণ ও ইসলামিক বিষয়',
          subject: 'সাধারণ বিষয়',
          chapters: fallbackChapters,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        setUploadedBookChapters(fallbackChapters);
        setUploadedBookTitle(fallbackTitle);
        handleSaveBook(newSavedBook);
      }
    }

    setIsExtractingBookPdf(false);
    setBookExtractionProgress('');
  };

  // 1. GENERATE EXERCISE & QUESTIONS
  const handleGenerateExercise = async (request: ExerciseRequest) => {
    setCurrentExerciseRequest(request);
    setCurrentExercise(null);
    setState({ 
      isLoading: true, 
      progress: 10, 
      statusMessage: 'পাঠ্যের বিষয়বস্তু প্রস্তুত করা হচ্ছে...', 
      error: null, 
      result: null 
    });
    
    try {
      const generated = await generateExercise(request, (progress, message) => {
        setState(prev => ({ ...prev, progress, statusMessage: message }));
      });
      
      setCurrentExercise(generated);

      const newItem: HistoryItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        timestamp: Date.now(),
        mode: 'exercise',
        gradeLevel: request.gradeLevel,
        topicTitle: request.topicTitle,
        chapterTitle: request.chapterTitle,
        previewText: `অনুশীলনী: ${request.topicTitle} (${request.gradeLevel})`,
        fullContent: JSON.stringify(generated),
        exerciseData: generated,
        exerciseRequest: request
      };

      setHistory(prev => [newItem, ...prev].slice(0, 100));

      if (user) {
        saveHistoryToFirestore(user.uid, newItem).catch(err => {
          console.error("Error saving history item to Firestore:", err);
        });
      }
      
      setState({
        isLoading: false,
        progress: 100,
        statusMessage: 'সম্পন্ন!',
        error: null,
        result: JSON.stringify(generated),
      });
    } catch (error: any) {
      setState({
        isLoading: false,
        progress: 0,
        statusMessage: '',
        error: error.message || "অনুশীলনী তৈরি করার সময় একটি ত্রুটি ঘটেছে",
        result: null,
      });
    }
  };

  // 2. GENERATE LESSON PLAN (Routine / Notes)
  const handleGenerateLessonPlan = async (request: LessonPlanRequest) => {
    setCurrentLessonPlanRequest(request);
    setCurrentLessonPlanContent(null);
    setState({ 
      isLoading: true, 
      progress: 10, 
      statusMessage: 'পাঠ পরিকল্পনা ও রুটিন তৈরি করা হচ্ছে...', 
      error: null, 
      result: null 
    });

    try {
      const resultText = await generateLessonPlan(request, (progress, message) => {
        setState(prev => ({ ...prev, progress, statusMessage: message }));
      });

      setCurrentLessonPlanContent(resultText);

      const newItem: HistoryItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        timestamp: Date.now(),
        mode: 'lesson_notes',
        gradeLevel: request.gradeLevel,
        topicTitle: request.topicTitle || 'পাঠ পরিকল্পনা',
        previewText: `পাঠ পরিকল্পনা (${request.duration} দিন) - ${request.gradeLevel}`,
        fullContent: resultText,
        lessonPlanRequest: request
      };

      setHistory(prev => [newItem, ...prev].slice(0, 100));

      if (user) {
        saveHistoryToFirestore(user.uid, newItem).catch(err => {
          console.error("Error saving history item to Firestore:", err);
        });
      }

      setState({
        isLoading: false,
        progress: 100,
        statusMessage: 'সম্পন্ন!',
        error: null,
        result: resultText,
      });
    } catch (error: any) {
      setState({
        isLoading: false,
        progress: 0,
        statusMessage: '',
        error: error.message || "পাঠ পরিকল্পনা তৈরি করার সময় একটি ত্রুটি ঘটেছে",
        result: null,
      });
    }
  };

  // 3. GENERATE DETAILED LESSON PLAN
  const handleGenerateDetailedPlan = async (request: DetailedPlanRequest) => {
    setCurrentDetailedPlanRequest(request);
    setCurrentDetailedPlan(null);
    setState({ 
      isLoading: true, 
      progress: 10, 
      statusMessage: 'বিস্তারিত পাঠ পরিকল্পনা ও পেডাগোজিক্যাল কাঠামো তৈরি করা হচ্ছে...', 
      error: null, 
      result: null 
    });

    try {
      const planData = await generateDetailedPlan(request, (progress, message) => {
        setState(prev => ({ ...prev, progress, statusMessage: message }));
      });

      if (planData) {
        planData.language = request.language || 'bn';
      }

      setCurrentDetailedPlan(planData);

      const newItem: HistoryItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        timestamp: Date.now(),
        mode: 'detailed_plan',
        gradeLevel: request.gradeLevel,
        topicTitle: request.topicTitle,
        chapterTitle: request.chapterTitle,
        previewText: `বিস্তারিত পরিকল্পনা: ${request.topicTitle} (${request.gradeLevel})`,
        fullContent: JSON.stringify(planData),
        detailedPlanData: planData,
        detailedPlanRequest: request
      };

      setHistory(prev => [newItem, ...prev].slice(0, 100));

      if (user) {
        saveHistoryToFirestore(user.uid, newItem).catch(err => {
          console.error("Error saving history item to Firestore:", err);
        });
      }

      setState({
        isLoading: false,
        progress: 100,
        statusMessage: 'সম্পন্ন!',
        error: null,
        result: JSON.stringify(planData),
      });
    } catch (error: any) {
      setState({
        isLoading: false,
        progress: 0,
        statusMessage: '',
        error: error.message || "বিস্তারিত পাঠ পরিকল্পনা তৈরি করার সময় একটি ত্রুটি ঘটেছে",
        result: null,
      });
    }
  };

  // Handler from PDF Table of Contents: Create Questions
  const handleTOCGenerateQuestions = (
    selectedTopics: SelectedTopicItem[], 
    extractedContent: string,
    file?: File | null
  ) => {
    setPrefilledTopics(selectedTopics);
    setPrefilledContent(extractedContent);
    setPrefilledPdfFile(file || null);

    const firstTopic = selectedTopics[0];
    const topicTitles = selectedTopics.map(t => `${t.topic.topicNumber ? `${t.topic.topicNumber}. ` : ''}${t.topic.title}`).join(', ');

    const request: ExerciseRequest = {
      topicTitle: topicTitles,
      chapterTitle: firstTopic ? firstTopic.chapterTitle : 'সাধারণ অধ্যায়',
      gradeLevel: GradeLevel.Grade5,
      content: extractedContent,
      file: file || null,
      selectedQuestionTypes: ['short', 'mcq', 'true_false', 'blank', 'essay'],
      questionCounts: {
        short: 2,
        mcq: 4,
        true_false: 3,
        blank: 3,
        essay: 1,
        match: 4
      },
      difficulty: 'medium',
      additionalInstructions: `নির্বাচিত ${selectedTopics.length}টি পাঠের প্রতিটি থেকে গুরুত্বপূর্ণ প্রশ্ন অন্তর্ভুক্ত করুন।`
    };

    setCurrentMode('exercise');
    handleGenerateExercise(request);
  };

  // Handler from PDF Table of Contents: Create Lesson Plan
  const handleTOCGenerateLessonPlan = (
    selectedTopics: SelectedTopicItem[],
    extractedContent: string,
    language?: string
  ) => {
    const topicTitles = selectedTopics.map(t => t.topic.title).join(', ');
    const firstPage = Math.min(...selectedTopics.map(t => t.topic.pageNumber));
    const lastPage = Math.max(...selectedTopics.map(t => t.topic.endPageNumber || t.topic.pageNumber));

    const request: LessonPlanRequest = {
      gradeLevel: GradeLevel.Grade5,
      duration: Math.max(3, Math.min(10, selectedTopics.length * 2)),
      startDate: new Date().toISOString().split('T')[0],
      startPage: firstPage,
      endPage: lastPage,
      pageRanges: [{ start: firstPage, end: lastPage }],
      extractedText: extractedContent,
      topicTitle: topicTitles,
      additionalContext: `নির্বাচিত পাঠসমূহ: ${topicTitles}`,
      language: language || 'bn'
    };

    setCurrentMode('lesson_notes');
    handleGenerateLessonPlan(request);
  };

  // Handler from PDF Table of Contents: Create Detailed Plan
  const handleTOCGenerateDetailedPlan = (
    selectedTopics: SelectedTopicItem[],
    extractedContent: string,
    language?: string
  ) => {
    const firstTopic = selectedTopics[0];
    const topicTitles = selectedTopics.map(t => t.topic.title).join(' ও ');

    const request: DetailedPlanRequest = {
      topicTitle: topicTitles,
      chapterTitle: firstTopic ? firstTopic.chapterTitle : 'পাঠ্য অধ্যায়',
      gradeLevel: GradeLevel.Grade5,
      subject: 'সাধারণ বিষয়',
      totalDurationMinutes: 40,
      content: extractedContent,
      teachingMethodology: 'প্রশ্নোত্তর, দলগত আলোচনা ও সক্রিয় অংশগ্রহণ পদ্ধতি',
      language: language || 'bn'
    };

    setCurrentMode('detailed_plan');
    handleGenerateDetailedPlan(request);
  };

  // Single Day Regeneration for Lesson Plan
  const handleRegenerateDay = async (date: string, previousContent: string) => {
    if (!currentLessonPlanRequest) {
      throw new Error("পাঠ পরিকল্পনার অনুরোধ পাওয়া যায়নি");
    }
    return await regenerateSingleDay(currentLessonPlanRequest, date, previousContent);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setCurrentMode(item.mode);
    if (item.mode === 'exercise') {
      if (item.exerciseData) {
        setCurrentExercise(item.exerciseData);
      } else if (item.fullContent) {
        try { setCurrentExercise(JSON.parse(item.fullContent)); } catch (e) {}
      }
      if (item.exerciseRequest) setCurrentExerciseRequest(item.exerciseRequest);
    } else if (item.mode === 'lesson_notes') {
      if (item.fullContent) setCurrentLessonPlanContent(item.fullContent);
      if (item.lessonPlanRequest) setCurrentLessonPlanRequest(item.lessonPlanRequest);
    } else if (item.mode === 'detailed_plan') {
      if (item.detailedPlanData) {
        setCurrentDetailedPlan(item.detailedPlanData);
      } else if (item.fullContent) {
        try { setCurrentDetailedPlan(JSON.parse(item.fullContent)); } catch (e) {}
      }
      if (item.detailedPlanRequest) setCurrentDetailedPlanRequest(item.detailedPlanRequest);
    }

    setState({
      isLoading: false,
      progress: 100,
      statusMessage: '',
      error: null,
      result: item.fullContent
    });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (user) {
      deleteHistoryFromFirestore(user.uid, id).catch(err => {
        console.error("Error deleting item from Firestore:", err);
      });
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে সমস্ত ইতিহাস মুছে ফেলতে চান?")) {
      setHistory([]);
      if (user) {
        clearHistoryFromFirestore(user.uid).catch(err => {
          console.error("Error clearing history in Firestore:", err);
        });
      }
    }
  };

  const handleResetCurrent = () => {
    setState({ isLoading: false, progress: 0, statusMessage: '', error: null, result: null });
    setCurrentExercise(null);
    setCurrentLessonPlanContent(null);
    setCurrentDetailedPlan(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen bg-[#fcfdfd] dark:bg-[#0b0f17] text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        history={history}
        onSelectHistory={handleHistorySelect}
        onDeleteHistory={handleDeleteHistory}
        onClearHistory={handleClearHistory}
        savedBooks={savedBooks}
        onSelectBook={handleSelectBook}
        onDeleteBook={handleDeleteBook}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full transition-all duration-300 z-10">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 lg:px-8 flex flex-col min-h-full">
            
            {/* Top Navigation: 3 Main Buttons as Requested */}
            <div className="mb-6">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Button 1: Create exercises and questions */}
                  <button
                    type="button"
                    id="btn-nav-exercise"
                    onClick={() => {
                      setCurrentMode('exercise');
                    }}
                    className={`px-4 py-3.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2.5 transition-all text-center ${
                      currentMode === 'exercise'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>অনুশীলনী ও প্রশ্নপত্র তৈরি</span>
                  </button>

                  {/* Button 2: Create a lesson plan */}
                  <button
                    type="button"
                    id="btn-nav-lesson-plan"
                    onClick={() => {
                      setCurrentMode('lesson_notes');
                    }}
                    className={`px-4 py-3.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2.5 transition-all text-center ${
                      currentMode === 'lesson_notes'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600'
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>পাঠ পরিকল্পনা তৈরি</span>
                  </button>

                  {/* Button 3: Create a detailed lesson plan */}
                  <button
                    type="button"
                    id="btn-nav-detailed-plan"
                    onClick={() => {
                      setCurrentMode('detailed_plan');
                    }}
                    className={`px-4 py-3.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2.5 transition-all text-center ${
                      currentMode === 'detailed_plan'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>বিস্তারিত পাঠ পরিকল্পনা তৈরি</span>
                  </button>
                </div>

                {/* Sub-bar: Quick access to Interactive PDF Table of Contents Browser */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <BookMarked className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>পিডিএফ আপলোড ও সূচিপত্র থেকে মাল্টি-সিলেক্ট করতে চান?</span>
                  </div>

                  <button
                    type="button"
                    id="btn-toggle-pdf-toc"
                    onClick={() => setCurrentMode(currentMode === 'toc_browser' ? 'exercise' : 'toc_browser')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentMode === 'toc_browser'
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <BookMarked className="w-3.5 h-3.5" />
                    <span>{currentMode === 'toc_browser' ? 'অনুশীলনী ফর্মে ফেরত যান' : 'পিডিএফ সূচিপত্র ও মাল্টি-সিলেক্ট খুলুন'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {state.error && (
              <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-5 border border-rose-200 dark:border-rose-900/60 max-w-2xl mx-auto animate-in fade-in">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-rose-100 dark:bg-rose-900/60 p-2 rounded-xl">
                    <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="ml-3.5 flex-1">
                    <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">কার্যক্রম সম্পাদনে ত্রুটি হয়েছে</h3>
                    <p className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-400 leading-relaxed whitespace-pre-line">{state.error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 1: PDF Table of Contents Browser & Multi-Select */}
            {currentMode === 'toc_browser' && (
              <div className="animate-in fade-in duration-300">
                <PDFTableOfContents 
                  chapters={uploadedBookChapters}
                  bookTitle={uploadedBookTitle}
                  savedBooks={savedBooks}
                  onSelectSavedBook={handleSelectBook}
                  onUpdateBook={handleUpdateBook}
                  onDeleteBook={handleDeleteBook}
                  onBookExtracted={handleSaveBook}
                  onGenerateQuestions={handleTOCGenerateQuestions}
                  onGenerateLessonPlan={handleTOCGenerateLessonPlan}
                  onGenerateDetailedPlan={handleTOCGenerateDetailedPlan}
                  onUploadPdf={handleBookUpload}
                  isExtractingPdf={isExtractingBookPdf}
                  extractionProgress={bookExtractionProgress}
                />
              </div>
            )}

            {/* VIEW 2: Mode 1 - Exercise & Question Generator */}
            {currentMode === 'exercise' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold mb-2 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    স্মার্ট প্রশ্নপত্র ও কারিকুলাম ইঞ্জিন
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    স্মার্ট <span className="text-emerald-600 dark:text-emerald-400">অনুশীলনী ও পরীক্ষা তৈরি করুন</span>
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    পাঠ্যবই বা সূচিপত্র থেকে সংক্ষিপ্ত প্রশ্ন, বহুনির্বাচনী প্রশ্ন (MCQ), সত্য/মিথ্যা ও পূর্ণাঙ্গ সমাধান তৈরি করুন
                  </p>
                </div>

                <div className="w-full max-w-4xl mx-auto">
                  <ExerciseGeneratorForm 
                    uploadedChapters={uploadedBookChapters}
                    uploadedBookTitle={uploadedBookTitle}
                    savedBooks={savedBooks}
                    onSelectSavedBook={handleSelectBook}
                    onUpdateSavedBook={handleUpdateBook}
                    onDeleteSavedBook={handleDeleteBook}
                    onUploadPdf={handleBookUpload}
                    isExtractingPdf={isExtractingBookPdf}
                    extractionProgress={bookExtractionProgress}
                    onSubmit={handleGenerateExercise}
                    isLoading={state.isLoading}
                    onSelectSample={() => {
                      setCurrentExercise(SAMPLE_DEFAULT_EXERCISE);
                    }}
                  />
                </div>

                {/* Generated Exercise Display */}
                {currentExercise && (
                  <div ref={resultRef} className="mt-12 mb-16 w-full max-w-4xl mx-auto scroll-mt-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow mr-4"></div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <BookOpen className="w-3.5 h-3.5" />
                        প্রস্তুতকৃত স্মার্ট অনুশীলনী
                      </span>
                      <div className="h-px bg-slate-200 dark:bg-slate-800 flex-grow ml-4"></div>
                    </div>

                    <ExerciseDisplay 
                      exercise={currentExercise}
                      onSave={() => alert("অনুশীলনী সংরক্ষিত হয়েছে!")}
                      onRegenerate={() => {
                        if (currentExerciseRequest) handleGenerateExercise(currentExerciseRequest);
                      }}
                      onNewExercise={handleResetCurrent}
                      isRegenerating={state.isLoading}
                    />
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: Mode 2 - Lesson Plan (Routine / Notes) */}
            {currentMode === 'lesson_notes' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold mb-2 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    দৈনিক রুটিন ও পাঠ পরিকল্পনা
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    কার্যকর <span className="text-emerald-600 dark:text-emerald-400">পাঠ পরিকল্পনা তৈরি</span>
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    শ্রেণির কাজ (C.W) ও বাড়ির কাজ (H.W) এর সমন্বিত সূচি ও ইন্টারঅ্যাক্টিভ ডায়েরি
                  </p>
                </div>

                <div className="w-full max-w-4xl mx-auto">
                  <LessonForm 
                    uploadedChapters={uploadedBookChapters}
                    uploadedBookTitle={uploadedBookTitle}
                    savedBooks={savedBooks}
                    onSelectSavedBook={handleSelectBook}
                    onUpdateSavedBook={handleUpdateBook}
                    onDeleteSavedBook={handleDeleteBook}
                    onUploadPdf={handleBookUpload}
                    isExtractingPdf={isExtractingBookPdf}
                    extractionProgress={bookExtractionProgress}
                    onSubmit={handleGenerateLessonPlan}
                    isLoading={state.isLoading}
                    progress={state.progress}
                    statusMessage={state.statusMessage}
                  />
                </div>

                {/* Lesson Plan Content Display */}
                {currentLessonPlanContent && (
                  <div ref={resultRef} className="mt-12 mb-16 w-full max-w-5xl mx-auto scroll-mt-10 space-y-6">
                    <PlanDisplay 
                      content={currentLessonPlanContent}
                      onReset={handleResetCurrent}
                      onRegenerateDay={handleRegenerateDay}
                    />
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: Mode 3 - Detailed Lesson Plan */}
            {currentMode === 'detailed_plan' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold mb-2 shadow-sm">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    শিক্ষক সহায়িকা ও বিস্তারিত প্ল্যানিং
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    পূর্ণাঙ্গ <span className="text-emerald-600 dark:text-emerald-400">বিস্তারিত পাঠ পরিকল্পনা তৈরি</span>
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    শিখনফল, বিষয়বস্তু বিশ্লেষণ, শিক্ষক-শিক্ষার্থী কার্যক্রম ও সময়বণ্টনসহ আন্তর্জাতিক মানের পেডাগোজিক্যাল প্ল্যান
                  </p>
                </div>

                <div className="w-full max-w-4xl mx-auto">
                  <DetailedPlanForm 
                    uploadedChapters={uploadedBookChapters}
                    uploadedBookTitle={uploadedBookTitle}
                    savedBooks={savedBooks}
                    onSelectSavedBook={handleSelectBook}
                    onUpdateSavedBook={handleUpdateBook}
                    onDeleteSavedBook={handleDeleteBook}
                    onUploadPdf={handleBookUpload}
                    isExtractingPdf={isExtractingBookPdf}
                    extractionProgress={bookExtractionProgress}
                    onSubmit={handleGenerateDetailedPlan}
                    isLoading={state.isLoading}
                    onSelectSample={() => {
                      setCurrentDetailedPlan(EXACT_SAMPLE_DETAILED_PLAN);
                      setTimeout(() => {
                        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                  />
                </div>

                {/* Detailed Lesson Plan Content Display */}
                {currentDetailedPlan && (
                  <div ref={resultRef} className="mt-12 mb-16 w-full max-w-5xl mx-auto scroll-mt-10 space-y-6">
                    <DetailedPlanDisplay 
                      plan={currentDetailedPlan}
                      onReset={handleResetCurrent}
                      onRegenerate={() => {
                        if (currentDetailedPlanRequest) handleGenerateDetailedPlan(currentDetailedPlanRequest);
                      }}
                      onRegenerateWithLength={(length) => {
                        if (currentDetailedPlanRequest) {
                          handleGenerateDetailedPlan({
                            ...currentDetailedPlanRequest,
                            planLength: length
                          });
                        }
                      }}
                      isRegenerating={state.isLoading}
                    />
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
