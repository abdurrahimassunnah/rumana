import { GoogleGenAI } from "@google/genai";
import { LessonPlanRequest, QuizRequest, QuizResponse, ExerciseRequest, GeneratedExercise, DetailedPlanRequest, DetailedLessonPlan, getGradeAgeIntellectProfile, TOCChapter, TOCTopic } from "../types";
import { normalizeChapters } from "../utils/tocNormalizer";

const SYSTEM_INSTRUCTION_BASE = `
    আপনি 'মাদরাসাতুস সুন্নাহ'-এর একজন অত্যন্ত দক্ষ, বিচক্ষণ এবং অভিজ্ঞ শিক্ষক ও কারিকুলাম ডিজাইনার (Master Curriculum Designer & Teacher).

    ========================================================================================================
    **ভাষা সংক্রান্ত অত্যন্ত কঠোর ও অলঙ্ঘনীয় নীতি (STRICT SOURCE-LANGUAGE FIDELITY RULE - MANDATORY):**
    ========================================================================================================
    প্রদত্ত বই, সিলেবাস বা পাঠ্যের মূল ভাষার সাথে পাঠ পরিকল্পনা (Lesson Plan), বিস্তারিত পাঠ পরিকল্পনা (Detailed Lesson Plan), অনুশীলনী (Exercise), প্রশ্নপত্র (Question Paper), কুইজ (Quiz) এবং সূচিপত্রের (Table of Contents) ভাষা ১০০% অবিকল ও অভিন্ন হতে হবে।
    
    ১. **আরবি বই বা কিতাব হলে (Arabic Book / كتاب باللغة العربية / كتب تعليم اللغة العربية للأطفال):**
       - যদি বইটি আরবি ভাষায় রচিত হয় অথবা শিশুদের আরবি ভাষা শেখানোর জন্য তৈরি হয় (যেমন: আরবি ভাষা ও সাহিত্য, আদব, কাওয়ায়েদ, সরফ, নাহু, ফিকহ, তাফসির, হাদিস, আল-আরাবিয়্যাহ বাইনা ইয়াদাইক, দুরূসুল লুগাহ, আল-কিরাআতুর রাশিদাহ, আত-তাকাল্লুম, বা যেকোনো আরবি কিতাব):
       - বইটির প্রধান উদ্দেশ্য হলো শিশুরা যেন আরবি ভাষা শেখে এবং ভাষায় পারদর্শী হয়।
       - অতএব পাঠের সবকিছু **১০০% নিখুঁত ও বিশুদ্ধ আরবি ভাষায় (اللغة العربية الفصحى بالكامل)** হতে হবে।
       - পাঠ পরিকল্পনা, শ্রেণির কাজ (C.W), বাড়ির কাজ (H.W), বিস্তারিত পাঠ পরিকল্পনা, শিখনফল, ধাপ ও কার্যক্রম, প্রশ্নপত্র, অনুশীলনী, কুইজ ও উত্তরমালা—সবকিছু সম্পূর্ণ আরবিতে হবে। কোনো বাংলা বা ইংরেজি বাক্য লিখবেন না।
       - আরবি কাজের নির্দেশ অবশ্যই সরাসরি অনুজ্ঞাসূচক আদেশ (فعل أمر مباشر) আকারে থাকবে (যেমন: "اقرأ النص قراءة جهرية وافهم معانيه صـ ...", "احفظ جميع الأدلة والآيات الكريمة واكتبها في الدفتر صـ ...", "استخرج الكلمات الجديدة وضعها في جمل مفيدة", "ناقش الفكرة الرئيسية مع زملائك في الفصل", "لخص محتوى الدرس في ٣ أسطر", "أجب عن أسئلة التدريبات صـ ...").
       - ছুটির দিনের জন্য "عطلة" লিখুন।

    ২. **ইংরেজি বই হলে (English Book / Literacy / Textbook in English):**
       - যদি বইটি ইংরেজি ভাষায় রচিত হয় (যেমন: English For Today, English Grammar, Science, Social Studies, Math in English, Islamic Studies in English, Stories, English Medium Books):
       - সম্পূর্ণ পাঠ পরিকল্পনা, C.W, H.W, সকল কাজের বিবরণী, প্রশ্ন ও অনুশীলনী **১০০% বিশুদ্ধ ও প্রাঞ্জল ইংরেজি ভাষায় (English Language Only)** হতে হবে।
       - ইংরেজি বইয়ের কোনো বিষয় কখনোই বাংলায় অনুবাদ করবেন না এবং ভাষার মিশ্রণ ঘটাবেন না।
       - ইংরেজি কাজের নির্দেশ অবশ্যই সরাসরি Imperative sentences আকারে থাকবে (e.g., "Read the passage on page 24 and identify the keywords.", "Memorize all relevant vocabulary and write them in your notebook, p. 25.", "Discuss the core moral of the story with your peers.", "Write a 3-sentence summary of the chapter in your diary, p. 28.").
       - ছুটির দিনের জন্য "Holiday" লিখুন।

    ৩. **বাংলা বই হলে (Bengali Book / বাংলা পাঠ্যবই):**
       - যদি বইটি বাংলা ভাষায় রচিত হয় (যেমন: বাংলা সাহিত্য, আকাইদ ও ফিকহ, ইতিহাস, বাংলাদেশ ও বিশ্বপরিচয় ইত্যাদি), তবে সম্পূর্ণ পাঠ পরিকল্পনা প্রমিত বাংলা ভাষায় (Bengali) হতে হবে।
       - কাজের নির্দেশ অবশ্যই সরাসরি সাধারণ অনুজ্ঞাসূচক আদেশ বা নির্দেশ আকারে থাকবে (যেমন: 'করো', 'লেখো', 'পড়ো', 'আলোচনা করো', 'মুখস্থ করো', 'প্রস্তুত করো')।
       - ছুটির দিনের জন্য "ছুটি" লিখুন।

    ৪. **গণিত বা বিজ্ঞান (Math / Science Subjects):**
       - পাঠ্যবইটি যে ভাষায় প্রণীত (বাংলা, ইংরেজি বা আরবি), পাঠ পরিকল্পনা ঠিক সেই ভাষাতেই শতভাগ প্রস্তুত হবে।

    ========================================================================================================
    **নাম ও লিঙ্গ নির্ধারণের ডিফল্ট নীতি (Default Gender & Name Rules):**
    ========================================================================================================
    ১. **বাংলা নাম ও সম্বোধন (Bengali):** বাংলা ভাষায় সকল নাম, সম্বোধন, উদাহরণ এবং চরিত্র সবসময় **পুংলিঙ্গ (Masculine form)** হবে (যেমন: ছাত্র, শিক্ষক, উস্তাদ, আব্দুল্লাহ, আব্দুর রহমান, উমর, যায়িদ, খালিদ, তালহা ইত্যাদি)।
    ২. **ইংরেজি নাম ও সম্বোধন (English):** ইংরেজি ভাষায় নাম ও সম্বোধন সবসময় **ক্লীবলিঙ্গ/নিরপেক্ষ (Neuter / Gender-neutral form)** হবে (যেমন: Student, Learner, Pupil, Child, Alex, Jordan, Taylor ইত্যাদি)।

    ========================================================================================================
    **১ম ও ২য় শ্রেণির (Class One & Two) জন্য বিশেষ নির্দেশনাবলী (Age & Intellect-Appropriate Rules for Ages 5-8):**
    ========================================================================================================
    ১. **বয়স ও মেধা অনুযায়ী ভারসাম্য (Age & Cognitive Balance):** ১ম শ্রেণির (৫-৭ বছর) ও ২য় শ্রেণির (৭-৮ বছর) শিশুদের বয়স, মনোযোগের ক্ষমতা (Attention Span) এবং মেধার পরিপক্কতা অত্যন্ত সংবেদনশীলভাবে বিবেচনা করো। জটিল তাত্ত্বিক পড়া বা দীর্ঘ হোমওয়ার্ক দেওয়া সম্পূর্ণ নিষিদ্ধ। কাজগুলো যেন তাদের কোমল মন, কৌতুহল ও সহজাত বুদ্ধিদীপ্ত মনকে বিকশিত করে।
    ২. **অল্প, আনন্দময় ও সুনির্দিষ্ট পরিমাণ (Short, Playful & Precise Scope):** 
       - ১ম ও ২য় শ্রেণির শিশুদের জন্য একসাথে অনেক বেশি পড়া বা লেখা দেওয়া যাবে না। লক্ষ্যগুলো হবে ছোট, স্পষ্ট এবং সহজে অর্জনযোগ্য।
       - যেমন আরবি বা ইংরেজি শব্দার্থ ও বানান: "১ম ৫টি শব্দের অর্থ শিখো এবং উচ্চারণ করো" / "Learn meanings of first 5 words" / "احفظ معاني أول ٥ كلمات".
       - গণিতের ক্ষেত্রে: "পৃষ্ঠা-৬৭ এর বিয়োগ করি-১ (১ থেকে ৬ নং) সহজ উপায়ে সমাধান করো।" বা "ছবির মাধ্যমে সংখ্যাগুলো গণনা করো।"
    ৩. **সহজ, উৎসাহমূলক ও আকর্ষণীয় ভাষা (Encouraging, Tender & Sweet Language):** শিশুদের জন্য ভাষা অত্যন্ত মিষ্টি, সহজ, আকর্ষণীয় এবং কোমল হতে হবে। তাদের উৎসাহিত করতে ইতিবাচক শব্দ ব্যবহার করো।
    ৪. **সৃজনশীল, বাস্তবমুখী ও আনন্দদায়ক কর্মকাণ্ড (Creative, Practical & Interactive Activities):** যান্ত্রিক পড়ালেখার বাইরে ছবি আঁকা, মৌখিক গল্প বলা, ছড়া আবৃত্তি, সহপাঠীদের সাথে হাত তুলে প্রশ্নোত্তর খেলা ইত্যাদি অন্তর্ভুক্ত করো।
    ৫. **শ্রেণির কাজ (C.W) ও বাড়ির কাজের (H.W) চমৎকার মেলবন্ধন:** প্রতিটি দিনের শ্রেণির কাজ (C.W) এবং বাড়ির কাজ (H.W)-এর মধ্যে চমৎকার সংযোগ রাখবে, যেন পড়াশোনাকে বোঝা মনে না করে তারা আনন্দের সাথে শিখতে পারে।

    ========================================================================================================
    **শ্রেণির কাজ (C.W) ও বাড়ির কাজ (H.W) সমন্বয় ও সৃজনশীলতার নিয়ম (CW & HW Combined Daily Routine):**
    ========================================================================================================
    ১. **সমন্বিত শিখন (Combined Learning):** প্রতিটি দিনের C.W (শ্রেণির কাজ) এবং H.W (বাড়ির কাজ) অবশ্যই একে অপরের সাথে সরাসরি সম্পর্কিত এবং পরিপূরক হতে হবে। শ্রেণির কাজ (C.W)-এ যা শিখানো হবে বা আলোচনা করা হবে, বাড়ির কাজ (H.W)-এ তা খাতা বা বোর্ডে লেখার মাধ্যমে, মুখস্থ করার মাধ্যমে বা কোনো ব্যবহারিক কাজের মাধ্যমে শক্তিশালী করা হবে।
    ২. **একঘেয়েমি এড়ানো ও বৈচিত্র্যময় ভাষার ব্যবহার:** C.W এবং H.W কলামে কখনোই শুধু "মনোযোগ দিয়ে পড়ো", "রিডিং পড়ো" বা "Read carefully" শব্দগুলো বারবার বা একনাগাড়ে ব্যবহার করবেন না। এটি অত্যন্ত ক্লান্তিকর ও বিরক্তিকর। এর পরিবর্তে সৃজনশীল, আনন্দদায়ক ও বৈচিত্র্যময় ভাষা এবং বাস্তবমুখী কাজ দিন।
    ৩. **দিন নম্বরের ব্যবহার সম্পূর্ণ নিষিদ্ধ (NO Day-number prefixes):** প্রতিটি দিনের কাজ শুরু করতে কখনোই কোনো দিন নম্বর বা দিন নির্দেশক শব্দ (যেমন: "১ম দিন:", "২য় দিন:", "১ম দিন -", "প্রথম দিন", "Day 1" ইত্যাদি) ব্যবহার করবেন না। কন্টেন্টের শুরুতে সরাসরি কাজের নির্দেশ দিয়ে শুরু করুন।
    ৪. **বাধ্যতামূলক সাধারণ অনুজ্ঞাসূচক আদেশ বা নির্দেশ (Direct Imperative Commands):** প্রতিটি কাজ অবশ্যই অনুজ্ঞাসূচক বাক্যে (Imperative Sentences) সরাসরি আদেশ বা নির্দেশ আকারে লিখতে হবে। ক্রিয়াপদ অবশ্যই সরাসরি সাধারণ আদেশসূচক রূপে থাকবে (যেমন: 'করো', 'লেখো', 'পড়ো', 'আলোচনা করো', 'মুখস্থ করো', 'প্রস্তুত করো')। কখনোই সম্মানসূচক বা উচ্চ-মধ্যম পুরুষ রূপ (যেমন: 'করুন', 'লিখুন', 'পড়ুন') ব্যবহার করবেন না।
    
    *বাংলা বইয়ের সুন্দর উদাহরণ:*
    - C.W: "পাঠের মূল বিষয়বস্তু বোঝো এবং কঠিন শব্দগুলোর বানান অনুশীলন করো, পৃষ্ঠা-৬০।"
    - H.W: "শ্রেণিতে আলোচিত বিষয় নিয়ে পুনরায় ভাবো এবং সকল প্রাসঙ্গিক দলিল মুখস্থ করে খাতায় সুন্দর হস্তাক্ষরে লেখো, পৃষ্ঠা-৬০।"

    *ইংরেজি বইয়ের সুন্দর উদাহরণ (English Imperative Form & No Day Numbers):*
    - C.W: "Read the story aloud with correct pronunciation and identify the new vocabulary, page 60."
    - H.W: "Write down the meanings of all new words and formulate 3 original sentences in your notebook, page 60."

    *আরবি বইয়ের সুন্দর উদাহরণ (Arabic Imperative Form & No Day Numbers):*
    - C.W: "اقرأ النص بتمعن وافهم معانيه مع تحديد المفردات الجديدة، صـ ٦٠."
    - H.W: "احفظ جميع الأدلة والآيات الواردة في الدرس واكتبها في الدفتر بخط واضح، صـ ٦٠."

    ========================================================================================================
    **বুদ্ধিদীপ্ত ও প্রাসঙ্গিক দলিলের নিয়ম (Advanced Scriptural Rules):**
    ========================================================================================================
    ১. কোনো অধ্যায়ে একাধিক আয়াত বা হাদিসের দলিল থাকলে ছাত্রছাত্রীদের শুধুমাত্র একটি দলিল মুখস্থ করতে বলবেন না। অবশ্যই 'সকল' প্রাসঙ্গিক আয়াত বা দলিল মুখস্থ করার নির্দেশ দেবেন (বাংলায়: "সকল প্রাসঙ্গিক আয়াত ও দলিল মুখস্থ করো" / ইংরেজিতে: "Memorize all relevant verses and references" / আরবিতে: "احفظ جميع الآيات والأدلة الواردة في الدرس").
    ২. পৃষ্ঠা নম্বর বা রেফারেন্স অবশ্যই আদেশের একদম শেষে কমা দিয়ে বা ব্র্যাকেটে লিখবেন।

    ========================================================================================================
    **টেবিল ফরম্যাট (Strict Markdown Table):**
    ========================================================================================================
    | DATE | C.W | H.W | ACTION |
    | :--- | :--- | :--- | :--- |
    | [তারিখ/Date] | [শ্রেণির কাজ / Classwork] | [বাড়ির কাজ / Homework] | [REGENERATE] |

    **কঠোর নিয়মাবলী:**
    ১. ACTION কলামে সবসময় "[REGENERATE]" শব্দটি লিখবেন।
    ২. কোনো ধরণের শুভেচ্ছা, ভূমিকা, কোড ব্লক বা অতিরিক্ত বর্ণনা লিখবেন না। শুধুমাত্র Markdown টেবিলটি প্রধান উত্তর হিসেবে থাকবে।
    ৩. যদি কোনো দিনে ক্লাস না থাকে (যেমন সাপ্তাহিক ছুটি বা বন্ধ), তবে বাংলা বইয়ের জন্য "ছুটি", ইংরেজি বইয়ের জন্য "Holiday", আরবি বইয়ের জন্য "عطلة" লিখুন।
`;

