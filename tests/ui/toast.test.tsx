import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createWorldStore } from '../../src/world/store';
import { Toast } from '../../src/world/ui/Toast';

afterEach(() => vi.useRealTimers());

describe('Toast', () => {
  it('shows the message and disappears after 4 s', () => {
    vi.useFakeTimers();
    const store = createWorldStore(null);
    render(<Toast store={store} />);
    expect(screen.queryByRole('status')).toBeNull();
    act(() => store.getState().showToast("Couldn't open this building"));
    expect(screen.getByRole('status')).toHaveTextContent("Couldn't open this building");
    act(() => void vi.advanceTimersByTime(3900));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(200));
    expect(screen.queryByRole('status')).toBeNull();
    expect(store.getState().toast).toBeNull();
  });
});
