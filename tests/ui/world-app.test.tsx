import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="canvas" />,
  useFrame: () => {},
  useThree: () => ({}),
}));
vi.mock('@react-three/postprocessing', () => ({ EffectComposer: () => null, Bloom: () => null }));

import WorldApp from '../../src/world/WorldApp';
import { FADE_MS } from '../../src/world/ui/Fade';
import { useWorld } from '../../src/world/store';
import { playerPose } from '../../src/world/scene/Player';
import { NORTH, SPAWN_POSE, type SceneGeometry } from '../../src/world/types';

const env = { webgl: true, reducedMotion: false, coarsePointer: false, shortSide: 900 };
const geo: SceneGeometry = {
  bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, colliders: [], doors: [], exits: [], exhibits: [],
  entrance: { x: 0, z: 0, heading: NORTH }, cameraDistance: 18,
};
const wrapOf = (c: HTMLElement) => c.querySelector('[data-world-focus]') as HTMLElement;

beforeEach(() => {
  window.history.replaceState(null, '', '/#/world');
  useWorld.setState({
    scene: { kind: 'world' }, phase: 'idle', pending: null, geometry: null, activeId: null, mapOpen: false,
    nearId: null, nearestId: null, worldPose: { ...SPAWN_POSE }, toast: null,
  });
});

describe('WorldApp', () => {
  it('is the focused application wrapper', () => {
    const { container } = render(<WorldApp env={env} />);
    const wrap = wrapOf(container);
    expect(wrap).not.toHaveAttribute('role');
    expect(wrap).toHaveClass('world');
    const app = screen.getByRole('application');
    expect(wrap.contains(app)).toBe(true);
    expect(app.querySelector('[data-testid="joystick"], .world-hud, .world-panel')).toBeNull();
    expect(app.getAttribute('aria-label')).toBe("Brayden's World. W A S D or arrows to move, E to open an exhibit, M for the map.");
    expect(document.activeElement).toBe(wrap);
  });

  it('first focusable element is the "Skip to box score" link', () => {
    const { container } = render(<WorldApp env={env} />);
    const first = container.querySelector('a[href], button, input, [tabindex]:not([tabindex="-1"])');
    expect(first?.textContent).toBe('Skip to box score');
  });

  it('touch wording, joystick, no desktop prompt; interact button when near', () => {
    render(<WorldApp env={{ ...env, coarsePointer: true }} />);
    expect(screen.getByRole('application').getAttribute('aria-label')).toBe(
      "Brayden's World. Drag the pad to move, tap Interact to open an exhibit.",
    );
    expect(screen.getByTestId('joystick')).toBeTruthy();
    act(() => useWorld.getState().setProximity('tranquility-base', 'tranquility-base'));
    expect(screen.getByTestId('interact-button')).toBeTruthy();
    expect(screen.queryByTestId('prompt')).toBeNull();
  });

  it('data-transition goes loading → fading-in → idle after a commit and the fade', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<WorldApp env={env} />);
      const wrap = wrapOf(container);
      expect(wrap).toHaveAttribute('data-transition', 'loading');
      act(() => useWorld.getState().commit({ kind: 'world' }, geo, SPAWN_POSE, null));
      expect(wrap).toHaveAttribute('data-transition', 'fading-in');
      act(() => vi.advanceTimersByTime(FADE_MS));
      expect(wrap).toHaveAttribute('data-transition', 'idle');
      expect(screen.getByTestId('fade').style.opacity).toBe('0');
    } finally {
      vi.useRealTimers();
    }
  });

  it('start() on #tranquility-base plans the workshop with that panel pending', () => {
    window.history.replaceState(null, '', '/#tranquility-base');
    render(<WorldApp env={env} />);
    const p = useWorld.getState().pending;
    expect(p?.scene).toEqual({ kind: 'interior', id: 'workshop' });
    expect(p?.panelId).toBe('tranquility-base');
  });

  it('mounts the map dialog when the store opens it', () => {
    render(<WorldApp env={env} />);
    act(() => {
      useWorld.setState({ phase: 'idle', pending: null });
      useWorld.getState().openMap();
    });
    expect(screen.getByRole('dialog', { name: 'Map' })).toBeTruthy();
  });

  it('unmount in a settled world saves the live pose and clears proximity', () => {
    const { unmount } = render(<WorldApp env={env} />);
    act(() => {
      useWorld.getState().commit({ kind: 'world' }, geo, SPAWN_POSE, null);
      useWorld.getState().settle();
      useWorld.getState().setProximity('contact', 'contact');
    });
    Object.assign(playerPose, { x: 4, z: 2, heading: 1 });
    unmount();
    expect(useWorld.getState().worldPose).toEqual({ x: 4, z: 2, heading: 1 });
    expect(useWorld.getState().nearId).toBeNull();
  });

  it('Scouting Office saves the live pose and goes to the box score', () => {
    render(<WorldApp env={env} />);
    act(() => {
      useWorld.getState().commit({ kind: 'world' }, geo, SPAWN_POSE, null);
      useWorld.getState().settle();
    });
    Object.assign(playerPose, { x: -3, z: 1, heading: 0 });
    act(() => screen.getByRole('button', { name: 'Scouting Office' }).click());
    expect(window.location.hash).toBe('#/box-score');
    expect(useWorld.getState().worldPose).toEqual({ x: -3, z: 1, heading: 0 });
  });

  it('exposes fx, motion and avatar; honours reduced motion and ?fx=low', () => {
    const { container, unmount } = render(<WorldApp env={env} />);
    expect(wrapOf(container)).toHaveAttribute('data-fx', 'full');
    expect(wrapOf(container)).toHaveAttribute('data-motion', 'full');
    expect(wrapOf(container)).toHaveAttribute('data-avatar', 'loading');
    unmount();
    const r = render(<WorldApp env={{ ...env, reducedMotion: true }} />);
    expect(wrapOf(r.container)).toHaveAttribute('data-motion', 'reduced');
    r.unmount();
    window.history.replaceState(null, '', '/?fx=low#/world');
    const low = render(<WorldApp env={env} />);
    expect(wrapOf(low.container)).toHaveAttribute('data-fx', 'low');
    window.history.replaceState(null, '', '/#/world');
  });
});
