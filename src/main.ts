/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import './style.css';
import { initCountdown } from './countdown';
import { initGallery } from './gallery';
import { initRSVP } from './rsvp';
import { initScrollReveal, initParallax } from './animations';
import { db } from './firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { type GalleryImage } from './types';

// Default static fallback collection matching elegance demands
const defaultGalleryImages: GalleryImage[] = [
  {
    src: 'https://placehold.co/800x600/C9A84C/FAF3E0?text=Noivos+Viana+%26+Iracelma',
    alt: 'Viana & Iracelma - Foto de Noivado',
    caption: 'Viana & Iracelma'
  },
  {
    src: 'https://placehold.co/800x600/EDE0C4/1A1209?text=Ensaio+Pre-Wedding',
    alt: 'Viana & Iracelma - Ensaio Fotográfico',
    caption: 'A Nossa História'
  },
  {
    src: 'https://placehold.co/800x600/1A1209/FAF3E0?text=Aliancas+de+Casamento',
    alt: 'Alianças de Casamento',
    caption: 'O Compromisso Eterno'
  }
];

function formatPortugueseDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    const formatted = d.toLocaleDateString('pt-PT', options);
    
    // Capitalize Portuguese months for upscale feel (e.g., "Novembro")
    return formatted.replace(/([a-zA-ZÀ-ÿ]+)/g, (match) => {
      if (match.toLowerCase() === 'de') return match.toLowerCase();
      return match.charAt(0).toUpperCase() + match.slice(1);
    });
  } catch (e) {
    return '01 de Novembro de 2026';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Install Static Animations & Controls
  initScrollReveal();
  initParallax();
  initRSVP('rsvp-form');

  // 2. Real-time Firebase Sync Gate
  if (db) {
    console.log("Sincronizando conteúdos do casamento em tempo real via Firestore...");

    // Listen for Site configurations document shifts
    const configDocRef = doc(db, 'site-config', 'main');
    onSnapshot(configDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // 2a. Update text headers
        const namesEl = document.getElementById('wedding-couple-names');
        if (namesEl && data.names) {
          namesEl.textContent = data.names;
        }

        const verseEl = document.getElementById('wedding-verse');
        if (verseEl && data.verse) {
          verseEl.textContent = `"${data.verse.replace(/^"|"$/g, '')}"`;
        }

        const verseRefEl = document.getElementById('wedding-verse-reference');
        if (verseRefEl && data.verseReference) {
          const formattedRef = data.verseReference.startsWith('—') || data.verseReference.startsWith('-')
            ? data.verseReference
            : `— ${data.verseReference}`;
          verseRefEl.textContent = formattedRef;
        }

        // 2b. Update top banner date
        const heroDateEl = document.getElementById('wedding-hero-date');
        if (heroDateEl && data.countdownTarget) {
          heroDateEl.textContent = formatPortugueseDate(data.countdownTarget);
        }

        // 2c. Update informational locations
        const ceremonyTimeEl = document.getElementById('wedding-ceremony-time');
        if (ceremonyTimeEl && data.ceremonyTime) {
          ceremonyTimeEl.textContent = data.ceremonyTime;
        }

        const ceremonyLocEl = document.getElementById('wedding-ceremony-location');
        if (ceremonyLocEl && data.location) {
          ceremonyLocEl.textContent = data.location;
        }

        const receptionTimeEl = document.getElementById('wedding-reception-time');
        if (receptionTimeEl) {
          receptionTimeEl.textContent = data.ceremonyTime ? data.ceremonyTime : '18h30';
        }

        const receptionLocEl = document.getElementById('wedding-reception-location');
        if (receptionLocEl && data.receptionLocation) {
          receptionLocEl.textContent = data.receptionLocation;
        }

        // 2d. Section Display Switches (Gracefully toggles display style block/none)
        const secCountdown = document.getElementById('section-countdown');
        if (secCountdown) {
          secCountdown.style.display = (data.sections?.countdown !== false) ? 'block' : 'none';
        }

        const secGallery = document.getElementById('section-gallery');
        if (secGallery) {
          secGallery.style.display = (data.sections?.gallery !== false) ? 'block' : 'none';
        }

        const secRSVP = document.getElementById('section-rsvp');
        if (secRSVP) {
          secRSVP.style.display = (data.sections?.rsvp !== false) ? 'block' : 'none';
        }

        // 2e. Countdown targets re-ignition
        if (data.countdownTarget) {
          initCountdown(new Date(data.countdownTarget), 'wedding-countdown');
        }
      } else {
        // Fallback standard countdown
        initCountdown(new Date('2026-11-01T15:00:00'), 'wedding-countdown');
      }
    }, (error) => {
      console.warn("Falha de carga em 'site-config', revertendo para local:", error);
      initCountdown(new Date('2026-11-01T15:00:00'), 'wedding-countdown');
    });

    // Listen for photos catalog collection updates
    const galleryColRef = collection(db, 'gallery');
    const galleryQuery = query(galleryColRef, orderBy('order', 'asc'));
    onSnapshot(galleryQuery, (snapshot) => {
      if (!snapshot.empty) {
        const docImages: GalleryImage[] = snapshot.docs.map(docSnapshot => {
          const d = docSnapshot.data();
          return {
            src: d.url || '',
            alt: d.caption || 'Noivos Viana & Iracelma',
            caption: d.caption || ''
          };
        });
        initGallery(docImages, 'wedding-gallery');
      } else {
        initGallery(defaultGalleryImages, 'wedding-gallery');
      }
    }, (error) => {
      console.warn("Erro ao ler coleção 'gallery', usando padrão:", error);
      initGallery(defaultGalleryImages, 'wedding-gallery');
    });

  } else {
    // Offline / unconfigured firebase fallback operations
    console.log("Firebase indisponível. Executando em modo de simulação física local.");
    initCountdown(new Date('2026-11-01T15:00:00'), 'wedding-countdown');
    initGallery(defaultGalleryImages, 'wedding-gallery');
  }

  console.log("Wedding Invitation App loaded successfully. Created with 💛 for Viana & Iracelma.");
});
