import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MeshToonMaterial, SRGBColorSpace, TextureLoader, type Texture } from 'three';
import type { Media, ThemeColorKey } from '../../content/types';
import { boardSize } from '../logic/interior';
import { theme } from '../look/theme';
import { gradientMap } from '../scene/materials';

const DEPTH = 0.08;
const BORDER = 0.12;

/** Renders `fallback` when anything below throws (a texture that 404s, an offline load). Never rethrows. */
export class MediaBoundary extends Component<{ fallback: ReactNode; children?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Frame({ w, h, frame, children }: { w: number; h: number; frame: ThemeColorKey; children?: ReactNode }) {
  const mat = useMemo(() => new MeshToonMaterial({ color: theme.accents[frame], gradientMap }), [frame]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[w + BORDER, h + BORDER, DEPTH]} />
      </mesh>
      {children}
    </group>
  );
}

function Face({ w, h, src }: { w: number; h: number; src: string }) {
  // Loaded in an effect (not via Suspense) so a 404 or offline load is simply "no texture": no thrown promise, no page error.
  const [tex, setTex] = useState<Texture | null>(null);
  useEffect(() => {
    let alive = true;
    let loaded: Texture | null = null;
    new TextureLoader().load(
      src,
      (t) => {
        if (!alive) {
          t.dispose();
          return;
        }
        t.colorSpace = SRGBColorSpace;
        loaded = t;
        setTex(t);
      },
      undefined,
      () => {},
    );
    return () => {
      alive = false;
      loaded?.dispose();
    };
  }, [src]);
  if (!tex) return null;
  return (
    <mesh position={[0, 0, DEPTH / 2 + 0.003]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/** A framed picture from `public/media/**`. Until the image loads, and for good if it cannot, the board shows an ink face. */
export function MediaBoard({ media, width, position, rotationY = 0, frame = 'ink' }: {
  media: Media; width: number; position: [number, number, number]; rotationY?: number; frame?: ThemeColorKey;
}): JSX.Element {
  if (!media.src.startsWith('/media/')) throw new Error('MediaBoard: same-origin /media/ only');
  const [w, h] = boardSize(media, width);
  const plain = (
    <mesh position={[0, 0, DEPTH / 2 + 0.002]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={theme.accents.ink} />
    </mesh>
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Frame w={w} h={h} frame={frame}>
        <MediaBoundary fallback={plain}>
          {plain}
          <Face w={w} h={h} src={media.src} />
        </MediaBoundary>
      </Frame>
    </group>
  );
}
