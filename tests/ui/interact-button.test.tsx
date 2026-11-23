import { describe, expect, it } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { createWorldStore } from '../../src/world/store';
import { InteractButton } from '../../src/world/ui/InteractButton';

describe('InteractButton', () => {
  it('shows only when near an exhibit and no panel is open', () => {
    const store = createWorldStore(null);
    render(<InteractButton store={store} />);
    expect(screen.queryByRole('button')).toBeNull();
    act(() => store.getState().setProximity('tranquility-base', 'tranquility-base'));
    const b = screen.getByRole('button', { name: 'Open Tranquility Base' });
    fireEvent.click(b);
    expect(store.getState().activeId).toBe('tranquility-base');
    expect(screen.queryByRole('button')).toBeNull();
  });
});
