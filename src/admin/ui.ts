import { signInWithGoogle, signOutAdmin, type AuthState } from './auth';
import { type AdminRoute, navigateTo } from './router';
import { fetchAllRSVPs, deleteRSVP, exportToCSV, type RSVPEntryWithId } from './modules/rsvp-admin';
import { getSiteConfig, saveSiteConfig, type SiteConfig } from './modules/content-admin';
import { fetchGalleryPhotos, uploadPhoto, deletePhoto, reorderPhotos, type GalleryPhoto } from './modules/gallery-admin';
import { renderCountdownAdmin } from './modules/countdown-admin';
import { renderSectionsAdmin } from './modules/sections-admin';

let loginErrorMsg = '';

export async function renderAdminPanel(state: AuthState, activeRoute: AdminRoute): Promise<void> {
  const root = document.getElementById('admin-root');
  if (!root) return;

  // 1. Loading screen
  if (state.isLoading) {
    root.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background-color: #FAF3E0; color: #1A1209;">
        <div class="admin-spinner" style="border: 4px solid rgba(26, 18, 9, 0.1); border-left-color: #C9A84C; border-radius: 50%; width: 50px; height: 50px; animation: admin-spin 1s linear infinite; margin-bottom: 1.5rem;"></div>
        <p style="font-family: 'Jost', sans-serif; font-size: 1.1rem; letter-spacing: 0.05em; font-weight: 300;">A carregar área restrita...</p>
      </div>
    `;
    return;
  }

  // 2. Unauthenticated Login screen
  if (!state.user || !state.isAuthorized) {
    const errorHtml = loginErrorMsg ? `<div class="admin-login-error" style="background-color: rgba(192, 57, 43, 0.1); color: #C0392B; border: 1px solid rgba(192, 57, 43, 0.3); padding: 1rem; border-radius: 6px; font-family: 'Jost', sans-serif; font-size: 0.9rem; margin-top: 1.5rem; max-width: 350px; text-align: center; width: 100%; box-sizing: border-box;">${loginErrorMsg}</div>` : '';
    
    root.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background-color: #FAF3E0; padding: 2rem; box-sizing: border-box;">
        <div style="background-color: #FFFFFF; border: 1px solid #E8C97A; border-radius: 12px; padding: 3.5rem 2.5rem; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(26, 18, 9, 0.05); display: flex; flex-direction: column; align-items: center; box-sizing: border-box;">
          <div style="font-family: 'Cormorant Garamond', serif; font-size: 3.5rem; font-style: italic; font-weight: 300; color: #1A1209; margin-bottom: 0.5rem; letter-spacing: -0.02em;">V & I</div>
          <h2 style="font-family: 'Jost', sans-serif; font-size: 1.25rem; font-weight: 400; text-transform: uppercase; color: #8C7030; letter-spacing: 0.15em; margin: 0 0 2rem 0;">Área Restrita — Painel</h2>
          
          <p style="font-family: 'Jost', sans-serif; font-size: 0.95rem; color: #665c54; line-height: 1.6; font-weight: 300; margin-bottom: 2.2rem;">
            O acesso a este painel administrativo é reservado. Autentique-se com a sua conta Google autorizada.
          </p>

          <button id="google-login-btn" class="btn-submit" style="background-color: #FFFFFF; border: 1px solid #C9A84C; color: #1A1209; font-weight: 400; display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; max-width: 300px; padding: 0.8rem; border-radius: 6px; box-sizing: border-box; cursor: pointer; transition: all 0.2s ease-in-out;">
            <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span style="font-family: 'Jost', sans-serif; font-size: 0.95rem; font-weight: 500; letter-spacing: 0.05em; color: #1A1209;">Entrar com Google</span>
          </button>
          
          ${errorHtml}
        </div>
      </div>
    `;

    document.getElementById('google-login-btn')?.addEventListener('click', async () => {
      loginErrorMsg = '';
      const loginBtn = document.getElementById('google-login-btn') as HTMLButtonElement;
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.style.opacity = '0.7';
        const span = loginBtn.querySelector('span');
        if (span) span.textContent = 'A autenticar...';
      }

      const res = await signInWithGoogle();
      if (!res.success && res.error) {
        loginErrorMsg = res.error;
        // Trigger re-render
        renderAdminPanel(state, activeRoute);
      }
    });
    return;
  }

  // 3. Authenticated Administrative Shell Layout Setup
  root.innerHTML = `
    <div style="display: flex; flex-direction: column; min-height: 100vh; background-color: var(--admin-main-bg); font-family: 'Jost', sans-serif;">
      
      <!-- HEADER MOBILE -->
      <div class="mobile-navbar" style="display: none; height: 60px; background-color: var(--admin-sidebar-bg); border-bottom: 1px solid var(--admin-sidebar-active); padding: 0 1.5rem; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100;">
        <div style="font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: var(--admin-sidebar-text); letter-spacing: 0.05em;">Admin · V&I</div>
        <button id="hamburger-menu-btn" style="background: none; border: none; cursor: pointer; color: var(--admin-sidebar-text); display: flex; align-items: center; justify-content: center; padding: 0.5rem;">
          <svg style="width: 28px; height: 28px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <div style="display: flex; flex: 1; flex-direction: row; position: relative;">
        <!-- SIDEBAR DE NAVEGAÇÃO -->
        <aside id="admin-sidebar" class="admin-sidebar-nav" style="width: 240px; background-color: var(--admin-sidebar-bg); border-right: 1px solid rgba(232, 201, 122, 0.1); color: var(--admin-sidebar-text); display: flex; flex-direction: column; justify-content: space-between; padding: 2rem 1.5rem; box-sizing: border-box; shrink: 0;">
          <div>
            <div class="desktop-logo" style="font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: #FFFFFF; border-bottom: 1px solid rgba(232, 201, 122, 0.2); padding-bottom: 1rem; margin-bottom: 2rem; letter-spacing: 0.05em; text-align: center;">Admin · Viana & Iracelma</div>
            
            <nav style="display: flex; flex-direction: column; gap: 0.5rem;">
              <a href="#dashboard" class="sidebar-link ${activeRoute === 'dashboard' ? 'active' : ''}">
                <span class="icon">📊</span> Painel Geral
              </a>
              <a href="#content" class="sidebar-link ${activeRoute === 'content' ? 'active' : ''}">
                <span class="icon">✍️</span> Editar Conteúdos
              </a>
              <a href="#gallery" class="sidebar-link ${activeRoute === 'gallery' ? 'active' : ''}">
                <span class="icon">🖼️</span> Galeria de Fotos
              </a>
              <a href="#rsvp" class="sidebar-link ${activeRoute === 'rsvp' ? 'active' : ''}">
                <span class="icon">✉️</span> Convites RSVP
              </a>
              <a href="#countdown" class="sidebar-link ${activeRoute === 'countdown' ? 'active' : ''}">
                <span class="icon">⏳</span> Cronómetro Alvo
              </a>
              <a href="#sections" class="sidebar-link ${activeRoute === 'sections' ? 'active' : ''}">
                <span class="icon">⚙️</span> Ativar Secções
              </a>
            </nav>
          </div>
          
          <div style="margin-top: 2rem; border-top: 1px solid rgba(232, 201, 122, 0.1); padding-top: 1.5rem;">
            <div style="font-size: 0.8rem; color: #888; margin-bottom: 0.75rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${state.user?.email || ''}">
              👤 ${state.user?.displayName || 'Administrador'}
            </div>
            <button id="sidebar-logout-btn" style="background: none; border: 1px solid var(--admin-danger); color: var(--admin-danger); width: 100%; padding: 0.6rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease-in-out; font-family: 'Jost', sans-serif; font-size: 0.85rem; font-weight: 500;">
              Sair da Conta
            </button>
          </div>
        </aside>

        <!-- ÁREA PRINCIPAL -->
        <main style="flex: 1; padding: 3rem; background-color: var(--admin-main-bg); min-width: 0; box-sizing: border-box;" id="admin-main-content">
          <header style="margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 id="view-title" style="font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; font-weight: 600; color: #1A1209; margin: 0 0 0.5rem 0;">Vista Carregada</h1>
              <p id="view-description" style="font-size: 0.95rem; color: #665c54; margin: 0; font-weight: 300;">Descrição da vista...</p>
            </div>
          </header>

          <div id="view-body" style="animation: admin-fade-in 0.3s ease;">
            <!-- Conteúdo carregado programaticamente -->
          </div>
        </main>
      </div>
    </div>
  `;

  // Apply responsive overlay behavior for hamburger
  const hamburger = document.getElementById('hamburger-menu-btn');
  const sidebar = document.getElementById('admin-sidebar');
  hamburger?.addEventListener('click', () => {
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  });

  // Attach logout listener
  document.getElementById('sidebar-logout-btn')?.addEventListener('click', async () => {
    if (confirm('Deseja realmente sair da conta?')) {
      await signOutAdmin();
    }
  });

  // Add listener for sidebar link clicks in mobile to automatically close sidebar
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      sidebar?.classList.remove('mobile-open');
    });
  });

  // 4. Render correct active view
  renderViewContent(activeRoute);
}

