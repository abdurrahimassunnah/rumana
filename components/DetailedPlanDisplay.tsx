import React, { useState, useRef } from 'react';
import { printDocument } from '../services/printService';
import { 
  Printer, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  Edit3, 
  Save, 
  Download, 
  Plus, 
  Trash2, 
  Eye, 
  FileDown, 
  BookOpen, 
  CheckCircle2, 
  Layers,
  ArrowUpDown,
  Type,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { DetailedLessonPlan, LessonProcedureStep, PlanLengthMode } from '../types';
import { MadrasahLogo } from './MadrasahLogo';
import { SmartActivitySuite } from './SmartActivitySuite';
import { ALL_GRADE_SAMPLE_PLANS, CLASS_1_ISLAM_SAMPLE_PLAN, FORMAL_OBSERVATION_02_PLAN } from '../constants/sampleDetailedPlan';

interface DetailedPlanDisplayProps {
  plan: DetailedLessonPlan;
  onReset: () => void;
  onRegenerate?: () => void;
  onRegenerateWithLength?: (length: PlanLengthMode) => void;
  isRegenerating?: boolean;
}

export const DetailedPlanDisplay: React.FC<DetailedPlanDisplayProps> = ({
  plan: initialPlan,
  onReset,
  onRegenerate,
  onRegenerateWithLength,
  isRegenerating = false
}) => {
  // Normalize initial plan to ensure all properties exist
  const normalizePlan = (raw: any): DetailedLessonPlan => {
    const className = raw.className || raw.lessonProfile?.gradeLevel || 'KG';
    const topic = raw.topic || raw.lessonProfile?.topicTitle || raw.lessonProfile?.title || 'Colors (Red, Blue, Yellow)';
    const subject = raw.subject || raw.lessonProfile?.subject || 'English (Literacy)';
    const teacherName = raw.teacherName !== undefined && raw.teacherName !== null ? raw.teacherName : '';
    const duration = raw.duration || raw.lessonProfile?.duration || '30 mins';
    
    let materials = raw.materials;
    if (!materials) {
      const aidsList = [
        ...(raw.teachingAids?.general || []),
        ...(raw.teachingAids?.special || [])
      ];
      materials = aidsList.length > 0 
        ? aidsList.join(', ') 
        : 'Color flashcards, red/blue/yellow toys, crayons, worksheet.';
    }

    let learningObjective = raw.learningObjective;
    if (!learningObjective) {
      if (raw.learningOutcomes?.knowledge?.length) {
        learningObjective = `By the end of the lesson, students will be able to ${raw.learningOutcomes.knowledge.join(' and ')}.`;
      } else {
        learningObjective = `By the end of the lesson, children will be able to understand and apply key concepts of ${topic}.`;
      }
    }

    let successCriteria = raw.successCriteria;
    if (!Array.isArray(successCriteria) || successCriteria.length === 0) {
      if (raw.learningOutcomes?.comprehension?.length || raw.learningOutcomes?.application?.length) {
        successCriteria = [
          `1. Recall key terms of ${topic}`,
          `2. Explain the meaning and significance in own words`,
          `3. Practice and demonstrate key learning in activities`
        ];
      } else {
        successCriteria = [
          '1. Point to a yellow/red/blue object when asked',
          '2. Say the color name (red / blue / yellow) while pointing',
          '3. Match objects to the correct color group'
        ];
      }
    }

    let procedures: LessonProcedureStep[] = raw.procedures;
    if (!Array.isArray(procedures) || procedures.length === 0) {
      if (Array.isArray(raw.deliverySteps) && raw.deliverySteps.length > 0) {
        procedures = raw.deliverySteps.map((s: any, idx: number) => ({
          stageAndTime: `Stage ${s.stepNumber || idx + 1}\n${s.durationMinutes || 8} minutes`,
          activityTitle: s.title || `Activity: Step ${idx + 1}`,
          procedurePoints: [
            s.teacherActivity || 'Teacher models and guides.',
            ...(s.keyPoints || [])
          ],
          childrenDo: s.studentActivity || 'Listen and participate actively',
          teacherDoes: s.teacherActivity || 'Explains, models and checks',
          intPattern: idx % 2 === 0 ? 'W/C\nS' : 'GW\nS',
          aids: 'TB\nSB'
        }));
      } else {
        procedures = [
          {
            stageAndTime: "Lead in / warm-up\n3-5 minutes",
            activityTitle: "Activity: Hello Song + Color Hunt",
            procedurePoints: [
              "Teacher sings the hello song",
              "Children look around the classroom and point to one red, one yellow and one blue object"
            ],
            childrenDo: "Point and name",
            teacherDoes: "Models and encourages.",
            intPattern: "W/C\nC / O",
            aids: "SB\nC / O"
          },
          {
            stageAndTime: "Main activity\n15-20 minutes",
            activityTitle: "Activity: Flashcard & Toy Show",
            procedurePoints: [
              "Teacher shows one color at a time",
              "Children repeat and touch matching toys"
            ],
            childrenDo: "Say color names, touch objects",
            teacherDoes: "Shows, asks simple questions",
            intPattern: "W/C\nS",
            aids: "Flashcards\n& toys"
          },
          {
            stageAndTime: "Practice / play\n10 minutes",
            activityTitle: "Activity: Color Stations",
            procedurePoints: [
              "Children move to color corners (Red / Blue / Yellow)",
              "Pick up matching objects"
            ],
            childrenDo: "Move, sort, talk",
            teacherDoes: "Monitors and praises",
            intPattern: "GW\nS",
            aids: "Objects"
          },
          {
            stageAndTime: "Review\n5 minutes",
            activityTitle: "Activity: Color Song + Exit Check",
            procedurePoints: [
              "Sing a color song with actions",
              "Each child points to one color before leaving"
            ],
            childrenDo: "Sing and show understanding",
            teacherDoes: "Checks learning informally",
            intPattern: "W/C",
            aids: "SB"
          }
        ];
      }
    }

    const symbolKeys = raw.symbolKeys || {
      intKeys: [
        { symbol: "W/C", meaning: "whole class" },
        { symbol: "PW", meaning: "Pair work" },
        { symbol: "GW", meaning: "Group work" },
        { symbol: "S", meaning: "students work individually" }
      ],
      aidsKeys: [
        { symbol: "SB", meaning: "Smartboard" },
        { symbol: "TB", meaning: "Textbook" },
        { symbol: "W/S", meaning: "Worksheet" }
      ]
    };

    return {
      observationTitle: raw.observationTitle || 'Formal Observation-02',
      institutionName: raw.institutionName || 'মাদরাসাতুস সুন্নাহ',
      className,
      topic,
      subject,
      teacherName,
      duration,
      materials,
      learningObjective,
      successCriteria,
      procedures,
      symbolKeys,
      planLength: raw.planLength || 'standard_3page',
      teachersNote: raw.teachersNote || ''
    };
  };

  const [plan, setPlan] = useState<DetailedLessonPlan>(() => normalizePlan(initialPlan));
  const [viewPlanLength, setViewPlanLength] = useState<PlanLengthMode>(() => (initialPlan.planLength as PlanLengthMode) || 'standard_3page');
  const [layoutMode, setLayoutMode] = useState<'3page' | 'continuous'>('3page');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeLangOverride, setActiveLangOverride] = useState<'auto' | 'ar' | 'bn' | 'en'>('auto');
  const [fontMode, setFontMode] = useState<'auto' | 'amiri' | 'kalpurush' | 'times'>('auto');
  const [showActivitySuite, setShowActivitySuite] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const norm = normalizePlan(initialPlan);
    setPlan(norm);
    if (initialPlan.planLength) {
      setViewPlanLength(initialPlan.planLength);
    }
  }, [initialPlan]);

  const handleLengthChange = (mode: PlanLengthMode, triggerRegeneration: boolean = false) => {
    setViewPlanLength(mode);
    setPlan(prev => ({ ...prev, planLength: mode }));
    if (triggerRegeneration && onRegenerateWithLength) {
      onRegenerateWithLength(mode);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Detect whether plan is Arabic, Bengali, or English
  const detectLanguage = (p: DetailedLessonPlan): 'ar' | 'bn' | 'en' => {
    // 1. If explicitly defined in plan.language, HONOR IT DIRECTLY
    if (p.language === 'bn' || p.language === 'bangla' || p.language === 'bengali') return 'bn';
    if (p.language === 'en' || p.language === 'english') return 'en';
    if (p.language === 'ar' || p.language === 'arabic') return 'ar';

    // 2. Count characters across content
    const combined = [
      p.topic || '',
      p.subject || '',
      p.className || '',
      p.materials || '',
      p.learningObjective || '',
      ...(p.successCriteria || []),
      ...(p.procedures || []).map(pr => `${pr.stageAndTime} ${pr.activityTitle} ${(pr.procedurePoints || []).join(' ')} ${pr.childrenDo} ${pr.teacherDoes}`)
    ].join(' ');
    
    const arCount = (combined.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
    const bnCount = (combined.match(/[\u0980-\u09FF]/g) || []).length;
    const enCount = (combined.match(/[a-zA-Z]/g) || []).length;

    // Strict Rule: If ANY Bengali text exists (even 1 character), user asked for Bengali output! Bengali is LTR!
    if (bnCount > 0) return 'bn';
    // If predominantly Arabic without Bengali
    if (arCount > 15 && arCount > enCount) return 'ar';
    return 'en';
  };

  const autoLang = detectLanguage(plan);
  const effectiveLang: 'ar' | 'bn' | 'en' = activeLangOverride !== 'auto'
    ? activeLangOverride
    : (fontMode === 'amiri' ? 'ar' : fontMode === 'kalpurush' ? 'bn' : fontMode === 'times' ? 'en' : autoLang);

  const isAr = effectiveLang === 'ar';
  const isBn = effectiveLang === 'bn';

  const currentFontFamily = isAr 
    ? "'Amiri', 'Traditional Arabic', 'Scheherazade New', 'Noto Naskh Arabic', serif"
    : isBn 
      ? "'Kalpurush', 'SolaimanLipi', 'Noto Sans Bengali', sans-serif" 
      : "'Times New Roman', Times, Georgia, serif";

  // Localized UI Labels
  const labels = {
    docTitle: isAr ? 'خطة الدرس' : 'Lesson Plan',
    observationSubtitle: plan.observationTitle || 'Formal Observation-02',
    classLabel: isAr ? 'الصف:' : 'Class:',
    topicLabel: isAr ? 'الموضوع:' : 'Topic:',
    subjectLabel: isAr ? 'المادة:' : 'Subject:',
    teacherLabel: isAr ? 'اسم المعلم:' : "Teacher's name:",
    durationLabel: isAr ? 'المدة:' : 'Duration:',
    materialsLabel: isAr ? 'الوسائل التعليمية:' : 'Materials:',
    learningObjectiveLabel: isAr ? 'الأهداف التعليمية:\n(Learning Objective)' : (isBn ? 'Learning Objective: (শিখন-উদ্দেশ্য)' : 'Learning Objective:'),
    successCriteriaLabel: isAr ? 'معايير النجاح:\n(Success Criteria)' : (isBn ? 'Success criteria: (সাফল্যের মানদণ্ড)' : 'Success criteria:'),
    procedureSectionTitle: isAr ? 'خطوات سير الدرس (Lesson Procedure)' : (isBn ? 'Lesson Procedure (পাঠ পরিচালনার ধারাবাহিকতা)' : 'Lesson Procedure'),
    stagesTimeHeader: isAr ? 'المرحلة / الزمن' : (isBn ? 'স্টেজ/সময়' : 'Stages/Time'),
    procedureHeader: isAr ? 'الإجراءات والأنشطة (Procedure)' : (isBn ? 'কার্যক্রম বিবরণ (Procedure)' : 'Procedure'),
    intHeader: 'Int',
    aidsHeader: 'Aids',
    activityTitleLabel: isAr ? 'عنوان النشاط:' : (isBn ? 'কার্যক্রমের শিরোনাম:' : 'Activity Title:'),
    bulletPointsLabel: isAr ? 'خطوات النشاط:' : (isBn ? 'ধাপসমূহ:' : 'Bullet Points:'),
    childrenDoLabel: isAr ? 'نشاط الطلاب:' : (isBn ? 'শিক্ষার্থীরা যা করবে:' : 'Children do:'),
    teacherDoesLabel: isAr ? 'دور المعلم:' : (isBn ? 'শিক্ষকের ভূমিকা:' : 'Teacher does:'),
    keyToSymbolsTitle: isAr ? 'دليل الرموز والمصطلحات:' : 'Key to Symbols',
    intKeyHeader: 'Int = interaction pattern',
    aidsKeyHeader: 'Aids',
    teachersNoteLabel: isAr ? 'ملاحظة المعلم:' : (isBn ? 'শিক্ষকের নোট:' : "Teacher's Note:"),
    teacherSig: isAr ? 'توقيع المعلم والتاريخ' : (isBn ? 'শিক্ষকের স্বাক্ষর ও তারিখ' : "Teacher's Signature & Date"),
    supervisorSig: isAr ? 'مدير المدرسة / المشرف الأكاديمي' : (isBn ? 'অধ্যক্ষ / সুপারিনটেনডেন্ট / একাডেমিক সুপারভাইজারের স্বাক্ষর' : 'Head of Madrasah / Academic Supervisor'),
    addCriteria: isAr ? '+ إضافة معيار' : '+ ক্রাইটেরিয়া যোগ',
    addPoint: isAr ? '+ إضافة نقطة' : '+ পয়েন্ট যোগ',
    deleteStep: isAr ? 'حذف المرحلة ✕' : 'ধাপ মুছে ফেলুন ✕'
  };

  // Update if initialPlan changes
  React.useEffect(() => {
    setPlan(normalizePlan(initialPlan));
  }, [initialPlan]);

  const handleCopyText = () => {
    let text = `=========================================================\n`;
    text += `               ${labels.docTitle}\n`;
    text += `=========================================================\n`;
    text += `${labels.classLabel} ${plan.className} | ${labels.topicLabel} ${plan.topic}\n`;
    text += `${labels.subjectLabel} ${plan.subject} | ${labels.teacherLabel} ${plan.teacherName}\n`;
    text += `${labels.durationLabel} ${plan.duration} | ${labels.materialsLabel} ${plan.materials}\n`;
    text += `---------------------------------------------------------\n`;
    text += `${labels.learningObjectiveLabel} ${plan.learningObjective}\n`;
    text += `---------------------------------------------------------\n`;
    text += `${labels.successCriteriaLabel}\n`;
    plan.successCriteria.forEach((crit, i) => {
      text += `${crit.startsWith(`${i + 1}.`) || crit.startsWith(`١.`) ? crit : `${i + 1}. ${crit}`}\n`;
    });
    text += `---------------------------------------------------------\n`;
    text += `${labels.procedureSectionTitle}\n`;
    text += `---------------------------------------------------------\n`;
    plan.procedures.forEach((step, idx) => {
      text += `\n[${labels.stagesTimeHeader} ${idx + 1}: ${step.stageAndTime.replace('\n', ' - ')}]\n`;
      text += `${step.activityTitle}\n`;
      step.procedurePoints.forEach(p => {
        text += `• ${p}\n`;
      });
      text += `${labels.childrenDoLabel} ${step.childrenDo}\n`;
      text += `${labels.teacherDoesLabel} ${step.teacherDoes}\n`;
      text += `Int: ${step.intPattern.replace('\n', ' / ')} | Aids: ${step.aids.replace('\n', ' / ')}\n`;
    });
    text += `\n---------------------------------------------------------\n`;
    text += `${labels.keyToSymbolsTitle}\n`;
    text += `Int = interaction pattern | Aids\n`;
    plan.symbolKeys.intKeys.forEach((k, i) => {
      const aidKey = plan.symbolKeys.aidsKeys[i];
      text += `${k.symbol} = ${k.meaning} | ${aidKey ? `${aidKey.symbol} = ${aidKey.meaning}` : ''}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!printableRef.current) {
      window.print();
      return;
    }

    const customCss = `
      table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      th, td { border: 1.5px solid #0f172a; padding: 6px 8px; font-size: ${isAr ? '13.5px' : '13px'}; }
      th { background-color: #22c55e !important; color: #000000 !important; font-weight: bold; }
      .bg-white { background: #ffffff !important; }
      .border-slate-800, .border-black { border-color: #000000 !important; }
      .text-black { color: #000000 !important; }
      .no-print, button, .lucide { display: none !important; }
      #lesson-plan-printable-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; }
      .print-page-break {
        page-break-after: always !important;
        break-after: page !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        display: block !important;
        visibility: hidden !important;
      }
      .screen-only-divider {
        display: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 10mm 12mm 10mm 12mm;
      }
    `;

    printDocument({
      title: isAr 
        ? `خطة الدرس - ${plan.topic || plan.subject}` 
        : isBn 
          ? `পাঠ পরিকল্পনা - ${plan.topic || plan.subject}` 
          : `Lesson Plan - ${plan.topic || plan.subject}`,
      contentHtml: printableRef.current.innerHTML,
      isArabic: isAr,
      isBengali: isBn,
      language: effectiveLang,
      customCss
    });
  };

  const handleDownloadDoc = () => {
    const renderWordRows = (steps: LessonProcedureStep[]) => steps.map(p => `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top; width: 22%; font-weight: bold; font-size: 13px; text-align: ${isAr ? 'right' : 'left'};">
          ${p.stageAndTime.replace(/\n/g, '<br/>')}
        </td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top; width: 54%; font-size: 13px; text-align: ${isAr ? 'right' : 'left'};">
          <strong>${p.activityTitle}</strong>
          <ul style="margin: 4px 0 6px 16px; padding: 0;">
            ${p.procedurePoints.map(pt => `<li>${pt}</li>`).join('')}
          </ul>
          <div><strong>${labels.childrenDoLabel}</strong> ${p.childrenDo}</div>
          <div><strong>${labels.teacherDoesLabel}</strong> ${p.teacherDoes}</div>
        </td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top; width: 12%; text-align: center; font-weight: bold; font-size: 13px;">
          ${p.intPattern.replace(/\n/g, '<br/>')}
        </td>
        <td style="border: 1px solid #000; padding: 8px; vertical-align: top; width: 12%; text-align: center; font-size: 13px;">
          ${p.aids.replace(/\n/g, '<br/>')}
        </td>
      </tr>
    `).join('');

    const pageBreakWord = "<br clear=all style='mso-special-character:line-break;page-break-before:always'>";
    const wordProcedureTable = (steps: LessonProcedureStep[], titleSuffix: string = '') => `
      <div class="section-title">${labels.procedureSectionTitle} ${titleSuffix}</div>
      <table>
        <thead>
          <tr style="background-color: #22c55e; color: #000; font-weight: bold;">
            <th style="border: 1px solid #000; width: 20%; text-align: ${isAr ? 'right' : 'left'};">${labels.stagesTimeHeader}</th>
            <th style="border: 1px solid #000; width: 58%; text-align: ${isAr ? 'right' : 'left'};">${labels.procedureHeader}</th>
            <th style="border: 1px solid #000; width: 10%; text-align: center;">${labels.intHeader}</th>
            <th style="border: 1px solid #000; width: 12%; text-align: center;">${labels.aidsHeader}</th>
          </tr>
        </thead>
        <tbody>
          ${renderWordRows(steps)}
        </tbody>
      </table>
    `;

    const { p1, p2, p3 } = getPageProcedures();
    const procedureContentWord = viewPlanLength === 'standard_3page'
      ? `
        ${wordProcedureTable(p1, '(অংশ ১ — প্রস্তুতি)')}
        ${pageBreakWord}
        <div style="font-size: 11px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">
          ${plan.observationTitle || 'Formal Observation (02)'} — Lesson Plan (চলমান) | ${plan.institutionName || 'মাদরাসাতুস সুন্নাহ'}
        </div>
        ${wordProcedureTable(p2, '(চলমান — মূল পাঠদান ও অনুশীলন)')}
        ${pageBreakWord}
        <div style="font-size: 11px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">
          ${plan.observationTitle || 'Formal Observation (02)'} — Lesson Plan (সমাপনী ও মূল্যায়ন) | ${plan.institutionName || 'মাদরাসাতুস সুন্নাহ'}
        </div>
        ${wordProcedureTable(p3, '(সমাপ্তি — পাঠ পর্যালোচনা)')}
      `
      : wordProcedureTable(plan.procedures, '');

    const symbolRowsHtml = plan.symbolKeys.intKeys.map((k, i) => {
      const aidKey = plan.symbolKeys.aidsKeys[i];
      return `
        <tr>
          <td style="border: 1px solid #000; padding: 4px 8px; font-size: 12px; text-align: ${isAr ? 'right' : 'left'};"><strong>${k.symbol}</strong> = ${k.meaning}</td>
          <td style="border: 1px solid #000; padding: 4px 8px; font-size: 12px; text-align: ${isAr ? 'right' : 'left'};">${aidKey ? `<strong>${aidKey.symbol}</strong> = ${aidKey.meaning}` : ''}</td>
        </tr>
      `;
    }).join('');

    const docFontFamily = isAr 
      ? "'Amiri', 'Traditional Arabic', 'Scheherazade New', 'Noto Naskh Arabic', serif"
      : isBn 
        ? "'Kalpurush', 'SolaimanLipi', 'Noto Sans Bengali', Arial, sans-serif" 
        : "'Times New Roman', Times, Georgia, serif";

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${labels.docTitle} - ${plan.topic}</title>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        <link href="https://fonts.maateen.me/kalpurush/font.css" rel="stylesheet">
        <style>
          @font-face {
            font-family: 'Kalpurush';
            src: url('https://cdn.jsdelivr.net/gh/maateen/kalpurush-font@master/fonts/Kalpurush.woff2') format('woff2'),
                 url('https://cdn.jsdelivr.net/gh/maateen/kalpurush-font@master/fonts/Kalpurush.ttf') format('truetype');
          }
          body { 
            font-family: ${docFontFamily}; 
            margin: 20px; 
            color: #000; 
            direction: ${isAr ? 'rtl' : 'ltr'}; 
            text-align: ${isAr ? 'right' : 'left'}; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 12px; 
            font-family: ${docFontFamily}; 
            direction: ${isAr ? 'rtl' : 'ltr'}; 
          }
          th, td { 
            border: 1px solid #000; 
            padding: 6px 8px; 
            font-family: ${docFontFamily}; 
            text-align: ${isAr ? 'right' : 'left'}; 
          }
          .header-title { 
            text-align: center; 
            font-size: 20px; 
            font-weight: bold; 
            margin: 10px 0 14px 0; 
            font-family: ${docFontFamily}; 
          }
          .section-title { 
            text-align: ${isAr ? 'right' : 'left'}; 
            font-size: 16px; 
            font-weight: bold; 
            margin: 12px 0 6px 0; 
            font-family: ${docFontFamily}; 
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 6px;">
          <h2 style="margin: 0; font-size: 18px; color: #0f766e;">مادراسَاتُس سُنَّة | MADRASATUS SUNNAH</h2>
        </div>
        <div class="header-title">${labels.docTitle}</div>
        
        <!-- Metadata Table -->
        <table>
          <tr>
            <td style="width: 50%;"><strong>${labels.classLabel}</strong> ${plan.className}</td>
            <td style="width: 50%;"><strong>${labels.topicLabel}</strong> ${plan.topic}</td>
          </tr>
          <tr>
            <td><strong>${labels.subjectLabel}</strong> ${plan.subject}</td>
            <td><strong>${labels.teacherLabel}</strong> ${plan.teacherName}</td>
          </tr>
          <tr>
            <td><strong>${labels.durationLabel}</strong> ${plan.duration}</td>
            <td><strong>${labels.materialsLabel}</strong> ${plan.materials}</td>
          </tr>
          <tr>
            <td colspan="2">
              <strong>${labels.learningObjectiveLabel}</strong> ${plan.learningObjective}
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <strong>${labels.successCriteriaLabel}</strong><br/>
              ${plan.successCriteria.map((c, i) => `${c.startsWith(`${i + 1}.`) || c.startsWith(`١.`) ? c : `${i + 1}. ${c}`}<br/>`).join('')}
            </td>
          </tr>
        </table>

        <!-- Procedure Content -->
        ${procedureContentWord}

        <!-- Key to Symbols Table -->
        <div style="margin-top: 10px; font-weight: bold; font-size: 13px;">${labels.keyToSymbolsTitle}</div>
        <table style="width: 70%; margin-top: 4px;">
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #000; width: 50%; text-align: ${isAr ? 'right' : 'left'}; font-size: 12px;">${labels.intKeyHeader}</th>
            <th style="border: 1px solid #000; width: 50%; text-align: ${isAr ? 'right' : 'left'}; font-size: 12px;">${labels.aidsKeyHeader}</th>
          </tr>
          ${symbolRowsHtml}
        </table>

        ${plan.teachersNote ? `
        <!-- Teacher's Note -->
        <div style="margin-top: 16px; padding: 10px; border-left: 4px solid #f59e0b; background-color: #fffbeb; font-size: 12px; line-height: 1.5;">
          <strong>${labels.teachersNoteLabel}</strong> <em>${plan.teachersNote}</em>
        </div>
        ` : ''}

        <!-- Running Footer -->
        <div style="margin-top: 24px; padding-top: 8px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #4b5563;">
          ${plan.institutionName || 'মাদরাসাতুস সুন্নাহ'} | ${plan.subject} — ${plan.className}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lesson_Plan_${plan.topic.replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0980-\u09FF-]/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Editing helpers
  const handleUpdateProcedure = (index: number, field: keyof LessonProcedureStep, val: any) => {
    const updated = [...plan.procedures];
    updated[index] = { ...updated[index], [field]: val };
    setPlan({ ...plan, procedures: updated });
  };

  const handleAddProcedurePoint = (stepIndex: number) => {
    const updated = [...plan.procedures];
    updated[stepIndex].procedurePoints.push(isAr ? 'نقطة أو توجيه جديد' : (isBn ? 'নতুন শিক্ষক নির্দেশনা বা কার্যক্রম' : 'New instruction or teacher activity point'));
    setPlan({ ...plan, procedures: updated });
  };

  const handleRemoveProcedurePoint = (stepIndex: number, pointIndex: number) => {
    const updated = [...plan.procedures];
    updated[stepIndex].procedurePoints.splice(pointIndex, 1);
    setPlan({ ...plan, procedures: updated });
  };

  const handleAddProcedureRow = () => {
    const newStep: LessonProcedureStep = {
      stageAndTime: isAr ? "مرحلة إضافية\n٥ دقائق" : (isBn ? "অতিরিক্ত ধাপ\n৫ মিনিট" : "Additional Stage\n5 minutes"),
      activityTitle: isAr ? "النشاط: نشاط تعليمي جديد" : (isBn ? "কার্যক্রম: নতুন শ্রেণিকক্ষ কার্যক্রম" : "Activity: New Activity"),
      procedurePoints: isAr ? ["يقدم المعلم التعليمات للطلاب", "يطبق الطلاب النشاط بإشراف المعلم"] : (isBn ? ["শিক্ষক শিক্ষার্থীদের নির্দেশনা প্রদান করবেন", "শিক্ষার্থীরা শিক্ষকের তত্ত্বাবধানে সক্রিয় অনুশীলন করবে"] : ["Teacher gives instructions", "Students practice"]),
      childrenDo: isAr ? "يشارك الطلاب ويتفاعلون بنشاط" : (isBn ? "শিক্ষার্থীরা সক্রিয়ভাবে অংশগ্রহণ ও অনুশীলন করবে" : "Participate and respond"),
      teacherDoes: isAr ? "يشرف المعلم ويوجه ويصحح" : (isBn ? "শিক্ষক পর্যবেক্ষণ, পরিচালনা ও সংশোধন করবেন" : "Guides and monitors"),
      intPattern: isAr ? "ف/ك" : "W/C",
      aids: isAr ? "س/ذ" : "SB"
    };
    setPlan({ ...plan, procedures: [...plan.procedures, newStep] });
  };

  const handleRemoveProcedureRow = (index: number) => {
    if (plan.procedures.length <= 1) return;
    const updated = plan.procedures.filter((_, idx) => idx !== index);
    setPlan({ ...plan, procedures: updated });
  };

  const handleAddSuccessCriteria = () => {
    const num = plan.successCriteria.length + 1;
    setPlan({
      ...plan,
      successCriteria: [...plan.successCriteria, isAr ? `${num}. معيار نجاح جديد` : (isBn ? `${num}. নতুন সাফল্য নির্ণায়ক ক্রাইটেরিয়া` : `${num}. New success criteria item`)]
    });
  };

  const handleRemoveSuccessCriteria = (idx: number) => {
    if (plan.successCriteria.length <= 1) return;
    const updated = plan.successCriteria.filter((_, i) => i !== idx);
    setPlan({ ...plan, successCriteria: updated });
  };

  // Validation for Subject & Age Congruence (Preventing mismatched goals like English in Bangla class)
  const isSubjectBangla = /বাংলা|bengali|bangla/i.test(plan.subject || '');
  const isSubjectIslam = /ইসলাম|কুরআন|হাদিস|ফিকহ|আকাইদ|সিরাত|সালাত|তাজবীদ/i.test(plan.subject || '') || /সালাত|নামাজ|রোজা|অযু|কালেমা/i.test(plan.topic || '');
  const isSubjectMath = /গণিত|math|অংক/i.test(plan.subject || '');
  const isSubjectEnglish = /ইংরেজি|english/i.test(plan.subject || '');

  // Detect inappropriate foreign language goal (e.g. English goal in Bangla/Islam/Math subject)
  const allCriteriaAndObjective = `${plan.learningObjective} ${(plan.successCriteria || []).join(' ')}`;
  const hasMismatchedEnglishGoal = !isSubjectEnglish && /(ইংরেজিতে বলতে|ইংরেজি বলতে|say in english|speak in english|ইংরেজিতে বাক্য|english vocabulary)/i.test(allCriteriaAndObjective);
  const hasUnwantedQuizOrExitTicket = /(ডিজিটাল কুইজ|লাইভ লিডারবোর্ড|এক্সিট টিকিট|exit ticket|লিডারবোর্ড)/i.test(allCriteriaAndObjective + ' ' + plan.materials + ' ' + plan.procedures.map(p => p.activityTitle + ' ' + p.procedurePoints.join(' ')).join(' '));

  const applyAgeAndSubjectCongruence = () => {
    const top = plan.topic || 'আজকের পাঠ';

    let newObjective = '';
    let newCriteria: string[] = [];

    const isClass1Or2 = /প্রথম|১ম|1st|class 1|কেজি|kg|প্লে|play|নার্সারি|nursery/i.test(plan.className || '');

    if (isSubjectBangla && isClass1Or2) {
      newObjective = `• পঠিত গল্প/কবিতাটি নিজের ভাষায় সংক্ষেপে বলতে পারবে।\n• ছবি দেখে গল্পের মূল চরিত্র শনাক্ত করতে পারবে ও বিষয়বস্তু বলতে পারবে।\n• পাঠের শিক্ষণীয় বিষয় সংক্ষেপে বলতে পারবে।`;
      newCriteria = [
        `আমি ছবি দেখে গল্পের মূল চরিত্র শনাক্ত করতে পারব এবং ঘটনাটি ধারাবাহিকভাবে বলতে পারব।`,
        `আমি পাঠের মূল বিষয়বস্তু সম্পর্কে কমপক্ষে দু'টি বাক্য বলতে পারব।`,
        `শিক্ষকের মৌখিক প্রশ্নের অধিকাংশ প্রশ্নের সঠিক উত্তর দিতে পারব।`
      ];
    } else if (isSubjectBangla) {
      newObjective = `• পাঠ শেষে শিক্ষার্থীরা "${top}"-এর মূল ভাবার্থ অনুধাবন করতে পারবে।\n• প্রমিত ও শুদ্ধ বাংলা উচ্চারণে পাঠ্যাংশ সাবলীলভাবে পড়তে পারবে।\n• পাঠ সংশ্লিষ্ট নতুন শব্দের সঠিক অর্থ বলতে ও বাক্যে প্রয়োগ করতে পারবে।\n• পাঠের মূল শিক্ষা ও শিক্ষণীয় বিষয় নিজের ভাষায় গুছিয়ে বলতে পারবে।`;
      newCriteria = [
        `আমি "${top}" পাঠের মূল সারসংক্ষেপ ও ভাবার্থ নিজের ভাষায় গুছিয়ে বলতে পারব।`,
        `আমি পাঠের নতুন ও কঠিন শব্দগুলোর অর্থ সঠিকভাবে বাক্যে প্রয়োগ করতে পারব।`,
        `শিক্ষক পাঠের মূল বক্তব্য ও অনুধাবনমূলক প্রশ্ন করলে আমি স্পষ্ট বাংলায় নির্ভুল উত্তর দিতে পারব।`
      ];
    } else if (isSubjectMath) {
      newObjective = `• পাঠ শেষে শিক্ষার্থীরা "${top}"-এর গাণিতিক সূত্র ও নিয়মাবলী স্পষ্টভাবে বুঝতে পারবে।\n• সমস্যার সমাধান ধাপে ধাপে নির্ভুলভাবে নির্ণয় করতে পারবে।\n• বাস্তব উদাহরণে এই গাণিতিক ধারণার প্রয়োগ ব্যাখ্যা করতে পারবে।`;
      newCriteria = [
        `আমি "${top}"-এর গাণিতিক নিয়মটি বুঝতে পেরেছি এবং উদাহরণ দিয়ে ব্যাখ্যা করতে পারব।`,
        `আমি পাঠ্যবই ও বোর্ডের সমস্যাগুলো ধাপে ধাপে সমাধান করতে পারব।`,
        `শিক্ষক নিয়ম পরিবর্তন করে নতুন অঙ্ক দিলে আমি তা নির্ভুলভাবে সম্পন্ন করতে পারব।`
      ];
    } else if (isSubjectIslam && isClass1Or2) {
      newObjective = `• পঠিত গল্পটি নিজের ভাষায় সংক্ষেপে বলতে পারবে।\n• পাঠের মূল ফজিলত ও শিক্ষণীয় বিষয় সংক্ষেপে বলতে পারবে।\n• সুন্নাহ অনুযায়ী সঠিক আদব ও দ্বীনি আমল প্রদর্শন করতে পারবে।`;
      newCriteria = [
        `ছবি দেখে গল্পের মূল চরিত্র ও বিষয়বস্তু শনাক্ত করতে পারব এবং ঘটনাটি ধারাবাহিকভাবে বলতে পারব।`,
        `পাঠের ফজিলত ও শিক্ষণীয় বিষয় সম্পর্কে কমপক্ষে দু'টি বাক্য বলতে পারব।`,
        `শিক্ষকের করা মৌখিক প্রশ্নের অধিকাংশের সঠিক উত্তর দিতে পারব।`
      ];
    } else if (isSubjectIslam) {
      newObjective = `• পাঠ শেষে শিক্ষার্থীরা "${top}"-এর মৌলিক বিধান ও গুরুত্ব সঠিকভাবে ব্যাখ্যা করতে পারবে।\n• সালাত ও দৈনন্দিন জীবনে সুন্নাহ পদ্ধতি অনুসারে আমল প্রদর্শন করতে পারবে।\n• পাঠের দ্বীনি ও নৈতিক শিক্ষা অনুধাবন করে বাস্তব জীবনে ধারণ করতে পারবে।`;
      newCriteria = [
        `আমি উস্তাদের উপস্থাপনা থেকে "${top}"-এর মূল বিধান ও শর্তাবলী চিহ্নিত করতে পারব।`,
        `শিক্ষক পাঠ থেকে মৌখিক প্রশ্ন করলে আমি তাৎক্ষণিকভাবে সঠিক উত্তর নিজের ভাষায় বলতে পারব।`,
        `আমি সুন্নাহ পদ্ধতি অনুসরণ করে সঠিক আমল প্রদর্শন করতে পারব।`
      ];
    } else if (isSubjectEnglish) {
      newObjective = `• Students will be able to recognize and pronounce target vocabulary for "${top}" accurately.\n• Students will understand the key message and answer comprehension questions in simple English.`;
      newCriteria = [
        `I can pronounce and spell the target words accurately in English.`,
        `I can use the new words in simple sentences to express my thoughts.`,
        `I can answer teacher's comprehension questions with confidence.`
      ];
    } else {
      newObjective = `• পাঠ শেষে শিক্ষার্থীরা "${top}"-এর মূল বিষয়বস্তু ও ধারণা স্পষ্টভাবে অনুধাবন করতে পারবে।\n• পাঠ থেকে অর্জিত জ্ঞান নিজের ভাষায় ব্যাখ্যা করতে পারবে।\n• দৈনন্দিন জীবনের সাথে এই বিষয়ের সম্পর্ক ও গুরুত্ব অনুধাবন করতে পারবে।`;
      newCriteria = [
        `আমি "${top}" পাঠের মূল বিষয়বস্তু নিজের ভাষায় গুছিয়ে বলতে পারব।`,
        `আমি পাঠের মূল প্রশ্নগুলোর সঠিক ও স্পষ্ট উত্তর দিতে পারব।`,
        `শিক্ষক ক্লাসে যাচাইমূলক প্রশ্ন করলে আমি সক্রিয়ভাবে অংশগ্রহণ করতে পারব।`
      ];
    }

    // Clean up materials
    const cleanedMaterials = plan.materials
      .replace(/,?\s*ডিজিটাল কুইজ সফটওয়্যার/gi, '')
      .replace(/,?\s*ডিজিটাল কুইজ/gi, '')
      .replace(/,?\s*এক্সিট টিকিট/gi, '')
      .replace(/,?\s*লাইভ লিডারবোর্ড/gi, '');

    // Clean up procedures (especially Stage 5 review)
    const cleanedProcedures = plan.procedures.map((p, pIdx) => {
      let title = p.activityTitle;
      let points = [...p.procedurePoints];
      let cDo = p.childrenDo;
      let tDoes = p.teacherDoes;

      if (pIdx === plan.procedures.length - 1 || title.toLowerCase().includes('review') || title.includes('পর্যালোচনা') || title.includes('মূল্যায়ন')) {
        title = isAr ? 'مراجعة الدرس وتقييم الفهم' : 'পাঠ পর্যালোচনা ও মূল্যায়ন (Review & Wrap-up)';
        points = [
          'শিক্ষক ক্লাসের শিক্ষার্থীদের আজকের পাঠের মূল বিষয়বস্তু থেকে সরাসরি বয়স ও বিষয়োপযোগী প্রশ্ন করে শিখন যাচাই করবেন।',
          'শিক্ষার্থীরা স্বতঃস্ফূর্তভাবে হাত তুলে প্রশ্নের উত্তর দেবে এবং আজকের ক্লাসের মূল শিক্ষা নিজের ভাষায় বলবে।',
          'শিক্ষক সামগ্রিক বোঝাপড়া যাচাই করে ইতিবাচক প্রশংসা ও উৎসাহ দেবেন এবং সুন্দর শিষ্টাচারের সাথে পাঠ সমাপ্ত করবেন।'
        ];
        cDo = 'প্রশ্নের উত্তর দেয়, মূল বিষয়বস্তু মুখে মুখে পুনরাবৃত্তি করে এবং সক্রিয়ভাবে পাঠের সমাপ্তিতে অংশ নেয়।';
        tDoes = 'সংক্ষেপে পুরো পাঠের সারসংক্ষেপ টেনে দেন, শিক্ষার্থীদের সক্রিয় অংশগ্রহণের আন্তরিক প্রশংসা করেন ও দোয়া করেন।';
      }

      // Remove exit ticket or digital quiz from points
      points = points.filter(pt => !/(এক্সিট টিকিট|ডিজিটাল কুইজ|লাইভ লিডারবোর্ড|exit ticket)/i.test(pt));
      if (points.length === 0) {
        points = ['শিক্ষক আজকের পাঠের মূল শিক্ষা শিক্ষার্থীদের মুখে মুখে যাচাই করবেন।'];
      }

      return {
        ...p,
        activityTitle: title,
        procedurePoints: points,
        childrenDo: cDo,
        teacherDoes: tDoes
      };
    });

    setPlan({
      ...plan,
      materials: cleanedMaterials,
      learningObjective: newObjective,
      successCriteria: newCriteria,
      procedures: cleanedProcedures
    });

    showToast('বয়স ও বিষয় অনুযায়ী মূল্যায়ন এবং শিখনফল সফলভাবে সমন্বয় করা হয়েছে!');
  };
  // Partition procedures for strict 3-page layout
  const getPageProcedures = () => {
    const procs = plan.procedures;
    if (procs.length <= 3) {
      return {
        p1: procs.slice(0, 1),
        p2: procs.slice(1, 2),
        p3: procs.slice(2)
      };
    }
    if (procs.length === 4) {
      return {
        p1: procs.slice(0, 2),
        p2: procs.slice(2, 3),
        p3: procs.slice(3)
      };
    }
    return {
      p1: procs.slice(0, 2),
      p2: procs.slice(2, 4),
      p3: procs.slice(4)
    };
  };

  const renderTableHeader = () => (
    <thead>
      <tr className="border-b border-black bg-[#22c55e] text-slate-950 print:bg-[#22c55e]">
        <th className={`p-2.5 ${isAr ? 'border-l' : 'border-r'} border-black text-inherit font-black text-left w-[20%]`}>
          {labels.stagesTimeHeader}
        </th>
        <th className={`p-2.5 ${isAr ? 'border-l' : 'border-r'} border-black text-inherit font-black text-left w-[58%]`}>
          {labels.procedureHeader}
        </th>
        <th className={`p-2.5 ${isAr ? 'border-l' : 'border-r'} border-black text-center font-black w-[10%]`}>
          {labels.intHeader}
        </th>
        <th className="p-2.5 text-center font-black w-[12%]">
          {labels.aidsHeader}
        </th>
      </tr>
    </thead>
  );

  const renderProcedureRow = (step: LessonProcedureStep, idx: number) => (
    <tr key={idx} className="border-b border-black last:border-b-0">
      {/* Column 1: Stages/Time */}
      <td className={`p-2.5 ${isAr ? 'border-l' : 'border-r'} border-black align-top font-bold text-[13px] bg-white`}>
        {isEditing ? (
          <textarea
            value={step.stageAndTime}
            onChange={(e) => handleUpdateProcedure(idx, 'stageAndTime', e.target.value)}
            rows={2}
            className="w-full bg-amber-50 border border-amber-300 p-1 rounded text-xs font-bold"
          />
        ) : (
          <div className="space-y-0.5">
            {step.stageAndTime.split('\n').map((line, lIdx) => (
              <div key={lIdx} className={lIdx === 0 ? 'font-bold text-slate-900' : 'font-normal italic text-slate-700 text-xs'}>
                {line}
              </div>
            ))}
          </div>
        )}
      </td>

      {/* Column 2: Procedure (Activity Title, Bullets, Children do, Teacher does) */}
      <td className={`p-2.5 ${isAr ? 'border-l' : 'border-r'} border-black align-top space-y-1.5 bg-white text-[13px]`}>
        {isEditing ? (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block">{labels.activityTitleLabel}</label>
              <input
                type="text"
                value={step.activityTitle}
                onChange={(e) => handleUpdateProcedure(idx, 'activityTitle', e.target.value)}
                className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs font-bold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600">{labels.bulletPointsLabel}</label>
                <button
                  type="button"
                  onClick={() => handleAddProcedurePoint(idx)}
                  className="text-[10px] text-teal-700 font-bold hover:underline"
                >
                  {labels.addPoint}
                </button>
              </div>
              {step.procedurePoints.map((pt, pIdx) => (
                <div key={pIdx} className="flex items-center gap-1 mb-1">
                  <input
                    type="text"
                    value={pt}
                    onChange={(e) => {
                      const updatedPts = [...step.procedurePoints];
                      updatedPts[pIdx] = e.target.value;
                      handleUpdateProcedure(idx, 'procedurePoints', updatedPts);
                    }}
                    className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                  />
                  <button
                    onClick={() => handleRemoveProcedurePoint(idx, pIdx)}
                    className="text-rose-600 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block">{labels.childrenDoLabel}</label>
                <input
                  type="text"
                  value={step.childrenDo}
                  onChange={(e) => handleUpdateProcedure(idx, 'childrenDo', e.target.value)}
                  className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block">{labels.teacherDoesLabel}</label>
                <input
                  type="text"
                  value={step.teacherDoes}
                  onChange={(e) => handleUpdateProcedure(idx, 'teacherDoes', e.target.value)}
                  className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                />
              </div>
            </div>

            <div className="pt-1 text-right">
              <button
                onClick={() => handleRemoveProcedureRow(idx)}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                {labels.deleteStep}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Activity title */}
            <div className="font-bold text-slate-950 mb-1">
              {step.activityTitle.startsWith('Activity:') || step.activityTitle.startsWith('النشاط:') || step.activityTitle.startsWith('نشاط:')
                ? step.activityTitle 
                : (isAr ? `النشاط: ${step.activityTitle}` : `Activity: ${step.activityTitle}`)}
            </div>

            {/* Bullet instructions with intelligent subheading support */}
            <div className="space-y-1 text-slate-900 leading-snug">
              {step.procedurePoints.map((p, pIdx) => {
                const trimmed = p.trim();
                const isHeading = /^(শিক্ষকের কাজ:|শিক্ষকের প্রশ্ন:|শিক্ষার্থীদের কার্যক্রম:|শিক্ষার্থীদের কাজ:|অনুশীলন:|কার্যক্রম \d+:|প্রশ্ন:|Activity|Teacher Does:|Teacher's Questions:|Students Do:|Questions:)/i.test(trimmed);
                if (isHeading) {
                  return (
                    <div key={pIdx} className="font-bold text-slate-950 mt-2 first:mt-0 text-[12.5px] border-b border-slate-100 pb-0.5">
                      {trimmed}
                    </div>
                  );
                }
                return (
                  <div key={pIdx} className={`flex items-start gap-1.5 ${isAr ? 'pr-2.5' : 'pl-2.5'} text-[12.5px]`}>
                    <span className="text-slate-900 font-bold shrink-0">•</span>
                    <span className="whitespace-pre-line">{trimmed.replace(/^[•\-\*]\s*/, '')}</span>
                  </div>
                );
              })}
            </div>

            {/* Children do & Teacher does */}
            <div className="mt-1.5 pt-1 space-y-0.5 text-[12.5px]">
              <div>
                <span className="font-bold">{labels.childrenDoLabel}</span> {step.childrenDo}
              </div>
              <div>
                <span className="font-bold">{labels.teacherDoesLabel}</span> {step.teacherDoes}
              </div>
            </div>
          </div>
        )}
      </td>

      {/* Column 3: Int (Interaction pattern) */}
      <td className={`p-2.5 ${isAr ? 'border-l' : 'border-r'} border-black align-top text-center font-bold text-[13px] bg-white`}>
        {isEditing ? (
          <textarea
            value={step.intPattern}
            onChange={(e) => handleUpdateProcedure(idx, 'intPattern', e.target.value)}
            rows={2}
            className="w-full bg-amber-50 border border-amber-300 p-1 rounded text-xs font-bold text-center"
          />
        ) : (
          <div className="space-y-0.5 font-bold">
            {step.intPattern.split('\n').map((code, cIdx) => (
              <div key={cIdx}>{code}</div>
            ))}
          </div>
        )}
      </td>

      {/* Column 4: Aids */}
      <td className="p-2.5 align-top text-center text-[13px] bg-white">
        {isEditing ? (
          <textarea
            value={step.aids}
            onChange={(e) => handleUpdateProcedure(idx, 'aids', e.target.value)}
            rows={2}
            className="w-full bg-amber-50 border border-amber-300 p-1 rounded text-xs text-center"
          />
        ) : (
          <div className="space-y-0.5">
            {step.aids.split('\n').map((item, iIdx) => (
              <div key={iIdx} className="font-medium text-slate-900">{item}</div>
            ))}
          </div>
        )}
      </td>
    </tr>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-5 duration-300 border border-teal-700">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-black border border-teal-200/60 dark:border-teal-900/60">
            LP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isAr ? 'خطة الدرس الرسمية (نموذج معتمد)' : 'অফিসিয়াল লেসন প্ল্যান টেমপ্লেট (100% Match)'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                100% Copy-to-Copy
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'الهيكل البيداغوجي المعتمد لمدرسة السنة' : 'মাদরাসাতুস সুন্নাহ নির্ধারিত মানসম্মত পেডাগোজিক্যাল কাঠামো'}
            </p>
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Explicit Language & Direction Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2">
              ভাষা / Direction:
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveLangOverride('bn');
                setFontMode('kalpurush');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isBn
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="বাংলা লেআউট (বাম থেকে ডানে - LTR)"
            >
              🇧🇩 বাংলা (LTR)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLangOverride('en');
                setFontMode('times');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                !isBn && !isAr
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="English layout (Left to Right - LTR)"
            >
              🇬🇧 English (LTR)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLangOverride('ar');
                setFontMode('amiri');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isAr
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="عربي (من اليمين لليسار - RTL)"
            >
              🇸🇦 العربية (RTL)
            </button>
          </div>

          {/* Font Selector / Indicator */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
              <Type className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              ফন্ট:
            </span>
            <button
              type="button"
              onClick={() => setFontMode('amiri')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                fontMode === 'amiri' || (fontMode === 'auto' && isAr)
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="الأميري (عربي)"
            >
              الأميري
            </button>
            <button
              type="button"
              onClick={() => setFontMode('kalpurush')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                fontMode === 'kalpurush' || (fontMode === 'auto' && isBn)
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="কালপুরুষ ফন্ট (বাংলা)"
            >
              কালপুরুষ
            </button>
            <button
              type="button"
              onClick={() => setFontMode('times')}
              className={`px-2 py-1 rounded-lg text-xs font-serif font-bold transition-all ${
                fontMode === 'times' || (fontMode === 'auto' && !isBn && !isAr)
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Times New Roman (English)"
            >
              Times New Roman
            </button>
          </div>

          {/* Plan Size / Length Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
              <FileText className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              আকার:
            </span>
            <button
              type="button"
              onClick={() => handleLengthChange('compact')}
              disabled={isRegenerating}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewPlanLength === 'compact'
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="সংক্ষিপ্ত রূপরেখা (১-২ পৃষ্ঠা)"
            >
              সংক্ষিপ্ত (১-২ পৃ.)
            </button>
            <button
              type="button"
              onClick={() => handleLengthChange('standard_3page')}
              disabled={isRegenerating}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewPlanLength === 'standard_3page'
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="মাদরাসাতুস সুন্নাহ নির্ধারিত অফিসিয়াল মাত্র ৩ পৃষ্ঠার লেসন প্ল্যান"
            >
              মাত্র ৩ পৃষ্ঠা ★
            </button>
            <button
              type="button"
              onClick={() => handleLengthChange('extended')}
              disabled={isRegenerating}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewPlanLength === 'extended'
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="বড় ও পূর্ণাঙ্গ বিস্তারিত রূপরেখা (৪ পৃষ্ঠা)"
            >
              বড় / বিস্তারিত
            </button>
          </div>

          {/* Quick AI Size Generator Buttons */}
          {onRegenerateWithLength && (
            <div className="flex items-center gap-1">
              {viewPlanLength !== 'compact' && (
                <button
                  type="button"
                  onClick={() => {
                    showToast('সংক্ষিপ্ত ১-২ পৃষ্ঠার লেসন প্ল্যান প্রস্তুত করা হচ্ছে...');
                    handleLengthChange('compact', true);
                  }}
                  disabled={isRegenerating}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                  title="AI দিয়ে আরও সংক্ষিপ্ত লেসন প্ল্যান বানিয়ে নিন"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>⚡ আরো সংক্ষিপ্ত</span>
                </button>
              )}

              {viewPlanLength !== 'standard_3page' && (
                <button
                  type="button"
                  onClick={() => {
                    showToast('আদর্শ মাত্র ৩ পৃষ্ঠার লেসন প্ল্যান প্রস্তুত করা হচ্ছে...');
                    handleLengthChange('standard_3page', true);
                  }}
                  disabled={isRegenerating}
                  className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                  title="AI দিয়ে অফিসিয়াল মাত্র ৩ পৃষ্ঠার লেসন প্ল্যান বানিয়ে নিন"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>📄 মাত্র ৩ পৃষ্ঠা</span>
                </button>
              )}

              {viewPlanLength !== 'extended' && (
                <button
                  type="button"
                  onClick={() => {
                    showToast('বড় ও বিস্তারিত লেসন প্ল্যান প্রস্তুত করা হচ্ছে...');
                    handleLengthChange('extended', true);
                  }}
                  disabled={isRegenerating}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                  title="AI দিয়ে আরও বড় ও বিস্তারিত লেসন প্ল্যান বানিয়ে নিন"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>🔍 আরো বড়/বিস্তারিত</span>
                </button>
              )}
            </div>
          )}

          {/* Toggle Edit Mode */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isEditing 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm' 
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? (isAr ? 'حفظ التعديل' : 'সম্পাদনা সম্পন্ন') : (isAr ? '✏️ تعديل وتخصيص' : '✏️ কাস্টমাইজ করুন')}</span>
          </button>

          {/* Smart Activity Suite Toggle Button */}
          <button
            type="button"
            onClick={() => setShowActivitySuite(!showActivitySuite)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showActivitySuite
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
            title="বাচ্চার বয়স ও টপিক অনুযায়ী আকর্ষণীয় খেলা ও যাচাইমূলক অ্যাক্টিভিটি যোগ করুন"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{showActivitySuite ? 'লাইব্রেরি বন্ধ' : '✨ স্মার্ট অ্যাক্টিভিটি'}</span>
          </button>

          {/* Download Word Document */}
          <button
            onClick={handleDownloadDoc}
            className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="মাইক্রোসফট ওয়ার্ড (.doc) ফাইল হিসেবে ডাউনলোড করুন"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Word {isAr ? 'تحميل' : 'ডাউনলোড'}</span>
          </button>

          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'طباعة / PDF' : 'প্রিন্ট / PDF'}</span>
          </button>

          {/* Copy Text */}
          <button
            onClick={handleCopyText}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isAr ? 'تم النسخ' : 'কপি হয়েছে') : (isAr ? 'نسخ' : 'কপি')}</span>
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              title="পুনরায় জেনারেট করুন"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={onReset}
            className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-all"
          >
            {isAr ? '+ جديد' : '+ নতুন'}
          </button>
        </div>
      </div>

      {/* Official Master Plans Quick Switcher */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-950/60 dark:via-slate-900/60 dark:to-emerald-950/60 border border-teal-200 dark:border-teal-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5 print:hidden text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-teal-600 text-white rounded-lg">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'خطط الدرس النموذجية الرسمية لمادراسَاتُس سُنَّة:' : 'মাদরাসাতুস সুন্নাহ আনুষ্ঠানিক শ্রেণি পর্যবেক্ষণ মাস্টার প্ল্যান:'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {ALL_GRADE_SAMPLE_PLANS.map((item) => {
            const isSelected = plan.className.includes(item.gradeTitle) || plan.topic.includes(item.topicTitle.split(' ')[0]);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPlan(item.plan);
                  showToast(`${item.gradeTitle} মাস্টার প্ল্যান লোড হয়েছে!`);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all border cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title={`${item.gradeTitle}: ${item.topicTitle}`}
              >
                <span>{item.gradeBadge}</span>
                <span className="text-[11px] font-medium opacity-90 hidden sm:inline">({item.topicTitle.split('(')[0].trim()})</span>
              </button>
            );
          })}
        </div>
      </div>
      {showActivitySuite && (
        <div className="my-4 print:hidden animate-in fade-in duration-300">
          <SmartActivitySuite
            gradeLevel={plan.className}
            topicTitle={plan.topic}
            subject={plan.subject}
            language={effectiveLang}
            onAddActivity={(newStep) => {
              setPlan(prev => ({
                ...prev,
                procedures: [...prev.procedures, newStep]
              }));
              showToast(isAr ? 'تمت إضافة النشاط بنجاح إلى خطة الدرس!' : 'অ্যাক্টিভিটিটি সফলভাবে লেসন প্ল্যানে যুক্ত হয়েছে!');
            }}
          />
        </div>
      )}

      {isEditing && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 print:hidden">
          <span>
            💡 <strong>{isAr ? 'وضع التعديل مفعل:' : 'কাস্টমাইজ মোড সক্রিয়:'}</strong> {isAr ? 'يمكنك تعديل أي نص أو مرحلة مباشرة بالنقر عليها.' : 'নিচের প্রতিটি ঘরে সরাসরি ক্লিক করে টেক্সট, নাম, সময় বা কার্যক্রম পরিবর্তন করতে পারেন। কাজ শেষে ‘সম্পাদনা সম্পন্ন’ বাটন চাপুন।'}
          </span>
          <button
            onClick={handleAddProcedureRow}
            className="px-2.5 py-1 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-lg font-bold flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3 h-3" />
            {isAr ? '+ إضافة مرحلة جديدة' : '+ নতুন ধাপ যোগ'}
          </button>
        </div>
      )}

      {/* Subject & Age Congruence Alert / One-click Alignment */}
      {(hasMismatchedEnglishGoal || hasUnwantedQuizOrExitTicket) && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-100 shadow-sm print:hidden animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200 dark:bg-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                <span>বিষয় ও বয়সের সাথে মূল্যায়ন সমন্বয় প্রয়োজন</span>
                <span className="text-[10px] font-bold bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-full">
                  সতর্কবার্তা
                </span>
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                {hasMismatchedEnglishGoal 
                  ? `${plan.subject} (${plan.className}) পাঠে বেমানান ইংরেজি/বিদেশি ভাষা বলার লক্ষ্য বা মূল্যায়ন পাওয়া গেছে।`
                  : 'অপ্রয়োজনীয় ডিজিটাল কুইজ বা এক্সিট টিকিট পাওয়া গেছে।'} 
                {' '}শিশুর বয়স ও বিষয়ের আসল দক্ষতার সাথে মিল রেখে নিখুঁত প্রমিত মূল্যায়ন সাজিয়ে নিন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={applyAgeAndSubjectCongruence}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>✨ বয়স ও বিষয় অনুযায়ী ঠিক করুন</span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 100% COPY-TO-COPY EXACT LESSON PLAN TEMPLATE CONTAINER */}
      {/* ============================================================ */}
      <div 
        ref={printableRef}
        id="lesson-plan-printable-sheet"
        dir={isAr ? 'rtl' : 'ltr'}
        className={`bg-white text-black p-6 sm:p-10 border border-slate-300 rounded-xl shadow-md text-sm print:p-0 print:border-none print:shadow-none print:m-0 ${isAr ? 'font-amiri arabic-doc' : (isBn ? 'font-kalpurush bengali-doc' : 'font-times english-doc')}`}
        style={{ fontFamily: currentFontFamily, direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left' }}
      >
        {/* Top Header Running Line (as seen in official Madrasatus Sunnah formal observation) */}
        <div className="text-[11px] font-bold text-slate-800 pb-1 border-b border-slate-300 mb-3 flex items-center justify-between">
          <span>{plan.observationTitle ? `${plan.observationTitle} — Lesson Plan` : 'Formal Observation (02) — Lesson Plan'}</span>
          <span className="text-[10px] text-slate-500 font-normal">{plan.institutionName || 'মাদরাসাতুস সুন্নাহ'}</span>
        </div>

        {/* Centered Crest, Madrasah Name, and Formal Observation Title */}
        <div className="flex flex-col items-center justify-center text-center pb-4 pt-1">
          <div className="flex flex-col items-center gap-1 mb-1">
            <MadrasahLogo size="sm" showText={false} variant="crest" allowUpload={true} />
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-teal-800 tracking-tight">مادراسَاتُس سُنَّة</span>
              <span className="text-[11px] font-extrabold text-teal-900 tracking-tight">মাদরাসাতুস সুন্নাহ</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-black tracking-tight text-slate-950 mt-1">
            {labels.docTitle}
          </h1>

          <div className="text-base font-bold text-slate-800 tracking-tight mt-0.5">
            {isEditing ? (
              <input
                type="text"
                value={plan.observationTitle || 'Formal Observation-02'}
                onChange={(e) => setPlan({ ...plan, observationTitle: e.target.value })}
                className="bg-amber-50 border border-amber-300 px-2 py-0.5 rounded text-xs text-center font-bold"
              />
            ) : (
              <span>{plan.observationTitle || 'Formal Observation-02'}</span>
            )}
          </div>
        </div>

        {/* 1. Metadata Grid Table (Top Box) */}
        <div className="border border-black overflow-hidden mb-0">
          <table className="w-full border-collapse text-[13px]" dir={isAr ? 'rtl' : 'ltr'}>
            <tbody>
              {/* Row 1: Class & Topic */}
              <tr className="border-b border-black">
                <td className={`w-1/2 p-2 ${isAr ? 'border-l' : 'border-r'} border-black align-top bg-white`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold shrink-0">{labels.classLabel}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={plan.className} 
                        onChange={(e) => setPlan({ ...plan, className: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                      />
                    ) : (
                      <span>{plan.className}</span>
                    )}
                  </div>
                </td>
                <td className="w-1/2 p-2 align-top bg-white">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold shrink-0">{labels.topicLabel}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={plan.topic} 
                        onChange={(e) => setPlan({ ...plan, topic: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs font-semibold"
                      />
                    ) : (
                      <span className="font-medium">{plan.topic}</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 2: Subject & Teacher's name */}
              <tr className="border-b border-black">
                <td className={`w-1/2 p-2 ${isAr ? 'border-l' : 'border-r'} border-black align-top bg-white`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold shrink-0">{labels.subjectLabel}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={plan.subject} 
                        onChange={(e) => setPlan({ ...plan, subject: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                      />
                    ) : (
                      <span>{plan.subject}</span>
                    )}
                  </div>
                </td>
                <td className="w-1/2 p-2 align-top bg-white">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold shrink-0">{labels.teacherLabel}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={plan.teacherName || ''} 
                        onChange={(e) => setPlan({ ...plan, teacherName: e.target.value })}
                        placeholder="শিক্ষকের নাম (ঐচ্ছিক)"
                        className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                      />
                    ) : (
                      (plan.teacherName && plan.teacherName.trim()) ? (
                        <span>{plan.teacherName}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-xs text-slate-400 hover:text-teal-700 italic flex items-center gap-1 group print:hidden transition-colors cursor-pointer"
                          title="শিক্ষকের নাম যুক্ত করতে ক্লিক করুন"
                        >
                          <span>(নাম যুক্ত করতে ক্লিক করুন)</span>
                          <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 3: Duration & Materials */}
              <tr className="border-b border-black">
                <td className={`w-1/2 p-2 ${isAr ? 'border-l' : 'border-r'} border-black align-top bg-white`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold shrink-0">{labels.durationLabel}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={plan.duration} 
                        onChange={(e) => setPlan({ ...plan, duration: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                      />
                    ) : (
                      <span>{plan.duration}</span>
                    )}
                  </div>
                </td>
                <td className="w-1/2 p-2 align-top bg-white">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold shrink-0">{labels.materialsLabel}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={plan.materials} 
                        onChange={(e) => setPlan({ ...plan, materials: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                      />
                    ) : (
                      <span>{plan.materials}</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 4: Date & Time (Official Madrasatus Sunnah format) */}
              <tr className="border-b border-black">
                <td className={`w-1/2 p-2 ${isAr ? 'border-l' : 'border-r'} border-black align-top bg-white`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold shrink-0">{isAr ? 'التاريخ:' : 'Date:'}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={plan.date || ''} 
                        placeholder="25-10-2026"
                        onChange={(e) => setPlan({ ...plan, date: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                      />
                    ) : (
                      <span>{plan.date || '25-10-2026'}</span>
                    )}
                  </div>
                </td>
                <td className="w-1/2 p-2 align-top bg-white">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold shrink-0">{isAr ? 'الوقت:' : 'Time:'}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={plan.time || ''} 
                        placeholder="10:20-11:00 am"
                        onChange={(e) => setPlan({ ...plan, time: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                      />
                    ) : (
                      <span>{plan.time || '10:20-11:00 am'}</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 5: Learning Objective */}
              <tr className="border-b border-black">
                <td className={`w-[22%] p-2.5 ${isAr ? 'border-l' : 'border-r'} border-black align-top bg-white font-bold text-[13px] whitespace-pre-line`}>
                  {labels.learningObjectiveLabel}
                </td>
                <td className="w-[78%] p-2.5 align-top bg-white text-[13px]">
                  {isEditing ? (
                    <textarea
                      value={plan.learningObjective}
                      onChange={(e) => setPlan({ ...plan, learningObjective: e.target.value })}
                      rows={2}
                      className="w-full bg-amber-50 border border-amber-300 p-1.5 rounded text-xs font-medium"
                    />
                  ) : (
                    <div className="space-y-1 leading-relaxed">
                      {plan.learningObjective.split('\n').filter(l => l.trim()).map((line, lIdx) => (
                        <div key={lIdx} className="flex items-start gap-1.5">
                          <span className="text-slate-900 font-bold shrink-0">•</span>
                          <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>

              {/* Row 5: Success criteria */}
              <tr>
                <td className={`w-[22%] p-2.5 ${isAr ? 'border-l' : 'border-r'} border-black align-top bg-white font-bold text-[13px] whitespace-pre-line`}>
                  <div className="flex flex-col gap-1.5">
                    <span>{labels.successCriteriaLabel}</span>
                    <button
                      type="button"
                      onClick={applyAgeAndSubjectCongruence}
                      className="text-[10px] text-teal-800 dark:text-teal-300 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 font-bold flex items-center gap-1 transition-all print:hidden self-start"
                      title="বয়স ও বিষয় অনুপাতে আদর্শ মূল্যায়ন সেট করুন"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                      <span>{isAr ? 'معايير ملائمة' : 'বয়স ও বিষয়োপযোগী'}</span>
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleAddSuccessCriteria}
                        className="text-[11px] text-teal-700 hover:underline font-bold self-start print:hidden"
                      >
                        {labels.addCriteria}
                      </button>
                    )}
                  </div>
                </td>
                <td className="w-[78%] p-2.5 align-top bg-white text-[13px]">
                  <div className="space-y-1.5">
                    {plan.successCriteria.map((crit, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 leading-snug">
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full">
                            <input 
                              type="text" 
                              value={crit} 
                              onChange={(e) => {
                                const updated = [...plan.successCriteria];
                                updated[idx] = e.target.value;
                                setPlan({ ...plan, successCriteria: updated });
                              }}
                              className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                            />
                            <button 
                              onClick={() => handleRemoveSuccessCriteria(idx)}
                              className="text-rose-600 p-1 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-1.5">
                            <span className="text-slate-900 font-bold shrink-0">•</span>
                            <span>{crit.replace(/^[•\-\*]\s*/, '')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ============================================================ */}
        {/* PROCEDURE TABLE RENDERING: 3-PAGE STANDARD VS CONTINUOUS */}
        {/* ============================================================ */}
        {viewPlanLength === 'standard_3page' ? (
          <>
            {/* ----------------- PAGE 1: Follow Up & Lead-in ----------------- */}
            <h2 className="text-inherit font-bold text-base sm:text-lg pt-5 pb-2 text-slate-950 flex items-center justify-between">
              <span>{labels.procedureSectionTitle} (অংশ ১ — প্রস্তুতি ও উদ্দেশ্য ঘোষণা)</span>
              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 print:hidden">
                📄 পৃষ্ঠা ১ / ৩
              </span>
            </h2>

            <div className="border border-black overflow-hidden mb-2">
              <table className="w-full border-collapse text-[13px]" dir={isAr ? 'rtl' : 'ltr'}>
                {renderTableHeader()}
                <tbody>
                  {getPageProcedures().p1.map(step => renderProcedureRow(step, plan.procedures.indexOf(step)))}
                </tbody>
              </table>
            </div>

            {/* Page 1 Footer */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-200 mt-3 print:pt-1">
              <span>{plan.institutionName || 'মাদরাসাতুস সুন্নাহ'} — {plan.observationTitle || 'Formal Observation (02)'}</span>
              <span className="font-bold text-teal-800">পৃষ্ঠা ১ / ৩</span>
            </div>

            {/* Page 1 to Page 2 Print Page Break */}
            <div className="print-page-break my-6 py-2 border-y-2 border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30 text-center text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center justify-center gap-2 print:border-none print:py-0 print:my-0 print:h-0 print:text-transparent screen-only-divider">
              <span>📄 পৃষ্ঠা ১ সমাপ্ত</span>
              <span className="text-slate-400">|</span>
              <span>পৃষ্ঠা ২-এ চলমান (মূল পাঠদান ও দলীয় অনুশীলন) ⤵</span>
            </div>

            {/* ----------------- PAGE 2: Main Activity & Practice ----------------- */}
            <div className="text-[11px] font-bold text-slate-800 pb-1 border-b border-slate-300 mb-2 flex items-center justify-between pt-2">
              <span>{plan.observationTitle ? `${plan.observationTitle} — Lesson Plan (চলমান)` : 'Formal Observation (02) — Lesson Plan (চলমান)'}</span>
              <span className="text-[10px] text-slate-500 font-normal">{plan.institutionName || 'মাদরাসাতুস সুন্নাহ'}</span>
            </div>

            <h2 className="text-inherit font-bold text-base sm:text-lg pb-2 text-slate-950 flex items-center justify-between">
              <span>{labels.procedureSectionTitle} (চলমান — মূল পাঠদান ও দলীয় অনুশীলন)</span>
              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 print:hidden">
                📄 পৃষ্ঠা ২ / ৩
              </span>
            </h2>

            <div className="border border-black overflow-hidden mb-2">
              <table className="w-full border-collapse text-[13px]" dir={isAr ? 'rtl' : 'ltr'}>
                {renderTableHeader()}
                <tbody>
                  {getPageProcedures().p2.map(step => renderProcedureRow(step, plan.procedures.indexOf(step)))}
                </tbody>
              </table>
            </div>

            {/* Page 2 Footer */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-200 mt-3 print:pt-1">
              <span>{plan.institutionName || 'মাদরাসাতুস সুন্নাহ'} — {plan.subject} ({plan.className})</span>
              <span className="font-bold text-teal-800">পৃষ্ঠা ২ / ৩</span>
            </div>

            {/* Page 2 to Page 3 Print Page Break */}
            <div className="print-page-break my-6 py-2 border-y-2 border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30 text-center text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center justify-center gap-2 print:border-none print:py-0 print:my-0 print:h-0 print:text-transparent screen-only-divider">
              <span>📄 পৃষ্ঠা ২ সমাপ্ত</span>
              <span className="text-slate-400">|</span>
              <span>সমাপনী পাতা ৩-এ চলমান (পাঠ পর্যালোচনা, সংকেত ও শিক্ষকের নোট) ⤵</span>
            </div>

            {/* ----------------- PAGE 3: Review & Summary ----------------- */}
            <div className="text-[11px] font-bold text-slate-800 pb-1 border-b border-slate-300 mb-2 flex items-center justify-between pt-2">
              <span>{plan.observationTitle ? `${plan.observationTitle} — Lesson Plan (সমাপনী ও মূল্যায়ন)` : 'Formal Observation (02) — Lesson Plan (সমাপনী ও মূল্যায়ন)'}</span>
              <span className="text-[10px] text-slate-500 font-normal">{plan.institutionName || 'মাদরাসাতুস সুন্নাহ'}</span>
            </div>

            <h2 className="text-inherit font-bold text-base sm:text-lg pb-2 text-slate-950 flex items-center justify-between">
              <span>{labels.procedureSectionTitle} (সমাপ্তি — পাঠ পর্যালোচনা ও মূল্যায়ন)</span>
              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 print:hidden">
                📄 পৃষ্ঠা ৩ / ৩
              </span>
            </h2>

            <div className="border border-black overflow-hidden mb-6">
              <table className="w-full border-collapse text-[13px]" dir={isAr ? 'rtl' : 'ltr'}>
                {renderTableHeader()}
                <tbody>
                  {getPageProcedures().p3.map(step => renderProcedureRow(step, plan.procedures.indexOf(step)))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* Continuous / Compact / Extended Mode: Single Table */}
            <h2 className="text-inherit font-bold text-base sm:text-lg pt-6 pb-2 text-slate-950 flex items-center justify-between">
              <span>{labels.procedureSectionTitle}</span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 print:hidden">
                {viewPlanLength === 'compact' ? '📄 সংক্ষিপ্ত ১-২ পৃষ্ঠা' : '📄 বড় ও বিস্তারিত রূপরেখা'}
              </span>
            </h2>

            <div className="border border-black overflow-hidden mb-6">
              <table className="w-full border-collapse text-[13px]" dir={isAr ? 'rtl' : 'ltr'}>
                {renderTableHeader()}
                <tbody>
                  {plan.procedures.map((step, idx) => renderProcedureRow(step, idx))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* 3. Key to Symbols Table (Bottom Legend Box) */}
        <div className="space-y-1.5 break-inside-avoid">
          <div className="font-bold text-[13px] text-slate-900">
            {labels.keyToSymbolsTitle}
          </div>

          <div className="w-full sm:w-[65%] border border-black overflow-hidden">
            <table className="w-full border-collapse text-[12px]" dir={isAr ? 'rtl' : 'ltr'}>
              <thead>
                <tr className="border-b border-black bg-white">
                  <th className={`p-1.5 px-2.5 ${isAr ? 'border-l' : 'border-r'} border-black text-inherit font-bold w-1/2`}>
                    {labels.intKeyHeader}
                  </th>
                  <th className="p-1.5 px-2.5 text-inherit font-bold w-1/2">
                    {labels.aidsKeyHeader}
                  </th>
                </tr>
              </thead>
              <tbody>
                {plan.symbolKeys.intKeys.map((k, i) => {
                  const aidKey = plan.symbolKeys.aidsKeys[i];
                  return (
                    <tr key={i} className="border-b border-black last:border-b-0">
                      <td className={`p-1 px-2.5 ${isAr ? 'border-l' : 'border-r'} border-black align-middle bg-white`}>
                        <span className="font-bold">{k.symbol}</span> = {k.meaning}
                      </td>
                      <td className="p-1 px-2.5 align-middle bg-white">
                        {aidKey ? (
                          <>
                            <span className="font-bold">{aidKey.symbol}</span> = {aidKey.meaning}
                          </>
                        ) : (
                          <span>&nbsp;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teacher's Note Box (Exact match from Madrasatus Sunnah official format) */}
        {(plan.teachersNote || isEditing) && (
          <div className="mt-5 p-3 rounded-lg border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-950/20 text-[12.5px] text-slate-900 leading-relaxed break-inside-avoid">
            <div className="flex items-baseline gap-1.5 font-bold text-amber-950 dark:text-amber-300">
              <span className="shrink-0">{labels.teachersNoteLabel}</span>
              {isEditing ? (
                <textarea
                  value={plan.teachersNote || ''}
                  onChange={(e) => setPlan({ ...plan, teachersNote: e.target.value })}
                  rows={2}
                  placeholder="যেমন: সালাতের মধ্যে ওযু ভেঙ্গে যাওয়া, কথা বলা, হাঁটাচলা করা... এই বিষয়টি পাঠের প্রতিটি ধাপে বারবার স্মরণ করিয়ে দেওয়া হবে।"
                  className="w-full bg-white dark:bg-slate-800 border border-amber-300 p-1.5 rounded text-xs font-medium text-slate-900 dark:text-slate-100 mt-1"
                />
              ) : (
                <span className="font-normal italic text-slate-800 dark:text-slate-200">
                  {plan.teachersNote}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Running Document Footer (from Madrasatus Sunnah format) */}
        <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-400 tracking-wide">
          <span>{plan.institutionName || 'মাদরাসাতুস সুন্নাহ'}</span>
          <span className="mx-2 text-slate-400">|</span>
          <span>{plan.subject} — {plan.className}</span>
        </div>

        {/* Signature lines for official classroom submission */}
        <div className="hidden print:grid grid-cols-2 gap-16 pt-14 text-xs font-bold text-black" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="border-t border-black pt-1.5 text-center">
            <span>{labels.teacherSig}</span>
          </div>
          <div className="border-t border-black pt-1.5 text-center">
            <span>{labels.supervisorSig}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
