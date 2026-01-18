import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  // iOS + alguns browsers
  // @ts-ignore
  return window.matchMedia?.("(display-mode: standalone)")?.matches || (navigator as any).standalone;
}

export default function InstallAppCTA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const ios = useMemo(() => isIOS(), []);
  const installed = useMemo(() => isInStandaloneMode(), []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (installed) return null;

  // Android/Chrome (tem prompt)
  if (deferredPrompt) {
    return (
      <div className="card p-8">
        <div className="tag">App</div>
        <h3 className="font-display text-3xl mt-3">Instala o app no teu telemóvel</h3>
        <p className="text-white/70 mt-3">
          Fica na tela inicial e abre como app (sem navegador).
        </p>

        <div className="mt-6">
          <button className="btn-gold w-full" onClick={handleInstall}>
            Instalar agora
          </button>
        </div>
      </div>
    );
  }

  // iPhone/Safari (não dá prompt)
  if (ios) {
    return (
      <div className="card p-8">
        <div className="tag">App</div>
        <h3 className="font-display text-3xl mt-3">Colocar na tela inicial (iPhone)</h3>
        <ol className="text-white/70 mt-4 space-y-2 list-decimal pl-5">
          <li>Abre este site no Safari.</li>
          <li>Toca em <b>Partilhar</b> (ícone do quadrado com seta).</li>
          <li>Escolhe <b>Adicionar à tela inicial</b>.</li>
          <li>Confirma o nome e toca em <b>Adicionar</b>.</li>
        </ol>
      </div>
    );
  }

  // Outros: só instrução simples
  return (
    <div className="card p-8">
      <div className="tag">App</div>
      <h3 className="font-display text-3xl mt-3">Instalar na tela inicial</h3>
      <p className="text-white/70 mt-3">
        No menu do navegador, procure por “Instalar app” ou “Adicionar à tela inicial”.
      </p>
    </div>
  );
}