const getClientApiKey = (): string | null => {
  const savedKey = localStorage.getItem("GEMINI_API_KEY");
  if (savedKey && savedKey.trim()) {
    return savedKey.trim();
  }
  
  // Fallback to compiled environment variable from Vite build
  const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  
  return null;
};

export const generateLessonPlanClient = async (
  request: LessonPlanRequest,
  onProgress: (progress: number, message: string) => void
): Promise<string> => {
  const apiKey = getClientApiKey();
  if (!apiKey) {
    throw new Error(
      "এপিআই কী (API Key) খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আপনার জেমিনি এপিআই কী সেট করুন।"
    );
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });

  const pageRangeDesc = request.pageRanges && request.pageRanges.length > 0
    ? request.pageRanges.map((r, i) => `রেঞ্জ ${i + 1}: পৃষ্ঠা ${r.start} থেকে ${r.end}`).join(", ")
    : `পৃষ্ঠা ${request.startPage} থেকে ${request.endPage}`;

  const planLang = (request.language === 'ar' || request.language === 'arabic')
    ? 'ar'
    : (request.language === 'en' || request.language === 'english')
    ? 'en'
    : 'bn';

  let langInstruction = '';
  if (planLang === 'ar') {
    langInstruction = `\n**ভাষাগত নির্দেশনা (LANGUAGE MANDATE: ARABIC / العربية):**\nব্যবহারকারী রুটিন ও পাঠ পরিকল্পনার ভাষা হিসেবে **العربية (আরবি)** নির্বাচন করেছেন। পুরো টেবিল, কলামের নাম, C.W ও H.W এর নির্দেশনাবলী ১০০% বিশুদ্ধ আরবি ভাষায় (اللغة العربية الفصحى) তৈরি করুন। যেমন: اليوم، التاريخ، العمل الصفي (C.W)، الواجب المنزلي (H.W)।`;
  } else if (planLang === 'en') {
    langInstruction = `\n**LANGUAGE MANDATE: ENGLISH:**\nThe user explicitly selected **English** for this lesson routine. Generate the entire Markdown table, headers (Day, Date, Class Work (C.W), Home Work (H.W)), and all activity instructions in clear English with imperative action verbs (e.g., Read, Write, Memorize, Discuss).`;
  } else {
    langInstruction = `\n**ভাষাগত নির্দেশনা: বাংলা:**\nব্যবহারকারী রুটিন ও পাঠ পরিকল্পনার ভাষা হিসেবে **বাংলা** নির্বাচন করেছেন। সম্পূর্ণ টেবিল ও C.W/H.W বাংলায় অনুজ্ঞাসূচক বাক্যে (যেমন: করো, লেখো, পড়ো) তৈরি করুন।`;
  }

  let prompt = `${SYSTEM_INSTRUCTION_BASE}
    শ্রেণি: ${request.gradeLevel}
    পৃষ্ঠা সীমা: ${pageRangeDesc}
    মেয়াদ: ${request.duration} দিন
    শুরুর তারিখ: ${request.startDate}
    বন্ধের দিনসমূহ (ছুটি): ${request.holidays || "নেই"}
    ${request.additionalContext ? `অতিরিক্ত নির্দেশাবলী: ${request.additionalContext}` : ""}
    ${langInstruction}
  `;

  if (request.extractedText) {
    prompt += `\nএখানে ফাইল থেকে সংগৃহীত সিলেবাসের বিবরণ দেওয়া হলো:\n${request.extractedText}\n`;
  }

  if (request.sampleLessonPlan) {
    prompt += `\n\n**গুরুত্বপূর্ণ নমুনা পাঠ পরিকল্পনা (Sample Lesson Plan Reference):**\n` +
              `নিচের নমুনা পাঠ পরিকল্পনাটির গঠন (Format), ভাষা শৈলী (Imperative sentences like 'করো', 'লেখো', 'পড়ো'), এবং C.W ও H.W এর চমৎকার মিল ও সমন্বয় কঠোরভাবে বজায় রাখুন। নিচে দেওয়া নমুনাটির আদলে আপনার নতুন রুটিন বা পাঠ পরিকল্পনাটি তৈরি করবেন:\n\n${request.sampleLessonPlan}\n\n`;
  }

  prompt += `
    নির্দেশ: ${pageRangeDesc} এর বিষয়বস্তু বা সংগৃহীত সিলেবাসের বিবরণ বিশ্লেষণ করে ${request.duration} দিনের একটি নিট এন্ড ক্লিন Markdown টেবিল দিন। 
    - মুখস্থ করার আদেশের ক্ষেত্রে অবশ্যই "সকল" আয়াত বা দলিল মুখস্থ করার কথা উল্লেখ করবেন।
    - পৃষ্ঠা নম্বর বা রেফারেন্স অবশ্যই আদেশের শেষে লিখবেন। 
    - উল্টো ক্রমে (Reverse Order) সাজান।
    - ACTION কলামে "[REGENERATE]" লিখুন।
  `;

  onProgress(10, "সিলেবাস এবং দিনের সংখ্যা বিশ্লেষণ করা হচ্ছে...");

  const parts: any[] = [{ text: prompt }];

  if (request.pageImages && Array.isArray(request.pageImages) && request.pageImages.length > 0) {
    for (const imgData of request.pageImages) {
      if (typeof imgData === 'string' && imgData) {
        const base64Str = imgData.includes(',') ? imgData.split(',')[1] : imgData;
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Str
          }
        });
      }
    }
  } else if (request.fileData && request.mimeType) {
    const base64Str = request.fileData.includes(',') ? request.fileData.split(',')[1] : request.fileData;
    parts.push({
      inlineData: {
        mimeType: request.mimeType,
        data: base64Str
      }
    });
  }

  onProgress(30, "বুদ্ধিদীপ্ত পাঠ পরিকল্পনা তৈরি করা হচ্ছে...");

  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let success = false;
  let lastError: any = null;
  let resultText = "";

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    try {
      console.log(`Attempting generateContentStream with model: ${currentModel}`);
      if (i > 0) {
        onProgress(30 + i * 5, `বিকল্প মডেলে চেষ্টা করা হচ্ছে (${currentModel})...`);
        await new Promise(r => setTimeout(r, 1000));
      }

      const responseStream = await ai.models.generateContentStream({
        model: currentModel,
        contents: { parts: parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE,
          temperature: 0.1,
        }
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        fullText += text;
        const estimatedProgress = Math.min(95, 40 + Math.floor(fullText.length / 50));
        onProgress(estimatedProgress, "ডেটা প্রসেস করা হচ্ছে...");
      }

      resultText = fullText;
      success = true;
      break;
    } catch (err: any) {
      console.error(`Error with model ${currentModel} during client-side stream generation:`, err);
      lastError = err;
    }
  }

  if (!success) {
    let userFriendlyMessage = lastError?.message || "সকল মডেল এপিআই কল ব্যর্থ হয়েছে।";
    if (userFriendlyMessage.includes("503") || userFriendlyMessage.includes("UNAVAILABLE") || userFriendlyMessage.includes("high demand") || userFriendlyMessage.includes("limit") || userFriendlyMessage.includes("exhausted")) {
      userFriendlyMessage = "জেমিনি এআই সার্ভার সাময়িকভাবে অতিরিক্ত চাপের মধ্যে রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
    }
    throw new Error(userFriendlyMessage);
  }

  onProgress(100, "সম্পন্ন!");
  return resultText;
};

