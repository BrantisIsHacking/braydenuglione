import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { createWorldStore } from '../../src/world/store';
import { MapDialog } from '../../src/world/ui/MapDialog';

function setup() {
  const store = createWorldStore(null);
  const onTravel = vi.fn();
  render(
    <>
      <button data-world-focus tabIndex={-1}>
        world
      </button>
      <MapDialog store={store} onTravel={onTravel} />
    </>,
  );
  act(() => store.getState().openMap());
  return { store, onTravel };
}

describe('MapDialog', () => {
  it('renders nothing while closed', () => {
    const store = createWorldStore(null);
    render(<MapDialog store={store} onTravel={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('lists 4 districts and 18 buildings', () => {
    setup();
    const d = screen.getByRole('dialog');
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument();
    const secs = d.querySelectorAll('section');
    expect(secs).toHaveLength(4);
    expect(Array.from(secs).map((s) => s.querySelector('h3')!.textContent)).toEqual([
      'Town Square', 'Career District', 'Culture Row', 'Sports Side',
    ]);
    expect(d.querySelectorAll('.world-map__building')).toHaveLength(18);
  });
  it('lists only home exhibits (Workshop has 5, no oculogica mirror)', () => {
    setup();
    const li = screen.getByRole('button', { name: 'The Workshop' }).closest('li')!;
    expect(within(li).getAllByRole('button')).toHaveLength(6);
    expect(within(li).queryByRole('button', { name: /oculogica/i })).toBeNull();
  });
  it('travels to a building and closes', () => {
    const { store, onTravel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Library' }));
    expect(onTravel).toHaveBeenCalledWith('#/b/library');
    expect(store.getState().mapOpen).toBe(false);
  });
  it('overlay goes to the box score, exhibit to its hash', () => {
    const { onTravel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Scouting Office' }));
    expect(onTravel).toHaveBeenLastCalledWith('#/box-score');
    act(() => {});
  });
  it('exhibit button travels to #id', () => {
    const { onTravel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Chess' }));
    expect(onTravel).toHaveBeenCalledWith('#chess');
  });
  it('focuses Close, wraps Tab both ways, Esc closes and returns focus', () => {
    const { store } = setup();
    const close = screen.getByRole('button', { name: 'Close map' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    const all = screen.getByRole('dialog').querySelectorAll<HTMLElement>('button');
    expect(all[all.length - 1]).toHaveFocus();
    fireEvent.keyDown(all[all.length - 1], { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(store.getState().mapOpen).toBe(false);
    expect(document.querySelector('[data-world-focus]')).toHaveFocus();
  });
  it('RF4: pressing m inside the map neither closes nor reopens it', () => {
    const { store } = setup();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Close map' }), { key: 'm' });
    fireEvent.keyDown(window, { key: 'm' });
    expect(store.getState().mapOpen).toBe(true);
  });
});
