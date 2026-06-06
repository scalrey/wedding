/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GalleryImage } from './types';

export function initGallery(images: GalleryImage[], containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Render the responsive grid structure
  let gridHtml = `<div class="gallery-grid">`;
  images.forEach((img, idx) => {
    gridHtml += `
      <div class="gallery-item-wrapper" data-reveal>
        <div class="gallery-item" data-index="${idx}">
          <img class="gallery-img" src="${img.src}" alt="${img.alt}" loading="lazy" referrerPolicy="no-referrer">
          <div class="gallery-overlay">
            <span class="gallery-caption">${img.caption || 'Viana & Iracelma'}</span>
          </div>
        </div>
      </div>
    `;
  });
  gridHtml += `</div>`;
  container.innerHTML = gridHtml;

  // Single dynamic Lightbox modal elements added to the body
  let lightbox = document.getElementById('global-lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'global-lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox-close" id="lightbox-close" aria-label="Fechar">&times;</button>
      <button class="lightbox-nav lightbox-prev" id="lightbox-prev" aria-label="Anterior">&#10094;</button>
      <div class="lightbox-content">
        <img class="lightbox-img" id="lightbox-img" src="" alt="">
        <p class="lightbox-caption" id="lightbox-caption"></p>
      </div>
      <button class="lightbox-nav lightbox-next" id="lightbox-next" aria-label="Seguinte">&#10095;</button>
    `;
    document.body.appendChild(lightbox);
  }

  const lightboxImg = document.getElementById('lightbox-img') as HTMLImageElement;
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  let currentIndex = 0;

  function openLightbox(index: number): void {
    currentIndex = index;
    updateLightboxContent();
    lightbox?.classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop page background scroll
  }

  function closeLightbox(): void {
    lightbox?.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
  }

  function updateLightboxContent(): void {
    if (!lightboxImg || !lightboxCaption || indexOutOfRange(currentIndex)) return;
    const currentImg = images[currentIndex];
    lightboxImg.src = currentImg.src;
    lightboxImg.alt = currentImg.alt;
    lightboxCaption.textContent = currentImg.caption || '';
  }

  function indexOutOfRange(index: number): boolean {
    return index < 0 || index >= images.length;
  }

  function showNext(): void {
    currentIndex = (currentIndex + 1) % images.length;
    updateLightboxContent();
  }

  function showPrev(): void {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateLightboxContent();
  }

  // Event delegations for gallery item clicks
  container.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const idxAttr = item.getAttribute('data-index');
      if (idxAttr !== null) {
        openLightbox(parseInt(idxAttr, 10));
      }
    });
  });

  // Event handlers for lightboxes
  closeBtn?.addEventListener('click', closeLightbox);
  prevBtn?.addEventListener('click', showPrev);
  nextBtn?.addEventListener('click', showNext);

  // Close when clicking outside content (on the overlay backdrop)
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Handle keyboard key listeners for enhanced UX
  window.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      showNext();
    } else if (e.key === 'ArrowLeft') {
      showPrev();
    }
  });
}
