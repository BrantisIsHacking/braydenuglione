import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ExhibitContent } from '../../src/ui/ExhibitContent';
import { CollectionList, sortBooks, filterBooks } from '../../src/ui/CollectionList';
import { exhibits, profile } from '../../src/content';
import type { Book } from '../../src/content/types';

const books: Book[] = [
  { title: 'The Odyssey', author: 'Homer' },
  { title: 'Zed', author: 'Z' },
  { title: 'Fav Two', author: 'B', favorite: true },
  { title: 'Fav One', author: 'A', favorite: true },
  { title: '1984', author: 'George Orwell' },
  { title: 'Animal Farm', author: 'George Orwell' },
  { title: 'A Tale', author: 'Dickens' },
];

describe('books helpers', () => {
  it('sorts favorites first in source order then by title ignoring articles', () => {
    const t = sortBooks(books).map((b) => b.title);
    expect(t.slice(0, 2)).toEqual(['Fav Two', 'Fav One']);
    expect(t.slice(2)).toEqual(['1984', 'Animal Farm', 'The Odyssey', 'A Tale', 'Zed']);
  });
  it('filters by title or author, trimmed', () => {
    expect(filterBooks(books, 'orwell').map((b) => b.title).sort()).toEqual(['1984', 'Animal Farm']);
    expect(filterBooks(books, '  ')).toHaveLength(books.length);
  });
});

describe('CollectionList', () => {
  it('books: favorite star is hidden from AT and announced as text', () => {
    const { container } = render(<CollectionList id="books" items={books} />);
    expect(container.querySelector('.collection__fav [aria-hidden="true"]')).toHaveTextContent('★');
    expect(container.querySelector('.collection__fav .sr-only')).toHaveTextContent('Favorite:');
    expect(container.querySelector('[aria-label="Favorite"]')).toBeNull();
  });
  it('books: count, filter, focus stays in the input while typing m/e/w', () => {
    const many = Array.from({ length: 75 }, (_, i) => ({ title: `Book ${i}`, author: 'X' }));
    render(<CollectionList id="books" items={many} />);
    const input = screen.getByRole('searchbox', { name: 'Filter books' });
    expect(screen.getByRole('status')).toHaveTextContent('75 of 75');
    input.focus();
    let v = '';
    for (const k of ['m', 'e', 'w']) {
      fireEvent.keyDown(input, { key: k });
      v += k;
      fireEvent.change(input, { target: { value: v } });
      fireEvent.keyUp(input, { key: k });
      expect(document.activeElement).toBe(input);
    }
    expect(input).toHaveValue('mew');
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByRole('status')).toHaveTextContent('0 of 75');
  });
  it('films: ordered list in owner order, no images', () => {
    const films = Array.from({ length: 12 }, (_, i) => ({ title: `F${i}`, year: 2000 + i }));
    const { container } = render(<CollectionList id="films" items={films} />);
    const lis = container.querySelectorAll('ol > li');
    expect(lis).toHaveLength(12);
    expect(lis[0]).toHaveTextContent('F0 (2000)');
    expect(container.querySelector('img')).toBeNull();
  });
  it('games, artists and teams render without images', () => {
    const g = render(<CollectionList id="games" items={[{ title: 'A', note: 'n' }]} />);
    expect(g.container.querySelector('ul li')).toHaveTextContent('A — n');
    const a = render(<CollectionList id="artists" items={['X', 'Y']} />);
    expect(a.container.querySelectorAll('ol > li')).toHaveLength(2);
    const t = render(<CollectionList id="teams" items={[{ name: 'T1', sport: 'hockey' }, { name: 'T2', sport: 'soccer' }]} />);
    expect(t.container.querySelectorAll('h4')).toHaveLength(2);
    expect(t.container.querySelector('img')).toBeNull();
  });
});

describe('ExhibitContent', () => {
  it('contact shows mailto and profile links', () => {
    const e = exhibits.find((x) => x.type === 'contact')!;
    render(<ExhibitContent exhibit={e} headingLevel={2} />);
    expect(screen.getByRole('link', { name: profile.email })).toHaveAttribute('href', `mailto:${profile.email}`);
    const list = screen.getByRole('list', { name: 'Profiles' });
    expect(within(list).getAllByRole('link')).toHaveLength(3);
  });
  it('banner shows issuer and year', () => {
    const e = exhibits.find((x) => x.type === 'banner')!;
    if (e.type !== 'banner') throw new Error('type');
    render(<ExhibitContent exhibit={e} headingLevel={3} />);
    expect(screen.getByText(`${e.banner.issuer} · ${e.banner.year}`)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: e.title })).toBeInTheDocument();
  });
  it('station renders the station heading', () => {
    const e = exhibits.find((x) => x.type === 'station')!;
    render(<ExhibitContent exhibit={e} headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: e.title })).toBeInTheDocument();
  });
  it('interest link opens safely', () => {
    const e = exhibits.find((x) => x.type === 'interest' && x.interest.link)!;
    if (e.type !== 'interest') throw new Error('type');
    render(<ExhibitContent exhibit={e} headingLevel={2} />);
    const a = screen.getByRole('link', { name: e.interest.link!.label });
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
