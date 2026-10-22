import { 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { db } from './firebase';

export interface AppSession {
  sessionId: string;
  deviceId?: string;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  location?: string;
  isp?: string;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  browser: string;
  os: string;
  screenResolution: string;
  startedAt: number;
  lastPingAt: number;
  durationSeconds: number;
  plansCreatedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalLessonPlan {
  id: string;
  sessionId: string;
  deviceId?: string;
  ip?: string;
  location?: string;
  gradeLevel: string;
  duration: number;
  topicTitle?: string;
  chapterTitle?: string;
  previewText: string;
  fullContent: string;
  deviceType: string;
  os: string;
  timestamp: number;
  createdAt: string;
}

export interface GeoLocationInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  location: string;
  isp: string;
}

export const ADMIN_HISTORY_PASSWORD = '45264773';

let inMemoryGeo: GeoLocationInfo | null = null;

// স্থায়ী ডিভাইস আইডি তৈরি (distinguish unique devices across visits)
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'DEV-SERVER';
  try {
    const STORAGE_KEY = 'assunnah_device_id';
    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
      const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      deviceId = `DEV-${part1}-${part2}`;
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch (e) {
    return 'DEV-UNKNOWN';
  }
}

// আইপি ও লোকেশন ফেচিং ফাংশন (৩টি নির্ভরযোগ্য ফলব্যাকসহ)
export async function fetchIpAndLocation(): Promise<GeoLocationInfo> {
  if (inMemoryGeo) return inMemoryGeo;

  try {
    const cached = sessionStorage.getItem('assunnah_geo_info');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.ip) {
        inMemoryGeo = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  const fetchWithTimeout = async (url: string, timeoutMs = 4000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  let detectedGeo: GeoLocationInfo = {
    ip: 'অজানা আইপি',
    city: '',
    region: '',
    country: 'বাংলাদেশ',
    location: 'লোকেশন প্রক্রিয়াধীন',
    isp: ''
  };

  // ফলব্যাক ১: ipwho.is
  try {
    const data = await fetchWithTimeout('https://ipwho.is/');
    if (data && data.success !== false && data.ip) {
      detectedGeo = {
        ip: data.ip,
        city: data.city || '',
        region: data.region || '',
        country: data.country || 'বাংলাদেশ',
        location: data.city ? `${data.city}, ${data.country || 'বাংলাদেশ'}` : (data.country || 'বাংলাদেশ'),
        isp: data.connection?.isp || data.connection?.org || ''
      };
      inMemoryGeo = detectedGeo;
      sessionStorage.setItem('assunnah_geo_info', JSON.stringify(detectedGeo));
      return detectedGeo;
    }
  } catch (e) {}

  // ফলব্যাক ২: ipapi.co
  try {
    const data = await fetchWithTimeout('https://ipapi.co/json/');
    if (data && data.ip) {
      detectedGeo = {
        ip: data.ip,
        city: data.city || '',
        region: data.region || '',
        country: data.country_name || 'বাংলাদেশ',
        location: data.city ? `${data.city}, ${data.country_name || 'বাংলাদেশ'}` : (data.country_name || 'বাংলাদেশ'),
        isp: data.org || ''
      };
      inMemoryGeo = detectedGeo;
      sessionStorage.setItem('assunnah_geo_info', JSON.stringify(detectedGeo));
      return detectedGeo;
    }
  } catch (e) {}

  // ফলব্যাক ৩: ipify.org
  try {
    const data = await fetchWithTimeout('https://api.ipify.org?format=json', 3000);
    if (data && data.ip) {
      detectedGeo = {
        ip: data.ip,
        city: '',
        region: '',
        country: 'বাংলাদেশ',
        location: 'বাংলাদেশ',
        isp: ''
      };
      inMemoryGeo = detectedGeo;
      sessionStorage.setItem('assunnah_geo_info', JSON.stringify(detectedGeo));
      return detectedGeo;
    }
  } catch (e) {}

  return detectedGeo;
}

// ডিভাইস ক্যাটাগরি, OS এবং ব্রাউজার শনাক্তকরণ
export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return { deviceType: 'Desktop' as const, os: 'Unknown', browser: 'Unknown', screenResolution: '1920x1080' };
  }
  const ua = navigator.userAgent;
  let deviceType: 'Mobile' | 'Tablet' | 'Desktop' = 'Desktop';
  if (/(ipad|tablet|(android(?!.*mobile)))/i.test(ua)) deviceType = 'Tablet';
  else if (/Mobile|Android|iP(hone|od)/i.test(ua) || window.innerWidth < 768) deviceType = 'Mobile';

  let os = 'অন্যান্য (OS)';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/iPad/i.test(ua)) os = 'iPadOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'অন্যান্য ব্রাউজার';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';

  const screenResolution = `${window.screen?.width || window.innerWidth || 0}x${window.screen?.height || window.innerHeight || 0}`;
  return { deviceType, os, browser, screenResolution };
}

// সেশন আইডি জেনারেটর
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    let stored = sessionStorage.getItem('assunnah_app_session_id');
    if (!stored) {
      stored = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('assunnah_app_session_id', stored);
    }
    return stored;
  } catch (e) {
    return `sess_${Date.now()}`;
  }
}

// সেশন ট্র্যাকিং শুরু (App লোড হলে কল করতে হবে)
let heartbeatTimer: any = null;
let lastInteractionTime = Date.now();
let activeSecondsInSession = 0;

