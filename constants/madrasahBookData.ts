import { TOCChapter, GeneratedExercise, GradeLevel } from '../types';

export const MADRASAH_CLASS_5_TOC: TOCChapter[] = [
  {
    id: 'selected_ayat',
    title: 'নির্বাচিত আয়াত',
    arabicTitle: 'الآيات المختارة',
    startPage: 8,
    endPage: 18,
    topics: [
      {
        id: 'ayat_1_2',
        topicNumber: '১ ও ২',
        title: 'আল্লাহর ভয় ও তাওয়াক্কুল (সূরা ত্বলাক: ২, ৩)',
        pageNumber: 9,
        endPageNumber: 9,
        contentExcerpt: '১. যে ব্যক্তি আল্লাহকে ভয় করে চলে, তার জন্য তিনি উত্তরণের পথ বের করে দেন এবং এমন উৎস থেকে তাকে রিযিক দেন যা সে কল্পনাও করতে পারে না। ২. আর যে আল্লাহর ওপর তাওয়াক্কুল (ভরসা) করে, আল্লাহ তার জন্য যথেষ্ট হয়ে যান।'
      },
      {
        id: 'ayat_3_4',
        topicNumber: '৩ ও ৪',
        title: 'আল্লাহর রহমত ও ধ্বংস থেকে আত্মরক্ষা (সূরা ইউসূফ ও বাকারা)',
        pageNumber: 10,
        endPageNumber: 10,
        contentExcerpt: '৩. তোমরা আল্লাহর রহমত থেকে নিরাশ হয়ো না। ৪. নিজ হাতে নিজেদেরকে ধ্বংসের দিকে নিক্ষেপ করো না এবং কল্যাণকর কাজ করো।'
      },
      {
        id: 'ayat_5_6',
        topicNumber: '৫ ও ৬',
        title: 'কুধারণা, দোষ অন্বেষণ ও গীবত বর্জন (সূরা হুজুরাত: ১২)',
        pageNumber: 11,
        endPageNumber: 11,
        contentExcerpt: '৫. তোমরা বহুবিধ ধারণা থেকে দূরে থাক। ৬. তোমরা অন্যের দোষ খোঁজাখুঁজি করো না এবং একে অপরের গীবত করো না।'
      },
      {
        id: 'ayat_7_8',
        topicNumber: '৭ ও ৮',
        title: 'মন্দ উপনাম বর্জন ও আমানত প্রদান (সূরা হুজুরাত ও নিসা)',
        pageNumber: 12,
        endPageNumber: 12,
        contentExcerpt: '৭. তোমরা একে অপরকে মন্দ উপনামে ডেকো না। ৮. নিশ্চয়ই আল্লাহ হকদারদের হক তাদের কাছে পৌঁছে দিতে নির্দেশ দিচ্ছেন।'
      },
      {
        id: 'ayat_9_10',
        topicNumber: '৯ ও ১০',
        title: 'ন্যায়বিচার ও ওয়াদা পূরণ (সূরা নিসা ও বনি ইসরাঈল)',
        pageNumber: 13,
        endPageNumber: 13,
        contentExcerpt: '৯. যখন মানুষের মধ্যে ফয়সালা করবে, ন্যায়ভিত্তিক ফয়সালা করবে। ১০. তোমরা ওয়াদা পূর্ণ কর, কেননা ওয়াদা সম্পর্কে জিজ্ঞাসাবাদ করা হবে।'
      },
      {
        id: 'ayat_11_12',
        topicNumber: '১১ ও ১২',
        title: 'অজ্ঞাত বিষয়ের অনুসরণ বর্জন ও অশ্লীলতা পরিহার (সূরা ইসরা ও আনআম)',
        pageNumber: 14,
        endPageNumber: 14,
        contentExcerpt: '১১. যে বিষয়ে তোমার জ্ঞান নেই তার অনুসরণ করো না। ১২. তোমরা প্রকাশ্য বা গোপন কোনো অশ্লীলতার কাছেও যেয়ো না।'
      },
      {
        id: 'ayat_13_14',
        topicNumber: '১৩ ও ১৪',
        title: 'সৎকাজে সহযোগিতা ও শয়তানের শত্রুতা (সূরা মায়িদাহ ও বাকারা)',
        pageNumber: 15,
        endPageNumber: 15,
        contentExcerpt: '১৩. নেক কাজ ও তাকওয়ার ব্যাপারে পরস্পরকে সহযোগিতা কর। ১৪. শয়তানের পদাঙ্ক অনুসরণ করো না, সে প্রকাশ্য শত্রু।'
      },
      {
        id: 'ayat_15_16',
        topicNumber: '১৫ ও ১৬',
        title: 'তাকওয়ার মর্যাদা ও মুমিনদের পারস্পরিক ভ্রাতৃত্ব (সূরা হুজুরাত)',
        pageNumber: 16,
        endPageNumber: 16,
        contentExcerpt: '১৫. আল্লাহর কাছে সে-ই অধিক মর্যাদাসম্পন্ন যে অধিক তাকওয়াবান। ১৬. নিশ্চয়ই মুমিনরা পরস্পর ভাই ভাই।'
      },
      {
        id: 'ayat_17_18',
        topicNumber: '১৭ ও ১৮',
        title: 'নম্র চালচলন ও উত্তম বন্ধুত্ব (সূরা লুকমান ও যুখরুফ)',
        pageNumber: 17,
        endPageNumber: 17,
        contentExcerpt: '১৭. চলার ক্ষেত্রে মধ্যপন্থা অবলম্বন কর এবং আওয়াজ নিচু কর। ১৮. বন্ধুরা সেদিন একে অন্যের শত্রু হবে, তবে মুত্তাকীরা ব্যতীত।'
      },
      {
        id: 'ayat_19_20',
        topicNumber: '১৯ ও ২০',
        title: 'ভালো কাজের প্রভাব ও পিতামাতার সাথে সদ্ব্যবহার (সূরা হুদ ও ইসরা)',
        pageNumber: 18,
        endPageNumber: 18,
        contentExcerpt: '১৯. ভালো কাজ মন্দ কাজকে মিটিয়ে দেয়। ২০. আল্লাহ ছাড়া কারো ইবাদাত করবে না এবং পিতা-মাতার সাথে সদাচরণ করবে।'
      }
    ]
  },
  {
    id: 'selected_hadith',
    title: 'নির্বাচিত হাদীস',
    arabicTitle: 'الأحاديث المختارة',
    startPage: 19,
    endPage: 39,
    topics: [
      {
        id: 'hadith_1',
        topicNumber: '১',
        title: 'সালাম বিনিময়, খাদ্য দান ও রাতের সালাত',
        pageNumber: 20,
        endPageNumber: 20,
        contentExcerpt: 'তোমরা পরস্পর সালাম বিনিময় করো, অনাহারীকে আহার করাও এবং রাতের বেলা মানুষ যখন ঘুমিয়ে থাকে তখন সালাত পড়ো।'
      },
      {
        id: 'hadith_2',
        topicNumber: '২',
        title: 'আরশের ছায়াপ্রাপ্ত সাত শ্রেণির মানুষ',
        pageNumber: 21,
        endPageNumber: 21,
        contentExcerpt: 'যেদিন আল্লাহর ছায়া ব্যতীত কোনো ছায়া থাকবে না, সেদিন সাত শ্রেণির ব্যক্তিকে আল্লাহ নিজের আরশের ছায়ায় আশ্রয় দেবেন।'
      },
      {
        id: 'hadith_3',
        topicNumber: '৩',
        title: 'দ্বীন হলো কল্যাণ কামনা (নসীহত)',
        pageNumber: 22,
        endPageNumber: 23,
        contentExcerpt: 'কল্যাণ কামনাই হলো দ্বীন: আল্লাহর জন্য, তাঁর কিতাবের জন্য, তাঁর রাসূলের জন্য, মুসলিম শাসকদের জন্য এবং সাধারণ মুসলিমদের জন্য।'
      },
      {
        id: 'hadith_4',
        topicNumber: '৪',
        title: 'কাজে ইতকান ও নিখুঁতভাবে সম্পাদন',
        pageNumber: 23,
        endPageNumber: 23,
        contentExcerpt: 'নিশ্চয়ই আল্লাহ পছন্দ করেন যে তোমাদের কেউ যখন কোনো কাজ করে তা যেন নিখুঁত ও যথাযথভাবে সম্পন্ন করে।'
      },
      {
        id: 'hadith_5',
        topicNumber: '৫',
        title: 'ধারাবাহিক অল্প আমলের শ্রেষ্ঠত্ব',
        pageNumber: 24,
        endPageNumber: 24,
        contentExcerpt: 'যে আমল নিয়মিত করা হয়, তা আল্লাহ তাআলার কাছে অধিক প্রিয়, যদিও তা পরিমাণে কম হয়।'
      },
      {
        id: 'hadith_6',
        topicNumber: '৬',
        title: 'কষ্ট ও বিপদে গুনাহ মাফ ও মর্যাদা বৃদ্ধি',
        pageNumber: 25,
        endPageNumber: 25,
        contentExcerpt: 'কোনো মুসলিম যদি একটি কাঁটা বা এর চেয়ে বেশি কিছুতে আঘাতপ্রাপ্ত হয়, আল্লাহ তার মর্যাদা বৃদ্ধি করেন এবং গুনাহ মাফ করেন।'
      },
      {
        id: 'hadith_7',
        topicNumber: '৭',
        title: 'গাছ লাগানো ও ফসলের সদাকাহ',
        pageNumber: 26,
        endPageNumber: 26,
        contentExcerpt: 'কোনো মুসলিম যদি গাছ রোপণ করে, তা থেকে কোনো প্রাণী বা মানুষ খেলে তা তার জন্য সদাকাহ হিসেবে গণ্য হয়।'
      },
      {
        id: 'hadith_8',
        topicNumber: '৮',
        title: 'সদাকাহ, ক্ষমা ও বিনয়ের সুফল',
        pageNumber: 27,
        endPageNumber: 27,
        contentExcerpt: 'সদাকাহ করার কারণে সম্পদ কমে না, ক্ষমা করে দিলে আল্লাহ সম্মান বাড়িয়ে দেন এবং বিনয়ী হলে মর্যাদা বৃদ্ধি করেন।'
      },
      {
        id: 'hadith_9',
        topicNumber: '৯',
        title: 'প্রতিবেশীর অধিকার ও গুরুত্ব',
        pageNumber: 28,
        endPageNumber: 28,
        contentExcerpt: 'জিবরাঈল (আ.) আমাকে বারবার প্রতিবেশীর ব্যাপারে উপদেশ দিতে থাকলেন, মনে হলো প্রতিবেশীকে ওয়ারিস বানিয়ে দেবেন।'
      },
      {
        id: 'hadith_10',
        topicNumber: '১০',
        title: 'মৃত্যুর পর অব্যাহত তিন আমল (সাদাকায়ে জারিয়া)',
        pageNumber: 29,
        endPageNumber: 29,
        contentExcerpt: 'মৃত্যুর সাথে আমল শেষ হয়, তবে তিনটি ব্যতীত: সদাকায়ে জারিয়া, উপকারী ইলম এবং নেক সন্তান যে দুআ করে।'
      },
      {
        id: 'hadith_11',
        topicNumber: '১১',
        title: 'প্রকৃত বীর ও রাগ নিয়ন্ত্রণ',
        pageNumber: 30,
        endPageNumber: 30,
        contentExcerpt: 'যে কুস্তিতে পরাস্ত করে সে বীর নয়, বরং রাগের সময় যে নিজেকে নিয়ন্ত্রণ করে সে-ই প্রকৃত বীর।'
      },
      {
        id: 'hadith_12',
        topicNumber: '১২',
        title: 'অহংকারের ভয়াবহতা ও সংজ্ঞা',
        pageNumber: 31,
        endPageNumber: 31,
        contentExcerpt: 'যার অন্তরে অণু পরিমাণ অহংকার থাকবে সে জান্নাতে প্রবেশ করবে না। অহংকার হলো সত্য প্রত্যাখ্যান ও মানুষকে অবজ্ঞা করা।'
      },
      {
        id: 'hadith_13',
        topicNumber: '১৩',
        title: 'জান্নাত থেকে বঞ্চিত তিন শ্রেণির মানুষ',
        pageNumber: 32,
        endPageNumber: 32,
        contentExcerpt: 'তিন ব্যক্তি জান্নাতে প্রবেশ করবে না: খোঁটা দানকারী, পিতা-মাতার অবাধ্য সন্তান ও মদ্যপানে আসক্ত লোক।'
      },
      {
        id: 'hadith_14',
        topicNumber: '১৪',
        title: 'বিধর্মীদের সাদৃশ্য বর্জন',
        pageNumber: 33,
        endPageNumber: 33,
        contentExcerpt: 'যে ব্যক্তি কোনো সম্প্রদায়ের সাদৃশ্য অবলম্বন করে, সে তাদেরই দলভুক্ত হিসেবে গণ্য হবে।'
      },
      {
        id: 'hadith_15',
        topicNumber: '১৫',
        title: 'মুনাফিকের আলামত ও পরিণতি',
        pageNumber: 34,
        endPageNumber: 34,
        contentExcerpt: 'মুনাফিকের আলামত তিনটি: কথা বললে মিথ্যা বলে, ওয়াদা দিলে ভঙ্গ করে এবং আমানত রাখলে খেয়ানত করে।'
      },
      {
        id: 'hadith_16',
        topicNumber: '১৬',
        title: 'বন্ধু নির্বাচনের প্রভাব',
        pageNumber: 35,
        endPageNumber: 35,
        contentExcerpt: 'মানুষ তার বন্ধুর রীতিনীতির অনুসারী হয়, অতএব প্রত্যেকে যেন লক্ষ্য রাখে সে কার সাথে বন্ধুত্ব করছে।'
      },
      {
        id: 'hadith_17',
        topicNumber: '১৭',
        title: 'উত্তম চরিত্র ও পাপের স্বরূপ',
        pageNumber: 36,
        endPageNumber: 36,
        contentExcerpt: 'পুণ্য হলো উত্তম চরিত্র, আর পাপ হলো যা তোমার অন্তরে খটকা সৃষ্টি করে এবং মানুষের জানা তুমি অপছন্দ করো।'
      },
      {
        id: 'hadith_18',
        topicNumber: '১৮',
        title: 'তাকওয়া ও সচ্চরিত্রের নির্দেশ',
        pageNumber: 37,
        endPageNumber: 37,
        contentExcerpt: 'তুমি যেখানেই থাক আল্লাহকে ভয় কর, মন্দের পর ভালো কাজ কর যা মন্দকে মুছে দেবে এবং মানুষের সাথে সদাচরণ কর।'
      },
      {
        id: 'hadith_19',
        topicNumber: '১৯',
        title: 'অন্যায় প্রতিরোধ ও ঈমানের স্তরসমূহ',
        pageNumber: 38,
        endPageNumber: 38,
        contentExcerpt: 'অন্যায় দেখলে হাত দিয়ে প্রতিরোধ কর, না পারলে জবান দিয়ে, না পারলে অন্তরে ঘৃণা কর—এটি ঈমানের দুর্বলতম স্তর।'
      },
      {
        id: 'hadith_20',
        topicNumber: '২০',
        title: 'নারী-পুরুষের বেশভূষা সাদৃশ্য বর্জন',
        pageNumber: 39,
        endPageNumber: 39,
        contentExcerpt: 'যে পুরুষ নারীদের সাদৃশ্য অবলম্বন করে এবং যে নারী পুরুষের সাদৃশ্য অবলম্বন করে, রাসূলুল্লাহ (সা.) তাদের ওপর অভিশাপ করেছেন।'
      }
    ]
  },
  {
    id: 'masnoon_dua',
    title: 'মাসনূন দুআ ও যিকর',
    arabicTitle: 'الأدعية المأثورة والأذكار',
    startPage: 40,
    endPage: 49,
    topics: [
      { id: 'dua_1', topicNumber: '১', title: 'সকল প্রকার গোনাহ থেকে ক্ষমা চাওয়ার দুআ', pageNumber: 41 },
      { id: 'dua_2', topicNumber: '২', title: 'ঋণমুক্তি ও হালাল রিযিক লাভের দুআ', pageNumber: 41 },
      { id: 'dua_3', topicNumber: '৩', title: 'অমঙ্গল এবং শত্রুর ক্ষতি থেকে পরিত্রাণ পাওয়ার দুআ', pageNumber: 42 },
      { id: 'dua_4', topicNumber: '৪', title: 'ইলম, রিযিক এবং কবুলযোগ্য আমলের দুআ', pageNumber: 42 },
      { id: 'dua_5', topicNumber: '৫', title: 'অনুপকারী ইলম থেকে পানাহ চাওয়ার দুআ', pageNumber: 43 },
      { id: 'dua_6', topicNumber: '৬', title: 'আল্লাহ তাআলার কাছে নূর চাওয়ার (আলোকিত মানুষ হওয়ার) দুআ', pageNumber: 43 },
      { id: 'dua_7', topicNumber: '৭', title: 'মজলিস সমাপ্ত করার দুআ ও ফজিলত', pageNumber: 44 },
      { id: 'dua_8', topicNumber: '৮', title: 'আল্লাহ এবং আল্লাহওয়ালাদের ভালোবাসা পাওয়ার দুআ', pageNumber: 44 },
      { id: 'dua_9', topicNumber: '৯', title: 'অসুস্থ ব্যক্তিকে ঝাড়-ফুঁক করার দুআ', pageNumber: 45 },
      { id: 'dua_10', topicNumber: '১০', title: 'রুগী দেখতে যাওয়ার আদব ও দুআ', pageNumber: 46 },
      { id: 'dua_11', topicNumber: '১১', title: 'ঘুমানোর যিকর ও নিদ্রার পূর্বে ও পরের আদব', pageNumber: 47 },
      { id: 'dua_12', topicNumber: '১২', title: 'দুআ কবুলের শর্ত, আদব এবং বিশেষ সময়সমূহ', pageNumber: 48, endPageNumber: 49 }
    ]
  },
  {
    id: 'iman_aqeedah',
    title: 'ঈমান ও আকীদা',
    arabicTitle: 'الإيمان والعقيدة',
    startPage: 50,
    endPage: 80,
    topics: [
      { id: 'iman_1', topicNumber: '১', title: 'বিশুদ্ধ ঈমানের গুরুত্ব ও শিরক-কুফরের ভয়াবহতা', pageNumber: 51, endPageNumber: 52 },
      { id: 'iman_2', topicNumber: '২', title: 'অহী: ইসলামী আকীদার একমাত্র উৎস', pageNumber: 53, endPageNumber: 56 },
      { id: 'iman_3', topicNumber: '৩', title: 'হাদীস: ইসলামী জীবনবিধানের দ্বিতীয় ও অন্যতম উৎস', pageNumber: 57, endPageNumber: 58 },
      { id: 'iman_4', topicNumber: '৪', title: 'যুগে যুগে রাসূলের হাদীস সংরক্ষণের বিভিন্ন পদ্ধতি', pageNumber: 59, endPageNumber: 60 },
      { id: 'iman_5', topicNumber: '৫', title: '‘আহলে কুরআন’ বিভ্রান্তি ও আমাদের সতর্কতা', pageNumber: 61 },
      { id: 'iman_6', topicNumber: '৬', title: 'রাসূল (সা.)-এর মর্যাদা, ভালোবাসা ও ভালোবাসার মাপকাঠি', pageNumber: 62 },
      { id: 'iman_7', topicNumber: '৭', title: 'নবিজি (সা.)-কে অবমাননার শাস্তি ও বিধান', pageNumber: 63 },
      { id: 'iman_8', topicNumber: '৮', title: 'আল-ওয়ালা ওয়াল-বারা (ঘনিষ্ঠতা এবং সম্পর্কচ্ছেদ নীতি)', pageNumber: 64, endPageNumber: 65 },
      { id: 'iman_9', topicNumber: '৯', title: 'ইবাদতের পরিচয় ও প্রকারভেদ (তাওহীদুল উলূহিয়্যাহ)', pageNumber: 66, endPageNumber: 68 },
      { id: 'iman_10', topicNumber: '১০', title: 'শিরক: পরিচয়, প্রকার ও ধরন (বড় ও ছোট শিরক)', pageNumber: 69, endPageNumber: 71 },
      { id: 'iman_11', topicNumber: '১১', title: 'কুফর: পরিচয়, প্রকার ও ধরন (কুফরে আকবার ও আসগার)', pageNumber: 72, endPageNumber: 73 },
      { id: 'iman_12', topicNumber: '১২', title: 'নিফাক: পরিচয়, প্রকার ও মুনাফিকের লক্ষণ', pageNumber: 74, endPageNumber: 77 },
      { id: 'iman_13', topicNumber: '১৩', title: 'বিদআত: পরিচয়, ভয়াবহতা ও কুফল', pageNumber: 78, endPageNumber: 80 }
    ]
  },
  {
    id: 'masael_ahkam',
    title: 'মাসায়েল ও আহকাম',
    arabicTitle: 'المسائل والأحكام',
    startPage: 81,
    endPage: 119,
    topics: [
      { id: 'masael_1', topicNumber: '১', title: 'বয়ঃসন্ধিকাল এবং শরীয়তের বিধি-বিধান অর্পিত হওয়ার সময়', pageNumber: 82, endPageNumber: 83 },
      { id: 'masael_2', topicNumber: '২', title: 'পবিত্রতা অর্জনের হুকুম ও গোসলের বিশেষ পদ্ধতি', pageNumber: 83, endPageNumber: 84 },
      { id: 'masael_3', topicNumber: '৩', title: 'মানুষের ফিতরাত বা স্বভাবজাত ১০টি সুন্নাহ', pageNumber: 84, endPageNumber: 85 },
      { id: 'masael_4', topicNumber: '৪', title: 'মাহরাম-গায়রে মাহরাম পরিচিতি ও হুকুম (১৪ জন মাহরাম)', pageNumber: 86, endPageNumber: 87 },
      { id: 'masael_5', topicNumber: '৫', title: 'পোশাক সম্পর্কে ইসলামী নীতিমালা ও পর্দা', pageNumber: 88, endPageNumber: 89 },
      { id: 'masael_6', topicNumber: '৬', title: 'গান-বাদ্য ও গজল-নাশিদের শরয়ী বিধান', pageNumber: 90, endPageNumber: 91 },
      { id: 'masael_7', topicNumber: '৭', title: 'মৃতের গোসল, কাফন-দাফন এবং জানাযা', pageNumber: 91, endPageNumber: 95 },
      { id: 'masael_8', topicNumber: '৮', title: 'যাকাত ও দান-সদাকাহ: পরিচয়, নিসাব ও খাতসমূহ', pageNumber: 96, endPageNumber: 97 },
      { id: 'masael_9', topicNumber: '৯', title: 'সদাকাতুল ফিতর: তাৎপর্য, পরিমাণ ও আদায়ের সময়', pageNumber: 98, endPageNumber: 100 },
      { id: 'masael_10', topicNumber: '১০', title: 'হজ: ইসলামের পঞ্চম স্তম্ভ, গুরুত্ব ও তাৎপর্য', pageNumber: 101, endPageNumber: 103 },
      { id: 'masael_11', topicNumber: '১১', title: 'উমরা: ফরয ও ওয়াজিবসমূহ', pageNumber: 104 },
      { id: 'masael_12', topicNumber: '১২', title: 'হজ-উমরার মীকাত ও স্থানগত সীমানা', pageNumber: 104, endPageNumber: 105 },
      { id: 'masael_13', topicNumber: '১৩', title: 'হজের প্রকারভেদ (ইফরাদ, তামাত্তু, কিরান)', pageNumber: 106 },
      { id: 'masael_14', topicNumber: '১৪', title: 'কুরবানি: ইতিহাস, ফযিলত, নিসাব ও পশুর বয়সসীমা', pageNumber: 107, endPageNumber: 110 },
      { id: 'masael_15', topicNumber: '১৫', title: 'ইসলামে কসম (শপথ)-এর প্রকারভেদ ও কাফফারা', pageNumber: 111, endPageNumber: 114 },
      { id: 'masael_16', topicNumber: '১৬', title: 'কুড়িয়ে পাওয়া জিনিসের (লুক্বতা) শরয়ী বিধান', pageNumber: 115, endPageNumber: 116 },
      { id: 'masael_17', topicNumber: '১৭', title: 'মুআমালাত: লেনদেনে ইসলামের মৌলিক নীতিমালা ও সুদ বর্জন', pageNumber: 116, endPageNumber: 119 }
    ]
  },
  {
    id: 'seerah_history',
    title: 'সীরাত ও ইসলামী ইতিহাস',
    arabicTitle: 'السيرة والتاريخ الإسلامي',
    startPage: 120,
    endPage: 160,
    topics: [
      { id: 'seerah_1', topicNumber: '১', title: 'আহলে বাইত: পরিচিতি, মর্যাদা ও উম্মাহাতুল মুমিনীন', pageNumber: 121, endPageNumber: 124 },
      { id: 'seerah_2', topicNumber: '২', title: 'নবী পরিবার থেকে আমাদের জন্য শিক্ষা', pageNumber: 125, endPageNumber: 126 },
      { id: 'seerah_3', topicNumber: '৩', title: 'নবী পরিবারের প্রতি আমাদের দায়িত্ব ও ভারসাম্য', pageNumber: 126 },
      { id: 'seerah_4', topicNumber: '৪', title: 'আসহাবে সুফফা: ইসলামের প্রথম আবাসিক মাদ্রাসা ও সাহাবীগণ', pageNumber: 127, endPageNumber: 129 },
      { id: 'seerah_5', topicNumber: '৫', title: 'আসহাবে সুফফার অন্যতম সদস্য আবু হুরায়রা (রা.)-এর জীবনী ও ত্যাগ', pageNumber: 130, endPageNumber: 132 },
      { id: 'seerah_6', topicNumber: '৬', title: 'আসহাবে সুফফা থেকে প্রাপ্ত শিক্ষা ও প্রেরণা', pageNumber: 133, endPageNumber: 134 },
      { id: 'seerah_7', topicNumber: '৭', title: 'আবাদালায়ে আরবাআ (চার প্রখ্যাত আব্দুল্লাহ)', pageNumber: 135, endPageNumber: 142 },
      { id: 'seerah_8', topicNumber: '৮', title: 'বীর সেনাপতি খালিদ বিন ওয়ালিদ (রা.) - সাইফুল্লাহ', pageNumber: 143, endPageNumber: 145 },
      { id: 'seerah_9', topicNumber: '৯', title: 'মুআবিয়া ইবনে আবু সুফিয়ান (রা.)-এর জীবনী ও অবদান', pageNumber: 145, endPageNumber: 146 },
      { id: 'seerah_10', topicNumber: '১০', title: 'আমর ইবনুল আস (রা.)-এর ইসলাম গ্রহণ ও মিসর বিজয়', pageNumber: 147, endPageNumber: 149 },
      { id: 'seerah_11', topicNumber: '১১', title: 'খেলাফতে রাশেদা (চার খলিফা) ও পরবর্তী খিলাফতসমূহ', pageNumber: 150, endPageNumber: 160 }
    ]
  },
  {
    id: 'akhlaq_values',
    title: 'ইসলামী আদর্শ ও মূল্যবোধ',
    arabicTitle: 'الأخلاق والقيم الإسلامية',
    startPage: 161,
    endPage: 189,
    topics: [
      { id: 'akhlaq_1', topicNumber: '১', title: 'ইসলামে কথা বলার মাধুর্য ও আদব', pageNumber: 162, endPageNumber: 164 },
      { id: 'akhlaq_2', topicNumber: '২', title: 'হাসিমুখে কথা বলা সদাকাহ ও ইবাদাত', pageNumber: 164, endPageNumber: 165 },
      { id: 'akhlaq_3', topicNumber: '৩', title: 'আতিথেয়তা ইসলামের শিক্ষা (আনসার সাহাবীর ত্যাগ)', pageNumber: 166, endPageNumber: 167 },
      { id: 'akhlaq_4', topicNumber: '৪', title: 'বড়দেরকে সম্মান এবং ছোটদেরকে স্নেহ করা', pageNumber: 168, endPageNumber: 169 },
      { id: 'akhlaq_5', topicNumber: '৫', title: 'পরিষ্কার-পরিচ্ছন্নতা: ঈমানের অর্ধেক', pageNumber: 170, endPageNumber: 171 },
      { id: 'akhlaq_6', topicNumber: '৬', title: 'যাচাইবিহীন খবর বা গুজবে কান না দেওয়া', pageNumber: 172, endPageNumber: 173 },
      { id: 'akhlaq_7', topicNumber: '৭', title: 'অন্যের গোপনীয়তা রক্ষা মুমিনের জন্য আমানতস্বরূপ', pageNumber: 173, endPageNumber: 176 },
      { id: 'akhlaq_8', topicNumber: '৮', title: 'অহেতুক ও অনর্থক কাজ পরিত্যাগ করা', pageNumber: 177, endPageNumber: 178 },
      { id: 'akhlaq_9', topicNumber: '৯', title: 'ইসলামের দৃষ্টিতে মাদকাসক্তি ও ধূমপানের ভয়াবহতা', pageNumber: 178, endPageNumber: 180 },
      { id: 'akhlaq_10', topicNumber: '১০', title: 'বন্ধু নির্বাচনে ইসলামের নির্দেশনা (আতর বিক্রেতা ও কামারের হাপর)', pageNumber: 180, endPageNumber: 182 },
      { id: 'akhlaq_11', topicNumber: '১১', title: 'অন্যকে অগ্রাধিকার দেওয়া (‘ইসার’) ইসলামের মহৎ শিক্ষা', pageNumber: 183, endPageNumber: 186 },
      { id: 'akhlaq_12', topicNumber: '১২', title: 'আত্মীয়-স্বজন ও প্রতিবেশীর প্রতি আমাদের কর্তব্য ও অধিকার', pageNumber: 186, endPageNumber: 189 }
    ]
  },
  {
    id: 'sample_exam_questions',
    title: 'নমুনা প্রশ্ন ও মূল্যায়ন মডেল',
    arabicTitle: 'نماذج الأسئلة الامتحانية',
    startPage: 190,
    endPage: 194,
    topics: [
      { id: 'exam_full', topicNumber: 'পূর্ণাঙ্গ', title: 'ইসলামিক স্টাডিজ বার্ষিক চূড়ান্ত মূল্যায়ন প্রশ্নপত্র (১০০ নম্বর)', pageNumber: 190, endPageNumber: 194 }
    ]
  }
];

