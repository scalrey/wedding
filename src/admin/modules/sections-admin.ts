import { saveSiteConfig, SiteConfig } from './content-admin';

export function renderSectionsAdmin(
  containerId: string,
  sections: SiteConfig['sections'],
  countdownTarget: string
): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 1. Calculate temporal safeguard (30 days constraint)
  const targetDate = new Date(countdownTarget);
  const now = new Date();
  const diffInMs = targetDate.getTime() - now.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  const isLess30Days = diffInDays > 0 && diffInDays <= 30;

  container.innerHTML = `
    <div class="admin-card">
      <h3 class="admin-card-title">Gestão de Secções do Site</h3>
      <p class="admin-card-description">Ative ou desative as grelhas e blocos do convite em tempo real, sem necessidade de efetuar novos deploys.</p>

      <div class="sections-list" style="margin-top: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Toggle 1: Cronómetro -->
        <div class="section-toggle-card" style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border: 1px solid var(--admin-border); border-radius: 8px; background: var(--admin-card-bg);">
          <div style="flex: 1; padding-right: 1.5rem;">
            <h4 style="font-family: 'Jost', sans-serif; font-size: 1.05rem; font-weight: 500; color: #1A1209; margin-bottom: 0.25rem;">Cronómetro / Contagem Decrescente</h4>
            <p style="font-family: 'Jost', sans-serif; font-size: 0.85rem; color: #777; margin: 0;">Exibe o cronómetro em progresso até à data do casamento.</p>
            ${isLess30Days ? `<span style="display: inline-block; font-size: 0.8rem; color: var(--admin-danger); font-weight: 500; margin-top: 0.25rem;">⚠️ Bloqueado: Não é possível desativar o Cronómetro a menos de 30 dias do casamento!</span>` : ''}
          </div>
          <div>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-countdown" ${sections.countdown ? 'checked' : ''} ${isLess30Days ? 'disabled' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Toggle 2: Galeria -->
        <div class="section-toggle-card" style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border: 1px solid var(--admin-border); border-radius: 8px; background: var(--admin-card-bg);">
          <div style="flex: 1; padding-right: 1.5rem;">
            <h4 style="font-family: 'Jost', sans-serif; font-size: 1.05rem; font-weight: 500; color: #1A1209; margin-bottom: 0.25rem;">Galeria de Fotografias</h4>
            <p style="font-family: 'Jost', sans-serif; font-size: 0.85rem; color: #777; margin: 0;">Mostra a galeria dinâmica aos seus convidados com upload do admin.</p>
          </div>
          <div>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-gallery" ${sections.gallery ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- Toggle 3: Formulário RSVP -->
        <div class="section-toggle-card" style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border: 1px solid var(--admin-border); border-radius: 8px; background: var(--admin-card-bg);">
          <div style="flex: 1; padding-right: 1.5rem;">
            <h4 style="font-family: 'Jost', sans-serif; font-size: 1.05rem; font-weight: 500; color: #1A1209; margin-bottom: 0.25rem;">Formulário RSVP (Presença)</h4>
            <p style="font-family: 'Jost', sans-serif; font-size: 0.85rem; color: #777; margin: 0;">Permite que os convidados confirmem as presenças por telemóvel.</p>
          </div>
          <div>
            <label class="toggle-switch">
              <input type="checkbox" id="toggle-rsvp" ${sections.rsvp ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

      </div>
      
      <div id="sections-feedback-success" class="admin-feedback-success" style="margin-top: 1.5rem; display: none; text-align: center;">
        ✅ Configurações de exibição de secção salvas e atualizadas com sucesso!
      </div>
    </div>
  `;

  // Checkbox references
  const countdownToggle = document.getElementById('toggle-countdown') as HTMLInputElement;
  const galleryToggle = document.getElementById('toggle-gallery') as HTMLInputElement;
  const rsvpToggle = document.getElementById('toggle-rsvp') as HTMLInputElement;
  const feedbackEl = document.getElementById('sections-feedback-success');

  const showFeedback = () => {
    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      setTimeout(() => { feedbackEl.style.display = 'none'; }, 3000);
    }
  };

  countdownToggle?.addEventListener('change', async () => {
    // Prevent toggle if restricted
    if (isLess30Days && !countdownToggle.checked) {
      countdownToggle.checked = true;
      alert('Não é permitido desativar a contagem decrescente a menos de 30 dias do evento.');
      return;
    }
    try {
      const updatedSections = {
        ...sections,
        countdown: countdownToggle.checked
      };
      await saveSiteConfig({ sections: updatedSections });
      sections.countdown = countdownToggle.checked;
      showFeedback();
    } catch (e: any) {
      countdownToggle.checked = !countdownToggle.checked;
      alert('Erro ao atualizar: ' + e.message);
    }
  });

  galleryToggle?.addEventListener('change', async () => {
    try {
      const updatedSections = {
        ...sections,
        gallery: galleryToggle.checked
      };
      await saveSiteConfig({ sections: updatedSections });
      sections.gallery = galleryToggle.checked;
      showFeedback();
    } catch (e: any) {
      galleryToggle.checked = !galleryToggle.checked;
      alert('Erro ao atualizar: ' + e.message);
    }
  });

  rsvpToggle?.addEventListener('change', async () => {
    try {
      const updatedSections = {
        ...sections,
        rsvp: rsvpToggle.checked
      };
      await saveSiteConfig({ sections: updatedSections });
      sections.rsvp = rsvpToggle.checked;
      showFeedback();
    } catch (e: any) {
      rsvpToggle.checked = !rsvpToggle.checked;
      alert('Erro ao atualizar: ' + e.message);
    }
  });
}