export function startSessionTracking() {
  if (typeof window === 'undefined') return;

  const sessionId = getOrCreateSessionId();
  const deviceId = getOrCreateDeviceId();
  const deviceInfo = getDeviceInfo();
  const now = Date.now();
  const sessionDocRef = doc(db, 'app_sessions', sessionId);

  const markActive = () => { lastInteractionTime = Date.now(); };
  ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => 
    window.addEventListener(evt, markActive, { passive: true })
  );

  try {
    const saved = parseInt(sessionStorage.getItem('assunnah_session_duration') || '0', 10);
    if (!isNaN(saved)) activeSecondsInSession = saved;
  } catch (e) {}

  const initialPayload: AppSession = {
    sessionId,
    deviceId,
    deviceType: deviceInfo.deviceType,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    screenResolution: deviceInfo.screenResolution,
    startedAt: now,
    lastPingAt: now,
    durationSeconds: activeSecondsInSession,
    plansCreatedCount: 0,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };

  // সেভ করুন (merge: true যাতে আগের ডেটা কখনো না হারায়)
  setDoc(sessionDocRef, initialPayload, { merge: true }).catch(() => {});

  // ব্যাকগ্রাউন্ডে আইপি ও লোকেশন এনে সেশনে যুক্ত করুন
  fetchIpAndLocation().then(geo => {
    if (geo && geo.ip && geo.ip !== 'অজানা আইপি') {
      setDoc(sessionDocRef, { ...geo, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    }
  });

  // প্রতি ৩০ সেকেন্ডে হার্টবিট পিং
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    const isVisible = document.visibilityState === 'visible';
    const isRecentlyActive = (Date.now() - lastInteractionTime) < 3 * 60 * 1000;

    if (isVisible && isRecentlyActive) {
      activeSecondsInSession += 30;
      sessionStorage.setItem('assunnah_session_duration', String(activeSecondsInSession));
      try {
        await updateDoc(sessionDocRef, {
          lastPingAt: Date.now(),
          durationSeconds: activeSecondsInSession,
          updatedAt: new Date().toISOString()
        });
      } catch {
        setDoc(sessionDocRef, {
          sessionId,
          deviceId,
          lastPingAt: Date.now(),
          durationSeconds: activeSecondsInSession,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
    }
  }, 30000);
}

// ব্যবহারকারীর অ্যাক্টিভিটি বা তৈরি করা কাজের গ্লোবাল লগ
export async function logGlobalLessonPlan(planData: {
  gradeLevel: string;
  duration?: number;
  topicTitle?: string;
  chapterTitle?: string;
  previewText: string;
  fullContent: string;
}) {
  try {
    const sessionId = getOrCreateSessionId();
    const deviceId = getOrCreateDeviceId();
    const deviceInfo = getDeviceInfo();
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const planDocRef = doc(db, 'global_lesson_history', planId);

    let geo = inMemoryGeo;
    if (!geo) {
      const cached = sessionStorage.getItem('assunnah_geo_info');
      if (cached) {
        try {
          geo = JSON.parse(cached);
        } catch (e) {}
      }
    }

    const payload: GlobalLessonPlan = {
      id: planId,
      sessionId,
      deviceId,
      ip: geo?.ip || '',
      location: geo?.location || '',
      gradeLevel: planData.gradeLevel,
      duration: planData.duration || 1,
      topicTitle: planData.topicTitle || '',
      chapterTitle: planData.chapterTitle || '',
      previewText: planData.previewText,
      fullContent: planData.fullContent,
      deviceType: deviceInfo.deviceType,
      os: deviceInfo.os,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    };

    await setDoc(planDocRef, payload, { merge: true });

    // সেশনে তৈরি সংখ্যা বাড়ানো
    try {
      await updateDoc(doc(db, 'app_sessions', sessionId), {
        plansCreatedCount: increment(1),
        lastPingAt: Date.now(),
        updatedAt: new Date().toISOString()
      });
    } catch {}

    return planId;
  } catch (err) {
    console.error("Error logging global activity:", err);
    return null;
  }
}

// শুরু থেকে শেষ পর্যন্ত সমস্ত হিস্ট্রি ফেচিং মেথডসমূহ (All-Time Full History)
export async function fetchUsageSessions(limitCount = 2000): Promise<AppSession[]> {
  try {
    const q = query(collection(db, 'app_sessions'), orderBy('startedAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data() as AppSession;
      return {
        ...data,
        sessionId: data.sessionId || d.id,
        deviceId: data.deviceId || 'পূর্বে সংরক্ষিত ডিভাইস',
        ip: data.ip || 'পূর্বে সংরক্ষিত',
        location: data.location || 'পূর্বে সংরক্ষিত লোকেশন',
        durationSeconds: data.durationSeconds || 0,
      };
    });
  } catch (err) {
    console.error("Error fetching usage sessions:", err);
    return [];
  }
}

export async function fetchGlobalLessonPlans(limitCount = 2000): Promise<GlobalLessonPlan[]> {
  try {
    const q = query(collection(db, 'global_lesson_history'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as GlobalLessonPlan), id: d.id }));
  } catch (err) {
    console.error("Error fetching global lesson plans:", err);
    return [];
  }
}

// সময় ও সংখ্যা বাংলায় কনভার্ট করার হেল্পার
export function formatDurationBn(seconds: number): string {
  if (!seconds || seconds < 60) return `${toBengaliDigits(Math.max(0, Math.floor(seconds || 0)))} সেকেন্ড`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours > 0) return `${toBengaliDigits(hours)} ঘণ্টা ${toBengaliDigits(remMinutes)} মিনিট`;
  return `${toBengaliDigits(minutes)} মিনিট`;
}

export function toBengaliDigits(num: number | string): string {
  const bnDigits: { [k: string]: string } = { '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯' };
  return String(num).replace(/[0-9]/g, w => bnDigits[w] || w);
}
