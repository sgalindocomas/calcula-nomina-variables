// Gestión de estado PWA con Svelte 5 Runes

export const pwaState = $state({
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  showPrompt: false,
  updateAvailable: false
});

let swRegistration = null;

export function initPWA() {
  if (typeof window === 'undefined') return;

  // 1. Detección de si ya está instalada / abierta como app standalone
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    pwaState.isInstalled = true;
    pwaState.showPrompt = false;
  }

  // 2. Detección de iOS (Safari no emite beforeinstallprompt)
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
  // Comprobar si es navegador WebKit/Safari
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|android/.test(userAgent);

  if (isIOSDevice && !isStandalone) {
    pwaState.isIOS = true;
    const dismissed = sessionStorage.getItem('pwa_dismissed');
    if (!dismissed) {
      // Mostrar opción opcional al abrir
      pwaState.showPrompt = true;
    }
  }

  // 3. Captura del evento beforeinstallprompt (Android, Chrome, Edge)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pwaState.deferredPrompt = e;
    pwaState.isInstallable = true;

    const dismissed = sessionStorage.getItem('pwa_dismissed');
    if (!dismissed && !pwaState.isInstalled) {
      // Mostrar la opción de instalación de forma opcional al abrir la página
      pwaState.showPrompt = true;
    }
  });

  // 4. Detección cuando la app ha sido instalada exitosamente
  window.addEventListener('appinstalled', () => {
    pwaState.isInstalled = true;
    pwaState.showPrompt = false;
    pwaState.deferredPrompt = null;
    console.log('[PWA] Aplicación instalada con éxito');
  });

  // 5. Registro y monitorización del Service Worker (Auto-actualización)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js', { scope: './' })
        .then((registration) => {
          swRegistration = registration;
          console.log('[PWA] Service Worker registrado con alcance:', registration.scope);

          // Comprobar si hay una actualización pendiente
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nueva versión detectada
                  console.log('[PWA] Nueva versión disponible');
                  pwaState.updateAvailable = true;
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });

          // Comprobación periódica de actualizaciones en la web (cada 30 min)
          setInterval(() => {
            registration.update().catch(() => {});
          }, 30 * 60 * 1000);
        })
        .catch((err) => {
          console.error('[PWA] Error al registrar Service Worker:', err);
        });

      // Si el foco vuelve a la pestaña/app o se conecta a internet, buscar cambios
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && swRegistration) {
          swRegistration.update().catch(() => {});
        }
      });

      window.addEventListener('online', () => {
        if (swRegistration) {
          swRegistration.update().catch(() => {});
        }
      });
    });

    // Cuando el Service Worker nuevo toma el control, recargar suavemente para aplicar cambios
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[PWA] Nueva versión activa. Actualizando interfaz...');
        window.location.reload();
      }
    });
  }
}

// Acción: Lanzar diálogo de instalación nativo
export async function installPWA() {
  if (pwaState.deferredPrompt) {
    pwaState.deferredPrompt.prompt();
    const { outcome } = await pwaState.deferredPrompt.userChoice;
    console.log(`[PWA] Elección del usuario: ${outcome}`);
    if (outcome === 'accepted') {
      pwaState.isInstalled = true;
    }
    pwaState.deferredPrompt = null;
    pwaState.showPrompt = false;
  }
}

// Acción: Descartar / Usar como web (opcional)
export function dismissPWA() {
  pwaState.showPrompt = false;
  // Guardamos en la sesión para no molestar continuamente mientras navega,
  // pero manteniendo la opción siempre disponible si quiere pulsar un botón.
  try {
    sessionStorage.setItem('pwa_dismissed', 'true');
  } catch (e) {}
}

// Acción: Forzar apertura manual del prompt (por ejemplo desde un botón)
export function openPWA() {
  pwaState.showPrompt = true;
}
