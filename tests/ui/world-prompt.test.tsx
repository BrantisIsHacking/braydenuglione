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
