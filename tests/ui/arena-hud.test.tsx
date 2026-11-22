import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createArenaStore } from '../../src/arena/store';
import { Hud } from '../../src/arena/ui/Hud';
import { Prompt } from '../../src/arena/ui/Prompt';
import { Joystick } from '../../src/arena/ui/Joystick';
import { liveInput, resetLiveInput } from '../../src/arena/liveInput';

describe('Hud', () => {
  it('shows season, count and skip link', () => {
    const store = createArenaStore(null);
    store.setState({ visited: ['a', 'b', 'c'] });
    render(<Hud store={store} />);
    expect(screen.queryByText(/^Season/)).toBeNull();
    act(() => store.getState().setProximity('tranquility-base', null));
    expect(screen.getByText('Season 2026–27')).toBeInTheDocument();
    expect(screen.getByText('Stations visited 3/24')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to box score' })).toHaveAttribute('href', '#/box-score');
  });
});

describe('Prompt', () => {
  it('desktop/touch text, hides when panel open, click opens', () => {
    const store = createArenaStore(null);
    act(() => store.getState().setProximity('tranquility-base', 'tranquility-base'));
    const { rerender } = render(<Prompt touch={false} store={store} />);
    const p = screen.getByTestId('prompt');
    expect(p).toHaveTextContent('Press E — Tranquility Base');
    expect(p).toHaveAttribute('data-station', 'tranquility-base');
    rerender(<Prompt touch store={store} />);
    expect(screen.getByTestId('prompt')).toHaveTextContent('Tap to open — Tranquility Base');
    fireEvent.click(screen.getByTestId('prompt'));
    expect(store.getState().activeId).toBe('tranquility-base');
    expect(screen.queryByTestId('prompt')).toBeNull();
  });
});

describe('Joystick', () => {
  if (typeof window.PointerEvent === 'undefined') {
    class PE extends MouseEvent {
      pointerId: number;
      constructor(t: string, i: PointerEventInit = {}) {
        super(t, i);
        this.pointerId = i.pointerId ?? 0;
      }
    }
    (window as any).PointerEvent = PE;
  }
  it('writes and resets liveInput.joy', () => {
    resetLiveInput();
    render(<Joystick />);
    const j = screen.getByTestId('joystick');
    expect(j).toHaveAttribute('aria-hidden', 'true');
    j.setPointerCapture = () => {};
    j.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON() {} }) as DOMRect;
    fireEvent.pointerDown(j, { clientX: 100, clientY: 50, pointerId: 1 });
    expect(liveInput.joy.x).toBeGreaterThan(0.9);
    fireEvent.pointerUp(j, { pointerId: 1 });
    expect(liveInput.joy).toEqual({ x: 0, y: 0 });
  });
});
