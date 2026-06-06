/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RSVPEntry, OperationType } from './types';
import { isFirebaseInitialized, db, handleFirestoreError } from './firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

export function initRSVP(formId: string): void {
  const form = document.getElementById(formId) as HTMLFormElement | null;
  if (!form) return;

  const btnSubmit = form.querySelector('.btn-submit') as HTMLButtonElement;
  const feedbackMsg = document.getElementById('rsvp-feedback');
  
  // Elements for conditional show/hide
  const radYes = document.getElementById('attending-yes') as HTMLInputElement | null;
  const radNo = document.getElementById('attending-no') as HTMLInputElement | null;
  const conditionalField = document.getElementById('conditional-guests-group');
  const guestsInput = document.getElementById('guests') as HTMLInputElement | null;

  // Msg Char Counter elements
  const textareaMsg = document.getElementById('message') as HTMLTextAreaElement | null;
  const charCounter = document.getElementById('message-char-count');

  // Toggle Accompaniment field state based on radio selection
  function toggleConditionalField() {
    if (radYes?.checked) {
      conditionalField?.classList.add('active');
      if (guestsInput) {
        guestsInput.required = true;
        guestsInput.min = '0';
        guestsInput.max = '10';
        if (!guestsInput.value) guestsInput.value = '0';
      }
    } else {
      conditionalField?.classList.remove('active');
      if (guestsInput) {
        guestsInput.required = false;
        guestsInput.value = '0';
      }
    }
  }

  radYes?.addEventListener('change', toggleConditionalField);
  radNo?.addEventListener('change', toggleConditionalField);

  // Character counter for the wedding message
  textareaMsg?.addEventListener('input', () => {
    if (charCounter && textareaMsg) {
      const remainingBytes = 300 - textareaMsg.value.length;
      charCounter.textContent = `${textareaMsg.value.length}/300 caracteres`;
    }
  });

  // Handle submit form event
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    if (!form || !btnSubmit) return;

    // Direct UI Loading State
    btnSubmit.disabled = true;
    btnSubmit.classList.add('loading');
    if (feedbackMsg) {
      feedbackMsg.style.display = 'none';
      feedbackMsg.textContent = '';
      feedbackMsg.className = 'feedback-message';
    }

    const formData = new FormData(form);
    const entry: RSVPEntry = {
      name: (formData.get('name') as string).trim(),
      phone: (formData.get('phone') as string).trim(),
      attending: formData.get('attending') as 'yes' | 'no',
      guests: parseInt(formData.get('guests') as string || '0', 10),
      message: (formData.get('message') as string || '').trim()
    };

    // 1. Mandatory Validations
    if (!entry.name || !entry.phone || !entry.attending) {
      showFeedback('Por favor, preencha todos os campos obrigatórios.', 'error');
      resetSubmitState();
      return;
    }

    if (entry.attending === 'yes' && (isNaN(entry.guests) || entry.guests < 0 || entry.guests > 10)) {
      showFeedback('O número de acompanhantes deve ser entre 0 e 10.', 'error');
      resetSubmitState();
      return;
    }

    if (entry.message && entry.message.length > 300) {
      showFeedback('A mensagem para os noivos não deve exceder 300 caracteres.', 'error');
      resetSubmitState();
      return;
    }

    try {
      if (isFirebaseInitialized && db) {
        // 2. Query Firestore by phone for duplication check
        const path = 'rsvps';
        let querySnapshot;
        try {
          const q = query(collection(db, path), where('phone', '==', entry.phone));
          querySnapshot = await getDocs(q);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, path);
        }

        if (querySnapshot && !querySnapshot.empty) {
          showFeedback('Este número de telefone já foi utilizado para confirmar presença.', 'error');
          resetSubmitState();
          return;
        }

        // 3. Save entry to Firestore database
        try {
          await addDoc(collection(db, 'rsvps'), {
            name: entry.name,
            phone: entry.phone,
            attending: entry.attending,
            guests: entry.attending === 'yes' ? entry.guests : 0,
            message: entry.message || '',
            submittedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }

        showFeedback('A sua presença foi confirmada com sucesso! Muito obrigado. 💛', 'success');
        form.reset();
        toggleConditionalField();
        if (charCounter) charCounter.textContent = '0/300 caracteres';

      } else {
        // LOCAL DEMO MODE FALLBACK (using LocalStorage)
        const localRSVPs: RSVPEntry[] = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
        
        // Anti-Duplicate check inside LocalStorage
        const isDuplicate = localRSVPs.some(item => item.phone === entry.phone);
        if (isDuplicate) {
          showFeedback('Este número de telefone já foi utilizado para confirmar presença.', 'error');
          resetSubmitState();
          return;
        }

        // Add item
        entry.submittedAt = new Date().toISOString();
        localRSVPs.push(entry);
        localStorage.setItem('wedding_rsvps', JSON.stringify(localRSVPs));

        // Delay feedback to mimic real database network time
        await new Promise(resolve => setTimeout(resolve, 800));

        showFeedback('A sua presença foi confirmada com sucesso (Modo de Demonstração)! Muito obrigado. 💛', 'success');
        form.reset();
        toggleConditionalField();
        if (charCounter) charCounter.textContent = '0/300 caracteres';
      }
    } catch (error) {
      console.error("Erro no processamento do RSVP:", error);
      showFeedback('Ocorreu um erro ao comunicar com a base de dados. Por favor, tente novamente mais tarde.', 'error');
    } finally {
      resetSubmitState();
    }
  });

  function resetSubmitState() {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('loading');
    }
  }

  function showFeedback(text: string, type: 'success' | 'error') {
    if (!feedbackMsg) return;
    feedbackMsg.textContent = text;
    feedbackMsg.className = `feedback-message ${type}`;
  }
}