export const regenerateDayContentClient = async (
  request: LessonPlanRequest,
  date: string,
  previousContent: string
): Promise<{ cw: string, hw: string }> => {
  const apiKey = getClientApiKey();
  if (!apiKey) {
    throw new Error(
      "এপিআই কী (API Key) খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আপনার জেমিনি এপিআই কী সেট করুন।"
    );
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });

  const pageRangeDesc = request.pageRanges && request.pageRanges.length > 0
    ? request.pageRanges.map((r, i) => `রেঞ্জ ${i + 1}: পৃষ্ঠা ${r.start} থেকে ${r.end}`).join(", ")
    : `পৃষ্ঠা ${request.startPage} থেকে ${request.endPage}`;

  const prompt = `
    শ্রেণি: ${request.gradeLevel}
    পৃষ্ঠা সীমা: ${pageRangeDesc}
    তারিখ: ${date}
    পূর্ববর্তী কাজ ছিল: ${previousContent}

    ${request.sampleLessonPlan ? `**গুরুত্বপূর্ণ নমুনা পাঠ পরিকল্পনা (Sample Lesson Plan Reference):**\nনিচের নমুনা পাঠ পরিকল্পনাটির গঠন (Format), ভাষা শৈলী, এবং C.W ও H.W এর চমৎকার মিল ও সমন্বয় বজায় রাখুন। এই নমুনাটির আদলে এই ১ দিনের নতুন কাজ তৈরি করুন:\n${request.sampleLessonPlan}\n` : ""}

    নির্দেশ: উপরোক্ত তথ্যের ভিত্তিতে শুধুমাত্র এই ১ দিনের জন্য একটি ভিন্ন, সৃজনশীল এবং অত্যন্ত সুন্দর নতুন C.W (শ্রেণি কাজ) এবং H.W (শিক্ষার্থীর কাজ) তৈরি করুন। 
    - আগের কাজের চেয়ে এটি সম্পূর্ণ আলাদা হতে হবে।
    - কখনোই শুধু "মনোযোগ দিয়ে পড়ো" বা "Read carefully" লিখবেন না।
    - দিন নম্বর বা কোনো দিন নির্দেশক শব্দ (যেমন: "১ম দিন:", "২য় দিন:", "১ম দিন -", "প্রথম দিন", "Day 1" ইত্যাদি) ব্যবহার করবেন না।
    - প্রতিটি কাজ অবশ্যই অনুজ্ঞাসূচক বাক্যে (Imperative Sentences) সরাসরি সাধারণ আদেশ বা নির্দেশ আকারে লিখতে হবে। ক্রিয়াপদ অবশ্যই সরাসরি সাধারণ আদেশসূচক রূপে থাকবে (যেমন: 'করো', 'লেখো', 'পড়ো', 'আলোচনা করো', 'মুখস্থ করো', 'প্রস্তুত করো')। কখনোই সম্মানসূচক বা উচ্চ-মধ্যম পুরুষ রূপ (যেমন: 'করুন', 'লিখুন', 'পড়ুন', 'আলোচনা করুন') ব্যবহার করবেন না।
    - আদেশের মধ্যে বৈচিত্র্য আনুন (যেমন: খাতায় সুন্দর হস্তাক্ষরে লেখো, শ্রেণিকক্ষে সহপাঠীদের সাথে মূল পয়েন্ট আলোচনা করো, প্রাসঙ্গিক সকল আয়াত মুখস্থ করে খাতায় না দেখে লেখো, অভিভাবককে মুখে বলো এবং তাঁর স্বাক্ষর নাও)।
    - শ্রেণি ডায়েরি এবং হোমওয়ার্ক সুন্দর সমন্বিত কাজের রূপ দিন।
    - পৃষ্ঠা নম্বর বা সূরার রেফারেন্স অবশ্যই আদেশের একদম শেষে কমা বা ব্র্যাকেটে লিখবেন।
    - যদি কোনো প্রাসঙ্গিক আয়াত বা হাদিসের দলিল থাকে, তবে "সকল প্রাসঙ্গিক দলিল মুখস্থ করো" উল্লেখ করুন।
    
    ফলাফলটি শুধুমাত্র নিচের মতো JSON ফরম্যাটে দিন:
    { "cw": "...", "hw": "..." }
  `;

  const parts: any[] = [{ text: prompt }];

  if (request.pageImages && Array.isArray(request.pageImages) && request.pageImages.length > 0) {
    for (const imgData of request.pageImages) {
      if (typeof imgData === 'string' && imgData) {
        const base64Str = imgData.includes(',') ? imgData.split(',')[1] : imgData;
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Str
          }
        });
      }
    }
  } else if (request.fileData && request.mimeType) {
    const base64Str = request.fileData.includes(',') ? request.fileData.split(',')[1] : request.fileData;
    parts.push({
      inlineData: {
        mimeType: request.mimeType,
        data: base64Str
      }
    });
  }

  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let resultText = "{}";
  let success = false;
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    try {
      console.log(`Attempting client-side single day regen with model: ${currentModel}`);
      if (i > 0) {
        await new Promise(r => setTimeout(r, 1000));
      }

      const result = await ai.models.generateContent({
        model: currentModel,
        contents: { parts: parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_BASE,
          responseMimeType: "application/json"
        }
      });

      resultText = result.text || "{}";
      success = true;
      break;
    } catch (err: any) {
      console.error(`Client-side single day error with model ${currentModel}:`, err);
      lastError = err;
    }
  }

  if (!success) {
    let userFriendlyMessage = lastError?.message || "সকল মডেল এপিআই কল ব্যর্থ হয়েছে।";
    if (userFriendlyMessage.includes("503") || userFriendlyMessage.includes("UNAVAILABLE") || userFriendlyMessage.includes("high demand") || userFriendlyMessage.includes("limit") || userFriendlyMessage.includes("exhausted")) {
      userFriendlyMessage = "জেমিনি এআই সার্ভার সাময়িকভাবে অতিরিক্ত চাপের মধ্যে রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
    }
    throw new Error(userFriendlyMessage);
  }

  return JSON.parse(resultText);
};

export const generateLessonPlanStream = async (
  request: LessonPlanRequest,
  onProgress: (progress: number, message: string) => void
): Promise<string> => {
  try {
    const apiKey = getClientApiKey();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["x-gemini-api-key"] = apiKey;
    }

    const response = await fetch("/api/generate-lesson-plan", {
      method: "POST",
      headers,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      console.warn("Backend API not OK, falling back to client-side generation...", response.status);
      return await generateLessonPlanClient(request, onProgress);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("স্ট্রিমিং শুরু করা যায়নি।");
    }

    const decoder = new TextDecoder("utf-8");
    let done = false;
    let accumulated = "";
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              let data: any = null;
              try {
                data = JSON.parse(jsonStr);
              } catch (parseErr) {
                console.error("Error parsing stream chunk:", parseErr);
                continue;
              }

              if (data.type === "progress") {
                onProgress(data.progress, data.message);
              } else if (data.type === "chunk") {
                accumulated += data.text;
              } else if (data.type === "clear") {
                accumulated = "";
              } else if (data.type === "error") {
                throw new Error(data.message || "রুটিন তৈরিতে সমস্যা হয়েছে।");
              }
            }
          }
        }
      }
    }

    return accumulated;
  } catch (error: any) {
    console.warn("API request failed, trying client-side generation fallback:", error);
    try {
      return await generateLessonPlanClient(request, onProgress);
    } catch (fallbackError: any) {
      throw fallbackError;
    }
  }
};

export const generateLessonPlan = generateLessonPlanStream;

export const regenerateDayContent = async (
  request: LessonPlanRequest,
  date: string,
  previousContent: string
): Promise<{ cw: string, hw: string }> => {
  try {
    const apiKey = getClientApiKey();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["x-gemini-api-key"] = apiKey;
    }

    const response = await fetch("/api/regenerate-day", {
      method: "POST",
      headers,
      body: JSON.stringify({ request, date, previousContent })
    });

    if (!response.ok) {
      console.warn("Backend API not OK, falling back to client-side regeneration...", response.status);
      return await regenerateDayContentClient(request, date, previousContent);
    }

    return await response.json();
  } catch (error: any) {
    console.warn("API request failed, trying client-side regeneration fallback:", error);
    try {
      return await regenerateDayContentClient(request, date, previousContent);
    } catch (fallbackError: any) {
      throw fallbackError;
    }
  }
};

export const regenerateSingleDay = regenerateDayContent;

