import { doc, getDoc, getFirestore, collection, addDoc } from 'firebase/firestore';
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import type { Design } from '../types/design';
import { readSharedDesign } from '../types/design';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let database: ReturnType<typeof getFirestore> | undefined;

function getDatabase() {
  if (database) return database;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* environment variables.');
  }

  database = getFirestore(initializeApp(firebaseConfig));
  return database;
}

export async function saveDesign(design: Design) {
  const message = await addDoc(collection(getDatabase(), 'messages'), design);
  return message.id;
}

export async function getSharedDesign(id: string) {
  const message = await getDoc(doc(getDatabase(), 'messages', id));
  if (!message.exists()) return null;

  return readSharedDesign(`?design=${encodeURIComponent(JSON.stringify(message.data()))}`);
}