export const SAMPLE_DEFAULT_EXERCISE: GeneratedExercise = {
  title: 'স্মার্ট মূল্যায়ন অনুশীলনী: শিরক - পরিচয়, প্রকার ও ধরন',
  gradeLevel: GradeLevel.Grade5,
  subject: 'ইসলামিক স্টাডিজ',
  chapterTitle: 'ঈমান ও আকীদা',
  topicTitle: '১০. শিরক: পরিচয়, প্রকার ও ধরন',
  totalMarks: 25,
  estimatedTime: '৩০ মিনিট',
  sections: [
    {
      type: 'short',
      title: '১. সংক্ষিপ্ত উত্তর প্রশ্ন',
      instructions: 'নিচের প্রশ্নগুলোর সংক্ষেপে সঠিক উত্তর দাও:',
      totalMarks: 6,
      questions: [
        {
          id: 'q_short_1',
          type: 'short',
          question: '‘শিরক’ শব্দের আভিধানিক ও পারিভাষিক অর্থ কী?',
          answer: '‘শিরক’ শব্দের আভিধানিক অর্থ অংশীদারিত্ব বা কাউকে অংশীদার বানানো। ইসলামী পরিভাষায়, আল্লাহর জন্য নির্দিষ্ট কোনো গুণে বা ইবাদাতে অন্য কাউকে সমকক্ষ বা অংশীদার সাব্যস্ত করাই শিরক।',
          points: 3
        },
        {
          id: 'q_short_2',
          type: 'short',
          question: 'শিরক থেকে বাঁচার জন্য রাসূলুল্লাহ (সা.) কোন দুআ শিখিয়েছেন?',
          answer: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أُشْرِكَ بِكَ وَأَنَا أَعْلَمُ، وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ (অর্থ: হে আল্লাহ! আমি সজ্ঞানে আপনার সাথে শিরক করা থেকে আপনার কাছে আশ্রয় চাই এবং যা আমার অজ্ঞাত তা থেকেও ক্ষমা চাই)।',
          points: 3
        }
      ]
    },
    {
      type: 'mcq',
      title: '২. বহুনির্বাচনী প্রশ্ন (MCQ)',
      instructions: 'সঠিক উত্তরের পাশে টিকচিহ্ন (✓) দাও:',
      totalMarks: 5,
      questions: [
        {
          id: 'q_mcq_1',
          type: 'mcq',
          question: 'আল্লাহর নিকট সবচেয়ে কঠিন ও ক্ষমার অযোগ্য পাপ কোনটি?',
          options: ['১. মিথ্যা বলা', '২. চুরি করা', '৩. শিরক করা', '৪. গীবত করা'],
          answer: '৩. শিরক করা',
          explanation: 'কুরআনে আল্লাহ বলেছেন, নিশ্চয়ই আল্লাহ তাঁর সাথে শিরক করাকে ক্ষমা করেন না (সূরা নিসা: ১১৬)।',
          points: 1
        },
        {
          id: 'q_mcq_2',
          type: 'mcq',
          question: 'লোক দেখানো ইবাদাত করা কোন ধরনের শিরকের অন্তর্ভুক্ত?',
          options: ['১. কুফর', '২. ছোট শিরক (শিরকে আসগার)', '৩. বড় শিরক', '৪. নিফাক'],
          answer: '২. ছোট শিরক (শিরকে আসগার)',
          explanation: 'মানুষের প্রশংসা বা বাহবা পাওয়ার আশায় লোক দেখানো ইবাদত করা ছোট শিরক।',
          points: 1
        },
        {
          id: 'q_mcq_3',
          type: 'mcq',
          question: 'তাওহীদের বিপরীত ধারণাকে কী বলা হয়?',
          options: ['১. নিফাক', '২. শিরক', '৩. ফাসেক', '৪. বিদআত'],
          answer: '২. শিরক',
          points: 1
        },
        {
          id: 'q_mcq_4',
          type: 'mcq',
          question: 'কাউকে ‘রাজাধিরাজ’ বা ‘শাহানশাহ’ উপাধিতে ভূষিত করা—',
          options: ['১. মুস্তাহাব', '২. ছোট শিরকের অন্তর্ভুক্ত', '৩. ওয়াজিব', '৪. জায়েয'],
          answer: '২. ছোট শিরকের অন্তর্ভুক্ত',
          points: 1
        },
        {
          id: 'q_mcq_5',
          type: 'mcq',
          question: 'আল্লাহর জাত, গুণাবলী ও ইবাদাতে অন্যকে অংশীদার করার পরিণতি কী?',
          options: ['১. নেক আমল বিনষ্ট হয়', '২. গুনাহ মাফ হয়', '৩. মর্যাদা বৃদ্ধি পায়', '৪. রিযিক বৃদ্ধি পায়'],
          answer: '১. নেক আমল বিনষ্ট হয়',
          explanation: 'সূরা যুমার: ৬৫ আয়াতে আল্লাহ বলেন: যদি তুমি শিরক করো তবে অবশ্যই তোমার আমল বিনষ্ট হয়ে যাবে।',
          points: 1
        }
      ]
    },
    {
      type: 'true_false',
      title: '৩. সত্য / মিথ্যা যাচাই',
      instructions: 'বাক্যটি সত্য হলে ‘সত্য’ এবং মিথ্যা হলে সঠিক বাক্যটি লেখ:',
      totalMarks: 4,
      questions: [
        {
          id: 'q_tf_1',
          type: 'true_false',
          question: 'শিরককারী তাওবা ছাড়া মারা গেলে আল্লাহ তাকে চিরস্থায়ী ক্ষমা করে দেবেন।',
          answer: 'মিথ্যা (সঠিক: শিরক ক্ষমার অযোগ্য অপরাধ; তাওবা ছাড়া শিরককারী মারা গেলে আল্লাহ তাকে ক্ষমা করবেন না)।',
          points: 1
        },
        {
          id: 'q_tf_2',
          type: 'true_false',
          question: 'রাশি, জ্যোতিষী ও ভবিষ্যৎ বক্তার কথায় বিশ্বাস করা ছোট শিরকের অন্তর্ভুক্ত।',
          answer: 'সত্য',
          points: 1
        },
        {
          id: 'q_tf_3',
          type: 'true_false',
          question: 'বড় শিরক প্রধানত তিন ভাগে বিভক্ত: প্রতিপালনের শিরক, নাম ও গুণাবলীর শিরক এবং ইবাদতের শিরক।',
          answer: 'সত্য',
          points: 1
        },
        {
          id: 'q_tf_4',
          type: 'true_false',
          question: 'আল্লাহ ছাড়া অন্য কারো নামে কসম খাওয়া জায়েয।',
          answer: 'মিথ্যা (সঠিক: আল্লাহ ছাড়া অন্য কারো নামে কসম খাওয়া নিষেধ এবং তা কুফর ও শিরকের শামিল)।',
          points: 1
        }
      ]
    },
    {
      type: 'blank',
      title: '৪. শূণ্যস্থান পূরণ',
      instructions: 'উপযুক্ত শব্দ বসিয়ে বাক্যগুলো পূরণ কর:',
      totalMarks: 4,
      questions: [
        {
          id: 'q_bl_1',
          type: 'blank',
          question: 'আল্লাহর জন্য নির্দিষ্ট কোনো বিষয়ে অন্য কাউকে অংশীদার বানানোই ________।',
          answer: 'শিরক',
          points: 1
        },
        {
          id: 'q_bl_2',
          type: 'blank',
          question: 'ভয়াবহতা অনুসারে শিরক প্রধানত ________ প্রকার।',
          answer: 'দুই (বড় শিরক ও ছোট শিরক)',
          points: 1
        },
        {
          id: 'q_bl_3',
          type: 'blank',
          question: 'যে ব্যক্তি আল্লাহর সাথে শিরক করে, সে তো ঘোর ________ পতিত হয়।',
          answer: 'পথভ্রষ্টতায়',
          points: 1
        },
        {
          id: 'q_bl_4',
          type: 'blank',
          question: 'সবচেয়ে কঠিন পাপ হলো কাউকে আল্লাহর সমকক্ষ বানানো অথচ তিনি তোমাকে ________ করেছেন।',
          answer: 'সৃষ্টি',
          points: 1
        }
      ]
    },
    {
      type: 'essay',
      title: '৫. ব্যাখ্যামূলক / বর্ণনামূলক প্রশ্ন',
      instructions: 'নিচের প্রশ্নটির বিশদ উত্তর দাও:',
      totalMarks: 6,
      questions: [
        {
          id: 'q_es_1',
          type: 'essay',
          question: 'বড় শিরক ও ছোট শিরকের মধ্যে পার্থক্য আলোচনা কর এবং শিরক থেকে বাঁচার উপায়গুলো লেখ।',
          answer: 'বড় শিরক হলো আল্লাহর জাত, গুণাবলী বা ইবাদাতে স্পষ্ট অংশীদার স্থাপন করা, যা সংশ্লিষ্ট ব্যক্তিকে ইসলামের গণ্ডি থেকে বের করে দেয় এবং আমল বিনষ্ট করে। আর ছোট শিরক হলো এমন কাজ যা বাহ্যত শিরকের সদৃশ যেমন লোক দেখানো আমল বা গাইরুল্লাহর নামে কসম।\nশিরক থেকে বাঁচার উপায়: ১. কুরআন-সুন্নাহর সঠিক ইলম অর্জন করা, ২. প্রতিটি ইবাদতে একমাত্র আল্লাহর সন্তুষ্টি (ইখলাস) বজায় রাখা, ৩. কুসংস্কার ও জ্যোতিষীদের কথা বর্জন করা, এবং ৪. নবীজি (সা.) শিখানো মাসনূন দুআ নিয়মিত পাঠ করা।',
          points: 6
        }
      ]
    }
  ]
};
