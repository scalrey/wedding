/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import './style.css';
import { initCountdown, WEDDING_DATE } from './countdown';
import { initGallery } from './gallery';
import { initRSVP } from './rsvp';
import { initScrollReveal, initParallax } from './animations';
import { GalleryImage } from './types';

// Luxury Elegant Placeholder Previews as specified in prompt boundaries
const galleryImages: GalleryImage[] = [
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
  },
  {
    src: 'https://placehold.co/800x600/C9A84C/1A1209?text=Afro+Lux+Vibes',
    alt: 'Decoração e Padrões Tradicionais',
    caption: 'Estilo Africano & Glamour'
  },
  {
    src: 'https://placehold.co/800x600/EDE0C4/3B2F1A?text=A+Certeza+do+Sim',
    alt: 'Momento Especial',
    caption: 'A Certeza do Nosso Sim'
  },
  {
    src: 'https://placehold.co/800x600/1A1209/C9A84C?text=Juntos+para+Sempre',
    alt: 'Viana & Iracelma',
    caption: 'Amor Paciente e Forte'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  // Initialize standard sub-modules
  initCountdown(WEDDING_DATE, 'wedding-countdown');
  initGallery(galleryImages, 'wedding-gallery');
  initRSVP('rsvp-form');
  initScrollReveal();
  initParallax();

  console.log("Wedding Invitation App loaded successfully. Created with 💛 for Viana & Iracelma.");
});
