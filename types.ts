export enum GradeLevel {
  Play = 'প্লে / নার্সারি',
  KG = 'কেজি (KG)',
  Grade1 = 'প্রথম শ্রেণি',
  Grade2 = 'দ্বিতীয় শ্রেণি',
  Grade3 = 'তৃতীয় শ্রেণি',
  Grade4 = 'চতুর্থ শ্রেণি',
  Grade5 = 'পঞ্চম শ্রেণি',
  Grade6 = 'ষষ্ঠ শ্রেণি',
  Grade7 = 'সপ্তম শ্রেণি',
  Grade8 = 'অষ্টম শ্রেণি',
}

export interface GradeAgeIntellectProfile {
  grade: GradeLevel | string;
  ageRange: string;
  ageRangeEn: string;
  intellectTitle: string;
  cognitiveCharacteristics: string;
  questionFormulationRules: string[];
}

export const GRADE_AGE_INTELLECT_MAP: Record<string, GradeAgeIntellectProfile> = {
  [GradeLevel.Play]: {
    grade: GradeLevel.Play,
    ageRange: '৩ - ৫ বছর',
    ageRangeEn: '3 - 5 Years',
    intellectTitle: 'সংবেদনশীল ও প্রারম্ভিক ইন্দ্রিয়ভিত্তিক শিখন (Sensory & Play-Based Early Childhood)',
    cognitiveCharacteristics: 'স্পর্শ, রং, ছবি, ছড়া, সুর ও খেলার মাধ্যমে চেনা। মনোযোগের পরিধি অতি স্বল্প। মুখস্থকরণ সম্পূর্ণ খেলা ও পুনরাবৃত্তিমূলক ছড়া নির্ভর।',
    questionFormulationRules: [
      'প্রশ্ন হবে ছবি বা বস্তুর নাম বলা সংক্রান্ত।',
      'মৌখিক ও অঙ্গভঙ্গি ভিত্তিক আনন্দদায়ক ছোট ছোট প্রশ্ন।',
      'কোনো লিখিত বা জটিল পরীক্ষা নয়, মুখে মুখে বলা ও ছবি শনাক্তকরণ।'
    ]
  },
  [GradeLevel.KG]: {
    grade: GradeLevel.KG,
    ageRange: '৪ - ৬ বছর',
    ageRangeEn: '4 - 6 Years',
    intellectTitle: 'মৌলিক ধ্বনি ও দৃশ্যমান প্রতীক চেনা (Phonics & Visual Symbol Identification)',
    cognitiveCharacteristics: 'হরফ ও শব্দের ছবি মেলানো, সহজ ছড়া গাওয়া, শিক্ষকের অঙ্গভঙ্গি অনুকরণ ও বাস্তব বস্তুর নাম মুখে বলা।',
    questionFormulationRules: [
      'সহজ ছবি দেখে হরফ ও শব্দের সাথে রেখা টানা বা টিক চিহ্ন।',
      'মুখে মুখে মাখরাজ ও শব্দ উচ্চারণ ড্রিল।',
      '১-২ শব্দের সহজতম মৌখিক প্রশ্ন।'
    ]
  },
  [GradeLevel.Grade1]: {
    grade: GradeLevel.Grade1,
    ageRange: '৫ - ৭ বছর',
    ageRangeEn: '5 - 7 Years',
    intellectTitle: 'প্রাথমিক ভিত্তি ও চাক্ষুষ ধারণা (Foundational & Visual Recognition)',
    cognitiveCharacteristics: 'স্বল্প মনোযোগের পরিধি (Short Attention Span), বাস্তব ও দৃশ্যমান বিষয় চেনা, সহজ ও মিষ্টি বাক্য বোঝা, প্রত্যক্ষ তথ্য মনে রাখা। কোনো জটিল তাত্ত্বিক যুক্তি বা দীর্ঘ উত্তর দেওয়ার মতো মানসিক পরিপক্কতা নেই।',
    questionFormulationRules: [
      'প্রশ্ন হবে অত্যন্ত ছোট, সহজ ও শিশুতোষ ভাষায়।',
      'সরাসরি দৃশ্যমান তথ্য বা চেনা নামের উপর সহজ প্রশ্ন (যেমন: "আমাদের নবীর নাম কী?", "কুরআন কার বাণী?")।',
      'সংক্ষিপ্ত প্রশ্নের উত্তর ১টি বাক্য বা ২-৩টি সহজ শব্দের মধ্যে সীমাবদ্ধ থাকবে।',
      'বহুনির্বাচনীতে অপশনগুলো স্পষ্ট ও বিভ্রান্তিমুক্ত সহজ বিকল্প হতে হবে।',
      'কোনো জটিল বিশ্লেষণ বা বিমূর্ত (abstract) তাত্ত্বিক প্রশ্ন করা যাবে না।'
    ]
  },
  [GradeLevel.Grade2]: {
    grade: GradeLevel.Grade2,
    ageRange: '৭ - ৮ বছর',
    ageRangeEn: '7 - 8 Years',
    intellectTitle: 'প্রাথমিক অনুধাবন ও সহজ কার্যকারণ (Basic Comprehension & Cause-Effect)',
    cognitiveCharacteristics: 'সহজ পূর্ণ বাক্যে উত্তর দেওয়া, পাঠের সরাসরি ঘটনা ও কারণ বুঝতে পারা, মৌলিক আদব-কায়দা ও ধর্মীয় শিষ্টাচার চেনা।',
    questionFormulationRules: [
      'প্রশ্ন ও উত্তরের ভাষা হবে প্রাঞ্জল, সহজবোধ্য ও শিশুবান্ধব।',
      'সরাসরি পাঠ্যবইয়ের ঘটনা বা তথ্য থেকে ১-২ বাক্যের সহজ প্রশ্ন তৈরি করুন।',
      'শূন্যস্থান পূরণ ও সত্য-মিথ্যা প্রশ্নগুলো সুস্পষ্ট ও সংক্ষিপ্ত রাখুন।',
      'শিশুদের মেধা ও শিষ্টাচার বিকাশে সহায়ক মৌলিক প্রশ্ন অন্তর্ভুক্ত করুন।'
    ]
  },
  [GradeLevel.Grade3]: {
    grade: GradeLevel.Grade3,
    ageRange: '৮ - ৯ বছর',
    ageRangeEn: '8 - 9 Years',
    intellectTitle: 'ধারণাগত বিকাশ ও সংযোগ স্থাপন (Conceptual Growth & Associative Thinking)',
    cognitiveCharacteristics: 'বিষয়বস্তুর মূলভাব বুঝতে পারা, মৌলিক পার্থক্য নির্ণয়, নিয়ম-কানুন ও নৈতিক শিক্ষা মনে রেখে নিজের ভাষায় প্রকাশ করা।',
    questionFormulationRules: [
      'সাধারণ তথ্যের পাশাপাশি "কেন" ও "কীভাবে" সংক্রান্ত সহজ অনুধাবনমূলক প্রশ্ন যুক্ত করুন।',
      'সংক্ষিপ্ত প্রশ্নের উত্তর ২-৩ বাক্যের পরিচ্ছন্ন ব্যাখ্যামূলক হবে।',
      'সত্য-মিথ্যা প্রশ্নে তথ্যের যথার্থতা যাচাই ও ভুল সংশোধনের সুযোগ রাখুন।'
    ]
  },
  [GradeLevel.Grade4]: {
    grade: GradeLevel.Grade4,
    ageRange: '৯ - ১০ বছর',
    ageRangeEn: '9 - 10 Years',
    intellectTitle: 'যৌক্তিক অনুধাবন ও ধারাবাহিক চিন্তন (Logical Reasoning & Sequential Comprehension)',
    cognitiveCharacteristics: 'যুক্তিপূর্ণ চিন্তন, ধারাবাহিক ঘটনা বর্ণনা, বিষয়বস্তুর গুরুত্ব ও তাৎপর্য অনুধাবন এবং ৩-৪ বাক্যে নিজের ভাব প্রকাশের সক্ষমতা।',
    questionFormulationRules: [
      'বর্ণনামূলক ও বিশ্লেষণমূলক সহজ প্রশ্ন (যেমন: ঘটনার তাৎপর্য, শিক্ষণীয় দিক) যুক্ত করুন।',
      'বহুনির্বাচনী প্রশ্নগুলোতে চিন্তন উদ্দীপক বিকল্প দিন।',
      'উত্তরগুলো হবে গোছানো, যুক্তিযুক্ত এবং ৩-৪ লাইনের পরিমিত বর্ণনাবিশিষ্ট।'
    ]
  },
  [GradeLevel.Grade5]: {
    grade: GradeLevel.Grade5,
    ageRange: '১০ - ১১ বছর',
    ageRangeEn: '10 - 11 Years',
    intellectTitle: 'সৃজনশীল প্রকাশ ও সামগ্রিক পর্যালোচনা (Creative Expression & Critical Synthesis)',
    cognitiveCharacteristics: 'সমস্যা সমাধান, বিশ্লেষণধর্মী চিন্তা, ইসলামিক আদর্শ ও ব্যবহারিক জীবনের সমন্বয় এবং গভীর অনুধাবন ক্ষমতা।',
    questionFormulationRules: [
      'সৃজনশীল ও উচ্চতর চিন্তন দক্ষতা (Higher Order Thinking) যাচাইমূলক প্রশ্ন করুন।',
      'বর্ণনামূলক প্রশ্নে বিষয়ের গুরুত্ব, প্রেক্ষাপট ও বাস্তব জীবনের প্রয়োগ ব্যাখ্যা করতে বলুন।',
      'দলীল, রেফারেন্স ও নৈতিক শিক্ষা ভিত্তিক সমৃদ্ধ প্রশ্ন অন্তর্ভুক্ত করুন।'
    ]
  },
  [GradeLevel.Grade6]: {
    grade: GradeLevel.Grade6,
    ageRange: '১১ - ১২ বছর',
    ageRangeEn: '11 - 12 Years',
    intellectTitle: 'বিশ্লেষণাত্মক ও তাত্ত্বিক মেধা (Analytical & Abstract Reasoning)',
    cognitiveCharacteristics: 'গভীর মননশীলতা, ক্রিটিক্যাল থিংকিং, দলীলভিত্তিক সিদ্ধান্ত গ্রহণ, তুলনা ও কারণ অনুসন্ধান ক্ষমতা।',
    questionFormulationRules: [
      'গভীর অনুধাবন ও বিশ্লেষণমূলক প্রশ্ন প্রস্তুত করুন।',
      'তুলনামূলক আলোচনা ও ইতিহাসের তাৎপর্য পর্যালোচনামূলক প্রশ্ন রাখুন।',
      'উত্তরগুলো হবে সমৃদ্ধ, রেফারেন্সসমৃদ্ধ ও যুক্তিপূর্ণ।'
    ]
  },
  [GradeLevel.Grade7]: {
    grade: GradeLevel.Grade7,
    ageRange: '১২ - ১৩ বছর',
    ageRangeEn: '12 - 13 Years',
    intellectTitle: 'উচ্চতর অনুধাবন ও যুক্তি প্রয়োগ (Advanced Critical & Jurisprudential Intellect)',
    cognitiveCharacteristics: 'জটিল মাসআলা ও দলীল অনুধাবন, কার্যকারণ বিশ্লেষণ, দীর্ঘ যৌক্তিক আলোচনা ও সিদ্ধান্তমূলক চিন্তন।',
    questionFormulationRules: [
      'দলীল ও যুক্তিভিত্তিক প্রশ্ন তৈরি করুন।',
      'বাস্তব সমস্যা ও তার শরীয়তসম্মত সমাধান বিষয়ক প্রশ্ন রাখুন।',
      'দীর্ঘ ও গবেষণামূলক আলোচনার সুযোগ দিন।'
    ]
  },
  [GradeLevel.Grade8]: {
    grade: GradeLevel.Grade8,
    ageRange: '১৩ - ১৪+ বছর',
    ageRangeEn: '13 - 14+ Years',
    intellectTitle: 'গবেষণাধর্মী মেধা ও গভীর প্রজ্ঞা (Research-Oriented & Scholastic Mastery)',
    cognitiveCharacteristics: 'গবেষণাধর্মী বিশ্লেষণ, গভীর শাব্দিক ও ভাবার্থ মূল্যায়ন, উচ্চস্তরের তাত্ত্বিক ও ব্যবহারিক মেধার প্রকাশ।',
    questionFormulationRules: [
      'গভীর দলীলভিত্তিক ও গবেষণামূলক প্রশ্নপত্র প্রণয়ন করুন।',
      'তাত্ত্বিক বিশ্লেষণ ও সিদ্ধান্তমূলক বর্ণনামূলক প্রশ্ন দিন।'
    ]
  }
};

