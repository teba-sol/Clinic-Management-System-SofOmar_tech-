const SW_URL = '/sw.js';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL).catch(() => undefined);
  });
}

export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('pwa:installable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });
}

export function isPwaInstallable(): boolean {
  return deferredPrompt !== null;
}

export function installPwa(): Promise<void> {
  if (!deferredPrompt) return Promise.resolve();
  const prompt = deferredPrompt;
  deferredPrompt = null;
  return prompt.prompt().then(() => prompt.userChoice.then(() => undefined));
}

registerServiceWorker();
setupInstallPrompt();
