/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CountdownTime } from './types';

// Target config variables
export const WEDDING_DATE = new Date('2026-11-01T15:00:00');

let lastTimeValues: CountdownTime = {
  days: -1,
  hours: -1,
  minutes: -1,
  seconds: -1
};

export function initCountdown(targetDate: Date, containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Render initial skeleton layout representing the 4 blocks
  container.innerHTML = `
    <div class="countdown-container">
      <div class="countdown-block">
        <span class="countdown-number" id="countdown-days">0</span>
        <span class="countdown-label">Dias</span>
      </div>
      <div class="countdown-block">
        <span class="countdown-number" id="countdown-hours">00</span>
        <span class="countdown-label font-body">Horas</span>
      </div>
      <div class="countdown-block">
        <span class="countdown-number" id="countdown-minutes">00</span>
        <span class="countdown-label">Min</span>
      </div>
      <div class="countdown-block">
        <span class="countdown-number" id="countdown-seconds">00</span>
        <span class="countdown-label">Seg</span>
      </div>
    </div>
  `;

  const daysEl = document.getElementById('countdown-days');
  const hoursEl = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');

  let animationFrameId: number;
  let lastUpdateTime = 0;

  function update(): void {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
      if (container) {
        container.innerHTML = `
          <div class="countdown-welcome-msg" data-reveal>
            Hoje é o nosso grande dia! 💛
          </div>
        `;
      }
      cancelAnimationFrame(animationFrameId);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Apply value changes and trigger flip animations
    updateAndAnimate(daysEl, days, 'days');
    updateAndAnimate(hoursEl, hours, 'hours');
    updateAndAnimate(minutesEl, minutes, 'minutes');
    updateAndAnimate(secondsEl, seconds, 'seconds');

    // Run continuous loop
    animationFrameId = requestAnimationFrame(update);
  }

  function updateAndAnimate(el: HTMLElement | null, newValue: number, key: keyof CountdownTime): void {
    if (!el) return;
    
    const formattedValue = newValue < 10 ? `0${newValue}` : `${newValue}`;
    const currentValue = lastTimeValues[key];

    if (newValue !== currentValue) {
      el.textContent = formattedValue;
      lastTimeValues[key] = newValue;

      // Skip triggering vertical flip animation on initial render (-1)
      if (currentValue !== -1) {
        el.classList.remove('flip-animate');
        // Force Reflow to restart animation
        void el.offsetWidth;
        el.classList.add('flip-animate');
      }
    }
  }

  // Trigger anim loop
  update();
}
