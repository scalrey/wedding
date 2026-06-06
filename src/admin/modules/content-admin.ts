import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../firebase';
import { OperationType } from '../../types';

export interface SiteConfig {
  names: string;
  verse: string;
  verseReference: string;
  location: string;
  receptionLocation: string;
  ceremonyTime: string;
  countdownTarget: string; // ISO 8601 string
  sections: {
    countdown: boolean;
    gallery: boolean;
    rsvp: boolean;
  };
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  names: "VIANA & IRACELMA",
  verse: "O amor tudo sofre, tudo crê, tudo espera, tudo suporta.",
  verseReference: "— 1 Coríntios 13:7",
  location: "Catedral Metropolitana, Luanda",
  receptionLocation: "Salão de Festas Império, Luanda",
  ceremonyTime: "15h00",
  countdownTarget: "2026-11-01T15:00:00",
  sections: {
    countdown: true,
    gallery: true,
    rsvp: true
  }
};

export async function getSiteConfig(): Promise<SiteConfig> {
  const firestore = db;
  if (!firestore) return DEFAULT_SITE_CONFIG;
  const configRef = doc(firestore, 'site-config', 'main');
  try {
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...DEFAULT_SITE_CONFIG,
        ...data,
        sections: {
          ...DEFAULT_SITE_CONFIG.sections,
          ...(data.sections || {})
        }
      } as SiteConfig;
    }
    return DEFAULT_SITE_CONFIG;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'site-config/main');
  }
}

export async function saveSiteConfig(config: Partial<SiteConfig>): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  const configRef = doc(firestore, 'site-config', 'main');
  try {
    await setDoc(configRef, config, { merge: true });
    // Emit event on document so any listener receives it in real time
    document.dispatchEvent(new CustomEvent('site-config-updated', { detail: config }));
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'site-config/main');
  }
}
