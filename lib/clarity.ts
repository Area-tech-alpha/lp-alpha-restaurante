type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

// O clarity.js carrega com lazyOnload, mas o tracker chama identify/set/event
// antes disso. Criamos a mesma fila que o snippet oficial cria (o snippet reusa
// window.clarity se já existir) para que nenhuma chamada se perca.
function clarity(...args: unknown[]) {
  if (!CLARITY_PROJECT_ID || typeof window === "undefined") return;
  if (!window.clarity) {
    const stub: ClarityFn = function () {
      // eslint-disable-next-line prefer-rest-params
      (stub.q = stub.q ?? []).push(arguments);
    };
    window.clarity = stub;
  }
  window.clarity(...args);
}

export function clarityIdentify(sessionId: string) {
  clarity("identify", sessionId);
}

export function claritySet(key: string, value: string | string[]) {
  clarity("set", key, value);
}

export function clarityEvent(name: string) {
  clarity("event", name);
}

// Prioriza a sessão na retenção de gravações do Clarity.
export function clarityUpgrade(reason: string) {
  clarity("upgrade", reason);
}
