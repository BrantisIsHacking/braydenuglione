import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="canvas" />,
  useFrame: () => {},
}));
vi.mock('../../src/arena/scene/Court', () => ({ Court: () => null }));
vi.mock('../../src/arena/scene/Furniture', () => ({ Furniture: () => null }));
vi.mock('../../src/arena/scene/Hoop', () => ({ Hoops: () => null }));

import ArenaApp from '../../src/arena/ArenaApp';
import { useArena } from '../../src/arena/store';

const env = { webgl: true, reducedMotion: false, coarsePointer: false, shortSide: 900 };

describe('ArenaApp', () => {
  it('focuses the application wrapper on mount', () => {
    const { container } = render(<ArenaApp stationId={null} env={env} />);
    const wrap = container.querySelector('[data-arena-focus]') as HTMLElement;
    expect(wrap).toHaveAttribute('role', 'application');
    expect(document.activeElement).toBe(wrap);
  });
  it('uses touch wording on coarse pointers', () => {
    render(<ArenaApp stationId={null} env={{ ...env, coarsePointer: true }} />);
    expect(screen.getByRole('application').getAttribute('aria-label')).toMatch(/Drag the pad/);
  });
  it('closes the panel when stationId goes to null, and clears proximity on unmount', () => {
    const { rerender, unmount } = render(<ArenaApp stationId="tranquility-base" env={env} />);
    expect(useArena.getState().activeId).toBe('tranquility-base');
    rerender(<ArenaApp stationId={null} env={env} />);
    expect(useArena.getState().activeId).toBeNull();
    act(() => useArena.getState().setProximity('tranquility-base', 'tranquility-base'));
    unmount();
    expect(useArena.getState().nearId).toBeNull();
  });
});
