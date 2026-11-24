import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createWorldStore } from '../../src/world/store';
import { Hud } from '../../src/world/ui/Hud';
import { Prompt } from '../../src/world/ui/Prompt';
import { Joystick } from '../../src/world/ui/Joystick';
import { liveInput, resetLiveInput } from '../../src/world/liveInput';

describe('Hud', () => {
  it('orders skip link, Scouting Office, Map, then status', () => {
    const store = createWorldStore(null);
    render(<Hud store={store} />);
    const tabbable = Array.from(document.querySelectorAll<HTMLElement>('a[href],button')).map((e) => e.textContent);
    expect(tabbable).toEqual(['Skip to box score', 'Scouting Office', 'Map']);
    expect(screen.getByRole('link', { name: 'Skip to box score' })).toHaveAttribute('href', '#/box-score');
    expect(screen.getByText('Exhibits visited 0/45')).toBeInTheDocument();
    expect(screen.getByText("Brayden's World")).toBeInTheDocument();
  });
  it('shows the building name in an interior', () => {
    const store = createWorldStore(null);
    store.setState({ scene: { kind: 'interior', id: 'workshop' } });
    render(<Hud store={store} />);
    expect(screen.getByText('The Workshop')).toBeInTheDocument();
  });
  it('Scouting Office and Map call props, else defaults', () => {
    const store = createWorldStore(null);
    const so = vi.fn();
    const m = vi.fn();
    const { unmount } = render(<Hud store={store} onScoutingOffice={so} onMap={m} />);
    fireEvent.click(screen.getByRole('button', { name: 'Scouting Office' }));
    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(so).toHaveBeenCalledTimes(1);
    expect(m).toHaveBeenCalledTimes(1);
    unmount();
    render(<Hud store={store} />);
    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(store.getState().mapOpen).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Scouting Office' }));
    expect(window.location.hash).toBe('#/box-score');
  });
});

describe('Prompt', () => {
  it('desktop/touch text, hides when panel open, click opens', () => {
    const store = createWorldStore(null);
    act(() => store.getState().setProximity('tranquility-base', 'tranquility-base'));
    const { rerender } = render(<Prompt touch={false} store={store} />);
    const p = screen.getByTestId('prompt');
    expect(p).toHaveTextContent('Press E — Tranquility Base');
    expect(p).toHaveAttribute('data-exhibit', 'tranquility-base');
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

describe('Hud floors and elevator prompt', () => {
  it('names the floor in a multi-floor building and announces politely', () => {
    const store = createWorldStore(null);
    store.setState({ scene: { kind: 'interior', id: 'hq-tower', floor: 3 } });
    render(<Hud store={store} />);
    expect(screen.getByText('HQ Tower · Floor 3')).toHaveAttribute('aria-live', 'polite');
  });
  it('the elevator pad prompt opens the dialog', () => {
    const store = createWorldStore(null);
    act(() => store.getState().setPad('elevator'));
    render(<Prompt touch={false} store={store} />);
    expect(screen.getByTestId('prompt')).toHaveTextContent('Press E — Elevator');
    fireEvent.click(screen.getByTestId('prompt'));
    expect(store.getState().elevatorOpen).toBe(true);
  });
});
