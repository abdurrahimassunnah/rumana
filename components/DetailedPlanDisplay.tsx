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
  Type
} from 'lucide-react';
import { DetailedLessonPlan, LessonProcedureStep } from '../types';

interface DetailedPlanDisplayProps {
  plan: DetailedLessonPlan;
  onReset: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export const DetailedPlanDisplay: React.FC<DetailedPlanDisplayProps> = ({
  plan: initialPlan,
  onReset,
  onRegenerate,
  isRegenerating = false
}) => {
  // Normalize initial plan to ensure all properties exist
  const normalizePlan = (raw: any): DetailedLessonPlan => {
    const className = raw.className || raw.lessonProfile?.gradeLevel || 'KG';
    const topic = raw.topic || raw.lessonProfile?.topicTitle || raw.lessonProfile?.title || 'Colors (Red, Blue, Yellow)';
    const subject = raw.subject || raw.lessonProfile?.subject || 'English (Literacy)';
    const teacherName = raw.teacherName || 'Kabir Ustadh';
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
      className,
      topic,
      subject,
      teacherName,
      duration,
      materials,
      learningObjective,
      successCriteria,
      procedures,
      symbolKeys
    };
  };

  const [plan, setPlan] = useState<DetailedLessonPlan>(() => normalizePlan(initialPlan));
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeLangOverride, setActiveLangOverride] = useState<'auto' | 'ar' | 'bn' | 'en'>('auto');
  const [fontMode, setFontMode] = useState<'auto' | 'amiri' | 'kalpurush' | 'times'>('auto');
  const printableRef = useRef<HTMLDivElement>(null);

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
    docTitle: isAr ? 'خطة الدرس' : (isBn ? 'লেসন প্ল্যান (পাঠ পরিকল্পনা)' : 'Lesson Plan'),
    classLabel: isAr ? 'الصف:' : (isBn ? 'শ্রেণি:' : 'Class:'),
    topicLabel: isAr ? 'الموضوع:' : (isBn ? 'পাঠ / বিষয়:' : 'Topic:'),
    subjectLabel: isAr ? 'المادة:' : (isBn ? 'বিষয়:' : 'Subject:'),
    teacherLabel: isAr ? 'اسم المعلم:' : (isBn ? 'শিক্ষকের নাম:' : 'Teacher’s name:'),
    durationLabel: isAr ? 'المدة:' : (isBn ? 'সময় / ব্যাপ্তি:' : 'Duration:'),
    materialsLabel: isAr ? 'الوسائل التعليمية:' : (isBn ? 'প্রয়োজনীয় উপকরণ:' : 'Materials:'),
    learningObjectiveLabel: isAr ? 'الأهداف التعليمية:' : (isBn ? 'শিখনফল (Learning Objective):' : 'Learning Objective:'),
    successCriteriaLabel: isAr ? 'معايير النجاح: أنا أستطيع:' : (isBn ? 'সাফল্য নির্ণায়ক (Success Criteria): আমি পারি:' : 'Success criteria: I can:'),
    procedureSectionTitle: isAr ? 'خطوات سير الدرس' : (isBn ? 'পাঠ পরিচালনা প্রক্রিয়া ও কার্যক্রম (Lesson Procedure)' : 'Lesson Procedure'),
    stagesTimeHeader: isAr ? 'المرحلة / الزمن' : (isBn ? 'স্তর ও সময়' : 'Stages/Time'),
    procedureHeader: isAr ? 'الإجراءات والأنشطة التعليمية' : (isBn ? 'পাঠ পরিচালনা ও কার্যক্রম (Procedure)' : 'Procedure'),
    intHeader: isAr ? 'نمط التفاعل (Int)' : (isBn ? 'ইন্ট্যারাকশন (Int)' : 'Int'),
    aidsHeader: isAr ? 'الوسائل (Aids)' : (isBn ? 'টিচিং এইডস (Aids)' : 'Aids'),
    activityTitleLabel: isAr ? 'عنوان النشاط:' : (isBn ? 'কার্যক্রমের শিরোনাম:' : 'Activity Title:'),
    bulletPointsLabel: isAr ? 'خطوات النشاط:' : (isBn ? 'ধাপসমূহ:' : 'Bullet Points:'),
    childrenDoLabel: isAr ? 'نشاط الطلاب:' : (isBn ? 'শিক্ষার্থীরা যা করবে:' : 'Children do:'),
    teacherDoesLabel: isAr ? 'دور المعلم:' : (isBn ? 'শিক্ষকের ভূমিকা:' : 'Teacher does:'),
    keyToSymbolsTitle: isAr ? 'دليل الرموز والمصطلحات:' : (isBn ? 'সংকেত ও প্রতীক নির্দেশিকা (Key to symbols):' : 'Key to symbols:'),
    intKeyHeader: isAr ? 'نمط التفاعل (Int)' : (isBn ? 'ইন্ট্যারাকশন প্যাটার্ন (Int = interaction pattern)' : 'Int = interaction pattern'),
    aidsKeyHeader: isAr ? 'الوسائل التعليمية (Aids)' : (isBn ? 'টিচিং এইডস (Aids)' : 'Aids'),
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
      th { background-color: #f1f5f9 !important; font-weight: bold; }
      .bg-white { background: #ffffff !important; }
      .border-slate-800, .border-black { border-color: #000000 !important; }
      .text-black { color: #000000 !important; }
      .no-print, button, .lucide { display: none !important; }
      #lesson-plan-printable-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; }
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
    const procedureRowsHtml = plan.procedures.map(p => `
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

        <div class="section-title">${labels.procedureSectionTitle}</div>

        <!-- Procedure 4-column Table -->
        <table>
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #000; width: 22%; text-align: ${isAr ? 'right' : 'left'};">${labels.stagesTimeHeader}</th>
              <th style="border: 1px solid #000; width: 54%; text-align: ${isAr ? 'right' : 'left'};">${labels.procedureHeader}</th>
              <th style="border: 1px solid #000; width: 12%; text-align: center;">${labels.intHeader}</th>
              <th style="border: 1px solid #000; width: 12%; text-align: center;">${labels.aidsHeader}</th>
            </tr>
          </thead>
          <tbody>
            ${procedureRowsHtml}
          </tbody>
        </table>

        <!-- Key to Symbols Table -->
        <div style="margin-top: 10px; font-weight: bold; font-size: 13px;">${labels.keyToSymbolsTitle}</div>
        <table style="width: 70%; margin-top: 4px;">
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #000; width: 50%; text-align: ${isAr ? 'right' : 'left'}; font-size: 12px;">${labels.intKeyHeader}</th>
            <th style="border: 1px solid #000; width: 50%; text-align: ${isAr ? 'right' : 'left'}; font-size: 12px;">${labels.aidsKeyHeader}</th>
          </tr>
          ${symbolRowsHtml}
        </table>
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

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-5xl mx-auto">
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
        {/* Top Logo & Madrasah Crest on Left (Sample Exact Match) */}
        <div className={`flex flex-col ${isAr ? 'items-start' : 'items-start'} pb-2`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-11 h-11 rounded-lg border-2 border-teal-700 bg-white p-1 flex flex-col items-center justify-center text-teal-800 shadow-2xs">
              <span className="text-[9px] font-black leading-none text-teal-900">السنة</span>
              <span className="text-[6px] tracking-tight leading-tight text-teal-700">مادراسَاتُس</span>
              <span className="text-[6px] font-bold leading-none text-teal-800">মাদরাসাতুস সুন্নাহ</span>
            </div>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 mt-0.5 mb-2">
            {labels.docTitle}
          </h1>
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
                        value={plan.teacherName} 
                        onChange={(e) => setPlan({ ...plan, teacherName: e.target.value })}
                        className="w-full bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-xs"
                      />
                    ) : (
                      <span>{plan.teacherName}</span>
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

              {/* Row 4: Learning Objective */}
              <tr className="border-b border-black">
                <td colSpan={2} className="p-2 align-top bg-white">
                  <div className="space-y-1">
                    <span className="font-bold">{labels.learningObjectiveLabel}</span>{' '}
                    {isEditing ? (
                      <textarea
                        value={plan.learningObjective}
                        onChange={(e) => setPlan({ ...plan, learningObjective: e.target.value })}
                        rows={2}
                        className="w-full bg-amber-50 border border-amber-300 p-1.5 rounded text-xs font-medium mt-1"
                      />
                    ) : (
                      <span className="text-[13px] leading-relaxed">{plan.learningObjective}</span>
                    )}
                  </div>
                </td>
              </tr>

              {/* Row 5: Success criteria */}
              <tr>
                <td colSpan={2} className="p-2 align-top bg-white">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{labels.successCriteriaLabel}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleAddSuccessCriteria}
                          className="text-[11px] text-teal-700 hover:underline font-bold"
                        >
                          {labels.addCriteria}
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 mt-1 text-[13px]">
                      {plan.successCriteria.map((crit, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
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
                            <div>{crit.startsWith(`${idx + 1}.`) || crit.startsWith(`١.`) ? crit : `${idx + 1}. ${crit}`}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section Heading: Lesson Procedure */}
        <h2 className="text-inherit font-bold text-base sm:text-lg pt-6 pb-2 text-slate-950">
          {labels.procedureSectionTitle}
        </h2>

        {/* 2. 4-Column Lesson Procedure Table */}
        <div className="border border-black overflow-hidden mb-6">
          <table className="w-full border-collapse text-[13px]" dir={isAr ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="border-b border-black bg-white">
                <th className={`p-2 ${isAr ? 'border-l' : 'border-r'} border-black text-inherit font-bold w-[22%]`}>
                  {labels.stagesTimeHeader}
                </th>
                <th className={`p-2 ${isAr ? 'border-l' : 'border-r'} border-black text-inherit font-bold w-[54%]`}>
                  {labels.procedureHeader}
                </th>
                <th className={`p-2 ${isAr ? 'border-l' : 'border-r'} border-black text-center font-bold w-[12%]`}>
                  {labels.intHeader}
                </th>
                <th className="p-2 text-center font-bold w-[12%]">
                  {labels.aidsHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              {plan.procedures.map((step, idx) => (
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

                        {/* Bullet instructions */}
                        <ul className={`list-disc list-outside ${isAr ? 'pr-4' : 'pl-4'} space-y-0.5 text-slate-900 leading-snug`}>
                          {step.procedurePoints.map((p, pIdx) => (
                            <li key={pIdx} className="text-[12.5px]">
                              {p}
                            </li>
                          ))}
                        </ul>

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
              ))}
            </tbody>
          </table>
        </div>

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
