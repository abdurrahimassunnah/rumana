import React, { useState, useEffect, useRef, useMemo } from 'react';
import { printDocument } from '../services/printService';
import { 
  GeneratedExercise, 
  ExerciseQuestion, 
  ExerciseSection 
} from '../types';
import { 
  X, 
  Sparkles, 
  Award, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Volume2, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Bookmark, 
  Trophy,
  Users,
  Printer,
  FileText,
  Medal,
  Crown,
  Plus,
  Trash2,
  UserPlus,
  RotateCcw,
  Star,
  Flame,
  Check,
  TrendingUp
} from 'lucide-react';
import { getSmartAutoQuestion } from '../services/questionBank';

export interface QuizStudent {
  id: string;
  name: string;
  roll: number | string;
  points: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalAttempts: number;
}

interface SpinBoardQuizModalProps {
  exercise: GeneratedExercise;
  isOpen: boolean;
  onClose: () => void;
  onUpdateExercise?: (updated: GeneratedExercise) => void;
}

// Bengali numerals helper
const toBengaliNumber = (n: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
};

const BENGALI_OPTION_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];

const DEFAULT_STUDENTS: QuizStudent[] = [
  { id: '1', name: 'আব্দুল্লাহ', roll: 1, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '2', name: 'আব্দুর রহমান', roll: 2, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '3', name: 'উমর', roll: 3, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '4', name: 'উসমান', roll: 4, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '5', name: 'আলী', roll: 5, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '6', name: 'যায়িদ', roll: 6, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '7', name: 'খালিদ', roll: 7, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '8', name: 'হাসান', roll: 8, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '9', name: 'হোসাইন', roll: 9, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '10', name: 'তালহা', roll: 10, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '11', name: 'খুবাইব', roll: 11, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
  { id: '12', name: 'আনাস', roll: 12, points: 0, correctAnswers: 0, wrongAnswers: 0, totalAttempts: 0 },
];

export const SpinBoardQuizModal: React.FC<SpinBoardQuizModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onUpdateExercise
}) => {
  // Flatten all questions from all sections
  const allQuestions: { question: ExerciseQuestion; sectionTitle: string; sectionIndex: number }[] = [];
  exercise.sections.forEach((sec, sIdx) => {
    sec.questions.forEach((q) => {
      allQuestions.push({
        question: q,
        sectionTitle: sec.title,
        sectionIndex: sIdx
      });
    });
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinAngle, setSpinAngle] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'board' | 'leaderboard' | 'answerSheet'>('board');
  
  // Students and scoring state
  const [students, setStudents] = useState<QuizStudent[]>(() => {
    try {
      const saved = localStorage.getItem('madrasa_quiz_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_STUDENTS;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '1');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  // Persist students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('madrasa_quiz_students', JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  // Current active student
  const activeStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Ranked students for Leaderboard (sorted by points desc, then correct answers desc, then roll asc)
  const rankedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
      return Number(a.roll) - Number(b.roll);
    });
  }, [students]);

  // Top 3 performers
  const topPerformers = useMemo(() => {
    return rankedStudents.slice(0, 3);
  }, [rankedStudents]);

  // Overall classroom stats
  const totalClassStats = useMemo(() => {
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
    const totalCorrect = students.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalWrong = students.reduce((sum, s) => sum + s.wrongAnswers, 0);
    return { totalPoints, totalCorrect, totalWrong };
  }, [students]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Wheel colors with high-contrast distinct vibrant palette
  const wheelColors = [
    '#059669', '#0284c7', '#7c3aed', '#d97706', 
    '#db2777', '#0d9488', '#4f46e5', '#ea580c',
    '#16a34a', '#2563eb', '#9333ea', '#c026d3',
    '#0891b2', '#e11d48', '#ca8a04', '#475569'
  ];

  // Draw high-resolution, crystal-clear spin wheel on canvas
  useEffect(() => {
    if (!isOpen || activeTab !== 'board' || allQuestions.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displaySize = 280;
    const dpr = Math.max(window.devicePixelRatio || 2, 2);

    // Set actual canvas size in memory scaled by DPR for razor-sharp text
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    const numSlices = Math.max(allQuestions.length, 4);
    const sliceAngle = (2 * Math.PI) / numSlices;
    const centerX = displaySize / 2;
    const centerY = displaySize / 2;
    const radius = displaySize / 2 - 8;

    ctx.clearRect(0, 0, displaySize, displaySize);

    // 1. Draw outer decorative shadow/ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    // 2. Draw colored slices
    for (let i = 0; i < numSlices; i++) {
      const angle = i * sliceAngle + (spinAngle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
      ctx.closePath();

      ctx.fillStyle = wheelColors[i % wheelColors.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // 3. Draw text inside slice with upright readability
      const midAngle = angle + sliceAngle / 2;
      const normalizedAngle = ((midAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const isLeftHemisphere = normalizedAngle > Math.PI / 2 && normalizedAngle < (3 * Math.PI) / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(midAngle);

      // Distance from center to place label
      const textRadius = radius * 0.65;
      ctx.translate(textRadius, 0);

      // Flip 180 degrees if on left hemisphere so Bengali text is NEVER upside down!
      if (isLeftHemisphere) {
        ctx.rotate(Math.PI);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const questionNum = toBengaliNumber((i % allQuestions.length) + 1);
      const labelText = numSlices > 10 ? `${questionNum}` : `প্রশ্ন ${questionNum}`;

      // Background pill for crowded or high-slice wheels for 100% legibility
      if (numSlices > 8) {
        const pillWidth = numSlices > 12 ? 26 : 38;
        const pillHeight = 22;
        ctx.beginPath();
        ctx.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, 6);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.stroke();
      }

      // Crisp text with subtle shadow
      ctx.fillStyle = '#ffffff';
      ctx.font = numSlices > 10 
        ? 'bold 13px "Hind Siliguri", "Noto Sans Bengali", system-ui, -apple-system, sans-serif'
        : 'bold 12px "Hind Siliguri", "Noto Sans Bengali", system-ui, -apple-system, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      ctx.fillText(labelText, 0, 0);

      ctx.restore();
    }

    // 4. Draw stylish center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#059669';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 6;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 13px "Hind Siliguri", "Noto Sans Bengali", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('স্পিন', centerX, centerY);

    ctx.restore();
  }, [isOpen, spinAngle, allQuestions.length, activeTab]);

  if (!isOpen) return null;

  const currentItem = allQuestions[currentIndex] || allQuestions[0];
  const currentQ = currentItem?.question;

  // Spin the wheel with smooth deceleration
  const handleSpin = () => {
    if (isSpinning || allQuestions.length === 0) return;

    setIsSpinning(true);
    setIsAnswerRevealed(false);

    // Pick random question and random student
    const targetQIdx = Math.floor(Math.random() * allQuestions.length);
    if (students.length > 0) {
      const randStudent = students[Math.floor(Math.random() * students.length)];
      setSelectedStudentId(randStudent.id);
    }

    const numSlices = Math.max(allQuestions.length, 4);
    const sliceDeg = 360 / numSlices;
    // Calculate target rotation to stop pointing to targetQIdx
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full rotations
    const targetDeg = 360 * extraSpins + (360 - targetQIdx * sliceDeg - sliceDeg / 2);

    let start: number | null = null;
    const initialAngle = spinAngle % 360;
    const totalRotation = targetDeg;
    const duration = 3200; // ms

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRot = initialAngle + totalRotation * easeOut;

      setSpinAngle(currentRot);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setCurrentIndex(targetQIdx);
      }
    };

    requestAnimationFrame(animate);
  };

  // Instant assessment action targeting current student
  const handleGrade = (type: 'correct' | 'partial' | 'wrong') => {
    const points = currentQ?.points || 1;
    const earnedPoints = type === 'correct' ? points : type === 'partial' ? Math.max(1, Math.floor(points / 2)) : 0;
    
    if (activeStudent) {
      setStudents(prev => prev.map(s => {
        if (s.id === activeStudent.id) {
          return {
            ...s,
            points: Math.max(0, s.points + earnedPoints),
            correctAnswers: type !== 'wrong' ? s.correctAnswers + 1 : s.correctAnswers,
            wrongAnswers: type === 'wrong' ? s.wrongAnswers + 1 : s.wrongAnswers,
            totalAttempts: s.totalAttempts + 1
          };
        }
        return s;
      }));

      if (type === 'correct') {
        setCelebrationMsg(`মাশাআল্লাহ! ${activeStudent.name} +${toBengaliNumber(earnedPoints)} পয়েন্ট পেয়েছেন!`);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2800);
      }
    }

    // Reveal answer if not already revealed
    setIsAnswerRevealed(true);
  };

  // Quick adjust points for any student
  const handleAdjustPoints = (studentId: string, delta: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          points: Math.max(0, s.points + delta)
        };
      }
      return s;
    }));
  };

  // Reset all student points
  const handleResetPoints = () => {
    setStudents(prev => prev.map(s => ({
      ...s,
      points: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalAttempts: 0
    })));
  };

  // Add new student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const nextRoll = newStudentRoll.trim() || String(students.length + 1);
    const newStudent: QuizStudent = {
      id: Date.now().toString(),
      name: newStudentName.trim(),
      roll: nextRoll,
      points: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalAttempts: 0
    };
    setStudents(prev => [...prev, newStudent]);
    setSelectedStudentId(newStudent.id);
    setNewStudentName('');
    setNewStudentRoll('');
  };

  // Remove student
  const handleDeleteStudent = (id: string, name: string) => {
    setStudents(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (selectedStudentId === id && filtered.length > 0) {
        setSelectedStudentId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handlePrintLeaderboard = () => {
    const tableRows = rankedStudents.map((st, idx) => {
      const accuracy = st.totalAttempts > 0 
        ? Math.round((st.correctAnswers / st.totalAttempts) * 100) 
        : 0;
      return `
        <tr>
          <td style="text-align:center;font-weight:bold;">${toBengaliNumber(idx + 1)}</td>
          <td style="text-align:center;">${toBengaliNumber(st.roll)}</td>
          <td style="font-weight:bold;">${st.name}</td>
          <td style="text-align:center;font-weight:bold;color:#047857;">${toBengaliNumber(st.points)}</td>
          <td style="text-align:center;color:#059669;">${toBengaliNumber(st.correctAnswers)}</td>
          <td style="text-align:center;color:#dc2626;">${toBengaliNumber(st.wrongAnswers)}</td>
          <td style="text-align:center;">${toBengaliNumber(accuracy)}%</td>
        </tr>
      `;
    }).join('');

    const customCss = `
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px double #cbd5e1; padding-bottom: 12px; }
      .header h1 { color: #047857; margin: 0; font-size: 22px; font-weight: 800; }
      .header p { color: #64748b; font-size: 12px; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { border: 1px solid #94a3b8; padding: 8px 10px; font-size: 13px; }
      th { background-color: #f1f5f9; font-weight: bold; }
    `;

    const headerHtml = `
      <div class="header">
        <h1>মাদরাসাতুস সুন্নাহ — কুইজ ও স্পিনবোর্ড মেধা তালিকা</h1>
        <p>শ্রেণি: ${exercise.gradeLevel || 'সকল'} | বিষয়: ${exercise.subject || 'ইসলামিক স্টাডিজ'} | অধ্যায়: ${exercise.chapterTitle || ''}</p>
      </div>
    `;

    const contentHtml = `
      <table>
        <thead>
          <tr>
            <th>মেধা স্থান</th>
            <th>রোল</th>
            <th>শিক্ষার্থীর নাম</th>
            <th>মোট পয়েন্ট</th>
            <th>সঠিক উত্তর</th>
            <th>ভুল উত্তর</th>
            <th>সফলতার হার</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    printDocument({
      title: 'মাদরাসাতুস সুন্নাহ — কুইজ মেধা তালিকা',
      contentHtml,
      isBengali: true,
      customCss,
      headerHtml
    });
  };

  const handlePrintAnswerSheet = () => {
    let sectionsHtml = '';
    exercise.sections.forEach((sec, sIdx) => {
      let qHtml = '';
      sec.questions.forEach((q, qIdx) => {
        qHtml += `
          <div style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
            <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">
              ${toBengaliNumber(qIdx + 1)}. ${q.question} <span style="color:#64748b; font-size: 11px;">[${toBengaliNumber(q.points || 1)} নম্বর]</span>
            </div>
            <div style="color: #065f46; font-size: 12px; margin-left: 12px;">
              <strong>উত্তর:</strong> ${q.answer}
            </div>
            ${q.explanation ? `<div style="color: #475569; font-size: 11px; margin-left: 12px; margin-top: 2px;"><strong>দলীল/ব্যাখ্যা:</strong> ${q.explanation}</div>` : ''}
          </div>
        `;
      });

      sectionsHtml += `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #065f46; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
            ${sec.title}
          </h3>
          ${qHtml}
        </div>
      `;
    });

    const headerHtml = `
      <div style="text-align:center; margin-bottom: 16px; border-bottom: 2px double #cbd5e1; padding-bottom: 12px;">
        <h1 style="color:#047857; margin:0; font-size:22px; font-weight:800;">মাদরাসাতুস সুন্নাহ — সম্পূর্ণ উত্তরপত্র (Answer Key)</h1>
        <p style="color:#64748b; font-size:12px; margin:4px 0 0 0;">শ্রেণি: ${exercise.gradeLevel} | বিষয়: ${exercise.subject} | অধ্যায়: ${exercise.chapterTitle} | পূর্ণমান: ${toBengaliNumber(exercise.totalMarks || 25)}</p>
      </div>
    `;

    printDocument({
      title: `উত্তরপত্র - ${exercise.topicTitle || exercise.chapterTitle || 'মাদরাসাতুস সুন্নাহ'}`,
      contentHtml: sectionsHtml,
      isBengali: true,
      headerHtml
    });
  };

  // Clean option text helper
  const cleanOptionText = (opt: string) => {
    return opt.replace(/^([১-৯১-৪a-dA-Dক-ঘ]\s*[\.\:\-\)]|\([ক-ঘa-dA-D১-৪]\))\s*/, '').trim();
  };

  // Add auto smart question
  const handleAddSmartQuestionToCurrent = () => {
    if (!onUpdateExercise || !currentItem) return;
    const secIdx = currentItem.sectionIndex;
    const sec = exercise.sections[secIdx];
    const newQ = getSmartAutoQuestion(sec.type, sec.questions.map(q => q.question));
    
    const updatedSections = [...exercise.sections];
    updatedSections[secIdx].questions.push(newQ);
    updatedSections[secIdx].totalMarks = (updatedSections[secIdx].totalMarks || 0) + (newQ.points || 1);

    const updatedExercise: GeneratedExercise = {
      ...exercise,
      sections: updatedSections,
      totalMarks: (exercise.totalMarks || 0) + (newQ.points || 1)
    };

    onUpdateExercise(updatedExercise);
    // Point to the newly added question
    setCurrentIndex(allQuestions.length);
    setIsAnswerRevealed(true);
  };

  // Performance ranking title helper
  const getRankBadge = (index: number, points: number) => {
    if (index === 0 && points > 0) {
      return {
        label: '🥇 ১ম স্থান (শীর্ষ পারফরমার)',
        bg: 'bg-amber-500 text-white border-amber-600',
        cardBorder: 'border-amber-400 dark:border-amber-500 shadow-amber-100 dark:shadow-amber-950/30 ring-2 ring-amber-400/30',
        cardBg: 'bg-gradient-to-br from-amber-50/90 via-amber-100/40 to-yellow-50/60 dark:from-amber-950/40 dark:to-slate-900',
        textColor: 'text-amber-900 dark:text-amber-200'
      };
    }
    if (index === 1 && points > 0) {
      return {
        label: '🥈 ২য় স্থান',
        bg: 'bg-slate-400 text-white border-slate-500',
        cardBorder: 'border-slate-300 dark:border-slate-600 shadow-slate-100 dark:shadow-slate-900/40',
        cardBg: 'bg-gradient-to-br from-slate-50 via-slate-100/50 to-white dark:from-slate-800/60 dark:to-slate-900',
        textColor: 'text-slate-900 dark:text-slate-200'
      };
    }
    if (index === 2 && points > 0) {
      return {
        label: '🥉 ৩য় স্থান',
        bg: 'bg-amber-700 text-white border-amber-800',
        cardBorder: 'border-orange-300 dark:border-orange-800/80 shadow-orange-100 dark:shadow-orange-950/30',
        cardBg: 'bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-white dark:from-orange-950/30 dark:to-slate-900',
        textColor: 'text-amber-950 dark:text-amber-300'
      };
    }
    return {
      label: `${toBengaliNumber(index + 1)}ম স্থান`,
      bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      cardBorder: 'border-slate-200 dark:border-slate-800',
      cardBg: 'bg-white dark:bg-slate-900',
      textColor: 'text-slate-800 dark:text-slate-200'
    };
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative z-10">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <RotateCw className={`w-5 h-5 text-emerald-200 ${isSpinning ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  স্মার্ট স্পিন বোর্ড ও লাইভ কুইজ
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/40 text-[11px] font-bold text-emerald-100 border border-emerald-400/30">
                  ক্লাসরুম মোড
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                {exercise.chapterTitle || 'অনুশীলনী'} • {exercise.topicTitle || 'বিষয়বস্তু'} ({toBengaliNumber(allQuestions.length)}টি প্রশ্ন • {toBengaliNumber(students.length)} জন শিক্ষার্থী)
              </p>
            </div>
          </div>

          {/* Right Top Buttons */}
          <div className="flex items-center gap-2">
            <div className="bg-black/20 rounded-xl p-1 flex items-center gap-1 border border-white/10 text-xs font-bold">
              <button
                type="button"
                id="tab-spin-board-btn"
                onClick={() => setActiveTab('board')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'board' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:text-white'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>স্পিন বোর্ড</span>
              </button>

              <button
                type="button"
                id="tab-leaderboard-btn"
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'leaderboard' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="flex items-center gap-1">
                  মেধা তালিকা ও লিডারবোর্ড
                  {topPerformers[0]?.points > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </span>
              </button>

              <button
                type="button"
                id="tab-answer-sheet-btn"
                onClick={() => setActiveTab('answerSheet')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'answerSheet' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>সম্পূর্ণ উত্তরপত্র</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/60">
          
          {/* TAB 1: SPIN BOARD */}
          {activeTab === 'board' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Interactive Spin Wheel & Active Student Card (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Spin Wheel Box */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col items-center space-y-4">
                  <div className="text-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      🎲 ভাগ্যচক্র স্পিন করুন
                    </span>
                  </div>

                  {/* Spin Wheel Canvas */}
                  <div className="relative flex items-center justify-center">
                    {/* Wheel Pointer */}
                    <div className="absolute -top-3 z-20 w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[20px] border-t-red-600 drop-shadow-md" />
                    
                    <canvas 
                      ref={canvasRef} 
                      width={280} 
                      height={280} 
                      className="rounded-full shadow-xl border-4 border-white dark:border-slate-800"
                    />
                  </div>

                  {/* Spin Button */}
                  <button
                    type="button"
                    disabled={isSpinning || allQuestions.length === 0}
                    onClick={handleSpin}
                    className={`w-full py-3 px-4 rounded-xl font-black text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSpinning 
                        ? 'bg-slate-400 cursor-not-allowed opacity-75' 
                        : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 ring-2 ring-emerald-500/30'
                    }`}
                  >
                    <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                    <span>{isSpinning ? 'স্পিন হচ্ছে...' : 'স্পিন করুন / নতুন প্রশ্ন ও শিক্ষার্থী'}</span>
                  </button>

                  {/* Question Stepper Buttons */}
                  <div className="w-full flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex(prev => (prev > 0 ? prev - 1 : allQuestions.length - 1));
                        setIsAnswerRevealed(false);
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      পূর্ববর্তী
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-500 px-2">
                      {toBengaliNumber(currentIndex + 1)} / {toBengaliNumber(allQuestions.length)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex(prev => (prev < allQuestions.length - 1 ? prev + 1 : 0));
                        setIsAnswerRevealed(false);
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      পরবর্তী
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Mini Top Performers Leaderboard Widget */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>শীর্ষ পারফরমার (Top Performers)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('leaderboard')}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>সকল দেখুন</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {rankedStudents.slice(0, 3).map((st, idx) => {
                      const isTop1 = idx === 0 && st.points > 0;
                      const isTop2 = idx === 1 && st.points > 0;
                      const isTop3 = idx === 2 && st.points > 0;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStudentId(st.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            selectedStudentId === st.id
                              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                              : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 bg-slate-50/50 dark:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              isTop1 ? 'bg-amber-500 text-white shadow-xs' :
                              isTop2 ? 'bg-slate-400 text-white' :
                              isTop3 ? 'bg-amber-700 text-white' :
                              'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {isTop1 ? '১' : isTop2 ? '২' : isTop3 ? '৩' : toBengaliNumber(idx + 1)}
                            </span>
                            <div>
                              <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{st.name}</span>
                                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                                  রোল {toBengaliNumber(st.roll)}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                সঠিক: {toBengaliNumber(st.correctAnswers)} | ভুল: {toBengaliNumber(st.wrongAnswers)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 font-mono">
                              {toBengaliNumber(st.points)} পয়েন্ট
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Active Question, Student Picker & Scoring Card (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Active Student Selector Banner */}
                <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/60 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                      🎯
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        উত্তরদাতা শিক্ষার্থী (Active Student):
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <select
                          id="active-student-select"
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white font-black text-sm rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                        >
                          {students.map(st => (
                            <option key={st.id} value={st.id}>
                              {st.name} (রোল {toBengaliNumber(st.roll)}) — {toBengaliNumber(st.points)} পয়েন্ট
                            </option>
                          ))}
                        </select>

                        {activeStudent && (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-black border border-amber-400/40 font-mono">
                            ★ {toBengaliNumber(activeStudent.points)} পয়েন্ট
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Student Switch Buttons */}
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1">
                    {students.slice(0, 6).map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          selectedStudentId === st.id
                            ? 'bg-amber-600 text-white shadow-xs font-black'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-50'
                        }`}
                      >
                        {st.name} ({toBengaliNumber(st.roll)})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Interactive Question Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
                  
                  {/* Confetti celebration badge */}
                  {showConfetti && (
                    <div className="absolute top-3 right-16 z-30 bg-emerald-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg animate-bounce flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      {celebrationMsg || 'মাশাআল্লাহ! চমৎকার সঠিক উত্তর!'}
                    </div>
                  )}

                  {/* Question Header & Circular Reveal Button */}
                  <div className="flex items-start justify-between gap-4">
                    {/* Bengali Question Text */}
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono shrink-0">
                        {toBengaliNumber(currentIndex + 1)}.
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                        {currentQ?.question || 'কোনো প্রশ্ন পাওয়া যায়নি'}
                      </h3>
                    </div>

                    {/* Circular Reveal Toggle Button */}
                    <button
                      type="button"
                      id="spin-reveal-circle-btn"
                      title={isAnswerRevealed ? "উত্তর লুকান" : "উত্তর দেখতে ক্লিক করুন"}
                      onClick={() => setIsAnswerRevealed(prev => !prev)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isAnswerRevealed
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shadow-sm ring-4 ring-emerald-500/20'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-transparent text-transparent hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full transition-all ${
                        isAnswerRevealed ? 'bg-emerald-500 scale-100' : 'bg-transparent scale-0'
                      }`} />
                    </button>
                  </div>

                  {/* MCQ Options with (ক), (খ), (গ), (ঘ) round badges */}
                  {currentQ?.options && currentQ.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                      {currentQ.options.map((opt, optIdx) => {
                        const letter = BENGALI_OPTION_LETTERS[optIdx] || String.fromCharCode(65 + optIdx);
                        const cleanText = cleanOptionText(opt);
                        const isCorrectOption = currentQ.answer && currentQ.answer.includes(cleanText);

                        return (
                          <div 
                            key={optIdx} 
                            onClick={() => setIsAnswerRevealed(true)}
                            className={`flex items-center gap-3 p-2 rounded-2xl transition-all cursor-pointer ${
                              isAnswerRevealed && isCorrectOption
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/50 font-bold text-emerald-900 dark:text-emerald-100'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isAnswerRevealed && isCorrectOption
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}>
                              {letter}
                            </span>
                            <span className="text-sm font-medium leading-relaxed">
                              {cleanText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False Options */}
                  {currentQ?.type === 'true_false' && (
                    <div className="flex items-center gap-4 pt-2">
                      {['সত্য', 'মিথ্যা'].map((choice) => (
                        <div
                          key={choice}
                          onClick={() => setIsAnswerRevealed(true)}
                          className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-sm text-slate-800 dark:text-slate-200 cursor-pointer hover:border-emerald-500 transition-all"
                        >
                          {choice}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Revealed Answer Box */}
                  {isAnswerRevealed && currentQ?.answer && (
                    <div 
                      id="spin-revealed-answer-box"
                      className="mt-6 p-4 sm:p-5 bg-[#eefbf4] dark:bg-emerald-950/40 border-l-4 border-emerald-600 rounded-r-2xl text-slate-800 dark:text-slate-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-700 font-black text-xs shrink-0">
                          ✓
                        </div>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          সঠিক উত্তর:
                        </span>
                      </div>

                      <div className="pl-7 text-sm sm:text-base font-bold text-slate-900 dark:text-emerald-100 leading-relaxed whitespace-pre-line">
                        {currentQ.answer}
                      </div>

                      {currentQ.explanation && (
                        <div className="pl-7 pt-1 flex items-start gap-1.5 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                          <Bookmark className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong className="font-bold">দলীল/ব্যাখ্যা:</strong> {currentQ.explanation}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Instant Teacher Assessment & Point Allocation Bar */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500">
                        {activeStudent?.name ? `${activeStudent.name}-কে নম্বর দিন:` : 'মূল্যায়ন করুন:'}
                      </span>
                      
                      <button
                        type="button"
                        id="grade-correct-btn"
                        onClick={() => handleGrade('correct')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>সঠিক (+{toBengaliNumber(currentQ?.points || 1)} নম্বর)</span>
                      </button>

                      <button
                        type="button"
                        id="grade-partial-btn"
                        onClick={() => handleGrade('partial')}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-600" />
                        <span>আংশিক (+১)</span>
                      </button>

                      <button
                        type="button"
                        id="grade-wrong-btn"
                        onClick={() => handleGrade('wrong')}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950/60 dark:text-red-300 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ভুল (০)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddSmartQuestionToCurrent}
                        className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>+ নতুন প্রশ্ন যোগ</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: LEADERBOARD & PERFORMANCE RANKINGS (নতুন মেধা তালিকা) */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Leaderboard Top Header & Actions */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-md">
                    <Trophy className="w-6 h-6 drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>শিক্ষার্থীদের লাইভ মেধা তালিকা ও লিডারবোর্ড</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        {toBengaliNumber(students.length)} জন শিক্ষার্থী
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      মোট অর্জিত পয়েন্ট: <strong className="text-emerald-600 font-mono">{toBengaliNumber(totalClassStats.totalPoints)}</strong> • মোট সঠিক উত্তর: <strong className="text-emerald-600 font-mono">{toBengaliNumber(totalClassStats.totalCorrect)}</strong>
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintLeaderboard}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>মেধা তালিকা প্রিন্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPoints}
                    className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>পয়েন্ট রিসেট</span>
                  </button>
                </div>
              </div>

              {/* Top 3 Performers Podium Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformers.map((st, idx) => {
                  const badge = getRankBadge(idx, st.points);
                  const isFirst = idx === 0;
                  return (
                    <div 
                      key={st.id}
                      className={`relative rounded-3xl p-5 border ${badge.cardBorder} ${badge.cardBg} transition-all space-y-3 ${
                        isFirst ? 'md:-translate-y-2' : ''
                      }`}
                    >
                      {/* Rank Tag */}
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${badge.bg}`}>
                          {isFirst && <Crown className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />}
                          {badge.label}
                        </span>

                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                          রোল {toBengaliNumber(st.roll)}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div>
                        <h4 className={`text-lg font-black ${badge.textColor}`}>
                          {st.name}
                        </h4>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {toBengaliNumber(st.points)}
                          </span>
                          <span className="text-xs font-bold text-slate-500">পয়েন্ট</span>
                        </div>
                      </div>

                      {/* Performance details */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>✓ সঠিক: <strong className="text-emerald-600">{toBengaliNumber(st.correctAnswers)}</strong></span>
                        <span>✗ ভুল: <strong className="text-rose-600">{toBengaliNumber(st.wrongAnswers)}</strong></span>
                        <span>অংশগ্রহণ: <strong>{toBengaliNumber(st.totalAttempts)}</strong></span>
                      </div>

                      {/* Quick Add Points Button */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustPoints(st.id, 1)}
                          className="flex-1 py-1 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          +১ পয়েন্ট
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustPoints(st.id, 2)}
                          className="flex-1 py-1 bg-amber-600/10 hover:bg-amber-600 hover:text-white text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          +২ পয়েন্ট
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Complete Leaderboard Table (সকল শিক্ষার্থীর পূর্ণাঙ্গ মেধা তালিকা) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-4 p-6">
                
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Medal className="w-4 h-4 text-emerald-600" />
                    <span>সকল শিক্ষার্থীর ক্রমতালিকা ও নম্বর হিসাব</span>
                  </h4>
                  <span className="text-xs text-slate-500">সর্বোচ্চ পয়েন্টের ভিত্তিতে সাজানো</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                        <th className="py-3 px-3 text-center w-16">মেধা স্থান</th>
                        <th className="py-3 px-3 w-20 text-center">রোল</th>
                        <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                        <th className="py-3 px-4 text-center">মোট পয়েন্ট</th>
                        <th className="py-3 px-3 text-center">সঠিক উত্তর</th>
                        <th className="py-3 px-3 text-center">ভুল উত্তর</th>
                        <th className="py-3 px-3 text-center">সফলতার হার</th>
                        <th className="py-3 px-4 text-center">পয়েন্ট নিয়ন্ত্রণ</th>
                        <th className="py-3 px-2 text-center w-12">মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rankedStudents.map((st, idx) => {
                        const isTop1 = idx === 0 && st.points > 0;
                        const isTop2 = idx === 1 && st.points > 0;
                        const isTop3 = idx === 2 && st.points > 0;
                        const accuracy = st.totalAttempts > 0 
                          ? Math.round((st.correctAnswers / st.totalAttempts) * 100) 
                          : 0;

                        return (
                          <tr 
                            key={st.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              isTop1 ? 'bg-amber-50/40 dark:bg-amber-950/20 font-medium' : ''
                            }`}
                          >
                            {/* Rank Column */}
                            <td className="py-3.5 px-3 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                                isTop1 ? 'bg-amber-500 text-white shadow-xs' :
                                isTop2 ? 'bg-slate-400 text-white' :
                                isTop3 ? 'bg-amber-700 text-white' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}>
                                {isTop1 ? '১' : isTop2 ? '২' : isTop3 ? '৩' : toBengaliNumber(idx + 1)}
                              </span>
                            </td>

                            {/* Roll Column */}
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                              {toBengaliNumber(st.roll)}
                            </td>

                            {/* Name Column */}
                            <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <span>{st.name}</span>
                                {isTop1 && (
                                  <span className="px-2 py-0.2 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                    শীর্ষ স্থান
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Points Column */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-black text-sm">
                                {toBengaliNumber(st.points)}
                              </span>
                            </td>

                            {/* Correct Answers */}
                            <td className="py-3.5 px-3 text-center font-mono text-emerald-600 font-bold">
                              {toBengaliNumber(st.correctAnswers)}টি
                            </td>

                            {/* Wrong Answers */}
                            <td className="py-3.5 px-3 text-center font-mono text-rose-500">
                              {toBengaliNumber(st.wrongAnswers)}টি
                            </td>

                            {/* Accuracy % */}
                            <td className="py-3.5 px-3 text-center">
                              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                                accuracy >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' :
                                accuracy >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {toBengaliNumber(accuracy)}%
                              </span>
                            </td>

                            {/* Point Control Buttons */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  title="+১ যোগ করুন"
                                  onClick={() => handleAdjustPoints(st.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                >
                                  +১
                                </button>
                                <button
                                  type="button"
                                  title="+২ যোগ করুন"
                                  onClick={() => handleAdjustPoints(st.id, 2)}
                                  className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                >
                                  +২
                                </button>
                                <button
                                  type="button"
                                  title="-১ বিয়োগ করুন"
                                  onClick={() => handleAdjustPoints(st.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 dark:border-rose-800 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                >
                                  -১
                                </button>
                              </div>
                            </td>

                            {/* Delete Student */}
                            <td className="py-3.5 px-2 text-center">
                              <button
                                type="button"
                                title="মুছে ফেলুন"
                                onClick={() => handleDeleteStudent(st.id, st.name)}
                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add New Student Inline Form */}
                <form onSubmit={handleAddStudent} className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>নতুন শিক্ষার্থী যোগ করুন:</span>
                  </div>

                  <input
                    type="text"
                    placeholder="শিক্ষার্থীর নাম (যেমন: তালহা)"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="flex-1 min-w-[160px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />

                  <input
                    type="text"
                    placeholder="রোল নং (ঐচ্ছিক)"
                    value={newStudentRoll}
                    onChange={(e) => setNewStudentRoll(e.target.value)}
                    className="w-28 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>যোগ করুন</span>
                  </button>
                </form>

              </div>

            </div>
          )}

          {/* TAB 3: COMPLETE ANSWER SHEET VIEW (উত্তরপত্র) */}
          {activeTab === 'answerSheet' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    মাদরাসাতুস সুন্নাহ — সম্পূর্ণ উত্তরপত্র (Answer Key)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    শ্রেণি: {exercise.gradeLevel} | বিষয়: {exercise.subject} | মোট নম্বর: {exercise.totalMarks}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrintAnswerSheet}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>উত্তরপত্র প্রিন্ট</span>
                </button>
              </div>

              {/* Sections Breakdown */}
              <div className="space-y-6">
                {exercise.sections.map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-3">
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center justify-center">
                        {toBengaliNumber(sIdx + 1)}
                      </span>
                      <span>{sec.title}</span>
                    </h4>

                    <div className="space-y-3 pl-4">
                      {sec.questions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              ({toBengaliNumber(qIdx + 1)}) {q.question}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded">
                              [{toBengaliNumber(q.points || 1)} নম্বর]
                            </span>
                          </div>

                          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-lg border-l-3 border-emerald-600">
                            ✓ সঠিক উত্তর: <span className="font-normal text-slate-800 dark:text-slate-200">{q.answer}</span>
                          </div>

                          {q.explanation && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pl-1">
                              দলীল/ব্যাখ্যা: {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

