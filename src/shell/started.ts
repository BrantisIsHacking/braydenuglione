/** sessionStorage flag: the visitor already passed the start screen this session. */
export const STARTED_KEY = 'world.started';

export function readStarted(): boolean {
  try {
    return window.sessionStorage.getItem(STARTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeStarted(): void {
  try {
    window.sessionStorage.setItem(STARTED_KEY, '1');
  } catch {
    /* storage blocked: the flag lives only in App state */
  }
}
