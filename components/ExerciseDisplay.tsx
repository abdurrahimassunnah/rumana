import React, { useState } from 'react';
import { printDocument } from '../services/printService';
import { 
  GeneratedExercise, 
  ExerciseSection, 
  ExerciseQuestion,
  ExerciseQuestionType
} from '../types';
import { 
  Printer, 
  Copy, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  FileText, 
  Sparkles, 
  Award, 
  Clock, 
  BookOpen, 
  Edit3, 
  Save, 
  Trash2, 
  Plus, 
  HelpCircle,
  Check,
  X,
  RefreshCw,
  Share2,
  FolderPlus,
  PlusCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Bookmark,
  CheckSquare,
  RotateCw
} from 'lucide-react';
import { getSmartAutoQuestion } from '../services/questionBank';
import { SpinBoardQuizModal } from './SpinBoardQuizModal';

interface ExerciseDisplayProps {
  exercise: GeneratedExercise;
  onSave?: (exercise: GeneratedExercise) => void;
  onRegenerate?: () => void;
  onNewExercise?: () => void;
  isRegenerating?: boolean;
}

// Bengali numerals helper
const toBengaliNumber = (n: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
};

const BENGALI_OPTION_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];

const cleanOptionText = (opt: string) => {
  return opt.replace(/^([১-৯১-৪a-dA-Dক-ঘ]\s*[\.\:\-\)]|\([ক-ঘa-dA-D১-৪]\))\s*/, '').trim();
};

