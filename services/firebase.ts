import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  writeBatch,
  initializeFirestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { HistoryItem, SavedBook, TOCChapter } from '../types';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Offline mode / initial connection check is handled gracefully
    console.log("Firestore initialized. Operating with local cache and cloud synchronization.");
  }
}

// User Profile handling
export async function syncUserProfile(user: User) {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Authentication Helpers
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error("Logout error:", error);
    throw error;
  }
}

// ==========================================
// 1. HISTORY ITEMS FIRESTORE SYNC
// ==========================================
export async function saveHistoryToFirestore(userId: string, item: HistoryItem) {
  const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const validHistoryId = sanitizeId(item.id || String(Date.now()));
  const path = `users/${userId}/history/${validHistoryId}`;
  
  try {
    const docRef = doc(db, 'users', userId, 'history', validHistoryId);
    
    // Clean requests without bulky binary file buffers
    const cleanExerciseRequest = item.exerciseRequest ? {
      ...item.exerciseRequest,
      file: null,
      fileData: null
    } : null;

    const cleanLessonPlanRequest = item.lessonPlanRequest ? {
      ...item.lessonPlanRequest,
      file: null,
      fileData: null,
      pageImages: []
    } : null;

    const cleanDetailedPlanRequest = item.detailedPlanRequest ? {
      ...item.detailedPlanRequest,
      file: null,
      fileData: null
    } : null;

    const payload: any = {
      id: validHistoryId,
      userId,
      mode: item.mode || 'exercise',
      gradeLevel: item.gradeLevel || '',
      topicTitle: item.topicTitle || '',
      chapterTitle: item.chapterTitle || '',
      previewText: item.previewText || '',
      fullContent: item.fullContent || '',
      timestamp: item.timestamp || Date.now(),
      createdAt: new Date().toISOString()
    };

    if (item.duration) payload.duration = item.duration;
    if (item.exerciseData) payload.exerciseDataJson = JSON.stringify(item.exerciseData);
    if (item.detailedPlanData) payload.detailedPlanDataJson = JSON.stringify(item.detailedPlanData);
    if (cleanExerciseRequest) payload.exerciseRequestJson = JSON.stringify(cleanExerciseRequest);
    if (cleanLessonPlanRequest) payload.lessonPlanRequestJson = JSON.stringify(cleanLessonPlanRequest);
    if (cleanDetailedPlanRequest) payload.detailedPlanRequestJson = JSON.stringify(cleanDetailedPlanRequest);

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchHistoryFromFirestore(userId: string): Promise<HistoryItem[]> {
  const path = `users/${userId}/history`;
  try {
    const q = query(
      collection(db, 'users', userId, 'history'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    const items: HistoryItem[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let exerciseData = undefined;
      let detailedPlanData = undefined;
      let exerciseRequest = undefined;
      let lessonPlanRequest = undefined;
      let detailedPlanRequest = undefined;

      try {
        if (data.exerciseDataJson) exerciseData = JSON.parse(data.exerciseDataJson);
      } catch (e) {}

      try {
        if (data.detailedPlanDataJson) detailedPlanData = JSON.parse(data.detailedPlanDataJson);
      } catch (e) {}

      try {
        if (data.exerciseRequestJson) exerciseRequest = JSON.parse(data.exerciseRequestJson);
      } catch (e) {}

      try {
        if (data.lessonPlanRequestJson) lessonPlanRequest = JSON.parse(data.lessonPlanRequestJson);
      } catch (e) {}

      try {
        if (data.detailedPlanRequestJson) detailedPlanRequest = JSON.parse(data.detailedPlanRequestJson);
      } catch (e) {}

      items.push({
        id: data.id || docSnap.id,
        timestamp: data.timestamp || Date.now(),
        mode: data.mode || 'exercise',
        gradeLevel: data.gradeLevel || '',
        topicTitle: data.topicTitle || '',
        chapterTitle: data.chapterTitle || '',
        duration: data.duration || 1,
        previewText: data.previewText || '',
        fullContent: data.fullContent || '',
        exerciseData,
        detailedPlanData,
        exerciseRequest,
        lessonPlanRequest,
        detailedPlanRequest
      });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteHistoryFromFirestore(userId: string, historyId: string) {
  const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const validHistoryId = sanitizeId(historyId);
  const path = `users/${userId}/history/${validHistoryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'history', validHistoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearHistoryFromFirestore(userId: string) {
  const path = `users/${userId}/history`;
  try {
    const q = query(collection(db, 'users', userId, 'history'));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 2. SAVED BOOKS & TOC FIRESTORE SYNC
// ==========================================
export async function saveBookToFirestore(userId: string, book: SavedBook) {
  const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const validBookId = sanitizeId(book.id || String(Date.now()));
  const path = `users/${userId}/books/${validBookId}`;

  try {
    const docRef = doc(db, 'users', userId, 'books', validBookId);
    const payload = {
      id: validBookId,
      userId,
      title: book.title || 'নামবিহীন বই',
      fileName: book.fileName || '',
      pageCount: book.pageCount || 0,
      gradeLevel: book.gradeLevel || '',
      subject: book.subject || '',
      category: book.category || book.subject || 'সাধারণ ও অন্যান্য',
      chaptersJson: JSON.stringify(book.chapters || []),
      createdAt: book.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchBooksFromFirestore(userId: string): Promise<SavedBook[]> {
  const path = `users/${userId}/books`;
  try {
    const q = query(
      collection(db, 'users', userId, 'books'),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const books: SavedBook[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let chapters: TOCChapter[] = [];
      try {
        if (data.chaptersJson) {
          chapters = JSON.parse(data.chaptersJson);
        }
      } catch (e) {
        console.error("Error parsing chapters JSON from Firestore", e);
      }

      books.push({
        id: data.id || docSnap.id,
        userId: data.userId || userId,
        title: data.title || 'নামবিহীন বই',
        fileName: data.fileName || '',
        pageCount: data.pageCount || 0,
        gradeLevel: data.gradeLevel || '',
        subject: data.subject || '',
        category: data.category || data.subject || 'সাধারণ ও অন্যান্য',
        chapters,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now()
      });
    });

    return books;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function deleteBookFromFirestore(userId: string, bookId: string) {
  const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const validBookId = sanitizeId(bookId);
  const path = `users/${userId}/books/${validBookId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'books', validBookId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

