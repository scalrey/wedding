/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { OperationType, type FirestoreErrorInfo } from './types';
import firebaseConfig from '../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let storage: FirebaseStorage | null = null;
let isFirebaseInitialized = false;

// Validate if configuration is loaded and has a valid API key
const isConfigValid = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    storage = getStorage(app);
    isFirebaseInitialized = true;
    console.log("Firebase inicializado com sucesso usando o arquivo de configuração.");
    
    // Validate connection to Firestore as requested in the Skill guidelines
    testConnection();
  } catch (error) {
    console.error("Erro ao inicializar o Firebase a partir do arquivo de configuração:", error);
  }
} else {
  console.warn(
    "Configurações do Firebase não encontradas.\n" +
    "A aplicação funcionará no modo de demonstração local (utilizando localStorage)."
  );
}

async function testConnection() {
  if (!db) return;
  try {
    // Tests connection to server
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Por favor, verifique a sua ligação rede e as configurações Firebase.");
    }
  }
}

/**
 * Handle Firestore Error with spec JSON formatting conforming to FirestoreErrorInfo
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { isFirebaseInitialized, db, auth, googleProvider, storage };
export const firebaseAppConfig = firebaseConfig;
export const firebaseInitializedSuccessfully = isConfigValid;
