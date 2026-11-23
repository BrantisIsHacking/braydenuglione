import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createWorldStore } from '../../src/world/store';
import { Panel, FOCUSABLE } from '../../src/world/ui/Panel';

function setup() {
  const store = createWorldStore(null);
  render(
    <>
      <button data-world-focus tabIndex={-1}>
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
    const body = document.querySelector('.world-panel__body') as HTMLElement;
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
    expect(document.querySelector('[data-world-focus]')).toHaveFocus();
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

describe('Panel exhibits', () => {
  it('books renders the filter; typing keys does not scroll, open the map, or block Esc', () => {
    const store = setup();
    act(() => store.getState().openPanel('books'));
    const input = document.querySelector('input') as HTMLInputElement;
    input.focus();
    const body = document.querySelector('.world-panel__body') as HTMLElement;
    body.scrollTop = 0;
    for (const key of ['m', 'e', 'w', ' ', 'ArrowDown', 'PageDown']) {
      const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      input.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(false);
    }
    expect(body.scrollTop).toBe(0);
    expect(store.getState().mapOpen).toBe(false);
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(store.getState().activeId).toBeNull();
    expect(document.querySelector('[data-world-focus]')).toHaveFocus();
  });
  it('renders tranquility-base heading and labels the dialog by title', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Tranquility Base' })).toBeInTheDocument();
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
