import { useEffect } from 'react';
import { useWorld, type WorldStore } from '../store';
import './world-ui.css';

export const TOAST_MS = 4000;

export function Toast({ store = useWorld }: { store?: WorldStore } = {}) {
  const toast = store((s) => s.toast);
  const dismiss = store((s) => s.dismissToast);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismiss, TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast, dismiss]);
  if (!toast) return null;
  return (
    <div className="world-toast" role="status">
      {toast}
    </div>
  );
}
