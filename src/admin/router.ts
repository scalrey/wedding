export type AdminRoute = 'login' | 'dashboard' | 'gallery' | 'content' | 'rsvp' | 'countdown' | 'sections';

export function initRouter(onRoute: (route: AdminRoute) => void): void {
  const handleHashChange = () => {
    const hashValue = window.location.hash.slice(1);
    const validRoutes: AdminRoute[] = ['login', 'dashboard', 'gallery', 'content', 'rsvp', 'countdown', 'sections'];
    
    if (!hashValue || !validRoutes.includes(hashValue as AdminRoute)) {
      window.location.hash = 'dashboard';
      return;
    }
    
    onRoute(hashValue as AdminRoute);
  };

  window.addEventListener('hashchange', handleHashChange);
  // Run on mount
  handleHashChange();
}

export function navigateTo(route: AdminRoute): void {
  window.location.hash = route;
}
