import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createArenaStore } from '../../src/arena/store';
import { Panel, FOCUSABLE } from '../../src/arena/ui/Panel';

function setup() {
  const store = createArenaStore(null);
  render(
    <>
      <button data-arena-focus tabIndex={-1}>
        arena
      </button>
      <Panel store={store} />
    </>,
  );
  act(() => store.getState().openPanel('tranquility-base'));
  return store;
}

describe('Panel', () => {
  it('renders dialog with title and focuses Close', () => {
    setup();
    const d = screen.getByRole('dialog');
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { level: 2, name: 'Tranquility Base' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close panel' })).toHaveFocus();
  });
  it('Esc closes', () => {
    const store = setup();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(store.getState().activeId).toBeNull();
  });
  it('traps Tab', () => {
    setup();
    const d = screen.getByRole('dialog');
    const f = Array.from(d.querySelectorAll<HTMLElement>(FOCUSABLE));
    const last = f[f.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Close panel' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Close panel' }), { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });
  it('arrow/page keys scroll the body when Close is focused', () => {
    setup();
    const body = document.querySelector('.arena-panel__body') as HTMLElement;
    Object.defineProperty(body, 'clientHeight', { value: 100, configurable: true });
    body.scrollTop = 0;
    const e = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(body.scrollTop).toBe(80);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }));
    expect(body.scrollTop).toBe(170);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(body.scrollTop).toBe(90);
  });
  it('returns focus to arena on close', () => {
    const store = setup();
    act(() => store.getState().closePanel());
    expect(document.querySelector('[data-arena-focus]')).toHaveFocus();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('backdrop click closes', () => {
    const store = setup();
    const bd = screen.getByTestId('panel-backdrop');
    fireEvent.mouseDown(bd);
    fireEvent.click(bd);
    expect(store.getState().activeId).toBeNull();
  });
});

describe('Panel backdrop', () => {
  it('drag from dialog onto backdrop does not close', () => {
    const store = setup();
    const bd = screen.getByTestId('panel-backdrop');
    fireEvent.mouseDown(screen.getByRole('dialog'));
    fireEvent.click(bd);
    expect(store.getState().activeId).not.toBeNull();
  });
  it('press and click on backdrop closes', () => {
    const store = setup();
    const bd = screen.getByTestId('panel-backdrop');
    fireEvent.mouseDown(bd);
    fireEvent.click(bd);
    expect(store.getState().activeId).toBeNull();
  });
});
