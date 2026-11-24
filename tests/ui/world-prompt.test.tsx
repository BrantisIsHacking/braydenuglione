import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createWorldStore } from '../../src/world/store';
import { Prompt } from '../../src/world/ui/Prompt';

describe('Prompt', () => {
  it('names the nearest exhibit, including non-station exhibits', () => {
    const store = createWorldStore(null);
    render(<Prompt touch={false} store={store} />);
    expect(screen.queryByTestId('prompt')).toBeNull();
    act(() => store.getState().setProximity('books', 'books'));
    const p = screen.getByTestId('prompt');
    expect(p).toHaveTextContent('Press E — Books');
    expect(p).toHaveAttribute('data-exhibit', 'books');
  });
});

describe('Prompt / InteractButton on the elevator pad', () => {
  it('shows the elevator prompt and touch button, and opens the dialog', () => {
    const store = createWorldStore(null);
    act(() => store.getState().setPad('elevator'));
    const { unmount } = render(<Prompt touch store={store} />);
    expect(screen.getByTestId('prompt')).toHaveTextContent('Tap to open — Elevator');
    unmount();
    render(<InteractButton store={store} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open the elevator' }));
    expect(store.getState().elevatorOpen).toBe(true);
  });
});
import { fireEvent } from '@testing-library/react';
import { InteractButton } from '../../src/world/ui/InteractButton';

describe('Prompt / InteractButton with a collection focus', () => {
  it('names the item, and the click opens the panel on it', () => {
    const store = createWorldStore(null);
    act(() => store.getState().setProximity('games', 'games', 'Halo'));
    const { unmount } = render(<Prompt touch={false} store={store} />);
    expect(screen.getByTestId('prompt')).toHaveTextContent('Press E — Arcade cabinets: Halo');
    unmount();
    const r2 = render(<Prompt touch store={store} />);
    expect(screen.getByTestId('prompt')).toHaveTextContent('Tap to open — Arcade cabinets: Halo');
    r2.unmount();
    render(<InteractButton store={store} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Arcade cabinets: Halo' }));
    expect(store.getState().activeFocus).toBe('Halo');
  });
});
