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

  // Real-time GPS & Landmark tracking
  isGpsAccurate?: boolean;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  precisePlace?: string;       // e.g. "জাতীয় স্টেডিয়াম সংলগ্ন, গুলিস্তান, ঢাকা"
  landmark?: string;           // e.g. "জাতীয় স্টেডিয়াম, ঢাকা"
  fullAddress?: string;        // Full address details
  googleMapsUrl?: string;      // Direct Google Maps pin
  locationSource?: 'gps' | 'ip';
  gpsPermissionStatus?: 'granted' | 'prompt' | 'denied' | 'unsupported';

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

  // Real-time GPS & Landmark tracking
  isGpsAccurate?: boolean;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  precisePlace?: string;
  landmark?: string;
  fullAddress?: string;
  googleMapsUrl?: string;
  locationSource?: 'gps' | 'ip';

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

export interface PreciseLocationInfo {
  isGpsAccurate: boolean;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  precisePlace: string;
  landmark: string;
  fullAddress: string;
  city: string;
  region: string;
  country: string;
  googleMapsUrl: string;
  source: 'gps' | 'ip';
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

let inMemoryPreciseGeo: PreciseLocationInfo | null = null;
let locationListeners: ((info: PreciseLocationInfo) => void)[] = [];

export function getCachedPreciseLocation(): PreciseLocationInfo | null {
  if (inMemoryPreciseGeo) return inMemoryPreciseGeo;
  try {
    const cached = sessionStorage.getItem('assunnah_precise_location');
    if (cached) {
      inMemoryPreciseGeo = JSON.parse(cached);
      return inMemoryPreciseGeo;
    }
  } catch {}
  return null;
}

export function subscribeToPreciseLocation(listener: (info: PreciseLocationInfo) => void) {
  locationListeners.push(listener);
  const current = getCachedPreciseLocation();
  if (current) {
    listener(current);
  }
  return () => {
    locationListeners = locationListeners.filter(l => l !== listener);
  };
}

// রিভার্স জিওকোডিং ও নিকটস্থ জনপ্রিয় স্থাপনা/ল্যান্ডমার্ক শনাক্তকরণ
export async function reverseGeocodeWithLandmark(lat: number, lon: number, accuracyMeters = 15): Promise<PreciseLocationInfo> {
  const googleMapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`;

  // ১. Nominatim (OpenStreetMap) - বাংলা ভাষা ও বিস্তারিত জনপ্রিয় স্থাপনা তথ্যসহ
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&extratags=1&namedetails=1&accept-language=bn,en`,
      { headers: { 'User-Agent': 'AssunnahLessonPlanner/1.0 (abdurrahimassunnah@gmail.com)' } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // জনপ্রিয় স্থাপনা / ল্যান্ডমার্ক / ঐতিহাসিক স্থান / প্রতিষ্ঠান শনাক্তকরণ
      const rawLandmark = 
        addr.amenity || 
        addr.leisure || 
        addr.building || 
        addr.historic || 
        addr.tourism || 
        addr.railway || 
        addr.shop || 
        addr.office || 
        addr.craft || 
        data.name || 
        '';

      const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || addr.residential || '';
      const road = addr.road || '';
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || 'বাংলাদেশ';
      const region = addr.state || '';
      const country = addr.country || 'বাংলাদেশ';

      let landmarkText = rawLandmark ? `${rawLandmark}` : (neighbourhood ? `${neighbourhood}` : (road ? `${road}` : city));

      // ব্যবহারকারীর জন্য স্পষ্ট ও নির্ভরযোগ্য পরিচিত ঠিকানা তৈরি
      let precisePlace = '';
      if (rawLandmark && (neighbourhood || road)) {
        precisePlace = `${rawLandmark} সংলগ্ন, ${neighbourhood || road}, ${city}`;
      } else if (rawLandmark) {
        precisePlace = `${rawLandmark} সংলগ্ন, ${city}`;
      } else if (road && neighbourhood) {
        precisePlace = `${road}, ${neighbourhood}, ${city}`;
      } else if (neighbourhood) {
        precisePlace = `${neighbourhood}, ${city}`;
      } else {
        precisePlace = city;
      }

      return {
        isGpsAccurate: true,
        latitude: lat,
        longitude: lon,
        accuracyMeters: Math.round(accuracyMeters),
        precisePlace: precisePlace.trim(),
        landmark: landmarkText.trim(),
        fullAddress: data.display_name || precisePlace,
        city,
        region,
        country,
        googleMapsUrl,
        source: 'gps'
      };
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode error, trying Photon fallback:", err);
  }

  // ২. Photon (Komoot OSM) ব্যাকআপ ফলব্যাক
  try {
    const res2 = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
    if (res2.ok) {
      const data2 = await res2.json();
      const props = data2.features?.[0]?.properties || {};
      const landmarkText = props.name || props.street || props.locality || 'নিকটবর্তী স্থান';
      const locality = props.locality || props.district || '';
      const city = props.city || props.county || 'বাংলাদেশ';
      const region = props.state || '';

      let precisePlace = '';
      if (props.name && locality) {
        precisePlace = `${props.name} সংলগ্ন, ${locality}, ${city}`;
      } else if (props.name) {
        precisePlace = `${props.name} সংলগ্ন, ${city}`;
      } else if (locality) {
        precisePlace = `${locality}, ${city}`;
      } else {
        precisePlace = city;
      }

      return {
        isGpsAccurate: true,
        latitude: lat,
        longitude: lon,
        accuracyMeters: Math.round(accuracyMeters),
        precisePlace: precisePlace.trim(),
        landmark: landmarkText.trim(),
        fullAddress: `${precisePlace}, ${city}`,
        city,
        region,
        country: 'বাংলাদেশ',
        googleMapsUrl,
        source: 'gps'
      };
    }
  } catch (err) {
    console.warn("Photon fallback failed:", err);
  }

  // ৩. কোঅর্ডিনেট ফলব্যাক
  return {
    isGpsAccurate: true,
    latitude: lat,
    longitude: lon,
    accuracyMeters: Math.round(accuracyMeters),
    precisePlace: `জিপিএস পজিশন (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    landmark: 'জিপিএস স্থানাঙ্ক',
    fullAddress: `অক্ষাংশ: ${lat.toFixed(6)}, দ্রাঘিমাংশ: ${lon.toFixed(6)}`,
    city: '',
    region: '',
    country: 'বাংলাদেশ',
    googleMapsUrl,
    source: 'gps'
  };
}

export interface LocationDetailedResult {
  success: boolean;
  info?: PreciseLocationInfo;
  errorCode?: 'denied' | 'unavailable' | 'timeout' | 'unsupported';
  errorMessage?: string;
}

export function isLocationVerified(): boolean {
  if (typeof window === 'undefined') return true;
  const cached = getCachedPreciseLocation();
  if (cached && cached.isGpsAccurate) return true;
  try {
    return localStorage.getItem('assunnah_location_verified') === 'true' && cached !== null;
  } catch {
    return false;
  }
}

// ব্রাউজারে লোকেশন পারমিশন চাওয়া ও বিস্তারিত ফলাফলসহ হ্যান্ডলিং
export async function requestPreciseLocationDetailed(): Promise<LocationDetailedResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      success: false,
      errorCode: 'unsupported',
      errorMessage: 'আপনার ব্রাউজারটি জিপিএস লোকেশন সমর্থন করে না।'
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const accuracy = pos.coords.accuracy || 15;

          const preciseInfo = await reverseGeocodeWithLandmark(lat, lon, accuracy);
          inMemoryPreciseGeo = preciseInfo;
          try {
            sessionStorage.setItem('assunnah_precise_location', JSON.stringify(preciseInfo));
            localStorage.setItem('assunnah_location_verified', 'true');
            sessionStorage.setItem('assunnah_location_verified', 'true');
          } catch {}

          // Notify UI listeners
          locationListeners.forEach(listener => listener(preciseInfo));

          // তাৎক্ষণিকভাবে বর্তমান সেশন ডকুমেন্টে আপডেট সংরক্ষণ
          const sessionId = getOrCreateSessionId();
          const sessionDocRef = doc(db, 'app_sessions', sessionId);
          await setDoc(sessionDocRef, {
            isGpsAccurate: true,
            latitude: lat,
            longitude: lon,
            accuracyMeters: Math.round(accuracy),
            location: preciseInfo.precisePlace,
            precisePlace: preciseInfo.precisePlace,
            landmark: preciseInfo.landmark,
            fullAddress: preciseInfo.fullAddress,
            city: preciseInfo.city,
            region: preciseInfo.region,
            googleMapsUrl: preciseInfo.googleMapsUrl,
            locationSource: 'gps',
            gpsPermissionStatus: 'granted',
            updatedAt: new Date().toISOString()
          }, { merge: true });

          resolve({ success: true, info: preciseInfo });
        } catch (e) {
          console.error("Error setting up precise location:", e);
          resolve({ 
            success: false, 
            errorCode: 'unavailable', 
            errorMessage: 'লোকেশন প্রক্রিয়া করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' 
          });
        }
      },
      (err) => {
        let code: 'denied' | 'unavailable' | 'timeout' = 'unavailable';
        let msg = 'লোকেশন পাওয়া সম্ভব হয়নি।';
        if (err.code === 1) {
          code = 'denied';
          msg = 'লোকেশন অনুমতি ব্লক (Deny) করা হয়েছে। সাইটটি ব্যবহার করতে অনুগ্রহ করে ব্রাউজার সেটিংসে গিয়ে লোকেশন Allow করুন।';
        } else if (err.code === 2) {
          code = 'unavailable';
          msg = 'ডিভাইসের অবস্থান শনাক্ত করা যায়নি। আপনার ডিভাইসের Location/GPS সার্ভিস চালু আছে কিনা দেখুন।';
        } else if (err.code === 3) {
          code = 'timeout';
          msg = 'লোকেশন সনাক্ত করতে সময়সীমা পার হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।';
        }

        const sessionId = getOrCreateSessionId();
        const sessionDocRef = doc(db, 'app_sessions', sessionId);
        setDoc(sessionDocRef, {
          locationSource: 'ip',
          gpsPermissionStatus: code,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});

        resolve({ success: false, errorCode: code, errorMessage: msg });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  });
}

// ব্রাউজারে লোকেশন পারমিশন চাওয়া ও রিয়েল-টাইম জিপিএস লোকেশন সংগ্রহ
export async function requestPreciseLocation(): Promise<PreciseLocationInfo | null> {
  const result = await requestPreciseLocationDetailed();
  return result.success && result.info ? result.info : null;
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

  // স্বয়ংক্রিয়ভাবে রিয়েল-টাইম নির্ভুল জিপিএস লোকেশন ও জনপ্রিয় স্থাপনা সনাক্তকরণ শুরু
  requestPreciseLocation().catch(() => {});

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

    const precise = getCachedPreciseLocation();

    const payload: GlobalLessonPlan = {
      id: planId,
      sessionId,
      deviceId,
      ip: geo?.ip || '',
      location: precise?.precisePlace || geo?.location || '',
      isGpsAccurate: Boolean(precise?.isGpsAccurate),
      latitude: precise?.latitude,
      longitude: precise?.longitude,
      accuracyMeters: precise?.accuracyMeters,
      precisePlace: precise?.precisePlace,
      landmark: precise?.landmark,
      fullAddress: precise?.fullAddress,
      googleMapsUrl: precise?.googleMapsUrl,
      locationSource: precise?.isGpsAccurate ? 'gps' : 'ip',
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
        location: data.location || data.precisePlace || 'পূর্বে সংরক্ষিত লোকেশন',
        durationSeconds: data.durationSeconds || 0,
        isGpsAccurate: Boolean(data.isGpsAccurate),
        locationSource: data.locationSource || (data.isGpsAccurate ? 'gps' : 'ip')
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
