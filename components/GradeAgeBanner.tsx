import React from 'react';
import { Sparkles, Brain, Compass, Users, HeartHandshake, BookOpen, Lightbulb, Target } from 'lucide-react';
import { GradeLevel, GRADE_AGE_INTELLECT_MAP } from '../types';

interface GradeAgeBannerProps {
  gradeLevel: string;
  subject?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Grade & Age-Adaptive Cognitive Concept Banner
 * Dynamically adapts typography, color schemes, pedagogical icons,
 * and cognitive developmental guidance based on the child's class and age.
 */
export const GradeAgeBanner: React.FC<GradeAgeBannerProps> = ({
  gradeLevel,
  subject,
  compact = false,
  className = ''
}) => {
  // Normalize grade to find best matching profile
  const profileKey = Object.keys(GRADE_AGE_INTELLECT_MAP).find(k => 
    gradeLevel.toLowerCase().includes(k.toLowerCase()) || 
    k.toLowerCase().includes(gradeLevel.toLowerCase())
  ) || GradeLevel.Grade1;

  const profile = GRADE_AGE_INTELLECT_MAP[profileKey] || {
    grade: gradeLevel || 'প্রাথমিক শ্রেণি',
    ageRange: '৫ - ৭ বছর',
    ageRangeEn: '5 - 7 Years',
    intellectTitle: 'প্রাথমিক ভিত্তি ও চাক্ষুষ ধারণা',
    cognitiveCharacteristics: 'বাস্তব ও দৃশ্যমান বিষয় চেনা, সহজ ও মিষ্টি বাক্য বোঝা, প্রত্যক্ষ তথ্য মনে রাখা।',
    questionFormulationRules: []
  };

  // Determine stage characteristics
  const isEarlyChildhood = gradeLevel.includes('প্লে') || gradeLevel.includes('নার্সারি') || gradeLevel.includes('কেজি') || gradeLevel.includes('প্রথম') || gradeLevel.includes('1');
  const isMiddleSchool = gradeLevel.includes('দ্বিতীয়') || gradeLevel.includes('তৃতীয়') || gradeLevel.includes('চতুর্থ') || gradeLevel.includes('পঞ্চম') || gradeLevel.includes('2') || gradeLevel.includes('3') || gradeLevel.includes('4') || gradeLevel.includes('5');
  const isUpperSchool = !isEarlyChildhood && !isMiddleSchool;

  const stageTheme = isEarlyChildhood
    ? {
        gradient: 'from-amber-500/10 via-rose-500/10 to-emerald-500/10 border-amber-300 dark:border-amber-800',
        badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300',
        tagline: '🧸 প্রাথমিক শৈশব বিকাশ ও খেলাভিত্তিক শিখন (Early Childhood & Play-Based Concept)',
        methods: ['🎨 ছড়া ও সুর', '🧩 খেলনা ও বাস্তব বস্তু (Realia)', '🏃‍♂️ টিপিআর অ্যাকশন ও শারীরিক মুদ্রা', '🔍 ছবি দেখে অনুমান']
      }
    : isMiddleSchool
    ? {
        gradient: 'from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-emerald-300 dark:border-emerald-800',
        badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300',
        tagline: '🌱 মূর্ত সক্রিয় চিন্তন ও দলগত প্রতিযোগিতা (Concrete Operational & Team Activities)',
        methods: ['🤝 জোড়ায় জোড়ায় কার্ড ম্যাচিং', '⚡ ফাস্ট ফিঙ্গার ড্রিল', '🎯 মেমোরি গেম (হোয়াটস মিসিং)', '📝 আনন্দদায়ক ওয়ার্কশিট']
      }
    : {
        gradient: 'from-teal-500/10 via-indigo-500/10 to-blue-500/10 border-teal-300 dark:border-teal-800',
        badge: 'bg-teal-100 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 border-teal-300',
        tagline: '📖 যৌক্তিক বিশ্লেষণ, দলীল ও সৃজনশীল অনুসন্ধান (Formal Logic & Research Synthesis)',
        methods: ['📊 ছক পূরণ ও তুলনামূলক যুক্তি', '💡 প্রশ্ন-উত্তর বিতর্ক', '📚 দলীল ও প্রেক্ষাপট অন্বেষণ', '✍️ সৃজনশীল প্রকাশ']
      };

  if (compact) {
    return (
      <div className={`p-3 rounded-2xl bg-gradient-to-r ${stageTheme.gradient} border flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                {profile.grade}
              </span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-black border ${stageTheme.badge}`}>
                বয়স: {profile.ageRange}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
              {profile.intellectTitle}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-[10px] text-teal-800 dark:text-teal-300 font-semibold">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>মেধা উপযোগী প্রশ্ন ও পাঠ</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${stageTheme.gradient} border p-4 sm:p-6 relative overflow-hidden shadow-xs ${className}`}>
      {/* Background Decorative Motif */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-emerald-500/5 dark:bg-emerald-400/5 blur-xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-md shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {profile.grade}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${stageTheme.badge}`}>
                  বয়স: {profile.ageRange}
                </span>
                {subject && (
                  <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    বিষয়: {subject}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-teal-800 dark:text-teal-300 mt-1">
                {profile.intellectTitle}
              </h4>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white/90 dark:bg-slate-800/90 rounded-full border border-teal-200 dark:border-teal-700/80 text-teal-900 dark:text-teal-200 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>শিশু মনস্তাত্ত্বিক মেধা কাঠামো</span>
          </div>
        </div>

        {/* Cognitive Guidance Description */}
        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1.5">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100">বাচ্চাদের বিবেক-বুদ্ধি ও ধারণাগত স্তর: </span>
              <span>{profile.cognitiveCharacteristics}</span>
            </div>
          </div>
        </div>

        {/* Pedagogical Interactive Activity Badges for This Age */}
        <div>
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-teal-600" />
            <span>এই বয়সের শিশুদের জন্য প্রস্তাবিত আনন্দদায়ক শিখন ও যাচাই পদ্ধতি:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {stageTheme.methods.map((method, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium shadow-2xs"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
