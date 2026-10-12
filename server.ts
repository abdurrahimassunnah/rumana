import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
    **শিশুকেন্দ্রিক শিক্ষাদান ও বাস্তব জীবনের প্রয়োগ নীতি (CHILD-CENTERED PEDAGOGY & ACTIONABLE LEARNING):**
    ========================================================================================================
    ১. **শিশুরা যেভাবে সহজে শেখে (Cognitive Comprehensibility for Children):**
       - পাঠের বিষয়বস্তুকে শিশুদের বয়স ও মানসিক স্তর অনুযায়ী সহজ, বোধগম্য, আকর্ষণীয় ও প্রাণবন্ত ভাষায় উপস্থাপন করতে হবে।
       - জটিল তাত্ত্বিক আলোচনার পরিবর্তে বাস্তব জীবনের চেনা উদাহরণ, গল্প, সংলাপ বা স্পষ্ট উপমার মাধ্যমে মূল ধারণাকে পরিষ্কার করুন।
    ২. **বাস্তব জীবনে শিখনফল প্রয়োগ ও আমল (Real-Life Practical Application & Moral Action):**
       - প্রতিটি পাঠ এমনভাবে সাজাতে হবে যেন শিশুরা শুধু মুখস্থ না করে, বরং পাঠ থেকে অর্জিত জ্ঞান বাস্তব জীবনে (দৈনন্দিন আচরণ, শিষ্টাচার, পিতা-মাতা ও শিক্ষকের প্রতি সম্মান, সত্যবাদিতা, পরিচ্ছন্নতা এবং ধর্মীয় আমল) সরাসরি প্রয়োগ করতে পারে।
       - শ্রেণির কাজ (C.W) এবং বাড়ির কাজে (H.W) এমন প্রশ্ন বা কাজ রাখুন যা শিশুর চারিত্রিক ও মনস্তাত্ত্বিক বিকাশে ইতিবাচক প্রভাব ফেলে।
    ৩. **আনন্দময় ও সক্রিয় অংশগ্রহণমূলক শিখন (Playful, Interactive & Experiential Learning):**
       - একপাক্ষিক মুখস্থের বদলে হাত-মুখের সমন্বয়ে কাজ (যেমন: সুন্দর হস্তাক্ষরে লেখা, সহপাঠীর সাথে আলোচনা, মৌখিক উপস্থাপনা, বোর্ডে বা খাতায় চার্ট আঁকা) অন্তর্ভুক্ত করুন।
       - শিক্ষার্থীদের উৎসাহিত করতে স্নেহময় ও ইতিবাচক নির্দেশনামূলক ভাষা ব্যবহার করুন।

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ extended: true, limit: "500mb" }));

  // Helper to initialize Gemini safely
  const getGeminiClient = (req?: express.Request) => {
    let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (req) {
      const clientKey = req.headers['x-gemini-api-key'] || req.headers['x-api-key'];
      if (clientKey && typeof clientKey === 'string' && clientKey.trim()) {
        apiKey = clientKey.trim();
      }
    }

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables or client headers.");
    }

    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // Helper: Get comprehensive child age, cognitive intelligence profile, and pedagogical question rules based on grade level
  const getGradeAgeAndIntellectDetails = (gradeLevel?: string) => {
    const norm = (gradeLevel || '').toLowerCase().trim();
    if (norm.includes('প্রথম') || norm.includes('1') || norm.includes('one')) {
      return {
        grade: 'প্রথম শ্রেণি (Class 1)',
        ageRange: '৫ - ৭ বছর (Ages 5-7)',
        intellectLevel: 'প্রাথমিক ভিত্তি ও চাক্ষুষ ধারণা (Concrete Operational & Visual Recognition)',
        cognitiveCharacteristics: 'স্বল্প মনোযোগের স্থায়িত্ব (Short attention span), বাস্তব দৃশ্যমান বিষয় চেনা, সহজ ও মিষ্টি বাক্য বোঝা, প্রত্যক্ষ তথ্য মনে রাখা। কোনো জটিল তাত্ত্বিক যুক্তি বা দীর্ঘ উত্তর দেওয়ার মতো মানসিক পরিপক্কতা নেই।',
        questionRules: [
          '১. প্রশ্ন ও উত্তরের ভাষা অত্যন্ত সহজ, ছোট ও শিশুতোষ হতে হবে।',
          '২. সরাসরি দৃশ্যমান তথ্য বা চেনা নামের উপর সহজ প্রশ্ন করুন (যেমন: "আমাদের নবীর নাম কী?", "কুরআন কার বাণী?")।',
          '৩. সংক্ষিপ্ত প্রশ্নের উত্তর ১টি বাক্য বা ২-৩টি সহজ শব্দের মধ্যে সীমাবদ্ধ রাখুন।',
          '৪. বহুনির্বাচনীতে অপশনগুলো স্পষ্ট ও বিভ্রান্তিমুক্ত সহজ বিকল্প রাখুন।',
          '৫. কোনো জটিল বিশ্লেষণ বা বিমূর্ত (abstract) তাত্ত্বিক প্রশ্ন করা যাবে না।'
        ]
      };
    } else if (norm.includes('দ্বিতীয়') || norm.includes('2') || norm.includes('two')) {
      return {
        grade: 'দ্বিতীয় শ্রেণি (Class 2)',
        ageRange: '৭ - ৮ বছর (Ages 7-8)',
        intellectLevel: 'প্রাথমিক অনুধাবন ও সহজ কার্যকারণ (Basic Comprehension & Cause-Effect)',
        cognitiveCharacteristics: 'সহজ পূর্ণ বাক্যে উত্তর দিতে পারে, পাঠের সরাসরি ঘটনা ও কারণ বুঝতে পারে, ভালো-মন্দ ও আদব-কায়দা চেনে।',
        questionRules: [
          '১. প্রশ্ন ও উত্তরের ভাষা প্রাঞ্জল ও শিশুবান্ধব হবে।',
          '২. সরাসরি পাঠ্যবইয়ের ঘটনা বা তথ্য থেকে ১-২ বাক্যের প্রশ্ন করুন।',
          '৩. শূন্যস্থান পূরণ ও সত্য-মিথ্যা প্রশ্নগুলো সুস্পষ্ট ও সংক্ষিপ্ত রাখুন।',
          '৪. শিশুদের মেধা বিকাশে সহায়ক মৌলিক নৈতিক ও ধর্মীয় শিষ্টাচারমূলক প্রশ্ন করুন।'
        ]
      };
    } else if (norm.includes('তৃতীয়') || norm.includes('3') || norm.includes('three')) {
      return {
        grade: 'তৃতীয় শ্রেণি (Class 3)',
        ageRange: '৮ - ৯ বছর (Ages 8-9)',
        intellectLevel: 'ধারণাগত বিকাশ ও সংযোগ স্থাপন (Conceptual Growth & Associative Thinking)',
        cognitiveCharacteristics: 'বিষয়বস্তুর মূলভাব বুঝতে পারে, মৌলিক পার্থক্য নির্ণয় করতে পারে, সাধারণ নিয়ম-কানুন ও নৈতিক শিক্ষা মনে রেখে নিজের ভাষায় প্রকাশ করতে পারে।',
        questionRules: [
          '১. সাধারণ তথ্য জানার পাশাপাশি "কেন" ও "কীভাবে" সংক্রান্ত সহজ অনুধাবনমূলক প্রশ্ন যুক্ত করুন।',
          '২. সংক্ষিপ্ত প্রশ্নের উত্তর ২-৩ বাক্যের পরিচ্ছন্ন ব্যাখ্যামূলক হবে।',
          '৩. সত্য-মিথ্যা প্রশ্নে তথ্যের সত্যতা যাচাই এবং মিথ্যা হলে সঠিক তথ্যটি লিখতে বলুন।'
        ]
      };
    } else if (norm.includes('চতুর্থ') || norm.includes('4') || norm.includes('four')) {
      return {
        grade: 'চতুর্থ শ্রেণি (Class 4)',
        ageRange: '৯ - ১০ বছর (Ages 9-10)',
        intellectLevel: 'যৌক্তিক অনুধাবন ও ধারাবাহিক চিন্তন (Logical Reasoning & Sequential Comprehension)',
        cognitiveCharacteristics: 'যুক্তিপূর্ণ চিন্তন, ধারাবাহিক ঘটনা বর্ণনা, বিষয়বস্তুর গুরুত্ব ও তাৎপর্য অনুধাবন এবং ৩-৪ বাক্যে নিজের ভাব প্রকাশের ক্ষমতা।',
        questionRules: [
          '১. বর্ণনামূলক ও বিশ্লেষণমূলক প্রশ্নের অবতারণা করুন (যেমন: ঘটনার তাৎপর্য, শিক্ষণীয় দিক)।',
          '২. বহুনির্বাচনী প্রশ্নগুলোতে চিন্তন উদ্দীপক বিকল্প দিন।',
          '৩. উত্তরগুলো হবে গোছানো, যুক্তিযুক্ত এবং ৩-৪ লাইনের পরিমিত বর্ণনাবিশিষ্ট।'
        ]
      };
    } else if (norm.includes('পঞ্চম') || norm.includes('5') || norm.includes('five')) {
      return {
        grade: 'পঞ্চম শ্রেণি (Class 5)',
        ageRange: '১০ - ১১ বছর (Ages 10-11)',
        intellectLevel: 'সৃজনশীল প্রকাশ ও সামগ্রিক পর্যালোচনা (Creative Expression & Critical Synthesis)',
        cognitiveCharacteristics: 'সমস্যা সমাধান, বিশ্লেষণধর্মী চিন্তা, ইসলামিক আদর্শ ও ব্যবহারিক জীবনের সমন্বয় এবং গভীর অনুধাবন ক্ষমতা।',
        questionRules: [
          '১. সৃজনশীল ও উচ্চতর চিন্তন দক্ষতা (Higher Order Thinking) যাচাইমূলক প্রশ্ন করুন।',
          '২. বর্ণনামূলক প্রশ্নে বিষয়ের গুরুত্ব, প্রেক্ষাপট ও বাস্তব জীবনের প্রয়োগ ব্যাখ্যা করতে বলুন।',
          '৩. দলীল, রেফারেন্স ও নৈতিক শিক্ষা ভিত্তিক সমৃদ্ধ প্রশ্ন অন্তর্ভুক্ত করুন।'
        ]
      };
    } else if (norm.includes('ষষ্ঠ') || norm.includes('6') || norm.includes('six')) {
      return {
        grade: 'ষষ্ঠ শ্রেণি (Class 6)',
        ageRange: '১১ - ১২ বছর (Ages 11-12)',
        intellectLevel: 'বিশ্লেষণাত্মক ও তাত্ত্বিক মেধা (Analytical & Abstract Reasoning)',
        cognitiveCharacteristics: 'গভীর মননশীলতা, ক্রিটিক্যাল থিংকিং, দলীলভিত্তিক সিদ্ধান্ত গ্রহণ, তুলনা ও কারণ অনুসন্ধান ক্ষমতা।',
        questionRules: [
          '১. গভীর অনুধাবন ও বিশ্লেষণমূলক প্রশ্ন প্রস্তুত করুন।',
          '২. তুলনামূলক আলোচনা ও ইতিহাসের তাৎপর্য পর্যালোচনামূলক প্রশ্ন রাখুন।',
          '৩. উত্তরগুলো হবে সমৃদ্ধ, রেফারেন্সসমৃদ্ধ ও যুক্তিপূর্ণ।'
        ]
      };
    } else if (norm.includes('সপ্তম') || norm.includes('7') || norm.includes('seven')) {
      return {
        grade: 'সপ্তম শ্রেণি (Class 7)',
        ageRange: '১২ - ১৩ বছর (Ages 12-13)',
        intellectLevel: 'উচ্চতর অনুধাবন ও যুক্তি প্রয়োগ (Advanced Critical & Jurisprudential Intellect)',
        cognitiveCharacteristics: 'জটিল মাসআলা ও দলীল অনুধাবন, কার্যকারণ বিশ্লেষণ, দীর্ঘ যৌক্তিক আলোচনা ও সিদ্ধান্তমূলক চিন্তন।',
        questionRules: [
          '১. দলীল ও যুক্তিভিত্তিক প্রশ্ন তৈরি করুন।',
          '২. বাস্তব সমস্যা ও তার শরীয়তসম্মত সমাধান বিষয়ক প্রশ্ন রাখুন।',
          '৩. দীর্ঘ ও গবেষণামূলক আলোচনার সুযোগ দিন।'
        ]
      };
    } else if (norm.includes('অষ্টম') || norm.includes('8') || norm.includes('eight')) {
      return {
        grade: 'অষ্টম শ্রেণি (Class 8)',
        ageRange: '১৩ - ১৪+ বছর (Ages 13-14+)',
        intellectLevel: 'গবেষণাধর্মী মেধা ও গভীর প্রজ্ঞা (Research-Oriented & Scholastic Mastery)',
        cognitiveCharacteristics: 'গবেষণাধর্মী বিশ্লেষণ, গভীর শাব্দিক ও ভাবার্থ মূল্যায়ন, উচ্চস্তরের তাত্ত্বিক ও ব্যবহারিক মেধার প্রকাশ।',
        questionRules: [
          '১. গভীর দলীলভিত্তিক ও গবেষণামূলক প্রশ্নপত্র প্রণয়ন করুন।',
          '২. তাত্ত্বিক বিশ্লেষণ ও সিদ্ধান্তমূলক বর্ণনামূলক প্রশ্ন দিন।'
        ]
      };
    } else {
      return {
        grade: gradeLevel || 'পঞ্চম শ্রেণি (Class 5)',
        ageRange: '১০ - ১১ বছর (Ages 10-11)',
        intellectLevel: 'সৃজনশীল প্রকাশ ও সামগ্রিক পর্যালোচনা (Creative Expression)',
        cognitiveCharacteristics: 'বিশ্লেষণধর্মী চিন্তা ও সাধারণ অনুধাবন ক্ষমতা।',
        questionRules: [
          '১. শিক্ষার্থীদের বয়সের উপযোগী প্রাঞ্জল ভাষায় প্রশ্ন করুন।',
          '২. তথ্যের যথার্থতা ও নৈতিক মূল্যবোধ যাচাই করুন।'
        ]
      };
    }
  };

  // API Route: Generate Complete Exercise (অনুশীলনী ও প্রশ্নপত্র তৈরি)
  app.post("/api/generate-exercise", async (req, res) => {
    const { topicTitle, chapterTitle, gradeLevel, content, selectedQuestionTypes, questionCounts, difficulty, additionalInstructions, fileData, mimeType, pageRanges, startPage, endPage, language } = req.body;

    try {
      const ai = getGeminiClient(req);
      const gradeProfile = getGradeAgeAndIntellectDetails(gradeLevel);

      const targetLang = (language === 'ar' || language === 'arabic')
        ? 'ar'
        : (language === 'en' || language === 'english')
        ? 'en'
        : 'bn';

      const activeTypes: string[] = Array.isArray(selectedQuestionTypes) && selectedQuestionTypes.length > 0
        ? selectedQuestionTypes
        : ['short', 'mcq', 'true_false', 'blank', 'essay'];

      const counts = questionCounts || {};
      const shortCount = counts.short || 2;
      const mcqCount = counts.mcq || 4;
      const tfCount = counts.true_false || 3;
      const blankCount = counts.blank || 3;
      const essayCount = counts.essay || 1;
      const matchCount = counts.match || 4;

      const typeInstructionsList: string[] = [];
      if (activeTypes.includes('short')) {
        typeInstructionsList.push(`• সংক্ষিপ্ত উত্তর প্রশ্ন (${shortCount}টি): সংক্ষিপ্ত কিন্তু তথ্যসমৃদ্ধ প্রশ্ন। উত্তর অবশ্যই সঠিক তথ্যসহ ২-৩ লাইনের হতে হবে।`);
      }
      if (activeTypes.includes('mcq')) {
        typeInstructionsList.push(`• বহুনির্বাচনী প্রশ্ন (${mcqCount}টি): ৪টি স্পষ্ট ও যুক্তিযুক্ত বিকল্প (options)। 'answer' ফিল্ডে সঠিক উত্তর এবং 'explanation' ফিল্ডে সংক্ষিপ্ত ব্যাখ্যা থাকবে।`);
      }
      if (activeTypes.includes('true_false')) {
        typeInstructionsList.push(`• সত্য / মিথ্যা যাচাই (${tfCount}টি): 'answer' ফিল্ডে 'সত্য' বা 'মিথ্যা'। মিথ্যা হলে সঠিক বাক্যটি স্পষ্ট করে লিখে দিন।`);
      }
      if (activeTypes.includes('blank')) {
        typeInstructionsList.push(`• শূণ্যস্থান পূরণ (${blankCount}টি): বাক্যে খালি জায়গায় '________' দিন এবং 'answer' ফিল্ডে উপযুক্ত শব্দটি লিখুন।`);
      }
      if (activeTypes.includes('essay')) {
        typeInstructionsList.push(`• ব্যাখ্যামূলক / বর্ণনামূলক প্রশ্ন (${essayCount}টি): গভীর অনুধাবনমূলক প্রশ্ন ও বিস্তারিত আদর্শ নমুনা উত্তর (৩-৫ বাক্য)।`);
      }
      if (activeTypes.includes('match')) {
        typeInstructionsList.push(`• ডান-বাম মিলকরণ (${matchCount} জোড়া): left এবং right অংশ সম্বলিত মিলকরণ প্রশ্ন।`);
      }

      const pageRangeDesc = (pageRanges && Array.isArray(pageRanges) && pageRanges.length > 0)
        ? pageRanges.map((r: any, i: number) => `রেঞ্জ ${i + 1}: পৃষ্ঠা ${r.start} থেকে ${r.end}`).join(", ")
        : (startPage ? `পৃষ্ঠা ${startPage}${endPage ? ` থেকে ${endPage}` : ''}` : '');

      const prompt = `
        আপনি 'মাদরাসাতুস সুন্নাহ'-এর একজন অত্যন্ত অভিজ্ঞ ও সুদক্ষ শিক্ষক ও পরীক্ষক।
        আপনার দায়িত্ব হলো শিক্ষার্থীদের জন্য পাঠ্যবইয়ের নির্দিষ্ট পাঠের ভিত্তিতে একটি সমৃদ্ধ, নির্ভুল ও পূর্ণাঙ্গ অনুশীলনী (Exercise / Assessment) তৈরি করা।

        ========================================================================================================
        **ভাষা সংক্রান্ত অত্যন্ত কঠোর ও অলঙ্ঘনীয় নীতি (STRICT TARGET LANGUAGE MANDATE: ${targetLang.toUpperCase()}):**
        ========================================================================================================
        ${targetLang === 'ar' ? `
        - **লক্ষ্য ভাষা: আরবি (العربية الفصحى بالكامل)**
        - অনুশীলনী, শিরোনাম, প্রতিটি সেকশন টাইটেল (যেমন: "القسم الأول: أسئلة قصيرة", "القسم الثاني: أسئلة الاختيار من متعدد", "القسم الثالث: صح أو خطأ", "القسم الرابع: أكمل الفراغ", "القسم الخامس: أسئلة مقالية", "القسم السادس: التوصيل"), সেকশনের নির্দেশাবলী (যেমন: "أجب عن الأسئلة الآتية باختصار:", "اختر الإجابة الصحيحة مما يأتي:", "بيّن ما إذا كانت العبارة صحيحة أم خاطئة:"), সমস্ত প্রশ্ন, অপশন (أ، ب، ج، د), এবং সমাধান (answer & explanation) **১০০% নিখুঁত আরবি ভাষায় (اللغة العربية الفصحى)** হতে হবে। কোনো বাংলা বা ইংরেজি বাক্য লিখবেন না।
        ` : targetLang === 'en' ? `
        - **লক্ষ্য ভাষা: ENGLISH (100% Comprehensive English)**
        - সমস্ত শিরোনাম, সেকশন টাইটেল (e.g., "Section 1: Short Answer Questions", "Section 2: Multiple Choice Questions (MCQ)", "Section 3: True / False", "Section 4: Fill in the Blanks", "Section 5: Descriptive Questions"), নির্দেশাবলী, সমস্ত প্রশ্ন, অপশন ও সমাধান ১০০% ইংরেজিতে হতে হবে।
        ` : `
        - **লক্ষ্য ভাষা: বাংলা (BENGALI)**
        - সম্পূর্ণ অনুশীলনী, সেকশন টাইটেল, নির্দেশাবলী, প্রশ্ন ও উত্তর ১০০% প্রাঞ্জল ও প্রমিত বাংলায় হতে হবে।
        `}

        **কঠোর নিষেধাজ্ঞা (CRITICAL MANDATORY RULES):**
        ১. [কোনো সারসংক্ষেপ নয়]: পাঠ্যের কোনো সারাংশ বা সামারি (Summary) তৈরি করবেন না। শুধুমাত্র সরাসরি অনুশীলনী ও প্রশ্নপত্র তৈরি করবেন।
        ২. [১০০% পাঠ্যবই নির্ভুলতা]: সমস্ত প্রশ্ন ও উত্তর অবশ্যই প্রদত্ত পাঠের মূল টেক্সট ও নির্ভরযোগ্য তথ্যের সাথে পুরোপুরি সামঞ্জস্যপূর্ণ হতে হবে।
        ৩. [নিখুঁত বানান ও ব্যাকরণ]: কোনো বানান বা ব্যাকরণগত ভুল থাকা যাবে না। আয়াত বা হাদিসের উদ্ধৃতি থাকলে সঠিক হরকত ও রেফারেন্সসহ লিখবেন।
        ৪. [সকল প্রশ্নের উত্তর প্রদান]: কোনো প্রশ্নই উত্তরের সমাধান ছাড়া রাখবেন না। শিক্ষক ও শিক্ষার্থীদের সুবিধার জন্য প্রতিটি প্রশ্নের স্পষ্ট ও নির্ভুল উত্তর 'answer' ফিল্ডে সংযুক্ত করবেন।

        **শ্রেণি ও শিক্ষার্থীর বয়স ও মেধা সংক্রান্ত অপরিহার্য নির্দেশনা (AGE & INTELLECT RULES):**
        • লক্ষ্য শ্রেণি: ${gradeProfile.grade}
        • শিক্ষার্থীর বয়সসীমা: ${gradeProfile.ageRange}
        • মেধা ও চিন্তন স্তর: ${gradeProfile.intellectLevel}
        • মানসিক ও বুদ্ধিবৃত্তিক বৈশিষ্ট্য: ${gradeProfile.cognitiveCharacteristics}
        • এই শ্রেণির বয়স ও মেধার জন্য প্রশ্ন প্রণয়ন নীতি:
          ${gradeProfile.questionRules.join("\n          ")}

        **নাম ও লিঙ্গ নির্ধারণের ডিফল্ট নীতি (Default Gender & Name Rules):**
        - বাংলা নাম ও উদাহরণ: সবসময় পুংলিঙ্গ (Masculine form) ব্যবহৃত হবে (যেমন: ছাত্র, উস্তাদ, আব্দুল্লাহ, উমর, আব্দুর রহমান ইত্যাদি)।
        - ইংরেজি নাম ও উদাহরণ: সবসময় ক্লীবলিঙ্গ/নিরপেক্ষ (Neuter / Gender-neutral form) ব্যবহৃত হবে (যেমন: Student, Learner, Pupil, Child ইত্যাদি)।

        **অধ্যায় ও পাঠের বিবরণ:**
        • অধ্যায়: ${chapterTitle || "সাধারণ অধ্যায়"}
        • পাঠ/বিষয়: ${topicTitle || "ইসলামিক স্টাডিজ পাঠ"}
        • শ্রেণি: ${gradeLevel || "পঞ্চম শ্রেণি"}
        • কঠিনতার মাত্রা: ${difficulty === 'hard' ? 'উচ্চতর দক্ষতা' : difficulty === 'medium' ? 'মাঝারি' : 'সহজ ও বোধগম্য'}
        ${pageRangeDesc ? `• নির্বাচিত পৃষ্ঠা সীমা (Selected Page Ranges): ${pageRangeDesc}` : ''}
        ${additionalInstructions ? `• বিশেষ নির্দেশনা: ${additionalInstructions}` : ''}

        **পাঠ্যবইয়ের বিষয়বস্তু (Text Content):**
        ${content || "বইয়ের সংশ্লিষ্ট পাঠের বিষয়বস্তু বিশ্লেষণ করে অনুশীলনী তৈরি করুন।"}

        **তৈরি করার জন্য নির্বাচিত প্রশ্নের ধরনসমূহ:**
        ${typeInstructionsList.join("\n        ")}

        ফলাফলটি শুধুমাত্র এবং শুধুমাত্র নিচের JSON স্কিমা অনুযায়ী বইটির নিজস্ব ভাষায় দিন (কোনো অতিরিক্ত টেক্সট বা মার্কডাউন ব্যাকটিক ছাড়া):
        {
          "title": "অনুশীলনী: ${topicTitle}",
          "gradeLevel": "${gradeLevel || "পঞ্চম শ্রেণি"}",
          "subject": "ইসলামিক স্টাডিজ",
          "chapterTitle": "${chapterTitle || ""}",
          "topicTitle": "${topicTitle || ""}",
          "totalMarks": 25,
          "estimatedTime": "৩০ মিনিট",
          "sections": [
            {
              "type": "short",
              "title": "১. সংক্ষিপ্ত উত্তর প্রশ্ন / القسم الأول: أسئلة قصيرة",
              "instructions": "নিচের প্রশ্নগুলোর সংক্ষেপে সঠিক উত্তর দাও / أجب عن الأسئلة الآتية باختصار:",
              "totalMarks": 6,
              "questions": [
                {
                  "id": "q1",
                  "type": "short",
                  "question": "...",
                  "answer": "...",
                  "points": 3
                }
              ]
            }
          ]
        }
      `;

      const parts: any[] = [{ text: prompt }];

      if (fileData && mimeType) {
        const base64Str = fileData.includes(',') ? fileData.split(',')[1] : fileData;
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Str
          }
        });
      }

      const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let result = null;
      let success = false;
      let lastError: any = null;

      for (let i = 0; i < modelsToTry.length; i++) {
        const currentModel = modelsToTry[i];
        try {
          console.log(`Generating exercise with model: ${currentModel}`);
          if (i > 0) {
            await new Promise(r => setTimeout(r, 1000));
          }

          result = await ai.models.generateContent({
            model: currentModel,
            contents: { parts: parts },
            config: {
              systemInstruction: "আপনি একজন বিশেষজ্ঞ ইসলামিক স্টাডিজ শিক্ষক ও পরীক্ষক। আপনি শুধুমাত্র এবং শুধুমাত্র ভ্যালিড JSON ফরম্যাটে উত্তর দিন। কোনো সারসংক্ষেপ বা অনাকাঙ্ক্ষিত ভূমিকা লিখবেন না। সব প্রশ্নের সঠিক উত্তর প্রদান করবেন।",
              responseMimeType: "application/json",
              temperature: 0.2
            }
          });

          success = true;
          break;
        } catch (err: any) {
          console.error(`Error generating exercise with model ${currentModel}:`, err);
          lastError = err;
        }
      }

      if (!success || !result) {
        throw lastError || new Error("সকল মডেল এপিআই কল ব্যর্থ হয়েছে।");
      }

      const parsed = JSON.parse(result.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Error in generate-exercise endpoint:", error);
      let userFriendlyMessage = error.message || "অনুশীলনী তৈরি করতে সমস্যা হয়েছে।";
      if (userFriendlyMessage.includes("503") || userFriendlyMessage.includes("UNAVAILABLE") || userFriendlyMessage.includes("high demand") || userFriendlyMessage.includes("limit") || userFriendlyMessage.includes("exhausted")) {
        userFriendlyMessage = "জেমিনি এআই সার্ভার সাময়িকভাবে অতিরিক্ত চাপের মধ্যে রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
      }
      res.status(500).json({ error: userFriendlyMessage });
    }
  });

  // API Route: Generate lesson plan stream
  app.post("/api/generate-lesson-plan", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const request = req.body;

    const sendEvent = (type: string, data: any) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    try {
      const ai = getGeminiClient(req);
      sendEvent("progress", { progress: 10, message: "সিলেবাস এবং দিনের সংখ্যা বিশ্লেষণ করা হচ্ছে..." });

      const pageRangeDesc = request.pageRanges && request.pageRanges.length > 0
        ? request.pageRanges.map((r: any, i: number) => `রেঞ্জ ${i + 1}: পৃষ্ঠা ${r.start} থেকে ${r.end}`).join(", ")
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

      let prompt = `
        শ্রেণি: ${request.gradeLevel}
        দিনের সংখ্যা: ${request.duration} দিন
        পৃষ্ঠা সীমা বা সিলেবাস বিবরণী: ${pageRangeDesc}
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

      sendEvent("progress", { progress: 30, message: "বুদ্ধিদীপ্ত পাঠ পরিকল্পনা তৈরি করা হচ্ছে..." });

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
      let success = false;
      let lastError: any = null;

      for (let i = 0; i < modelsToTry.length; i++) {
        const currentModel = modelsToTry[i];
        try {
          console.log(`Attempting generateContentStream with model on server: ${currentModel}`);
          if (i > 0) {
            sendEvent("progress", { progress: 30 + i * 5, message: `বিকল্প মডেলে চেষ্টা করা হচ্ছে (${currentModel})...` });
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

          for await (const chunk of responseStream) {
            const text = chunk.text || "";
            sendEvent("chunk", { text });
          }

          success = true;
          break;
        } catch (err: any) {
          console.error(`Error with model ${currentModel} during server-side stream generation:`, err);
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

      sendEvent("progress", { progress: 100, message: "সম্পন্ন!" });
      res.end();
    } catch (error: any) {
      console.error("Error in generate-lesson-plan endpoint:", error);
      let userFriendlyMessage = error.message || "রুটিন তৈরি করতে সমস্যা হয়েছে।";
      if (userFriendlyMessage.includes("503") || userFriendlyMessage.includes("UNAVAILABLE") || userFriendlyMessage.includes("high demand") || userFriendlyMessage.includes("limit") || userFriendlyMessage.includes("exhausted")) {
        userFriendlyMessage = "জেমিনি এআই সার্ভার সাময়িকভাবে অতিরিক্ত চাপের মধ্যে রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
      }
      sendEvent("error", { message: userFriendlyMessage });
      res.end();
    }
  });

  // API Route: Regenerate single day content
  app.post("/api/regenerate-day", async (req, res) => {
    const { request, date, previousContent } = req.body;

    try {
      const ai = getGeminiClient(req);

      const pageRangeDesc = request.pageRanges && request.pageRanges.length > 0
        ? request.pageRanges.map((r: any, i: number) => `রেঞ্জ ${i + 1}: পৃষ্ঠা ${r.start} থেকে ${r.end}`).join(", ")
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
      let result = null;
      let success = false;
      let lastError: any = null;

      for (let i = 0; i < modelsToTry.length; i++) {
        const currentModel = modelsToTry[i];
        try {
          console.log(`Attempting to regenerate single day with model: ${currentModel}`);
          if (i > 0) {
            await new Promise(r => setTimeout(r, 1000));
          }

          result = await ai.models.generateContent({
            model: currentModel,
            contents: { parts: parts },
            config: {
              systemInstruction: "আপনি একজন মাদরাসার অভিজ্ঞ শিক্ষক। আপনি শুধু এবং শুধুমাত্র JSON উত্তর দিন।",
              responseMimeType: "application/json"
            }
          });

          success = true;
          break;
        } catch (err: any) {
          console.error(`Error regenerating single day with model ${currentModel}:`, err);
          lastError = err;
        }
      }

      if (!success || !result) {
        throw lastError || new Error("সকল মডেল এপিআই কল ব্যর্থ হয়েছে।");
      }

      const parsed = JSON.parse(result.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Error in regenerate-day endpoint:", error);
      let userFriendlyMessage = error.message || "পুনরায় তৈরি করতে সমস্যা হয়েছে।";
      if (userFriendlyMessage.includes("503") || userFriendlyMessage.includes("UNAVAILABLE") || userFriendlyMessage.includes("high demand") || userFriendlyMessage.includes("limit") || userFriendlyMessage.includes("exhausted")) {
        userFriendlyMessage = "জেমিনি এআই সার্ভার সাময়িকভাবে অতিরিক্ত চাপের মধ্যে রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
      }
      res.status(500).json({ error: userFriendlyMessage });
    }
  });

  // API Route: Generate quiz questions based on lesson content
  app.post("/api/generate-quiz", async (req, res) => {
    const { lessonContent, gradeLevel, questionCount, questionTypes, questionType, difficulty, additionalInstructions } = req.body;

    try {
      const ai = getGeminiClient(req);
      
      // Determine active selected types
      let activeTypes: string[] = [];
      if (Array.isArray(questionTypes) && questionTypes.length > 0) {
        activeTypes = questionTypes;
      } else if (questionType) {
        if (questionType === "mix") {
          activeTypes = ["mcq", "short", "true_false", "essay", "blank"];
        } else {
          activeTypes = [questionType];
        }
      } else {
        activeTypes = ["mcq"];
      }

      const typeDescriptions: Record<string, string> = {
        mcq: "বহুনির্বাচনী প্রশ্ন (MCQ - ৪টি অপশনসহ, সঠিক উত্তরটি 'answer' ফিল্ডে থাকতে হবে এবং 'type' ফিল্ড 'mcq' হতে হবে)",
        short: "সংক্ষিপ্ত উত্তর প্রশ্ন (যার সাথে একটি আদর্শ উত্তর 'answer' ফিল্ডে থাকবে, উত্তরটি কমপক্ষে ২ লাইনের হতে হবে এবং 'type' ফিল্ড 'short' হতে হবে)",
        true_false: "সত্য/মিথ্যা প্রশ্ন (যার সঠিক উত্তর 'সত্য' অথবা 'মিথ্যা' হবে এবং 'answer' ফিল্ডে থাকবে এবং 'type' ফিল্ড 'true_false' হতে হবে। যদি বিবৃতিটি মিথ্যা হয়, তবে উত্তরের সাথে সঠিক তথ্যটি উল্লেখ করে দিতে হবে)",
        essay: "রচনামূলক / বর্ণনামূলক / আলোচনাভিত্তিক প্রশ্ন (Discussion / Essay - বর্ণনামূলক প্রশ্ন, যার সাথে একটি আদর্শ উত্তর 'answer' ফিল্ডে থাকবে, উত্তরটি কমপক্ষে ৩-৪ লাইনের হতে হবে এবং 'type' ফিল্ড 'essay' হতে হবে)",
        blank: "শূণ্যস্থান পূরণ প্রশ্ন (Fill in the blank - বাক্যে একটি শূন্যস্থান '______' থাকবে এবং সঠিক উত্তরটি 'answer' ফিল্ডে থাকবে এবং 'type' ফিল্ড 'blank' হতে হবে)"
      };

      const selectedTypeTextList = activeTypes.map(t => `• ${typeDescriptions[t] || t}`).join("\n        ");
      const gradeProfile = getGradeAgeAndIntellectDetails(gradeLevel);
      
      let difficultyText = "";
      if (difficulty === "easy") {
        difficultyText = "সহজ (প্রাথমিক স্তরের ও সরাসরি তথ্যভিত্তিক)";
      } else if (difficulty === "medium") {
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
          answer: "ঈমানের প্রধান সাতটি স্তম্ভ হলো আল্লাহর প্রতি বিশ্বাস, ফেরেশতাগণ, কিতাবসমূহ, রাসূলগণ, পরকাল, তকদির এবং মৃত্যুর পর পুনরুত্থান। প্রতিটি মুমিনের জন্য এগুলোর ওপর বিশ্বাস স্থাপন করা আবশ্যক।"
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

      const prompt = `
        আপনি একজন মাদরাসার অভিজ্ঞ ও বিচক্ষণ শিক্ষক ও পরীক্ষক। নিচের বই/পাঠ্য বা পাঠ পরিকল্পনার ভিত্তিতে শিক্ষার্থীদের জন্য একটি মানসম্মত ও সুনির্দিষ্ট কুইজ বা মূল্যায়ন পত্র তৈরি করুন।

        ========================================================================================================
        **ভাষা সংক্রান্ত অত্যন্ত কঠোর ও অলঙ্ঘনীয় নীতি (STRICT SOURCE-LANGUAGE FIDELITY RULE - MANDATORY):**
        ========================================================================================================
        ১. **আরবি বই বা কিতাব হলে (Arabic Book / كتاب باللغة العربية / كتب تعليم اللغة العربية للأطفال):**
           - যদি বইটি আরবি ভাষায় রচিত হয় বা আরবি ভাষা শেখানোর উদ্দেশ্যে তৈরি হয়:
           - সম্পূর্ণ কুইজের শিরোনাম (quizTitle), সমস্ত প্রশ্ন (questions), বহুনির্বাচনী অপশন (options: أ، ب، ج، د), সত্য/মিথ্যা (صحيح / خطأ), এবং আদর্শ উত্তরমালা (answer) **১০০% নিখুঁত ও বিশুদ্ধ আরবি ভাষায় (اللغة العربية الفصحى بالكامل)** তৈরি করতে হবে।
           - কোনো বাংলা বা ইংরেজি বাক্য বা শব্দ ব্যবহার করবেন না।

        ২. **ইংরেজি বই হলে (English Book / Subject):**
           - সম্পূর্ণ কুইজ, প্রশ্নের শিরোনাম, অপশন ও উত্তর ১০০% প্রাঞ্জল ইংরেজিতে হতে হবে।

        ৩. **বাংলা বই হলে (Bengali Book):**
           - সম্পূর্ণ কুইজ বাংলায় হতে হবে।
        
        পাঠ বা রুটিন বিবরণী (বইয়ের মূল বিষয়বস্তু):
        ${lessonContent}
        
        **শিক্ষার্থীর বয়স ও মেধার স্তর সংক্রান্ত অপরিহার্য নির্দেশনা (AGE & INTELLECT RULES):**
        • লক্ষ্য শ্রেণি: ${gradeProfile.grade}
        • শিক্ষার্থীর বয়সসীমা: ${gradeProfile.ageRange}
        • মেধা ও চিন্তন স্তর: ${gradeProfile.intellectLevel}
        • মানসিক ও বুদ্ধিবৃত্তিক বৈশিষ্ট্য: ${gradeProfile.cognitiveCharacteristics}
        • এই শ্রেণির বয়স ও মেধার জন্য প্রশ্ন প্রণয়ন নীতি:
          ${gradeProfile.questionRules.join("\n          ")}

        **নাম ও লিঙ্গ নির্ধারণের ডিফল্ট নীতি (Default Gender & Name Rules):**
        - বাংলা নাম ও উদাহরণ: সবসময় পুংলিঙ্গ (Masculine form) ব্যবহৃত হবে (যেমন: ছাত্র, উস্তাদ, আব্দুল্লাহ, উমর, আব্দুর রহমান ইত্যাদি)।
        - ইংরেজি নাম ও উদাহরণ: সবসময় ক্লীবলিঙ্গ/নিরপেক্ষ (Neuter / Gender-neutral form) ব্যবহৃত হবে (যেমন: Student, Learner, Pupil, Child ইত্যাদি)।

        শ্রেণি: ${gradeLevel}
        প্রশ্নের মোট সংখ্যা: ${questionCount} টি
        নির্বাচিত প্রশ্নের ধরনসমূহ (${activeTypes.length}টি প্রকার):
        ${selectedTypeTextList}
        কঠিনতার স্তর: ${difficultyText}
        ${additionalInstructions ? `অতিরিক্ত বিশেষ নির্দেশনা: ${additionalInstructions}` : ""}
        
        অত্যন্ত গুরুত্বপূর্ণ ও আবশ্যিক নির্দেশাবলী:
        ১. [কঠোর শর্ত - বই থেকে প্রশ্ন ও উত্তর]: সমস্ত প্রশ্ন এবং এর উত্তর অবশ্যই ১০০% প্রদত্ত পাঠ্য/বইয়ের বিষয়বস্তু থেকে হতে হবে। বইয়ের বাইরের কোনো অপ্রাসঙ্গিক বা কাল্পনিক প্রশ্ন বা উত্তর তৈরি করা সম্পূর্ণ নিষিদ্ধ।
        ২. [কঠোর শর্ত - নির্বাচিত ধরনের বাইরে প্রশ্ন নিষিদ্ধ]: কুইজে শুধুমাত্র ব্যবহারকারীর নির্বাচিত (${activeTypes.join(', ')}) প্রকারের প্রশ্নই থাকতে হবে। এর বাইরের কোনো প্রকারের প্রশ্ন ১টিও তৈরি করা যাবে না। 
           - উদাহরণ: যদি শুধুমাত্র 'mcq' নির্বাচিত থাকে, তবে সব কয়টি (${questionCount}টি) প্রশ্নই অবশ্যই বহুনির্বাচনী (MCQ) হতে হবে; কোনো সংক্ষিপ্ত বা সত্য/মিথ্যা প্রশ্ন তৈরি করা যাবে না।
           - যদি একাধিক ধরন নির্বাচিত থাকে (যেমন MCQ ও রচনামূলক), তবে মোট প্রশ্নের মধ্যে এই নির্বাচিত ধরনগুলো সমবণ্টন করুন।
        ৩. প্রশ্নের শুরুতে কোনো ক্রমিক নম্বর (যেমন ১., 2., ক ইত্যাদি) যুক্ত করবেন না। প্রশ্ন টেক্সট সরাসরি প্রশ্ন দিয়ে শুরু করুন।
        ৪. MCQ প্রশ্নের ক্ষেত্রে অবশ্যই ৪টি অপশন ("options" নামক অ্যারেতে) প্রদান করুন এবং 'answer' ফিল্ডে সঠিক অপশনটি লিখুন।
        ৫. সত্য/মিথ্যা প্রশ্নের ক্ষেত্রে 'answer' ফিল্ডে সঠিক উত্তর (আরবিতে 'صحيح' অথবা 'خطأ', বাংলায় 'সত্য' অথবা 'মিথ্যা', ইংরেজিতে 'True' অথবা 'False') লিখুন। বিবৃতিটি মিথ্যা হলে সঠিক বাক্যটিও উত্তরের সাথে যুক্ত করে দিন।
        ৬. সংক্ষিপ্ত প্রশ্নের ক্ষেত্রে উত্তরটি কমপক্ষে ২ লাইনের তথ্যপূর্ণ হতে হবে।
        ৭. রচনামূলক প্রশ্নের ক্ষেত্রে উত্তরটি কমপক্ষে ৩-৪ লাইনের বিস্তারিত আলোচনা হতে হবে।
        ৮. শূণ্যস্থান পূরণ প্রশ্নের ক্ষেত্রে প্রশ্নে '______' খালি জায়গা রাখুন এবং 'answer' ফিল্ডে সঠিক শব্দটি লিখুন।
        ৯. উত্তরটি শুধুমাত্র এবং শুধুমাত্র নিচের JSON ফরম্যাটে বইটির মূল ভাষায় দিন। কোনো অতিরিক্ত কথা বা মার্কডাউন ব্যাকটিক দেবেন না:
        
        {
          "quizTitle": "কুইজের একটি আকর্ষণীয় ও প্রাসঙ্গিক শিরোনাম / عنوان الاختبار المناسب",
          "questions": ${JSON.stringify(sampleQuestions, null, 2)}
        }
      `;

      const parts = [{ text: prompt }];
      const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let result = null;
      let success = false;
      let lastError: any = null;

      for (let i = 0; i < modelsToTry.length; i++) {
        const currentModel = modelsToTry[i];
        try {
          console.log(`Attempting to generate quiz with model: ${currentModel}`);
          if (i > 0) {
            await new Promise(r => setTimeout(r, 1000));
          }

          result = await ai.models.generateContent({
            model: currentModel,
            contents: { parts: parts },
            config: {
              systemInstruction: "আপনি একজন মাদরাসার অভিজ্ঞ শিক্ষক। আপনি শুধু এবং শুধুমাত্র সঠিক JSON উত্তর দিন। বইয়ের বিষয়বস্তুর বাইরে কোনো তথ্য বা অপ্রাসঙ্গিক প্রশ্ন তৈরি করবেন না। নির্বাচিত প্রশ্নের ধরনের বাইরে অন্য কোনো প্রকার প্রশ্ন তৈরি করবেন না।",
              responseMimeType: "application/json",
              temperature: 0.2
            }
          });

          success = true;
          break;
        } catch (err: any) {
          console.error(`Error generating quiz with model ${currentModel}:`, err);
          lastError = err;
        }
      }

      if (!success || !result) {
        throw lastError || new Error("সকল মডেল এপিআই কল ব্যর্থ হয়েছে।");
      }

      let parsed = JSON.parse(result.text || "{}");
      
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

      res.json(parsed);
    } catch (error: any) {
      console.error("Error in generate-quiz endpoint:", error);
      let userFriendlyMessage = error.message || "কুইজ তৈরি করতে সমস্যা হয়েছে।";
      if (userFriendlyMessage.includes("503") || userFriendlyMessage.includes("UNAVAILABLE") || userFriendlyMessage.includes("high demand") || userFriendlyMessage.includes("limit") || userFriendlyMessage.includes("exhausted")) {
        userFriendlyMessage = "জেমিনি এআই সার্ভার সাময়িকভাবে অতিরিক্ত চাপের মধ্যে রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
      }
      res.status(500).json({ error: userFriendlyMessage });
    }
  });

  // API Route: Generate Detailed Pedagogical Lesson Plan (মাদরাসাতুস সুন্নাহ বিস্তারিত পাঠ পরিকল্পনা - 100% Template Match)
  app.post("/api/generate-detailed-plan", async (req, res) => {
    const { topicTitle, chapterTitle, gradeLevel, subject, teacherName, totalDurationMinutes, planDays, content, teachingMethodology, additionalInstructions, fileData, mimeType, pageRanges, startPage, endPage, language } = req.body;

    try {
      const ai = getGeminiClient(req);

      const duration = totalDurationMinutes || 30;
      const effectivePlanDays = planDays || 1;
      const effectiveClass = gradeLevel || "KG";
      const effectiveSubject = subject || "English (Literacy)";
      const effectiveTopic = topicTitle || "Colors (Red, Blue, Yellow)";
      const effectiveTeacher = teacherName || "Kabir Ustadh";

      const pageRangeDesc = (pageRanges && Array.isArray(pageRanges) && pageRanges.length > 0)
        ? pageRanges.map((r: any, i: number) => `রেঞ্জ ${i + 1}: পৃষ্ঠা ${r.start} থেকে ${r.end}`).join(", ")
        : (startPage ? `পৃষ্ঠা ${startPage}${endPage ? ` থেকে ${endPage}` : ''}` : '');

      const effectiveLang = (language === 'ar' || language === 'arabic')
        ? 'ar'
        : (language === 'en' || language === 'english')
        ? 'en'
        : 'bn';

      const langRule = effectiveLang === 'ar'
        ? `========================================================================================================
        **ব্যবহারকারীর নির্বাচিত ভাষা: আরবি (MANDATORY LANGUAGE: ARABIC / اللغة العربية الفصحى بالكامل)**
        ========================================================================================================
        - ব্যবহারকারী স্পষ্টভাবে পাঠ পরিকল্পনার ভাষা হিসেবে **العربية (আরবি)** নির্বাচন করেছেন।
        - পাঠ পরিকল্পনার সবকিছু (A to Z) ১০০% নিখুঁত ও বিশুদ্ধ আরবি ভাষায় (اللغة العربية الفصحى بالكامل) তৈরি করতে হবে।
        - সকল ফিল্ড (className, topic, subject, materials, learningObjective, successCriteria, procedures, stageAndTime, activityTitle, procedurePoints, childrenDo, teacherDoes, symbolKeys meanings) আরবি ভাষায় হবে।`
        : effectiveLang === 'en'
        ? `========================================================================================================
        **ব্যবহারকারীর নির্বাচিত ভাষা: ইংরেজি (MANDATORY LANGUAGE: ENGLISH / English Language Only)**
        ========================================================================================================
        - The user explicitly selected **English** as the language for this lesson plan.
        - Create the ENTIRE lesson plan strictly in professional, clear English.
        - All metadata, learning objectives, success criteria, classroom stages, teacher/student actions, materials, and notes must be in English.`
        : `========================================================================================================
        **ব্যবহারকারীর নির্বাচিত ভাষা: বাংলা (MANDATORY LANGUAGE: BENGALI / ১০০% প্রমিত বাংলা)**
        ========================================================================================================
        - ব্যবহারকারী পাঠ পরিকল্পনার ভাষা হিসেবে **বাংলা (Bengali)** নির্বাচন করেছেন।
        - সম্পূর্ণ পাঠ পরিকল্পনা ১০০% প্রমিত বাংলা ভাষায় তৈরি করতে হবে।
        - বাংলায় শিখনফল অবশ্যই "পাঠ শেষে শিক্ষার্থীরা..." দিয়ে শুরু হবে এবং সাফল্য নির্ণায়ক "সাফল্য নির্ণায়ক: আমি পারি:" দিয়ে শুরু হবে।
        - শিক্ষক কার্যক্রম, শিক্ষার্থী কার্যক্রম এবং ধাপসমূহ বাংলায় হবে।`;

      const prompt = `
        You are a master teacher trainer and curriculum developer at Madrasatus Sunnah.
        Create an exact 100% copy-to-copy Lesson Plan matching the official "Lesson Plan Template" standard.

        ${langRule}

        **Input Details:**
        • Class: ${effectiveClass}
        • Subject: ${effectiveSubject}
        • Topic: ${effectiveTopic}${effectivePlanDays > 1 ? ` (${effectivePlanDays}-Day Detailed Plan)` : ''}
        • Teacher's Name: ${effectiveTeacher}
        • Duration per Session: ${duration} mins
        • Plan Scope / Total Days: ${effectivePlanDays} Day(s)
        • Chapter/Context: ${chapterTitle || "General"}
        ${pageRangeDesc ? `• Selected Page Range(s) / পৃষ্ঠা সীমা: ${pageRangeDesc}` : ''}
        • Content / Textbook Context: ${content || "Analyze the topic to create the full lesson plan."}
        ${additionalInstructions ? `• Special Instructions: ${additionalInstructions}` : ''}

        **Template Structural Rules:**
        1. **Metadata Grid**:
           - Class, Topic, Subject, Teacher's Name, Duration, Materials (relevant to the topic, in the same language as the book/subject).
        2. **Learning Objective**:
           - Clear, measurable outcomes in the source language.
        3. **Success Criteria**:
           - 3 actionable bullet/numbered items in the source language.
        4. **Lesson Procedure (4 Standard Stages)**:
           - Stage 1: Lead in / warm-up (3-5 mins)
           - Stage 2: Main activity (15-20 mins)
           - Stage 3: Practice / play (10 mins)
           - Stage 4: Review (5 mins)
           - Each stage must specify:
             - "stageAndTime": e.g. "Lead in / warm-up\\n3-5 minutes" or "প্রারম্ভিক আলোচনা / ওয়ার্ম-আপ\\n৩-৫ মিনিট"
             - "activityTitle": concise activity title in source language
             - "procedurePoints": list of teacher actions and classroom instructions
             - "childrenDo": what students physically/verbally do
             - "teacherDoes": what teacher does
             - "intPattern": Interaction pattern codes (e.g., "W/C\\nC / O", "W/C\\nS", "GW\\nS", "PW", "W/C")
             - "aids": Teaching aids codes (e.g., "SB\\nC / O", "Flashcards\\n& toys", "Objects", "SB", "TB", "W/S")
        5. **Key to Symbols**:
           - Interaction patterns & Aids.

        Provide your output ONLY as valid JSON matching this schema:
        {
          "className": "${effectiveClass}",
          "topic": "${effectiveTopic}",
          "subject": "${effectiveSubject}",
          "teacherName": "${effectiveTeacher}",
          "duration": "${duration} mins",
          "materials": "Relevant materials in the book's language",
          "learningObjective": "Learning objective in the book's language",
          "successCriteria": [
            "1. Criterion 1",
            "2. Criterion 2",
            "3. Criterion 3"
          ],
          "procedures": [
            {
              "stageAndTime": "Lead in / warm-up\\n3-5 minutes",
              "activityTitle": "Activity title in book's language",
              "procedurePoints": [
                "Teacher action 1",
                "Teacher action 2"
              ],
              "childrenDo": "Student action in book's language",
              "teacherDoes": "Teacher action in book's language",
              "intPattern": "W/C\\nC / O",
              "aids": "SB\\nC / O"
            },
            {
              "stageAndTime": "Main activity\\n15-20 minutes",
              "activityTitle": "Activity title in book's language",
              "procedurePoints": [
                "Teacher action 1",
                "Teacher action 2"
              ],
              "childrenDo": "Student action",
              "teacherDoes": "Teacher action",
              "intPattern": "W/C\\nS",
              "aids": "Flashcards\\n& toys"
            },
            {
              "stageAndTime": "Practice / play\\n10 minutes",
              "activityTitle": "Activity title in book's language",
              "procedurePoints": [
                "Practice step 1",
                "Practice step 2"
              ],
              "childrenDo": "Student action",
              "teacherDoes": "Teacher action",
              "intPattern": "GW\\nS",
              "aids": "Objects"
            },
            {
              "stageAndTime": "Review\\n5 minutes",
              "activityTitle": "Activity title in book's language",
              "procedurePoints": [
                "Review point 1",
                "Review point 2"
              ],
              "childrenDo": "Student action",
              "teacherDoes": "Teacher action",
              "intPattern": "W/C",
              "aids": "SB"
            }
          ],
          "symbolKeys": {
            "intKeys": [
              { "symbol": "W/C", "meaning": "whole class" },
              { "symbol": "PW", "meaning": "Pair work" },
              { "symbol": "GW", "meaning": "Group work" },
              { "symbol": "S", "meaning": "students work individually" }
            ],
            "aidsKeys": [
              { "symbol": "SB", "meaning": "Smartboard" },
              { "symbol": "TB", "meaning": "Textbook" },
              { "symbol": "W/S", "meaning": "Worksheet" }
            ]
          }
        }
      `;

      const parts: any[] = [{ text: prompt }];

      if (fileData && mimeType) {
        const base64Str = fileData.includes(',') ? fileData.split(',')[1] : fileData;
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Str
          }
        });
      }

      const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let result = null;
      let success = false;
      let lastError: any = null;

      for (let i = 0; i < modelsToTry.length; i++) {
        const currentModel = modelsToTry[i];
        try {
          console.log(`Attempting to generate detailed lesson plan with model: ${currentModel}`);
          if (i > 0) {
            await new Promise(r => setTimeout(r, 1000));
          }

          result = await ai.models.generateContent({
            model: currentModel,
            contents: { parts: parts },
            config: {
              systemInstruction: "আপনি একজন বিশেষজ্ঞ শিক্ষক প্রশিক্ষক ও পেডাগোজিক্যাল গবেষক। আপনি শুধুমাত্র সঠিক এবং সম্পূর্ণ JSON উত্তর দিন।",
              responseMimeType: "application/json",
              temperature: 0.2
            }
          });

          success = true;
          break;
        } catch (err: any) {
          console.error(`Error generating detailed lesson plan with model ${currentModel}:`, err);
          lastError = err;
        }
      }

      if (!success || !result) {
        throw lastError || new Error("বিস্তারিত পাঠ পরিকল্পনা তৈরি করতে মডেল ব্যর্থ হয়েছে।");
      }

      const parsed = JSON.parse(result.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Error in generate-detailed-plan endpoint:", error);
      let userFriendlyMessage = error.message || "বিস্তারিত পাঠ পরিকল্পনা তৈরি করতে সমস্যা হয়েছে।";
      if (userFriendlyMessage.includes("503") || userFriendlyMessage.includes("UNAVAILABLE") || userFriendlyMessage.includes("high demand") || userFriendlyMessage.includes("limit") || userFriendlyMessage.includes("exhausted")) {
        userFriendlyMessage = "জেমিনি এআই সার্ভার সাময়িকভাবে অতিরিক্ত চাপের মধ্যে রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।";
      }
      res.status(500).json({ error: userFriendlyMessage });
    }
  });

  // API Route: Extract Table of Contents (সূচিপত্র) from PDF / Document
  app.post("/api/extract-pdf-toc", async (req, res) => {
    const { fileData, mimeType, extractedText, fileName } = req.body;

    try {
      const ai = getGeminiClient(req);

      const prompt = `
        আপনি একজন অভিজ্ঞ শিক্ষাবিদ ও পাঠ্যবই গবেষক।
        প্রদত্ত পিডিএফ বা টেক্সট থেকে বইটির পূর্ণাঙ্গ এবং গোছানো 'সূচিপত্র' (Table of Contents / সূচি) বের করে কাঠামোবদ্ধ JSON আকারে সাজান।

        **ফাইলের নাম:** ${fileName || "পাঠ্যবই.pdf"}

        **কঠোর নির্দেশনাবলী:**
        ১. [ভাষা নির্ধারণ]: বইটি যে ভাষায় রচিত (বাংলা হলে সম্পূর্ণ বাংলা, ইংরেজি হলে সম্পূর্ণ ইংরেজি, আরবি হলে আরবি), ঠিক সেই ভাষাতেই অধ্যায়ের নাম, পাঠ ও সারসংক্ষেপ লিখবেন। ইংরেজি বই হলে অধ্যায় ও টপিকের শিরোনাম এবং 'contentExcerpt' ইংরেজিতেই থাকবে।
        ২. বইটির প্রতিটি অধ্যায় (Chapter) এবং অধ্যায়ের অধীনে থাকা পাঠ বা পরিচ্ছেদসমূহ (Topics) যথাযথ নাম, বিষয় ও পৃষ্ঠা নম্বর (Page Number) সহ বের করুন।
        ৩. যদি কোনো পাঠের সংক্ষিপ্ত বিবরণ বা সারসংক্ষেপ থাকে, তা 'contentExcerpt' ফিল্ডে ১-২ লাইনে বইটির নিজস্ব ভাষায় যুক্ত করুন।
        ৪. অধ্যায় ও পাঠের ক্রম নির্ভুল রাখুন।
        ৫. কোনো অতিরিক্ত কথা ছাড়া শুধুমাত্র এবং শুধুমাত্র নিচের JSON স্কিমায় বৈধ JSON আকারে উত্তর দিন (কোনো কোডব্লক বা ব্যাখ্যা ছাড়া)।

        **প্রত্যাশিত JSON ফরম্যাট:**
        {
          "bookTitle": "বইয়ের নাম বা বিষয় (বইয়ের ভাষায়)",
          "gradeLevel": "শ্রেণি (যেমন: ১ম শ্রেণি, ২য় শ্রেণি, ৩য় শ্রেণি, ৪র্থ শ্রেণি, ৫ম শ্রেণি, ৬ষ্ঠ শ্রেণি ইত্যাদি)",
          "category": "বইয়ের বিভাগ/বিষয় (যেমন: কুরআন ও তাফসির, হাদিস, আকাইদ ও ফিকহ, আরবি ভাষা, বাংলা, ইংরেজি, গণিত, বিজ্ঞান, সাধারণ বিষয় ইত্যাদি)",
          "language": "বইয়ের ভাষা ('bn', 'en', অথবা 'ar')",
          "chapters": [
            {
              "id": "ch_1",
              "title": "প্রধান অধ্যায়/শিরোনাম",
              "arabicTitle": "আরবি শিরোনাম (যদি থাকে)",
              "startPage": 1,
              "endPage": 20,
              "topics": [
                {
                  "id": "t_1_1",
                  "topicNumber": "১",
                  "title": "অধ্যায়ের অধীনে থাকা উপশিরোনাম/পাঠ",
                  "pageNumber": 1,
                  "endPageNumber": 4,
                  "contentExcerpt": "পাঠের সংক্ষিপ্ত মূল বিষয়বস্তু বা মূল পয়েন্ট"
                }
              ]
            }
          ]
        }
      `;

      const parts: any[] = [{ text: prompt }];

      if (extractedText) {
        parts.push({ text: `\n\nফাইল থেকে সংগৃহীত সূচিপত্র বা পাতার টেক্সট:\n${extractedText}` });
      }

      if (fileData && mimeType) {
        const base64Str = fileData.includes(',') ? fileData.split(',')[1] : fileData;
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Str
          }
        });
      }

      const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let result = null;
      let success = false;
      let lastError: any = null;

      for (let i = 0; i < modelsToTry.length; i++) {
        const currentModel = modelsToTry[i];
        try {
          console.log(`Attempting to extract TOC with model: ${currentModel}`);
          if (i > 0) {
            await new Promise(r => setTimeout(r, 1000));
          }

          result = await ai.models.generateContent({
            model: currentModel,
            contents: { parts: parts },
            config: {
              systemInstruction: "আপনি একজন পাঠ্যবই কারিকুলাম ও সূচিপত্র বিশেষজ্ঞ। আপনি শুধুমাত্র সঠিক এবং সম্পূর্ণ JSON উত্তর দিন।",
              responseMimeType: "application/json",
              temperature: 0.1
            }
          });

          success = true;
          break;
        } catch (err: any) {
          console.error(`Error extracting TOC with model ${currentModel}:`, err);
          lastError = err;
        }
      }

      if (!success || !result) {
        throw lastError || new Error("সূচিপত্র বিশ্লেষণ করতে মডেল ব্যর্থ হয়েছে।");
      }

      const parsed = JSON.parse(result.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Error in extract-pdf-toc endpoint:", error);
      res.status(500).json({ error: error.message || "সূচিপত্র লোড করতে সমস্যা হয়েছে।" });
    }
  });

  // Serve static files in production / Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