export const getGradeAgeIntellectProfile = (gradeLevel?: string): GradeAgeIntellectProfile => {
  const norm = (gradeLevel || '').trim().toLowerCase();
  if (norm.includes('প্রথম') || norm.includes('1') || norm.includes('one')) return GRADE_AGE_INTELLECT_MAP[GradeLevel.Grade1];
  if (norm.includes('দ্বিতীয়') || norm.includes('2') || norm.includes('two')) return GRADE_AGE_INTELLECT_MAP[GradeLevel.Grade2];
  if (norm.includes('তৃতীয়') || norm.includes('3') || norm.includes('three')) return GRADE_AGE_INTELLECT_MAP[GradeLevel.Grade3];
  if (norm.includes('চতুর্থ') || norm.includes('4') || norm.includes('four')) return GRADE_AGE_INTELLECT_MAP[GradeLevel.Grade4];
  if (norm.includes('পঞ্চম') || norm.includes('5') || norm.includes('five')) return GRADE_AGE_INTELLECT_MAP[GradeLevel.Grade5];
  if (norm.includes('ষষ্ঠ') || norm.includes('6') || norm.includes('six')) return GRADE_AGE_INTELLECT_MAP[GradeLevel.Grade6];
  if (norm.includes('সপ্তম') || norm.includes('7') || norm.includes('seven')) return GRADE_AGE_INTELLECT_MAP[GradeLevel.Grade7];
  if (norm.includes('অষ্টম') || norm.includes('8') || norm.includes('eight')) return GRADE_AGE_INTELLECT_MAP[GradeLevel.Grade8];
  return GRADE_AGE_INTELLECT_MAP[GradeLevel.Grade5];
};

