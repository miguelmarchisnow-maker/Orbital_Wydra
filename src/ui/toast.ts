let _container: HTMLDivElement | null = null;
let _styleInjected = false;

function ensure(): HTMLDivElement {
  if (_container) return _container;
  if (!_styleInjected) {
    _styleInjected = true;
    const s = document.createElement('style');
    s.textContent = `
      .toast-stack {
        position: fixed;
        bottom: calc(var(--hud-margin) * 1.5);
        right: var(--hud-margin);
        display: flex;
        flex-direction: column-reverse;
        gap: calc(var(--hud-unit) * 0.4);
        z-index: 700;
        pointer-events: none;
      }
      .toast {
        background: var(--hud-bg);
        border: 1px solid var(--hud-border);
        color: var(--hud-text);
        padding: calc(var(--hud-unit) * 0.6) calc(var(--hud-unit) * 1);
        font-family: var(--hud-font);
        font-size: calc(var(--hud-unit) * 0.85);
        letter-spacing: 0.05em;
        box-shadow: 0 calc(var(--hud-unit) * 0.2) calc(var(--hud-unit) * 0.6) rgba(0,0,0,0.5);
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 200ms ease, transform 200ms ease;
      }
      .toast.show { opacity: 1; transform: translateY(0); }
      .toast.err { border-color: #ff6b6b; color: #ff6b6b; }
    `;
    document.head.appendChild(s);
  }
  const c = document.createElement('div');
  c.className = 'toast-stack';
  document.body.appendChild(c);
  _container = c;
  return c;
}

export function toast(msg: string, kind: 'info' | 'err' = 'info', durationMs = 3000): void {
  const stack = ensure();
  const t = document.createElement('div');
  t.className = `toast ${kind === 'err' ? 'err' : ''}`;
  t.textContent = msg;
  stack.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 250);
  }, durationMs);
}
