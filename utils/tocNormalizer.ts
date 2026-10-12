import { TOCChapter, TOCTopic } from '../types';

/**
 * Normalizes a single raw topic from various formats (string, object with different keys)
 */
export const normalizeTopic = (
  rawTopic: any,
  chapterId: string,
  idx: number,
  chapterDefaultPage: number = 1
): TOCTopic => {
  const fallbackId = `${chapterId}_t_${idx + 1}`;
  const defaultPage = Math.max(1, Number(chapterDefaultPage) || 1);

  if (!rawTopic) {
    return {
      id: fallbackId,
      topicNumber: `${idx + 1}`,
      title: `পাঠ ${idx + 1}`,
      pageNumber: defaultPage,
      endPageNumber: defaultPage
    };
  }

  // If raw topic is a plain string
  if (typeof rawTopic === 'string') {
    const trimmed = rawTopic.trim();
    return {
      id: fallbackId,
      topicNumber: `${idx + 1}`,
      title: trimmed || `পাঠ ${idx + 1}`,
      pageNumber: defaultPage,
      endPageNumber: defaultPage,
      contentExcerpt: trimmed
    };
  }

  // If raw topic is an object with varying property names
  const title = (
    rawTopic.title ||
    rawTopic.name ||
    rawTopic.topicTitle ||
    rawTopic.heading ||
    rawTopic.topic ||
    rawTopic.lesson ||
    rawTopic.subtopic ||
    rawTopic.text ||
    `পাঠ ${idx + 1}`
  ).toString().trim();

  const id = rawTopic.id || fallbackId;
  const topicNumber = (rawTopic.topicNumber || rawTopic.number || rawTopic.no || `${idx + 1}`).toString();
  const pageNumber = Number(rawTopic.pageNumber || rawTopic.page || defaultPage) || defaultPage;
  const endPageNumber = Number(rawTopic.endPageNumber || rawTopic.endPage || pageNumber) || pageNumber;
  const contentExcerpt = (
    rawTopic.contentExcerpt ||
    rawTopic.excerpt ||
    rawTopic.summary ||
    rawTopic.description ||
    rawTopic.details ||
    title
  ).toString().trim();

  return {
    id,
    topicNumber,
    title: title || `পাঠ ${idx + 1}`,
    pageNumber,
    endPageNumber,
    contentExcerpt,
    fullText: rawTopic.fullText
  };
};

/**
 * Normalizes a chapter and guarantees it has at least one valid topic/subheading
 */
export const normalizeChapter = (rawCh: any, chIdx: number): TOCChapter => {
  const chId = rawCh.id || `ch_${chIdx + 1}`;
  const title = (
    rawCh.title ||
    rawCh.name ||
    rawCh.chapterTitle ||
    rawCh.heading ||
    `অধ্যায় ${chIdx + 1}`
  ).toString().trim();

  const startPage = Number(rawCh.startPage || rawCh.pageStart || rawCh.page || 1) || 1;
  const endPage = Number(rawCh.endPage || rawCh.pageEnd || rawCh.end || startPage + 10) || (startPage + 10);

  // Search through all plausible keys for topics
  const candidateTopics =
    rawCh.topics ||
    rawCh.subtopics ||
    rawCh.subTopics ||
    rawCh.lessons ||
    rawCh.sections ||
    rawCh.items ||
    rawCh.sub_topics ||
    rawCh.parts ||
    [];

  let topics: TOCTopic[] = [];
  if (Array.isArray(candidateTopics) && candidateTopics.length > 0) {
    topics = candidateTopics.map((t, tIdx) => normalizeTopic(t, chId, tIdx, startPage));
  }

  // CRITICAL: If topics is empty, synthesize a primary topic for the chapter
  // so the user ALWAYS has at least one selectable sub-heading/lesson!
  if (topics.length === 0) {
    topics = [
      {
        id: `${chId}_t_main`,
        topicNumber: '১',
        title: title,
        pageNumber: startPage,
        endPageNumber: endPage,
        contentExcerpt: `${title} - সম্পূর্ণ অধ্যায় ও মূল বিষয়বস্তু`
      }
    ];
  }

  return {
    id: chId,
    title,
    arabicTitle: rawCh.arabicTitle || '',
    startPage,
    endPage,
    topics
  };
};

/**
 * Normalizes an array of chapters, ensuring non-null array and valid topics
 */
export const normalizeChapters = (rawChapters?: any[] | null): TOCChapter[] => {
  if (!Array.isArray(rawChapters) || rawChapters.length === 0) {
    return [];
  }
  return rawChapters.map((ch, idx) => normalizeChapter(ch, idx));
};
