import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CollectionList, titleSortKey } from '../../src/ui/CollectionList';
import { Panel } from '../../src/world/ui/Panel';
import { createWorldStore } from '../../src/world/store';

const scroll = vi.fn();
beforeEach(() => {
  scroll.mockClear();
  Element.prototype.scrollIntoView = scroll;
});

describe('collection focus', () => {
  it('highlights exactly one item with aria-current and scrolls to it', () => {
    const { container } = render(<CollectionList id="games" focus="Halo" />);
    const cur = container.querySelectorAll('[aria-current="true"]');
    expect(cur).toHaveLength(1);
    expect(cur[0]).toHaveTextContent('Halo');
    expect(scroll).toHaveBeenCalledTimes(1);
  });
  it('a focus not in the list highlights nothing and does not throw', () => {
    const { container } = render(<CollectionList id="games" focus="Nope" />);
    expect(container.querySelector('[aria-current]')).toBeNull();
  });
  it('no focus (Box Score path) highlights nothing', () => {
    const { container } = render(<CollectionList id="teams" />);
    expect(container.querySelector('[aria-current]')).toBeNull();
  });
  it('works for films, artists and teams', () => {
    for (const [id, focus] of [['films', 'Cars'], ['artists', 'Tyler, The Creator'], ['teams', 'Manchester City']] as const) {
      const { container, unmount } = render(<CollectionList id={id} focus={focus} />);
      expect(container.querySelector('[aria-current="true"]')).toHaveTextContent(focus);
      unmount();
    }
  });
  it('a book hidden by the filter is shown when focused', () => {
    const { container, rerender } = render(<CollectionList id="books" />);
    fireEvent.change(screen.getByLabelText('Filter books'), { target: { value: 'xyz' } });
    expect(container.querySelectorAll('li')).toHaveLength(0);
    rerender(<CollectionList id="books" focus="1984" />);
    expect(screen.getByLabelText('Filter books')).toHaveValue('');
    expect(container.querySelector('[aria-current="true"]')).toHaveTextContent('1984');
    fireEvent.change(screen.getByLabelText('Filter books'), { target: { value: 'feed' } });
    expect(screen.getByLabelText('Filter books')).toHaveValue('feed');
  });
  it('titleSortKey drops a leading article', () => {
    expect(titleSortKey('The Hobbit')).toBe('hobbit');
  });
  it('the panel shows the focused item and forgets it on close', () => {
    const store = createWorldStore(null);
    render(<Panel store={store} />);
    act(() => store.getState().openPanel('games', 'Halo'));
    expect(screen.getByRole('dialog').querySelector('[aria-current="true"]')).toHaveTextContent('Halo');
    act(() => store.getState().closePanel());
    act(() => store.getState().openPanel('games'));
    expect(screen.getByRole('dialog').querySelector('[aria-current]')).toBeNull();
  });
});
