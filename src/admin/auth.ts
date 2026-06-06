import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const ALLOWED_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'scalrey17@gmail.com';

export interface AuthState {
  user: User | null;
  isAuthorized: boolean;
  isLoading: boolean;
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  if (!auth || !googleProvider) {
    return { success: false, error: 'O Firebase não está ativado ou inicializado.' };
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (!user || user.email !== ALLOWED_EMAIL) {
      await signOut(auth);
      return { success: false, error: 'Acesso recusado: esta conta Google não está autorizada como administrador.' };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Erro no Google Sign-In:', err);
    let errorMessage = 'Falha ao autenticar com o Google.';
    if (err.code === 'auth/popup-blocked') {
      errorMessage = 'O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site.';
    } else if (err.code === 'auth/popup-closed-by-user') {
      errorMessage = 'A janela de autenticação foi fechada antes de concluir.';
    } else if (err.code === 'auth/network-request-failed') {
      errorMessage = 'Erro de ligação de rede. Verifique a sua conectividade.';
    }
    return { success: false, error: errorMessage };
  }
}

export async function signOutAdmin(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export function onAuthChange(callback: (state: AuthState) => void): () => void {
  // Emit loading state initially
  callback({ user: null, isAuthorized: false, isLoading: true });

  if (!auth) {
    callback({ user: null, isAuthorized: false, isLoading: false });
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    callback({
      user,
      isAuthorized: user?.email === ALLOWED_EMAIL,
      isLoading: false
    });
  });
}