export const generateQuizClient = async (
  request: QuizRequest
): Promise<QuizResponse> => {
  const apiKey = getClientApiKey();
  if (!apiKey) {
    throw new Error(
      "এপিআই কী (API Key) খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আপনার জেমিনি এপিআই কী সেট করুন।"
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });

  // Determine active selected types
  let activeTypes: string[] = [];
  if (Array.isArray(request.questionTypes) && request.questionTypes.length > 0) {
    activeTypes = request.questionTypes;
  } else if (request.questionType) {
    if (request.questionType === "mix") {
      activeTypes = ["mcq", "short", "true_false", "essay", "blank"];
    } else {
      activeTypes = [request.questionType];
    }
  } else {
    activeTypes = ["mcq"];
  }

  const typeDescriptions: Record<string, string> = {
    mcq: "বহুনির্বাচনী প্রশ্ন (MCQ - ৪টি অপশনসহ, সঠিক উত্তরটি 'answer' ফিল্ডে থাকতে হবে এবং 'type' ফিল্ড 'mcq' হতে হবে)",
    short: "সংক্ষিপ্ত উত্তর প্রশ্ন (যার সাথে একটি আদর্শ উত্তর 'answer' ফিল্ডে থাকবে, উত্তরটি অবশ্যই কমপক্ষে ২ লাইনের হতে হবে এবং 'type' ফিল্ড 'short' হতে হবে)",
    true_false: "সত্য/মিথ্যা প্রশ্ন (যার সঠিক উত্তর 'সত্য' অথবা 'মিথ্যা' হবে এবং 'answer' ফিল্ডে থাকবে এবং 'type' ফিল্ড 'true_false' হতে হবে। যদি বিবৃতিটি মিথ্যা হয়, তবে উত্তরের সাথে সঠিক তথ্যটি উল্লেখ করে দিতে হবে)",
    essay: "রচনামূলক / বর্ণনামূলক / আলোচনাভিত্তিক প্রশ্ন (Discussion / Essay - বর্ণনামূলক প্রশ্ন, যার সাথে একটি আদর্শ উত্তর 'answer' ফিল্ডে থাকবে, উত্তরটি অবশ্যই কমপক্ষে ৩-৪ লাইনের হতে হবে এবং 'type' ফিল্ড 'essay' হতে হবে)",
    blank: "শূণ্যস্থান পূরণ প্রশ্ন (Fill in the blank - বাক্যে একটি শূন্যস্থান '______' থাকবে এবং সঠিক উত্তরটি 'answer' ফিল্ডে থাকবে এবং 'type' ফিল্ড 'blank' হতে হবে)"
  };

  const selectedTypeTextList = activeTypes.map(t => `• ${typeDescriptions[t] || t}`).join("\n    ");

  let difficultyText = "";
  if (request.difficulty === "easy") {
    difficultyText = "সহজ (প্রাথমিক স্তরের ও সরাসরি তথ্যভিত্তিক)";
  } else if (request.difficulty === "medium") {
    difficultyText = "মাঝারি (সৃজনশীল ও চিন্তন দক্ষতা যাচাই করার মতো)";
  } else {
    difficultyText = "কঠিন (উচ্চতর দক্ষতা ও গভীর অনুধাবন যাচাই করার মতো)";
  }

  // Build sample questions strictly matching the selected types for one-shot prompt guidance
  const sampleQuestions: any[] = [];
  if (activeTypes.includes("mcq")) {
    sampleQuestions.push({
      type: "mcq",
      question: "রাসূলুল্লাহ (সা.) এর প্রথম স্ত্রীর নাম কী?",
      options: ["ক. খাদিজা (রা.)", "খ. আয়েশা (রা.)", "গ. হাফসা (রা.)", "ঘ. সাওদা (রা.)"],
      answer: "ক. খাদিজা (রা.)"
    });
  }
  if (activeTypes.includes("short")) {
    sampleQuestions.push({
      type: "short",
      question: "আকাইদ শব্দের অর্থ কী এবং এর গুরুত্ব লিখুন।",
      options: null,
      answer: "আকাইদ শব্দের অর্থ বিশ্বাসমালা। ইসলামের মূল বিষয়গুলোকে অন্তরে দৃঢ়ভাবে বিশ্বাস করার নামই আকাইদ।"
    });
  }
  if (activeTypes.includes("true_false")) {
    sampleQuestions.push({
      type: "true_false",
      question: "মদিনা সনদে মোট ৪৭টি ধারা ছিল।",
      options: null,
      answer: "সত্য"
    });
  }
  if (activeTypes.includes("essay")) {
    sampleQuestions.push({
      type: "essay",
      question: "ঈমানের প্রধান প্রধান স্তম্ভসমূহ বিস্তারিতভাবে আলোচনা করো।",
      options: null,
      answer: "ঈমানের প্রধান সাতটি স্তম্ভ হলো আল্লাহর প্রতি বিশ্বাস, ফেরেশতাগণ, কিতাবসমূহ, রাসূলগণ, পরকাল, তকদির এবং মৃত্যুর পর পুনরুত্থান।"
    });
  }
  if (activeTypes.includes("blank")) {
    sampleQuestions.push({
      type: "blank",
      question: "রাসূলুল্লাহ (সা.) ______ খ্রিস্টাব্দে মক্কা থেকে মদিনায় হিজরত করেন।",
      options: null,
      answer: "৬২২"
    });
  }

  const gradeProfile = getGradeAgeIntellectProfile(request.gradeLevel);

  const prompt = `
    আপনি একজন মাদরাসার অভিজ্ঞ ও বিচক্ষণ শিক্ষক। নিচের বই/পাঠ্য বা পাঠ পরিকল্পনার ভিত্তিতে শিক্ষার্থীদের জন্য একটি মানসম্মত ও সুনির্দিষ্ট কুইজ বা মূল্যায়ন পত্র তৈরি করুন।
    
    পাঠ বা রুটিন বিবরণী (বইয়ের মূল বিষয়বস্তু):
    ${request.lessonContent}
    
    **শিক্ষার্থীর বয়স ও মেধার স্তর সংক্রান্ত অপরিহার্য নির্দেশনা (AGE & INTELLECT RULES):**
    • লক্ষ্য শ্রেণি: ${gradeProfile.grade}
    • শিক্ষার্থীর বয়সসীমা: ${gradeProfile.ageRange}
    • মেধা ও চিন্তন স্তর: ${gradeProfile.intellectTitle}
    • মানসিক ও বুদ্ধিবৃত্তিক বৈশিষ্ট্য: ${gradeProfile.cognitiveCharacteristics}
    • এই শ্রেণির বয়স ও মেধার জন্য প্রশ্ন প্রণয়ন নীতি:
      ${gradeProfile.questionFormulationRules.join("\n      ")}

    শ্রেণি: ${request.gradeLevel}
    প্রশ্নের মোট সংখ্যা: ${request.questionCount} টি
    নির্বাচিত প্রশ্নের ধরনসমূহ (${activeTypes.length}টি প্রকার):
    ${selectedTypeTextList}
    কঠিনতার স্তর: ${difficultyText}
    ${request.additionalInstructions ? `অতিরিক্ত বিশেষ নির্দেশনা: ${request.additionalInstructions}` : ""}
    
    **নাম ও লিঙ্গ নির্ধারণের ডিফল্ট নীতি (Default Gender & Name Rules):**
    - বাংলা নাম ও উদাহরণ: সবসময় পুংলিঙ্গ (Masculine form) ব্যবহৃত হবে (যেমন: ছাত্র, উস্তাদ, আব্দুল্লাহ, উমর, আব্দুর রহমান ইত্যাদি)।
    - ইংরেজি নাম ও উদাহরণ: সবসময় ক্লীবলিঙ্গ/নিরপেক্ষ (Neuter / Gender-neutral form) ব্যবহৃত হবে (যেমন: Student, Learner, Pupil, Child ইত্যাদি)।

    অত্যন্ত গুরুত্বপূর্ণ ও আবশ্যিক নির্দেশাবলী:
    ১. [কঠোর শর্ত - বই থেকে প্রশ্ন ও উত্তর]: সমস্ত প্রশ্ন এবং এর উত্তর অবশ্যই ১০০% প্রদত্ত পাঠ্য/বইয়ের বিষয়বস্তু থেকে হতে হবে। বইয়ের বাইরের কোনো অপ্রাসঙ্গিক বা কাল্পনিক প্রশ্ন বা উত্তর তৈরি করা সম্পূর্ণ নিষিদ্ধ।
    ২. [কঠোর শর্ত - নির্বাচিত ধরনের বাইরে প্রশ্ন নিষিদ্ধ]: কুইজে শুধুমাত্র ব্যবহারকারীর নির্বাচিত (${activeTypes.join(', ')}) প্রকারের প্রশ্নই থাকতে হবে। এর বাইরের কোনো প্রকারের প্রশ্ন ১টিও তৈরি করা যাবে না। 
       - উদাহরণ: যদি শুধুমাত্র 'mcq' নির্বাচিত থাকে, তবে সব কয়টি (${request.questionCount}টি) প্রশ্নই অবশ্যই বহুনির্বাচনী (MCQ) হতে হবে; কোনো সংক্ষিপ্ত বা সত্য/মিথ্যা প্রশ্ন তৈরি করা যাবে না।
       - যদি একাধিক ধরন নির্বাচিত থাকে (যেমন MCQ ও রচনামূলক), তবে মোট প্রশ্নের মধ্যে এই নির্বাচিত ধরনগুলো সমবণ্টন করুন।
    ৩. প্রশ্নের শুরুতে কোনো ক্রমিক নম্বর (যেমন ১., 2., ক ইত্যাদি) যুক্ত করবেন না। প্রশ্ন টেক্সট সরাসরি প্রশ্ন দিয়ে শুরু করুন।
    ৪. MCQ প্রশ্নের ক্ষেত্রে অবশ্যই ৪টি অপশন ("options" নামক অ্যারেতে) প্রদান করুন এবং 'answer' ফিল্ডে সঠিক অপশনটি লিখুন।
    ৫. সত্য/মিথ্যা প্রশ্নের ক্ষেত্রে 'answer' ফিল্ডে 'সত্য' অথবা 'মিথ্যা' লিখুন। বিবৃতিটি মিথ্যা হলে সঠিক বাক্যটিও উত্তরের সাথে যুক্ত করে দিন।
    ৬. সংক্ষিপ্ত প্রশ্নের ক্ষেত্রে উত্তরটি কমপক্ষে ২ লাইনের তথ্যপূর্ণ হতে হবে।
    ৭. রচনামূলক প্রশ্নের ক্ষেত্রে উত্তরটি কমপক্ষে ৩-৪ লাইনের বিস্তারিত আলোচনা হতে হবে।
    ৮. শূণ্যস্থান পূরণ প্রশ্নের ক্ষেত্রে প্রশ্নে '______' খালি জায়গা রাখুন এবং 'answer' ফিল্ডে সঠিক শব্দটি লিখুন।
    ৯. উত্তরটি শুধুমাত্র এবং শুধুমাত্র নিচের JSON ফরম্যাটে দিন। কোনো অতিরিক্ত কথা বা মার্কডাউন ব্যাকটিক দেবেন না:
    
    {
      "quizTitle": "কুইজের একটি আকর্ষণীয় ও প্রাসঙ্গিক শিরোনাম",
      "questions": ${JSON.stringify(sampleQuestions, null, 2)}
    }
  `;

  const parts = [{ text: prompt }];
  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let resultText = "{}";
  let success = false;
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    try {
      console.log(`Attempting client-side quiz generation with model: ${currentModel}`);
      if (i > 0) {
        await new Promise(r => setTimeout(r, 1000));
      }

      const result = await ai.models.generateContent({
        model: currentModel,
        contents: { parts: parts },
        config: {
          systemInstruction: "আপনি একজন মাদরাসার অভিজ্ঞ শিক্ষক। আপনি শুধু এবং শুধুমাত্র সঠিক JSON উত্তর দিন। বইয়ের বিষয়বস্তুর বাইরে কোনো তথ্য বা অপ্রাসঙ্গিক প্রশ্ন তৈরি করবেন না। নির্বাচিত প্রশ্নের ধরনের বাইরে অন্য কোনো প্রকার প্রশ্ন তৈরি করবেন না।",
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      resultText = result.text || "{}";
      success = true;
      break;
    } catch (err: any) {
      console.error(`Client-side quiz generation error with model ${currentModel}:`, err);
      lastError = err;
    }
  }

  if (!success) {
    let userFriendlyMessage = lastError?.message || "সকল মডেল এপিআই কল ব্যর্থ হয়েছে।";
    if (userFriendlyMessage.includes("503") || userFriendlyMessage.includes("UNAVAILABLE") || userFriendlyMessage.includes("high demand") || userFriendlyMessage.includes("limit") || userFriendlyMessage.includes("exhausted")) {
      userFriendlyMessage = "জেমিনি এআই সার্ভার সাময়িকভাবে অতিরিক্ত চাপের মধ্যে রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
    }
    throw new Error(userFriendlyMessage);
  }

  let parsed = JSON.parse(resultText);

  // Strict post-processing & verification to guarantee only selected types reach user
  if (parsed && Array.isArray(parsed.questions)) {
    parsed.questions = parsed.questions.map((q: any) => {
      let detectedType = q.type;
      if (!detectedType) {
        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
          detectedType = "mcq";
        } else if (q.question && q.question.includes("______")) {
          detectedType = "blank";
        } else if (q.answer && (q.answer.includes("সত্য") || q.answer.includes("মিথ্যা") || q.answer.toLowerCase().includes("true") || q.answer.toLowerCase().includes("false"))) {
          detectedType = "true_false";
        } else if (activeTypes.includes("essay") && !activeTypes.includes("short")) {
          detectedType = "essay";
        } else {
          detectedType = activeTypes[0] || "short";
        }
      }
      return {
        ...q,
        type: detectedType
      };
    });

    // Enforce strict filter: remove any question type that wasn't selected by user
    const strictlyFiltered = parsed.questions.filter((q: any) => activeTypes.includes(q.type));
    if (strictlyFiltered.length > 0) {
      parsed.questions = strictlyFiltered;
    } else {
      // If all questions failed type tag, coerce them to first active type
      parsed.questions = parsed.questions.map((q: any) => ({ ...q, type: activeTypes[0] }));
    }
  }

  return parsed;
};

export const generateQuiz = async (
  request: QuizRequest
): Promise<QuizResponse> => {
  try {
    const apiKey = getClientApiKey();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["x-gemini-api-key"] = apiKey;
    }

    const response = await fetch("/api/generate-quiz", {
      method: "POST",
      headers,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      return await generateQuizClient(request);
    }

    return await response.json();
  } catch (err) {
    return await generateQuizClient(request);
  }
};

export const generateExercise = async (
  request: ExerciseRequest,
  onProgress?: (progress: number, message: string) => void
): Promise<GeneratedExercise> => {
  if (onProgress) onProgress(20, "পাঠ্যের বিষয়বস্তু বিশ্লেষণ করা হচ্ছে...");

  try {
    const response = await fetch("/api/generate-exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      console.warn("Backend Exercise API not OK, trying client-side fallback...");
      return await generateExerciseClient(request, onProgress);
    }

    if (onProgress) onProgress(90, "প্রশ্নোত্তর সাজানো হচ্ছে...");
    const data = await response.json();
    if (onProgress) onProgress(100, "সম্পন্ন!");
    return data;
  } catch (error: any) {
    console.warn("Exercise API failed, attempting client-side generation:", error);
    return await generateExerciseClient(request, onProgress);
  }
};

export const generateExerciseClient = async (
  request: ExerciseRequest,
  onProgress?: (progress: number, message: string) => void
): Promise<GeneratedExercise> => {
  const apiKey = getClientApiKey();
  if (!apiKey) {
    throw new Error("এপিআই কী (API Key) পাওয়া যায়নি। দয়া করে সেটিংস থেকে বা ভ্যারিয়েবলে সেট করুন।");
  }

  if (onProgress) onProgress(30, "জেমিনি এআই মডেলের সাথে সংযোগ স্থাপন করা হচ্ছে...");

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });

  const activeTypes: string[] = request.selectedQuestionTypes && request.selectedQuestionTypes.length > 0
    ? request.selectedQuestionTypes
    : ['short', 'mcq', 'true_false', 'blank', 'essay'];

  const counts = request.questionCounts || {};
  const shortCount = counts.short || 2;
  const mcqCount = counts.mcq || 4;
  const tfCount = counts.true_false || 3;
  const blankCount = counts.blank || 3;
  const essayCount = counts.essay || 1;
  const matchCount = counts.match || 4;

  const typeInstructionsList: string[] = [];
  if (activeTypes.includes('short')) {
    typeInstructionsList.push(`• সংক্ষিপ্ত উত্তর প্রশ্ন (${shortCount}টি): সংক্ষিপ্ত কিন্তু তথ্যসমৃদ্ধ প্রশ্ন ও ২-৩ লাইনের নির্ভুল উত্তর।`);
  }
  if (activeTypes.includes('mcq')) {
    typeInstructionsList.push(`• বহুনির্বাচনী প্রশ্ন (${mcqCount}টি): ৪টি বিকল্প, 'answer' ফিল্ডে সঠিক উত্তর এবং 'explanation' ফিল্ডে ব্যাখ্যা।`);
  }
  if (activeTypes.includes('true_false')) {
    typeInstructionsList.push(`• সত্য / মিথ্যা যাচাই (${tfCount}টি): 'answer' ফিল্ডে 'সত্য' বা 'মিথ্যা' (মিথ্যা হলে সঠিক বাক্যসহ)।`);
  }
  if (activeTypes.includes('blank')) {
    typeInstructionsList.push(`• শূণ্যস্থান পূরণ (${blankCount}টি): বাক্যে '________' খালি জায়গা এবং 'answer' ফিল্ডে সঠিক শব্দ।`);
  }
  if (activeTypes.includes('essay')) {
    typeInstructionsList.push(`• ব্যাখ্যামূলক / বর্ণনামূলক প্রশ্ন (${essayCount}টি): গভীর অনুধাবনমূলক প্রশ্ন ও বিস্তারিত আদর্শ উত্তর।`);
  }
  if (activeTypes.includes('match')) {
    typeInstructionsList.push(`• ডান-বাম মিলকরণ (${matchCount} জোড়া): left এবং right অংশ সম্বলিত।`);
  }

  const gradeProfile = getGradeAgeIntellectProfile(request.gradeLevel);

  const targetLang = request.language || 'bn';
  const langMandate = targetLang === 'ar'
    ? 'العربية الفصحى بالكامل (অনুশীলনীর সমস্ত প্রশ্ন, সেকশন টাইটেল, নির্দেশাবলী ও উত্তর ১০০% নিখুঁত আরবি ভাষায় তৈরি করবেন)'
    : targetLang === 'en'
    ? 'ENGLISH (100% Comprehensive English - questions, titles, instructions, options, and answers must be in English)'
    : 'বাংলা (BENGALI - সমস্ত প্রশ্ন, সেকশন টাইটেল, নির্দেশাবলী ও উত্তর ১০০% বাংলায় হবে)';

  const pageRangeDesc = (request.pageRanges && Array.isArray(request.pageRanges) && request.pageRanges.length > 0)
    ? request.pageRanges.map((r: any, i: number) => `রেঞ্জ ${i + 1}: পৃষ্ঠা ${r.start} থেকে ${r.end}`).join(", ")
    : (request.startPage ? `পৃষ্ঠা ${request.startPage}${request.endPage ? ` থেকে ${request.endPage}` : ''}` : '');

  const prompt = `
    আপনি 'মাদরাসাতুস সুন্নাহ'-এর একজন অত্যন্ত অভিজ্ঞ ইসলামিক স্টাডিজ শিক্ষক ও পরীক্ষক।
    পাঠের ভিত্তিতে একটি নিখুঁত ও পূর্ণাঙ্গ অনুশীলনী (Exercise) তৈরি করুন।

    **অনুশীলনীর নির্ধারিত ভাষা (MANDATORY LANGUAGE: ${targetLang.toUpperCase()}):**
    • ${langMandate}

    **কঠোর নিষেধাজ্ঞা:**
    ১. পাঠ্যের কোনো সারাংশ বা সামারি (Summary) তৈরি করবেন না। শুধুমাত্র সরাসরি অনুশীলনী ও প্রশ্নপত্র তৈরি করবেন।
    ২. সমস্ত প্রশ্ন ও উত্তর অবশ্যই ১০০% পাঠ্যবইয়ের তথ্যের সাথে সংগতিপূর্ণ হতে হবে।
    ৩. সকল প্রশ্নের সঠিক উত্তর অবশ্যই 'answer' ফিল্ডে দিতে হবে। কোনো প্রশ্ন উত্তরের সমাধান ছাড়া রাখবেন না।

    **শ্রেণি ও শিক্ষার্থীর বয়স ও মেধা সংক্রান্ত অপরিহার্য নির্দেশনা (AGE & INTELLECT RULES):**
    • লক্ষ্য শ্রেণি: ${gradeProfile.grade}
    • শিক্ষার্থীর বয়সসীমা: ${gradeProfile.ageRange}
    • মেধা ও চিন্তন স্তর: ${gradeProfile.intellectTitle}
    • মানসিক ও বুদ্ধিবৃত্তিক বৈশিষ্ট্য: ${gradeProfile.cognitiveCharacteristics}
    • এই শ্রেণির বয়স ও মেধার জন্য প্রশ্ন প্রণয়ন নীতি:
      ${gradeProfile.questionFormulationRules.join("\n      ")}

    **নাম ও লিঙ্গ নির্ধারণের ডিফল্ট নীতি (Default Gender & Name Rules):**
    - বাংলা নাম ও উদাহরণ: সবসময় পুংলিঙ্গ (Masculine form) ব্যবহৃত হবে (যেমন: ছাত্র, উস্তাদ, আব্দুল্লাহ, উমর, আব্দুর রহমান ইত্যাদি)।
    - ইংরেজি নাম ও উদাহরণ: সবসময় ক্লীবলিঙ্গ/নিরপেক্ষ (Neuter / Gender-neutral form) ব্যবহৃত হবে (যেমন: Student, Learner, Pupil, Child ইত্যাদি)।

    অধ্যায়: ${request.chapterTitle || "সাধারণ অধ্যায়"}
    পাঠ/বিষয়: ${request.topicTitle || "ইসলামিক স্টাডিজ পাঠ"}
    শ্রেণি: ${request.gradeLevel || "পঞ্চম শ্রেণি"}
    কঠিনতার মাত্রা: ${request.difficulty === 'hard' ? 'উচ্চতর দক্ষতা' : request.difficulty === 'medium' ? 'মাঝারি' : 'সহজ ও বোধগম্য'}
    ${pageRangeDesc ? `• নির্বাচিত পৃষ্ঠা সীমা (Selected Page Ranges): ${pageRangeDesc}` : ''}
    ${request.additionalInstructions ? `বিশেষ নির্দেশনা: ${request.additionalInstructions}` : ''}

    পাঠ্যবইয়ের বিষয়বস্তু:
    ${request.content || "বইয়ের সংশ্লিষ্ট পাঠের বিষয়বস্তু বিশ্লেষণ করে অনুশীলনী তৈরি করুন।"}

    নির্বাচিত প্রশ্নের ধরন:
    ${typeInstructionsList.join("\n    ")}

    ফলাফলটি শুধুমাত্র এবং শুধুমাত্র নিচের JSON ফরম্যাটে দিন:
    {
      "title": "অনুশীলনী: ${request.topicTitle}",
      "gradeLevel": "${request.gradeLevel || "পঞ্চম শ্রেণি"}",
      "subject": "ইসলামিক স্টাডিজ",
      "chapterTitle": "${request.chapterTitle || ""}",
      "topicTitle": "${request.topicTitle || ""}",
      "totalMarks": 25,
      "estimatedTime": "৩০ মিনিট",
      "sections": [
        {
          "type": "short",
          "title": "১. সংক্ষিপ্ত উত্তর প্রশ্ন",
          "instructions": "নিচের প্রশ্নগুলোর সংক্ষেপে সঠিক উত্তর দাও:",
          "totalMarks": 6,
          "questions": [
            { "id": "q1", "type": "short", "question": "...", "answer": "...", "points": 3 }
          ]
        }
      ]
    }
  `;

  const parts: any[] = [{ text: prompt }];
  if (request.fileData && request.mimeType) {
    const base64Str = request.fileData.includes(',') ? request.fileData.split(',')[1] : request.fileData;
    parts.push({
      inlineData: {
        mimeType: request.mimeType,
        data: base64Str
      }
    });
  }

  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let resultText = "";
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      if (onProgress) onProgress(60, `মডেল (${model}) দিয়ে প্রশ্ন তৈরি করা হচ্ছে...`);
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction: "আপনি একজন বিশেষজ্ঞ ইসলামিক স্টাডিজ শিক্ষক ও পরীক্ষক। আপনি শুধু এবং শুধুমাত্র সঠিক JSON উত্তর দিন। কোনো সারসংক্ষেপ বা ভূমিকা লিখবেন না। সব প্রশ্নের সঠিক উত্তর প্রদান করবেন।",
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });
      resultText = response.text || "{}";
      break;
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!resultText) {
    throw lastError || new Error("অনুশীলনী তৈরি করা সম্ভব হয়নি।");
  }

  return JSON.parse(resultText);
};

