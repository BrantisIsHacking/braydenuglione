import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createWorldStore } from '../../src/world/store';
import { ElevatorDialog } from '../../src/world/ui/ElevatorDialog';

function setup(floor: number | undefined = undefined) {
  const store = createWorldStore(null);
  store.setState({ scene: floor === undefined ? { kind: 'interior', id: 'hq-tower' } : { kind: 'interior', id: 'hq-tower', floor } });
  const onRide = vi.fn();
  render(
    <>
      <button data-world-focus tabIndex={-1}>
        world
      </button>
      <ElevatorDialog store={store} onRide={onRide} />
    </>,
  );
  return { store, onRide };
}

describe('ElevatorDialog', () => {
  it('renders nothing while closed', () => {
    setup();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('lists floors 4 to 1 with their exhibits, marks and focuses the current floor', () => {
    const { store } = setup();
    act(() => store.getState().openElevator());
    const d = screen.getByRole('dialog', { name: 'Elevator' });
    const floors = Array.from(d.querySelectorAll<HTMLElement>('.world-elevator__floor'));
    expect(floors.map((b) => b.textContent)).toEqual([
      expect.stringMatching(/^Floor 4: AI lab.*AI Fellow/),
      expect.stringMatching(/^Floor 3: Med-ML lab.*Machine Learning Research Intern/),
      expect.stringMatching(/^Floor 2: Coding dojo/),
      expect.stringMatching(/^Floor 1: IT server room/),
    ]);
    expect(floors[3]).toHaveAttribute('aria-current', 'true');
    expect(floors[3]).toHaveFocus();
  });
  it('clicking another floor rides once and closes', () => {
    const { store, onRide } = setup();
    act(() => store.getState().openElevator());
    fireEvent.click(screen.getByRole('button', { name: /^Floor 3/ }));
    expect(onRide).toHaveBeenCalledTimes(1);
    expect(onRide).toHaveBeenCalledWith(3);
    expect(store.getState().elevatorOpen).toBe(false);
  });
  it('the current floor and Escape close without riding', () => {
    const { store, onRide } = setup(2);
    act(() => store.getState().openElevator());
    fireEvent.click(screen.getByRole('button', { name: /^Floor 2/ }));
    expect(store.getState().elevatorOpen).toBe(false);
    act(() => store.getState().openElevator());
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(store.getState().elevatorOpen).toBe(false);
    expect(onRide).not.toHaveBeenCalled();
  });
  it('Up and Down go to the adjacent floor and are disabled at the ends', () => {
    const { store, onRide } = setup(2);
    act(() => store.getState().openElevator());
    fireEvent.click(screen.getByRole('button', { name: 'Up' }));
    expect(onRide).toHaveBeenLastCalledWith(3);
    act(() => store.getState().openElevator());
    fireEvent.click(screen.getByRole('button', { name: 'Down' }));
    expect(onRide).toHaveBeenLastCalledWith(1);
  });
  it('Down is disabled on floor 1, Up on floor 4', () => {
    const a = setup(1);
    act(() => a.store.getState().openElevator());
    expect(screen.getByRole('button', { name: 'Down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Up' })).toBeEnabled();
  });
  it('Up is disabled on floor 4', () => {
    const { store } = setup(4);
    act(() => store.getState().openElevator());
    expect(screen.getByRole('button', { name: 'Up' })).toBeDisabled();
  });
});
