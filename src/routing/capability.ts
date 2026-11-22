export type Env = {
  webgl: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
  shortSide: number;
  deviceMemory?: number;
};

export function hasWebGL(doc: Document = document): boolean {
  try {
    const c = doc.createElement('canvas');
    const ctx = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!ctx) return false;
    try {
      ctx.getExtension?.('WEBGL_lose_context')?.loseContext();
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    return false;
  }
}

export function readEnv(win: Window = window): Env {
  const mq = (q: string): boolean => {
    try {
      return typeof win.matchMedia === 'function' ? !!win.matchMedia(q).matches : false;
    } catch {
      return false;
    }
  };
  const sw = win.screen?.width ?? win.innerWidth ?? 0;
  const sh = win.screen?.height ?? win.innerHeight ?? 0;
  const dm = (win.navigator as (Navigator & { deviceMemory?: number }) | undefined)?.deviceMemory;
  return {
    webgl: hasWebGL(win.document),
    reducedMotion: mq('(prefers-reduced-motion: reduce)'),
    coarsePointer: mq('(pointer: coarse)'),
    shortSide: Math.min(sw, sh),
    ...(typeof dm === 'number' ? { deviceMemory: dm } : {}),
  };
}

export function canRunArena(e: Env): boolean {
  return (
    e.webgl &&
    !e.reducedMotion &&
    !(e.coarsePointer && e.shortSide < 768) &&
    !(e.deviceMemory !== undefined && e.deviceMemory < 4)
  );
}
