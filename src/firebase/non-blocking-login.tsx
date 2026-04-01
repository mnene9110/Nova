
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  UserCredential,
} from 'firebase/auth';

/** 
 * Persistent Guest Logic:
 * Instead of standard signInAnonymously (which is lost on sign out),
 * we create a hidden email/password account and store credentials locally.
 */
export async function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  if (typeof window === 'undefined') return signInAnonymously(authInstance);

  const saved = localStorage.getItem('mf_guest_recovery');
  if (saved) {
    try {
      const { email, password } = JSON.parse(saved);
      return await signInWithEmailAndPassword(authInstance, email, password);
    } catch (e) {
      console.warn("Guest recovery failed, creating new account", e);
      localStorage.removeItem('mf_guest_recovery');
    }
  }

  // Create a new "Persistent Guest"
  const randomId = Math.random().toString(36).substring(2, 10);
  const email = `guest_${randomId}@matchflow.app`;
  const password = `pass_${randomId}_${Date.now()}`;
  
  const cred = await createUserWithEmailAndPassword(authInstance, email, password);
  localStorage.setItem('mf_guest_recovery', JSON.stringify({ email, password }));
  return cred;
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Link an existing anonymous account to an email and password. */
export function linkAccountToEmail(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  const user = authInstance.currentUser;
  if (!user) throw new Error("No user currently signed in.");
  
  const credential = EmailAuthProvider.credential(email, password);
  return linkWithCredential(user, credential).then((result) => {
    // Once linked, we no longer need the guest recovery key
    localStorage.removeItem('mf_guest_recovery');
    return result;
  });
}
