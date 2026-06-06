import { saveSiteConfig } from './content-admin';

export function renderCountdownAdmin(containerId: string, currentTarget: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="admin-card">
      <h3 class="admin-card-title">Configurar Data do Casamento</h3>
      <p class="admin-card-description">Defina a data e hora oficiais do evento para guiar a contagem decrescente e os prazos.</p>
      
      <div style="margin: 1.5rem 0;">
        <label class="form-label" for="wedding-date-input">Data e Hora Alvo</label>
        <input type="datetime-local" id="wedding-date-input" class="form-control" style="max-width: 320px;" value="${currentTarget.slice(0, 16)}">
        <div id="countdown-date-warning" class="admin-feedback-danger" style="margin-top: 0.75rem; display: none;">
          ⚠️ A data selecionada já passou! O site principal exibirá a mensagem de felicitações por defeito.
        </div>
      </div>

      <!-- Live Preview Block -->
      <div class="preview-section-box" style="margin: 2rem 0; padding: 1.5rem; background: rgba(0,0,0,0.03); border: 1px dashed var(--admin-border); border-radius: 8px;">
        <h4 style="font-family: 'Jost', sans-serif; font-size: 0.9rem; text-transform: uppercase; color: #8C7030; margin-bottom: 1.5rem; letter-spacing: 0.05em;">Visualização no Site Público (Tempo Real)</h4>
        
        <div class="countdown-container" style="justify-content: center; transform: scale(0.9); margin: 0 auto; background: #1A1209; padding: 1.5rem; border-radius: 8px; display: flex; gap: 1rem;">
          <div class="countdown-block" style="display: flex; flex-direction: column; align-items: center; min-width: 70px;">
            <span class="countdown-number" id="preview-days" style="color: #FAF3E0; font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 600;">00</span>
            <span class="countdown-label" style="color: #EDE0C4; font-family: 'Jost', sans-serif; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Dias</span>
          </div>
          <div class="countdown-block" style="display: flex; flex-direction: column; align-items: center; min-width: 70px;">
            <span class="countdown-number" id="preview-hours" style="color: #FAF3E0; font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 600;">00</span>
            <span class="countdown-label" style="color: #EDE0C4; font-family: 'Jost', sans-serif; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Horas</span>
          </div>
          <div class="countdown-block" style="display: flex; flex-direction: column; align-items: center; min-width: 70px;">
            <span class="countdown-number" id="preview-minutes" style="color: #FAF3E0; font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 600;">00</span>
            <span class="countdown-label" style="color: #EDE0C4; font-family: 'Jost', sans-serif; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Min</span>
          </div>
          <div class="countdown-block" style="display: flex; flex-direction: column; align-items: center; min-width: 70px;">
            <span class="countdown-number" id="preview-seconds" style="color: #FAF3E0; font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 600;">00</span>
            <span class="countdown-label" style="color: #EDE0C4; font-family: 'Jost', sans-serif; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Seg</span>
          </div>
        </div>
        <div id="preview-complete-msg" style="text-align: center; font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: #1A1209; margin-top: 1rem; display: none;">
          Hoje é o nosso grande dia! 💛
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <button id="save-countdown-btn" class="btn-submit" style="width: auto; padding: 0.75rem 2rem;">
          <span>Guardar Data do Evento</span>
        </button>
        <span id="countdown-save-success" class="admin-feedback-success" style="margin-left: 1rem; display: none;">✅ Data atualizada com sucesso!</span>
      </div>
    </div>
  `;

  const dateInput = document.getElementById('wedding-date-input') as HTMLInputElement;
  const warningEl = document.getElementById('countdown-date-warning');
  const saveBtn = document.getElementById('save-countdown-btn');
  const successEl = document.getElementById('countdown-save-success');

  const pDays = document.getElementById('preview-days');
  const pHours = document.getElementById('preview-hours');
  const pMinutes = document.getElementById('preview-minutes');
  const pSeconds = document.getElementById('preview-seconds');
  const pComplete = document.getElementById('preview-complete-msg');

  let activeTarget = new Date(currentTarget);
  let intervalId: any = null;

  const updatePreview = () => {
    const now = new Date();
    const diff = activeTarget.getTime() - now.getTime();

    if (diff <= 0) {
      if (warningEl) warningEl.style.display = 'block';
      const containerBox = pDays?.closest('.countdown-container') as HTMLElement;
      if (containerBox) containerBox.style.display = 'none';
      if (pComplete) pComplete.style.display = 'block';
      return;
    }

    if (warningEl) warningEl.style.display = 'none';
    const containerBox = pDays?.closest('.countdown-container') as HTMLElement;
    if (containerBox) containerBox.style.display = 'flex';
    if (pComplete) pComplete.style.display = 'none';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (pDays) pDays.textContent = days < 10 ? `0${days}` : String(days);
    if (pHours) pHours.textContent = hours < 10 ? `0${hours}` : String(hours);
    if (pMinutes) pMinutes.textContent = minutes < 10 ? `0${minutes}` : String(minutes);
    if (pSeconds) pSeconds.textContent = seconds < 10 ? `0${seconds}` : String(seconds);
  };

  // Re-calculate target on input changes
  dateInput.addEventListener('input', () => {
    if (dateInput.value) {
      activeTarget = new Date(dateInput.value);
      updatePreview();
    }
  });

  // Clock runner
  intervalId = setInterval(updatePreview, 1000);
  updatePreview();

  // Handle Save
  saveBtn?.addEventListener('click', async () => {
    if (!dateInput.value) return;
    saveBtn.setAttribute('disabled', 'true');
    const spanText = saveBtn.querySelector('span');
    if (spanText) spanText.textContent = 'A guardar...';

    try {
      const selectedIsoStamp = new Date(dateInput.value).toISOString();
      await saveSiteConfig({ countdownTarget: selectedIsoStamp });
      if (successEl) {
        successEl.style.display = 'inline';
        setTimeout(() => { successEl.style.display = 'none'; }, 4000);
      }
    } catch (e: any) {
      alert('Erro ao guardar as alterações: ' + e.message);
    } finally {
      saveBtn.removeAttribute('disabled');
      if (spanText) spanText.textContent = 'Guardar Data do Evento';
    }
  });

  // Tidy up timers when routing
  const clearTimersOnRoute = () => {
    if (intervalId) clearInterval(intervalId);
    window.removeEventListener('hashchange', clearTimersOnRoute);
  };
  window.addEventListener('hashchange', clearTimersOnRoute);
}