export type AppMode = 'exercise' | 'lesson_notes' | 'detailed_plan';

// ==========================================
// 1. EXERCISE & QUESTION GENERATION TYPES
// ==========================================
export type ExerciseQuestionType = 'short' | 'essay' | 'mcq' | 'blank' | 'true_false' | 'match';

export interface ExerciseQuestion {
  id: string;
  type: ExerciseQuestionType;
  question: string;
  options?: string[]; // for MCQ
  answer: string; // correct answer / explanation
  explanation?: string;
  points?: number;
  matchPairs?: { left: string; right: string }[]; // for match questions
}

export interface ExerciseSection {
  type: ExerciseQuestionType;
  title: string;
  instructions: string;
  totalMarks?: number;
  questions: ExerciseQuestion[];
}

export interface GeneratedExercise {
  title: string;
  gradeLevel: GradeLevel | string;
  subject: string;
  chapterTitle: string;
  topicTitle: string;
  totalMarks: number;
  estimatedTime: string;
  sections: ExerciseSection[];
  rawMarkdown?: string;
}

export interface ExerciseRequest {
  topicTitle: string;
  chapterTitle: string;
  gradeLevel: GradeLevel;
  content: string;
  file?: File | null;
  fileData?: string | null;
  mimeType?: string;
  startPage?: number | string;
  endPage?: number | string;
  pageRanges?: { start: number | string; end: number | string }[];
  selectedQuestionTypes: ExerciseQuestionType[];
  questionCounts: {
    short?: number;
    essay?: number;
    mcq?: number;
    blank?: number;
    true_false?: number;
    match?: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  language?: 'bn' | 'en' | 'ar';
  additionalInstructions?: string;
}

// ==========================================
// 2. CONCISE LESSON PLAN / NOTES TYPES
// ==========================================
export interface PageRange {
  id: string;
  start: number | string;
  end: number | string;
}

export type PlanLanguage = 'bn' | 'en' | 'ar';

export interface LessonPlanRequest {
  file?: File | null;
  fileId?: string;
  fileData?: string | null;
  mimeType?: string;
  extractedText?: string;
  pageImages?: string[];
  duration: number;
  startDate: string;
  startPage?: number | string;
  endPage?: number | string;
  pageRanges?: { start: number | string; end: number | string }[];
  gradeLevel: GradeLevel;
  holidays?: string;
  weeks?: number;
  additionalContext?: string;
  sampleLessonPlan?: string;
  topicTitle?: string;
  chapterTitle?: string;
  language?: PlanLanguage | string;
}

export type QuizQuestionType = 'mcq' | 'short' | 'true_false' | 'essay' | 'blank';

export interface QuizQuestion {
  type: QuizQuestionType;
  question: string;
  options?: string[] | null;
  answer: string;
  explanation?: string;
}

export interface QuizResponse {
  quizTitle: string;
  questions: QuizQuestion[];
}

export interface QuizRequest {
  lessonContent: string;
  gradeLevel: GradeLevel | string;
  questionCount: number;
  questionTypes?: QuizQuestionType[];
  questionType?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  additionalInstructions?: string;
}

// ==========================================
// 3. DETAILED LESSON PLAN TYPES (100% Match Template)
// ==========================================
export interface LessonProcedureStep {
  id?: string;
  stageAndTime: string; // e.g. "Lead in / warm-up\n3-5 minutes"
  activityTitle: string; // e.g. "Hello Song + Color Hunt"
  procedurePoints: string[]; // e.g. ["Teacher sings the hello song", "Children look around..."]
  childrenDo: string; // e.g. "Point and name"
  teacherDoes: string; // e.g. "Models and encourages."
  intPattern: string; // e.g. "W/C\nC / O" or "W/C\nS" or "GW"
  aids: string; // e.g. "SB\nC / O" or "Flashcards & toys" or "Objects"
}

export interface SymbolKeyMap {
  intKeys: { symbol: string; meaning: string }[];
  aidsKeys: { symbol: string; meaning: string }[];
}

export interface DetailedLessonPlan {
  id?: string;
  language?: PlanLanguage | string;
  observationTitle?: string; // e.g. "Formal Observation-02"
  institutionName?: string; // e.g. "মাদরাসাতুস সুন্নাহ"
  planLength?: PlanLengthMode; // 'compact' | 'standard_3page' | 'extended'
  // Metadata Grid (Exact match)
  className: string; // e.g. "KG" or "৫ম শ্রেণি"
  topic: string; // e.g. "Colors (Red, Blue, Yellow)"
  subject: string; // e.g. "English (Literacy)"
  teacherName: string; // e.g. "Kabir Ustadh"
  duration: string; // e.g. "30 mins"
  materials: string; // e.g. "Color flashcards, red/blue/yellow toys, crayons, worksheet."
  date?: string; // e.g. "25-10-2026"
  time?: string; // e.g. "10:20-11:00 am"