export const generateDetailedPlan = async (
  request: DetailedPlanRequest,
  onProgress?: (progress: number, message: string) => void
): Promise<DetailedLessonPlan> => {
  if (onProgress) onProgress(20, "পাঠ্যের বিষয়বস্তু ও পেডাগোজিক্যাল কাঠামো বিশ্লেষণ করা হচ্ছে...");

  try {
    const response = await fetch("/api/generate-detailed-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      console.warn("Backend Detailed Plan API not OK, trying client-side fallback...");
      return await generateDetailedPlanClient(request, onProgress);
    }

    if (onProgress) onProgress(90, "শিখনফল, কার্যক্রম ও সময়বণ্টন সাজানো হচ্ছে...");
    const data = await response.json();
    if (onProgress) onProgress(100, "সম্পন্ন!");
    return data;
  } catch (error: any) {
    console.warn("Detailed Plan API failed, attempting client-side generation:", error);
    return await generateDetailedPlanClient(request, onProgress);
  }
};

export const generateDetailedPlanClient = async (
  request: DetailedPlanRequest,
  onProgress?: (progress: number, message: string) => void
): Promise<DetailedLessonPlan> => {
  const apiKey = getClientApiKey();
  if (!apiKey) {
    throw new Error("এপিআই কী (API Key) পাওয়া যায়নি। দয়া করে সেটিংস থেকে বা ভ্যারিয়েবলে সেট করুন।");
  }

  if (onProgress) onProgress(30, "জেমিনি এআই মডেলের সাথে সংযোগ স্থাপন করা হচ্ছে...");

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });

  const duration = request.totalDurationMinutes || 30;
  const planDays = request.planDays || 1;
  const effectiveClass = request.gradeLevel || "KG";
  const effectiveSubject = request.subject || "English (Literacy)";
  const effectiveTopic = request.topicTitle || "Colors (Red, Blue, Yellow)";
  const effectiveTeacher = request.teacherName || "Kabir Ustadh";

  const pageRangeDesc = (request.pageRanges && Array.isArray(request.pageRanges) && request.pageRanges.length > 0)
    ? request.pageRanges.map((r: any, i: number) => `রেঞ্জ ${i + 1}: পৃষ্ঠা ${r.start} থেকে ${r.end}`).join(", ")
    : (request.startPage ? `পৃষ্ঠা ${request.startPage}${request.endPage ? ` থেকে ${request.endPage}` : ''}` : '');

  const effectiveLang = (request.language === 'ar' || request.language === 'arabic')
    ? 'ar'
    : (request.language === 'en' || request.language === 'english')
    ? 'en'
    : 'bn';

  const langRule = effectiveLang === 'ar'
    ? `========================================================================================================
    **ব্যবহারকারীর নির্বাচিত ভাষা: আরবি (MANDATORY LANGUAGE: ARABIC / اللغة العربية الفصحى بالكامل)**
    ========================================================================================================
    - ব্যবহারকারী স্পষ্টভাবে পাঠ পরিকল্পনার ভাষা হিসেবে **العربية (আরবি)** নির্বাচন করেছেন।
    - পাঠ পরিকল্পনার সবকিছু (A to Z) ১০০% নিখুঁত ও বিশুদ্ধ আরবি ভাষায় (اللغة العربية الفصحى بالكامل) তৈরি করতে হবে।
    - সকল ফিল্ড (className, topic, subject, materials, learningObjective, successCriteria, procedures, stageAndTime, activityTitle, procedurePoints, childrenDo, teacherDoes, symbolKeys meanings) আরবি ভাষায় হবে।
    - পাঠের দিক হবে ডান থেকে বাম (RTL)। কোনো বাংলা বা ইংরেজি বাক্য ব্যবহার করবেন না।`
    : effectiveLang === 'en'
    ? `========================================================================================================
    **ব্যবহারকারীর নির্বাচিত ভাষা: ইংরেজি (MANDATORY LANGUAGE: ENGLISH / English Language Only)**
    ========================================================================================================
    - The user explicitly selected **English** as the language for this lesson plan.
    - Create the ENTIRE lesson plan strictly in professional, clear English from left to right (LTR).
    - All metadata, learning objectives, success criteria, classroom stages, teacher/student actions, materials, and notes must be in English.
    - Do NOT use Arabic or Bengali sentences. Even if the subject is Arabic, all instructions and pedagogical actions must be in English.`
    : `========================================================================================================
    **ব্যবহারকারীর নির্বাচিত ভাষা: বাংলা (MANDATORY LANGUAGE: BENGALI / ১০০% প্রমিত বাংলা - অত্যন্ত কঠোর নিয়ম)**
    ========================================================================================================
    - ব্যবহারকারী পাঠ পরিকল্পনার ভাষা হিসেবে **বাংলা (Bengali)** নির্বাচন করেছেন।
    - এটি অবজারভেশন ক্লাসের জন্য ডিটেইল লেসন প্ল্যান।
    - **কঠোরতম শর্ত (Zero Tolerance):** সম্পূর্ণ পাঠ পরিকল্পনা ১০০% প্রমিত বাংলা ভাষায় বাম থেকে ডান (LTR) অনুযায়ী তৈরি করতে হবে।
    - বিষয় (Subject) বা টপিক আরবি হলেও (যেমন: আরবি শব্দভাণ্ডার বা ورد, انبج, هدية, يد), লেসন প্ল্যানের সকল শিরোনাম, শিখনফল, সাফল্য নির্ণায়ক, শিক্ষক কার্যক্রম (teacherDoes), শিক্ষার্থী কার্যক্রম (childrenDo), ধাপের বিবরণ (procedurePoints), উপকরণ (materials), সময়বণ্টন ও প্রশ্নাবলী **১০০% বাংলায়** লিখতে হবে।
    - কেবল যে নির্দিষ্ট শব্দগুলো মুখস্থ করাতে হবে (যেমন: 'ورد (গোলাপ)', 'انبج (আম)') সেগুলো পাঠ্যের উপকরণ/টপিক হিসেবে উল্লেখ থাকতে পারে, কিন্তু কোনো আরবি বাক্য, আরবি নির্দেশনা বা ডান-থেকে-বাম (RTL) ফরম্যাট ব্যবহার করা যাবে না।
    - বাংলায় শিখনফল অবশ্যই "পাঠ শেষে শিক্ষার্থীরা..." দিয়ে শুরু হবে এবং সাফল্য নির্ণায়ক "সাফল্য নির্ণায়ক: আমি পারি:" দিয়ে শুরু হবে।`;

  const standaloneRule = request.isStandaloneTopic
    ? `========================================================================================================
    **স্বাধীন বিষয় / বই ছাড়া সরাসরি স্বয়ংক্রিয় পেডাগোজিক্যাল প্ল্যান (AUTONOMOUS CREATION - NO BOOK DEPENDENCY):**
    ========================================================================================================
    - এই পাঠ পরিকল্পনাটি কোনো নির্দিষ্ট বই বা পিডিএফের উপর নির্ভরশীল নয়। শিক্ষক বই ছাড়াই সরাসরি বিষয় ও শব্দ উল্লেখ করেছেন।
    - কোনো বইয়ের পৃষ্ঠা নম্বর বা বইয়ের রেফারেন্স উল্লেখ করবেন না। সম্পূর্ণ নিজের পেডাগোজিক্যাল জ্ঞান দিয়ে স্বয়ংসম্পূর্ণ লেসন প্ল্যান তৈরি করবেন।
    - শিক্ষক যে বিষয়/শব্দগুলো দিয়েছেন:
      • মূল টপিক: "${effectiveTopic}"
      • নির্দেশনা ও বিবরণ: "${request.content || ''}"
    - **বিশেষ গুরুত্ব (শব্দ মুখস্থকরণ / ভাষা শিক্ষা):**
      • মুখস্থ করানোর পদ্ধতি হবে সম্পূর্ণ আকর্ষণীয়, আনন্দদায়ক ও খেলাভিত্তিক (Fun & Playful Memorization Techniques)।
      • শিক্ষক ও শিক্ষার্থীদের কার্যক্রমে (teacherDoes & childrenDo) আনন্দদায়ক খেলাধুলা (Educational Games e.g. Magic Flashcard, Guess the Word, Action/Mime, Sound & Echo, Fast Finger, Relay Race), ছড়া/রিদম, শারীরিক অঙ্গভঙ্গি (TPR) ও সক্রিয় অংশগ্রহণ বিশদভাবে বর্ণনা করুন।
      • একঘেয়ে পুনরাবৃত্তি বাদ দিয়ে আনন্দদায়ক কৌশলে ক্লাসের ভেতরই শিশুদের মুখস্থ করিয়ে নেওয়ার স্পষ্ট ধাপ উল্লেখ করুন।
    ========================================================================================================`
    : '';

  const prompt = `
    You are a master teacher trainer and curriculum developer at Madrasatus Sunnah.
    Create an exact 100% copy-to-copy Lesson Plan matching the official "Lesson Plan Template" standard.

    ${langRule}

    ${standaloneRule}

    ========================================================================================================
    **বুদ্ধিমত্তা সম্পন্ন শিশুতোষ অ্যাক্টিভিটি ও শিখন যাচাই নীতি (INTELLIGENT AGE & TOPIC-ADAPTIVE ACTIVITIES):**
    ========================================================================================================
    - অ্যাপের কৃত্রিম বুদ্ধিমত্তা নিজে থেকে বিষয় (${effectiveSubject}), টপিক (${effectiveTopic}) এবং শিশুর শ্রেণি ও বয়স (${effectiveClass}) বিশ্লেষণ করে সবচেয়ে উপযুক্ত, বৈচিত্র্যময় ও সুন্দর কার্যক্রম (Activities) নির্বাচন করবে।
    - প্রতিটি ধাপে কমপক্ষে ২-৩টি আকর্ষণীয় ও আধুনিক শিক্ষাদান পদ্ধতি অন্তর্ভুক্ত করতে হবে:
      ১. **মাখরাজ / তাজবীদ / উচ্চারণ পাঠ হলে:**
         • 'মাখরাজ আয়না ও বাতাস পরীক্ষা' (Makhraj Mirror & Air Flow Check)
         • 'নাকের বাঁশিতে গুন্নাহ কম্পন অনুভব' (Gunnag Vibration Test)
         • 'সাউন্ড ও ইকো ড্রিল' (Sound & Echo Drill)
         • 'হরফ বাছাই ও রঙিন কার্ড ঝুড়ি খেলা' (Letter Sorting Activity)
      ২. **আরবি / ইংরেজি শব্দভাণ্ডার বা মুখস্থকরণ পাঠ হলে:**
         • 'রহস্যের থলে / ম্যাজিক ব্যাগ' (Mystery Box / Magic Bag - বাস্তব বস্তু স্পর্শ করে নাম বলা)
         • 'টিপিআর অঙ্গভঙ্গি ও মূকাভিনয়' (Action Miming & Total Physical Response)
         • 'বোর্ড ফ্ল্যাশকার্ড দ্রুত স্পর্শ দৌড়' (Flyswatter / Slap the Card Board Race)
         • 'কোন বস্তুটি হারিয়ে গেল?' (What's Missing? Visual Memory Game)
      ৩. **কুরআন তিলাওয়াত / হিফজ পাঠ হলে:**
         • 'তিলাওয়াত রিলে ট্রেন' (Sequential Ayah Recitation Relay)
         • 'আয়াত পাজল জোড়া লাগানো' (Ayah Sequence Puzzle)
      ৪. **বাচ্চার শেখা নিশ্চিত যাচাই ও ফিডব্যাক (Formative Assessment & Checking Understanding):**
         • 'এক্সিট টিকিট' (Exit Ticket / Exit Question - ক্লাস শেষের আগে প্রতিটি বাচ্চার শেখা যাচাই)
         • 'ট্রাফিক লাইট বা থাম্বস আপ-ডাউন' (Traffic Light Comprehension Check)
         • 'ফাস্ট ফিঙ্গার কুইজ' (Fast Finger Drill)
    - শিশুদের বয়স ও বিবেক-বুদ্ধির স্তর অনুযায়ী পদ্ধতি সহজ বা উন্নত হবে।
    - শিক্ষক কার্যক্রমে (teacherDoes) এবং শিক্ষার্থীদের কার্যক্রমে (childrenDo) স্পষ্ট, প্রাণবন্ত ও বাস্তবসম্মত নির্দেশনা লিখুন।
    ========================================================================================================

    **Input Details:**
    • Class: ${effectiveClass}
    • Subject: ${effectiveSubject}
    • Topic: ${effectiveTopic}
    • Teacher's Name: ${effectiveTeacher}
    • Duration per session: ${duration} mins
    • Plan Scope / Total Days: ${planDays} day(s) ${planDays > 1 ? `(Break down into sequential Day 1 to Day ${planDays} stages or comprehensive procedural activities spanning ${planDays} days)` : ''}
    • Chapter/Context: ${request.chapterTitle || (request.isStandaloneTopic ? "স্বাধীন পাঠ্যক্রম" : "General")}
    ${pageRangeDesc ? `• Selected Page Range(s) / পৃষ্ঠা সীমা: ${pageRangeDesc}` : ''}
    • Content / Context: ${request.content || "Analyze topic."}
    ${request.additionalInstructions ? `• Special: ${request.additionalInstructions}` : ''}

    Output JSON with exact schema:
    {
      "language": "${effectiveLang}",
      "className": "${effectiveClass}",
      "topic": "${effectiveTopic}${planDays > 1 ? ` (${planDays}-Day Plan)` : ''}",
      "subject": "${effectiveSubject}",
      "teacherName": "${effectiveTeacher}",
      "duration": "${duration} mins${planDays > 1 ? ` × ${planDays} Days` : ''}",
      "materials": "Materials in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
      "learningObjective": "Learning objective in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
      "successCriteria": [
        "1. Criterion 1",
        "2. Criterion 2",
        "3. Criterion 3"
      ],
      "procedures": [
        {
          "stageAndTime": "${effectiveLang === 'bn' ? '১. প্রারম্ভিক প্রস্তুতি ও সংবেদনশীল আকর্ষণ (Lead in & Sensory Hook)\\n৫ মিনিট' : effectiveLang === 'ar' ? '١. التهيئة وجذب الانتباه بالحواس\\n٥ دقائق' : '1. Lead in & Sensory Hook\\n5 mins'}",
          "activityTitle": "Activity title in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
          "procedurePoints": [
            "Teacher action 1 in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
            "Teacher action 2 in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
            "Teacher action 3"
          ],
          "childrenDo": "Student action in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
          "teacherDoes": "Teacher action in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
          "intPattern": "W/C\\nC / O",
          "aids": "Magic Bag\\nRealia"
        },
        {
          "stageAndTime": "${effectiveLang === 'bn' ? '২. মূর্ত উপস্থাপন ও শারীরিক অঙ্গভঙ্গি ড্রিল (Direct Modeling & TPR)\\n১২ মিনিট' : effectiveLang === 'ar' ? '٢. النمذجة المباشرة والحركة الجسدية (TPR)\\n١٢ دقيقة' : '2. Direct Modeling & Kinesthetic TPR\\n12 mins'}",
          "activityTitle": "Activity title in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
          "procedurePoints": [
            "Step 1 in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
            "Step 2",
            "Step 3"
          ],
          "childrenDo": "Student action",
          "teacherDoes": "Teacher action",
          "intPattern": "W/C\\nPW",
          "aids": "Realia\\nFlashcards"
        },
        {
          "stageAndTime": "${effectiveLang === 'bn' ? '৩. সক্রিয় খেলা ও দ্রুত স্পর্শ প্রতিযোগিতা (Kinesthetic Practice & Board Race)\\n১০ মিনিট' : effectiveLang === 'ar' ? '٣. الألعاب التنافسية ولمس البطاقات السريعة\\n١٠ دقائق' : '3. Active Kinesthetic Practice & Board Relay\\n10 mins'}",
          "activityTitle": "Activity title in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
          "procedurePoints": [
            "Practice step 1 in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
            "Practice step 2"
          ],
          "childrenDo": "Student action",
          "teacherDoes": "Teacher action",
          "intPattern": "GW\\nPW",
          "aids": "Board\\nFlashcards"
        },
        {
          "stageAndTime": "${effectiveLang === 'bn' ? '৪. স্মৃতিশক্তি ও ভিজ্যুয়াল মেমোরি পরীক্ষা (Cognitive Memory Recall)\\n৮ মিনিট' : effectiveLang === 'ar' ? '٤. تدريب الذاكرة البصرية واكتشاف المفقود\\n٨ دقائق' : '4. Cognitive Memory Recall\\n8 mins'}",
          "activityTitle": "Activity title in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
          "procedurePoints": [
            "Memory step 1 in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
            "Memory step 2"
          ],
          "childrenDo": "Student action",
          "teacherDoes": "Teacher action",
          "intPattern": "W/C\\nS",
          "aids": "Realia\\nCover Sheet"
        },
        {
          "stageAndTime": "${effectiveLang === 'bn' ? '৫. শিখন নিশ্চিতকরণ ও এক্সিট টিকিট মূল্যায়ন (Formative Assessment & Exit Check)\\n৫ মিনিট' : effectiveLang === 'ar' ? '٥. التأكد من الفهم وتذكرة الخروج ونجمة التفوق\\n٥ دقائق' : '5. Formative Assessment & Exit Ticket\\n5 mins'}",
          "activityTitle": "Activity title in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
          "procedurePoints": [
            "Assessment point 1 in ${effectiveLang === 'bn' ? 'Bengali' : effectiveLang === 'ar' ? 'Arabic' : 'English'}",
            "Assessment point 2"
          ],
          "childrenDo": "Student action",
          "teacherDoes": "Teacher action",
          "intPattern": "S\\nW/C",
          "aids": "Exit Cards\\nStar Stickers"
        }
      ],
      "symbolKeys": {
        "intKeys": [
          { "symbol": "W/C", "meaning": "${effectiveLang === 'bn' ? 'পুরো শ্রেণি (Whole class)' : effectiveLang === 'ar' ? 'كامل الصف' : 'whole class'}" },
          { "symbol": "PW", "meaning": "${effectiveLang === 'bn' ? 'জোড়ায় কাজ (Pair work)' : effectiveLang === 'ar' ? 'عمل ثنائي' : 'Pair work'}" },
          { "symbol": "GW", "meaning": "${effectiveLang === 'bn' ? 'দলগত কাজ (Group work)' : effectiveLang === 'ar' ? 'عمل جماعي' : 'Group work'}" },
          { "symbol": "S", "meaning": "${effectiveLang === 'bn' ? 'একক কাজ (Individual)' : effectiveLang === 'ar' ? 'عمل فردي' : 'students work individually'}" }
        ],
        "aidsKeys": [
          { "symbol": "SB", "meaning": "${effectiveLang === 'bn' ? 'স্মার্টবোর্ড / বোর্ড' : effectiveLang === 'ar' ? 'السبورة الذكية' : 'Smartboard'}" },
          { "symbol": "TB", "meaning": "${effectiveLang === 'bn' ? 'পাঠ্যবই' : effectiveLang === 'ar' ? 'الكتاب المدرسي' : 'Textbook'}" },
          { "symbol": "W/S", "meaning": "${effectiveLang === 'bn' ? 'ওয়ার্কশিট' : effectiveLang === 'ar' ? 'ورقة عمل' : 'Worksheet'}" }
        ]
      }
    }
  `;

  const parts: any[] = [{ text: prompt }];
  if (request.fileData && request.mimeType) {
    const base64Str = request.fileData.includes(',') ? request.fileData.split(',')[1] : request.fileData;
    parts.push({
      inlineData: {
        mimeType: request.mimeType,
        data: base64Str
      }
    });
  }

  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let resultText = "";
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      if (onProgress) onProgress(60, `মডেল (${model}) দিয়ে বিস্তারিত পাঠ পরিকল্পনা তৈরি করা হচ্ছে...`);
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction: "You are a master pedagogical curriculum expert. Always return 100% valid JSON matching the Lesson Plan Template schema.",
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });
      resultText = response.text || "{}";
      break;
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!resultText) {
    throw lastError || new Error("বিস্তারিত পাঠ পরিকল্পনা তৈরি করা সম্ভব হয়নি।");
  }

  const parsed = JSON.parse(resultText);
  parsed.language = effectiveLang;
  return parsed;
};

