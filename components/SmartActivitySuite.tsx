import React, { useState } from 'react';
import { Sparkles, Plus, Check, Play, BookOpen, Brain, Activity, Compass, Target, HelpCircle } from 'lucide-react';
import { LessonProcedureStep } from '../types';

interface SmartActivitySuiteProps {
  gradeLevel: string;
  topicTitle: string;
  subject?: string;
  language?: 'bn' | 'ar' | 'en';
  onAddActivity: (activity: LessonProcedureStep) => void;
  className?: string;
}

export interface PresetActivity {
  id: string;
  category: 'makhraj' | 'vocabulary' | 'quran' | 'play' | 'assessment';
  categoryLabel: string;
  title: string;
  tagline: string;
  suitableAges: string;
  learningGoal: string;
  step: LessonProcedureStep;
}

export const SmartActivitySuite: React.FC<SmartActivitySuiteProps> = ({
  gradeLevel,
  topicTitle,
  subject = '',
  language = 'bn',
  onAddActivity,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<{ [id: string]: boolean }>({});

  const isAr = language === 'ar';
  const isEn = language === 'en';

  // Intelligent preset activities calibrated for age, Islamic/academic curriculum, and cognitive learning
  const presetActivities: PresetActivity[] = [
    {
      id: 'makhraj_mirror',
      category: 'makhraj',
      categoryLabel: 'মাখরাজ ও তাজবীদ',
      title: isAr ? 'نشاط مرآة المخارج واستشعار الصوت' : (isEn ? 'Makhraj Mirror & Sound Sensation' : 'মাখরাজ আয়না ও শব্দ অনুভূতি ড্রিল'),
      tagline: isAr ? 'استخدام المرآة واللمس لمعرفة مخرج الحرف' : (isEn ? 'Visual and tactile phonetic articulation check' : 'ছোট আয়না ও হাত দিয়ে মুখের বাতাস বা কম্পন চিনে সঠিক হরফ উচ্চারণ'),
      suitableAges: '৪ - ৯ বছর (প্লে থেকে ৩য় শ্রেণি)',
      learningGoal: 'হরফের উচ্চারণ স্থান চেনা ও ভুল মাখরাজ তাৎক্ষণিক সংশোধন করা।',
      step: {
        stageAndTime: isAr ? 'النشاط الرئيسي وتدريب المخارج\n١٠-١٢ دقيقة' : (isEn ? 'Phonics & Makhraj Drill\n10-12 minutes' : 'মূল পাঠ ও মাখরাজ ড্রিল\n১০-১২ মিনিট'),
        activityTitle: isAr ? 'النشاط: مرآة المخارج واستشعار الهواء' : (isEn ? 'Activity: Makhraj Mirror & Air Test' : 'কার্যক্রম: মাখরাজ আয়না ও বাতাস পরীক্ষা'),
        procedurePoints: isAr ? [
          'يوزع المعلم مرايا صغيرة أو يطلب وضع اليد أمام الفم عند نطق الحرف',
          'ينطق المعلم الحرف بوضوح ويوجه الطلاب لملاحظة حركة الشفاه واللسان',
          'يجرب الطلاب النطق الفردي والجماعي مع التأكد من عدم خروج هواء زائد'
        ] : (isEn ? [
          'Teacher asks students to hold small mirrors or place their hand in front of their mouth',
          'Teacher pronounces the letter clearly and instructs pupils to observe lip & tongue positions',
          'Students practice individual & group articulation while monitoring air vibration'
        ] : [
          'শিক্ষক শিক্ষার্থীদের ছোট আয়না দেখতে বা মুখের সামনে হাত রেখে বাতাস অনুভব করতে বলেন',
          'উস্তাদ স্পষ্ট ও বিশুদ্ধ মাখরাজে হরফ উচ্চারণ করেন এবং জিহ্বা ও ঠোঁটের অবস্থান লক্ষ্য করতে বলেন',
          'শিক্ষার্থীরা একে একে এবং সমস্বরে সঠিক মাখরাজে উচ্চারণ করে হাত ও আয়নায় যাচাই করে'
        ]),
        childrenDo: isAr ? 'ينظر الطلاب في المرآة ويتحسسون الهواء ويطبقون النطق الصحيح' : (isEn ? 'Students look into mirror, sense air flow, and articulate accurately' : 'শিক্ষার্থীরা আয়নায় মুখ দেখে এবং হাতে বাতাসের চাপ মেপে বিশুদ্ধ মাখরাজে হরফ উচ্চারণ করে'),
        teacherDoes: isAr ? 'يوجه ويصحح مخارج الحروف لكل طالب بلطف وتشجيع' : (isEn ? 'Monitors each student, corrects tongue placement, and provides positive feedback' : 'প্রত্যেক শিক্ষার্থীর উচ্চারণ মনোযোগ দিয়ে শোনেন এবং ভুল হলে স্নেহভরে সঠিক স্থান দেখিয়ে দেন'),
        intPattern: isAr ? 'ف/ك\nف' : 'W/C\nS',
        aids: isAr ? 'مرآة\nبطاقات' : 'Mirrors\nFlashcards'
      }
    },
    {
      id: 'magic_bag',
      category: 'vocabulary',
      categoryLabel: 'শব্দভাণ্ডার ও মুখস্থ',
      title: isAr ? 'نشاط الحقيبة السحرية والمفاجأة' : (isEn ? 'Mystery Bag & Realia Discovery' : 'রহস্যের থলে (ম্যাজিক ব্যাগ) ও বাস্তব বস্তু প্রদর্শন'),
      tagline: isAr ? 'لمس الأشياء وتخمين اسمها العربي بحماس' : (isEn ? 'Tactile discovery of real-life objects (Realia)' : 'থলের ভেতর হাত দিয়ে বস্তু স্পর্শ করে না দেখেই নাম অনুমান করা'),
      suitableAges: '৩ - ৮ বছর (প্লে থেকে ২য় শ্রেণি)',
      learningGoal: 'বাস্তব বস্তু স্পর্শ ও আনন্দের মাধ্যমে সরাসরি নতুন আরবি/ইংরেজি শব্দের অর্থ মনে রাখা।',
      step: {
        stageAndTime: isAr ? 'التهيئة وجذب الانتباه\n٥-٧ دقائق' : (isEn ? 'Lead in & Sensory Hook\n5-7 minutes' : 'ওয়ার্ম-আপ ও আকর্ষণ সৃষ্টি\n৫-৭ মিনিট'),
        activityTitle: isAr ? 'النشاط: الحقيبة السحرية ولمس الأشياء' : (isEn ? 'Activity: Mystery Bag Sensory Touch' : 'কার্যক্রম: ম্যাজিক ব্যাগ ও স্পর্শ খেলা'),
        procedurePoints: isAr ? [
          'يعرض المعلم حقيبة ملونة ويحفز فضول الطلاب لمعرفة ما بداخلها',
          'يطلب من أحد الطلاب إدخال يده ولمس الشيء المخفي ومحاولة تخمينه ونطقه بالعربية',
          'يخرج المعلم الشيء (مثل: وردة، قلم، تفاحة) ويردد الجميع اسمه بنشيد مرح'
        ] : (isEn ? [
          'Teacher brings an exciting colorful pouch and sparks curiosity about what is inside',
          'A student reaches in, touches the mystery object, and guesses its name before revealing it',
          'Object is pulled out triumphantly and the whole class repeats the name with joyful cheer'
        ] : [
          'শিক্ষক একটি আকর্ষণীয় রঙিন কাপড়ের থলে দেখিয়ে শিক্ষার্থীদের কৌতূহল ও উদ্দীপনা জাগিয়ে তোলেন',
          'একজন শিক্ষার্থীকে সামনে ডেকে থলের ভেতর হাত দিয়ে না দেখে বস্তুটির আকৃতি অনুভব করে নাম অনুমান করতে বলেন',
          'বস্তুটি (যেমন: গোলাপ, কলম, ফল) বের করে আনন্দঘন কণ্ঠে ক্লাসের সবাই একসাথে শব্দটি ৩ বার উচ্চারণ করে'
        ]),
        childrenDo: isAr ? 'يتحمس الطلاب للمشاركة ويخمنون بحواسهم ويرددون الكلمة' : (isEn ? 'Children eagerly guess, touch, and chant the targeted vocabulary' : 'শিক্ষার্থীরা গভীর আগ্রহে হাত দিয়ে অনুভব করে নাম বলে এবং হাততালি দিয়ে শব্দটি উচ্চারণ করে'),
        teacherDoes: isAr ? 'يدير النشاط بحماس ويشجع المشاركة ويكافئ المجيب' : (isEn ? 'Builds suspense, prompts descriptive clues, and celebrates student responses' : 'রহস্যময় পরিবেশ তৈরি করেন, ক্লু দেন এবং সঠিক উত্তর দিলে শিশুকে সাবাশ ও করতালি দিয়ে উৎসাহিত করেন'),
        intPattern: isAr ? 'ف/ك' : 'W/C\nC/O',
        aids: isAr ? 'حقيبة\nأشياء' : 'Magic Bag\nRealia'
      }
    },
    {
      id: 'flyswatter_slap',
      category: 'play',
      categoryLabel: 'খেলা ও সক্রিয় অনুশীলন',
      title: isAr ? 'نشاط مضرب الكلمات والمطابقة السريعة' : (isEn ? 'Flyswatter / Slap the Card Board Game' : 'ফ্লাইসোয়াটার কার্ড স্ল্যাপ ও দ্রুত স্পর্শ খেলা'),
      tagline: isAr ? 'سباق ثنائي سريع لضرب البطاقة الصحيحة على السبورة' : (isEn ? 'Fast-paced competitive board-touch relay' : 'বোর্ডে সাঁটানো কার্ডে শব্দ শুনে দ্রুত হাত বা কাঠি দিয়ে ছোঁয়া'),
      suitableAges: '৫ - ১০ বছর (কেজি থেকে ৪র্থ শ্রেণি)',
      learningGoal: 'দ্রুত শব্দ বা হরফ চেনার গতি (Visual Recognition Speed) ও মনোযোগ বৃদ্ধি।',
      step: {
        stageAndTime: isAr ? 'التطبيق والألعاب الحركية\n٨-١٠ دقائق' : (isEn ? 'Kinesthetic Practice & Game\n8-10 minutes' : 'সক্রিয় অনুশীলন ও খেলাধুলা\n৮-১০ মিনিট'),
        activityTitle: isAr ? 'النشاط: مسابقة ضرب البطاقة السريعة' : (isEn ? 'Activity: Fast-Touch Card Relay' : 'কার্যক্রম: দ্রুত কার্ড স্পর্শ প্রতিযোগিতা'),
        procedurePoints: isAr ? [
          'يثبت المعلم بطاقات الكلمات/الحروف على السبورة بشكل متباعد',
          'يقف طالبان من فريقين مختلفين على خط البداية',
          'ينطق المعلم كلمة أو مخرجاً؛ والطالب الذي يلمس البطاقة الصحيحة أولاً يحرز نقطة لفريقه'
        ] : (isEn ? [
          'Teacher sticks vocabulary cards across the board at varied heights',
          'Two students from opposite teams stand at the starting line ready to react',
          'Teacher calls out a word/sound; the first student to tap the correct card wins a point'
        ] : [
          'শিক্ষক ব্ল্যাকবোর্ডে বিভিন্ন দূরত্বে শব্দ ও ছবির কার্ড টানিয়ে দেন',
          'দুটি দল থেকে দুজন শিক্ষার্থীকে নির্দিষ্ট দূরত্বে দাঁড় করিয়ে প্রস্তুত রাখা হয়',
          'উস্তাদ মুখে একটি শব্দ বা হরফ উচ্চারণ করামাত্রই যে সবার আগে দৌড়ে গিয়ে সঠিক কার্ড স্পর্শ করবে সে পয়েন্ট পাবে'
        ]),
        childrenDo: isAr ? 'يستمع الطلاب بتركيز ويسارعون للمس البطاقة ويشجع زملاؤهم بحماس' : (isEn ? 'Students listen attentively, sprint to touch the correct card, peers cheer enthusiastically' : 'শিক্ষার্থীরা তীক্ষ্ণ মনোযোগে শব্দ শোনে, দ্রুত দৌড়ে সঠিক কার্ডে হাত দেয় এবং সহপাঠীরা উল্লাস প্রকাশ করে'),
        teacherDoes: isAr ? 'يحكم المسابقة بالعدل ويعيد الكلمات لترسيخ الحفظ' : (isEn ? 'Referees the game fairly, keeps score, and reinforces correct pronunciation' : 'খেলার গতি বজায় রাখেন, নম্বর গণনা করেন এবং প্রতিটি রাউন্ড শেষে শব্দটির পুনরাবৃত্তি নিশ্চিত করেন'),
        intPattern: isAr ? 'ع/ث\nف' : 'PW\nGW',
        aids: isAr ? 'سبورة\nبطاقات' : 'Board\nFlashcards'
      }
    },
    {
      id: 'whats_missing',
      category: 'play',
      categoryLabel: 'স্মৃতিশক্তি ও মেমোরি গেম',
      title: isAr ? 'نشاط ما الشيء المفقود؟ (ذاكرة وتفكير)' : (isEn ? "What's Missing? Memory Recall Challenge" : 'কোন বস্তুটি হারিয়ে গেল? (মেমোরি ড্রিল)'),
      tagline: isAr ? 'إخفاء بطاقة أو مجسم واكتشاف الناقص بالذاكرة' : (isEn ? 'Visual memory recall by hiding one item' : 'চোখ বন্ধ করিয়ে একটি কার্ড বা বস্তু লুকিয়ে ফেলা, স্মৃতি থেকে নাম বলা'),
      suitableAges: '৪ - ৯ বছর (নার্সারি থেকে ৩য় শ্রেণি)',
      learningGoal: 'চাক্ষুষ স্মৃতিশক্তি (Visual Working Memory) এবং শব্দভাণ্ডারের গভীর স্থায়ী মুখস্থকরণ।',
      step: {
        stageAndTime: isAr ? 'تثبيت الحفظ والمراجعة\n٧-٨ دقائق' : (isEn ? 'Memory Consolidation Drill\n7-8 minutes' : 'স্মৃতি স্থায়ী ও নিবিড় অনুশীলন\n৭-৮ মিনিট'),
        activityTitle: isAr ? 'النشاط: لعبة اكتشاف المفقود' : (isEn ? "Activity: What's Missing Memory Game" : 'কার্যক্রম: হারিয়ে যাওয়া বস্তু চিহ্নিতকরণ খেলা'),
        procedurePoints: isAr ? [
          'يعرض المعلم ٤-٥ أشياء أو بطاقات ويراجع أسماءها مع الطلاب',
          'يطلب من الطلاب إغماض أعينهم (Close your eyes / أغمضوا أعينكم) ثم يخفي عنصراً واحداً',
          'يفتح الطلاب أعينهم والسباق لمعرفة العنصر المفقود ونطقه باللغة الهدف'
        ] : (isEn ? [
          'Teacher displays 4-5 items or flashcards and reviews their names with class',
          'Instructs children to close eyes tightly while secretly removing one item',
          'Students open eyes and race to name the missing item in the target language'
        ] : [
          'শিক্ষক টেবিলে ৪-৫টি বস্তু বা ছবি প্রদর্শন করে শিশুদের সাথে একবার রিভিশন দেন',
          'শিশুদের চোখ বন্ধ করতে বলেন এবং গোপনে একটি বস্তু বা কার্ড সরিয়ে নিজের কাছে লুকিয়ে রাখেন',
          'শিশুরা চোখ খুলে মনোযোগ দিয়ে পর্যবেক্ষণ করে হারিয়ে যাওয়া বস্তুটির নাম সঠিক উচ্চারণে বলে'
        ]),
        childrenDo: isAr ? 'يغمضون أعينهم بأمانة ثم يدققون الملاحظة ويكتشفون الناقص بسرعة' : (isEn ? 'Close eyes honestly, observe keenly, and shout out the missing item' : 'চোখ বন্ধ করে অপেক্ষা করে, চোখ খুলে দ্রুত টেবিল দেখে হারিয়ে যাওয়া বস্তুটির নাম আনন্দভরে বলে'),
        teacherDoes: isAr ? 'يخفي العناصر بمهارة ويثني على الطالب سريع البديهة' : (isEn ? 'Hides objects playfully and rewards keen observation' : 'আনন্দদায়ক কৌতুকপূর্ণ ভঙ্গিতে বস্তু সরান এবং দ্রুত বলতে পারা শিশুদের বুদ্ধিমান হিসেবে স্বীকৃতি দেন'),
        intPattern: isAr ? 'ف/ك\nف' : 'W/C\nS',
        aids: isAr ? 'أشياء\nغطاء' : 'Objects\nCover Sheet'
      }
    },
    {
      id: 'verbal_review_check',
      category: 'assessment',
      categoryLabel: 'শেখা যাচাই ও মূল্যায়ন',
      title: isAr ? 'نشاط المراجعة الشفهية وتلخيص الفهم' : (isEn ? 'Targeted Oral Review & Lesson Wrap-up' : 'মৌখিক প্রশ্নোত্তর ও মূল শিখন যাচাই (রিভিউ)'),
      tagline: isAr ? 'مراجعة ختامية شفهية للتأكد من استيعاب المفاهيم الأساسية' : (isEn ? 'Age-appropriate oral questioning to consolidate core learning' : 'বয়স ও বিষয়োপযোগী প্রশ্নোত্তরের মাধ্যমে মূল শিক্ষা যাচাই ও ইতিবাচক সমাপ্তি'),
      suitableAges: 'সকল শ্রেণি (প্লে থেকে ১০ম শ্রেণি)',
      learningGoal: 'বিষয়বস্তুর গভীর ভাবার্থ বোঝা এবং নিজের ভাষায় মূল শিক্ষা গুছিয়ে বলতে পারা।',
      step: {
        stageAndTime: isAr ? 'المراجعة والتقييم الختامي\n٥ دقائق' : (isEn ? 'Review & Wrap-up\n5 minutes' : 'পাঠ পর্যালোচনা ও মূল্যায়ন\n≈ ৫ মিনিট'),
        activityTitle: isAr ? 'النشاط: المراجعة الشفهية وتلخيص الدرس' : (isEn ? 'Activity: Oral Review & Key Takeaway Summary' : 'কার্যক্রম: পাঠ পর্যালোচনা ও মৌখিক শিখন মূল্যায়ন'),
        procedurePoints: isAr ? [
          'يطرح المعلم أسئلة شفهية هادفة تركز على المفهوم الجوهري للدرس',
          'يلخص الطلاب العبرة المستفادة أو القاعدة بكلماتهم الخاصة بحرية',
          'يثني المعلم على جهود الطلاب ويختم الحصة بدعاء مبارك وتشجيع طيب'
        ] : (isEn ? [
          'Teacher asks 2-3 focused oral questions reviewing core concepts taught today',
          'Students summarize the central takeaway or moral in their own words',
          'Teacher provides warm positive reinforcement, gentle corrections, and wraps up gracefully'
        ] : [
          'শিক্ষক ক্লাসের শিক্ষার্থীদের আজকের পাঠের মূল বিষয়বস্তু থেকে বয়স ও বিষয়োপযোগী প্রশ্ন করে শিখন যাচাই করবেন',
          'শিক্ষার্থীরা স্বতঃস্ফূর্তভাবে হাত তুলে প্রশ্নের উত্তর দেবে এবং আজকের ক্লাসের মূল শিক্ষা নিজের ভাষায় বলবে',
          'শিক্ষক সামগ্রিক বোঝাপড়া যাচাই করে ইতিবাচক প্রশংসা ও উৎসাহ দেবেন এবং সুন্দর শিষ্টাচারের সাথে পাঠ সমাপ্ত করবেন'
        ]),
        childrenDo: isAr ? 'يجيب الطلاب شفهياً ويعبرون عن فهمهم بأسلوبهم الخاص' : (isEn ? 'Answer eagerly, articulate key concepts in own words, and engage in reflection' : 'প্রশ্নের উত্তর দেয়, মূল বিষয়বস্তু মুখে মুখে নিজের ভাষায় গুছিয়ে বলে এবং সক্রিয়ভাবে অংশ নেয়'),
        teacherDoes: isAr ? 'يدير الحوار بمهارة، يرسخ المفاهيم، ويختم الحصة بروح إيجابية' : (isEn ? 'Facilitates recap, affirms accurate understanding, and concludes with warmth' : 'সংক্ষেপে পাঠের সারসংক্ষেপ টেনে দেন, শিক্ষার্থীদের সক্রিয় অংশগ্রহণের আন্তরিক প্রশংসা করেন ও দোয়া করেন'),
        intPattern: isAr ? 'ف/ك' : 'W/C',
        aids: isAr ? 'سبورة' : 'Board / Textbook'
      }
    },
    {
      id: 'recitation_relay',
      category: 'quran',
      categoryLabel: 'কুরআন ও হিফজ',
      title: isAr ? 'نشاط قطار التلاوة التتابعي السريع' : (isEn ? 'Ayah Recitation Relay Train' : 'আয়াত তিলাওয়াত রিলে ট্রেন'),
      tagline: isAr ? 'تلاوة الآيات بالتتابع بين الطلاب دون توقف' : (isEn ? 'Seamless sequential Quran recitation across peers' : 'একজনের পর আরেকজন না থেমে পরবর্তী আয়াত বা হরফ তিলাওয়াত করা'),
      suitableAges: '৬ - ১২ বছর (১ম থেকে ৬ষ্ঠ শ্রেণি)',
      learningGoal: 'হিফজের ধারাবাহিকতা, একনিষ্ঠ মনোযোগ ও সুরের মাধুর্য বৃদ্ধি।',
      step: {
        stageAndTime: isAr ? 'التدريب التفاعلي والتسميع الجماعي\n١٠ دقائق' : (isEn ? 'Interactive Quran Recitation\n10 minutes' : 'সক্রিয় হিফজ ও তিলাওয়াত ড্রিল\n১০ মিনিট'),
        activityTitle: isAr ? 'النشاط: قطار التلاوة المستمر' : (isEn ? 'Activity: Recitation Relay Train' : 'কার্যক্রম: তিলাওয়াত রিলে ট্রেন'),
        procedurePoints: isAr ? [
          'يبدأ الطالب الأول بقراءة آية بصوت خاشع وتجويد متقن',
          'يشير المعلم فجأة إلى طالب آخر ليكمل فوراً من حيث توقف الأول',
          'ينتبه الجميع لكلمات القرآن ليكونوا جاهزين للتلاوة دون أي تعثر'
        ] : (isEn ? [
          'First pupil recites an ayah with proper tajweed and steady melody',
          'Teacher gestures smoothly to next pupil to continue instantly without pause',
          'All students follow along closely with full concentration'
        ] : [
          'প্রথম শিক্ষার্থী একটি আয়াত সুন্দর মাখরাজ ও তারতীলের সাথে তিলাওয়াত করে',
          'উস্তাদ হঠাৎ হাতের ইশারায় পরবর্তী শিক্ষার্থীকে ইঙ্গিত করেন পরবর্তী আয়াত শুরু করতে',
          'পুরো ক্লাসের শিক্ষার্থীরা পূর্ণ মনোযোগে কান পেতে রাখে যেন নিজের ডাক আসতেই নিখুঁতভাবে পড়তে পারে'
        ]),
        childrenDo: isAr ? 'يتابع الطلاب بتيقظ وحضور قلب ويقرؤون بترتيل عذب' : (isEn ? 'Follow along vigilantly and recite with smooth rhythm and tajweed' : 'সবাই একাগ্রচিত্তে অনুসরণ করে এবং ডাক আসামাত্রই নির্ভুল তাজবীদের সাথে তিলাওয়াত করে'),
        teacherDoes: isAr ? 'يضبط الإيقاع واللحن ويصحح التجويد بدقة وخشوع' : (isEn ? 'Maintains cadence and corrects tajweed nuances gently' : 'তিলাওয়াতের গতি ও সুর নিয়ন্ত্রণ করেন এবং ছোটখাটো ভুল থাকলে তাৎক্ষণিক সংশোধন করে দেন'),
        intPattern: isAr ? 'ف/ك\nف' : 'W/C\nS',
        aids: isAr ? 'مصحف\nسبورة' : 'Mushaf\nBoard'
      }
    }
  ];

  const filtered = selectedCategory === 'all' 
    ? presetActivities 
    : presetActivities.filter(a => a.category === selectedCategory);

  const handleAdd = (act: PresetActivity) => {
    onAddActivity(act.step);
    setAddedIds(prev => ({ ...prev, [act.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [act.id]: false }));
    }, 2500);
  };

  return (
    <div className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/80 shadow-md space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 dark:border-teal-900/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>শিশু মেধা উপযোগী স্মার্ট অ্যাক্টিভিটি লাইব্রেরি</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                ইন্টেলিজেন্ট ইঞ্জিন
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              বাচ্চার বয়স ({gradeLevel}) ও বিষয় ({subject || topicTitle}) বুঝে তাৎক্ষণিক শিখন ও যাচাইমূলক কার্যক্রম
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'সবগুলো' },
            { id: 'makhraj', label: 'মাখরাজ/ধ্বনি' },
            { id: 'vocabulary', label: 'শব্দভাণ্ডার' },
            { id: 'play', label: 'খেলাধুলা' },
            { id: 'assessment', label: 'যাচাই/মূল্যায়ন' },
            { id: 'quran', label: 'কুরআন' }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Intelligent Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map(act => {
          const isAdded = !!addedIds[act.id];

          return (
            <div
              key={act.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 hover:border-teal-400 dark:hover:border-teal-600 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                      {act.categoryLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {act.suitableAges}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                  {act.title}
                </h4>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {act.tagline}
                </p>

                <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                  🎯 <strong>শিখন ও যাচাই লক্ষ্য:</strong> {act.learningGoal}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">
                  সময়: {act.step.stageAndTime.split('\n')[1] || '৫-১০ মিনিট'}
                </span>

                <button
                  type="button"
                  onClick={() => handleAdd(act)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-600 hover:text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>যুক্ত হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ লেসন প্ল্যানে যোগ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
