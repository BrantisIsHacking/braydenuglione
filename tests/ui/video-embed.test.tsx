import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoEmbed } from '../../src/ui/VideoEmbed';

const poster = { src: '/media/critics-choice/poster.webp', alt: 'Poster' };

describe('VideoEmbed', () => {
  it('shows poster and fallback link, no iframe before click', () => {
    const { container } = render(<VideoEmbed youtubeId="qGuouXZMmC4" poster={poster} title="Doc" />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('img', { name: 'Poster' })).toBeTruthy();
    const link = screen.getByRole('link', { name: /Watch on YouTube/ });
    expect(link.getAttribute('href')).toBe('https://www.youtube.com/watch?v=qGuouXZMmC4');
  });
  it('creates a nocookie iframe after clicking play', () => {
    const { container } = render(<VideoEmbed youtubeId="qGuouXZMmC4" poster={poster} title="Doc" />);
    fireEvent.click(screen.getByRole('button'));
    const f = container.querySelector('iframe');
    expect(f?.getAttribute('src')?.startsWith('https://www.youtube-nocookie.com/embed/qGuouXZMmC4')).toBe(true);
    expect(document.activeElement).toBe(f);
  });
});