async function renderViewContent(route: AdminRoute): Promise<void> {
  const titleEl = document.getElementById('view-title');
  const descEl = document.getElementById('view-description');
  const bodyEl = document.getElementById('view-body');

  if (!titleEl || !descEl || !bodyEl) return;

  // Insert general spinner before fetching database content
  bodyEl.innerHTML = `
    <div style="display: flex; justify-content: center; padding: 4rem 1rem;">
      <div class="admin-spinner" style="border: 3px solid rgba(201,168,76,0.15); border-left-color: #C9A84C; border-radius: 50%; width: 40px; height: 40px; animation: admin-spin 1s linear infinite;"></div>
    </div>
  `;

  try {
    switch (route) {
      case 'dashboard': {
        titleEl.textContent = 'Painel Geral';
        descEl.textContent = 'Resumo de dados, métricas de RSVPs recebidos e situação da galeria em tempo real.';
        
        // Fetch all datasets synchronously to compute stats
        const rsvps = await fetchAllRSVPs();
        const gallery = await fetchGalleryPhotos();
        const config = await getSiteConfig();

        const totalRSVPs = rsvps.length;
        const attendingYes = rsvps.filter(r => r.attending === 'yes').length;
        const attendingNo = rsvps.filter(r => r.attending === 'no').length;
        
        // Count total guests confirmed
        const totalGuests = rsvps
          .filter(r => r.attending === 'yes')
          .reduce((acc, current) => acc + (current.guests || 0), 0);

        const totalExpectedAttendants = attendingYes + totalGuests;

        bodyEl.innerHTML = `
          <!-- Dashboard Metric Grid -->
          <div class="admin-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
            <div class="admin-stat-card">
              <span class="label">Total de Respostas (RSVP)</span>
              <span class="value">${totalRSVPs}</span>
              <span class="subtext">Formulários submetidos no site</span>
            </div>
            <div class="admin-stat-card" style="border-left-color: #27AE60;">
              <span class="label">Presenças Confirmadas ("Sim")</span>
              <span class="value">${attendingYes} <span style="font-size: 1.25rem; font-weight: 400; color: #888;">(+${totalGuests} acomp.)</span></span>
              <span class="subtext"><b>${totalExpectedAttendants}</b> convidados previstos no total</span>
            </div>
            <div class="admin-stat-card" style="border-left-color: #C0392B;">
              <span class="label">Não Comparecem ("Não")</span>
              <span class="value">${attendingNo}</span>
              <span class="subtext">Agradeceram mas recusaram</span>
            </div>
            <div class="admin-stat-card" style="border-left-color: #8C7030;">
              <span class="label">Fotos na Galeria</span>
              <span class="value">${gallery.length}</span>
              <span class="subtext">Imagens enviadas via painel</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
            <!-- Left: Quick Event Data summary -->
            <div class="admin-card">
              <h3 class="admin-card-title">Resumo do Casamento</h3>
              <p class="admin-card-description">Pequenos dados atualmente definidos no convite dinâmico.</p>
              
              <div class="dashboard-simple-list" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                <div class="item">
                  <span class="item-label">Nomes dos Noivos:</span>
                  <span class="item-val"><b>${config.names}</b></span>
                </div>
                <div class="item">
                  <span class="item-label">Local de Recepção:</span>
                  <span class="item-val">${config.receptionLocation}</span>
                </div>
                <div class="item">
                  <span class="item-label">Data e Hora Configurada:</span>
                  <span class="item-val">${new Date(config.countdownTarget).toLocaleString('pt-PT')}</span>
                </div>
                <div class="item">
                  <span class="item-label">Secções Ativas:</span>
                  <span class="item-val">
                    ${config.sections.countdown ? '<span class="chip-success">Cronómetro</span>' : '<span class="chip-danger">Cronómetro</span>'}
                    ${config.sections.gallery ? '<span class="chip-success">Galeria</span>' : '<span class="chip-danger">Galeria</span>'}
                    ${config.sections.rsvp ? '<span class="chip-success">RSVP</span>' : '<span class="chip-danger">RSVP</span>'}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: latest RSVPs list -->
            <div class="admin-card">
              <h3 class="admin-card-title">Últimas Submissões RSVP</h3>
              <p class="admin-card-description">As últimas 5 respostas de presença enviadas pelos convidados.</p>
              
              <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
                ${rsvps.slice(0, 5).map(r => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <div>
                      <div style="font-family: 'Jost', sans-serif; font-size: 0.95rem; font-weight: 500; color: #1A1209;">${r.name}</div>
                      <div style="font-size: 0.8rem; color: #666;">📞 ${r.phone}</div>
                    </div>
                    <div>
                      ${r.attending === 'yes' 
                        ? `<span class="chip-success">Confirmado (+${r.guests})</span>` 
                        : '<span class="chip-danger">Não Vai</span>'
                      }
                    </div>
                  </div>
                `).join('')}
                ${rsvps.length === 0 ? '<div style="text-align: center; color: #999; padding: 2rem 0; font-size: 0.9rem;">Nenhuma presença confirmada até ao momento.</div>' : ''}
              </div>
            </div>
          </div>
        `;
        break;
      }

      case 'content': {
        titleEl.textContent = 'Editar Conteúdos';
        descEl.textContent = 'Modifique os nomes dos noivos, versos bíblicos inspiracionais, horários e endereços das cerimónias religiosas.';
        
        const config = await getSiteConfig();

        bodyEl.innerHTML = `
          <form id="site-config-form" class="admin-card">
            <h3 class="admin-card-title">Configurações Gerais do Casamento</h3>
            <p class="admin-card-description">Todas as modificações são salvas e transmitidas ao site público instantaneamente.</p>

            <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 2rem;">
              
              <!-- Nomes dos noivos -->
              <div class="form-group">
                <label class="form-label" for="field-names">Nomes dos Noivos (Título Principal)</label>
                <input class="form-control" type="text" id="field-names" value="${config.names}" required>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                <!-- Versículo ou Frase Principal -->
                <div class="form-group">
                  <label class="form-label" for="field-verse">Citação Bíblica / Frase de Amor</label>
                  <textarea class="form-control" id="field-verse" rows="3" required>${config.verse}</textarea>
                </div>

                <!-- Referência da citação -->
                <div class="form-group">
                  <label class="form-label" for="field-verse-ref">Referência Autor / Bíblia</label>
                  <input class="form-control" type="text" id="field-verse-ref" value="${config.verseReference || ''}" placeholder="Ex: — 1 Coríntios 13:7">
                </div>
              </div>

              <!-- Spacing partition -->
              <hr style="border: 0; border-top: 1px solid rgba(232,201,122,0.25); margin: 1rem 0;">

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                <!-- Local Religioso -->
                <div class="form-group">
                  <label class="form-label" for="field-location">Localização da Ceremónia Religiosa</label>
                  <input class="form-control" type="text" id="field-location" value="${config.location}" required>
                </div>

                <!-- Local Recepção -->
                <div class="form-group">
                  <label class="form-label" for="field-reception-loc">Localização de Recepção / Copo d'Água</label>
                  <input class="form-control" type="text" id="field-reception-loc" value="${config.receptionLocation || ''}">
                </div>
              </div>

              <!-- Hora da Ceremónia -->
              <div class="form-group" style="max-width: 250px;">
                <label class="form-label" for="field-ceremony-time">Hora da Ceremónia</label>
                <input class="form-control" type="text" id="field-ceremony-time" value="${config.ceremonyTime}" placeholder="Ex: 15h00" required>
              </div>

            </div>

            <div style="margin-top: 2.5rem; display: flex; align-items: center; gap: 1.5rem;">
              <button class="btn-submit" type="submit" style="width: auto; padding: 0.8rem 2.5rem;">
                <span>Guardar alterações</span>
              </button>
              <div id="content-save-feedback" class="admin-feedback-success" style="display: none;">
                ✅ Conteúdos do site salvos e sincronizados com sucesso!
              </div>
            </div>
          </form>
        `;

        const form = document.getElementById('site-config-form');
        form?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          const feedback = document.getElementById('content-save-feedback');
          if (submitBtn) {
            submitBtn.disabled = true;
            const spanText = submitBtn.querySelector('span');
            if (spanText) spanText.textContent = 'A guardar...';
          }

          const updated: Partial<SiteConfig> = {
            names: (document.getElementById('field-names') as HTMLInputElement).value,
            verse: (document.getElementById('field-verse') as HTMLTextAreaElement).value,
            verseReference: (document.getElementById('field-verse-ref') as HTMLInputElement).value,
            location: (document.getElementById('field-location') as HTMLInputElement).value,
            receptionLocation: (document.getElementById('field-reception-loc') as HTMLInputElement).value,
            ceremonyTime: (document.getElementById('field-ceremony-time') as HTMLInputElement).value
          };

          try {
            await saveSiteConfig(updated);
            if (feedback) {
              feedback.style.display = 'block';
              setTimeout(() => { feedback.style.display = 'none'; }, 4000);
            }
          } catch (err: any) {
            alert('Falha ao guardar os conteúdos: ' + err.message);
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              const spanText = submitBtn.querySelector('span');
              if (spanText) spanText.textContent = 'Guardar alterações';
            }
          }
        });
        break;
      }

      case 'gallery': {
        titleEl.textContent = 'Galeria de Fotos';
        descEl.textContent = 'Faça upload de fotos do casal, altere captions descritivas e ordene a exibição final no site.';
        
        await renderGalleryView(bodyEl);
        break;
      }

      case 'rsvp': {
        titleEl.textContent = 'Convites RSVP';
        descEl.textContent = 'Pesquise, filtre e exporte em planilha CSV todas as respostas recolhidas de presenças e acompanhantes.';
        
        await renderRSVPView(bodyEl);
        break;
      }

      case 'countdown': {
        titleEl.textContent = 'Data do Cronómetro';
        descEl.textContent = 'Especifique o marco temporal em que o cronómetro deve expirar no site público.';
        
        const config = await getSiteConfig();
        renderCountdownAdmin('view-body', config.countdownTarget);
        break;
      }

      case 'sections': {
        titleEl.textContent = 'Ativar Secções';
        descEl.textContent = 'Ative ou oculte individualmente secções sensíveis, protegendo limites do evento ou fechando os formulários de RSVP.';
        
        const config = await getSiteConfig();
        renderSectionsAdmin('view-body', config.sections, config.countdownTarget);
        break;
      }
    }
  } catch (error: any) {
    bodyEl.innerHTML = `
      <div style="background-color: rgba(192, 57, 43, 0.08); border: 1px solid var(--admin-danger); color: var(--admin-danger); padding: 1.5rem; border-radius: 8px;">
        <h4 style="margin: 0 0 0.5rem 0; font-family: 'Jost', sans-serif; font-size: 1.1rem; font-weight: 500;">Ocorreu uma falha na ligação com o Firebase</h4>
        <p style="margin: 0; font-size: 0.9rem; line-height: 1.5;">${error.message || error}</p>
      </div>
    `;
  }
}

// Sub-view: Gallery Management Form and Grid
async function renderGalleryView(container: HTMLElement): Promise<void> {
  const images = await fetchGalleryPhotos();

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      
      <!-- Upload Card -->
      <div class="admin-card">
        <h3 class="admin-card-title">Enviar Nova Fotografia</h3>
        <p class="admin-card-description">O tamanho de cada imagem não deve exceder 5MB e deve estar nos formatos JPEG, PNG ou WEBP.</p>

        <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
          <!-- Drop Area Styled container -->
          <div id="drop-zone" class="gallery-dropzone" style="border: 2px dashed var(--admin-border); padding: 2rem; text-align: center; border-radius: 8px; background: rgba(201,168,76,0.03); cursor: pointer; transition: background 0.2s ease;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📁</div>
            <p style="font-family: 'Jost', sans-serif; font-size: 0.95rem; margin: 0 0 0.25rem 0; color: #1A1209;"><b>Clique para selecionar</b> ou arraste o ficheiro de imagem aqui</p>
            <p style="font-size: 0.8rem; color: #888; margin: 0;" id="selected-file-label">Nenhum ficheiro selecionado</p>
            <input type="file" id="file-uploader" accept="image/jpeg,image/png,image/webp" style="display: none;">
          </div>

          <!-- Caption Text Field -->
          <div class="form-group">
            <label class="form-label" for="caption-input">Legenda / Descrição da Foto</label>
            <input class="form-control" type="text" id="caption-input" placeholder="Escreva uma legenda curta (ex: O dia do Ensaio...)">
          </div>

          <!-- Progress Bar wrapper -->
          <div id="upload-progress-container" style="display: none; padding: 0.5rem 0;">
            <div class="progress-bar-bg" style="width: 100%; bg-color: #EDEEDE; height: 10px; border-radius: 5px; overflow: hidden; background: rgba(0,0,0,0.05);">
              <div id="upload-progress-fill" style="width: 0%; height: 100%; background-color: var(--admin-sidebar-active); border-radius: 5px; transition: width 0.1s linear;"></div>
            </div>
            <div id="upload-progress-text" style="text-align: right; font-size: 0.75rem; color: var(--admin-sidebar-active); font-weight: 500; margin-top: 0.25rem;">0% concluído</div>
          </div>

          <div>
            <button id="upload-action-btn" class="btn-submit" style="width: auto; padding: 0.75rem 2rem;" disabled>
              <span>Enviar Fotografia</span>
            </button>
            <span id="upload-action-success" class="admin-feedback-success" style="margin-left: 1rem; display: none;">✅ Upload concluído com sucesso!</span>
          </div>
        </div>
      </div>

      <!-- Photos Grid Card -->
      <div class="admin-card">
        <h3 class="admin-card-title">Registo de Fotos Existentes (${images.length})</h3>
        <p class="admin-card-description">Mude a ordem de exibição usando os botões de seta e remova fotos do catálogo clicando no botão Vermelho.</p>

        <div style="margin-top: 2rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.5rem;">
          ${images.map((img, i) => `
            <div class="admin-photo-card" style="border: 1px solid var(--admin-border); border-radius: 8px; overflow: hidden; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; transform: translate3d(0,0,0); transition: transform 0.2s;">
              <div style="position: relative; width: 100%; padding-top: 75%; background: rgba(0,0,0,0.05); overflow: hidden;">
                <img src="${img.url}" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover;" alt="${img.caption}">
              </div>
              <div style="padding: 0.75rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="font-size: 0.85rem; font-weight: 500; color: #1A1209; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-bottom: 0.75rem;" title="${img.caption || 'Sem legenda'}">
                  ${img.caption || '<i>Sem legenda</i>'}
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <!-- Re-ordering tools -->
                  <div style="display: flex; gap: 0.25rem;">
                    <button class="reorder-btn move-up-btn" data-id="${img.id}" data-index="${i}" style="flex:1; padding: 0.25rem; font-size: 0.75rem; border:1px solid #ddd; background:#F9F9F9; cursor:pointer;" ${i === 0 ? 'disabled style="opacity:0.4; cursor:default;"' : ''}>▲ Subir</button>
                    <button class="reorder-btn move-down-btn" data-id="${img.id}" data-index="${i}" style="flex:1; padding: 0.25rem; font-size: 0.75rem; border:1px solid #ddd; background:#F9F9F9; cursor:pointer;" ${i === images.length - 1 ? 'disabled style="opacity:0.4; cursor:default;"' : ''}>▼ Descer</button>
                  </div>
                  <!-- Danger removal option -->
                  <button class="delete-photo-btn" data-id="${img.id}" data-path="${img.storagePath}" style="width: 100%; background: none; border: 1px solid var(--admin-danger); color: var(--admin-danger); font-size: 0.8rem; padding: 0.35rem; border-radius: 4px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
          ${images.length === 0 ? '<div style="grid-column: 1 / -1; text-align: center; color: #999; padding: 4rem 0;">A galeria de fotografias está vazia. Faça upload da primeira imagem acima!</div>' : ''}
        </div>
      </div>

    </div>
  `;

  // Attach interactive drag & drop selection handlers
  const dropzone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-uploader') as HTMLInputElement;
  const labelEl = document.getElementById('selected-file-label');
  const uploadBtn = document.getElementById('upload-action-btn') as HTMLButtonElement;
  const captionInput = document.getElementById('caption-input') as HTMLInputElement;

  const progressContainer = document.getElementById('upload-progress-container');
  const progressFill = document.getElementById('upload-progress-fill');
  const progressText = document.getElementById('upload-progress-text');
  const successMessage = document.getElementById('upload-action-success');

  let selectedFile: File | null = null;

  dropzone?.addEventListener('click', () => fileInput?.click());
  
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (dropzone) dropzone.style.background = 'rgba(201,168,76,0.08)';
  });

  dropzone?.addEventListener('dragleave', () => {
    if (dropzone) dropzone.style.background = 'rgba(201,168,76,0.03)';
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dropzone) dropzone.style.background = 'rgba(201,168,76,0.03)';
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  const handleFileSelected = (file: File) => {
    selectedFile = file;
    if (labelEl) labelEl.textContent = `Selecionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    if (uploadBtn) uploadBtn.removeAttribute('disabled');
  };

  uploadBtn?.addEventListener('click', async () => {
    if (!selectedFile) return;

    uploadBtn.disabled = true;
    if (progressContainer) progressContainer.style.display = 'block';

    try {
      await uploadPhoto(selectedFile, captionInput.value || '', (progress) => {
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}% concluído`;
      });

      // Clear input form on success
      selectedFile = null;
      if (fileInput) fileInput.value = '';
      if (captionInput) captionInput.value = '';
      if (labelEl) labelEl.textContent = 'Nenhum ficheiro selecionado';
      if (progressContainer) progressContainer.style.display = 'none';
      if (successMessage) {
        successMessage.style.display = 'inline';
        setTimeout(() => { successMessage.style.display = 'none'; }, 4000);
      }

      // Re-render sub-view listing
      renderGalleryView(container);
    } catch (e: any) {
      alert('Falha ao enviar ficheiro: ' + e.message);
      uploadBtn.disabled = false;
      if (progressContainer) progressContainer.style.display = 'none';
    }
  });

  // Attach delete buttons links
  document.querySelectorAll('.delete-photo-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const id = btn.getAttribute('data-id') || '';
      const path = btn.getAttribute('data-path') || '';

      if (confirm('Tem a certeza que deseja excluir esta foto permanentemente da galeria?')) {
        btn.disabled = true;
        btn.textContent = 'A eliminar...';
        try {
          await deletePhoto(id, path);
          renderGalleryView(container);
        } catch (err: any) {
          alert('Erro ao excluir imagem: ' + err.message);
          btn.disabled = false;
          btn.textContent = '🗑️ Eliminar';
        }
      }
    });
  });

  // Attach set ranking / reordering triggers
  document.querySelectorAll('.move-up-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const index = parseInt(btn.getAttribute('data-index') || '0');
      if (index === 0) return;

      const orderedIds = images.map(img => img.id);
      // Swap with previous node rank
      const temp = orderedIds[index - 1];
      orderedIds[index - 1] = orderedIds[index];
      orderedIds[index] = temp;

      try {
        await reorderPhotos(orderedIds);
        renderGalleryView(container);
      } catch (err: any) {
        alert('Erro ao ordenar: ' + err.message);
      }
    });
  });

  document.querySelectorAll('.move-down-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const index = parseInt(btn.getAttribute('data-index') || '0');
      if (index === images.length - 1) return;

      const orderedIds = images.map(img => img.id);
      // Swap with next node rank
      const temp = orderedIds[index + 1];
      orderedIds[index + 1] = orderedIds[index];
      orderedIds[index] = temp;

      try {
        await reorderPhotos(orderedIds);
        renderGalleryView(container);
      } catch (err: any) {
        alert('Erro ao ordenar: ' + err.message);
      }
    });
  });
}

// Sub-view: RSVPs List Filter searching and CSV exporting table
async function renderRSVPView(container: HTMLElement): Promise<void> {
  const originalEntries = await fetchAllRSVPs();
  let entries = [...originalEntries];

  let filterStatus: 'all' | 'yes' | 'no' = 'all';
  let searchTerm = '';

  const renderTableBody = () => {
    // 1. Apply status Filters
    let filtered = entries;
    if (filterStatus !== 'all') {
      filtered = filtered.filter(entry => entry.attending === filterStatus);
    }
    // 2. Apply text searching
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        (entry.name || '').toLowerCase().includes(q) || 
        (entry.phone || '').toLowerCase().includes(q) ||
        (entry.message || '').toLowerCase().includes(q)
      );
    }

    // 3. Compute partial stats row
    const countTotal = filtered.length;
    const countYes = filtered.filter(f => f.attending === 'yes').length;
    const countNo = filtered.filter(f => f.attending === 'no').length;
    const countGuests = filtered
      .filter(f => f.attending === 'yes')
      .reduce((sum, current) => sum + (current.guests || 0), 0);

    // Update statistics display
    const labelTotal = document.getElementById('stat-filter-total');
    const labelYes = document.getElementById('stat-filter-yes');
    const labelNo = document.getElementById('stat-filter-no');
    const labelGuests = document.getElementById('stat-filter-guests');

    if (labelTotal) labelTotal.textContent = String(countTotal);
    if (labelYes) labelYes.textContent = `${countYes} p.`;
    if (labelNo) labelNo.textContent = `${countNo} p.`;
    if (labelGuests) labelGuests.textContent = `+${countGuests} p.`;

    const tableBody = document.getElementById('rsvp-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = filtered.map(row => {
      let dateString = '';
      if (row.submittedAt) {
        try {
          const t = row.submittedAt as any;
          const d = typeof t.toDate === 'function' ? t.toDate() : new Date(t);
          dateString = d.toLocaleString('pt-PT');
        } catch (e) {
          dateString = String(row.submittedAt);
        }
      }

      return `
        <tr>
          <td style="font-weight: 500; color: #1A1209;">${row.name}</td>
          <td>${row.phone}</td>
          <td>
            ${row.attending === 'yes' 
              ? '<span class="chip-success">Confirmado (Sim)</span>' 
              : '<span class="chip-danger">Não Vai</span>'
            }
          </td>
          <td>${row.attending === 'yes' ? row.guests : '—'}</td>
          <td style="font-size: 0.85rem; color: #665c54; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row.message || ''}">
            ${row.message || '<span style="color: #ccc;">Nenhuma</span>'}
          </td>
          <td style="font-size: 0.8rem; color: #888;">${dateString}</td>
          <td>
            <button class="delete-rsvp-action-btn" data-id="${row.id}" style="border: 1px solid var(--admin-danger); color: var(--admin-danger); background: none; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 500; cursor: pointer; transition: background 0.2s;">
              Remover
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: #999; padding: 3rem 1rem;">Nenhum registo RSVP localizado com o filtro atual.</td>
        </tr>
      `;
    }

    // Attach dynamic events for row deletion
    tableBody.querySelectorAll('.delete-rsvp-action-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const id = btn.getAttribute('data-id') || '';
        
        btn.disabled = true;
        btn.textContent = 'Excluindo...';
        
        try {
          const deleted = await deleteRSVP(id);
          if (deleted) {
            // Remove locally rather than making an heavy db reload
            entries = entries.filter(item => item.id !== id);
            renderTableBody();
          } else {
            btn.disabled = false;
            btn.textContent = 'Remover';
          }
        } catch (err: any) {
          alert('Erro ao excluir RSVP: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'Remover';
        }
      });
    });
  };

  // Render parent structure
  const globalTotal = originalEntries.length;
  const globalYes = originalEntries.filter(f => f.attending === 'yes').length;
  const globalNo = originalEntries.filter(f => f.attending === 'no').length;
  const globalGuests = originalEntries
    .filter(f => f.attending === 'yes')
    .reduce((sum, current) => sum + (current.guests || 0), 0);

  container.innerHTML = `
    <!-- RSVP stats board -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div style="background: #FFFFFF; border: 1px solid var(--admin-border); border-radius: 6px; padding: 1rem; display: flex; flex-direction: column; align-items: center;">
        <span style="font-size: 0.8rem; text-transform: uppercase; color: #888; letter-spacing: 0.1em; margin-bottom: 0.25rem;">Resultados Filtrados</span>
        <span style="font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: #1A1209;" id="stat-filter-total">${globalTotal}</span>
      </div>
      <div style="background: #FFFFFF; border: 1px solid var(--admin-border); border-radius: 6px; padding: 1rem; display: flex; flex-direction: column; align-items: center; border-left: 3px solid #34A853;">
        <span style="font-size: 0.8rem; text-transform: uppercase; color: #888; letter-spacing: 0.1em; margin-bottom: 0.25rem;">Presenças confirmadas</span>
        <span style="font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: #34A853;" id="stat-filter-yes">${globalYes} p.</span>
      </div>
      <div style="background: #FFFFFF; border: 1px solid var(--admin-border); border-radius: 6px; padding: 1rem; display: flex; flex-direction: column; align-items: center; border-left: 3px solid var(--admin-danger);">
        <span style="font-size: 0.8rem; text-transform: uppercase; color: #888; letter-spacing: 0.1em; margin-bottom: 0.25rem;">Não comparecem</span>
        <span style="font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: var(--admin-danger);" id="stat-filter-no">${globalNo} p.</span>
      </div>
      <div style="background: #FFFFFF; border: 1px solid var(--admin-border); border-radius: 6px; padding: 1rem; display: flex; flex-direction: column; align-items: center; border-left: 3px solid #8C7030;">
        <span style="font-size: 0.8rem; text-transform: uppercase; color: #888; letter-spacing: 0.1em; margin-bottom: 0.25rem;">Total de Acompanhantes</span>
        <span style="font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: #8C7030;" id="stat-filter-guests">+${globalGuests} p.</span>
      </div>
    </div>

    <!-- Toolbar operations: filtering search and CSV exporting -->
    <div class="admin-card" style="margin-bottom: 2rem; padding: 1.25rem;">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
        
        <!-- Filters & Search block -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; flex: 1; max-width: 650px;">
          <input type="text" id="rsvp-search-bar" class="form-control" placeholder="Buscar por nome, telefone ou mensagem..." style="max-width: 320px; font-size: 0.85rem; padding: 0.45rem 1rem;">
          
          <select id="rsvp-filter-select" class="form-control" style="max-width: 180px; font-size: 0.85rem; padding: 0.45rem 1rem;">
            <option value="all">Todas as respostas</option>
            <option value="yes">Apenas Confirmados (Sim)</option>
            <option value="no">Apenas Recusados (Não)</option>
          </select>
        </div>

        <div>
          <button id="export-csv-btn" class="sidebar-link" style="background-color: var(--admin-sidebar-active); border: none; color: #FFFFFF; font-weight: 500; font-size: 0.9rem; padding: 0.6rem 1.25rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s;">
            📥 Exportar para CSV
          </button>
        </div>

      </div>
    </div>

    <!-- Responsive Table card container -->
    <div class="admin-card" style="padding: 0; overflow-hidden: true; border-radius: 8px;">
      <div style="overflow-x: auto; width: 100%;">
        <table class="rsvp-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="background: rgba(232,201,122,0.06); border-bottom: 1px solid var(--admin-border); font-family: 'Jost', sans-serif;">
              <th style="padding: 1rem 1.5rem; font-weight: 500; color: #8C7030;">Nome Convidado</th>
              <th style="padding: 1rem; font-weight: 500; color: #8C7030;">Telemóvel</th>
              <th style="padding: 1rem; font-weight: 500; color: #8C7030;">Resposta</th>
              <th style="padding: 1rem; font-weight: 500; color: #8C7030;">Acompanhantes</th>
              <th style="padding: 1rem; font-weight: 500; color: #8C7030;">Mensagem / Votos</th>
              <th style="padding: 1rem; font-weight: 500; color: #8C7030;">Data</th>
              <th style="padding: 1rem; font-weight: 500; color: #8C7030;">Ações</th>
            </tr>
          </thead>
          <tbody id="rsvp-table-body">
            <!-- Table content dynamically refreshed by checklist runner -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach search listeners
  const searchInput = document.getElementById('rsvp-search-bar') as HTMLInputElement;
  const filterSelect = document.getElementById('rsvp-filter-select') as HTMLSelectElement;
  const exportBtn = document.getElementById('export-csv-btn');

  searchInput?.addEventListener('input', () => {
    searchTerm = searchInput.value;
    renderTableBody();
  });

  filterSelect?.addEventListener('change', () => {
    filterStatus = filterSelect.value as any;
    renderTableBody();
  });

  exportBtn?.addEventListener('click', () => {
    let filtered = entries;
    if (filterStatus !== 'all') {
      filtered = filtered.filter(entry => entry.attending === filterStatus);
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        (entry.name || '').toLowerCase().includes(q) || 
        (entry.phone || '').toLowerCase().includes(q) ||
        (entry.message || '').toLowerCase().includes(q)
      );
    }
    exportToCSV(filtered);
  });

  // Load first layout batch
  renderTableBody();
}