  // Learning Objective (Exact match)
  learningObjective: string; // e.g. "By the end of the lesson, children will be able to identify red, blue, and yellow objects by pointing and naming them."

  // Success Criteria (Exact match: "Success criteria: I can: 1. ... 2. ... 3. ...")
  successCriteria: string[];

  // 4-Column Lesson Procedure Table (Exact match: Stages/Time, Procedure, Int, Aids)
  procedures: LessonProcedureStep[];

  // Key to symbols (Exact match)
  symbolKeys: SymbolKeyMap;

  // Teacher's Note (from Madrasatus Sunnah official format)
  teachersNote?: string;

  // Optional legacy fields for backward compatibility
  lessonProfile?: {
    title?: string;
    subject?: string;
    gradeLevel?: string;
    chapterTitle?: string;
    topicTitle?: string;
    duration?: string;
    pageRange?: string;
  };
  learningOutcomes?: {
    knowledge: string[];
    comprehension: string[];
    application: string[];
  };
  teachingAids?: {
    general: string[];
    special: string[];
  };
  hookAndMotivation?: {
    durationMinutes: number;
    priorKnowledgeCheck: string;
    motivationalQuestionOrStory: string;
  };
  deliverySteps?: any[];
  groupOrPairActivity?: any;
  assessmentCW?: any;
  summaryAndMoral?: any;
  homeworkHW?: any;
  teacherNotes?: string;
  rawMarkdown?: string;
}

export type PlanLengthMode = 'compact' | 'standard_3page' | 'extended';

export interface DetailedPlanRequest {
  topicTitle: string;
  chapterTitle?: string;
  gradeLevel: GradeLevel | string;
  subject?: string;
  teacherName?: string;
  totalDurationMinutes: number; // e.g. 30, 40 or 45 min
  planDays?: number; // 1, 2, 3, 4 days lesson plan breakdown
  planLength?: PlanLengthMode; // 'compact' (সংক্ষিপ্ত ১-২ পৃষ্ঠা), 'standard_3page' (মাত্র ৩ পৃষ্ঠা - ডিফল্ট), 'extended' (বড়/বিস্তারিত ৩-৪ পৃষ্ঠা)
  content: string;
  file?: File | null;
  fileData?: string | null;
  mimeType?: string;
  startPage?: number | string;
  endPage?: number | string;
  pageRanges?: { start: number | string; end: number | string }[];
  teachingMethodology?: string;
  additionalInstructions?: string;
  language?: PlanLanguage | string;
  isStandaloneTopic?: boolean;
}

// ==========================================
// SHARED TYPES & TOC
// ==========================================
export interface TOCTopic {
  id: string;
  topicNumber?: string;
  title: string;
  pageNumber: number;
  endPageNumber?: number;
  contentExcerpt?: string;
  fullText?: string;
}

export interface TOCChapter {
  id: string;
  title: string;
  arabicTitle?: string;
  startPage: number;
  endPage: number;
  topics: TOCTopic[];
}

export interface SavedBook {
  id: string;
  userId?: string;
  title: string;
  fileName?: string;
  pageCount?: number;
  gradeLevel?: GradeLevel | string;
  subject?: string;
  category?: string;
  language?: 'bn' | 'en' | 'ar' | 'auto' | string;
  chapters: TOCChapter[];
  createdAt: number;
  updatedAt?: number;
}

export const BOOK_CATEGORIES = [
  'কুরআন ও তাফসির',
  'হাদিস ও উসুল',
  'আকাইদ ও ফিকহ',
  'সিরাত ও ইতিহাস',
  'আরবি ভাষা ও ব্যাকরণ',
  'বাংলা',
  'ইংরেজি',
  'গণিত',
  'বিজ্ঞান',
  'সমাজ ও সাধারণ',
  'অন্যান্য'
] as const;

export const ALL_GRADE_LEVELS = [
  'প্রথম শ্রেণি',
  'দ্বিতীয় শ্রেণি',
  'তৃতীয় শ্রেণি',
  'চতুর্থ শ্রেণি',
  'পঞ্চম শ্রেণি',
  'ষষ্ঠ শ্রেণি',
  'সপ্তম শ্রেণি',
  'অষ্টম শ্রেণি',
  'নবম-দশম শ্রেণি',
  'আলিম / এইচএসসি'
] as const;

export interface GenerationState {
  isLoading: boolean;
  progress: number;
  statusMessage: string;
  error: string | null;
  result: any;
  rawText?: string | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: AppMode;
  gradeLevel: GradeLevel | string;
  topicTitle: string;
  chapterTitle?: string;
  previewText: string;
  fullContent?: string;
  duration?: number;
  exerciseData?: GeneratedExercise;
  detailedPlanData?: DetailedLessonPlan;
  exerciseRequest?: ExerciseRequest;
  lessonPlanRequest?: LessonPlanRequest;
  detailedPlanRequest?: DetailedPlanRequest;
}

