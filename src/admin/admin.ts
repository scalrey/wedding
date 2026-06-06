import { onAuthChange, type AuthState } from './auth';
import { initRouter, type AdminRoute } from './router';
import { renderAdminPanel } from './ui';

// Injects premium styling rules specifically scoped for the admin workspace
function injectAdminStyles(): void {
  if (document.getElementById('admin-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'admin-styles';
  styleEl.innerHTML = `
    :root {
      --admin-main-bg: #FAF3E0;
      --admin-sidebar-bg: #1A1209;
      --admin-sidebar-active: #C9A84C;
      --admin-sidebar-text: #E8C97A;
      --admin-border: rgba(201, 168, 76, 0.25);
      --admin-danger: #C0392B;
      --admin-card-bg: #FFFFFF;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--admin-main-bg);
      font-family: 'Jost', sans-serif;
      color: #1A1209;
      -webkit-font-smoothing: antialiased;
    }

    /* Navigation links */
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 400;
      border-radius: 6px;
      transition: all 0.2s ease-in-out;
    }

    .sidebar-link:hover {
      background-color: rgba(232, 201, 122, 0.08);
      color: var(--admin-sidebar-text);
    }

    .sidebar-link.active {
      background-color: var(--admin-sidebar-active);
      color: #1A1209;
      font-weight: 500;
    }

    /* Panel cards configuration */
    .admin-card {
      background: var(--admin-card-bg);
      border: 1px solid var(--admin-border);
      border-radius: 12px;
      padding: 2.2rem;
      box-shadow: 0 4px 20px rgba(26, 18, 9, 0.02);
      box-sizing: border-box;
    }

    .admin-card-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.6rem;
      font-weight: 600;
      color: #1A1209;
      margin: 0 0 0.5rem 0;
    }

    .admin-card-description {
      font-family: 'Jost', sans-serif;
      font-size: 0.9rem;
      color: #665c54;
      margin: 0 0 1.5rem 0;
      font-weight: 300;
    }

    /* Stats components and boards */
    .admin-stat-card {
      background: #FFFFFF;
      border: 1px solid var(--admin-border);
      border-left: 4px solid var(--admin-sidebar-active);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.01);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .admin-stat-card .label {
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #777;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }

    .admin-stat-card .value {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.2rem;
      font-weight: 600;
      color: #1A1209;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .admin-stat-card .subtext {
      font-size: 0.8rem;
      color: #888;
    }

    /* Text & dropdown entry components */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-family: 'Jost', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1A1209;
    }

    .form-control {
      font-family: 'Jost', sans-serif;
      font-size: 0.95rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--admin-border);
      border-radius: 6px;
      background-color: #FFFFFF;
      color: #1A1209;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    .form-control:focus {
      border-color: var(--admin-sidebar-active);
      box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
    }

    /* Command submission buttons styling */
    .btn-submit {
      font-family: 'Jost', sans-serif;
      background-color: #1A1209;
      color: #FFFFFF;
      border: 1px solid var(--admin-border);
      font-size: 0.95rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      padding: 0.8rem 2rem;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease-in-out;
    }

    .btn-submit:hover:not(:disabled) {
      background-color: var(--admin-sidebar-active);
      color: #1A1209;
      border-color: var(--admin-sidebar-active);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Core mechanical loading spinners */
    @keyframes admin-spin {
      to { transform: rotate(360deg); }
    }
    
    @keyframes admin-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Grid and tabular configurations */
    .rsvp-table {
      width: 100%;
      border-collapse: collapse;
      background: #FFFFFF;
    }

    .rsvp-table th, .rsvp-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--admin-border);
      font-family: 'Jost', sans-serif;
      box-sizing: border-box;
    }

    .rsvp-table tbody tr:hover {
      background-color: rgba(232, 201, 122, 0.02);
    }

    /* Switches (iOS inspired togglers) */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 34px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .toggle-slider {
      background-color: var(--admin-sidebar-active);
    }

    input:focus + .toggle-slider {
      box-shadow: 0 0 1px var(--admin-sidebar-active);
    }

    input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }

    input:disabled + .toggle-slider {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Selection chips labels */
    .chip-success {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      background-color: rgba(46, 204, 113, 0.12);
      color: #27AE60;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 30px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .chip-danger {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      background-color: rgba(231, 76, 60, 0.12);
      color: var(--admin-danger);
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 30px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Feedback dialogs */
    .admin-feedback-success {
      font-size: 0.85rem;
      color: #27AE60;
      font-weight: 500;
    }

    .admin-feedback-danger {
      font-size: 0.85rem;
      color: var(--admin-danger);
      font-weight: 500;
    }

    /* Summary list panels */
    .dashboard-simple-list .item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed rgba(201,168,76,0.15);
      padding-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .dashboard-simple-list .item-label {
      color: #665c54;
      font-weight: 300;
    }

    .dashboard-simple-list .item-val {
      color: #1A1209;
      font-weight: 500;
    }

    /* Photo listing card effects */
    .admin-photo-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.06);
    }

    /* Custom dropzone upload designs */
    .gallery-dropzone:hover {
      background-color: rgba(201,168,76,0.06) !important;
      border-color: var(--admin-sidebar-active) !important;
    }

    /* Screen responsiveness boundaries */
    @media (max-width: 768px) {
      .mobile-navbar {
        display: flex !important;
      }
      
      .admin-sidebar-nav {
        position: fixed;
        top: 60px;
        left: -240px;
        height: calc(100vh - 60px);
        z-index: 99;
        transition: left 0.3s ease;
        box-shadow: 5px 0 15px rgba(0,0,0,0.1);
      }

      .admin-sidebar-nav.mobile-open {
        left: 0 !important;
      }

      .desktop-logo {
        display: none !important;
      }

      main {
        padding: 1.5rem !important;
      }

      #view-title {
        font-size: 2rem !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

// Initialize admin core routines
document.addEventListener('DOMContentLoaded', () => {
  injectAdminStyles();

  let activeAuthState: AuthState = { user: null, isAuthorized: false, isLoading: true };
  let activeRoute: AdminRoute = 'dashboard';

  // Listen for login/logout actions on state change
  onAuthChange((state) => {
    activeAuthState = state;
    
    if (!state.isLoading && (!state.user || !state.isAuthorized)) {
      renderAdminPanel(state, 'login');
    } else {
      if (activeRoute === 'login') {
        window.location.hash = 'dashboard';
      } else {
        renderAdminPanel(state, activeRoute);
      }
    }
  });

  // Track page routing hashes
  initRouter((route) => {
    activeRoute = route;
    if (!activeAuthState.isLoading) {
      if (!activeAuthState.user || !activeAuthState.isAuthorized) {
        renderAdminPanel(activeAuthState, 'login');
      } else {
        renderAdminPanel(activeAuthState, route);
      }
    }
  });
});