export const ExerciseDisplay: React.FC<ExerciseDisplayProps> = ({
  exercise: initialExercise,
  onSave,
  onRegenerate,
  onNewExercise,
  isRegenerating
}) => {
  const [exercise, setExercise] = useState<GeneratedExercise>(initialExercise);
  const [activeTab, setActiveTab] = useState<'teacher' | 'student' | 'answersheet' | 'print' | 'edit'>('teacher');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Spin Board Modal
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);

  // State to track which individual question answers are revealed
  // Map of questionId -> boolean
  const [revealedAnswers, setRevealedAnswers] = useState<{ [qId: string]: boolean }>({});
  // Master state: if true, all are revealed unless overridden
  const [allAnswersRevealed, setAllAnswersRevealed] = useState(false);

  // Adding New Question State (manual form)
  const [addingToSectionIdx, setAddingToSectionIdx] = useState<number | null>(null);
  const [newQuestionType, setNewQuestionType] = useState<ExerciseQuestionType>('short');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');
  const [newQuestionExplanation, setNewQuestionExplanation] = useState('');
  const [newQuestionPoints, setNewQuestionPoints] = useState<number>(2);
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>([
    'বিকল্প ক',
    'বিকল্প খ',
    'বিকল্প গ',
    'বিকল্প ঘ'
  ]);

  // Adding New Section State
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionType, setNewSectionType] = useState<ExerciseQuestionType>('mcq');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionInstructions, setNewSectionInstructions] = useState('');

  // Student test interactive states
  const [studentAnswers, setStudentAnswers] = useState<{ [questionId: string]: any }>({});
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Keep state in sync if parent updates exercise
  React.useEffect(() => {
    setExercise(initialExercise);
  }, [initialExercise]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-exercise-paper');
    if (!printableElement) {
      window.print();
      return;
    }

    const isBn = !/[a-zA-Z]{10,}/.test(exercise.topicTitle || exercise.chapterTitle || '');

    const customCss = `
      .no-print, button, .lucide, [role="button"] { display: none !important; }
      .border-emerald-600 { border-color: #059669 !important; }
      .bg-emerald-50, .bg-emerald-100 { background-color: #ecfdf5 !important; }
      .text-emerald-800 { color: #065f46 !important; }
      .text-slate-900 { color: #0f172a !important; }
      .text-slate-600, .text-slate-500 { color: #475569 !important; }
      #printable-exercise-paper { border: none !important; box-shadow: none !important; padding: 0 !important; }
    `;

    printDocument({
      title: `অনুশীলনী ও মূল্যায়ন পরীক্ষা - ${exercise.topicTitle || exercise.chapterTitle || 'মাদরাসাতুস সুন্নাহ'}`,
      contentHtml: printableElement.innerHTML,
      isBengali: isBn,
      customCss
    });
  };

  // Toggle individual question answer visibility (Exact functionality for the circular button)
  const toggleAnswerVisibility = (qId: string) => {
    setRevealedAnswers(prev => {
      const currentlyShown = prev[qId] !== undefined ? prev[qId] : allAnswersRevealed;
      return {
        ...prev,
        [qId]: !currentlyShown
      };
    });
  };

  // Toggle all answers at once
  const toggleAllAnswers = () => {
    const nextState = !allAnswersRevealed;
    setAllAnswersRevealed(nextState);
    const updatedMap: { [qId: string]: boolean } = {};
    exercise.sections.forEach(sec => {
      sec.questions.forEach(q => {
        updatedMap[q.id] = nextState;
      });
    });
    setRevealedAnswers(updatedMap);
    showToast(nextState ? 'সকল প্রশ্নের উত্তর দৃশ্যমান করা হয়েছে' : 'সকল প্রশ্নের উত্তর লুকানো হয়েছে');
  };

  const isAnswerVisible = (qId: string) => {
    if (revealedAnswers[qId] !== undefined) {
      return revealedAnswers[qId];
    }
    return allAnswersRevealed;
  };

  const handleCopyText = () => {
    let plainText = `মাদরাসাতুস সুন্নাহ\n`;
    plainText += `শ্রেণি: ${exercise.gradeLevel} | বিষয়: ${exercise.subject}\n`;
    plainText += `অধ্যায়: ${exercise.chapterTitle || ''} | বিষয়বস্তু: ${exercise.topicTitle || ''}\n`;
    plainText += `মোট নম্বর: ${exercise.totalMarks} | সময়: ${exercise.estimatedTime}\n\n`;
    plainText += `==========================================\n\n`;

    exercise.sections.forEach((sec, sIdx) => {
      plainText += `${sec.title}\n`;
      plainText += `নির্দেশনা: ${sec.instructions} (নম্বর: ${sec.totalMarks})\n\n`;

      sec.questions.forEach((q, qIdx) => {
        plainText += `(${toBengaliNumber(qIdx + 1)}) ${q.question} [${toBengaliNumber(q.points || 1)}]\n`;
        if (q.options && q.options.length > 0) {
          q.options.forEach((opt, oIdx) => {
            plainText += `    (${BENGALI_OPTION_LETTERS[oIdx] || oIdx + 1}) ${cleanOptionText(opt)}\n`;
          });
        }
        if (q.answer) {
          plainText += `    উত্তর: ${q.answer}\n`;
          if (q.explanation) {
            plainText += `    ব্যাখ্যা: ${q.explanation}\n`;
          }
        }
        plainText += `\n`;
      });
      plainText += `------------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(plainText);
    setCopied(true);
    showToast("অনুশীলনীর সম্পূর্ণ পাঠ্য ক্লিপবোর্ডে কপি হয়েছে!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Instant Auto-Add Question from System
  const handleAutoAddSystemQuestion = (sectionIdx: number) => {
    const newSections = [...exercise.sections];
    const sec = newSections[sectionIdx];
    const existingTexts = sec.questions.map(q => q.question);
    
    // Automatically pick an authentic question from system bank
    const autoQuestion = getSmartAutoQuestion(sec.type, existingTexts);
    
    sec.questions.push(autoQuestion);
    sec.totalMarks = (sec.totalMarks || 0) + (autoQuestion.points || 1);
    
    const updatedExercise: GeneratedExercise = {
      ...exercise,
      sections: newSections,
      totalMarks: newSections.reduce((sum, s) => sum + s.questions.reduce((qSum, q) => qSum + (q.points || 1), 0), 0)
    };

    setExercise(updatedExercise);
    
    // Auto-reveal the answer for the newly added question so user can see it right away
    setRevealedAnswers(prev => ({
      ...prev,
      [autoQuestion.id]: true
    }));

    if (onSave) onSave(updatedExercise);
    showToast(`⚡ '${sec.title}' বিভাগে ১টি নতুন প্রশ্ন স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে!`);
  };

  // Handle student interactive submission
  const handleTestSubmit = () => {
    let earned = 0;
    exercise.sections.forEach(sec => {
      sec.questions.forEach(q => {
        const studentAns = studentAnswers[q.id];
        if (!studentAns) return;

        if (q.type === 'mcq') {
          if (typeof q.answer === 'string' && typeof studentAns === 'string') {
            const cleanAns = q.answer.trim().toLowerCase();
            const cleanStudent = studentAns.trim().toLowerCase();
            if (cleanAns === cleanStudent || cleanAns.includes(cleanStudent) || cleanStudent.includes(cleanAns)) {
              earned += (q.points || 1);
            }
          }
        } else if (q.type === 'true_false') {
          const isTrueAns = q.answer.includes('সত্য') || q.answer.toLowerCase().includes('true');
          const isTrueStudent = studentAns === 'সত্য' || studentAns === true;
          if (isTrueAns === isTrueStudent) {
            earned += (q.points || 1);
          }
        } else if (q.type === 'blank') {
          if (typeof q.answer === 'string' && typeof studentAns === 'string') {
            if (studentAns.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
              earned += (q.points || 1);
            }
          }
        } else {
          // Short / essay: give partial credit if typed
          if (studentAns && studentAns.length > 5) {
            earned += Math.max(1, (q.points || 2) - 1);
          }
        }
      });
    });

    setScore(earned);
    setIsTestSubmitted(true);
    setAllAnswersRevealed(true);
  };

  const handleResetTest = () => {
    setStudentAnswers({});
    setIsTestSubmitted(false);
    setScore(null);
  };

  // Editing helper functions
  const handleUpdateQuestion = (sectionIdx: number, questionIdx: number, field: keyof ExerciseQuestion, value: any) => {
    const newSections = [...exercise.sections];
    const currentQ = { ...newSections[sectionIdx].questions[questionIdx], [field]: value };
    newSections[sectionIdx].questions[questionIdx] = currentQ;
    const updated = { ...exercise, sections: newSections };
    setExercise(updated);
    if (onSave) onSave(updated);
  };

  const handleDeleteQuestion = (sectionIdx: number, questionIdx: number) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই প্রশ্নটি মুছে ফেলতে চান?")) {
      const newSections = [...exercise.sections];
      newSections[sectionIdx].questions.splice(questionIdx, 1);
      const updated = { ...exercise, sections: newSections };
      setExercise(updated);
      if (onSave) onSave(updated);
      showToast("প্রশ্ন মুছে ফেলা হয়েছে");
    }
  };

  const openAddQuestionForm = (sectionIdx: number) => {
    const sec = exercise.sections[sectionIdx];
    setAddingToSectionIdx(sectionIdx);
    setNewQuestionType(sec.type);
    setNewQuestionText('');
    setNewQuestionAnswer('');
    setNewQuestionExplanation('');
    setNewQuestionPoints(sec.type === 'essay' ? 5 : sec.type === 'short' ? 2 : 1);
    setNewQuestionOptions(['বিকল্প ক', 'বিকল্প খ', 'বিকল্প গ', 'বিকল্প ঘ']);
  };

  const handleSaveNewQuestion = (sectionIdx: number) => {
    if (!newQuestionText.trim()) {
      alert("অনুগ্রহ করে প্রশ্নের বাক্য লিখুন।");
      return;
    }

    const newSections = [...exercise.sections];
    const sec = newSections[sectionIdx];
    const newQ: ExerciseQuestion = {
      id: `q_manual_${Date.now()}`,
      type: newQuestionType,
      question: newQuestionText.trim(),
      answer: newQuestionAnswer.trim() || 'সঠিক উত্তর',
      explanation: newQuestionExplanation.trim() || undefined,
      points: Number(newQuestionPoints) || 1,
      options: newQuestionType === 'mcq' ? newQuestionOptions.filter(o => o.trim().length > 0) : undefined
    };

    sec.questions.push(newQ);
    sec.totalMarks = (sec.totalMarks || 0) + newQ.points;
    const updatedExercise = {
      ...exercise,
      sections: newSections,
      totalMarks: newSections.reduce((sum, s) => sum + s.questions.reduce((qSum, q) => qSum + (q.points || 1), 0), 0)
    };

    setExercise(updatedExercise);
    setAddingToSectionIdx(null);
    setRevealedAnswers(prev => ({ ...prev, [newQ.id]: true }));
    if (onSave) onSave(updatedExercise);
    showToast("নতুন প্রশ্ন সফলভাবে যুক্ত হয়েছে!");
  };

  const handleCreateNewSection = () => {
    if (!newSectionTitle.trim()) {
      alert("অনুগ্রহ করে বিভাগের শিরোনাম দিন।");
      return;
    }

    const sampleQ = getSmartAutoQuestion(newSectionType);
    const newSec: ExerciseSection = {
      type: newSectionType,
      title: newSectionTitle.trim(),
      instructions: newSectionInstructions.trim() || 'নিচের প্রশ্নগুলোর উত্তর দাও:',
      totalMarks: sampleQ.points || 2,
      questions: [sampleQ]
    };

    const newSections = [...exercise.sections, newSec];
    const updatedExercise = {
      ...exercise,
      sections: newSections,
      totalMarks: (exercise.totalMarks || 0) + newSec.totalMarks
    };

    setExercise(updatedExercise);
    setIsAddingSection(false);
    setNewSectionTitle('');
    setNewSectionInstructions('');
    if (onSave) onSave(updatedExercise);
    showToast("নতুন বিভাগ যুক্ত হয়েছে!");
  };

  return (
    <div id="exercise-display-container" className="space-y-6">
      
      {/* Dynamic Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-5 duration-300 border border-slate-700 dark:border-slate-300">
          <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Spin Board & Instant Quiz Modal */}
      <SpinBoardQuizModal
        exercise={exercise}
        isOpen={isSpinModalOpen}
        onClose={() => setIsSpinModalOpen(false)}
        onUpdateExercise={(updated) => {
          setExercise(updated);
          if (onSave) onSave(updated);
        }}
      />

      {/* Top Action Bar (hidden in print) */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Create New Exercise Button, Spin Board Button & View Modes */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Prominent Spin Board & Live Quiz Trigger */}
          <button
            id="open-spin-board-modal-btn"
            type="button"
            onClick={() => setIsSpinModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ring-2 ring-amber-400/30 animate-pulse"
          >
            <RotateCw className="w-4 h-4 text-amber-100" />
            <span>🎲 স্পিন বোর্ড ও লাইভ কুইজ</span>
          </button>

          {/* Create New Exercise Button */}
          {onNewExercise && (
            <button
              id="top-create-new-exercise-btn"
              type="button"
              onClick={onNewExercise}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ring-2 ring-emerald-500/20"
            >
              <PlusCircle className="w-4 h-4 text-emerald-200" />
              <span>নতুন অনুশীলনী তৈরি</span>
            </button>
          )}

          {/* Mode Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              id="tab-view-teacher"
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>অনুশীলনী ভিউ</span>
            </button>

            <button
              id="tab-view-answersheet"
              type="button"
              onClick={() => setActiveTab('answersheet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'answersheet'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>উত্তরপত্র (Answer Sheet)</span>
            </button>

            <button
              id="tab-view-student"
              type="button"
              onClick={() => setActiveTab('student')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>শিক্ষার্থী কুইজ</span>
            </button>

            <button
              id="tab-view-print"
              type="button"
              onClick={() => setActiveTab('print')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'print'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট প্রিভিউ</span>
            </button>

            <button
              id="tab-view-edit"
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>সম্পাদনা</span>
            </button>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Master Toggle for All Answers */}
          {activeTab === 'teacher' && (
            <button
              type="button"
              id="toggle-all-answers-btn"
              onClick={toggleAllAnswers}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              {allAnswersRevealed ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                  <span>সব উত্তর লুকান</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>সব উত্তর দেখুন</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            id="copy-exercise-btn"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'কপি হয়েছে!' : 'কপি'}</span>
          </button>

          <button
            type="button"
            id="print-exercise-btn"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট / PDF</span>
          </button>
        </div>
      </div>

      {/* If Answer Sheet Tab is selected, show Consolidated Answer Sheet */}
      {activeTab === 'answersheet' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-emerald-600 pb-4 gap-3">
            <div>
              <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold mb-1">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                মাদরাসাতুস সুন্নাহ — সম্পূর্ণ উত্তরপত্র (Answer Key)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                শ্রেণি: <span className="font-bold">{exercise.gradeLevel}</span> | 
                বিষয়: <span className="font-bold">{exercise.subject}</span> | 
                অধ্যায়: <span className="font-bold">{exercise.chapterTitle}</span> | 
                মোট নম্বর: <span className="font-bold">{exercise.totalMarks}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>উত্তরপত্র প্রিন্ট / PDF</span>
              </button>
            </div>
          </div>

          {/* All Sections and Questions Answer Key */}
          <div className="space-y-8">
            {exercise.sections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center justify-center">
                    {toBengaliNumber(sIdx + 1)}
                  </span>
                  <span>{sec.title}</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({sec.questions.length}টি প্রশ্ন)
                  </span>
                </h3>

                <div className="space-y-4 pl-2">
                  {sec.questions.map((q, qIdx) => (
                    <div 
                      key={q.id || qIdx} 
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-start gap-2">
                          <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                            {toBengaliNumber(qIdx + 1)}.
                          </span>
                          <span>{q.question}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded shrink-0">
                          [{toBengaliNumber(q.points || 1)} নম্বর]
                        </span>
                      </div>

                      {/* Revealed Box (Screenshot 2 Match) */}
                      <div className="p-3.5 bg-[#eefbf4] dark:bg-emerald-950/40 border-l-4 border-emerald-600 rounded-r-xl text-slate-800 dark:text-slate-100 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <div className="w-4 h-4 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-700 text-[10px] font-black shrink-0">
                            ✓
                          </div>
                          <span>সঠিক উত্তর:</span>
                        </div>

                        <div className="pl-6 text-sm font-bold text-slate-900 dark:text-emerald-100 leading-relaxed whitespace-pre-line">
                          {q.answer}
                        </div>

                        {q.explanation && (
                          <div className="pl-6 pt-1 flex items-start gap-1.5 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                            <Bookmark className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span><strong className="font-bold">দলীল/ব্যাখ্যা:</strong> {q.explanation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Main Exercise Card / Printable Page */
        <div 
          id="printable-exercise-paper" 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-10 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 text-slate-800 dark:text-slate-100"
        >
          {/* Madrasah Header for Examination */}
          <div className="text-center pb-6 border-b-2 border-slate-800 dark:border-slate-200">
            <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold mb-2">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              মাদরাসাতুস সুন্নাহ
            </h1>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              স্মার্ট অনুশীলনী ও মূল্যায়ন পরীক্ষা
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mt-4 pt-3 border-t border-dashed border-slate-300 dark:border-slate-700">
              <div>শ্রেণি: <span className="font-bold">{exercise.gradeLevel}</span></div>
              <div>বিষয়: <span className="font-bold">{exercise.subject || 'ইসলামিক স্টাডিজ'}</span></div>
              <div>সময়: <span className="font-bold">{exercise.estimatedTime || '৩০ মিনিট'}</span></div>
              <div>পূর্ণমান: <span className="font-bold">{toBengaliNumber(exercise.totalMarks || 25)}</span></div>
            </div>

            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              অধ্যায়: <span className="font-semibold text-slate-800 dark:text-slate-200">{exercise.chapterTitle}</span> | 
              পাঠ: <span className="font-semibold text-slate-800 dark:text-slate-200">{exercise.topicTitle}</span>
            </div>

            {/* Student Info Lines in Exam / Print mode */}
            <div className="grid grid-cols-3 gap-4 text-xs text-left mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 print:grid">
              <div className="border-b border-slate-400 pb-1">শিক্ষার্থীর নাম: ____________________</div>
              <div className="border-b border-slate-400 pb-1">রোল নং: __________</div>
              <div className="border-b border-slate-400 pb-1">তারিখ: ______________</div>
            </div>
          </div>

          {/* Student Test Submission Status Banner */}
          {activeTab === 'student' && isTestSubmitted && (
            <div className="my-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    পরীক্ষার মূল্যায়ন সম্পন্ন হয়েছে!
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400">
                    প্রাপ্ত নম্বর: <span className="font-black text-sm">{toBengaliNumber(score || 0)}</span> / {toBengaliNumber(exercise.totalMarks || 25)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetTest}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>পুনরায় পরীক্ষা দিন</span>
              </button>
            </div>
          )}

          {/* Exercise Sections */}
          <div className="mt-8 space-y-8">
            {exercise.sections.map((section, sIdx) => (
              <div key={section.type + sIdx} className="space-y-4">
                
                {/* Section Header with Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">
                        {toBengaliNumber(sIdx + 1)}
                      </span>
                      <span>{section.title}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                      {section.instructions}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Quick System Auto Add Question Button in Section Header */}
                    <button
                      type="button"
                      title="ক্লিক করলেই সিস্টেম থেকে স্বয়ংক্রিয়ভাবে নতুন প্রশ্ন যুক্ত হবে"
                      onClick={() => handleAutoAddSystemQuestion(sIdx)}
                      className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>+ স্বয়ংক্রিয় প্রশ্ন</span>
                    </button>

                    <div className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300">
                      মান: {toBengaliNumber(section.totalMarks || section.questions.reduce((acc, q) => acc + (q.points || 1), 0))}
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-5 pl-1 md:pl-2">
                  {section.questions.map((q, qIdx) => {
                    const showThisAnswer = isAnswerVisible(q.id);

                    return (
                      <div 
                        key={q.id || qIdx} 
                        className={`p-4 sm:p-5 rounded-2xl transition-all border ${
                          activeTab === 'edit'
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        {/* Normal / Teacher / Student View */}
                        {activeTab !== 'edit' ? (
                          <div className="space-y-3">
                            
                            {/* Question Row: Number, Text, Points & Circular Reveal Button (Screenshot 1 Match) */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-2.5 flex-1">
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-base shrink-0">
                                  {toBengaliNumber(qIdx + 1)}.
                                </span>
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                                  {q.question}
                                </h4>
                              </div>

                              {/* Right-aligned: Points and Circular Reveal Button (Screenshot 1 Red Box) */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  [{toBengaliNumber(q.points || 1)} নম্বর]
                                </span>

                                {/* Circular Reveal Button (Exact Visual Match to Screenshot 1 & 2) */}
                                {activeTab === 'teacher' && q.answer && (
                                  <button
                                    type="button"
                                    id={`reveal-circle-btn-${q.id || qIdx}`}
                                    title={showThisAnswer ? "উত্তর লুকান" : "উত্তর দেখতে ক্লিক করুন"}
                                    onClick={() => toggleAnswerVisibility(q.id)}
                                    className={`print:hidden w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                                      showThisAnswer
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 ring-3 ring-emerald-500/20 shadow-2xs'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-transparent text-transparent hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className={`w-2.5 h-2.5 rounded-full transition-all ${
                                      showThisAnswer ? 'bg-emerald-500 scale-100' : 'bg-transparent scale-0'
                                    }`} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* MCQ Options: Circular (ক), (খ), (গ), (ঘ) badges in 2 columns (Screenshot 1 Match) */}
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 pt-2 pl-4 sm:pl-6">
                                {q.options.map((opt, optIdx) => {
                                  const letter = BENGALI_OPTION_LETTERS[optIdx] || String.fromCharCode(65 + optIdx);
                                  const cleanText = cleanOptionText(opt);
                                  const isSelected = studentAnswers[q.id] === cleanText;
                                  const isCorrect = q.answer && q.answer.includes(cleanText);

                                  return (
                                    <div
                                      key={optIdx}
                                      onClick={() => {
                                        if (activeTab === 'student' && !isTestSubmitted) {
                                          setStudentAnswers({ ...studentAnswers, [q.id]: cleanText });
                                        }
                                      }}
                                      className={`flex items-center gap-3 p-1.5 rounded-xl text-xs transition-all ${
                                        activeTab === 'student'
                                          ? `cursor-pointer border ${
                                              isSelected
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 font-bold'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                            }`
                                          : 'text-slate-800 dark:text-slate-200'
                                      } ${
                                        isTestSubmitted
                                          ? isCorrect
                                            ? 'bg-emerald-100/90 dark:bg-emerald-900/60 border-emerald-600 font-bold text-emerald-950 dark:text-emerald-100'
                                            : isSelected
                                            ? 'bg-red-100/80 dark:bg-red-950/60 border-red-500 text-red-900 line-through'
                                            : ''
                                          : ''
                                      }`}
                                    >
                                      {/* Round Bengali Letter Badge */}
                                      <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 ${
                                        isTestSubmitted && isCorrect
                                          ? 'bg-emerald-600 text-white border-emerald-600'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                      }`}>
                                        {letter}
                                      </span>
                                      <span className="leading-relaxed">{cleanText}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* True / False Interactive Options for Student */}
                            {q.type === 'true_false' && activeTab === 'student' && (
                              <div className="flex items-center gap-3 pl-6 mt-2">
                                {(['সত্য', 'মিথ্যা'] as const).map(choice => (
                                  <button
                                    key={choice}
                                    type="button"
                                    disabled={isTestSubmitted}
                                    onClick={() => setStudentAnswers({ ...studentAnswers, [q.id]: choice })}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                      studentAnswers[q.id] === choice
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Blank input for student */}
                            {q.type === 'blank' && activeTab === 'student' && !isTestSubmitted && (
                              <div className="pl-6 mt-2">
                                <input
                                  type="text"
                                  placeholder="সঠিক শব্দটি এখানে লিখুন..."
                                  value={studentAnswers[q.id] || ''}
                                  onChange={(e) => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })}
                                  className="w-full sm:w-64 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            )}

                            {/* Short / Essay input for student */}
                            {(q.type === 'short' || q.type === 'essay') && activeTab === 'student' && !isTestSubmitted && (
                              <div className="pl-6 mt-2">
                                <textarea
                                  rows={2}
                                  placeholder="আপনার উত্তর এখানে লিখুন..."
                                  value={studentAnswers[q.id] || ''}
                                  onChange={(e) => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })}
                                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            )}

                            {/* Beautiful Revealed Answer Box (EXACT MATCH to Screenshot 2) */}
                            {(showThisAnswer || isTestSubmitted) && q.answer && (
                              <div 
                                id={`answer-box-${q.id || qIdx}`}
                                className="mt-4 p-4 sm:p-5 bg-[#eefbf4] dark:bg-emerald-950/40 border-l-4 border-emerald-600 rounded-r-2xl text-slate-800 dark:text-slate-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300"
                              >
                                <div className="flex items-center gap-2">
                                  {/* Green Circle Check Icon */}
                                  <div className="w-5 h-5 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-700 font-black text-xs shrink-0">
                                    ✓
                                  </div>
                                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                    সঠিক উত্তর:
                                  </span>
                                </div>

                                {/* Clean Answer Text */}
                                <div className="pl-7 text-sm sm:text-base font-bold text-slate-900 dark:text-emerald-100 leading-relaxed whitespace-pre-line">
                                  {q.answer}
                                </div>

                                {/* Dalil / Explanation */}
                                {q.explanation && (
                                  <div className="pl-7 pt-1 flex items-start gap-1.5 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                                    <Bookmark className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span><strong className="font-bold">দলীল/ব্যাখ্যা:</strong> {q.explanation}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Edit Mode Form */
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-500">প্রশ্ন {toBengaliNumber(qIdx + 1)}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(sIdx, qIdx)}
                                className="text-red-500 hover:text-red-700 p-1 text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                মুছুন
                              </button>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                প্রশ্ন বাক্য
                              </label>
                              <input
                                type="text"
                                value={q.question}
                                onChange={(e) => handleUpdateQuestion(sIdx, qIdx, 'question', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  আদর্শ সমাধান / উত্তর
                                </label>
                                <input
                                  type="text"
                                  value={q.answer || ''}
                                  onChange={(e) => handleUpdateQuestion(sIdx, qIdx, 'answer', e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  নম্বর (Points)
                                </label>
                                <input
                                  type="number"
                                  value={q.points || 1}
                                  onChange={(e) => handleUpdateQuestion(sIdx, qIdx, 'points', parseInt(e.target.value) || 1)}
                                  className="w-24 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Question Actions at Bottom of Section */}
                {addingToSectionIdx === sIdx ? (
                  <div className="mt-4 p-5 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/60 pb-2">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        '{section.title}' বিভাগে প্রশ্ন লিখুন
                      </span>
                      <button
                        type="button"
                        onClick={() => setAddingToSectionIdx(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        প্রশ্ন বাক্য *
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: তাকওয়া অর্জন করার দুটি উপায় কী কী?"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* MCQ Options if MCQ */}
                    {newQuestionType === 'mcq' && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          বিকল্পসমূহ (Options)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {newQuestionOptions.map((opt, oIdx) => (
                            <input
                              key={oIdx}
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...newQuestionOptions];
                                newOpts[oIdx] = e.target.value;
                                setNewQuestionOptions(newOpts);
                              }}
                              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Answer & Marks */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          সঠিক সমাধান / উত্তর *
                        </label>
                        <input
                          type="text"
                          placeholder="আদর্শ উত্তর লিখুন..."
                          value={newQuestionAnswer}
                          onChange={(e) => setNewQuestionAnswer(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          নম্বর (Marks)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={newQuestionPoints}
                          onChange={(e) => setNewQuestionPoints(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ব্যাখ্যা বা রেফারেন্স (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: সূরা হুজুরাত আয়াত ১৩..."
                        value={newQuestionExplanation}
                        onChange={(e) => setNewQuestionExplanation(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveNewQuestion(sIdx)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>প্রশ্ন সংরক্ষণ করুন</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingToSectionIdx(null)}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Dual Action Buttons: Instant Auto-Add from System OR Manual Custom Write */
                  <div className="print:hidden pl-2 pt-2 flex flex-wrap items-center gap-2.5">
                    {/* Instant System Auto Question Button */}
                    <button
                      type="button"
                      onClick={() => handleAutoAddSystemQuestion(sIdx)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs transition-all cursor-pointer ring-2 ring-amber-500/20"
                    >
                      <Zap className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
                      <span>⚡ সিস্টেম থেকে তাৎক্ষণিক প্রশ্ন যোগ করুন</span>
                    </button>

                    {/* Manual Add Custom Question Button */}
                    <button
                      type="button"
                      onClick={() => openAddQuestionForm(sIdx)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>✍️ নিজে প্রশ্ন লিখুন</span>
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* Add New Section Block */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 print:hidden space-y-4">
            {isAddingSection ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FolderPlus className="w-4 h-4 text-emerald-600" />
                    নতুন প্রশ্ন বিভাগ (Section) যোগ করুন
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingSection(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      বিভাগের শিরোনাম
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: সত্য / মিথ্যা যাচাই"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      প্রশ্নের ধরন
                    </label>
                    <select
                      value={newSectionType}
                      onChange={(e) => setNewSectionType(e.target.value as ExerciseQuestionType)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                    >
                      <option value="short">সংক্ষিপ্ত উত্তর প্রশ্ন</option>
                      <option value="mcq">বহুনির্বাচনী প্রশ্ন (MCQ)</option>
                      <option value="true_false">সত্য / মিথ্যা যাচাই</option>
                      <option value="blank">শূণ্যস্থান পূরণ</option>
                      <option value="essay">ব্যাখ্যামূলক / বর্ণনামূলক</option>
                      <option value="match">ডান-বাম মিলকরণ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    নির্দেশনা (Instructions)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: নিচের বাক্যগুলো পড়ে সঠিক উত্তর নির্বাচন কর:"
                    value={newSectionInstructions}
                    onChange={(e) => setNewSectionInstructions(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateNewSection}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>বিভাগ যুক্ত করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingSection(false)}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingSection(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-emerald-600" />
                  <span>+ নতুন বিভাগ (Section) যোগ করুন</span>
                </button>

                {onNewExercise && (
                  <button
                    type="button"
                    onClick={onNewExercise}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all ml-auto cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>অন্য বিষয় থেকে নতুন অনুশীলনী তৈরি করুন</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Student Test Action Button */}
          {activeTab === 'student' && !isTestSubmitted && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={handleTestSubmit}
                className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>উত্তরপত্র জমা দিন ও ফলাফল যাচাই করুন</span>
              </button>
            </div>
          )}

          {/* Footer for Printable Exam */}
          <div className="mt-12 pt-6 border-t border-slate-300 dark:border-slate-700 text-center text-[11px] text-slate-400 font-medium print:block">
            মাদরাসাতুস সুন্নাহ — ইসলামিক স্টাডিজ কারিকুলাম ও অটোমেটেড অ্যাসেসমেন্ট ইঞ্জিন
          </div>
        </div>
      )}
    </div>
  );
};