export interface ExtractedTOCResult {
  bookTitle?: string;
  gradeLevel?: string;
  category?: string;
  subject?: string;
  language?: string;
  chapters: TOCChapter[];
}

export const extractPdfTableOfContents = async (
  options: {
    fileData?: string | null;
    mimeType?: string;
    extractedText?: string;
    fileName?: string;
  },
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractedTOCResult> => {
  if (onProgress) onProgress(20, "পিডিএফের সূচিপত্র ও কাঠামোগত বিশ্লেষণ করা হচ্ছে...");

  try {
    const response = await fetch("/api/extract-pdf-toc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      console.warn("Backend TOC API not OK, trying client-side fallback...");
      return await extractPdfTableOfContentsClient(options, onProgress);
    }

    if (onProgress) onProgress(90, "সূচিপত্র সাজানো হচ্ছে...");
    const data = await response.json();
    if (onProgress) onProgress(100, "সূচিপত্র প্রস্তুত!");
    if (data && Array.isArray(data.chapters)) {
      data.chapters = normalizeChapters(data.chapters);
    }
    return data;
  } catch (error: any) {
    console.warn("TOC extraction failed, using client-side fallback:", error);
    return await extractPdfTableOfContentsClient(options, onProgress);
  }
};

export const extractPdfTableOfContentsClient = async (
  options: {
    fileData?: string | null;
    mimeType?: string;
    extractedText?: string;
    fileName?: string;
  },
  onProgress?: (progress: number, message: string) => void
): Promise<ExtractedTOCResult> => {
  const apiKey = getClientApiKey();
  if (!apiKey) {
    throw new Error("এপিআই কী (API Key) পাওয়া যায়নি। দয়া করে সেটিংস থেকে সেট করুন।");
  }

  if (onProgress) onProgress(30, "জেমিনি এআই দিয়ে সূচিপত্র সাজানো হচ্ছে...");

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });

  const prompt = `
    প্রদত্ত পাঠ্যবই বা ফাইলের পাতা/টেক্সট থেকে একটি গোছানো ও পূর্ণাঙ্গ সূচিপত্র (Table of Contents) JSON তৈরি করুন।
    ফাইলের নাম: ${options.fileName || "পাঠ্যবই.pdf"}

    **ভাষা ও গঠন সংক্রান্ত কঠোর নিয়মাবলী:**
    ১. বইটি যে ভাষায় রচিত (ইংরেজি বই হলে সম্পূর্ণ ইংরেজি, বাংলা বই হলে সম্পূর্ণ বাংলা, আরবি হলে আরবি), ঠিক সেই ভাষাতেই অধ্যায়ের শিরোনাম ও পাঠের বর্ণনা লিখবেন।
    ২. ইংরেজি বই হলে অধ্যায় ও টপিকের শিরোনাম এবং contentExcerpt অবশ্যই ইংরেজিতেই থাকবে।
    ৩. 'language' ফিল্ডে বইটির ভাষা চিহ্নিত করুন ('bn'/'en'/'ar')।

    JSON স্কিমা:
    {
      "bookTitle": "বইয়ের নাম (বইয়ের নিজস্ব ভাষায়)",
      "gradeLevel": "শ্রেণি (যেমন: ১ম শ্রেণি, ২য় শ্রেণি, ৩য় শ্রেণি, ৪র্থ শ্রেণি, ৫ম শ্রেণি ইত্যাদি)",
      "category": "বিভাগ/বিষয় (যেমন: কুরআন ও তাফসির, হাদিস, আকাইদ ও ফিকহ, আরবি ভাষা, বাংলা, ইংরেজি, গণিত, বিজ্ঞান ইত্যাদি)",
      "language": "bn",
      "chapters": [
        {
          "id": "ch_1",
          "title": "প্রধান অধ্যায়/শিরোনাম",
          "arabicTitle": "",
          "startPage": 1,
          "endPage": 20,
          "topics": [
            {
              "id": "t_1_1",
              "topicNumber": "১",
              "title": "অধ্যায়ের অধীনে থাকা উপশিরোনাম/পাঠ",
              "pageNumber": 1,
              "endPageNumber": 4,
              "contentExcerpt": "সংক্ষিপ্ত সারমর্ম"
            }
          ]
        }
      ]
    }
  `;

  const parts: any[] = [{ text: prompt }];
  if (options.extractedText) {
    parts.push({ text: `\n\nটেক্সট:\n${options.extractedText}` });
  }
  if (options.fileData && options.mimeType) {
    const base64Str = options.fileData.includes(',') ? options.fileData.split(',')[1] : options.fileData;
    parts.push({
      inlineData: {
        mimeType: options.mimeType,
        data: base64Str
      }
    });
  }

  const models = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let resultText = "";
  let lastError: any = null;

  for (const m of models) {
    try {
      if (onProgress) onProgress(60, `মডেল (${m}) সূচিপত্র প্রসেস করছে...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: { parts },
        config: {
          systemInstruction: "আপনি একজন কারিকুলাম ও সূচিপত্র বিশেষজ্ঞ। শুধুমাত্র নির্ভুল JSON উত্তর দিন।",
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
      resultText = res.text || "{}";
      break;
    } catch (e: any) {
      lastError = e;
    }
  }

  if (!resultText) {
    throw lastError || new Error("সূচিপত্র বিশ্লেষণ করা সম্ভব হয়নি।");
  }

  const parsed = JSON.parse(resultText);
  if (parsed && Array.isArray(parsed.chapters)) {
    parsed.chapters = normalizeChapters(parsed.chapters);
  }
  return parsed;
};

/**
 * Generates rich subheadings for a chapter that lacks them
 */
export const generateChapterSubheadings = async (params: {
  chapterTitle: string;
  bookTitle?: string;
  gradeLevel?: string;
  category?: string;
  startPage?: number;
  endPage?: number;
  count?: number;
}): Promise<TOCTopic[]> => {
  try {
    const response = await fetch("/api/generate-subheadings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.topics) && data.topics.length > 0) {
        return data.topics.map((t: any, i: number) => ({
          id: `gen_t_${Date.now()}_${i + 1}`,
          topicNumber: (t.topicNumber || `${i + 1}`).toString(),
          title: (t.title || `পাঠ ${i + 1}`).trim(),
          pageNumber: Number(t.pageNumber || params.startPage || 1),
          endPageNumber: Number(t.endPageNumber || params.endPage || params.startPage || 1),
          contentExcerpt: (t.contentExcerpt || t.title || '').trim()
        }));
      }
    }
  } catch (e) {
    console.warn("Backend generate-subheadings failed, trying client fallback:", e);
  }

  // Client-side fallback with GoogleGenAI
  const apiKey = getClientApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const prompt = `
        অধ্যায়ের নাম: "${params.chapterTitle}"
        বইয়ের নাম: "${params.bookTitle || ''}"
        শ্রেণি: "${params.gradeLevel || 'পঞ্চম শ্রেণি'}"
        বিষয়: "${params.category || ''}"
        পৃষ্ঠা: ${params.startPage || 1} - ${params.endPage || 20}

        এই অধ্যায়ের জন্য ${params.count || 4}টি প্রাসঙ্গিক পাঠ/উপশিরোনাম (Subheadings) তৈরি করুন।
        JSON ফরম্যাট:
        {
          "topics": [
            {
              "topicNumber": "১",
              "title": "পাঠ ১: শিরোনাম",
              "pageNumber": ${params.startPage || 1},
              "endPageNumber": ${(params.startPage || 1) + 2},
              "contentExcerpt": "পাঠের সারসংক্ষেপ"
            }
          ]
        }
      `;

      const res = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });

      const parsed = JSON.parse(res.text || "{}");
      if (Array.isArray(parsed.topics)) {
        return parsed.topics.map((t: any, i: number) => ({
          id: `gen_t_${Date.now()}_${i + 1}`,
          topicNumber: (t.topicNumber || `${i + 1}`).toString(),
          title: (t.title || `পাঠ ${i + 1}`).trim(),
          pageNumber: Number(t.pageNumber || params.startPage || 1),
          endPageNumber: Number(t.endPageNumber || params.endPage || params.startPage || 1),
          contentExcerpt: (t.contentExcerpt || t.title || '').trim()
        }));
      }
    } catch (clientErr) {
      console.warn("Client generate subheadings error:", clientErr);
    }
  }

  return [
    {
      id: `gen_t_${Date.now()}_1`,
      topicNumber: '১',
      title: `${params.chapterTitle} - প্রাথমিক আলোচনা ও পরিচিতি`,
      pageNumber: params.startPage || 1,
      endPageNumber: params.startPage || 1,
      contentExcerpt: `${params.chapterTitle} সম্পর্কিত মৌলিক জ্ঞান ও প্রাথমিক আলোচনা`
    },
    {
      id: `gen_t_${Date.now()}_2`,
      topicNumber: '২',
      title: `${params.chapterTitle} - মূল বিষয়বস্তু ও ব্যাখ্যা`,
      pageNumber: params.startPage || 1,
      endPageNumber: params.endPage || params.startPage || 1,
      contentExcerpt: `${params.chapterTitle} সম্পর্কিত বিশদ আলোচনা ও প্রায়োগিক দিক`
    }
  ];
};

