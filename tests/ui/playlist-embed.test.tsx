import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlaylistEmbed } from '../../src/ui/PlaylistEmbed';
import { ExhibitContent } from '../../src/ui/ExhibitContent';
import { getExhibit } from '../../src/content';

const ID = '0CMrxtb1wc9P83qlrvmJ3o';

describe('PlaylistEmbed', () => {
  it('shows a Play button, the open link and the note; no iframe before the click', () => {
    const { container } = render(<PlaylistEmbed spotifyId={ID} name="Frission" blurb="My whole music taste" />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('button', { name: 'Play Frission' })).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Open in Spotify' });
    expect(link.getAttribute('href')).toBe(`https://open.spotify.com/playlist/${ID}`);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByText(/logged into Spotify/)).toBeTruthy();
    expect(screen.getByText(/30-second previews/)).toBeTruthy();
  });
  it('creates the official embed iframe only after the click', () => {
    const { container } = render(<PlaylistEmbed spotifyId={ID} name="Frission" blurb="x" />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Frission' }));
    const f = container.querySelector('iframe')!;
    expect(f.getAttribute('src')).toBe(`https://open.spotify.com/embed/playlist/${ID}`);
    expect(f.getAttribute('title')).toBe('Frission \u2014 Spotify playlist');
    expect(f.getAttribute('loading')).toBe('lazy');
    expect(f.getAttribute('height')).toBe('352');
    expect(f.getAttribute('allow')).toBe('autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
    expect(document.activeElement).toBe(f);
    expect(screen.queryByRole('button', { name: 'Play Frission' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Open in Spotify' })).toBeTruthy();
  });
  it('the frission exhibit renders it through ExhibitContent', () => {
    const e = getExhibit('frission')!;
    const { container } = render(<ExhibitContent exhibit={e} headingLevel={2} />);
    expect(container.querySelector('h2')?.textContent).toBe('Frission');
    expect(container.textContent).toContain('My whole music taste');
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('button', { name: 'Play Frission' })).toBeTruthy();
  });
});
